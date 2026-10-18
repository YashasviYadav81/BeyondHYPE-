/* =========================================================
   BEYOND HYPE — frontend (reads the Flask + SQLite API)
   8 pieces: Industry, Work, Human, Roles, Capabilities,
             Tools, Build, Roadmap
========================================================= */

// Local development uses the local backend.
// After deployment, paste your Render URL where it says YOUR-BACKEND-URL.
const API =
    location.protocol === "file:" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "localhost"
        ? "http://127.0.0.1:5000"
        : "https://YOUR-BACKEND-URL";

const TOTAL_PIECES = 8;

let fieldData = {};
let currentField = "F1";
let currentPiece = 0;


/* ================= ELEMENTS ================= */

const fieldCards = document.querySelectorAll(".field-card");

const fieldNumber = document.getElementById("fieldNumber");
const fieldLabel = document.getElementById("fieldLabel");
const fieldTitle = document.getElementById("fieldTitle");
const fieldDescription = document.getElementById("fieldDescription");

const pieceCurrent = document.getElementById("pieceCurrent");
const pieceProgress = document.getElementById("pieceProgress");
const pieceStatus = document.getElementById("pieceStatus");
const pieceSource = document.getElementById("pieceSource");
const pieceTitle = document.getElementById("pieceTitle");
const piecePoints = document.getElementById("piecePoints");
const pieceMeaning = document.getElementById("pieceMeaning");

const evidenceToggle = document.getElementById("evidenceToggle");
const pieceEvidence = document.getElementById("pieceEvidence");
const evidenceSource = document.getElementById("evidenceSource");
const evidenceDate = document.getElementById("evidenceDate");
const evidenceType = document.getElementById("evidenceType");
const evidenceShows = document.getElementById("evidenceShows");
const evidenceDoesNot = document.getElementById("evidenceDoesNot");

const deepDiveToggle = document.getElementById("deepDiveToggle");
const deepDivePanel = document.getElementById("deepDivePanel");
const deepDiveLabel = document.getElementById("deepDiveLabel");
const deepDiveTitle = document.getElementById("deepDiveTitle");
const deepDiveIntro = document.getElementById("deepDiveIntro");
const deepDiveBody = document.getElementById("deepDiveBody");

const nextPiece = document.getElementById("nextPiece");

const bigTitle = document.getElementById("bigTitle");
const bigPoints = document.getElementById("bigPoints");

const takeawayTitle = document.getElementById("takeawayTitle");
const takeawayText = document.getElementById("takeawayText");


/* ================= FIELD ID <-> HTML KEY ================= */

const fieldKeys = {
    F1: "software",
    F2: "ai",
    F3: "data",
    F4: "cyber",
    F5: "cloud"
};

const keyToField = {
    software: "F1",
    ai: "F2",
    data: "F3",
    cyber: "F4",
    cloud: "F5"
};


/* ================= HELPERS ================= */

function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

function safeUrl(url) {
    return /^https?:\/\//i.test(url || "") ? url : "";
}

// Small label showing what kind of signal a piece of evidence is
function strengthClass(status) {
    const text = (status || "").toLowerCase();
    if (text.includes("employer")) return "strength-employer";
    if (text.includes("emerging")) return "strength-emerging";
    if (text.includes("established")) return "strength-established";
    return "strength-other";
}

function strengthBadge(status) {
    if (!status) return "";
    return `<span class="strength-badge ${strengthClass(status)}">${escapeHTML(status)}</span>`;
}

const STRENGTH_LEGEND =
    "Signal labels are ours. Established: reported by a major survey or report. " +
    "Employer: from one employer's posting or statement. " +
    "Emerging: early or preliminary evidence.";

/* ===== BACK BUTTON (created here, so index.html needs no change) ===== */

const prevPiece = document.createElement("button");
prevPiece.type = "button";
prevPiece.id = "prevPiece";
prevPiece.className = "prev-piece";
prevPiece.innerHTML = "<span>←</span> Back";

if (nextPiece && nextPiece.parentNode) {
    nextPiece.parentNode.insertBefore(prevPiece, nextPiece);
}

prevPiece.addEventListener("click", () => {
    if (currentPiece > 0) {
        currentPiece--;
        updatePuzzle();
    }
});

// Make a plain element behave like a button (mouse + keyboard)
function makeActivatable(element, handler, title) {
    if (!element) return;
    element.setAttribute("role", "button");
    element.tabIndex = 0;
    element.title = title;
    element.classList.add("pill-action");
    element.addEventListener("click", handler);
    element.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handler();
        }
    });
}

function openEvidenceDrawer() {
    pieceEvidence.classList.add("open");
    evidenceToggle.textContent = "Hide the evidence −";
    pieceEvidence.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function openDeepDivePanel() {
    deepDivePanel.classList.add("open");
    deepDiveToggle.textContent = "Close deep dive −";
    deepDivePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// The two pills above each piece now work:
//   status pill (e.g. ROLE LANDSCAPE)  -> opens the deep dive
//   source pill (e.g. sources used)    -> opens the evidence
makeActivatable(pieceSource, openEvidenceDrawer, "Click to see the evidence");
makeActivatable(pieceStatus, openDeepDivePanel, "Click for the deep dive");

/* ===== COLLAPSIBLE AREAS (Roles grid, Search results) ===== */

// Wrap an element so it can be folded away smoothly and opened again
function makeCollapsible(element) {
    const wrap = document.createElement("div");
    wrap.className = "collapse open";
    const inner = document.createElement("div");
    inner.className = "collapse-inner";
    element.parentNode.insertBefore(wrap, element);
    wrap.appendChild(inner);
    inner.appendChild(element);
    return wrap;
}

function setCollapse(wrap, button, open, label) {
    wrap.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
    button.textContent = open ? `Hide ${label} −` : `Show ${label} +`;
}

function setEvidenceOpen(open) {
    pieceEvidence.classList.toggle("open", open);
    evidenceToggle.textContent = open ? "Hide the evidence −" : "See the evidence +";
}

// one legend line inside the evidence drawer
if (pieceEvidence && !pieceEvidence.querySelector(".strength-legend")) {
    const legend = document.createElement("p");
    legend.className = "strength-legend";
    legend.textContent = STRENGTH_LEGEND;
    pieceEvidence.appendChild(legend);
}


/* ================= LOAD ONE FIELD FROM THE API (cached) ================= */

async function loadField(fieldId) {

    if (fieldData[fieldId]) return fieldData[fieldId];

    const response = await fetch(`${API}/api/fields/${fieldId}`);

    if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
    }

    const bundle = await response.json();

    fieldData[fieldId] = {
        info: bundle.field,
        industryChanges: bundle.industry_changes || [],
        workChanges: bundle.work_changes || [],
        humanCapabilities: bundle.human_capabilities || [],
        roles: bundle.roles || [],
        capabilities: bundle.capabilities || [],
        learningPaths: bundle.learning_paths || [],
        tools: bundle.tools || [],
        projects: bundle.projects || [],
        roadmap: bundle.roadmap || [],
        evidence: bundle.evidence || [],
        companyCases: bundle.company_cases || []
    };

    return fieldData[fieldId];
}


/* ================= LOADING + ERROR STATES ================= */

function showLoading() {
    fieldTitle.textContent = "Loading the evidence…";
    fieldDescription.textContent = "";
    piecePoints.innerHTML = '<div class="detail-point">Loading…</div>';
    pieceMeaning.innerHTML = "";
}

function showError(fieldId, error) {
    console.error("Could not load field:", error);
    fieldTitle.textContent = "Could not load this field.";
    fieldDescription.innerHTML =
        'Make sure the backend is running. ' +
        '<button type="button" class="evidence-toggle" id="retryField">Try again</button>';
    piecePoints.innerHTML = "";
    pieceMeaning.innerHTML = "";
    document.getElementById("retryField").onclick = () => updateField(fieldId);
}


/* ================= UPDATE FIELD ================= */

async function updateField(fieldId) {

    currentField = fieldId;
    currentPiece = 0;

    fieldCards.forEach(card => {
        card.classList.toggle(
            "active",
            card.dataset.field === fieldKeys[fieldId]
        );
    });

    showLoading();

    let data;

    try {
        data = await loadField(fieldId);
    } catch (error) {
        showError(fieldId, error);
        return;
    }

    if (currentField !== fieldId) return;   // user already clicked another field

    fieldNumber.textContent = fieldId.replace("F", "").padStart(2, "0");
    fieldLabel.textContent = data.info.field_name.toUpperCase();
    fieldTitle.innerHTML =
        `How is <span>${escapeHTML(data.info.field_name)}</span> changing?`;
    fieldDescription.textContent = data.info.description;

    updatePuzzle();
    updateBigPicture(data);
}


/* ================= THE EIGHT PUZZLE PIECES ================= */

function getPieces(data) {

    return [

        {
            type: "industry",
            status: "INDUSTRY CHANGE",
            title: "What's changing in the industry?",
            items: data.industryChanges,
            source:
                data.industryChanges[0]?.source ||
                data.info.primary_evidence
        },

        {
            type: "work",
            status: "WORK IS CHANGING",
            title: "How is the actual work changing?",
            items: data.workChanges,
            source: "Employer + industry evidence"
        },

        {
            type: "human",
            status: "HUMAN CAPABILITY",
            title: "What still requires human capability?",
            items: data.humanCapabilities,
            source: "Industry evidence"
        },

        {
            type: "roles",
            status: "ROLE LANDSCAPE",
            title: "How are roles changing?",
            items: data.roles,
            source: "Employer + industry evidence"
        },

        {
            type: "capabilities",
            status: "BUILD THESE CAPABILITIES",
            title: "What capabilities should I develop?",
            items: data.capabilities,
            source: "Employer + industry evidence"
        },

        {
            type: "tools",
            status: "TOOLS TO LEARN",
            title: "Which tools support these capabilities?",
            items: data.tools,
            limit: 6,
            source: "Official documentation + capability evidence"
        },

        {
            type: "build",
            status: "LEARN BY BUILDING",
            title: "What should I build?",
            items: data.projects,
            source: "Exercises from our research dataset"
        },

        {
            type: "roadmap",
            status: "YOUR ROADMAP",
            title: "In what order should I learn it?",
            items: data.roadmap,
            limit: 6,
            source: "Our suggested order"
        }

    ];
}


/* ================= UPDATE PUZZLE ================= */

function updatePuzzle() {

    const data = fieldData[currentField];
    if (!data) return;

    const pieces = getPieces(data);
    const piece = pieces[currentPiece];
    if (!piece) return;

    pieceCurrent.textContent = String(currentPiece + 1).padStart(2, "0");
    pieceProgress.textContent = String(pieces.length).padStart(2, "0");

    pieceStatus.textContent = piece.status;
    pieceSource.textContent = piece.source;
    pieceTitle.textContent = piece.title;

    renderPieceContent(piece);
    updateEvidence(data, piece);
    updateDeepDive(data, piece);
    updatePuzzlePieces();
}


/* ================= RENDER PIECE CONTENT ================= */

const MAIN_TEXT = {
    industry: item => [item.change, item.what_is_happening],
    work: item => [item.task, item.shift],
    human: item => [item.capability, item.why_it_matters],
    roles: item => [item.role, item.what_is_changing],
    capabilities: item => [item.capability, item.meaning],
    tools: item => [
        item.technology,
        `${item.category} · ${item.level} — ${item.why_it_matters}`
    ],
    build: item => [
        item.title,
        `${item.difficulty}: ${item.expected_outcome}`
    ],
    roadmap: item => [
        item.title,
        `${item.level} · about ${item.estimated_effort} — ${item.exercise}`
    ]
};

function renderPieceContent(piece) {

    const items = piece.items.slice(0, piece.limit || 5);

    // empty state: a field or piece with no content yet
    if (!items.length) {
        piecePoints.innerHTML =
            '<div class="detail-point">Content for this piece is coming soon.</div>';
        pieceMeaning.innerHTML = "";
        return;
    }

    piecePoints.innerHTML = items.map((item, index) => {

        const [title, text] = MAIN_TEXT[piece.type](item);

        return `
            <div class="detail-point">
                <strong>${index + 1}. ${escapeHTML(title)}</strong>
                <span>${escapeHTML(text)}</span>
            </div>
        `;

    }).join("");

    pieceMeaning.innerHTML = items.map(item => {

        let text = "";

        if (piece.type === "industry") {
            text = escapeHTML(item.why_it_matters);
        }
        else if (piece.type === "work") {
            text = `<strong>Mode:</strong> ${escapeHTML(item.mode)}<br>
                    <strong>Human role:</strong> ${escapeHTML(item.human_role)}`;
        }
        else if (piece.type === "human") {
            text = `<strong>${escapeHTML(item.work_mode)}</strong> — ${escapeHTML(item.why_human)}`;
        }
        else if (piece.type === "roles") {
            text = `<strong>Key shift:</strong> ${escapeHTML(item.key_shift)}`;
        }
        else if (piece.type === "capabilities") {
            text = `<strong>Examples:</strong> ${escapeHTML(item.examples)}<br>
                    <strong>Priority:</strong> ${escapeHTML(item.priority)}`;
        }
        else if (piece.type === "tools") {
            text = `<strong>Learn first:</strong> ${escapeHTML(item.learn_first)}<br>
                    <strong>Suggested project:</strong> ${escapeHTML(item.suggested_project)}`;
        }
        else if (piece.type === "build") {
            text = `<strong>Skills:</strong> ${escapeHTML(item.skills_practiced)}<br>
                    <strong>Show:</strong> ${escapeHTML(item.what_to_demonstrate)}<br>
                    <strong>Next level:</strong> ${escapeHTML(item.next_level_extension)}`;
        }
        else if (piece.type === "roadmap") {
            text = `<strong>Next step:</strong> ${escapeHTML(item.next_step)}`;
        }

        return `<li>${text}</li>`;

    }).join("");
}


/* ================= EVIDENCE (kept separate from interpretation) ================= */

// These pieces have evidence records linked directly to each item.
const LINKED_PIECES = ["industry", "roles", "capabilities"];

function updateEvidence(data, piece) {

    pieceEvidence.classList.remove("open");
    evidenceToggle.textContent = "See the evidence +";

    let records;
    let label = "";

    if (LINKED_PIECES.includes(piece.type)) {

        const ids = new Set(
            piece.items.slice(0, piece.limit || 5)
                .flatMap(item => item.evidence_ids || [])
        );
        records = data.evidence.filter(item => ids.has(item.evidence_id));

    } else {

        records = data.evidence.filter(
            item => item.field_id === data.info.field_id
        );

        label = (piece.type === "work" || piece.type === "human")
            ? "Interpretation (based on this field's evidence)"
            : "Recommendation (our suggestion, based on this field's evidence)";
    }

    if (!records.length) {
        evidenceSource.textContent = piece.source || "—";
        evidenceDate.textContent = "—";
        evidenceType.textContent = "No evidence record yet";
        evidenceShows.innerHTML =
            "<li>Evidence record not available for this piece.</li>";
        evidenceDoesNot.innerHTML =
            "<li>Do not treat this summary as a forecast.</li>";
        return;
    }

    const names = unique(records.map(r => r.source_name || r.source));

    // the pill above the piece names the real sources (click opens the evidence)
    pieceSource.textContent = label
        ? (piece.type === "work" || piece.type === "human"
            ? "Interpretation · field evidence"
            : "Recommendation · field evidence")
        : names.slice(0, 2).join(" · ") +
          (names.length > 2 ? ` +${names.length - 2} more` : "");

    evidenceSource.innerHTML = names.map(name => {
        const record = records.find(r => (r.source_name || r.source) === name);
        const url = safeUrl(record.url || record.source_url);
        return url
            ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener">${escapeHTML(name)}</a>`
            : escapeHTML(name);
    }).join("<br>");

    evidenceDate.textContent =
        unique(records.map(r => r.year)).join(", ") || "—";

    evidenceType.textContent = label ||
        unique(records.map(r => r.evidence_type)).join(", ") || "—";

    evidenceShows.innerHTML = records.slice(0, 6)
        .map(r => `<li>${escapeHTML(r.finding)} ${strengthBadge(r.status)}</li>`).join("");

    evidenceDoesNot.innerHTML = records.slice(0, 6)
        .map(r => `<li>${escapeHTML(r.does_not_prove || "Not enough evidence to make a broader claim.")}</li>`)
        .join("");
}


/* ================= DEEP DIVE ================= */

function para(text, label) {
    if (!text) return "";
    return `<p>${label ? `<strong>${label}:</strong> ` : ""}${escapeHTML(text)}</p>`;
}

function linkPara(label, url) {
    const safe = safeUrl(url);
    if (!safe) return "";
    return `<p><strong>${label}:</strong> <a href="${escapeHTML(safe)}" target="_blank" rel="noopener">${escapeHTML(safe)}</a></p>`;
}

function deepCard(title, paragraphs, small) {
    return `<div class="deep-dive-item">
                <strong>${escapeHTML(title)}</strong>
                ${paragraphs.join("")}
                ${small ? `<small>${escapeHTML(small)}</small>` : ""}
            </div>`;
}

function updateDeepDive(data, piece) {

    deepDivePanel.classList.remove("open");
    deepDiveToggle.textContent = "Deep dive →";
    deepDiveLabel.textContent = "DEEP DIVE";

    let title = "";
    let intro = "";
    let content = "";

    if (piece.type === "industry") {

        title = "Understand the industry change";
        intro = "Look at the evidence behind the shift and what it does — and does not — tell us.";

        content = data.industryChanges.map(item => deepCard(
            item.change,
            [para(item.what_is_happening), para(item.why_it_matters, "Why it matters")],
            item.status
        )).join("");

    }
    else if (piece.type === "work") {

        title = "Inside the changing workflow";
        intro = "The important question is not simply whether a task is automated, but what responsibility remains with the person doing the work.";

        content = data.workChanges.map(item => deepCard(
            item.task,
            [para(item.shift), para(item.mode, "Mode"), para(item.human_role, "Human role")]
        )).join("");

    }
    else if (piece.type === "human") {

        title = "What remains human-led";
        intro = "These capabilities are connected to judgment, context, accountability and interpretation.";

        content = data.humanCapabilities.map(item => deepCard(
            item.capability,
            [para(item.why_it_matters), para(item.why_human, "Why human")]
        )).join("");

    }
    else if (piece.type === "roles") {

        title = "Inside the role landscape";
        intro = "Roles are changing through shifts in responsibilities, tools and the capabilities employers expect.";

        content = data.roles.map(item => deepCard(
            item.role,
            [para(item.what_is_changing), para(item.key_shift, "Key shift")],
            item.status
        )).join("");

    }
    else if (piece.type === "capabilities") {

        title = "How to build these capabilities";
        intro = "These are not just technology names. They describe capabilities you can practise through projects and exercises.";

        content = data.capabilities.map(item => {

            // joined by ID, so no practice exercise goes missing
            const paths = data.learningPaths.filter(
                path => path.capability_id === item.id
            );

            return deepCard(item.capability, [
                para(item.meaning),
                para(item.examples, "Examples"),
                para(item.priority, "Priority"),
                ...paths.map(path => para(path.exercise, "Practice"))
            ]);

        }).join("");

    }
    else if (piece.type === "tools") {

        title = "The tools behind each capability";
        intro = "The capability evidence comes from our research. The choice of tool is our suggestion, so check the official documentation.";

        content = data.tools.map(item => deepCard(
            item.technology,
            [
                para(`${item.category} · ${item.level}`),
                para(item.why_it_matters, "Why it matters"),
                para(item.learn_first, "Learn first"),
                para(item.suggested_project, "Suggested project"),
                linkPara("Official docs", item.docs_url),
                para(item.evidence, "Source note")
            ]
        )).join("");

    }
    else if (piece.type === "build") {

        title = "Projects that prove the capability";
        intro = "Each project connects learning to something you can show: what you built and what you can explain about it.";

        content = data.projects.map(item => deepCard(
            item.title,
            [
                para(item.difficulty, "Difficulty"),
                para(item.skills_practiced, "Skills practised"),
                para(item.tools, "Tools"),
                para(item.expected_outcome, "Outcome"),
                para(item.what_to_demonstrate, "What to demonstrate"),
                para(item.next_level_extension, "Next level")
            ]
        )).join("");

    }
    else if (piece.type === "roadmap") {

        title = "A step-by-step learning order";
        intro = "Learn the minimum foundation, build something, then move to the next capability. Effort estimates are rough planning guides.";

        content = data.roadmap.map(step => {

            const project = data.projects.find(p => p.id === step.project_id);

            return deepCard(
                `${step.step_order}. ${step.title}`,
                [
                    para(`${step.level} · ${step.category} · about ${step.estimated_effort}`),
                    para(step.exercise, "Exercise"),
                    para(step.tools, "Tools"),
                    para(project ? project.title : "", "Project"),
                    para(step.next_step, "Next step"),
                    ...(step.docs_links || []).map(url => linkPara("Docs", url)),
                    para(step.evidence, "Source note")
                ]
            );

        }).join("");

    }

    if (!content) {
        content = '<div class="deep-dive-item"><p>Content for this piece is coming soon.</p></div>';
    }

    deepDiveTitle.textContent = title;
    deepDiveIntro.textContent = intro;
    deepDiveBody.innerHTML = `<div class="deep-dive-list">${content}</div>`;
}


/* ================= BIG PICTURE ================= */

// The big picture: a short summary of the field plus concrete next steps
function firstBy(list, predicate) {
    return list.find(predicate) || list[0] || null;
}

function bigRow(label, text, action, piece, button) {
    return `
        <li class="bp-item">
            <div>
                <span class="bp-label">${escapeHTML(label)}</span>
                <span class="bp-text">${escapeHTML(text)}</span>
            </div>
            <button type="button" class="bp-action"
                    data-action="${escapeHTML(action)}"
                    data-piece="${escapeHTML(piece === null ? "" : piece)}">
                ${escapeHTML(button)} →
            </button>
        </li>`;
}

function updateBigPicture(data) {

    const info = data.info;

    bigTitle.textContent = info.current_landscape;

    // one small line of facts under the title
    let meta = document.getElementById("bigMeta");
    if (!meta) {
        meta = document.createElement("p");
        meta.id = "bigMeta";
        meta.className = "bp-meta";
        bigTitle.insertAdjacentElement("afterend", meta);
    }
    meta.innerHTML =
        `<span>Overall status: ${escapeHTML(info.overall_status)}</span>` +
        `<span>Main evidence: ${escapeHTML(info.primary_evidence)}</span>` +
        `<span>${data.roles.length} roles · ${data.capabilities.length} capabilities · ` +
        `${data.tools.length} tools · ${data.projects.length} projects · ` +
        `${data.roadmap.length} roadmap steps</span>`;

    // what to do next, taken from this field's own data
    const rows = [];

    const step = data.roadmap[0];
    if (step) {
        rows.push(bigRow(
            "START HERE",
            `Step 1 of ${data.roadmap.length}: ${step.title} (${step.level}, about ${step.estimated_effort})`,
            "piece", 7, "Open the roadmap"));
    }

    // the tool for the first roadmap step's capability (so the advice matches the roadmap)
    const tool = (step && data.tools.find(t => t.capability_id === step.capability_id)) ||
                 firstBy(data.tools, t => t.level === "Beginner");
    if (tool) {
        rows.push(bigRow(
            "LEARN FIRST",
            `${tool.technology}: ${tool.learn_first}`,
            "piece", 5, "See the tools"));
    }

    // the project attached to the earliest roadmap step that has one
    const projectStep = data.roadmap.find(r => r.project_id);
    const project = (projectStep && data.projects.find(p => p.id === projectStep.project_id)) ||
                    firstBy(data.projects, p => p.difficulty === "Beginner");
    if (project) {
        rows.push(bigRow(
            "BUILD FIRST",
            `${project.title} (${project.difficulty})`,
            "piece", 6, "See the projects"));
    }

    const role = firstBy(data.roles, r => /emerging/i.test(r.status));
    if (role) {
        const emerging = /emerging/i.test(role.status);
        rows.push(bigRow(
            emerging ? "ROLE TO WATCH" : "ROLE TO KNOW",
            `${role.role}: ${role.what_is_changing}`,
            "piece", 3, "See the roles"));
    }

    const sourceCount = unique(data.evidence.map(e => e.source_name || e.source)).length;
    if (data.evidence.length) {
        rows.push(bigRow(
            "CHECK THE EVIDENCE",
            `${data.evidence.length} evidence records from ${sourceCount} sources support this field.`,
            "evidence", null, "See the evidence"));
    }

    rows.push(bigRow(
        "NEXT",
        "Compare with another field.",
        "picker", null, "Choose a field"));

    bigPoints.innerHTML = rows.join("");

    takeawayTitle.innerHTML = `Understand the <span>change.</span>`;

    takeawayText.textContent =
        `The goal isn't to chase every new technology. Understand what is changing in ${info.field_name}, how the work is shifting, and which capabilities you can actually practise.`;
}

// one click handler for all the buttons in the big picture
bigPoints.addEventListener("click", async event => {

    const button = event.target.closest(".bp-action");
    if (!button) return;

    const action = button.dataset.action;

    if (action === "picker") {
        const picker = document.getElementById("explore");
        if (picker) picker.scrollIntoView({ behavior: "smooth" });
        return;
    }

    if (action === "evidence") {
        await openPiece(currentField, 0);
        if (fieldData[currentField]) setEvidenceOpen(true);
        return;
    }

    openPiece(currentField, Number(button.dataset.piece));
});


/* ================= PUZZLE PIECES VISUAL STATE ================= */

function updatePuzzlePieces() {

    const puzzlePieces = document.querySelectorAll(".puzzle-piece");

    puzzlePieces.forEach((element, index) => {

        element.classList.remove("active");
        element.classList.remove("done");

        if (index < currentPiece) element.classList.add("done");
        if (index === currentPiece) element.classList.add("active");

    });

    prevPiece.disabled = currentPiece === 0;

    if (currentPiece === TOTAL_PIECES - 1) {

        nextPiece.innerHTML = `View the big picture <span>↓</span>`;

        nextPiece.onclick = () => {
            document.getElementById("bigPicture")
                .scrollIntoView({ behavior: "smooth" });
        };

    } else {

        nextPiece.innerHTML = `Next piece <span>→</span>`;
        nextPiece.onclick = nextPieceHandler;

    }
}

function nextPieceHandler() {
    if (currentPiece < TOTAL_PIECES - 1) {
        currentPiece++;
        updatePuzzle();
    }
}


/* ================= PAGE LAYOUT ================= */

// Put the five field cards ("Explore the landscape") directly above the
// field content, so choosing a field and reading it happen in one place.
(function placeFieldPicker() {
    const picker = document.getElementById("explore");
    const content = document.getElementById("shifts");
    if (picker && content && content.previousElementSibling !== picker) {
        content.parentNode.insertBefore(picker, content);
    }
})();

// "Let's look at the evidence." in the hero scrolls to the evidence section.
// To point it somewhere else, change this id (for example "hypecheck").
const HERO_NOTE_TARGET = "method";

(function makeHeroNoteWork() {
    const note = document.querySelector(".hero-note");
    if (!note) return;
    makeActivatable(note, () => {
        const target = document.getElementById(HERO_NOTE_TARGET);
        if (target) target.scrollIntoView({ behavior: "smooth" });
    }, "Click to see how we use evidence");
})();


/* ================= EVENTS ================= */

fieldCards.forEach(card => {
    card.addEventListener("click", async () => {

        const fieldId = keyToField[card.dataset.field];
        if (!fieldId) return;

        // go straight to the field's content...
        const target = document.getElementById("shifts");
        if (target) target.scrollIntoView({ behavior: "smooth" });

        await updateField(fieldId);

        // ...with its evidence already open (the reader can hide it again)
        if (currentField === fieldId && fieldData[fieldId]) setEvidenceOpen(true);
    });
});

document.querySelectorAll(".puzzle-piece").forEach((tile, index) => {
    makeActivatable(tile, () => {
        if (fieldData[currentField]) {
            currentPiece = index;
            updatePuzzle();
        }
    }, `Go to piece ${index + 1}`);
});

evidenceToggle.addEventListener("click", () => {
    const isOpen = pieceEvidence.classList.toggle("open");
    evidenceToggle.textContent =
        isOpen ? "Hide the evidence −" : "See the evidence +";
});

deepDiveToggle.addEventListener("click", () => {
    const isOpen = deepDivePanel.classList.toggle("open");
    deepDiveToggle.textContent =
        isOpen ? "Close deep dive −" : "Deep dive →";
});


/* ================= INITIAL LOAD ================= */

updateField("F1");


/* ================= SCROLL REVEAL ================= */

const revealElements = document.querySelectorAll(
    ".field-card, .method-card, .emerging-item"
);

const observer = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.12 }
);

revealElements.forEach(element => {
    element.style.opacity = "0";
    element.style.transform = "translateY(20px)";
    element.style.transition = "opacity .6s ease, transform .6s ease";
    observer.observe(element);
});


/* =========================================================
   HYPE CHECK
   Pick or type a claim -> evidence, interpretation,
   limitation and recommendation. No verdict is given for
   claims we have not reviewed.
========================================================= */

const hypeInput = document.getElementById("hypeInput");
const hypeButton = document.getElementById("hypeButton");
const hypeChips = document.getElementById("hypeChips");
const hypeResult = document.getElementById("hypeResult");

function hypeMessage(text) {
    hypeResult.innerHTML =
        `<div class="hype-card-result"><p>${escapeHTML(text)}</p></div>`;
}

function renderHypeError(retry) {
    hypeResult.innerHTML =
        '<div class="hype-card-result">' +
        '<p>Could not reach the backend. Make sure it is running.</p>' +
        '<button type="button" class="evidence-toggle" id="hypeRetry">Try again</button>' +
        '</div>';
    document.getElementById("hypeRetry").onclick = retry;
}

function renderHypeMatch(claim) {

    const evidence = (claim.evidence || []).map(item => {

        const url = safeUrl(item.url || item.source_url);
        const name = item.source_name || "Source";
        const source = url
            ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener">${escapeHTML(name)}</a>`
            : escapeHTML(name);
        const year = item.year ? `, ${escapeHTML(item.year)}` : "";

        return `<li>${escapeHTML(item.finding)} <small>(${source}${year})</small> ${strengthBadge(item.status)}</li>`;

    }).join("");

    hypeResult.innerHTML = `
        <div class="hype-card-result">

            <div class="mini-label">THE CLAIM</div>
            <h3>${escapeHTML(claim.claim)}</h3>


            <div class="hype-columns">

                <div>
                    <div class="mini-label">EVIDENCE</div>
                    <ul>${evidence}</ul>
                    <p class="strength-legend">${escapeHTML(STRENGTH_LEGEND)}</p>
                </div>

                <div>
                    <div class="mini-label">INTERPRETATION</div>
                    <p>${escapeHTML(claim.interpretation)}</p>

                    <div class="mini-label">WHAT IT DOES NOT PROVE</div>
                    <p>${escapeHTML(claim.limitation)}</p>
                </div>

            </div>

            <div class="interpretation-box">
                <div class="mini-label">WHAT YOU COULD DO</div>
                <p>${escapeHTML(claim.student_action)}</p>
            </div>

        </div>
    `;
}

function renderHypeNoMatch(result) {

    const chips = (result.suggestions || []).map(item =>
        `<button type="button" class="hype-chip" data-claim-id="${escapeHTML(item.id)}">${escapeHTML(item.claim)}</button>`
    ).join("");

    hypeResult.innerHTML = `
        <div class="hype-card-result">
            <p>${escapeHTML(result.message)}</p>
            <div class="hype-chips">${chips}</div>
        </div>
    `;

    hypeResult.querySelectorAll(".hype-chip").forEach(button => {
        button.addEventListener("click", () =>
            loadHypeClaim(button.dataset.claimId));
    });
}

async function loadHypeClaim(id) {

    hypeMessage("Checking the evidence…");

    try {
        const response = await fetch(
            `${API}/api/hype-claims/${encodeURIComponent(id)}`
        );
        if (!response.ok) throw new Error(`Backend error: ${response.status}`);
        renderHypeMatch(await response.json());
    } catch (error) {
        console.error("Hype claim failed:", error);
        renderHypeError(() => loadHypeClaim(id));
    }
}

async function runHypeCheck(text) {

    const claim = (text || "").trim();

    if (claim.length < 3) {
        hypeMessage("Type at least a few words to check a claim.");
        return;
    }

    hypeInput.value = claim;
    hypeMessage("Checking the evidence…");

    try {

        const response = await fetch(`${API}/api/hype-check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ claim })
        });

        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            hypeMessage(body.error || "Could not check this claim.");
            return;
        }

        const result = await response.json();

        if (result.matched) renderHypeMatch(result.claim);
        else renderHypeNoMatch(result);

    } catch (error) {
        console.error("Hype check failed:", error);
        renderHypeError(() => runHypeCheck(claim));
    }
}

async function loadHypeChips() {

    try {
        const response = await fetch(`${API}/api/hype-claims`);
        if (!response.ok) return;
        const claims = await response.json();

        hypeChips.innerHTML = claims.map(item =>
            `<button type="button" class="hype-chip" data-claim-id="${escapeHTML(item.id)}">${escapeHTML(item.claim)}</button>`
        ).join("");

        hypeChips.querySelectorAll(".hype-chip").forEach(button => {
            button.addEventListener("click", () =>
                loadHypeClaim(button.dataset.claimId));
        });

    } catch (error) {
        console.error("Could not load the example claims:", error);
    }
}

// Only start if the Hype Check section exists in index.html
if (hypeInput && hypeButton && hypeChips && hypeResult) {

    hypeButton.addEventListener("click", () => runHypeCheck(hypeInput.value));

    hypeInput.addEventListener("keydown", event => {
        if (event.key === "Enter") runHypeCheck(hypeInput.value);
    });

    // The floating hype cards in the hero become clickable
    document.querySelectorAll(".hype-card").forEach(card => {

        card.setAttribute("role", "button");
        card.tabIndex = 0;

        const open = () => {
            document.getElementById("hypecheck")
                .scrollIntoView({ behavior: "smooth" });
            runHypeCheck(card.textContent);
        };

        card.addEventListener("click", open);
        card.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                open();
            }
        });
    });

    loadHypeChips();
}


/* =========================================================
   SEARCH
   Find tools, projects, roles, roadmap steps and more
   across all five fields, with level / field / type filters.
========================================================= */

const searchInput = document.getElementById("searchInput");
const searchLevel = document.getElementById("searchLevel");
const searchField = document.getElementById("searchField");
const searchType = document.getElementById("searchType");
const searchButton = document.getElementById("searchButton");
const searchResults = document.getElementById("searchResults");

// results can be folded away and opened again
let searchWrap = null;
let searchBar = null;
let searchToggle = null;
let searchCount = 0;

if (searchResults) {

    searchWrap = makeCollapsible(searchResults);

    searchBar = document.createElement("div");
    searchBar.className = "results-bar";
    searchBar.hidden = true;

    searchToggle = document.createElement("button");
    searchToggle.type = "button";
    searchToggle.className = "collapse-toggle";
    searchBar.appendChild(searchToggle);

    searchWrap.parentNode.insertBefore(searchBar, searchWrap);

    searchToggle.addEventListener("click", () => {
        setCollapse(searchWrap, searchToggle,
            !searchWrap.classList.contains("open"), `results (${searchCount})`);
    });
}

function showSearchBar(count) {
    if (!searchBar) return;
    searchCount = count;
    searchBar.hidden = false;
    setCollapse(searchWrap, searchToggle, true, `results (${count})`);
}

function hideSearchBar() {
    if (!searchBar) return;
    searchBar.hidden = true;
    searchWrap.classList.add("open");
}

const TYPE_LABELS = {
    industry: "Industry change",
    work: "Work change",
    human: "Human capability",
    role: "Role",
    capability: "Capability",
    tool: "Tool",
    project: "Project",
    roadmap: "Roadmap step",
    evidence: "Evidence",
    hype: "Hype claim"
};

// Jump to a field and one of its eight pieces
async function openPiece(fieldId, pieceIndex) {

    await updateField(fieldId);

    if (currentField !== fieldId || !fieldData[fieldId]) return;

    currentPiece = pieceIndex;
    updatePuzzle();

    document.getElementById("shifts")
        .scrollIntoView({ behavior: "smooth" });
}

function activeFilters() {
    const parts = [];
    [[searchLevel, "Level"], [searchField, "Field"], [searchType, "Type"]]
        .forEach(([select, label]) => {
            if (select && select.value) {
                parts.push(`${label}: ${select.options[select.selectedIndex].text}`);
            }
        });
    return parts;
}

function searchMessage(text) {
    hideSearchBar();
    searchResults.innerHTML =
        `<p class="search-summary">${escapeHTML(text)}</p>`;
}

function renderSearch(data) {

    if (!data.count) {

        hideSearchBar();

        const filters = activeFilters();

        if (filters.length) {
            searchResults.innerHTML =
                `<p class="search-summary">No results for "${escapeHTML(data.query)}" with ${escapeHTML(filters.join(", "))}. ` +
                'Filters are combined, so try removing one. ' +
                '<button type="button" class="evidence-toggle" id="searchClear">Clear filters</button></p>';
            document.getElementById("searchClear").onclick = () => {
                searchLevel.value = "";
                searchField.value = "";
                searchType.value = "";
                runSearch();
            };
        } else {
            searchMessage(`No results for "${data.query}". Try a shorter or different word.`);
        }
        return;
    }

    const items = data.results.map(item => {

        const meta = [
            TYPE_LABELS[item.type] || item.type,
            item.field_name,
            item.level
        ].filter(Boolean).join(" · ");

        return `
            <button type="button" class="search-result"
                    data-type="${escapeHTML(item.type)}"
                    data-id="${escapeHTML(item.id)}"
                    data-field="${escapeHTML(item.field_id || "")}"
                    data-piece="${escapeHTML(item.piece === null ? "" : item.piece)}"
                    data-url="${escapeHTML(item.url || "")}">
                <small>${escapeHTML(meta.toUpperCase())}</small>
                <strong>${escapeHTML(item.title)}</strong>
                <span>${escapeHTML(item.snippet)}</span>
            </button>
        `;

    }).join("");

    const plural = data.count === 1 ? "result" : "results";

    searchResults.innerHTML =
        `<p class="search-summary">${data.count} ${plural}</p>${items}`;

    showSearchBar(data.count);

    searchResults.querySelectorAll(".search-result").forEach(button => {

        button.addEventListener("click", () => {

            if (button.dataset.type === "hype") {
                if (hypeResult) {
                    document.getElementById("hypecheck")
                        .scrollIntoView({ behavior: "smooth" });
                    loadHypeClaim(button.dataset.id);
                }
                return;
            }

            if (button.dataset.type === "evidence" && safeUrl(button.dataset.url)) {
                window.open(button.dataset.url, "_blank", "noopener");
                return;
            }

            openPiece(button.dataset.field, Number(button.dataset.piece));
        });
    });
}

let searchTimer = null;
let searchRequest = 0;

async function runSearch() {

    clearTimeout(searchTimer);

    const q = searchInput.value.trim();

    if (q.length < 2) {
        searchMessage("Type at least two letters to search.");
        return;
    }

    const params = new URLSearchParams({ q });
    if (searchLevel.value) params.set("level", searchLevel.value);
    if (searchField.value) params.set("field", searchField.value);
    if (searchType.value) params.set("type", searchType.value);

    searchMessage("Searching…");

    const mine = ++searchRequest;

    try {

        const response = await fetch(`${API}/api/search?${params}`);

        if (mine !== searchRequest) return;      // a newer search is running

        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            searchMessage(body.error || "Search failed.");
            return;
        }

        const data = await response.json();

        if (mine !== searchRequest) return;

        renderSearch(data);

    } catch (error) {
        if (mine !== searchRequest) return;
        console.error("Search failed:", error);
        hideSearchBar();
        searchResults.innerHTML =
            '<p class="search-summary">Could not reach the backend. ' +
            'Make sure it is running. ' +
            '<button type="button" class="evidence-toggle" id="searchRetry">Try again</button></p>';
        document.getElementById("searchRetry").onclick = runSearch;
    }
}

// Only start if the Search section exists in index.html
if (searchInput && searchButton && searchResults) {

    searchButton.addEventListener("click", runSearch);

    searchInput.addEventListener("keydown", event => {
        if (event.key === "Enter") runSearch();
    });

    // search while typing (waits for a short pause)
    searchInput.addEventListener("input", () => {
        clearTimeout(searchTimer);
        if (searchInput.value.trim().length < 2) return;
        searchTimer = setTimeout(runSearch, 400);
    });

    [searchLevel, searchField, searchType].forEach(select => {
        if (select) {
            select.addEventListener("change", () => {
                if (searchInput.value.trim().length >= 2) runSearch();
            });
        }
    });
}



/* =========================================================
   ROLES VIEW
   Roles from all five fields, grouped by how our sources
   describe them (Emerging / Specialized / Evolving / Established).
========================================================= */

const rolesGrid = document.getElementById("rolesGrid");
const rolesFilter = document.getElementById("rolesFilter");
const rolesField = document.getElementById("rolesField");

let rolesGroup = "";
let rolesCount = 0;

// the roles grid can be folded away and opened again
let rolesWrap = null;
let rolesToggle = null;

if (rolesGrid) {

    rolesWrap = makeCollapsible(rolesGrid);

    rolesToggle = document.createElement("button");
    rolesToggle.type = "button";
    rolesToggle.className = "collapse-toggle";
    setCollapse(rolesWrap, rolesToggle, true, "roles");

    const controls = rolesFilter ? rolesFilter.parentNode : rolesWrap.parentNode;
    controls.appendChild(rolesToggle);

    rolesToggle.addEventListener("click", () => {
        setCollapse(rolesWrap, rolesToggle,
            !rolesWrap.classList.contains("open"),
            rolesCount ? `roles (${rolesCount})` : "roles");
    });
}

function expandRoles() {
    if (rolesWrap) {
        setCollapse(rolesWrap, rolesToggle, true,
            rolesCount ? `roles (${rolesCount})` : "roles");
    }
}

function roleCard(role) {

    const groupClass = role.status_group.toLowerCase();
    const label = role.status && role.status.toLowerCase() !== role.status_group.toLowerCase()
        ? `<small class="role-label">Our label: ${escapeHTML(role.status)}</small>`
        : "";

    return `
        <button type="button" class="role-card"
                data-field="${escapeHTML(role.field_id)}">
            <div class="role-top">
                <span class="role-category">${escapeHTML(role.field_name.toUpperCase())}</span>
                <span class="role-status ${escapeHTML(groupClass)}">${escapeHTML(role.status_group)}</span>
            </div>
            <h3>${escapeHTML(role.role)}</h3>
            <p class="role-change">${escapeHTML(role.what_is_changing)}</p>
            <p class="role-shift"><strong>Key shift:</strong> ${escapeHTML(role.key_shift)}</p>
            ${label}
        </button>
    `;
}

async function loadRoles() {

    rolesGrid.innerHTML = '<p class="search-summary">Loading roles…</p>';

    const params = new URLSearchParams();
    if (rolesGroup) params.set("status", rolesGroup);
    if (rolesField && rolesField.value) params.set("field", rolesField.value);

    try {

        const response = await fetch(`${API}/api/roles?${params}`);
        if (!response.ok) throw new Error(`Backend error: ${response.status}`);

        const roles = await response.json();

        if (!roles.length) {
            rolesGrid.innerHTML =
                '<p class="search-summary">No roles match these filters.</p>';
            return;
        }

        rolesGrid.innerHTML = roles.map(roleCard).join("");

        rolesCount = roles.length;
        expandRoles();

        rolesGrid.querySelectorAll(".role-card").forEach(card => {
            // open the Roles piece (04) of that field
            card.addEventListener("click", () => openPiece(card.dataset.field, 3));
        });

    } catch (error) {
        console.error("Could not load roles:", error);
        rolesGrid.innerHTML =
            '<p class="search-summary">Could not reach the backend. ' +
            'Make sure it is running. ' +
            '<button type="button" class="evidence-toggle" id="rolesRetry">Try again</button></p>';
        document.getElementById("rolesRetry").onclick = loadRoles;
    }
}

// Only start if the Roles section exists in index.html
if (rolesGrid && rolesFilter) {

    rolesFilter.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", () => {
            rolesGroup = button.dataset.status || "";
            rolesFilter.querySelectorAll("button").forEach(b =>
                b.classList.toggle("active", b === button));
            loadRoles();
        });
    });

    if (rolesField) rolesField.addEventListener("change", loadRoles);

    loadRoles();
}



/* =========================================================
   BEFORE WE EXPLORE: Collect / Cross-check / Interpret / Translate
   Click a card to see the real numbers and an example behind it.
========================================================= */

const methodGrid = document.querySelector(".evidence-method");

let methodData = null;
let methodActive = null;
let methodPanel = null;

const METHOD_KEYS = {
    "collect": "collect",
    "cross-check": "cross",
    "interpret": "interpret",
    "translate": "translate"
};

async function loadMethod() {
    if (methodData) return methodData;
    const response = await fetch(`${API}/api/method`);
    if (!response.ok) throw new Error(`Backend error: ${response.status}`);
    methodData = await response.json();
    return methodData;
}

function methodList(items) {
    return `<ul>${items.map(item => `<li>${item}</li>`).join("")}</ul>`;
}

function renderCollect(d) {

    const years = d.first_year
        ? (d.first_year === d.last_year ? ` from ${d.first_year}` : ` from ${d.first_year} to ${d.last_year}`)
        : "";

    const types = d.types.map(t =>
        `${escapeHTML(t.type)} <strong>${escapeHTML(t.count)}</strong>`);

    const sources = d.sources.map(src => {
        const url = safeUrl(src.url);
        const name = url
            ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener">${escapeHTML(src.name)}</a>`
            : escapeHTML(src.name);
        return `${name} <small>(${escapeHTML(src.evidence_count)} record${src.evidence_count === 1 ? "" : "s"})</small>`;
    });

    return `
        <div class="mini-label">COLLECT</div>
        <h3>What we have gathered so far</h3>
        <p class="method-lead">
            ${escapeHTML(d.evidence_count)} evidence records from
            ${escapeHTML(d.source_count)} sources${escapeHTML(years)}.
            Every record names its source, year and type.
        </p>
        <div class="method-columns">
            <div><div class="mini-label">BY TYPE</div>${methodList(types)}</div>
            <div><div class="mini-label">SOURCES</div>${methodList(sources)}</div>
        </div>
    `;
}

function renderCross(d) {

    const limitText = d.with_limitation === d.evidence_total
        ? `Every one of the ${escapeHTML(d.evidence_total)} evidence records also states what it does not prove.`
        : `${escapeHTML(d.with_limitation)} of ${escapeHTML(d.evidence_total)} evidence records also state what they do not prove.`;

    const claims = d.claims.map(c => {
        const sources = c.sources.length ? ` — ${escapeHTML(c.sources.join(", "))}` : "";
        return `<strong>${escapeHTML(c.claim)}</strong>: ` +
               `${escapeHTML(c.evidence_count)} record${c.evidence_count === 1 ? "" : "s"} ` +
               `from ${escapeHTML(c.source_count)} source${c.source_count === 1 ? "" : "s"}${sources}`;
    });

    return `
        <div class="mini-label">CROSS-CHECK</div>
        <h3>One source is a signal. Several are context.</h3>
        <p class="method-lead">
            ${escapeHTML(d.multi_source)} of ${escapeHTML(d.claims_total)} reviewed claims
            are checked against two or more different sources. ${limitText}
        </p>
        ${methodList(claims)}
    `;
}

function renderInterpret(d) {

    if (!d) return "<p>No reviewed claim yet.</p>";

    const evidence = methodList(d.evidence.map(e =>
        `${escapeHTML(e.finding)} <small>(${escapeHTML(e.source_name || "Source")}${e.year ? ", " + escapeHTML(e.year) : ""})</small>`));

    return `
        <div class="mini-label">INTERPRET</div>
        <h3>Evidence, interpretation and advice are kept apart</h3>
        <p class="method-lead">Example: <strong>${escapeHTML(d.claim)}</strong></p>
        <div class="method-steps">
            <div class="method-step"><div class="mini-label">1 · EVIDENCE (what the sources say)</div>${evidence}</div>
            <div class="method-step"><div class="mini-label">2 · INTERPRETATION (what we infer)</div><p>${escapeHTML(d.interpretation)}</p></div>
            <div class="method-step"><div class="mini-label">3 · WHAT IT DOES NOT PROVE</div><p>${escapeHTML(d.limitation)}</p></div>
            <div class="method-step"><div class="mini-label">4 · RECOMMENDATION (what you could do)</div><p>${escapeHTML(d.student_action)}</p></div>
        </div>
        <button type="button" class="evidence-toggle" id="methodTryHype">Try the Hype Check →</button>
    `;
}

function renderTranslate(d) {

    const rows = d.fields.map(f => `
        <tr>
            <td>${escapeHTML(f.field_name)}</td>
            <td>${escapeHTML(f.roles)}</td>
            <td>${escapeHTML(f.capabilities)}</td>
            <td>${escapeHTML(f.tools)}</td>
            <td>${escapeHTML(f.projects)}</td>
            <td>${escapeHTML(f.roadmap_steps)}</td>
            <td><button type="button" class="evidence-toggle method-open" data-field="${escapeHTML(f.field_id)}">Open →</button></td>
        </tr>`).join("");

    const ex = d.example;
    const chain = ex ? `
        <div class="method-example">
            <div class="mini-label">ONE REAL EXAMPLE · ${escapeHTML(ex.field_name.toUpperCase())}</div>
            <div class="method-chain">
                <span>Capability<br><strong>${escapeHTML(ex.capability)}</strong></span><i>→</i>
                <span>Tool<br><strong>${escapeHTML(ex.tool)}</strong></span><i>→</i>
                <span>Project<br><strong>${escapeHTML(ex.project)}</strong></span><i>→</i>
                <span>Roadmap step<br><strong>${escapeHTML(ex.roadmap_step)}</strong> <small>(${escapeHTML(ex.level)})</small></span>
            </div>
            <small>Capability evidence: ${escapeHTML(ex.evidence)}</small>
        </div>` : "";

    return `
        <div class="mini-label">TRANSLATE</div>
        <h3>From evidence to things you can do</h3>
        <p class="method-lead">
            Each field turns its evidence into roles, capabilities, tools,
            projects and a learning order.
        </p>
        <div class="method-table-wrap">
            <table class="method-table">
                <thead><tr><th>Field</th><th>Roles</th><th>Capabilities</th><th>Tools</th><th>Projects</th><th>Roadmap steps</th><th></th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
        ${chain}
    `;
}

function ensureMethodPanel() {
    if (methodPanel) return methodPanel;
    methodPanel = document.createElement("div");
    methodPanel.id = "methodDetail";
    methodPanel.className = "method-detail";
    methodPanel.setAttribute("aria-live", "polite");
    methodGrid.insertAdjacentElement("afterend", methodPanel);
    return methodPanel;
}

async function showMethod(card, key) {

    const cards = methodGrid.querySelectorAll(".method-card");

    // clicking the open card again closes it
    if (methodActive === card) {
        methodActive = null;
        cards.forEach(c => c.classList.remove("method-active"));
        ensureMethodPanel().innerHTML = "";
        ensureMethodPanel().classList.remove("open");
        return;
    }

    methodActive = card;
    cards.forEach(c => c.classList.toggle("method-active", c === card));

    const panel = ensureMethodPanel();
    panel.classList.add("open");
    panel.innerHTML = '<p class="search-summary">Loading…</p>';

    try {

        const data = await loadMethod();

        if (methodActive !== card) return;     // user already clicked another card

        const html = {
            collect: () => renderCollect(data.collect),
            cross: () => renderCross(data.cross_check),
            interpret: () => renderInterpret(data.interpret),
            translate: () => renderTranslate(data.translate)
        }[key]();

        panel.innerHTML = html +
            '<button type="button" class="evidence-toggle" id="methodClose">Close ×</button>';

        document.getElementById("methodClose").onclick = () => showMethod(card, key);

        panel.querySelectorAll(".method-open").forEach(button => {
            button.addEventListener("click", () =>
                openPiece(button.dataset.field, 3));
        });

        const tryHype = document.getElementById("methodTryHype");
        if (tryHype) {
            tryHype.onclick = () => {
                const target = document.getElementById("hypecheck");
                if (target) target.scrollIntoView({ behavior: "smooth" });
            };
        }

        panel.scrollIntoView({ behavior: "smooth", block: "nearest" });

    } catch (error) {
        console.error("Could not load the method data:", error);
        panel.innerHTML =
            '<p class="search-summary">Could not reach the backend. Make sure it is running. ' +
            '<button type="button" class="evidence-toggle" id="methodRetry">Try again</button></p>';
        document.getElementById("methodRetry").onclick = () => {
            methodActive = null;
            showMethod(card, key);
        };
    }
}

// Only start if the four method cards exist in index.html
if (methodGrid) {
    methodGrid.querySelectorAll(".method-card").forEach(card => {

        const heading = card.querySelector("h3");
        const key = heading ? METHOD_KEYS[heading.textContent.trim().toLowerCase()] : null;
        if (!key) return;

        makeActivatable(card, () => showMethod(card, key),
            "Click to see the numbers and an example");
    });
}

/* ===== SEE HOW BEYOND HYPE WORKS ===== */

document.querySelectorAll('a[href="#how-it-works"]').forEach(link => {
    link.addEventListener("click", function (event) {
        const section = document.getElementById("how-it-works");

        if (section) {
            event.preventDefault();
            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});
