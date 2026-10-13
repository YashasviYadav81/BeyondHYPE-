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
        " e.year, e.evidence_type, e.url, s.name AS source_name,"
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
                    "will not give a verdict. These reviewed claims are the "
                    "closest:"),
        "suggestions": _suggestions(words),
    }