// ==========================================
// BEYOND HYPE — CAREER DETAIL
// ==========================================

const API_BASE = "http://127.0.0.1:5000/api";

const params = new URLSearchParams(window.location.search);
const roleId = params.get("role");

const statusBox = document.getElementById("careerStatus");
const contentBox = document.getElementById("careerContent");
const careerChoices = document.getElementById("careerChoices");

// Safely escape text before inserting it into HTML
function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// Find the first available value from possible field names
function getValue(object, names, fallback = "") {
    if (!object) return fallback;

    for (const name of names) {
        const value = object[name];

        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }

    return fallback;
}

// Convert values into readable text
function readableValue(value) {
    if (Array.isArray(value)) {
        return value.map(readableValue).join(", ");
    }

    if (typeof value === "object" && value !== null) {
        return Object.values(value).map(readableValue).join(" · ");
    }

    return String(value ?? "");
}

// Create a readable list of useful fields from a database record
function recordDetails(record) {
    const ignored = ["id", "field_id", "source_id"];

    return Object.entries(record)
        .filter(([key, value]) =>
            !ignored.includes(key) &&
            value !== null &&
            value !== undefined &&
            value !== ""
        )
        .map(([key, value]) => `
            <p>
                <strong>${escapeHTML(
                    key.replaceAll("_", " ")
                )}:</strong>
                ${escapeHTML(readableValue(value))}
            </p>
        `)
        .join("");
}

// Render cards for projects, tools and evidence
function renderCards(items, className, titleFields) {
    if (!Array.isArray(items) || items.length === 0) {
        return `<p>No information available yet.</p>`;
    }

    return items.map(item => {
        const title = getValue(item, titleFields, "Explore this item");

        const url = getValue(item, ["source_url", "url", "link"], "");

        return `
            <article class="${className}">
                <h3>${escapeHTML(title)}</h3>
                ${recordDetails(item)}
                ${url && /^https?:\/\//i.test(url)
                    ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Explore source ↗</a>`
                    : ""}
            </article>
        `;
    }).join("");
}

// Render overview facts
function renderFacts(role) {
    const facts = [
        ["Field", getValue(role, ["field", "field_name", "domain"])],
        ["Level", getValue(role, ["level", "experience_level"])],
        ["Category", getValue(role, ["category", "role_category"])]
    ].filter(item => item[1]);

    document.getElementById("roleFacts").innerHTML = facts.map(([label, value]) => `
        <div>
            <strong>${escapeHTML(label)}</strong>
            <p>${escapeHTML(value)}</p>
        </div>
    `).join("");
}

// Render learning roadmap
function renderRoadmap(steps, learningPaths) {
    const list = document.getElementById("learningList");
    const detail = document.getElementById("learningDetail");

    const items = Array.isArray(steps) ? steps : [];

    if (items.length === 0) {
        list.innerHTML = "<p>No roadmap steps available.</p>";
        detail.innerHTML = `
            <p class="detail-placeholder">
                Learning roadmap details will appear here.
            </p>
        `;
        return;
    }

    list.innerHTML = items.map((step, index) => {
        const title = getValue(
            step,
            ["title", "step_title", "name", "topic"],
            `Step ${index + 1}`
        );

        const description = getValue(
            step,
            ["description", "summary", "details"],
            ""
        );

        return `
            <button
                class="learning-step ${index === 0 ? "active" : ""}"
                type="button"
                data-step-index="${index}"
            >
                <h3>${escapeHTML(title)}</h3>
                <p>${escapeHTML(description)}</p>
            </button>
        `;
    }).join("");

    function showStep(index) {
        const step = items[index];

        list.querySelectorAll(".learning-step").forEach(button => {
            button.classList.toggle(
                "active",
                Number(button.dataset.stepIndex) === index
            );
        });

        const title = getValue(
            step,
            ["title", "step_title", "name", "topic"],
            `Step ${index + 1}`
        );

        detail.innerHTML = `
            <h3>${escapeHTML(title)}</h3>
            ${recordDetails(step)}
        `;
    }

    list.querySelectorAll(".learning-step").forEach(button => {
        button.addEventListener("click", () => {
            showStep(Number(button.dataset.stepIndex));
        });
    });

    showStep(0);

    // Learning paths are additional learning resources.
    if (Array.isArray(learningPaths) && learningPaths.length > 0) {
        detail.innerHTML += `
            <h3>Additional Learning Resources</h3>
            ${learningPaths.map(path => `
                <div class="learning-resource">
                    ${recordDetails(path)}
                </div>
            `).join("")}
        `;
    }

    const count = document.querySelector(".roadmap-count");

    if (count) {
        count.textContent = `${items.length} learning steps`;
    }
}

// Render the profession dashboard
function displayCareer(data) {
    const role = data.role || {};

    const title = getValue(
        role,
        ["role", "title", "name", "role_name"],
        "Career Path"
    );

    document.title = `${title} | Beyond HYPE`;

    document.getElementById("breadcrumbRole").textContent = title;
    document.getElementById("roleTitle").textContent = title;

    document.getElementById("roleCategory").textContent =
        getValue(role, ["category", "field", "field_name"], "Technology Career");

    document.getElementById("roleTagline").textContent =
        getValue(data, ["tagline"], "Explore this career and build the skills it requires.");

    document.getElementById("roleAudience").textContent =
        getValue(data, ["audience"], "For students exploring this career.");

    document.getElementById("roleDescription").textContent =
        getValue(
            role,
            ["description", "overview", "summary", "about"],
            "Explore the responsibilities, skills and learning opportunities associated with this profession."
        );

    renderFacts(role);

    // Industry evolution: show capabilities as the underlying skill areas.
    document.getElementById("evolutionContent").innerHTML =
        renderCards(
            data.capabilities,
            "evolution-item",
            ["name", "title", "capability", "skill"]
        );

    renderRoadmap(data.roadmap_steps, data.learning_paths);

    document.getElementById("projectContent").innerHTML =
        renderCards(
            data.projects,
            "project-card",
            ["name", "title", "project_name"]
        );

    document.getElementById("toolsContent").innerHTML =
        renderCards(
            data.tools,
            "tool-card",
            ["name", "title", "tool_name"]
        );

    document.getElementById("evidenceContent").innerHTML =
        renderCards(
            data.evidence,
            "evidence-card",
            ["title", "name", "claim", "description"]
        );

    contentBox.hidden = false;
}

async function loadCareer() {

    // No role selected: show the three career cards
    if (!roleId) {
        careerChoices.hidden = false;
        statusBox.hidden = true;
        contentBox.hidden = true;
        return;
    }

    // A role is selected: hide cards and load its dashboard
    careerChoices.hidden = true;
    statusBox.hidden = false;
    contentBox.hidden = true;

    statusBox.textContent = "Loading career information...";

    try {
        const response = await fetch(
            `${API_BASE}/career-paths/${encodeURIComponent(roleId)}`
        );

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        displayCareer(data);

        statusBox.hidden = true;

    } catch (error) {
        console.error("Career loading error:", error);

        statusBox.hidden = false;
        statusBox.textContent =
            "Unable to load career information. Check that your Flask backend is running and try again.";
    }
}

loadCareer();