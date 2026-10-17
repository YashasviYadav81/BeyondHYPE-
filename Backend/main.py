import os

from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from routes import api
from security import init_security

# Websites allowed to call this API. For the deployed site, set the
# ALLOWED_ORIGINS environment variable, e.g.
#   ALLOWED_ORIGINS=https://beyond-hype.vercel.app
# (several addresses can be separated by commas).
LOCAL_ORIGINS = [
    f"http://{host}:{port}"
    for host in ("127.0.0.1", "localhost")
    for port in list(range(5500, 5511)) + [3000, 8000, 8080]
]


def allowed_origins():
    configured = [o.strip().rstrip("/")
                  for o in os.environ.get("ALLOWED_ORIGINS", "").split(",")
                  if o.strip()]
    return configured + LOCAL_ORIGINS


app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024          # requests are tiny: 10 KB max

CORS(app,
     resources={r"/api/*": {"origins": allowed_origins()}},
     methods=["GET", "POST", "OPTIONS"],
     max_age=600)

app.register_blueprint(api)
init_security(app)


@app.route("/")
def home():
    return jsonify({"name": "Beyond HYPE API", "status": "running",
                    "health": "/api/health"})


@app.errorhandler(HTTPException)
def http_error(error):
    """Short JSON errors instead of HTML pages."""
    return jsonify({"error": error.name}), error.code


@app.errorhandler(Exception)
def unexpected_error(error):
    """Log the details on the server, tell the visitor nothing sensitive."""
    app.logger.exception("Unexpected error")
    return jsonify({"error": "Something went wrong on the server"}), 500


if __name__ == "__main__":
    # Debug mode is OFF by default. To turn it on while developing:
    #   PowerShell:  $env:FLASK_DEBUG = "1"; python main.py
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1")