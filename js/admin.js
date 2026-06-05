/**
 * admin.js — SmartRevise AI Admin Portal
 * Handles authentication, data fetching, charts, and user management.
 */

const API_BASE = '(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : 'https://smart-revise-ai-m3u6.onrender.com') + '/api';
let currentUsersPage = 1;
let currentRevisionsPage = 1;
let currentUserSearch = '';   // global so pagination buttons can reference it
let currentDetailUserId = null;  // tracks which user's detail modal is open
let userSearchTimeout = null;
let registrationChart = null;
let topicsChart = null;

// ── Auth Helpers ──
function getToken() { return localStorage.getItem('token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } }

function checkAdminAccess() {
    const user = getUser();
    const token = getToken();
    if (!token || !user) { window.location.href = 'login.html'; return false; }
    if (user.role !== 'admin') { 
        showToast('Access denied. Admin privileges required.', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return false; 
    }
    document.getElementById('admin-name').textContent = user.username || 'Admin';
    return true;
}

async function apiRequest(endpoint, method = 'GET', body = null) {
    const opts = { method, headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${endpoint}`, opts);
    if (res.status === 401 || res.status === 403) { showToast('Session expired or access denied', 'error'); setTimeout(() => window.location.href = 'login.html', 1500); return null; }
    return res;
}

// ── Toast ──
function showToast(message, type = 'success') {
    const toast = document.getElementById('adminToast');
    const icon = toast.querySelector('i');
    document.getElementById('toast-message').textContent = message;
    toast.className = `admin-toast ${type} show`;
    icon.className = type === 'success' ? 'bi bi-check-circle-fill' : type === 'error' ? 'bi bi-x-circle-fill' : 'bi bi-info-circle-fill';
    setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── Navigation ──
function switchSection(sectionName) {
    document.querySelectorAll('[id^="section-"]').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.admin-sidebar .nav-link[data-section]').forEach(l => l.classList.remove('active'));
    const section = document.getElementById(`section-${sectionName}`);
    const navLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (section) section.style.display = 'block';
    if (navLink) navLink.classList.add('active');
    // Load data for section
    if (sectionName === 'dashboard') loadDashboardData();
    else if (sectionName === 'users') loadUsers();
    else if (sectionName === 'content') loadRevisions();
    else if (sectionName === 'activity') loadActivity('full-activity-feed', 50);
    // Close mobile sidebar
    document.getElementById('adminSidebar').classList.remove('open');
}

// ── Dashboard Data ──
async function loadDashboardData() {
    try {
        const res = await apiRequest('/admin/stats');
        if (!res) return;
        const data = await res.json();
        animateCounter('stat-users', data.total_users);
        animateCounter('stat-revisions', data.total_revisions);
        animateCounter('stat-chats', data.total_chats);
        animateCounter('stat-active', data.active_users_7d);
        const trend = document.getElementById('stat-users-trend');
        if (trend && data.new_users_7d > 0) trend.innerHTML = `<i class="bi bi-arrow-up-short"></i> +${data.new_users_7d} this week`;
        renderRegistrationChart(data.registration_trend || []);
        renderTopicsChart(data.top_topics || []);
        renderLanguagesList(data.top_languages || []);
        loadActivity('dashboard-activity-feed', 8);
    } catch (e) { console.error('Dashboard load error:', e); showToast('Failed to load dashboard', 'error'); }
}

function animateCounter(elId, target) {
    const el = document.getElementById(elId);
    if (!el) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 30));
    const interval = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(interval); }
        el.textContent = current.toLocaleString();
    }, 30);
}

// ── Charts ──
function renderRegistrationChart(trend) {
    const ctx = document.getElementById('registrationChart');
    if (!ctx) return;
    if (registrationChart) registrationChart.destroy();
    registrationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trend.map(t => t.date),
            datasets: [{
                label: 'New Users',
                data: trend.map(t => t.count),
                borderColor: '#00C853',
                backgroundColor: 'rgba(0, 200, 83, 0.1)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00C853',
                pointBorderColor: '#0b0f19',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 }, stepSize: 1 } }
            }
        }
    });
}

function renderTopicsChart(topics) {
    const ctx = document.getElementById('topicsChart');
    if (!ctx) return;
    if (topicsChart) topicsChart.destroy();
    const colors = ['#00C853', '#3D5AFE', '#FFC107', '#FF5252', '#00BCD4', '#9C27B0', '#FF9800', '#8BC34A'];
    topicsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: topics.map(t => t.topic.length > 18 ? t.topic.substring(0, 18) + '…' : t.topic),
            datasets: [{ data: topics.map(t => t.count), backgroundColor: colors.slice(0, topics.length), borderColor: '#0b0f19', borderWidth: 3 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12, usePointStyle: true, pointStyle: 'circle' } } },
            cutout: '65%'
        }
    });
}

function renderLanguagesList(languages) {
    const container = document.getElementById('languages-list');
    if (!container) return;
    if (!languages.length) { container.innerHTML = '<div class="empty-state"><i class="bi bi-code-slash"></i><h5>No language data yet</h5></div>'; return; }
    const maxCount = Math.max(...languages.map(l => l.count));
    const langColors = { 'Python': '#3572A5', 'Java': '#b07219', 'C': '#555555', 'C++': '#f34b7d', 'JavaScript': '#f1e05a', 'HTML': '#e34c26', 'DBMS': '#00758F', 'DSA': '#00C853' };
    container.innerHTML = languages.map(l => {
        const pct = Math.round((l.count / maxCount) * 100);
        const color = langColors[l.language] || '#536DFE';
        return `<div class="d-flex align-items-center gap-3 mb-3">
            <div style="width: 70px; font-size: 0.82rem; font-weight: 600; color: #cbd5e1;">${l.language}</div>
            <div class="flex-grow-1" style="height: 8px; background: rgba(255,255,255,0.04); border-radius: 4px; overflow: hidden;">
                <div style="width: ${pct}%; height: 100%; background: ${color}; border-radius: 4px; transition: width 0.8s ease;"></div>
            </div>
            <div style="font-size: 0.75rem; color: #64748b; min-width: 30px; text-align: right;">${l.count}</div>
        </div>`;
    }).join('');
}

// ── Activity Feed ──
async function loadActivity(containerId, limit = 20) {
    try {
        const res = await apiRequest(`/admin/recent-activity?limit=${limit}`);
        if (!res) return;
        const data = await res.json();
        const container = document.getElementById(containerId);
        if (!container) return;
        if (!data.activities || !data.activities.length) { container.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i><h5>No activity yet</h5></div>'; return; }
        container.innerHTML = data.activities.map(a => {
            const icons = { registration: 'bi-person-plus-fill', login: 'bi-box-arrow-in-right', revision: 'bi-journal-text' };
            const timeAgo = getTimeAgo(a.timestamp);
            return `<div class="activity-item">
                <div class="activity-icon ${a.type}"><i class="bi ${icons[a.type] || 'bi-circle'}"></i></div>
                <div><div class="activity-text">${a.detail}</div><div class="activity-time">${timeAgo}</div></div>
            </div>`;
        }).join('');
    } catch (e) { console.error('Activity load error:', e); }
}

function getTimeAgo(isoStr) {
    const diff = (Date.now() - new Date(isoStr + 'Z').getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(isoStr).toLocaleDateString();
}

// ── Users ──
async function loadUsers(page = 1, search = '') {
    currentUsersPage = page;
    currentUserSearch = search;  // keep in sync so pagination buttons work
    try {
        const res = await apiRequest(`/admin/users?page=${page}&per_page=15&search=${encodeURIComponent(search)}`);
        if (!res) return;
        const data = await res.json();
        renderUsersTable(data.users, page, data.per_page);
        document.getElementById('total-users-count').textContent = data.total;
        const start = (page - 1) * data.per_page + 1;
        const end = Math.min(page * data.per_page, data.total);
        document.getElementById('showing-range').textContent = data.total > 0 ? `${start}-${end}` : '0';
        renderPagination('users-pagination', data.pages, page, 'users');
    } catch (e) { console.error('Users load error:', e); showToast('Failed to load users', 'error'); }
}

function renderUsersTable(users, page, perPage) {
    const tbody = document.getElementById('users-table-body');
    if (!users.length) { tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><i class="bi bi-people"></i><h5>No users found</h5></div></td></tr>'; return; }
    const avatarColors = ['#00C853', '#3D5AFE', '#FFC107', '#FF5252', '#00BCD4', '#9C27B0', '#FF9800'];
    tbody.innerHTML = users.map((u, i) => {
        const idx = (page - 1) * perPage + i + 1;
        const color = avatarColors[u.id % avatarColors.length];
        const initials = (u.username || '??').substring(0, 2).toUpperCase();
        const joined = new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const lastLogin = u.last_login ? getTimeAgo(u.last_login) : 'Never';
        return `<tr>
            <td style="color:#475569">${idx}</td>
            <td><div class="user-cell"><div class="user-avatar" style="background:${color}">${initials}</div><strong>${u.username}</strong></div></td>
            <td>${u.email}</td>
            <td><span class="role-badge ${u.role}">${u.role}</span></td>
            <td><span class="status-dot ${u.is_active ? 'active' : 'inactive'}"></span>${u.is_active ? 'Active' : 'Disabled'}</td>
            <td>${u.revision_count || 0}</td>
            <td style="white-space:nowrap">${joined}</td>
            <td>${lastLogin}</td>
            <td>
                <div class="d-flex gap-1">
                    <button class="btn-action" title="View Details" onclick="viewUserDetail(${u.id})"><i class="bi bi-eye"></i></button>
                    <button class="btn-action success" title="Toggle Role" onclick="toggleRole(${u.id})"><i class="bi bi-shield-check"></i></button>
                    <button class="btn-action" title="Toggle Status" onclick="toggleStatus(${u.id})"><i class="bi bi-toggle-on"></i></button>
                    <button class="btn-action danger" title="Delete" onclick="confirmDeleteUser(${u.id}, '${u.username.replace(/'/g, "\\'")}')"><i class="bi bi-trash3"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// type = 'users' | 'revisions'  — avoids serialising closures into onclick strings
function renderPagination(containerId, totalPages, current, type) {
    const container = document.getElementById(containerId);
    if (!container || totalPages <= 1) { if (container) container.innerHTML = ''; return; }
    let html = '';
    const pages = [];
    // Build page number list with ellipsis
    for (let p = 1; p <= totalPages; p++) {
        if (totalPages > 7 && p > 2 && p < totalPages - 1 && Math.abs(p - current) > 1) {
            if (p === 3 || p === totalPages - 2) pages.push('…');
            continue;
        }
        pages.push(p);
    }
    if (current > 1) html += `<button class="page-btn" data-page="${current - 1}" data-type="${type}"><i class="bi bi-chevron-left"></i></button>`;
    pages.forEach(p => {
        if (p === '…') { html += `<span style="color:#475569;padding:0 4px">…</span>`; return; }
        html += `<button class="page-btn ${p === current ? 'active' : ''}" data-page="${p}" data-type="${type}">${p}</button>`;
    });
    if (current < totalPages) html += `<button class="page-btn" data-page="${current + 1}" data-type="${type}"><i class="bi bi-chevron-right"></i></button>`;
    container.innerHTML = html;
    // Attach click handlers — no inline JS, no closure serialisation
    container.querySelectorAll('.page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const pg = parseInt(btn.dataset.page);
            if (btn.dataset.type === 'users') loadUsers(pg, currentUserSearch);
            else if (btn.dataset.type === 'revisions') loadRevisions(pg);
        });
    });
}

// ── User Actions ──
async function viewUserDetail(userId) {
    currentDetailUserId = userId;  // store for reset password
    const body = document.getElementById('user-detail-body');
    const footer = document.getElementById('user-detail-footer');
    body.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-success" role="status"></div></div>';
    if (footer) footer.style.display = 'none';
    // Use getOrCreateInstance to avoid Bootstrap aria-hidden double-init errors
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('userDetailModal'));
    modal.show();
    // Clear any old password input
    const pwdInput = document.getElementById('admin-new-password');
    if (pwdInput) pwdInput.value = '';
    try {
        const res = await apiRequest(`/admin/users/${userId}`);
        if (!res) return;
        const u = await res.json();
        const joined = new Date(u.created_at).toLocaleString();
        const lastLogin = u.last_login ? new Date(u.last_login).toLocaleString() : 'Never';
        body.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6"><div class="glass-panel"><strong style="color:#64748b;font-size:0.75rem">USERNAME</strong><div class="mt-1" style="font-size:1.1rem;font-weight:700;color:#f8fafc">${u.username}</div></div></div>
                <div class="col-md-6"><div class="glass-panel"><strong style="color:#64748b;font-size:0.75rem">EMAIL</strong><div class="mt-1" style="color:#cbd5e1">${u.email}</div></div></div>
                <div class="col-md-3"><div class="glass-panel text-center"><div style="font-size:1.5rem;font-weight:800;color:#00C853">${u.revision_count || 0}</div><div style="font-size:0.75rem;color:#64748b">Revisions</div></div></div>
                <div class="col-md-3"><div class="glass-panel text-center"><div style="font-size:1.5rem;font-weight:800;color:#3D5AFE">${u.chat_count || 0}</div><div style="font-size:0.75rem;color:#64748b">Chats</div></div></div>
                <div class="col-md-3"><div class="glass-panel text-center"><div style="font-size:1.5rem;font-weight:800;color:#FFC107">${u.planner_count || 0}</div><div style="font-size:0.75rem;color:#64748b">Tasks</div></div></div>
                <div class="col-md-3"><div class="glass-panel text-center"><div style="font-size:1.5rem;font-weight:800;color:#FF5252">${u.current_streak || 0}</div><div style="font-size:0.75rem;color:#64748b">Streak</div></div></div>
                <div class="col-md-6"><div class="glass-panel"><strong style="color:#64748b;font-size:0.75rem">ROLE</strong><div class="mt-1"><span class="role-badge ${u.role}" style="font-size:0.8rem">${u.role}</span></div></div></div>
                <div class="col-md-6"><div class="glass-panel"><strong style="color:#64748b;font-size:0.75rem">STATUS</strong><div class="mt-1"><span class="status-dot ${u.is_active ? 'active' : 'inactive'}"></span>${u.is_active ? 'Active' : 'Disabled'}</div></div></div>
                <div class="col-md-6"><div class="glass-panel"><strong style="color:#64748b;font-size:0.75rem">JOINED</strong><div class="mt-1" style="color:#cbd5e1">${joined}</div></div></div>
                <div class="col-md-6"><div class="glass-panel"><strong style="color:#64748b;font-size:0.75rem">LAST LOGIN</strong><div class="mt-1" style="color:#cbd5e1">${lastLogin}</div></div></div>
            </div>
            ${u.revisions && u.revisions.length ? `<div class="mt-3"><strong style="color:#64748b;font-size:0.75rem">RECENT REVISIONS</strong><div class="mt-2">${u.revisions.slice(0, 5).map(r => `<div class="d-flex justify-content-between py-2" style="border-bottom:1px solid rgba(255,255,255,0.04)"><span style="color:#cbd5e1">${r.topic}</span><span style="color:#475569;font-size:0.8rem">${new Date(r.created_at).toLocaleDateString()}</span></div>`).join('')}</div></div>` : ''}`;
        // Show the reset password footer once data is loaded
        if (footer) footer.style.display = 'flex';
    } catch (e) { body.innerHTML = '<div class="text-center text-danger py-4">Failed to load user details</div>'; }
}

let pendingDeleteUserId = null;
function confirmDeleteUser(userId, username) {
    pendingDeleteUserId = userId;
    document.getElementById('delete-username').textContent = username;
    // getOrCreateInstance prevents duplicate modal instances & aria-hidden warnings
    bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal')).show();
}

async function deleteUser() {
    if (!pendingDeleteUserId) return;
    try {
        const res = await apiRequest(`/admin/users/${pendingDeleteUserId}`, 'DELETE');
        if (!res) return;
        const data = await res.json();
        if (res.ok) { showToast(data.message, 'success'); loadUsers(currentUsersPage, document.getElementById('user-search').value); }
        else showToast(data.message || 'Delete failed', 'error');
    } catch (e) { showToast('Error deleting user', 'error'); }
    bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal')).hide();
    pendingDeleteUserId = null;
}

async function toggleRole(userId) {
    try {
        const res = await apiRequest(`/admin/users/${userId}/toggle-role`, 'PATCH');
        if (!res) return;
        const data = await res.json();
        if (res.ok) { showToast(data.message, 'success'); loadUsers(currentUsersPage, document.getElementById('user-search')?.value || ''); }
        else showToast(data.message, 'error');
    } catch (e) { showToast('Error toggling role', 'error'); }
}

async function toggleStatus(userId) {
    try {
        const res = await apiRequest(`/admin/users/${userId}/toggle-status`, 'PATCH');
        if (!res) return;
        const data = await res.json();
        if (res.ok) { showToast(data.message, 'success'); loadUsers(currentUsersPage, currentUserSearch); }
        else showToast(data.message, 'error');
    } catch (e) { showToast('Error toggling status', 'error'); }
}

// ── Admin Reset Password ──
async function adminResetPassword() {
    const newPassword = document.getElementById('admin-new-password')?.value?.trim();
    if (!newPassword) { showToast('Please enter a new password', 'error'); return; }
    if (newPassword.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    if (!currentDetailUserId) { showToast('No user selected', 'error'); return; }

    const btn = document.getElementById('admin-reset-pwd-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Resetting...'; }

    try {
        const res = await apiRequest(`/admin/users/${currentDetailUserId}/reset-password`, 'PATCH', { new_password: newPassword });
        if (!res) return;
        const data = await res.json();
        if (res.ok) {
            showToast(data.message, 'success');
            document.getElementById('admin-new-password').value = '';
        } else {
            showToast(data.message || 'Reset failed', 'error');
        }
    } catch (e) {
        showToast('Error resetting password', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Reset'; }
    }
}

// ── Revisions ──
async function loadRevisions(page = 1) {
    currentRevisionsPage = page;
    try {
        const res = await apiRequest(`/admin/revisions?page=${page}&per_page=15`);
        if (!res) return;
        const data = await res.json();
        const tbody = document.getElementById('revisions-table-body');
        if (!data.revisions.length) { tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><i class="bi bi-journal-x"></i><h5>No revisions yet</h5></div></td></tr>'; return; }
        tbody.innerHTML = data.revisions.map((r, i) => {
            const idx = (page - 1) * 15 + i + 1;
            const created = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `<tr>
                <td style="color:#475569">${idx}</td>
                <td style="font-weight:600;color:#f8fafc">${r.topic}</td>
                <td>${r.language || '—'}</td>
                <td>${r.owner_username}</td>
                <td>${r.difficulty || '—'}</td>
                <td>${created}</td>
                <td><button class="btn-action danger" title="Delete" onclick="deleteRevision(${r.id})"><i class="bi bi-trash3"></i></button></td>
            </tr>`;
        }).join('');
        document.getElementById('total-revisions-count').textContent = data.total;
        const start = (page - 1) * 15 + 1, end = Math.min(page * 15, data.total);
        document.getElementById('rev-showing-range').textContent = data.total > 0 ? `${start}-${end}` : '0';
        renderPagination('revisions-pagination', data.pages, page, 'revisions');
    } catch (e) { showToast('Failed to load revisions', 'error'); }
}

async function deleteRevision(revId) {
    if (!confirm('Delete this revision?')) return;
    try {
        const res = await apiRequest(`/admin/revisions/${revId}`, 'DELETE');
        if (res && res.ok) { showToast('Revision deleted', 'success'); loadRevisions(currentRevisionsPage); }
        else showToast('Failed to delete', 'error');
    } catch (e) { showToast('Error deleting revision', 'error'); }
}

// ── CSV Export ──
function exportUsersCSV() {
    apiRequest('/admin/users?page=1&per_page=9999').then(async res => {
        if (!res) return;
        const data = await res.json();
        const headers = ['ID', 'Username', 'Email', 'Role', 'Status', 'Revisions', 'Joined', 'Last Login'];
        const rows = data.users.map(u => [u.id, u.username, u.email, u.role, u.is_active ? 'Active' : 'Disabled', u.revision_count || 0, u.created_at, u.last_login || 'Never']);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `smartrevise_users_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        showToast('CSV exported successfully', 'success');
    });
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAdminAccess()) return;

    // Load dashboard
    loadDashboardData();

    // Sidebar nav
    document.querySelectorAll('.admin-sidebar .nav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => { e.preventDefault(); switchSection(link.dataset.section); });
    });

    // Mobile toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.toggle('open');
    });

    // Search with debounce — also update global so pagination stays in sync
    document.getElementById('user-search')?.addEventListener('input', (e) => {
        clearTimeout(userSearchTimeout);
        const q = e.target.value;
        userSearchTimeout = setTimeout(() => { currentUserSearch = q; loadUsers(1, q); }, 400);
    });

    // Delete confirm
    document.getElementById('confirm-delete-btn')?.addEventListener('click', deleteUser);

    // Export CSV
    document.getElementById('export-csv-btn')?.addEventListener('click', exportUsersCSV);

    // Logout — use Bootstrap modal instead of confirm() (Brave blocks native dialogs)
    document.getElementById('admin-logout-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        bootstrap.Modal.getOrCreateInstance(document.getElementById('logoutConfirmModal')).show();
    });

    // Confirm logout button inside modal
    document.getElementById('confirm-logout-btn')?.addEventListener('click', () => {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('logoutConfirmModal')).hide();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
});
