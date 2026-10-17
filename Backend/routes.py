import sqlite3

from flask import Blueprint, jsonify, request

import services
from db import DatabaseMissing

api = Blueprint("api", __name__, url_prefix="/api")


@api.route("/health")
def health():
    return jsonify(services.get_health())


@api.route("/fields")
def list_fields():
    return jsonify(services.get_fields())


@api.route("/fields/<field_id>")
def get_field(field_id):
    bundle = services.get_field_bundle(field_id)
    if bundle is None:
        return jsonify({"error": "Field not found"}), 404
    return jsonify(bundle)


@api.route("/fields/<field_id>/<resource>")
def get_field_resource(field_id, resource):
    if resource not in services.RESOURCES:
        return jsonify({"error": "Unknown resource"}), 404
    items = services.get_resource(field_id, resource)
    if items is None:
        return jsonify({"error": "Field not found"}), 404
    return jsonify(items)


@api.route("/hype-claims")
def list_hype_claims():
    return jsonify(services.list_hype_claims())


@api.route("/hype-claims/<claim_id>")
def get_hype_claim(claim_id):
    claim = services.get_hype_claim(claim_id)
    if claim is None:
        return jsonify({"error": "Claim not found"}), 404
    return jsonify(claim)


@api.route("/hype-check", methods=["POST"])
def hype_check():
    payload = request.get_json(silent=True) or {}
    text = payload.get("claim") if isinstance(payload, dict) else None
    if not isinstance(text, str):
        return jsonify({"error": 'Send JSON like {"claim": "..."}'}), 400
    text = text.strip()
    if not services.MIN_CLAIM <= len(text) <= services.MAX_CLAIM:
        return jsonify({"error": (f"A claim must be {services.MIN_CLAIM} to "
                                  f"{services.MAX_CLAIM} characters")}), 400
    return jsonify(services.check_claim(text))


@api.route("/search")
def search():
    q = (request.args.get("q") or "").strip()
    if not 2 <= len(q) <= 100:
        return jsonify({"error": "Search text must be 2 to 100 characters"}), 400

    level = request.args.get("level") or None
    if level and level not in services.LEVELS:
        return jsonify({"error": "Unknown level"}), 400

    kind = request.args.get("type") or None
    if kind and kind not in services.SEARCH_KINDS:
        return jsonify({"error": "Unknown type"}), 400

    field_id = request.args.get("field") or None
    if field_id and not services.field_exists(field_id):
        return jsonify({"error": "Unknown field"}), 400

    return jsonify(services.search(q, level, kind, field_id))


@api.route("/roles")
def list_roles():
    group = request.args.get("status") or None
    if group and group not in services.ROLE_GROUPS:
        return jsonify({"error": "Unknown status"}), 400
    field_id = request.args.get("field") or None
    if field_id and not services.field_exists(field_id):
        return jsonify({"error": "Unknown field"}), 400
    return jsonify(services.list_roles(group, field_id))


@api.route("/method")
def method():
    return jsonify(services.get_method())


@api.route("/data")
def get_all_data():
    return jsonify(services.get_all())


@api.errorhandler(DatabaseMissing)
def database_missing(error):
    return jsonify({"error": "Database not found on the server"}), 500


@api.errorhandler(sqlite3.Error)
def database_error(error):
    return jsonify({"error": "Database error"}), 500