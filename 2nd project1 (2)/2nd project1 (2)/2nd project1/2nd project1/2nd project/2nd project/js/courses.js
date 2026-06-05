/**
 * courses.js - Course Management Logic
 * Handles dynamic course data and study interactions.
 */

const COURSE_DATA = {
    "C": {
        title: "Mastering C Programming",
        description: "The grandfather of modern languages. Learn memory management and system-level logic.",
        icon: "bi-cpu",
        modules: [
            {
                name: "Introduction",
                topics: [
                    { title: "Structure of a C Program", objectives: ["Main function", "Pre-processor directives", "Compiling C"] },
                    { title: "Variables & Constants", objectives: ["Data Types", "Keywords", "Storage Classes"] }
                ]
            },
            {
                name: "Flow & Logic",
                topics: [
                    { title: "Control Statements", objectives: ["if-else", "switch", "Loops (for/while)"] },
                    { title: "Functions", objectives: ["Parameters", "Return types", "Recursion"] }
                ]
            }
        ]
    },
    "Python": {
        title: "Mastering Python Programming",
        description: "From syntax basics to professional AI-driven development. Master the most versatile language on earth.",
        icon: "bi-code-square",
        modules: [
            {
                name: "Getting Started",
                topics: [
                    { title: "Introduction to Python", objectives: ["What is Python?", "Setting up Environment", "Python IDLE & VS Code"] },
                    { title: "Variables & Data Types", objectives: ["Strings, Integers, Floats", "Dynamic Typing", "Type Conversion"] },
                    { title: "Basic Input & Output", objectives: ["print() function", "input() function", "f-strings formatting"] }
                ]
            },
            {
                name: "Control Flow",
                topics: [
                    { title: "Conditional Statements", objectives: ["if, elif, else", "Logical Operators", "Nested Conditionals"] },
                    { title: "Loops in Python", objectives: ["for loops", "while loops", "break and continue"] }
                ]
            },
            {
                name: "Data Structures",
                topics: [
                    { title: "Lists & Tuples", objectives: ["List Methods", "Immutability of Tuples", "Indexing & Slicing"] },
                    { title: "Dictionaries & Sets", objectives: ["Key-Value Pairs", "Set Operations", "JSON-like structures"] }
                ]
            }
        ]
    },
    "Java": {
        title: "Professional Java Development",
        description: "Build robust, scalable enterprise applications. Learn the language that powers the world's largest systems.",
        icon: "bi-cup-hot",
        modules: [
            {
                name: "Java Basics",
                topics: [
                    { title: "JVM, JRE, and JDK", objectives: ["How Java works", "Platform Independence", "Bytecode concept"] },
                    { title: "Syntax & Structures", objectives: ["Public Static Void Main", "Variables", "Operators"] }
                ]
            },
            {
                name: "Object Oriented Programming",
                topics: [
                    { title: "Classes and Objects", objectives: ["Constructor methodology", "Methods", "State vs Behavior"] },
                    { title: "Inheritance & Polymorphism", objectives: ["Extending classes", "Method Overriding", "Method Overloading"] }
                ]
            }
        ]
    },
    "C++": {
        title: "Advanced C++ Mastery",
        description: "High-performance systems programming and the Standard Template Library (STL).",
        icon: "bi-gear-wide-connected",
        modules: [
            {
                name: "Foundations",
                topics: [
                    { title: "C vs C++", objectives: ["Namespaces", "Classes vs Structs", "Reference variables"] },
                    { title: "Standard I/O", objectives: ["cin and cout", "I/O Manipulators"] }
                ]
            },
            {
                name: "Object Oriented C++",
                topics: [
                    { title: "Classes & Objects", objectives: ["Access Specifiers", "Constructors", "Destructors"] },
                    { title: "STL Overview", objectives: ["Vectors", "Lists", "Maps", "Iterators"] }
                ]
            }
        ]
    },
    "DBMS": {
        title: "Database Management Systems",
        description: "Master structured data, SQL queries, and the architecture of database engines.",
        icon: "bi-database",
        modules: [
            {
                name: "Relational Theory",
                topics: [
                    { title: "ER Diagrams", objectives: ["Entities & Attributes", "Relationships", "Cardinality"] },
                    { title: "Normalization", objectives: ["Functional Dependencies", "1NF to BCNF"] }
                ]
            },
            {
                name: "SQL",
                topics: [
                    { title: "DDL & DML", objectives: ["Create/Alter/Drop", "Insert/Update/Delete"] },
                    { title: "Joins & Subqueries", objectives: ["Inner/Outer/Left/Right Joins", "Correlated Subqueries"] }
                ]
            }
        ]
    },
    "DSA": {
        title: "Data Structures & Algorithms",
        description: "The core of computer science. Master efficient problem solving and ace your technical interviews.",
        icon: "bi-diagram-3",
        modules: [
            {
                name: "Foundations",
                topics: [
                    { title: "Time Complexity", objectives: ["Big O Notation", "Space Complexity", "Efficiency analysis"] },
                    { title: "Recursion Basics", objectives: ["Stack trace", "Base case vs Recursive case", "Memory usage"] }
                ]
            },
            {
                name: "Linear Data Structures",
                topics: [
                    { title: "Arrays & Strings", objectives: ["Memory management", "Two-pointer technique", "Static vs Dynamic arrays"] },
                    { title: "Linked Lists", objectives: ["Singly vs Doubly", "Node manipulation", "Cycle detection"] }
                ]
            }
        ]
    },
    "HTML": {
        title: "Modern HTML5 Structure",
        description: "The skeleton of every web application. Master semantic tags and accessibility.",
        icon: "bi-filetype-html",
        modules: [
            {
                name: "Core Tags",
                topics: [
                    { title: "Structure & Semantics", objectives: ["Header/Nav/Section", "Main/Footer", "Article/Aside"] },
                    { title: "Forms & Controls", objectives: ["Input types", "Validation", "Form submission"] }
                ]
            }
        ]
    },
    "JavaScript": {
        title: "Modern JavaScript (ES6+)",
        description: "Master the language of the browser. From dynamic DOM to asynchronous processing.",
        icon: "bi-braces",
        modules: [
            {
                name: "Core Fundamentals",
                topics: [
                    { title: "ES6+ Syntax", objectives: ["Arrow functions", "Destructuring", "Template literals"] },
                    { title: "Asynchronous JS", objectives: ["Callbacks", "Promises", "Async/Await"] }
                ]
            },
            {
                name: "DOM Manipulation",
                topics: [
                    { title: "Event Listeners", objectives: ["Bubbling & Capturing", "Form handling", "Live updates"] }
                ]
            }
        ]
    }
};

// Fallback for courses not explicitly defined
const DEFAULT_COURSE = (name) => ({
    title: `${name} Essentials`,
    description: `Comprehensive guide to mastering ${name}. Optimized for students and professionals.`,
    icon: "bi-journal-code",
    modules: [
        {
            name: "Phase 1: Fundamentals",
            topics: [
                { title: `Introduction to ${name}`, objectives: ["Core Concepts", "Standard Library", "Development Flow"] },
                { title: "Best Practices", objectives: ["Clean Code", "Optimized Thinking", "Common Design Patterns"] }
            ]
        }
    ]
});

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseName = urlParams.get('name') || 'Python';
    
    // Load Course Data
    let course = COURSE_DATA[courseName] || DEFAULT_COURSE(courseName);
    renderCourse(courseName, course);

    // Initial State: Load Topic 1 of Module 1
    if (course.modules && course.modules[0] && course.modules[0].topics && course.modules[0].topics[0]) {
        renderTopic(0, 0, course);
    }
});

function renderCourse(name, course) {
    document.getElementById('course-breadcrumb').innerText = name;
    document.getElementById('course-title').innerText = course.title;
    document.getElementById('course-description').innerText = course.description;
    document.getElementById('course-icon').className = `bi ${course.icon} display-1 text-primary`;
    
    const moduleList = document.getElementById('module-list');
    moduleList.innerHTML = '';

    course.modules.forEach((mod, modIdx) => {
        const div = document.createElement('div');
        div.className = `module-card p-3 ${modIdx === 0 ? 'active' : ''}`;
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <h6 class="fw-bold mb-0">Module ${modIdx + 1}: ${mod.name}</h6>
                <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill">${mod.topics.length} Topics</span>
            </div>
        `;
        div.onclick = () => {
            document.querySelectorAll('.module-card').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
            renderTopic(modIdx, 0, course);
        };
        moduleList.appendChild(div);
    });
    
    document.getElementById('course-modules-count').innerText = `${course.modules.length} Modules`;
}

function renderTopic(modIdx, topicIdx, course) {
    const topic = course.modules[modIdx].topics[topicIdx];
    document.getElementById('module-label').innerText = `MODULE ${modIdx + 1}`;
    document.getElementById('topic-title').innerText = topic.title;
    
    // Render Objectives
    const objContainer = document.getElementById('topic-objectives');
    objContainer.innerHTML = topic.objectives.map((obj, i) => `
        <div class="d-flex align-items-center mb-2">
            <span class="badge-step">${i + 1}</span>
            <span class="fw-500">${obj}</span>
        </div>
    `).join('');

    // Render Sub-topics (List)
    const topicList = document.getElementById('topic-list');
    topicList.innerHTML = '';
    course.modules[modIdx].topics.forEach((t, i) => {
        const div = document.createElement('div');
        div.className = 'topic-list-item';
        div.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-circle-fill text-primary me-3" style="font-size: 0.5rem;"></i>
                <span class="fw-600">${t.title}</span>
            </div>
            ${i === topicIdx ? '<span class="badge bg-primary">Viewing</span>' : '<i class="bi bi-play-circle text-muted"></i>'}
        `;
        div.onclick = () => renderTopic(modIdx, i, course);
        topicList.appendChild(div);
    });

    // Update Study Buttons
    document.getElementById('btn-generate-revision').onclick = () => startStudy(topic.title);
    document.getElementById('btn-study-all').onclick = () => startStudy(course.modules[modIdx].name);
}

async function startStudy(topic) {
    // Redirect immediately to results.html with the topic as a query param
    // This makes the UI feel much faster than waiting on the current page
    window.location.href = `results.html?topic=${encodeURIComponent(topic)}`;
}
