/**
 * planner.js - Premium Learning Planner Logic
 * Features: XP Calculation, Calendar Strip, Pomodoro (25/10/5), Task Management
 */

document.addEventListener('DOMContentLoaded', () => {
    // Session State
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;

    if (!token || !userId) {
        window.location.href = 'login.html';
        return;
    }

    // Elements - Profile & Stats
    const userNameDisplay = document.getElementById('userNameDisplay');
    const taskCountDisplay = document.getElementById('taskCount');
    const doneCountDisplay = document.getElementById('doneCount');
    const streakDisplay = document.getElementById('streakDisplay');
    const xpValDisplay = document.getElementById('xp-val');
    const xpNextDisplay = document.getElementById('xp-next');
    const xpFill = document.getElementById('xp-fill');
    const ringPercentDisplay = document.getElementById('ring-percent');
    const progressRingFill = document.getElementById('progress-ring-fill');

    // Elements - Schedule & Calendar
    const scheduleList = document.getElementById('scheduleList');
    const calendarStrip = document.getElementById('calendarStrip');
    const currentDateDisplay = document.getElementById('currentDateDisplay');
    const addTaskBtn = document.getElementById('add-task-btn');
    
    // Global State
    let selectedDate = getTodayISO();
    let currentFilter = 'all';
    let allTasks = [];
    let userXP = 25; // Default starts at 25 as per screenshot

    // --- INITIALIZATION ---
    function init() {
        if (userNameDisplay) userNameDisplay.textContent = `Hi, ${user.username || 'Student'}!`;
        if (streakDisplay) streakDisplay.textContent = `${user.current_streak || 1}🔥`;
        
        renderCalendarStrip();
        updateDateDisplay();
        fetchTasks();
        updateXPUI();
        syncTimerState();
        toggleAddTaskButton();
    }

    // --- HELPER: DATE FORMATTING ---
    function getTodayISO() {
        const d = new Date();
        return d.toISOString().split('T')[0];
    }

    function updateDateDisplay() {
        if (!currentDateDisplay) return;
        const d = new Date(selectedDate);
        currentDateDisplay.textContent = d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // --- CALENDAR STRIP LOGIC ---
    function renderCalendarStrip() {
        if (!calendarStrip) return;
        const today = new Date();
        calendarStrip.innerHTML = '';

        // Show 7 days: 3 before today, today, 3 after
        for (let i = -2; i <= 4; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            const iso = d.toISOString().split('T')[0];
            const active = iso === selectedDate ? 'active' : '';
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })[0];
            const dayNum = d.getDate();

            const dayEl = document.createElement('div');
            dayEl.className = `cal-day ${active}`;
            dayEl.innerHTML = `
                <span class="day-name">${dayName}</span>
                <span class="day-num">${dayNum}</span>
                <div class="dot"></div>
            `;
            dayEl.onclick = () => {
                selectedDate = iso;
                renderCalendarStrip();
                updateDateDisplay();
                toggleAddTaskButton();
                fetchTasks();
            };
            calendarStrip.appendChild(dayEl);
        }
    }

    function toggleAddTaskButton() {
        if (!addTaskBtn) return;
        const todayISO = new Date().toISOString().split('T')[0];
        if (selectedDate < todayISO) {
            addTaskBtn.style.display = 'none';
        } else {
            addTaskBtn.style.display = 'block';
        }
    }

    // --- XP & PROGRESS LOGIC ---
    function updateXPUI() {
        const doneCount = allTasks.filter(t => t.completed).length;
        // Logic: Base XP (25) + 25 XP per task done
        const totalXP = 25 + (doneCount * 25);
        const levelGoal = 100;
        
        if (xpValDisplay) xpValDisplay.textContent = totalXP;
        if (xpNextDisplay) xpNextDisplay.textContent = levelGoal;
        if (xpFill) {
            const percent = Math.min((totalXP / levelGoal) * 100, 100);
            xpFill.style.width = `${percent}%`;
        }

        // Progress Ring
        const totalTasks = allTasks.length;
        const percentDone = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
        if (ringPercentDisplay) ringPercentDisplay.textContent = `${percentDone}%`;
        if (progressRingFill) {
            const circumference = 326.7; // 2 * PI * 52
            const offset = circumference - (percentDone / 100) * circumference;
            progressRingFill.style.strokeDashoffset = offset;
        }

        if (taskCountDisplay) taskCountDisplay.textContent = totalTasks;
        if (doneCountDisplay) doneCountDisplay.textContent = doneCount;
    }

    // --- POMODORO TIMER (Persistent) ---
    let timerInterval;
    let timerSeconds = parseInt(localStorage.getItem('timer_seconds')) || 1500;
    let isTimerRunning = localStorage.getItem('timer_running') === 'true';
    let timerEndTime = parseInt(localStorage.getItem('timer_end_time')) || 0;

    function syncTimerState() {
        const startBtn = document.getElementById('timer-start-btn');
        if (isTimerRunning) {
            const remaining = Math.round((timerEndTime - Date.now()) / 1000);
            if (remaining <= 0) {
                timerSeconds = 0;
                stopTimerInternal(true);
            } else {
                timerSeconds = remaining;
                if (startBtn) startBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
                startIntervalInternal();
            }
        } else {
            if (startBtn) startBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
        }
        
        // Restore active mode UI
        const savedMode = localStorage.getItem('timer_mode') || '25';
        document.querySelectorAll('.timer-mode-btn').forEach(btn => {
            if (btn.innerText.includes(savedMode)) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        updateTimerDisplay();
    }

    function startIntervalInternal() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timerSeconds--;
            localStorage.setItem('timer_seconds', timerSeconds);
            updateTimerDisplay();
            if (timerSeconds <= 0) {
                stopTimerInternal(true);
            }
        }, 1000);
    }

    function stopTimerInternal(finished = false) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        localStorage.setItem('timer_running', 'false');
        
        const startBtn = document.getElementById('timer-start-btn');
        if (startBtn) startBtn.innerHTML = '<i class="bi bi-play-fill"></i>';

        if (finished) {
            if (typeof showToast === 'function') showToast("Focus session complete!", "success");
            try { new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-clock-beep-988.mp3').play(); } catch(e) {}
            
            const savedMode = localStorage.getItem('timer_mode') || '25';
            timerSeconds = parseInt(savedMode) * 60;
            localStorage.setItem('timer_seconds', timerSeconds);
            updateTimerDisplay();
        }
    }

    window.setTimerMode = function(minutes, btn) {
        stopTimerInternal();
        timerSeconds = minutes * 60;
        localStorage.setItem('timer_seconds', timerSeconds);
        localStorage.setItem('timer_mode', minutes);
        updateTimerDisplay();
        
        document.querySelectorAll('.timer-mode-btn').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
    };

    window.toggleTimer = function() {
        if (isTimerRunning) {
            stopTimerInternal();
        } else {
            isTimerRunning = true;
            timerEndTime = Date.now() + (timerSeconds * 1000);
            localStorage.setItem('timer_running', 'true');
            localStorage.setItem('timer_end_time', timerEndTime);
            
            const startBtn = document.getElementById('timer-start-btn');
            if (startBtn) startBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
            
            startIntervalInternal();
        }
    };

    window.resetTimer = function() {
        stopTimerInternal();
        const savedMode = localStorage.getItem('timer_mode') || '25';
        timerSeconds = parseInt(savedMode) * 60;
        localStorage.setItem('timer_seconds', timerSeconds);
        updateTimerDisplay();
    };

    function updateTimerDisplay() {
        const m = Math.floor(timerSeconds / 60);
        const s = timerSeconds % 60;
        const display = document.getElementById('timer-display');
        if (display) display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    // --- FILTERING ---
    window.filterTasks = function(filter, btn) {
        currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTaskList();
    };

    // --- API & RENDERING ---
    const fetchTasks = async () => {
        try {
            const resp = await fetch(`(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : 'https://smart-revise-ai-m3u6.onrender.com') + `/api/planner/${userId}?date=${selectedDate}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (resp.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }

            if (resp.ok) {
                allTasks = await resp.json();
                renderTaskList();
                updateXPUI();
            }
        } catch (e) {
            console.error(e);
        }
    };

    function renderTaskList() {
        if (!scheduleList) return;

        let filtered = [...allTasks];
        // Strict separation: Completed tasks ONLY show in 'done' filter
        if (currentFilter === 'all') filtered = allTasks.filter(t => !t.completed);
        if (currentFilter === 'pending') filtered = allTasks.filter(t => !t.completed);
        if (currentFilter === 'done') filtered = allTasks.filter(t => t.completed);

        if (filtered.length === 0) {
            scheduleList.innerHTML = `
                <div class="empty-planner">
                    <div class="empty-icon-emoji">📭</div>
                    <h5 class="fw-bold text-secondary">No sessions scheduled.</h5>
                    <p class="text-muted small">Click "Add Schedule Slot" to plan your first study session!</p>
                </div>
            `;
            return;
        }

        scheduleList.innerHTML = filtered.sort((a, b) => a.time.localeCompare(b.time)).map(t => {
            const subClass = getSubjectClass(t.description || t.title);
            const [timeVal, ampm] = formatTimeExtended(t.time);
            return `
                <div class="schedule-slot-premium ${t.completed ? 'completed' : ''}">
                    <div class="task-time-sidebar">
                        <span class="time-main">${timeVal}</span>
                        <span class="time-sub">${ampm}</span>
                    </div>
                    
                    <div class="subject-icon-wrapper ${subClass}">
                        <i class="bi ${getIcon(t.title)}"></i>
                    </div>

                    <div class="task-info-main">
                        <h5 class="task-title-text">${t.title}</h5>
                        <p class="task-desc-text">${t.description || 'Focus study session'}</p>
                    </div>

                    <div class="task-action-btns">
                        <button class="action-btn-pill btn-check-task" onclick="toggleTask('${t.id}')">
                            <i class="bi ${t.completed ? 'bi-x' : 'bi-check'}"></i>
                        </button>
                        <button class="action-btn-pill btn-delete-task" onclick="deleteTask('${t.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function formatTimeExtended(t) {
        const [h, m] = t.split(':');
        const hh = parseInt(h);
        const ampm = hh >= 12 ? 'PM' : 'AM';
        const h12 = hh % 12 || 12;
        return [`${h12}:${m}`, ampm];
    }

    function formatTime(t) {
        const [h, m] = t.split(':');
        const hh = parseInt(h);
        return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
    }

    function getIcon(title) {
        const t = title.toLowerCase();
        if (t.includes('code') || t.includes('java')) return 'bi-code-square';
        if (t.includes('dbms') || t.includes('sql')) return 'bi-database-fill';
        if (t.includes('dsa') || t.includes('algo')) return 'bi-diagram-3-fill';
        return 'bi-journal-bookmark-fill';
    }

    function getSubjectClass(text) {
        const t = text.toLowerCase();
        if (t.includes('java')) return 'subj-java';
        if (t.includes('python')) return 'subj-python';
        if (t.includes('dsa')) return 'subj-dsa';
        if (t.includes('dbms')) return 'subj-dbms';
        return 'subj-default';
    }

    window.toggleTask = async (id) => {
        try {
            const resp = await fetch(`(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : 'https://smart-revise-ai-m3u6.onrender.com') + `/api/planner/${id}/toggle`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (resp.ok) fetchTasks();
        } catch (e) { console.error(e); }
    };

    window.deleteTask = async (id) => {
        if (!confirm("Remove this session?")) return;
        try {
            const resp = await fetch(`(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : 'https://smart-revise-ai-m3u6.onrender.com') + `/api/planner/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (resp.ok) fetchTasks();
        } catch (e) { console.error(e); }
    };

    // --- FORM SUBMISSION ---
    const scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const selectedTime = formData.get('time');
            const selectedDateVal = formData.get('date');
            const selectedTitle = formData.get('title');
            
            // Real-time validation: No past dates or times
            const now = new Date();
            const todayISO = now.toISOString().split('T')[0];
            
            // 1. Check if the date is in the past
            if (selectedDateVal < todayISO) {
                const errorMsg = "Cannot schedule sessions for past dates! ❌";
                if (typeof showToast === 'function') showToast(errorMsg, "danger");
                else alert(errorMsg);
                return;
            }

            // 2. If it's today, check if the time is in the past
            if (selectedDateVal === todayISO) {
                const [sHours, sMinutes] = selectedTime.split(':').map(Number);
                const currentHours = now.getHours();
                const currentMinutes = now.getMinutes();
                
                if (sHours < currentHours || (sHours === currentHours && sMinutes < currentMinutes)) {
                    const errorMsg = "Cannot schedule sessions in the past! ❌";
                    if (typeof showToast === 'function') showToast(errorMsg, "danger");
                    else alert(errorMsg);
                    return;
                }
            }

            const data = {
                date: selectedDateVal,
                time: selectedTime,
                title: selectedTitle,
                description: `Focus session for ${selectedTitle}`
            };

            const resp = await fetch("(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : 'https://smart-revise-ai-m3u6.onrender.com') + "/api/planner/add", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ ...data, user_id: userId })
            });

            if (resp.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }

            if (resp.ok) {
                if (typeof showToast === 'function') showToast("Slot Scheduled!", "success");
                e.target.reset();
                bootstrap.Modal.getInstance(document.getElementById('addTaskModal')).hide();
                fetchTasks();
            }
        });
    }

    const addTaskModal = document.getElementById('addTaskModal');
    if (addTaskModal) {
        addTaskModal.addEventListener('shown.bs.modal', () => {
            const dateInput = document.getElementById('modalDateHidden');
            const dateDisplay = document.getElementById('modalDatePicker');
            const timeInput = addTaskModal.querySelector('input[type="time"]');

            if (dateInput && dateDisplay) {
                dateInput.value = selectedDate;
                // Format for display: DD-MM-YYYY
                const [year, month, day] = selectedDate.split('-');
                dateDisplay.value = `${day}-${month}-${year}`;
            }

            if (timeInput) {
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                timeInput.value = `${hours}:${minutes}`;
            }
        });
    }

    // --- FLOATING CHAT ---
    const floatingBtn = document.querySelector('.floating-chat');
    if (floatingBtn) {
        floatingBtn.onclick = () => window.location.href = 'chat.html';
    }

    init();
});
