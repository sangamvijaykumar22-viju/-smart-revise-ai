/**
 * notifications.js - Premium Notification System for SmartRevise AI
 * Features:
 *   1. Toast Notifications (Enhanced)
 *   2. Upcoming Session Countdown Alert
 *   3. Spaced Repetition Revision Nudge
 *   4. Streak Milestone Confetti Blast
 *   5. NEW: Notification Center Dropdown & Persistence
 */

document.addEventListener('DOMContentLoaded', () => {

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;

    // ===================================================================
    // 0. NOTIFICATION STATE & PERSISTENCE
    // ===================================================================
    let notifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');

    window.saveNotification = function(title, message, type = 'info', icon = 'bi-bell', link = null) {
        const newNotif = {
            id: 'notif-' + Date.now(),
            title,
            message,
            type,
            icon,
            link,
            timestamp: new Date().toISOString(),
            read: false
        };
        notifications.unshift(newNotif);
        // Keep only last 20 notifications
        notifications = notifications.slice(0, 20);
        localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
        renderNotificationDropdown();
        updateNotificationBadge();
    };

    function updateNotificationBadge() {
        const unreadCount = notifications.filter(n => !n.read).length;
        const badges = document.querySelectorAll('.notification-badge');
        badges.forEach(badge => {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                badge.classList.remove('d-none');
            } else {
                badge.classList.add('d-none');
            }
        });
    }

    function markAllAsRead() {
        notifications.forEach(n => n.read = true);
        localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
        updateNotificationBadge();
        renderNotificationDropdown();
    }

    // ===================================================================
    // 1. TOAST SYSTEM (Enhanced)
    // ===================================================================
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    window.showToast = (message, type = 'primary') => {
        const id = 'toast-' + Date.now();
        const iconMap = {
            'success': 'bi-check-circle-fill',
            'danger': 'bi-exclamation-octagon-fill',
            'warning': 'bi-exclamation-triangle-fill',
            'info': 'bi-info-circle-fill',
            'primary': 'bi-bell-fill'
        };
        const icon = iconMap[type] || 'bi-info-circle-fill';
        
        const toastHtml = `
            <div id="${id}" class="toast align-items-center text-white bg-${type} border-0 shadow-lg mb-2" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex p-2">
                    <div class="toast-body d-flex align-items-center gap-2">
                        <i class="bi ${icon} fs-5"></i>
                        <div class="fw-600">${message}</div>
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        const container = document.getElementById('toast-container');
        container.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(id);
        const toast = new bootstrap.Toast(toastElement, { delay: 4000 });
        toast.show();
        
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });

        // Save to notification center too
        saveNotification(type.charAt(0).toUpperCase() + type.slice(1), message, type, icon);
    };

    // ===================================================================
    // INJECT NOTIFICATION CSS
    // ===================================================================
    const notifStyles = document.createElement('style');
    notifStyles.textContent = `
        /* === NOTIFICATION CENTER DROPDOWN === */
        .notification-dropdown {
            width: 350px;
            max-height: 500px;
            overflow-y: auto;
            border-radius: 16px;
            border: none !important;
            box-shadow: 0 15px 50px rgba(0,0,0,0.2) !important;
            padding: 0 !important;
            margin-top: 10px !important;
            animation: dropdownFadeIn 0.3s ease;
        }
        @keyframes dropdownFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .notification-header {
            padding: 16px 20px;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: white;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        .notification-item {
            padding: 15px 20px;
            border-bottom: 1px solid #f8fafc;
            display: flex;
            gap: 15px;
            transition: all 0.2s;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
        }
        .notification-item:hover {
            background-color: #f8fafc;
        }
        .notification-item.unread {
            background-color: #f0f4ff;
        }
        .notification-item.unread:hover {
            background-color: #e5edff;
        }
        .notif-icon {
            width: 40px; height: 40px;
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            font-size: 1.2rem;
        }
        .notif-content { flex-grow: 1; }
        .notif-title { font-weight: 700; font-size: 0.9rem; margin-bottom: 2px; color: #1e293b; }
        .notif-msg { font-size: 0.82rem; color: #64748b; line-height: 1.4; }
        .notif-time { font-size: 0.7rem; color: #94a3b8; margin-top: 4px; }
        .notification-badge {
            font-size: 0.65rem;
            padding: 2px 5px;
            min-width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
        }

        /* === UPCOMING SESSION ALERT === */
        .session-alert-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(6px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: alertFadeIn 0.4s ease;
        }
        .session-alert-card {
            background: white;
            border-radius: 28px;
            padding: 40px 36px;
            max-width: 440px;
            width: 90%;
            text-align: center;
            box-shadow: 0 30px 80px rgba(0,0,0,0.2);
            animation: alertSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .session-alert-icon {
            width: 70px; height: 70px;
            border-radius: 20px;
            display: flex; align-items: center; justify-content: center;
            font-size: 2rem; color: white;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
            box-shadow: 0 12px 30px rgba(245, 158, 11, 0.35);
        }
        .session-alert-title {
            font-size: 1.3rem; font-weight: 800; color: #1e293b;
            margin-bottom: 6px;
        }
        .session-alert-topic {
            font-size: 1.05rem; font-weight: 600; color: #6366f1;
            margin-bottom: 16px;
        }
        .session-countdown {
            font-size: 2.8rem; font-weight: 900;
            letter-spacing: -2px;
            background: linear-gradient(135deg, #f59e0b, #ef4444);
            -webkit-background-clip: text; background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 6px;
        }
        .session-countdown-label {
            font-size: 0.75rem; font-weight: 700;
            text-transform: uppercase; letter-spacing: 1px;
            color: #94a3b8;
            margin-bottom: 28px;
        }
        .session-alert-actions {
            display: flex; gap: 12px; justify-content: center;
        }
        .btn-session-start {
            background: linear-gradient(135deg, #6366f1, #a855f7);
            color: white; border: none;
            padding: 12px 32px; border-radius: 14px;
            font-weight: 800; font-size: 0.95rem;
            box-shadow: 0 8px 20px rgba(99,102,241,0.3);
            cursor: pointer; transition: all 0.2s;
        }
        .btn-session-start:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(99,102,241,0.4); }
        .btn-session-snooze {
            background: #f1f5f9; color: #64748b; border: none;
            padding: 12px 24px; border-radius: 14px;
            font-weight: 700; font-size: 0.95rem;
            cursor: pointer; transition: all 0.2s;
        }
        .btn-session-snooze:hover { background: #e2e8f0; }

        /* === STREAK CONFETTI === */
        .confetti-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 10001;
            pointer-events: none;
        }
        .confetti-piece {
            position: absolute;
            width: 10px; height: 10px;
            opacity: 0;
            animation: confettiFall linear forwards;
        }
        .streak-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(8px);
            z-index: 10002;
            display: flex; align-items: center; justify-content: center;
            animation: alertFadeIn 0.5s ease;
        }
        .streak-modal-card {
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);
            border-radius: 32px;
            padding: 50px 40px;
            max-width: 420px; width: 90%;
            text-align: center;
            color: white;
            box-shadow: 0 40px 100px rgba(0,0,0,0.4);
            animation: alertSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: relative;
            overflow: hidden;
        }
        /* ... rest of your styles ... */
        @keyframes alertFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes alertSlideIn { from { opacity: 0; transform: scale(0.85) translateY(30px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes confettiFall { 0% { opacity: 1; transform: translateY(-20px) rotate(0deg); } 100% { opacity: 0; transform: translateY(100vh) rotate(720deg); } }
    `;
    document.head.appendChild(notifStyles);

    // ===================================================================
    // RENDER NOTIFICATION CENTER UI
    // ===================================================================
    function renderNotificationDropdown() {
        const dropdownWrappers = document.querySelectorAll('.notification-wrapper');
        
        dropdownWrappers.forEach(wrapper => {
            let listHtml = '';
            if (notifications.length === 0) {
                listHtml = `
                    <div class="text-center py-5">
                        <i class="bi bi-bell-slash text-muted display-6 d-block mb-2"></i>
                        <p class="text-muted small">No notifications yet</p>
                    </div>
                `;
            } else {
                listHtml = notifications.map(n => {
                    const timeAgo = formatTimeAgo(new Date(n.timestamp));
                    const bgColor = {
                        'success': 'bg-success bg-opacity-10 text-success',
                        'danger': 'bg-danger bg-opacity-10 text-danger',
                        'warning': 'bg-warning bg-opacity-10 text-warning',
                        'info': 'bg-info bg-opacity-10 text-info',
                        'primary': 'bg-primary bg-opacity-10 text-primary'
                    }[n.type] || 'bg-primary bg-opacity-10 text-primary';

                    const clickAction = n.link ? 
                        (n.link.startsWith('action:') ? 
                            `handleNotifAction("${n.link}")` : 
                            `window.location.href="${n.link}"`) : 
                        '';

                    return `
                        <div class="notification-item ${n.read ? '' : 'unread'}" 
                             onclick="event.stopPropagation(); markRead('${n.id}'); ${clickAction}">
                            <div class="notif-icon ${bgColor}">
                                <i class="bi ${n.icon}"></i>
                            </div>
                            <div class="notif-content">
                                <div class="notif-title">${n.title}</div>
                                <div class="notif-msg">${n.message}</div>
                                <div class="notif-time">${timeAgo}</div>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            wrapper.innerHTML = `
                <div class="notification-header">
                    <span class="fw-800 text-dark">Notifications</span>
                    <button class="btn btn-link btn-sm text-primary text-decoration-none fw-700 p-0" id="mark-all-read">Mark all as read</button>
                </div>
                <div class="notification-list">
                    ${listHtml}
                </div>
                ${notifications.length > 0 ? `
                <div class="p-2 border-top text-center">
                    <button class="btn btn-link btn-sm text-secondary text-decoration-none small" id="clear-all-notifs">Clear All</button>
                </div>` : ''}
            `;

            const markReadBtn = wrapper.querySelector('#mark-all-read');
            if (markReadBtn) markReadBtn.onclick = (e) => {
                e.stopPropagation();
                markAllAsRead();
            };

            const clearBtn = wrapper.querySelector('#clear-all-notifs');
            if (clearBtn) clearBtn.onclick = (e) => {
                e.stopPropagation();
                notifications = [];
                localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
                updateNotificationBadge();
                renderNotificationDropdown();
            };
        });
    }

    window.markRead = (id) => {
        const notif = notifications.find(n => n.id === id);
        if (notif) notif.read = true;
        localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
        updateNotificationBadge();
        renderNotificationDropdown();
    };

    window.handleNotifAction = (actionStr) => {
        const [action, query] = actionStr.replace('action:', '').split('?');
        const params = new URLSearchParams(query || "");
        
        if (action === 'quickStartRevision') {
            const topic = params.get('topic');
            if (topic && window.quickStartRevision) {
                window.quickStartRevision(topic);
            }
        }
    };

    function formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return minutes + 'm ago';
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return hours + 'h ago';
        return Math.floor(hours / 24) + 'd ago';
    }

    function initBellIcons() {
        // Target any element with title="Notifications" or class "notification-bell"
        const bellButtons = document.querySelectorAll('[title="Notifications"], .notification-bell');
        
        bellButtons.forEach(btn => {
            btn.classList.add('dropdown-toggle');
            btn.setAttribute('data-bs-toggle', 'dropdown');
            btn.setAttribute('aria-expanded', 'false');
            
            // Notification Badge
            let badge = btn.querySelector('.notification-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger notification-badge d-none';
                btn.appendChild(badge);
            }

            // Notification Dropdown Menu
            let menu = btn.nextElementSibling;
            if (!menu || !menu.classList.contains('notification-dropdown')) {
                menu = document.createElement('div');
                menu.className = 'dropdown-menu dropdown-menu-end notification-dropdown notification-wrapper';
                btn.after(menu);
            }
        });
        
        renderNotificationDropdown();
        updateNotificationBadge();
    }

    initBellIcons();

    // ===================================================================
    // UPCOMING SESSION LOGIC
    // ===================================================================
    let snoozedTasks = JSON.parse(sessionStorage.getItem('snoozed_tasks') || '[]');
    let alertShowing = false;
    let sessionValid = true;

    async function checkUpcomingSessions() {
        if (!token || !userId || alertShowing || !sessionValid) return;
        try {
            const todayISO = new Date().toISOString().split('T')[0];
            const resp = await fetch(`http://127.0.0.1:5050/api/planner/${userId}?date=${todayISO}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (resp.status === 401) {
                console.warn("[Session] Token expired or invalid. Redirecting to login.");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }

            if (resp.ok) {
                const tasks = await resp.json();
                const now = new Date();
                for (const task of tasks) {
                    if (task.completed || snoozedTasks.includes(task.id)) continue;
                    const [h, m] = task.time.split(':').map(Number);
                    const taskTime = new Date(); taskTime.setHours(h, m, 0, 0);
                    const diffMs = taskTime - now;
                    const diffMin = diffMs / 60000;
                    if (diffMin > 0 && diffMin <= 5) { showSessionAlert(task, diffMs); break; }
                }
            }
        } catch (e) {}
    }

    function showSessionAlert(task, initialDiffMs) {
        alertShowing = true;
        let remainingMs = initialDiffMs;
        const overlay = document.createElement('div');
        overlay.className = 'session-alert-overlay';
        overlay.id = 'session-alert';
        overlay.innerHTML = `
            <div class="session-alert-card">
                <div class="session-alert-icon"><i class="bi bi-alarm"></i></div>
                <div class="session-alert-title">Upcoming Study Session</div>
                <div class="session-alert-topic">${task.title}</div>
                <div class="session-countdown" id="session-countdown-time">--:--</div>
                <div class="session-countdown-label">starts in</div>
                <div class="session-alert-actions">
                    <button class="btn-session-start" id="btn-session-start"><i class="bi bi-play-fill me-1"></i> Start Now</button>
                    <button class="btn-session-snooze" id="btn-session-snooze">Snooze 5 min</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        saveNotification('Study Reminder', `Upcoming session: ${task.title}`, 'warning', 'bi-alarm', 'planner.html');

        const countdownEl = document.getElementById('session-countdown-time');
        const countdownInterval = setInterval(() => {
            remainingMs -= 1000;
            if (remainingMs <= 0) { clearInterval(countdownInterval); dismissSessionAlert(); return; }
            const mins = Math.floor(remainingMs / 60000);
            const secs = Math.floor((remainingMs % 60000) / 1000);
            countdownEl.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
        }, 1000);

        document.getElementById('btn-session-start').onclick = () => { 
            clearInterval(countdownInterval); 
            
            // Persist that this task has been acted upon for this session
            snoozedTasks.push(task.id); 
            sessionStorage.setItem('snoozed_tasks', JSON.stringify(snoozedTasks));
            
            // Mark the reminder as read so the badge disappears
            const reminder = notifications.find(n => n.title === 'Study Reminder' && n.message.includes(task.title));
            if (reminder) {
                reminder.read = true;
                localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
                updateNotificationBadge();
                renderNotificationDropdown();
            }
            
            dismissSessionAlert(); 
            window.location.href = 'planner.html'; 
        };
        document.getElementById('btn-session-snooze').onclick = () => { 
            clearInterval(countdownInterval); 
            
            // Persist snooze state
            snoozedTasks.push(task.id); 
            sessionStorage.setItem('snoozed_tasks', JSON.stringify(snoozedTasks)); 
            
            // Mark the reminder as read so the badge disappears
            const reminder = notifications.find(n => n.title === 'Study Reminder' && n.message.includes(task.title));
            if (reminder) {
                reminder.read = true;
                localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
                updateNotificationBadge();
                renderNotificationDropdown();
            }
            
            dismissSessionAlert(); 
        };
    }

    function dismissSessionAlert() {
        const el = document.getElementById('session-alert');
        if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }
        alertShowing = false;
    }

    if (token && userId) {
        checkUpcomingSessions();
        setInterval(checkUpcomingSessions, 30000);
    }

    // ===================================================================
    // 3. SPACED REPETITION REVISION NUDGE
    // ===================================================================
    async function checkSpacedRepetition() {
        if (!token || !userId || !sessionValid) return;
        const nudgeShown = sessionStorage.getItem('nudge_shown_today');
        if (nudgeShown) return;

        try {
            const resp = await fetch(`http://127.0.0.1:5050/api/revision/user/${userId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (resp.status === 401) {
                sessionValid = false;
                return;
            }

            if (resp.ok) {
                const revisions = await resp.json();
                const now = new Date();
                const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
                const staleRevisions = revisions.filter(rev => new Date(rev.created_at) < threeDaysAgo)
                                                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

                if (staleRevisions.length > 0) {
                    const stalest = staleRevisions[0];
                    const daysAgo = Math.floor((now - new Date(stalest.created_at)) / (1000 * 60 * 60 * 24));
                    setTimeout(() => showRevisionNudge(stalest, daysAgo), 3000);
                }
            }
        } catch (e) {}
    }

    function showRevisionNudge(revision, daysAgo) {
        const nudge = document.createElement('div');
        nudge.className = 'nudge-container';
        nudge.id = 'revision-nudge';
        nudge.innerHTML = `
            <div class="nudge-card">
                <button class="nudge-close" id="nudge-close-btn">&times;</button>
                <div class="nudge-header">
                    <span class="nudge-brain">🧠</span>
                    <div>
                        <div class="nudge-title">Time to Revisit!</div>
                        <div class="nudge-subtitle">Spaced Repetition</div>
                    </div>
                </div>
                <div class="nudge-body">
                    You haven't practiced <span class="nudge-topic-name">"${revision.topic}"</span> in <strong>${daysAgo} days</strong>.
                </div>
                <div class="nudge-science">📊 Studies show reviewing now boosts retention by up to 60%.</div>
                <div class="nudge-actions">
                    <button class="btn-nudge-revise" id="btn-nudge-revise">Revise Now →</button>
                    <button class="btn-nudge-later" id="btn-nudge-later">Later</button>
                </div>
            </div>
        `;
        document.body.appendChild(nudge);
        sessionStorage.setItem('nudge_shown_today', 'true');
        saveNotification('Revision Nudge', `Time to revisit "${revision.topic}"!`, 'info', 'bi-brain', `action:quickStartRevision?topic=${encodeURIComponent(revision.topic)}`);

        document.getElementById('btn-nudge-revise').onclick = () => {
            const reminder = notifications.find(n => n.title === 'Revision Nudge' && n.message.includes(revision.topic));
            if (reminder) {
                reminder.read = true;
                localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
                updateNotificationBadge();
                renderNotificationDropdown();
            }
            window.location.href = `saved-revisions.html`;
        };
        document.getElementById('btn-nudge-later').onclick = () => {
            const reminder = notifications.find(n => n.title === 'Revision Nudge' && n.message.includes(revision.topic));
            if (reminder) {
                reminder.read = true;
                localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
                updateNotificationBadge();
                renderNotificationDropdown();
            }
            dismissNudge();
        };
        document.getElementById('nudge-close-btn').onclick = () => {
            const reminder = notifications.find(n => n.title === 'Revision Nudge' && n.message.includes(revision.topic));
            if (reminder) {
                reminder.read = true;
                localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
                updateNotificationBadge();
                renderNotificationDropdown();
            }
            dismissNudge();
        };
    }

    function dismissNudge() {
        const el = document.getElementById('revision-nudge');
        if (el) { el.style.opacity = '0'; el.style.transform = 'translateX(-40px)'; setTimeout(() => el.remove(), 400); }
    }

    if (token && userId) setTimeout(checkSpacedRepetition, 2000);

    // ===================================================================
    // 4. STREAK MILESTONE CONFETTI BLAST
    // ===================================================================
    function checkStreakMilestone() {
        if (!user || !user.current_streak) return;
        const streak = user.current_streak;
        const milestones = [3, 7, 14, 21, 30, 50, 100];
        if (!milestones.includes(streak)) return;

        const lastCelebrated = localStorage.getItem('last_celebrated_streak');
        if (parseInt(lastCelebrated) === streak) return;
        localStorage.setItem('last_celebrated_streak', streak);

        setTimeout(() => {
            launchConfetti();
            showStreakModal(streak);
        }, 1500);
    }

    function launchConfetti() {
        const overlay = document.createElement('div');
        overlay.className = 'confetti-overlay';
        overlay.id = 'confetti-overlay';
        document.body.appendChild(overlay);
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
        for (let i = 0; i < 100; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.width = piece.style.height = `${Math.random() * 10 + 5}px`;
            piece.style.animationDuration = `${Math.random() * 3 + 2}s`;
            piece.style.animationDelay = `${Math.random() * 2}s`;
            overlay.appendChild(piece);
        }
        setTimeout(() => overlay.remove(), 5000);
    }

    function showStreakModal(streak) {
        const overlay = document.createElement('div');
        overlay.className = 'streak-modal-overlay';
        overlay.id = 'streak-modal';
        overlay.innerHTML = `
            <div class="streak-modal-card">
                <span class="streak-fire">🔥🔥🔥</span>
                <div class="streak-modal-count">${streak}</div>
                <div class="streak-modal-label">Day Streak!</div>
                <button class="btn-streak-dismiss" id="btn-streak-dismiss">Keep Going 💪</button>
            </div>
        `;
        document.body.appendChild(overlay);
        saveNotification('Milestone Achieved!', `You reached a ${streak}-day streak! 🔥`, 'success', 'bi-trophy-fill', 'dashboard.html');
        document.getElementById('btn-streak-dismiss').onclick = () => {
            overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 400);
        };
    }

    checkStreakMilestone();
});


