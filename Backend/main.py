from flask import Flask, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

# Load dataset
with open("data/Beyond_HYPE_Final_Dataset.json", "r", encoding="utf-8") as file:
    data = json.load(file)


# ---------------- HOME ----------------

@app.route("/")
def home():
    return "Beyond HYPE backend is running!"


# ---------------- COMPLETE DATA ----------------

@app.route("/data")
def get_data():
    return jsonify(data)


# ---------------- FIELDS ----------------

@app.route("/fields")
def get_fields():
    return jsonify(data["fields"])


@app.route("/fields/<field_id>")
def get_field(field_id):
    for field in data["fields"]:
        if field["field_id"] == field_id:
            return jsonify(field)

    return jsonify({"error": "Field not found"}), 404


# ---------------- INDUSTRY CHANGES ----------------

@app.route("/fields/<field_id>/industry-changes")
def get_industry_changes(field_id):
    changes = [
        change for change in data["industry_changes"]
        if change["field_id"] == field_id
    ]

    return jsonify(changes)


# ---------------- WORK CHANGES ----------------

@app.route("/fields/<field_id>/work-changes")
def get_work_changes(field_id):
    changes = [
        change for change in data["work_changes"]
        if change["field_id"] == field_id
    ]

    return jsonify(changes)


# ---------------- HUMAN CAPABILITIES ----------------

@app.route("/fields/<field_id>/human-capabilities")
def get_human_capabilities(field_id):
    capabilities = [
        capability for capability in data["human_capabilities"]
        if capability["field_id"] == field_id
    ]

    return jsonify(capabilities)


# ---------------- ROLES ----------------

@app.route("/fields/<field_id>/roles")
def get_roles(field_id):
    roles = [
        role for role in data["roles"]
        if role["field_id"] == field_id
    ]

    return jsonify(roles)


# ---------------- CAPABILITIES ----------------

@app.route("/capabilities")
def get_capabilities():
    return jsonify(data["capabilities"])


# ---------------- LEARNING PATHS ----------------

@app.route("/learning-paths")
def get_learning_paths():
    return jsonify(data["learning_paths"])


@app.route("/fields/<field_id>/learning-paths")
def get_field_learning_paths(field_id):
    paths = [
        path for path in data["learning_paths"]
        if path["field_id"] == field_id
    ]

    return jsonify(paths)


# ---------------- COMPANY CASES ----------------

@app.route("/company-cases")
def get_company_cases():
    return jsonify(data["company_cases"])


@app.route("/fields/<field_id>/company-cases")
def get_field_company_cases(field_id):
    cases = [
        case for case in data["company_cases"]
        if case["field_id"] == field_id
    ]

    return jsonify(cases)


# ---------------- EVIDENCE ----------------

@app.route("/evidence")
def get_evidence():
    return jsonify(data["evidence"])


@app.route("/fields/<field_id>/evidence")
def get_field_evidence(field_id):
    evidence = [
        item for item in data["evidence"]
        if item["field_id"] == field_id
    ]

    return jsonify(evidence)


# ---------------- RUN SERVER ----------------

if __name__ == "__main__":
    app.run(debug=True)