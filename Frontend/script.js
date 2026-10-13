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
        .map(r => `<li>${escapeHTML(r.finding)}</li>`).join("");

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

function updateBigPicture(data) {

    const info = data.info;

    bigTitle.textContent = info.current_landscape;

    const points = [
        `Overall status: ${info.overall_status}`,
        `Primary evidence: ${info.primary_evidence}`,
        `${data.humanCapabilities.length} human capabilities identified`,
        `${data.roles.length} roles mapped`,
        `${data.capabilities.length} capabilities to develop`,
        `${data.tools.length} tools, ${data.projects.length} projects and ${data.roadmap.length} roadmap steps`
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

function verdictClass(verdict) {
    if (verdict === "Supported") return "verdict-supported";
    if (verdict === "Partly supported") return "verdict-partly";
    return "verdict-not";
}

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

        return `<li>${escapeHTML(item.finding)} <small>(${source}${year})</small></li>`;

    }).join("");

    hypeResult.innerHTML = `
        <div class="hype-card-result">

            <div class="mini-label">THE CLAIM</div>
            <h3>${escapeHTML(claim.claim)}</h3>

            <span class="verdict-badge ${verdictClass(claim.verdict)}">
                Our evidence: ${escapeHTML(claim.verdict)}
            </span>

            <div class="hype-columns">

                <div>
                    <div class="mini-label">EVIDENCE</div>
                    <ul>${evidence}</ul>
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