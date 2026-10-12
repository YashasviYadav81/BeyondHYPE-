"""
Build data/beyond_hype.db from data/Beyond_HYPE_Final_Dataset.json.
The JSON stays the source of truth; IDs are generated here.
Run:  python seed.py
"""
import json
import re
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path

BASE = Path(__file__).parent
JSON_PATH = BASE / "data" / "Beyond_HYPE_Final_Dataset.json"
DB_PATH = BASE / "data" / "beyond_hype.db"
SCHEMA_PATH = BASE / "schema.sql"

# Free-text source mentions -> official name in dataset["sources"]
SOURCE_RULES = [
    (r"stack overflow", "Stack Overflow 2025 AI"),
    (r"github", "GitHub Octoverse 2025"),
    (r"\bwef\b|future of jobs", "WEF Future of Jobs 2025"),
    (r"amazon sde", "Amazon SDE India 2027"),
    (r"amazon data engineer", "Amazon Data Engineer India 2027"),
    (r"applied scientist", "Amazon Applied Scientist India 2027"),
    (r"amazon support", "Amazon Support Engineer India 2027"),
    (r"solutions architect", "Amazon Solutions Architect India"),
    (r"\btcs\b", "TCS AI Careers 2026"),
    (r"isc2", "ISC2 Workforce Study 2025"),
    (r"cncf", "CNCF Cloud Native Research"),
    (r"data center operations|\bdco\b", "Amazon Data Center Operations India"),
    (r"microsoft", "Microsoft Explore India"),
]

# learning-path capability name -> capability name it belongs to
PATH_ALIASES = {
    ("F1", "APIs & backend"): "APIs & backend systems",
    ("F1", "Testing/debugging"): "Testing & debugging",
    ("F1", "Cloud/deployment"): "Cloud & deployment",
    ("F2", "ML fundamentals"): "Machine learning",
    ("F2", "Statistics"): "Statistics & probability",
    ("F2", "MLOps"): "Deployment / MLOps",
    ("F2", "GenAI application"): "GenAI application engineering",
    ("F3", "Cloud data"): "Cloud data platforms",
    ("F4", "Networking"): "Networking fundamentals",
    ("F4", "Detection/response"): "Detection & response",
    ("F5", "Linux/networking"): "Linux & networking",
    ("F5", "Docker"): "Containers",
    ("F5", "AI infrastructure"): "AI infrastructure basics",
}

# company case -> primary field. REVIEW these choices yourselves.
CASE_FIELD = {
    ("Oracle", "Software/Cloud"): "F1",
    ("Oracle India", "Software/Cloud"): "F1",
    ("Amazon", "Corporate/Technology"): "F1",
    ("TCS", "IT Services"): "F1",
    ("TCS", "AI Services"): "F2",
    ("Amazon", "Software internships"): "F1",
    ("Amazon", "Data internships"): "F3",
    ("Amazon", "Applied Science internships"): "F2",
    ("Amazon", "Cloud/Infrastructure"): "F5",
}

TABLES = [
    "fields", "sources", "evidence", "industry_changes",
    "industry_change_evidence", "work_changes", "human_capabilities",
    "roles", "capabilities", "learning_paths", "company_cases",
]


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def canon_sources(text):
    low = (text or "").lower()
    found = []
    for pattern, name in SOURCE_RULES:
        if re.search(pattern, low) and name not in found:
            found.append(name)
    return found


def main():
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    accessed = data["metadata"].get("research_date")

    if DB_PATH.exists():
        DB_PATH.unlink()
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
    cur = conn.cursor()

    errors, warnings = [], []
    counters = defaultdict(int)

    def next_pos(table, field_id):
        counters[(table, field_id)] += 1
        return counters[(table, field_id)]

    # ---- fields
    for i, f in enumerate(data["fields"], start=1):
        cur.execute(
            "INSERT INTO fields (id, name, description, current_landscape,"
            " primary_evidence, overall_status, position) VALUES (?,?,?,?,?,?,?)",
            (f["field_id"], f["field_name"], f["description"],
             f["current_landscape"], f["primary_evidence"],
             f["overall_status"], i))

    # ---- sources
    source_id = {}
    for s in data["sources"]:
        cur.execute(
            "INSERT INTO sources (name, url, accessed_date) VALUES (?,?,?)",
            (s["source_name"], s["url"], accessed))
        source_id[s["source_name"]] = cur.lastrowid
    for _, name in SOURCE_RULES:
        if name not in source_id:
            errors.append(f"SOURCE_RULES name not in dataset sources: {name}")

    # ---- evidence
    evidence_by_source = defaultdict(list)
    for e in data["evidence"]:
        names = canon_sources(e["source"])
        sid = source_id.get(names[0]) if names else None
        if sid is None:
            warnings.append(f"evidence {e['evidence_id']}: "
                            f"source '{e['source']}' not matched to a source row")
        else:
            evidence_by_source[names[0]].append(e["evidence_id"])
        cur.execute(
            "INSERT INTO evidence (id, field_id, source_id, claim, finding,"
            " supports, does_not_prove, source, evidence_type, geography,"
            " status, year, url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (e["evidence_id"], e["field_id"], sid, e["claim"], e["finding"],
             e.get("supports"), e.get("does_not_prove"), e["source"],
             e.get("evidence_type"), e.get("geography"), e.get("status"),
             e.get("year"), e.get("url")))

    # ---- industry changes (+ evidence links)
    for c in data["industry_changes"]:
        cid = f"{c['field_id']}-IC{c['piece']}"
        cur.execute(
            "INSERT INTO industry_changes (id, field_id, position, change,"
            " what_is_happening, why_it_matters, status, source)"
            " VALUES (?,?,?,?,?,?,?,?)",
            (cid, c["field_id"], int(c["piece"]), c["change"],
             c["what_is_happening"], c["why_it_matters"], c["status"],
             c["source"]))
        linked = set()
        for name in canon_sources(c["source"]):
            linked.update(evidence_by_source.get(name, []))
        if not linked:
            warnings.append(f"{cid} ('{c['change']}') has NO evidence record "
                            f"for source '{c['source']}'")
        for ev_id in sorted(linked):
            cur.execute("INSERT INTO industry_change_evidence VALUES (?,?)",
                        (cid, ev_id))

    # ---- work changes
    for w in data["work_changes"]:
        cur.execute(
            "INSERT INTO work_changes (id, field_id, position, task, shift,"
            " mode, human_role) VALUES (?,?,?,?,?,?,?)",
            (f"{w['field_id']}-WC{w['item']}", w["field_id"], int(w["item"]),
             w["task"], w["shift"], w["mode"], w["human_role"]))

    # ---- human capabilities
    for h in data["human_capabilities"]:
        fid = h["field_id"]
        cur.execute(
            "INSERT INTO human_capabilities (id, field_id, position, capability,"
            " why_it_matters, work_mode, why_human) VALUES (?,?,?,?,?,?,?)",
            (f"{fid}-HC-{slug(h['capability'])}", fid, next_pos("hc", fid),
             h["capability"], h["why_it_matters"], h["work_mode"],
             h["why_human"]))

    # ---- roles
    for r in data["roles"]:
        fid = r["field_id"]
        cur.execute(
            "INSERT INTO roles (id, field_id, position, role, status,"
            " what_is_changing, key_shift, evidence) VALUES (?,?,?,?,?,?,?,?)",
            (f"{fid}-R-{slug(r['role'])}", fid, next_pos("role", fid),
             r["role"], r["status"], r["what_is_changing"], r["key_shift"],
             r["evidence"]))

    # ---- capabilities
    cap_id = {}
    for c in data["capabilities"]:
        fid = c["field_id"]
        cid = f"{fid}-C-{slug(c['capability'])}"
        cap_id[(fid, c["capability"])] = cid
        cur.execute(
            "INSERT INTO capabilities (id, field_id, position, capability,"
            " category, meaning, examples, priority, evidence)"
            " VALUES (?,?,?,?,?,?,?,?,?)",
            (cid, fid, next_pos("cap", fid), c["capability"], c["category"],
             c["meaning"], c["examples"], c["priority"], c["evidence"]))

    # ---- learning paths (linked to capabilities by ID)
    for lp in data["learning_paths"]:
        fid = lp["field_id"]
        name = PATH_ALIASES.get((fid, lp["capability"]), lp["capability"])
        cid = cap_id.get((fid, name))
        if cid is None:
            errors.append(f"learning path '{lp['capability']}' ({fid}) "
                          f"matches no capability")
            continue
        n = next_pos("lp", fid)
        cur.execute(
            "INSERT INTO learning_paths (id, field_id, capability_id, position,"
            " level, exercise, skills_built, next_step, industry_connection,"
            " evidence) VALUES (?,?,?,?,?,?,?,?,?,?)",
            (f"{fid}-LP{n}", fid, cid, n, lp["level"], lp["exercise"],
             lp["skills_built"], lp["next_step"], lp["industry_connection"],
             lp["evidence"]))

    # ---- company cases
    for c in data["company_cases"]:
        fid = CASE_FIELD.get((c["company"], c["area"]))
        if fid is None:
            warnings.append(f"company case {c['company']} / {c['area']}: "
                            f"no field mapping")
        cur.execute(
            "INSERT INTO company_cases (field_id, company, area, date,"
            " what_happened, what_students_should_notice, evidence_strength,"
            " source, url) VALUES (?,?,?,?,?,?,?,?,?)",
            (fid, c["company"], c["area"], c["date"], c["what_happened"],
             c["what_students_should_notice"], c["evidence_strength"],
             c["source"], c["url"]))

    # ---- finish
    if errors:
        conn.rollback()
        conn.close()
        DB_PATH.unlink(missing_ok=True)
        print("SEED FAILED:")
        for msg in errors:
            print("  ERROR:", msg)
        sys.exit(1)

    conn.commit()
    bad = conn.execute("PRAGMA foreign_key_check").fetchall()
    if bad:
        print("FOREIGN KEY PROBLEMS:", bad)
        sys.exit(1)

    print("Seed OK. Row counts:")
    for t in TABLES:
        n = conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        print(f"  {t:26s} {n}")

    no_path = conn.execute(
        "SELECT COUNT(*) FROM capabilities c LEFT JOIN learning_paths lp"
        " ON lp.capability_id = c.id WHERE lp.id IS NULL").fetchone()[0]
    print(f"\nCapabilities with no practice exercise yet: {no_path}")

    for fid, n in conn.execute(
            "SELECT field_id, COUNT(*) FROM evidence GROUP BY field_id"):
        if n < 3:
            warnings.append(f"{fid} has only {n} evidence record(s)")

    if warnings:
        print("\nContent warnings (your to-do list):")
        for w in warnings:
            print("  -", w)
    conn.close()


if __name__ == "__main__":
    main()