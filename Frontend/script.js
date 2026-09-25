/* =========================================================
   BEYOND HYPE
   Dataset-driven frontend
========================================================= */

const API = "http://127.0.0.1:5000";

let dataset = null;
let fieldData = {};
let currentField = "F1";
let currentPiece = 0;


/* =========================================================
   ELEMENTS
========================================================= */

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


/* =========================================================
   FIELD ID ↔ HTML KEY
========================================================= */

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


/* =========================================================
   LOAD BACKEND DATA
========================================================= */

async function loadBackendData() {

    try {

        const response = await fetch(`${API}/data`);

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }

        dataset = await response.json();

        buildFieldData();

        updateField("F1");

        console.log("Beyond HYPE dataset loaded.");

    } catch (error) {

        console.error("Could not load Beyond HYPE data:", error);

        fieldTitle.textContent = "Could not load the industry data.";
        fieldDescription.textContent =
            "Make sure the Flask backend is running at http://127.0.0.1:5000";

    }
}


/* =========================================================
   BUILD FIELD DATA
========================================================= */

function buildFieldData() {

    dataset.fields.forEach(field => {

        const id = field.field_id;

        fieldData[id] = {

            info: field,

            industryChanges:
                dataset.industry_changes.filter(
                    item => item.field_id === id
                ),

            workChanges:
                dataset.work_changes.filter(
                    item => item.field_id === id
                ),

            humanCapabilities:
                dataset.human_capabilities.filter(
                    item => item.field_id === id
                ),

            roles:
                dataset.roles.filter(
                    item => item.field_id === id
                ),

            capabilities:
                dataset.capabilities.filter(
                    item => item.field_id === id
                ),

            learningPaths:
                dataset.learning_paths.filter(
                    item => item.field_id === id
                ),

            evidence:
                dataset.evidence.filter(
                    item => item.field_id === id
                ),

            companyCases:
                dataset.company_cases.filter(
                    item => item.field_id === id
                )
        };

    });
}


/* =========================================================
   UPDATE FIELD
========================================================= */

function updateField(fieldId) {

    currentField = fieldId;
    currentPiece = 0;

    const data = fieldData[fieldId];

    if (!data) return;


    fieldNumber.textContent =
        fieldId.replace("F", "").padStart(2, "0");

    fieldLabel.textContent =
        data.info.field_name.toUpperCase();


    fieldTitle.innerHTML =
        `How is <span>${data.info.field_name}</span> changing?`;


    fieldDescription.textContent =
        data.info.description;


    fieldCards.forEach(card => {

        card.classList.toggle(
            "active",
            card.dataset.field === fieldKeys[fieldId]
        );

    });


    updatePuzzle();
    updateBigPicture(data);

}


/* =========================================================
   FIVE MAIN PUZZLE PIECES
========================================================= */

function getPieces(data) {

    return [

        /* 01 — INDUSTRY */
        {
            type: "industry",
            status: "INDUSTRY CHANGE",

            title: "What's changing in the industry?",

            items: data.industryChanges,

            source:
                data.industryChanges[0]?.source ||
                data.info.primary_evidence
        },


        /* 02 — WORK */
        {
            type: "work",
            status: "WORK IS CHANGING",

            title: "How is the actual work changing?",

            items: data.workChanges,

            source: "Employer + industry evidence"
        },


        /* 03 — HUMAN */
        {
            type: "human",
            status: "HUMAN CAPABILITY",

            title: "What still requires human capability?",

            items: data.humanCapabilities,

            source: "Industry evidence"
        },


        /* 04 — ROLES */
        {
            type: "roles",
            status: "ROLE LANDSCAPE",

            title: "How are roles changing?",

            items: data.roles,

            source: "Employer + industry evidence"
        },


        /* 05 — CAPABILITIES */
        {
            type: "capabilities",
            status: "BUILD THESE CAPABILITIES",

            title: "What capabilities should I develop?",

            items: data.capabilities,

            source: "Employer + industry evidence"
        }

    ];
}


/* =========================================================
   UPDATE PUZZLE
========================================================= */

function updatePuzzle() {

    const data = fieldData[currentField];

    if (!data) return;

    const pieces = getPieces(data);
    const piece = pieces[currentPiece];

    if (!piece) return;


    pieceCurrent.textContent =
        String(currentPiece + 1).padStart(2, "0");

    pieceProgress.textContent =
        String(pieces.length).padStart(2, "0");


    pieceStatus.textContent =
        piece.status;

    pieceSource.textContent =
        piece.source;

    pieceTitle.textContent =
        piece.title;


    renderPieceContent(piece);


    updateEvidence(data, piece);

    updateDeepDive(data, piece);

    updatePuzzlePieces();

}


/* =========================================================
   RENDER PIECE CONTENT
========================================================= */

function renderPieceContent(piece) {

    const items = piece.items.slice(0, 5);


    /* ---------- MAIN POINTS ---------- */

    piecePoints.innerHTML = items.map((item, index) => {

        let title = "";
        let text = "";

        if (piece.type === "industry") {

            title = item.change;
            text = item.what_is_happening;

        }

        else if (piece.type === "work") {

            title = item.task;
            text = item.shift;

        }

        else if (piece.type === "human") {

            title = item.capability;
            text = item.why_it_matters;

        }

        else if (piece.type === "roles") {

            title = item.role;
            text = item.what_is_changing;

        }

        else if (piece.type === "capabilities") {

            title = item.capability;
            text = item.meaning;

        }


        return `
            <div class="detail-point">
                <strong>${index + 1}. ${escapeHTML(title)}</strong>
                <span>${escapeHTML(text)}</span>
            </div>
        `;

    }).join("");


    /* ---------- WHAT THIS MEANS ---------- */

    pieceMeaning.innerHTML = items.map(item => {

        let text = "";

        if (piece.type === "industry") {
            text = item.why_it_matters;
        }

        else if (piece.type === "work") {
            text =
                `<strong>Mode:</strong> ${item.mode}<br>
                 <strong>Human role:</strong> ${item.human_role}`;
        }

        else if (piece.type === "human") {
            text =
                `<strong>${item.work_mode}</strong> — ${item.why_human}`;
        }

        else if (piece.type === "roles") {
            text =
                `<strong>Key shift:</strong> ${item.key_shift}`;
        }

        else if (piece.type === "capabilities") {
            text =
                `<strong>Examples:</strong> ${item.examples}<br>
                 <strong>Priority:</strong> ${item.priority}`;
        }

        return `<li>${text}</li>`;

    }).join("");

}


/* =========================================================
   EVIDENCE
========================================================= */

function updateEvidence(data, piece) {

    pieceEvidence.classList.remove("open");

    evidenceToggle.textContent =
        "See the evidence +";


    const evidence = data.evidence;


    if (!evidence.length) {

        evidenceSource.textContent =
            piece.source || "Industry evidence";

        evidenceDate.textContent =
            "—";

        evidenceType.textContent =
            "Industry signal";

        evidenceShows.innerHTML =
            "<li>Evidence record not available for this field.</li>";

        evidenceDoesNot.innerHTML =
            "<li>Do not treat the field summary as a forecast.</li>";

        return;
    }


    const currentEvidence =
        evidence[Math.min(currentPiece, evidence.length - 1)];


    evidenceSource.textContent =
        currentEvidence.source || "—";

    evidenceDate.textContent =
        currentEvidence.year || "—";

    evidenceType.textContent =
        currentEvidence.evidence_type || "—";


    evidenceShows.innerHTML =
        evidence
            .slice(0, 3)
            .map(item => `
                <li>
                    ${escapeHTML(item.finding || item.supports || "")}
                </li>
            `)
            .join("");


    evidenceDoesNot.innerHTML =
        evidence
            .slice(0, 3)
            .map(item => `
                <li>
                    ${escapeHTML(item.does_not_prove || "Not enough evidence to make a broader claim.")}
                </li>
            `)
            .join("");

}


/* =========================================================
   DEEP DIVE
========================================================= */

function updateDeepDive(data, piece) {

    deepDivePanel.classList.remove("open");

    deepDiveToggle.textContent =
        "Deep dive →";

    deepDiveLabel.textContent =
        "DEEP DIVE";


    let title = "";
    let intro = "";
    let content = "";


    /* ---------- INDUSTRY ---------- */

    if (piece.type === "industry") {

        title = "Understand the industry change";

        intro =
            "Look at the evidence behind the shift and what it does — and does not — tell us.";

        content =
            data.industryChanges.map(item => `
                <div class="deep-dive-item">

                    <strong>${escapeHTML(item.change)}</strong>

                    <p>
                        ${escapeHTML(item.what_is_happening)}
                    </p>

                    <p>
                        <strong>Why it matters:</strong>
                        ${escapeHTML(item.why_it_matters)}
                    </p>

                    <small>
                        ${escapeHTML(item.status)}
                    </small>

                </div>
            `).join("");

    }


    /* ---------- WORK ---------- */

    else if (piece.type === "work") {

        title = "Inside the changing workflow";

        intro =
            "The important question is not simply whether a task is automated, but what responsibility remains with the person doing the work.";

        content =
            data.workChanges.map(item => `
                <div class="deep-dive-item">

                    <strong>${escapeHTML(item.task)}</strong>

                    <p>
                        ${escapeHTML(item.shift)}
                    </p>

                    <p>
                        <strong>Mode:</strong>
                        ${escapeHTML(item.mode)}
                    </p>

                    <p>
                        <strong>Human role:</strong>
                        ${escapeHTML(item.human_role)}
                    </p>

                </div>
            `).join("");

    }


    /* ---------- HUMAN CAPABILITIES ---------- */

    else if (piece.type === "human") {

        title = "What remains human-led";

        intro =
            "These capabilities are connected to judgment, context, accountability and interpretation.";

        content =
            data.humanCapabilities.map(item => `
                <div class="deep-dive-item">

                    <strong>${escapeHTML(item.capability)}</strong>

                    <p>
                        ${escapeHTML(item.why_it_matters)}
                    </p>

                    <p>
                        <strong>Why human:</strong>
                        ${escapeHTML(item.why_human)}
                    </p>

                </div>
            `).join("");

    }


    /* ---------- ROLES ---------- */

    else if (piece.type === "roles") {

        title = "Inside the role landscape";

        intro =
            "Roles are changing through shifts in responsibilities, tools and the capabilities employers expect.";

        content =
            data.roles.map(item => `
                <div class="deep-dive-item">

                    <strong>${escapeHTML(item.role)}</strong>

                    <p>
                        ${escapeHTML(item.what_is_changing)}
                    </p>

                    <p>
                        <strong>Key shift:</strong>
                        ${escapeHTML(item.key_shift)}
                    </p>

                    <small>
                        ${escapeHTML(item.status)}
                    </small>

                </div>
            `).join("");

    }


    /* ---------- CAPABILITIES ---------- */

    else if (piece.type === "capabilities") {

        title = "How to build these capabilities";

        intro =
            "These are not just technology names. They describe capabilities you can practise through projects and exercises.";

        content =
            data.capabilities.map(item => {

                const paths =
                    data.learningPaths.filter(path =>
                        path.capability === item.capability
                    );

                const pathHTML =
                    paths.map(path => `
                        <p>
                            <strong>Practice:</strong>
                            ${escapeHTML(path.exercise)}
                        </p>
                    `).join("");

                return `
                    <div class="deep-dive-item">

                        <strong>
                            ${escapeHTML(item.capability)}
                        </strong>

                        <p>
                            ${escapeHTML(item.meaning)}
                        </p>

                        <p>
                            <strong>Examples:</strong>
                            ${escapeHTML(item.examples)}
                        </p>

                        <p>
                            <strong>Priority:</strong>
                            ${escapeHTML(item.priority)}
                        </p>

                        ${pathHTML}

                    </div>
                `;

            }).join("");

    }


    deepDiveTitle.textContent = title;

    deepDiveIntro.textContent = intro;

    deepDiveBody.innerHTML =
        `<div class="deep-dive-list">${content}</div>`;

}


/* =========================================================
   BIG PICTURE
========================================================= */

function updateBigPicture(data) {

    const info = data.info;

    bigTitle.textContent =
        info.current_landscape;


    const points = [

        `Overall status: ${info.overall_status}`,

        `Primary evidence: ${info.primary_evidence}`,

        `${data.humanCapabilities.length} human capabilities identified`,

        `${data.roles.length} roles mapped`,

        `${data.capabilities.length} capabilities to develop`

    ];


    bigPoints.innerHTML =
        points.map(point => `
            <li>${escapeHTML(point)}</li>
        `).join("");


    takeawayTitle.innerHTML =
        `Understand the <span>change.</span>`;


    takeawayText.textContent =
        `The goal isn't to chase every new technology. Understand what is changing in ${info.field_name}, how the work is shifting, and which capabilities you can actually practise.`;

}


/* =========================================================
   PUZZLE PIECES VISUAL STATE
========================================================= */

function updatePuzzlePieces() {

    const puzzlePieces =
        document.querySelectorAll(".puzzle-piece");


    puzzlePieces.forEach((element, index) => {

        element.classList.remove("active");
        element.classList.remove("done");


        if (index < currentPiece) {
            element.classList.add("done");
        }


        if (index === currentPiece) {
            element.classList.add("active");
        }

    });


    if (currentPiece === 4) {

        nextPiece.innerHTML =
            `View the big picture <span>↓</span>`;

        nextPiece.onclick = () => {

            document
                .getElementById("bigPicture")
                .scrollIntoView({
                    behavior: "smooth"
                });

        };

    }

    else {

        nextPiece.innerHTML =
            `Next piece <span>→</span>`;

        nextPiece.onclick =
            nextPieceHandler;

    }

}


/* =========================================================
   NEXT PIECE
========================================================= */

function nextPieceHandler() {

    if (currentPiece < 4) {

        currentPiece++;

        updatePuzzle();

    }

}


/* =========================================================
   FIELD CARD CLICKS
========================================================= */

fieldCards.forEach(card => {

    card.addEventListener("click", () => {

        const fieldId =
            keyToField[card.dataset.field];

        if (fieldId) {
            updateField(fieldId);
        }

    });

});


/* =========================================================
   EVIDENCE DRAWER
========================================================= */

evidenceToggle.addEventListener("click", () => {

    const isOpen =
        pieceEvidence.classList.toggle("open");

    evidenceToggle.textContent =
        isOpen
            ? "Hide the evidence −"
            : "See the evidence +";

});


/* =========================================================
   DEEP DIVE DRAWER
========================================================= */

deepDiveToggle.addEventListener("click", () => {

    const isOpen =
        deepDivePanel.classList.toggle("open");

    deepDiveToggle.textContent =
        isOpen
            ? "Close deep dive −"
            : "Deep dive →";

});


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   INITIAL LOAD
========================================================= */

loadBackendData();


/* =========================================================
   SCROLL REVEAL
========================================================= */

const revealElements =
    document.querySelectorAll(
        ".field-card, .method-card, .emerging-item"
    );


const observer =
    new IntersectionObserver(
        entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.style.opacity = "1";

                    entry.target.style.transform =
                        "translateY(0)";

                    observer.unobserve(entry.target);

                }

            });

        },
        {
            threshold: 0.12
        }
    );


revealElements.forEach(element => {

    element.style.opacity = "0";

    element.style.transform =
        "translateY(20px)";

    element.style.transition =
        "opacity .6s ease, transform .6s ease";

    observer.observe(element);

});