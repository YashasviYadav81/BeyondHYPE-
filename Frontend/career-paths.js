/* =========================================
   BEYOND HYPE — SDE CAREER PATH
   Interactive learning journey
========================================= */

const learningAreas = [

  // 01 — PROGRAMMING FOUNDATIONS
  {
    title: "Programming foundations",
    summary: "Write clear, modular programs and understand how code executes.",
    level: "Start here",
    focus: "Build confidence in one primary programming language before spreading across frameworks.",
    topics: [
      "Variables, data types, operators and expressions",
      "Conditional statements and loops",
      "Functions, parameters, return values and scope",
      "Arrays, strings, lists, sets and dictionaries",
      "Object-oriented programming: classes, objects and inheritance",
      "Exception handling and file handling",
      "Writing modular, readable and reusable code"
    ],
    practice: [
      "Build a command-line expense tracker",
      "Create a student record management program",
      "Refactor repeated code into reusable functions",
      "Add input validation and exception handling"
    ],
    next: "Build a small command-line application that stores, retrieves and modifies data.",
    completion: [
      "Can write a program independently without following a tutorial",
      "Can break a problem into smaller functions",
      "Can explain how their code works",
      "Can identify and fix basic errors"
    ]
  },

  // 02 — DATA STRUCTURES AND ALGORITHMS
  {
    title: "Data structures & algorithms",
    summary: "Choose efficient ways to organize data and solve computational problems.",
    level: "Core problem-solving",
    focus: "Prioritize understanding patterns and complexity instead of memorizing solutions.",
    topics: [
      "Time and space complexity: Big-O notation",
      "Arrays and strings",
      "Two pointers and sliding window",
      "Hash maps and sets",
      "Linked lists, stacks and queues",
      "Binary search and sorting concepts",
      "Recursion and backtracking",
      "Trees, heaps and graphs",
      "Greedy algorithms and dynamic programming"
    ],
    practice: [
      "Two Sum — https://leetcode.com/problems/two-sum/",
      "Contains Duplicate — https://leetcode.com/problems/contains-duplicate/",
      "Valid Anagram — https://leetcode.com/problems/valid-anagram/",
      "Binary Search — https://leetcode.com/problems/binary-search/",
      "Reverse Linked List — https://leetcode.com/problems/reverse-linked-list/",
      "Valid Parentheses — https://leetcode.com/problems/valid-parentheses/"
    ],
    next: "Solve problems topic by topic. For each problem, explain the brute-force approach, improve it and analyze its time and space complexity.",
    completion: [
      "Can select an appropriate data structure for a problem",
      "Can explain basic time and space complexity",
      "Can solve common easy problems independently",
      "Can recognize common problem-solving patterns"
    ]
  },

  // 03 — COMPUTER SCIENCE FUNDAMENTALS
  {
    title: "Computer science fundamentals",
    summary: "Understand the systems that software runs on and communicates through.",
    level: "Core foundations",
    focus: "Learn concepts well enough to explain system behavior and diagnose real issues.",
    topics: [
      "Operating system fundamentals",
      "Processes and threads",
      "Concurrency and synchronization basics",
      "Memory management: stack and heap",
      "Files, permissions and Linux commands",
      "Networking: IP, TCP, DNS and ports",
      "HTTP request and response lifecycle",
      "Basic security concepts"
    ],
    practice: [
      "Use command-line tools to inspect files and processes",
      "Trace what happens when a URL is entered in a browser",
      "Explain the difference between a process and a thread",
      "Explore common HTTP status codes"
    ],
    next: "Connect these concepts to real applications: understand what happens when a user sends a request to your server.",
    completion: [
      "Can explain the basic role of an operating system",
      "Understands processes and threads",
      "Can describe how a browser communicates with a server",
      "Can use basic terminal commands"
    ]
  },

  // 04 — DATABASES AND SQL
  {
    title: "Databases & SQL",
    summary: "Model application data and retrieve it correctly and efficiently.",
    level: "Core engineering",
    focus: "Practice schema design and multi-table queries, not just isolated SQL commands.",
    topics: [
      "Tables, rows, columns and data types",
      "Primary keys and foreign keys",
      "Constraints and relationships",
      "SELECT, WHERE, ORDER BY and DISTINCT",
      "Aggregate functions and GROUP BY",
      "INNER JOIN and LEFT JOIN",
      "Subqueries and normalization",
      "Indexes and query performance",
      "Transactions and ACID properties"
    ],
    practice: [
      "Design a student-course-enrollment database",
      "Write queries using JOIN and GROUP BY",
      "Find duplicate records using SQL",
      "Add constraints and test invalid data",
      "Connect a database to a small application"
    ],
    next: "Build a relational database for an application and implement complete CRUD operations.",
    completion: [
      "Can design related database tables",
      "Can write queries involving multiple tables",
      "Understands primary and foreign keys",
      "Can explain why indexes and transactions matter"
    ]
  },

  // 05 — BACKEND DEVELOPMENT AND APIS
  {
    title: "Backend development & APIs",
    summary: "Build the server-side logic that powers applications and services.",
    level: "Build applications",
    focus: "Understand HTTP and API design before relying on a particular framework.",
    topics: [
      "Client-server architecture",
      "HTTP methods: GET, POST, PUT, PATCH and DELETE",
      "REST API principles and JSON",
      "Routing and request handling",
      "Input validation and error handling",
      "Authentication and authorization",
      "Database integration",
      "Environment variables and configuration",
      "API security and rate limiting basics"
    ],
    practice: [
      "Design endpoints for a task management application",
      "Implement create, read, update and delete operations",
      "Connect API endpoints to a database",
      "Test endpoints using Postman",
      "Return appropriate HTTP status codes and error messages"
    ],
    next: "Build a documented REST API backed by a relational database.",
    completion: [
      "Can design basic REST endpoints",
      "Can connect an API to a database",
      "Understands request and response handling",
      "Can implement basic validation and authentication"
    ]
  },

  // 06 — COLLABORATIVE ENGINEERING
  {
    title: "Collaborative engineering",
    summary: "Work safely and effectively on code that other people also maintain.",
    level: "Team readiness",
    focus: "A GitHub repository should communicate how a project works and how changes are made.",
    topics: [
      "Git and version control fundamentals",
      "git status, add, commit and log",
      "Branches and merging",
      "Resolving merge conflicts",
      "GitHub repositories and pull requests",
      "Code reviews and feedback",
      "Writing useful README documentation",
      "Issue tracking and collaborative workflows"
    ],
    practice: [
      "Create a feature branch and merge a pull request",
      "Collaborate with another developer on one repository",
      "Resolve a merge conflict",
      "Review a teammate's code using a checklist",
      "Write a README with setup instructions"
    ],
    next: "Collaborate on a project with clear commits, branches and review history.",
    completion: [
      "Can use Git without relying entirely on a graphical interface",
      "Can create branches and resolve basic conflicts",
      "Can create and review pull requests",
      "Can explain how to contribute to a repository"
    ]
  },

  // 07 — TESTING AND DEBUGGING
  {
    title: "Testing, debugging & quality",
    summary: "Make software dependable and catch defects before users do.",
    level: "Quality practices",
    focus: "Test normal cases, edge cases and failure paths—not just the happy path.",
    topics: [
      "Debugging techniques and breakpoints",
      "Reading error messages and stack traces",
      "Unit testing",
      "Integration testing",
      "API testing",
      "Test cases and boundary conditions",
      "Mocks and test data",
      "Regression testing",
      "Code quality and maintainability"
    ],
    practice: [
      "Write unit tests for a function",
      "Test invalid API input",
      "Test missing records and duplicate requests",
      "Reproduce a bug, fix it and add a regression test",
      "Test an API using Postman or an automated test framework"
    ],
    next: "Add automated tests to your backend project and verify both successful and unsuccessful requests.",
    completion: [
      "Can write basic unit tests",
      "Can identify and reproduce bugs",
      "Can test edge cases",
      "Can explain the difference between unit and integration testing"
    ]
  },

  // 08 — CLOUD AND DEPLOYMENT
  {
    title: "Cloud, deployment & operations",
    summary: "Package, deploy and observe an application outside your laptop.",
    level: "Deployment skills",
    focus: "Learn deployment fundamentals before specializing in a particular cloud provider.",
    topics: [
      "Environment variables and application configuration",
      "Linux server fundamentals",
      "Web servers and hosting basics",
      "Docker images and containers",
      "CI/CD pipeline concepts",
      "Cloud computing fundamentals",
      "Cloud storage and managed databases",
      "Logs, monitoring and basic reliability"
    ],
    practice: [
      "Run an application using environment variables",
      "Containerize a small API using Docker",
      "Deploy an application to a hosting platform",
      "Inspect application logs",
      "Diagnose a failed deployment"
    ],
    next: "Deploy your backend project and document how another developer can run and monitor it.",
    completion: [
      "Can deploy a basic application",
      "Understands the purpose of Docker",
      "Can configure environment variables",
      "Can inspect logs and troubleshoot basic deployment errors"
    ]
  },

  // 09 — AI-ASSISTED ENGINEERING AND SYSTEM DESIGN
  {
    title: "AI-assisted engineering & system design",
    summary: "Use AI tools responsibly and develop the judgment needed to design larger systems.",
    level: "Evolving and advanced practice",
    focus: "AI assistance is a tool, not a replacement for understanding. System design is best learned after building real applications.",
    topics: [
      "Giving AI tools useful codebase context",
      "Generating tests, documentation and code drafts",
      "Reviewing generated code for correctness and security",
      "Understanding limitations of AI-generated output",
      "Functional and non-functional requirements",
      "Monoliths and service boundaries",
      "Caching and data consistency",
      "Queues and asynchronous processing",
      "Scalability, availability and fault tolerance",
      "Architecture trade-offs"
    ],
    practice: [
      "Ask an AI assistant to draft a function, then test its edge cases",
      "Compare generated and manually designed solutions",
      "Design a URL shortener at a conceptual level",
      "Explain when caching helps and what can go wrong",
      "Compare a modular monolith with microservices"
    ],
    next: "Apply design reasoning to an application you have already built. Use AI selectively and explain what you verified yourself.",
    completion: [
      "Can review and test AI-generated code",
      "Can identify limitations in generated solutions",
      "Can explain basic architectural trade-offs",
      "Can describe the design of a project they have built"
    ]
  }

];


/* =========================================
   ELEMENT REFERENCES
========================================= */

const learningList = document.getElementById("learningList");
const learningDetail = document.getElementById("learningDetail");


/* =========================================
   CREATE DETAIL CONTENT
========================================= */

function createList(items) {
  return `
    <ul>
      ${items.map(item => `<li>${item}</li>`).join("")}
    </ul>
  `;
}


function renderArea(index) {

  const area = learningAreas[index];

  if (!area) return;


  // Render the learning area buttons
  learningList.innerHTML = learningAreas.map((item, i) => `
    <button
      class="learning-card ${i === index ? "active" : ""}"
      type="button"
      data-index="${i}"
      aria-pressed="${i === index}"
    >

      <span class="learning-number">
        ${String(i + 1).padStart(2, "0")}
      </span>

      <span class="learning-card-content">

        <h3>${item.title}</h3>

        <p>${item.summary}</p>

      </span>

      <span class="learning-arrow">↗</span>

    </button>
  `).join("");


  // Make LeetCode links clickable
  const practiceItems = area.practice.map(item => {

    const separator = " — ";
    const separatorIndex = item.indexOf(separator);

    if (separatorIndex !== -1) {

      const title = item.substring(0, separatorIndex);
      const url = item.substring(separatorIndex + separator.length);

      return `
        <li>
          ${title} —
          <a
            class="detail-link"
            href="${url}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open practice problem ↗
          </a>
        </li>
      `;
    }

    return `<li>${item}</li>`;

  }).join("");


  // Render the selected area's details
  learningDetail.innerHTML = `

    <div class="detail-header">

      <span>
        LEARNING AREA ${String(index + 1).padStart(2, "0")}
        OF ${String(learningAreas.length).padStart(2, "0")}
        · ${area.level.toUpperCase()}
      </span>

      <h2>${area.title}</h2>

      <p>${area.summary}</p>

    </div>


    <div class="detail-section">

      <h3>What you need to learn</h3>

      ${createList(area.topics)}

    </div>


    <div class="detail-section">

      <h3>How to practice</h3>

      <ul>
        ${practiceItems}
      </ul>

    </div>


    <div class="detail-section">

      <h3>Where should you focus?</h3>

      <p>${area.focus}</p>

    </div>


    <div class="detail-section">

      <h3>Next practical step</h3>

      <p>${area.next}</p>

    </div>


    <div class="detail-section">

      <h3>How do you know you're ready?</h3>

      ${createList(area.completion)}

    </div>

  `;

}


/* =========================================
   HANDLE LEARNING AREA SELECTION
========================================= */

learningList.addEventListener("click", function(event) {

  const selectedButton = event.target.closest("[data-index]");

  if (!selectedButton) return;

  const index = Number(selectedButton.dataset.index);

  renderArea(index);

});


/* =========================================
   INITIALIZE PAGE
========================================= */

renderArea(0);