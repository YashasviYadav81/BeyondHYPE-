import json
import re

from db import query

FIELD_COLUMNS = (
    "id AS field_id, name AS field_name, description,"
    " current_landscape, primary_evidence, overall_status"
)

LIST_KEYS = [
    "industry_changes", "work_changes", "human_capabilities", "roles",
    "capabilities", "learning_paths", "tools", "projects", "roadmap",
    "company_cases",
]

# URL name -> key in the field bundle
RESOURCES = {
    "industry-changes": "industry_changes",
    "work-changes": "work_changes",
    "human-capabilities": "human_capabilities",
    "roles": "roles",
    "capabilities": "capabilities",
    "learning-paths": "learning_paths",
    "tools": "tools",
    "projects": "projects",
    "roadmap": "roadmap",
    "evidence": "evidence",
    "company-cases": "company_cases",
}


def get_health():
    return {"status": "ok",
            "fields": query("SELECT COUNT(*) AS n FROM fields")[0]["n"]}


def get_fields():
    return query(f"SELECT {FIELD_COLUMNS} FROM fields ORDER BY position")


def attach_evidence_ids(items, link_table, owner_column, owner_table, field_id):
    """Give every item the list of evidence IDs that back it."""
    links = query(
        f"SELECT l.{owner_column} AS owner_id, l.evidence_id AS eid"
        f" FROM {link_table} l JOIN {owner_table} o ON o.id = l.{owner_column}"
        f" WHERE o.field_id = ? ORDER BY l.evidence_id", (field_id,))
    by_owner = {}
    for link in links:
        by_owner.setdefault(link["owner_id"], []).append(link["eid"])
    for item in items:
        item["evidence_ids"] = by_owner.get(item["id"], [])


def get_field_bundle(field_id):
    """Everything the frontend needs for one field, or None if unknown."""
    rows = query(f"SELECT {FIELD_COLUMNS} FROM fields WHERE id = ?", (field_id,))
    if not rows:
        return None

    industry_changes = query(
        "SELECT * FROM industry_changes WHERE field_id = ? ORDER BY position",
        (field_id,))
    attach_evidence_ids(industry_changes, "industry_change_evidence",
                        "industry_change_id", "industry_changes", field_id)

    roles = query(
        "SELECT * FROM roles WHERE field_id = ? ORDER BY position", (field_id,))
    attach_evidence_ids(roles, "role_evidence", "role_id", "roles", field_id)

    capabilities = query(
        "SELECT * FROM capabilities WHERE field_id = ? ORDER BY position",
        (field_id,))
    attach_evidence_ids(capabilities, "capability_evidence", "capability_id",
                        "capabilities", field_id)

    # this field's own evidence + any evidence its claims, roles or capabilities link to
    evidence = query(
        "SELECT e.id AS evidence_id, e.field_id, e.claim, e.finding,"
        " e.supports, e.does_not_prove, e.source, e.evidence_type,"
        " e.geography, e.status, e.year, e.url, e.strength,"
        " s.name AS source_name, s.url AS source_url"
        " FROM evidence e LEFT JOIN sources s ON s.id = e.source_id"
        " WHERE e.field_id = ?"
        " OR e.id IN (SELECT l.evidence_id FROM industry_change_evidence l"
        "   JOIN industry_changes o ON o.id = l.industry_change_id"
        "   WHERE o.field_id = ?)"
        " OR e.id IN (SELECT l.evidence_id FROM role_evidence l"
        "   JOIN roles o ON o.id = l.role_id WHERE o.field_id = ?)"
        " OR e.id IN (SELECT l.evidence_id FROM capability_evidence l"
        "   JOIN capabilities o ON o.id = l.capability_id WHERE o.field_id = ?)"
        " ORDER BY e.id", (field_id, field_id, field_id, field_id))

    learning_paths = query(
        "SELECT lp.id, lp.field_id, lp.capability_id, c.capability,"
        " lp.position, lp.level, lp.exercise, lp.skills_built,"
        " lp.next_step, lp.industry_connection, lp.evidence"
        " FROM learning_paths lp"
        " JOIN capabilities c ON c.id = lp.capability_id"
        " WHERE lp.field_id = ? ORDER BY lp.position", (field_id,))

    roadmap = query(
        "SELECT * FROM roadmap_steps WHERE field_id = ? ORDER BY step_order",
        (field_id,))
    for step in roadmap:
        step["docs_links"] = json.loads(step["docs_links"] or "[]")

    return {
        "field": rows[0],
        "industry_changes": industry_changes,
        "work_changes": query(
            "SELECT * FROM work_changes WHERE field_id = ? ORDER BY position",
            (field_id,)),
        "human_capabilities": query(
            "SELECT * FROM human_capabilities WHERE field_id = ?"
            " ORDER BY position", (field_id,)),
        "roles": roles,
        "capabilities": capabilities,
        "learning_paths": learning_paths,
        "tools": query(
            "SELECT * FROM tools WHERE field_id = ? ORDER BY id", (field_id,)),
        "projects": query(
            "SELECT * FROM projects WHERE field_id = ? ORDER BY id", (field_id,)),
        "roadmap": roadmap,
        "evidence": evidence,
        "company_cases": query(
            "SELECT * FROM company_cases WHERE field_id = ?", (field_id,)),
    }


def get_resource(field_id, resource):
    """One list from the bundle, or None if the field or resource is unknown."""
    key = RESOURCES.get(resource)
    if key is None:
        return None
    bundle = get_field_bundle(field_id)
    return None if bundle is None else bundle[key]


def get_all():
    """Whole dataset in the same flat shape as the old /data route."""
    result = {"fields": []}
    for key in LIST_KEYS:
        result[key] = []
    evidence = {}
    for field in get_fields():
        bundle = get_field_bundle(field["field_id"])
        result["fields"].append(bundle["field"])
        for key in LIST_KEYS:
            result[key].extend(bundle[key])
        for item in bundle["evidence"]:
            evidence[item["evidence_id"]] = item
    result["evidence"] = list(evidence.values())
    return result


# ---------------- HYPE CHECK ----------------

MIN_CLAIM = 3
MAX_CLAIM = 200

STOP_WORDS = {
    "will", "with", "that", "this", "from", "have", "your", "about", "just",
    "every", "everything", "would", "could", "should", "need", "into", "more",
    "than", "then", "them", "they", "what", "when", "which", "their", "there",
}


def _words(text):
    """Lower-case words with punctuation removed."""
    return re.sub(r"[^a-z0-9 ]+", " ", (text or "").lower()).split()


def list_hype_claims():
    """Just the claims (no verdicts), for the clickable examples."""
    return query("SELECT id, claim FROM hype_claims ORDER BY id")


def get_hype_claim(claim_id):
    """One claim with its verdict, interpretation and linked evidence."""
    rows = query("SELECT * FROM hype_claims WHERE id = ?", (claim_id,))
    if not rows:
        return None
    claim = rows[0]
    claim["keywords"] = json.loads(claim["keywords"] or "[]")
    claim["evidence"] = query(
        "SELECT e.id AS evidence_id, e.claim, e.finding, e.does_not_prove,"
        " e.year, e.evidence_type, e.status, e.url, s.name AS source_name,"
        " s.url AS source_url"
        " FROM hype_claim_evidence h"
        " JOIN evidence e ON e.id = h.evidence_id"
        " LEFT JOIN sources s ON s.id = e.source_id"
        " WHERE h.hype_claim_id = ? ORDER BY e.id", (claim_id,))
    return claim


def _suggestions(words):
    """The reviewed claims that share the most words with the typed text."""
    wanted = {w for w in words if len(w) >= 4 and w not in STOP_WORDS}
    scored = []
    for row in query("SELECT id, claim, keywords FROM hype_claims ORDER BY id"):
        text = row["claim"] + " " + " ".join(json.loads(row["keywords"] or "[]"))
        overlap = len(wanted & set(_words(text)))
        scored.append((-overlap, row["id"], row["claim"]))
    scored.sort()
    return [{"id": i, "claim": c} for _, i, c in scored[:3]]


def check_claim(text):
    """Match typed text to a reviewed claim by keyword phrase.

    No match means we have not reviewed that claim, so we give no verdict.
    """
    words = _words(text)
    haystack = " " + " ".join(words) + " "

    best_id, best_score = None, 0
    for row in query("SELECT id, claim, keywords FROM hype_claims ORDER BY id"):
        phrases = json.loads(row["keywords"] or "[]") + [row["claim"]]
        for phrase in phrases:
            phrase_words = _words(phrase)
            if phrase_words and f" {' '.join(phrase_words)} " in haystack:
                if len(phrase_words) > best_score:
                    best_id, best_score = row["id"], len(phrase_words)

    if best_id:
        return {"matched": True, "claim": get_hype_claim(best_id)}

    return {
        "matched": False,
        "message": ("We have not reviewed evidence for this claim yet, so we "
                    "cannot say what the evidence shows. These reviewed claims "
                    "are the closest:"),
        "suggestions": _suggestions(words),
    }


# ---------------- SEARCH ----------------

LEVELS = {"Beginner", "Intermediate", "Advanced"}

# kind -> (table, title column, searched columns, snippet column, level column, puzzle piece)
SEARCH_SPECS = {
    "industry": ("industry_changes", "change",
                 ["change", "what_is_happening", "why_it_matters"],
                 "what_is_happening", None, 0),
    "work": ("work_changes", "task",
             ["task", "shift", "mode", "human_role"], "shift", None, 1),
    "human": ("human_capabilities", "capability",
              ["capability", "why_it_matters", "why_human"],
              "why_it_matters", None, 2),
    "role": ("roles", "role",
             ["role", "what_is_changing", "key_shift", "status"],
             "what_is_changing", None, 3),
    "capability": ("capabilities", "capability",
                   ["capability", "meaning", "examples", "category"],
                   "meaning", None, 4),
    "tool": ("tools", "technology",
             ["technology", "category", "why_it_matters", "learn_first",
              "suggested_project"], "why_it_matters", "level", 5),
    "project": ("projects", "title",
                ["title", "skills_practiced", "tools", "expected_outcome",
                 "what_to_demonstrate"], "expected_outcome", "difficulty", 6),
    "roadmap": ("roadmap_steps", "title",
                ["title", "category", "tools", "exercise", "next_step"],
                "exercise", "level", 7),
    # evidence records and their sources (click opens the source itself)
    "evidence": ("evidence", "claim",
                 ["claim", "finding", "supports", "source", "evidence_type"],
                 "finding", None, None),
}
URL_COLUMNS = {"evidence": "url"}      # kinds whose results carry a link
SEARCH_KINDS = set(SEARCH_SPECS) | {"hype"}
MAX_RESULTS = 40


def field_exists(field_id):
    return bool(query("SELECT 1 AS ok FROM fields WHERE id = ?", (field_id,)))


def _snippet(text, size=140):
    text = (text or "").strip()
    return text if len(text) <= size else text[:size].rstrip() + "..."


def search(q, level=None, kind=None, field_id=None):
    """Every word typed must appear somewhere in an item's text."""
    terms = [t for t in re.findall(r"[a-z0-9+#.]+", q.lower()) if len(t) >= 2][:5]
    if not terms:
        return {"query": q, "count": 0, "results": []}

    names = {f["field_id"]: f["field_name"] for f in get_fields()}
    results = []

    for name, (table, title, cols, snippet, level_col, piece) in SEARCH_SPECS.items():
        if kind and kind != name:
            continue
        if level and not level_col:
            continue                      # only items that have a level
        haystack = " || ' ' || ".join(f"COALESCE({c}, '')" for c in cols)
        where = " AND ".join(f"({haystack}) LIKE ?" for _ in terms)
        params = [f"%{t}%" for t in terms]
        if field_id:
            where += " AND field_id = ?"
            params.append(field_id)
        if level:
            where += f" AND {level_col} = ?"
            params.append(level)
        level_sql = level_col if level_col else "NULL"
        url_sql = URL_COLUMNS.get(name, "NULL")
        rows = query(
            f"SELECT id, field_id, {title} AS title, {snippet} AS snippet,"
            f" {level_sql} AS level, {url_sql} AS url"
            f" FROM {table} WHERE {where} ORDER BY id",
            tuple(params))
        for row in rows:
            results.append({
                "type": name, "id": row["id"], "title": row["title"],
                "snippet": _snippet(row["snippet"]), "field_id": row["field_id"],
                "field_name": names.get(row["field_id"], ""),
                "level": row["level"], "piece": piece, "url": row["url"],
            })

    # hype claims belong to no field and have no level
    if (not kind or kind == "hype") and not field_id and not level:
        haystack = ("COALESCE(claim, '') || ' ' || COALESCE(keywords, '')"
                    " || ' ' || COALESCE(interpretation, '')")
        where = " AND ".join(f"({haystack}) LIKE ?" for _ in terms)
        for row in query(
                f"SELECT id, claim, interpretation FROM hype_claims"
                f" WHERE {where} ORDER BY id", tuple(f"%{t}%" for t in terms)):
            results.append({
                "type": "hype", "id": row["id"], "title": row["claim"],
                "snippet": _snippet(row["interpretation"]), "field_id": None,
                "field_name": "", "level": None, "piece": None, "url": None,
            })

    results = results[:MAX_RESULTS]
    return {"query": q, "count": len(results), "results": results}


# ---------------- ROLES VIEW ----------------

ROLE_GROUPS = ["Emerging", "Specialized", "Evolving", "Established"]


def role_group(status):
    """Plain group for the free-text status the dataset uses."""
    text = (status or "").lower()
    if "emerging" in text:
        return "Emerging"
    if "special" in text:
        return "Specialized"
    if "established" in text:
        return "Established"
    return "Evolving"


def list_roles(group=None, field_id=None):
    names = {f["field_id"]: f["field_name"] for f in get_fields()}
    roles = []
    for row in query("SELECT * FROM roles ORDER BY field_id, position"):
        row["status_group"] = role_group(row["status"])
        row["field_name"] = names.get(row["field_id"], "")
        if group and row["status_group"] != group:
            continue
        if field_id and row["field_id"] != field_id:
            continue
        roles.append(row)
    return roles


# ---------------- METHOD (the four "Before we explore" cards) ----------------

def get_method():
    """Live numbers and examples behind Collect / Cross-check / Interpret / Translate."""

    # ---- Collect
    sources = query(
        "SELECT s.name, s.url, COUNT(e.id) AS evidence_count FROM sources s"
        " LEFT JOIN evidence e ON e.source_id = s.id GROUP BY s.id"
        " HAVING COUNT(e.id) > 0 ORDER BY evidence_count DESC, s.name")
    types = query(
        "SELECT COALESCE(NULLIF(TRIM(evidence_type), ''), 'Other') AS type,"
        " COUNT(*) AS count FROM evidence GROUP BY type ORDER BY count DESC, type")
    evidence_total = query("SELECT COUNT(*) AS n FROM evidence")[0]["n"]
    years = sorted(int(r["year"]) for r in query("SELECT year FROM evidence")
                   if str(r["year"] or "").isdigit())
    with_limit = query(
        "SELECT COUNT(*) AS n FROM evidence"
        " WHERE TRIM(COALESCE(does_not_prove, '')) != ''")[0]["n"]

    # ---- Cross-check: how many different sources stand behind each claim
    rows = query(
        "SELECT c.id, c.claim, e.id AS evidence_id, s.name AS source_name"
        " FROM hype_claims c"
        " LEFT JOIN hype_claim_evidence h ON h.hype_claim_id = c.id"
        " LEFT JOIN evidence e ON e.id = h.evidence_id"
        " LEFT JOIN sources s ON s.id = e.source_id ORDER BY c.id, e.id")
    claims = {}
    for row in rows:
        item = claims.setdefault(row["id"], {
            "id": row["id"], "claim": row["claim"], "evidence_ids": [], "sources": []})
        if row["evidence_id"]:
            item["evidence_ids"].append(row["evidence_id"])
        if row["source_name"] and row["source_name"] not in item["sources"]:
            item["sources"].append(row["source_name"])
    claim_list = []
    for item in claims.values():
        claim_list.append({
            "id": item["id"], "claim": item["claim"],
            "evidence_count": len(item["evidence_ids"]),
            "source_count": len(item["sources"]), "sources": item["sources"]})

    # ---- Interpret: one reviewed claim, split into its four parts
    interpret = None
    if claim_list:
        best = max(claim_list, key=lambda c: (c["evidence_count"], -ord(c["id"][-1])))
        detail = get_hype_claim(best["id"])
        interpret = {
            "claim": detail["claim"],
            "evidence": [{"finding": e["finding"], "source_name": e["source_name"],
                          "year": e["year"]} for e in detail["evidence"][:2]],
            "interpretation": detail["interpretation"],
            "limitation": detail["limitation"],
            "student_action": detail["student_action"]}

    # ---- Translate: what each field turns into, with one real linked example
    counts = []
    for field in query("SELECT id, name FROM fields ORDER BY position"):
        entry = {"field_id": field["id"], "field_name": field["name"]}
        for key, table in (("roles", "roles"), ("capabilities", "capabilities"),
                           ("tools", "tools"), ("projects", "projects"),
                           ("roadmap_steps", "roadmap_steps")):
            entry[key] = query(f"SELECT COUNT(*) AS n FROM {table} WHERE field_id = ?",
                               (field["id"],))[0]["n"]
        counts.append(entry)

    example = None
    for cap in query(
            "SELECT c.id, c.field_id, c.capability, c.evidence, f.name AS field_name"
            " FROM capabilities c JOIN fields f ON f.id = c.field_id"
            " ORDER BY f.position, c.position"):
        tool = query("SELECT technology FROM tools WHERE capability_id = ? ORDER BY id LIMIT 1", (cap["id"],))
        project = query("SELECT title FROM projects WHERE capability_id = ? ORDER BY id LIMIT 1", (cap["id"],))
        step = query("SELECT title, level FROM roadmap_steps WHERE capability_id = ? ORDER BY step_order LIMIT 1", (cap["id"],))
        if tool and project and step:
            example = {"field_id": cap["field_id"], "field_name": cap["field_name"],
                       "capability": cap["capability"], "evidence": cap["evidence"],
                       "tool": tool[0]["technology"], "project": project[0]["title"],
                       "roadmap_step": step[0]["title"], "level": step[0]["level"]}
            break

    return {
        "collect": {"source_count": len(sources), "evidence_count": evidence_total,
                    "sources": sources, "types": types,
                    "first_year": years[0] if years else None,
                    "last_year": years[-1] if years else None},
        "cross_check": {"claims": claim_list, "claims_total": len(claim_list),
                        "multi_source": sum(1 for c in claim_list if c["source_count"] >= 2),
                        "with_limitation": with_limit, "evidence_total": evidence_total},
        "interpret": interpret,
        "translate": {"fields": counts, "example": example},
    }