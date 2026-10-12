from db import query

FIELD_COLUMNS = (
    "id AS field_id, name AS field_name, description,"
    " current_landscape, primary_evidence, overall_status"
)

LIST_KEYS = [
    "industry_changes", "work_changes", "human_capabilities", "roles",
    "capabilities", "learning_paths", "company_cases",
]


def get_health():
    return {"status": "ok",
            "fields": query("SELECT COUNT(*) AS n FROM fields")[0]["n"]}


def get_fields():
    return query(f"SELECT {FIELD_COLUMNS} FROM fields ORDER BY position")


def get_field_bundle(field_id):
    """Everything the frontend needs for one field, or None if unknown."""
    rows = query(f"SELECT {FIELD_COLUMNS} FROM fields WHERE id = ?", (field_id,))
    if not rows:
        return None

    industry_changes = query(
        "SELECT * FROM industry_changes WHERE field_id = ? ORDER BY position",
        (field_id,))
    links = query(
        "SELECT ice.industry_change_id AS cid, ice.evidence_id AS eid"
        " FROM industry_change_evidence ice"
        " JOIN industry_changes ic ON ic.id = ice.industry_change_id"
        " WHERE ic.field_id = ? ORDER BY ice.evidence_id", (field_id,))
    by_change = {}
    for link in links:
        by_change.setdefault(link["cid"], []).append(link["eid"])
    for change in industry_changes:
        change["evidence_ids"] = by_change.get(change["id"], [])

    evidence = query(
        "SELECT e.id AS evidence_id, e.field_id, e.claim, e.finding,"
        " e.supports, e.does_not_prove, e.source, e.evidence_type,"
        " e.geography, e.status, e.year, e.url, e.strength,"
        " s.name AS source_name, s.url AS source_url"
        " FROM evidence e LEFT JOIN sources s ON s.id = e.source_id"
        " WHERE e.field_id = ? OR e.id IN ("
        "   SELECT ice.evidence_id FROM industry_change_evidence ice"
        "   JOIN industry_changes ic ON ic.id = ice.industry_change_id"
        "   WHERE ic.field_id = ?)"
        " ORDER BY e.id", (field_id, field_id))

    learning_paths = query(
        "SELECT lp.id, lp.field_id, lp.capability_id, c.capability,"
        " lp.position, lp.level, lp.exercise, lp.skills_built,"
        " lp.next_step, lp.industry_connection, lp.evidence"
        " FROM learning_paths lp"
        " JOIN capabilities c ON c.id = lp.capability_id"
        " WHERE lp.field_id = ? ORDER BY lp.position", (field_id,))

    return {
        "field": rows[0],
        "industry_changes": industry_changes,
        "work_changes": query(
            "SELECT * FROM work_changes WHERE field_id = ? ORDER BY position",
            (field_id,)),
        "human_capabilities": query(
            "SELECT * FROM human_capabilities WHERE field_id = ?"
            " ORDER BY position", (field_id,)),
        "roles": query(
            "SELECT * FROM roles WHERE field_id = ? ORDER BY position",
            (field_id,)),
        "capabilities": query(
            "SELECT * FROM capabilities WHERE field_id = ? ORDER BY position",
            (field_id,)),
        "learning_paths": learning_paths,
        "evidence": evidence,
        "company_cases": query(
            "SELECT * FROM company_cases WHERE field_id = ?", (field_id,)),
    }


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