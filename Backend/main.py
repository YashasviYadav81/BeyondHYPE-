import json
from pathlib import Path

from flask import Flask, jsonify
from flask_cors import CORS

from routes import api

BASE = Path(__file__).parent

app = Flask(__name__)
CORS(app)
app.register_blueprint(api)            # new /api/... routes

# Old dataset, kept so the original routes below still work
with open(BASE / "data" / "Beyond_HYPE_Final_Dataset.json", "r", encoding="utf-8") as file:
    data = json.load(file)


def for_field(key, field_id):
    return [item for item in data[key] if item.get("field_id") == field_id]


@app.route("/")
def home():
    return "Beyond HYPE backend is running!"


@app.route("/data")
def get_data():
    return jsonify(data)


@app.route("/fields")
def get_fields():
    return jsonify(data["fields"])


@app.route("/fields/<field_id>")
def get_field(field_id):
    for field in data["fields"]:
        if field["field_id"] == field_id:
            return jsonify(field)
    return jsonify({"error": "Field not found"}), 404


@app.route("/fields/<field_id>/industry-changes")
def get_industry_changes(field_id):
    return jsonify(for_field("industry_changes", field_id))


@app.route("/fields/<field_id>/work-changes")
def get_work_changes(field_id):
    return jsonify(for_field("work_changes", field_id))


@app.route("/fields/<field_id>/human-capabilities")
def get_human_capabilities(field_id):
    return jsonify(for_field("human_capabilities", field_id))


@app.route("/fields/<field_id>/roles")
def get_roles(field_id):
    return jsonify(for_field("roles", field_id))


@app.route("/capabilities")
def get_capabilities():
    return jsonify(data["capabilities"])


@app.route("/learning-paths")
def get_learning_paths():
    return jsonify(data["learning_paths"])


@app.route("/fields/<field_id>/learning-paths")
def get_field_learning_paths(field_id):
    return jsonify(for_field("learning_paths", field_id))


@app.route("/company-cases")
def get_company_cases():
    return jsonify(data["company_cases"])


@app.route("/fields/<field_id>/company-cases")
def get_field_company_cases(field_id):
    return jsonify(for_field("company_cases", field_id))


@app.route("/evidence")
def get_evidence():
    return jsonify(data["evidence"])


@app.route("/fields/<field_id>/evidence")
def get_field_evidence(field_id):
    return jsonify(for_field("evidence", field_id))


if __name__ == "__main__":
    app.run(debug=True)