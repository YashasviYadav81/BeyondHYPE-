# Beyond HYPE

### *Less hype. More evidence. Clearer next steps.*

**An evidence-backed career map that shows students how AI is reshaping five tech domains, and what to build in response.**

Theme: **Open Source and Innovation**

---

## About the Project

Beyond HYPE is an interactive technology-industry intelligence platform that helps students understand how the technology industry is changing, which skills matter, and how to prepare for future opportunities.

Technology changes quickly, but students often struggle to connect what they learn in college with the skills, tools, and responsibilities expected in the industry. Beyond HYPE aims to bridge this gap by turning industry evidence into practical learning guidance.

Beyond HYPE connects:

**Industry change → work change → human capability → roles → capabilities → tools → projects → roadmap → evidence**

## Problem Statement

Students often struggle to identify relevant technologies, understand changing industry requirements, and decide which skills to develop during college.

Beyond HYPE aims to address this challenge by providing structured insights into technology trends, evolving professional roles, relevant skills, and practical learning opportunities.

## Why Open Source and Innovation

- **Open source:** Research data, sources, tools, projects, and roadmaps are maintained in structured JSON files. Anyone can correct a claim, add evidence, or propose a project through a pull request.
- **Innovation:** Connects industry facts and sources with affected roles and practical learning guidance, with every claim tied to a source and a "what this does not prove" note.

## Features

### 1. Industry Intelligence

- **Five fields:** Software Engineering, AI / ML, Data, Cybersecurity, Cloud & DevOps.
- **Eight-piece exploration system:** Industry, Work, Human Capability, Roles, Capabilities, Tools, Build, and Roadmap. Click a piece or step through with Next and Back.
- **See the evidence:** Every piece has a drawer with source, year, evidence type, what it shows, what it does not show, and a signal label (Established, Employer, Emerging).
- **Deep dive:** A longer view of each piece, including learning exercises, official documentation links, and project details.
- **Hype Check:** Pick one of 14 headline claims or type your own. Get a verdict (Supported, Partly supported, Not supported by our evidence), evidence, interpretation, limitation, and suggested action.
- **Roles view:** Explore roles from all fields, filtered by Emerging, Specialized, Evolving, or Established.
- **Search:** Find tools, projects, roles, roadmap steps, capabilities, evidence, and hype claims, filtered by level, field, and type.
- **Method cards:** Collect, Cross-check, Interpret, and Translate show the research process.
- **Big picture:** A short summary per field with concrete next steps (start here, learn first, build first).

### 2. Career Paths and Role-Specific Dashboards

Explore structured career paths for three technology roles:

- **Software Development Engineer (SDE)**
- **Machine Learning Engineer**
- **Data Engineer**

Each career dashboard provides:

- Role introduction and overview.
- Role snapshot and professional responsibilities.
- Industry evolution and changing work requirements.
- Skills and technologies relevant to the role.
- Structured learning roadmaps.
- Beginner-to-advanced learning progression.
- Interactive roadmap sections with explanations of technologies and concepts.
- Practical projects and project progression.
- Tools and learning resources.

The career paths connect role-specific knowledge with practical learning and project-building guidance.

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | HTML, CSS, JavaScript | Interactive user interface |
| Backend | Python, Flask, flask-cors | API and application logic |
| Database | SQLite | Structured research data |
| Data | JSON files | Research datasets and roadmaps |
| Frontend Hosting | Netlify | Static website deployment |
| Backend Hosting | Render | Flask API deployment |
| Production Server | gunicorn | Production server for Flask |

## Project Structure

```text
BeyondHYPE-/
├── README.md
├── Frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── career-paths.html
│   ├── career-paths.css
│   ├── career-paths.js
│   ├── career-detail.html
│   ├── career-detail.css
│   └── career-detail.js
└── Backend/
    ├── main.py
    ├── routes.py
    ├── services.py
    ├── db.py
    ├── security.py
    ├── schema.sql
    ├── seed.py
    ├── build_db.py
    ├── requirements.txt
    └── data/
        ├── Beyond_HYPE_Final_Dataset.json
        ├── extra_evidence.json
        ├── tools.json
        ├── projects.json
        ├── roadmap.json
        ├── hype_claims.json
        └── beyond_hype.db
```

## Getting Started

### Prerequisites

- Python 3.10 or newer
- Git
- A modern web browser

### 1. Clone the Repository

```bash
git clone https://github.com/YashasviYadav81/BeyondHYPE-.git
cd BeyondHYPE-
```

### 2. Start the Backend

```bash
cd Backend
python -m pip install -r requirements.txt
python build_db.py
python main.py
```

The API runs at:

`http://127.0.0.1:5000`

Check it at:

`http://127.0.0.1:5000/api/health`

### 3. Start the Frontend

In a second terminal:

```bash
cd Frontend
python -m http.server 8000
```

Open:

`http://localhost:8000`

Using a local server or VS Code Live Server is recommended. Opening `index.html` directly as a file can be blocked by the backend's CORS rules.

The frontend picks its API address automatically: `http://127.0.0.1:5000` when run locally, and `https://beyondhype.onrender.com` otherwise. To use your own deployment, change the URL near the top of `Frontend/script.js`.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/fields` | List the five fields |
| GET | `/api/fields/<field_id>` | Everything for one field |
| GET | `/api/fields/<field_id>/<resource>` | One resource list for a field |
| GET | `/api/hype-claims` | All checked claims |
| GET | `/api/hype-claims/<claim_id>` | One claim with its evidence |
| POST | `/api/hype-check` | Evaluate a technology claim |
| GET | `/api/search?q=` | Search platform resources |
| GET | `/api/roles` | Retrieve professional roles |
| GET | `/api/method` | Research methodology information |
| GET | `/api/data` | Full research dataset |

Field IDs: `F1` Software Engineering, `F2` AI / ML, `F3` Data, `F4` Cybersecurity, `F5` Cloud & DevOps.

## Configuration and Deployment

### Frontend — Netlify

The frontend is deployed separately as a static website using Netlify.

### Backend — Render

Suggested Render configuration:

- **Root directory:** `Backend`
- **Build command:** `pip install -r requirements.txt && python build_db.py`
- **Start command:** `gunicorn main:app`

Configuration variables:

| Variable | Purpose |
|---|---|
| `ALLOWED_ORIGINS` | Websites allowed to call the API, comma-separated |
| `TRUST_PROXY=1` | Set behind a proxy such as Render so rate limits use the real visitor address |
| `FLASK_DEBUG=1` | Debug mode for development only |

## Built-in Protection

- The website opens the database read-only, so visitors cannot change data.
- Rate limits: 30 requests/min on `/api/hype-check`, 60/min on `/api/search`, 300/min elsewhere.
- Request bodies are capped at 10 KB, and claim and search text lengths are checked.
- Errors return short JSON and never expose internals.
- Safe headers: `nosniff`, no referrer, no caching on API responses.
- The frontend escapes all text it displays and only opens HTTP(S) links.

## Limits

- Evidence is mostly surveys and single job postings. It does not measure hiring volumes, salaries, or future demand.
- Verdicts mean supported or not supported by our evidence, not a forecast of the whole market.
- Dataset research date: 2026-09-21. Check source URLs for newer data.
- The free Render tier may take a few seconds to wake after inactivity.

## Project Vision

Beyond HYPE encourages students to **look beyond trends, examine evidence, and make informed decisions** about their learning and careers.

**Explore the industry. Understand the roles. Build the skills. Go beyond the hype.**
