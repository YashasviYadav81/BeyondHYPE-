import sqlite3

from flask import Blueprint, jsonify

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


@api.route("/data")
def get_all_data():
    return jsonify(services.get_all())


@api.errorhandler(DatabaseMissing)
def database_missing(error):
    return jsonify({"error": "Database not found on the server"}), 500


@api.errorhandler(sqlite3.Error)
def database_error(error):
    return jsonify({"error": "Database error"}), 500