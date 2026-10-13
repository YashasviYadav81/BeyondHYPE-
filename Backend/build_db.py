"""
Build the complete database with ONE command:   python build_db.py

1. runs the original seed (dataset -> SQLite)
2. links roles and capabilities to their evidence
3. loads the optional content files in data/:
   tools.json, projects.json, roadmap.json, hype_claims.json
Missing content files are skipped. Mistakes in them are reported by name.
"""
import json
import sqlite3
import sys
from collections import defaultdict

import seed
from seed import BASE, DB_PATH, JSON_PATH, canon_sources, slug

VERDICTS = {"Supported", "Partly supported", "Not supported by our evidence"}


def load_optional(filename):
    path = BASE / "data" / filename
    if not path.exists():
        print(f"(skipped, file not found: data/{filename})")
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    seed.main()                       # stops with an error message if it fails

    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    cur = conn.cursor()
    errors, warnings = [], []

    field_ids = {r[0] for r in cur.execute("SELECT id FROM fields")}
    capability_ids = {r[0] for r in cur.execute("SELECT id FROM capabilities")}
    evidence_ids = {r[0] for r in cur.execute("SELECT id FROM evidence")}

    # ---- link roles + capabilities to evidence
    evidence_by_source = defaultdict(list)
    for ev_id, source_name in cur.execute(
            "SELECT e.id, s.name FROM evidence e"
            " JOIN sources s ON s.id = e.source_id"):
        evidence_by_source[source_name].append(ev_id)

    def link(table, column, owner_id, text):
        linked = set()
        for name in canon_sources(text):
            linked.update(evidence_by_source.get(name, []))
        for ev_id in sorted(linked):
            cur.execute(f"INSERT INTO {table} ({column}, evidence_id)"
                        f" VALUES (?,?)", (owner_id, ev_id))

    for r in data["roles"]:
        link("role_evidence", "role_id",
             f"{r['field_id']}-R-{slug(r['role'])}", r["evidence"])
    for c in data["capabilities"]:
        link("capability_evidence", "capability_id",
             f"{c['field_id']}-C-{slug(c['capability'])}", c["evidence"])

    # ---- helpers for the content files
    def refs_ok(kind, item):
        label = f"{kind} {item.get('id', '?')}"
        ok = True
        if item.get("field_id") not in field_ids:
            errors.append(f"{label}: unknown field_id {item.get('field_id')!r}")
            ok = False
        cap = item.get("capability_id")
        if cap and cap not in capability_ids:
            errors.append(f"{label}: unknown capability_id {cap!r}")
            ok = False
        return ok

    def insert(kind, item, sql, values):
        try:
            cur.execute(sql, values)
        except sqlite3.IntegrityError as problem:
            errors.append(f"{kind} {item.get('id', '?')}: {problem}")

    tools = load_optional("tools.json")
    projects = load_optional("projects.json")
    roadmap = load_optional("roadmap.json")
    claims = load_optional("hype_claims.json")

    project_ids = {p.get("id") for p in projects}
    roadmap_ids = {s.get("id") for s in roadmap}

    # ---- tools
    for t in tools:
        try:
            values = (t["id"], t["field_id"], t.get("capability_id"),
                      t["technology"], t.get("category"), t.get("level"),
                      t.get("why_it_matters"), t.get("learn_first"),
                      t.get("suggested_project"), t.get("docs_url"),
                      t.get("evidence"))
        except KeyError as missing:
            errors.append(f"tool {t.get('id', '?')}: missing field {missing}")
            continue
        if not str(t.get("docs_url") or "").startswith("http"):
            warnings.append(f"tool {t['id']}: docs_url is missing or not a link")
        if refs_ok("tool", t):
            insert("tool", t,
                   "INSERT INTO tools (id, field_id, capability_id, technology,"
                   " category, level, why_it_matters, learn_first,"
                   " suggested_project, docs_url, evidence)"
                   " VALUES (?,?,?,?,?,?,?,?,?,?,?)", values)

    # ---- projects
    for p in projects:
        try:
            values = (p["id"], p["field_id"], p.get("capability_id"), p["title"],
                      p.get("difficulty"), p.get("skills_practiced"),
                      p.get("tools"), p.get("expected_outcome"),
                      p.get("what_to_demonstrate"),
                      p.get("next_level_extension"))
        except KeyError as missing:
            errors.append(f"project {p.get('id', '?')}: missing field {missing}")
            continue
        if refs_ok("project", p):
            insert("project", p,
                   "INSERT INTO projects (id, field_id, capability_id, title,"
                   " difficulty, skills_practiced, tools, expected_outcome,"
                   " what_to_demonstrate, next_level_extension)"
                   " VALUES (?,?,?,?,?,?,?,?,?,?)", values)

    # ---- roadmap steps
    for s in sorted(roadmap,
                    key=lambda x: (x.get("field_id", ""), x.get("order", 0))):
        try:
            values = (s["id"], s["field_id"], s["order"], s["title"],
                      s.get("level"), s.get("category"),
                      s.get("prerequisite_id"), s.get("capability_id"),
                      s.get("tools"), s.get("exercise"), s.get("project_id"),
                      s.get("next_step"), s.get("estimated_effort"),
                      s.get("evidence"),
                      json.dumps(s.get("docs_links", [])))
        except KeyError as missing:
            errors.append(f"roadmap {s.get('id', '?')}: missing field {missing}")
            continue
        ok = refs_ok("roadmap", s)
        pre = s.get("prerequisite_id")
        if pre and pre not in roadmap_ids:
            errors.append(f"roadmap {s['id']}: unknown prerequisite_id {pre!r}")
            ok = False
        proj = s.get("project_id")
        if proj and proj not in project_ids:
            errors.append(f"roadmap {s['id']}: unknown project_id {proj!r}")
            ok = False
        if ok:
            insert("roadmap", s,
                   "INSERT INTO roadmap_steps (id, field_id, step_order, title,"
                   " level, category, prerequisite_id, capability_id, tools,"
                   " exercise, project_id, next_step, estimated_effort,"
                   " evidence, docs_links) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                   values)

    # ---- hype claims (+ evidence links)
    for h in claims:
        try:
            values = (h["id"], h["claim"], json.dumps(h.get("keywords", [])),
                      h["verdict"], h.get("interpretation"),
                      h.get("limitation"), h.get("student_action"))
        except KeyError as missing:
            errors.append(f"hype claim {h.get('id', '?')}: missing field {missing}")
            continue
        if h["verdict"] not in VERDICTS:
            errors.append(f"hype claim {h['id']}: verdict must be one of "
                          f"{sorted(VERDICTS)}")
            continue
        bad = [e for e in h.get("evidence_ids", []) if e not in evidence_ids]
        if bad:
            errors.append(f"hype claim {h['id']}: unknown evidence ids {bad}")
            continue
        if not h.get("evidence_ids"):
            warnings.append(f"hype claim {h['id']}: has no evidence_ids")
        insert("hype claim", h,
               "INSERT INTO hype_claims (id, claim, keywords, verdict,"
               " interpretation, limitation, student_action)"
               " VALUES (?,?,?,?,?,?,?)", values)
        for ev_id in h.get("evidence_ids", []):
            cur.execute("INSERT INTO hype_claim_evidence VALUES (?,?)",
                        (h["id"], ev_id))

    # ---- finish
    if errors:
        conn.rollback()
        conn.close()
        print("\nCONTENT PROBLEMS (fix these in your JSON files, then re-run):")
        for message in errors:
            print("  ERROR:", message)
        sys.exit(1)

    conn.commit()
    bad_keys = conn.execute("PRAGMA foreign_key_check").fetchall()
    if bad_keys:
        print("FOREIGN KEY PROBLEMS:", bad_keys)
        sys.exit(1)

    print("\nPhase 4 tables:")
    for table in ["role_evidence", "capability_evidence", "tools", "projects",
                  "roadmap_steps", "hype_claims", "hype_claim_evidence"]:
        n = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(f"  {table:22s} {n}")

    print("\nContent progress (targets: 5 tools, 3 projects, 6 roadmap steps per field):")
    for fid in sorted(field_ids):
        n = [conn.execute(f"SELECT COUNT(*) FROM {t} WHERE field_id = ?",
                          (fid,)).fetchone()[0]
             for t in ("tools", "projects", "roadmap_steps")]
        print(f"  {fid}: tools {n[0]}/5, projects {n[1]}/3, roadmap {n[2]}/6")
    n_claims = conn.execute("SELECT COUNT(*) FROM hype_claims").fetchone()[0]
    print(f"  hype claims: {n_claims}/10")

    if warnings:
        print("\nWarnings:")
        for w in warnings:
            print("  -", w)
    conn.close()


if __name__ == "__main__":
    main()