// Enhanced Production Logic for SmartRevise AI

document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if (themeIcon) {
            themeIcon.classList.replace('bi-moon', 'bi-sun');
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const isDark = body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');

            // Update icon
            if (themeIcon) {
                if (isDark) {
                    themeIcon.classList.replace('bi-moon', 'bi-sun');
                } else {
                    themeIcon.classList.replace('bi-sun', 'bi-moon');
                }
            }
        });
    }

    console.log('🚀 SmartRevise AI Production Mode Active');

    // Stats Animation
    const animateStats = () => {
        const stats = document.querySelectorAll('.stat-number');
        stats.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            if (isNaN(target)) return;
            let current = 0;
            const increment = target / 50;
            const updateStat = () => {
                if (current < target) {
                    current += increment;
                    stat.innerText = Math.round(current) + (stat.getAttribute('data-suffix') || '');
                    setTimeout(updateStat, 20);
                } else {
                    stat.innerText = target + (stat.getAttribute('data-suffix') || '');
                }
            };
            updateStat();
        });
    };

    if (document.querySelector('.stat-number')) {
        animateStats();
    }

    // AI Revision Generation from Topic
    const topicForm = document.getElementById('topic-form');
    if (topicForm) {
        topicForm.addEventListener('submit', function (e) {
            e.preventDefault();
            
            const topic = e.target.querySelector('input[type="text"]').value;
            const language = e.target.querySelectorAll('select')[0].value || 'Universal';
            const difficulty = e.target.querySelectorAll('select')[1].value || 'Intermediate';

            if (!topic) {
                showToast('Please enter a topic', 'warning');
                return;
            }

            // Redirect immediately to results.html with all parameters
            const params = new URLSearchParams({
                topic,
                language,
                difficulty
            });
            window.location.href = `results.html?${params.toString()}`;
        });
    }

    // PDF Upload Real Implementation
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.querySelector('.upload-area');

    if (fileInput && uploadArea) {
        fileInput.addEventListener('change', async function () {
            if (this.files.length > 0) {
                const file = this.files[0];
                const maxSize = 100 * 1024 * 1024; // 100MB

                if (!file.name.toLowerCase().endsWith('.pdf')) {
                    showToast('Only PDF files are supported.', 'danger');
                    return;
                }

                if (file.size > maxSize) {
                    showToast('File too large! Max limit is 100MB.', 'danger');
                    this.value = '';
                    return;
                }

                const formData = new FormData();
                formData.append('file', file);

                // Show progress bar
                if (uploadArea) {
                    uploadArea.innerHTML = `
                        <div class="text-center w-100">
                            <i class="bi bi-file-earmark-pdf text-danger display-4 mb-3"></i>
                            <h6>Analyzing: ${file.name}</h6>
                            <div class="progress mt-3 mx-auto" style="width: 80%">
                                <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 100%"></div>
                            </div>
                            <p class="small text-muted mt-2">Extracting text and generating revision...</p>
                        </div>
                    `;
                }

                try {
                    const response = await fetch("http://127.0.0.1:5050/api/upload", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${localStorage.getItem('token')}`
                        },
                        body: formData
                    });

                    if (response.ok) {
                        const data = await response.json();
                        sessionStorage.setItem('last_revision_data', JSON.stringify({
                            topic: `PDF: ${file.name}`,
                            language: 'Universal',
                            difficulty: 'Intermediate',
                            ai_content: data.ai_content
                        }));
                        showToast('PDF Analyzed Successfully!', 'success');
                        setTimeout(() => window.location.href = 'results.html', 1000);
                    } else {
                        const error = await response.json();
                        showToast(error.message || 'File upload failed', 'danger');
                        // Restore upload area if failed
                        location.reload();
                    }
                } catch (error) {
                    console.error("Upload error:", error);
                    showToast('Server connection failed.', 'danger');
                }
            }
        });
    }

    // Toast Notification System is now handled by js/notifications.js
    // for enhanced persistence and UI features.

    // Tooltip Initialization
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    // Save for later interaction (Mock version removed to prevent conflict with backend results.html save logic)

    // Dashboard Recent Revisions Logic (Cloud Sync)
    const revisionsTableBody = document.getElementById('revisions-table-body');
    if (revisionsTableBody) {
        const loadRecentRevisions = async () => {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!token || !user.id) return;

            revisionsTableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div></td></tr>`;

            try {
                const response = await fetch(`http://127.0.0.1:5050/api/revision/user/${user.id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (response.ok) {
                    const savedRevisions = await response.json();

                    if (savedRevisions.length === 0) {
                        revisionsTableBody.innerHTML = `
                            <tr>
                                <td colspan="4" class="text-center py-4 text-muted">
                                    <i class="bi bi-journal-x display-6 mb-2 d-block"></i>
                                    No cloud revisions found.
                                </td>
                            </tr>
                        `;
                        return;
                    }

                    if (savedRevisions.length > 0) {
                        // Update Dashboard Stats
                        const totalRevisionsElem = document.querySelector('[data-target="15"]'); // Total Revisions
                        const avgAccuracyElem = document.querySelector('[data-target="92"]'); // Avg Accuracy

                        if (totalRevisionsElem) {
                            totalRevisionsElem.setAttribute('data-target', savedRevisions.length);
                            totalRevisionsElem.innerText = savedRevisions.length;
                        }

                        const avgAcc = Math.round(savedRevisions.reduce((acc, rev) => acc + parseInt(rev.accuracy || 0), 0) / savedRevisions.length);
                        if (avgAccuracyElem) {
                            avgAccuracyElem.setAttribute('data-target', avgAcc);
                            avgAccuracyElem.innerText = avgAcc + '%';
                        }
                    }

                    revisionsTableBody.innerHTML = savedRevisions.slice(0, 10).map(rev => `
                        <tr>
                            <td class="ps-4">
                                <div class="fw-bold">${rev.topic}</div>
                                <div class="small text-muted">${rev.language} • Cloud Saved</div>
                            </td>
                            <td class="small">${new Date(rev.created_at).toLocaleDateString()}</td>
                            <td><span class="badge bg-success bg-opacity-10 text-success px-3">${rev.accuracy}</span></td>
                            <td class="text-end pe-4">
                                <button onclick="viewRevision('${rev.id}')" class="btn btn-link btn-sm p-0"><i class="bi bi-eye h5"></i></button>
                            </td>
                        </tr>
                    `).join('');
                }
            } catch (err) {
                console.error("Dashboard fetch error", err);
            }
        };
        loadRecentRevisions();
    }

    // Hero Search Typewriter Animation
    const heroSearch = document.getElementById('heroSearchInput');
    if (heroSearch) {
        const placeholders = [
            "Search our tutorials, e.g. HTML",
            "Master the web, e.g. CSS",
            "Build logic, e.g. JavaScript",
            "Engineer the future, e.g. Python",
            "SmartRevise AI: Learn Faster"
        ];
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typeSpeed = 100;

        const type = () => {
            const currentWord = placeholders[wordIndex];
            const displayedText = isDeleting
                ? currentWord.substring(0, charIndex--)
                : currentWord.substring(0, charIndex++);

            heroSearch.setAttribute('placeholder', displayedText);

            if (!isDeleting && charIndex === currentWord.length + 1) {
                isDeleting = true;
                typeSpeed = 2000;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % placeholders.length;
                typeSpeed = 500;
            } else {
                typeSpeed = isDeleting ? 40 : 80;
            }

            setTimeout(type, typeSpeed);
        };
        type();

        // Hero Search Functionality
        const heroSearchBtn = document.querySelector('.hero-search-btn');
        if (heroSearchBtn) {
            const handleSearch = () => {
                const topic = heroSearch.value.trim();
                if (topic) {
                    // Redirect immediately to results.html with the topic as a query param
                    window.location.href = `results.html?topic=${encodeURIComponent(topic)}`;
                } else {
                    if (typeof window.showToast === 'function') {
                        window.showToast('Please enter a topic to search.', 'warning');
                    } else {
                        alert('Please enter a topic to search.');
                    }
                }
            };

            heroSearchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleSearch();
            });

            heroSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                }
            });
        }
    }


    const updateStreakDisplay = () => {
        const streakCard = document.getElementById('streak-card');
        const streakCountElem = document.getElementById('streak-count');
        const streakMotiveElem = document.getElementById('streak-motive');

        if (!streakCard || !streakCountElem || !streakMotiveElem) return;

        // Fetch user data from localStorage (set during login)
        const userStr = localStorage.getItem('user');
        let streak = 0;

        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                // current_streak defaults to 1 for a new registration or 0 if missing
                streak = user.current_streak || 0;
            } catch (e) {
                console.error("Error parsing user data for streak", e);
            }
        }

        streakCountElem.textContent = streak;

        if (streak === 0) {
            streakMotiveElem.textContent = "Start learning today!";
            streakCountElem.textContent = "0";
            streakCard.classList.remove('streak-gold');
        } else if (streak >= 7) {
            streakCard.classList.add('streak-gold');
            streakMotiveElem.textContent = "Master status reached! 🔥 Keep it up!";
        } else {
            streakMotiveElem.textContent = "Keep it up!";
            streakCard.classList.remove('streak-gold');
        }
    };

    const injectChatbot = () => {
        if (document.querySelector('.fab')) return;

        const chatbotHtml = `
            <a href="chat.html" class="fab text-decoration-none" title="Chat with Nexus AI" style="display: flex; align-items: center; justify-content: center;">
                <i class="bi bi-robot fs-3 text-white"></i>
            </a>
        `;

        const container = document.createElement('div');
        container.innerHTML = chatbotHtml;
        document.body.appendChild(container);
    };

    // Global View Revision function
    window.viewRevision = async (id) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`http://127.0.0.1:5050/api/revision/${id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                const rev = await response.json();
                let aiContent;

                try {
                    aiContent = JSON.parse(rev.notes);
                } catch (e) {
                    aiContent = { notes: rev.notes, mcqs: [], coding_question: {} };
                }

                sessionStorage.setItem('last_revision_data', JSON.stringify({
                    topic: rev.topic,
                    language: rev.language,
                    difficulty: rev.difficulty,
                    ai_content: aiContent
                }));
                window.location.href = 'results.html';
            } else {
                showToast("Could not retrieve revision data.", "danger");
            }
        } catch (error) {
            console.error("View error:", error);
            showToast("Connection error occurred while viewing.", "danger");
        }
    };

    updateStreakDisplay();
    injectChatbot();
});

// Global Quick Start Revision function (placed outside DOMContentLoaded for global access)
window.quickStartRevision = async function (topic) {
    // Redirect immediately to results.html with the topic as a query param
    // This makes the UI feel much faster than waiting on the current page
    window.location.href = `results.html?topic=${encodeURIComponent(topic)}`;
};
