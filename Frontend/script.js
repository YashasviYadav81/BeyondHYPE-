/* =========================================================
   BEYOND HYPE — frontend (reads the Flask + SQLite API)
========================================================= */

// Local development uses the local backend.
// After deployment, paste your Render URL where it says YOUR-BACKEND-URL.
const API =
    location.protocol === "file:" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "localhost"
        ? "http://127.0.0.1:5000"
        : "https://YOUR-BACKEND-URL";

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
        industryChanges: bundle.industry_changes,
        workChanges: bundle.work_changes,
        humanCapabilities: bundle.human_capabilities,
        roles: bundle.roles,
        capabilities: bundle.capabilities,
        learningPaths: bundle.learning_paths,
        evidence: bundle.evidence,
        companyCases: bundle.company_cases
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


/* ================= FIVE MAIN PUZZLE PIECES ================= */

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
    capabilities: item => [item.capability, item.meaning]
};

function renderPieceContent(piece) {

    const items = piece.items.slice(0, 5);

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

        return `<li>${text}</li>`;

    }).join("");
}


/* ================= EVIDENCE (tied to the claims on screen) ================= */

function updateEvidence(data, piece) {

    pieceEvidence.classList.remove("open");
    evidenceToggle.textContent = "See the evidence +";

    // Industry piece: only the evidence linked to the claims on screen.
    // Other pieces: our interpretation, so show the field's evidence overall.
    let records;
    let isInterpretation = false;

    if (piece.type === "industry") {
        const ids = new Set(piece.items.flatMap(item => item.evidence_ids || []));
        records = data.evidence.filter(item => ids.has(item.evidence_id));
    } else {
        records = data.evidence.filter(
            item => item.field_id === data.info.field_id
        );
        isInterpretation = true;
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

    evidenceSource.innerHTML = names.map(name => {
        const record = records.find(r => (r.source_name || r.source) === name);
        const url = safeUrl(record.url || record.source_url);
        return url
            ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener">${escapeHTML(name)}</a>`
            : escapeHTML(name);
    }).join("<br>");

    evidenceDate.textContent =
        unique(records.map(r => r.year)).join(", ") || "—";

    evidenceType.textContent = isInterpretation
        ? "Interpretation (based on this field's evidence)"
        : unique(records.map(r => r.evidence_type)).join(", ") || "—";

    evidenceShows.innerHTML = records.slice(0, 6)
        .map(r => `<li>${escapeHTML(r.finding)}</li>`).join("");

    evidenceDoesNot.innerHTML = records.slice(0, 6)
        .map(r => `<li>${escapeHTML(r.does_not_prove || "Not enough evidence to make a broader claim.")}</li>`)
        .join("");
}


/* ================= DEEP DIVE ================= */

function para(text, label) {
    return `<p>${label ? `<strong>${label}:</strong> ` : ""}${escapeHTML(text)}</p>`;
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

    deepDiveTitle.textContent = title;
    deepDiveIntro.textContent = intro;
    deepDiveBody.innerHTML = `<div class="deep-dive-list">${content}</div>`;
}


/* ================= BIG PICTURE ================= */

function updateBigPicture(data) {

    const info = data.info;

    bigTitle.textContent = info.current_landscape;

    const points = [
        `Overall status: ${info.overall_status}`,
        `Primary evidence: ${info.primary_evidence}`,
        `${data.humanCapabilities.length} human capabilities identified`,
        `${data.roles.length} roles mapped`,
        `${data.capabilities.length} capabilities to develop`
    ];

    bigPoints.innerHTML = points
        .map(point => `<li>${escapeHTML(point)}</li>`)
        .join("");

    takeawayTitle.innerHTML = `Understand the <span>change.</span>`;

    takeawayText.textContent =
        `The goal isn't to chase every new technology. Understand what is changing in ${info.field_name}, how the work is shifting, and which capabilities you can actually practise.`;
}


/* ================= PUZZLE PIECES VISUAL STATE ================= */

function updatePuzzlePieces() {

    const puzzlePieces = document.querySelectorAll(".puzzle-piece");

    puzzlePieces.forEach((element, index) => {

        element.classList.remove("active");
        element.classList.remove("done");

        if (index < currentPiece) element.classList.add("done");
        if (index === currentPiece) element.classList.add("active");

    });

    if (currentPiece === 4) {

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
    if (currentPiece < 4) {
        currentPiece++;
        updatePuzzle();
    }
}


/* ================= EVENTS ================= */

fieldCards.forEach(card => {
    card.addEventListener("click", () => {
        const fieldId = keyToField[card.dataset.field];
        if (fieldId) updateField(fieldId);
    });
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