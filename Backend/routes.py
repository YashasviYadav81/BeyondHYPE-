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


@api.route("/data")
def get_all_data():
    return jsonify(services.get_all())


@api.errorhandler(DatabaseMissing)
def database_missing(error):
    return jsonify({"error": "Database not found on the server"}), 500


@api.errorhandler(sqlite3.Error)
def database_error(error):
    return jsonify({"error": "Database error"}), 500