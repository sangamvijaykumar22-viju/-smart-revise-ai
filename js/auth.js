/**
 * auth.js - Core authentication and session management
 * Stores JWT tokens and user data from the Flask backend.
 */

const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : 'https://smart-revise-ai-m3u6.onrender.com') + "/api/auth";

const Auth = {
    // Get current logged in user from localStorage
    getUser() {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch (e) {
            return null;
        }
    },

    // Get JWT token
    getToken() {
        return localStorage.getItem('token');
    },

    // Logout
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    },

    // Check if authenticated
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    // Protect restricted pages
    protect() {
        const protectedPages = ['dashboard.html', 'chat.html', 'analytics.html', 'results.html', 'topic.html', 'upload.html', 'saved-revisions.html', 'planner.html', 'admin-dashboard.html'];
        
        // Get path and strip query parameters for accurate page matching
        let currentPage = window.location.pathname.split('/').pop() || 'index.html';
        currentPage = currentPage.split('?')[0]; 

        // CRITICAL: Publicly accessible pages that must NEVER trigger a redirect loop
        const publicPages = ['login.html', 'register.html', 'index.html', 'forgot-password.html', 'reset-password.html'];
        
        if (publicPages.includes(currentPage)) return;

        // Redirect to login if user is not authenticated for protected pages
        if (protectedPages.includes(currentPage) && !this.isAuthenticated()) {
            console.log(`🔒 Protecting ${currentPage}: Redirecting to login.`);
            window.location.href = 'login.html';
            return;
        }

        // AUTO-REDIRECT REMOVED
    },


    // Check if email exists and send token
    async checkEmail(email) {
        try {
            const response = await fetch(`(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : 'https://smart-revise-ai-m3u6.onrender.com') + `/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            return response.ok;
        } catch (e) {
            console.error("Auth.checkEmail error:", e);
            return false;
        }
    },

    // Reset password with token
    async resetPassword(email, token, newPassword) {
        try {
            const response = await fetch(`(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : 'https://smart-revise-ai-m3u6.onrender.com') + `/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token, new_password: newPassword })
            });
            const data = await response.json();
            return { success: response.ok, message: data.message };
        } catch (e) {
            console.error("Auth.resetPassword error:", e);
            return { success: false, message: "Server connection failed" };
        }
    }
};

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    Auth.protect();

    const user = Auth.getUser();
    // Support both standard navbar and chat topbar
    const navRight = document.querySelector('.navbar .d-flex.align-items-center.gap-3') ||
        document.querySelector('.topbar-actions') ||
        document.querySelector('.chat-topbar .topbar-actions');
    const greetingName = document.getElementById('user-greeting-name');

    if (user && Auth.isAuthenticated()) {
        // Update greeting on dashboard
        if (greetingName) {
            greetingName.textContent = (user.username || user.email.split('@')[0]) + '!';
        }

        // Update Navbar: Show profile, hide login
        if (navRight) {
            const loginLink = navRight.querySelector('a[href="login.html"], a[href="portal-select.html"]');
            if (loginLink) loginLink.classList.add('d-none');

            if (!navRight.querySelector('.dropdown-profile')) {
                const displayName = user.username || user.email.split('@')[0];
                const dropdownDiv = document.createElement('div');
                dropdownDiv.className = 'dropdown dropdown-profile';
                dropdownDiv.innerHTML = `
                    <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold dropdown-toggle" 
                         id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false"
                         style="width: 40px; height: 40px; cursor: pointer;">
                        ${displayName.substring(0, 2).toUpperCase()}
                    </div>
                    <ul class="dropdown-menu dropdown-menu-end border-0 shadow-sm mt-2" aria-labelledby="profileDropdown">
                        <li class="px-3 py-2 border-bottom">
                            <div class="fw-bold text-dark">${displayName}</div>
                            <div class="small text-muted">${user.email}</div>
                        </li>
                        <li><a class="dropdown-item py-2" href="saved-revisions.html"><i class="bi bi-bookmark me-2"></i> Saved Revisions</a></li>
                        ${user.role === 'admin' ? '<li><a class="dropdown-item py-2" href="admin-dashboard.html"><i class="bi bi-shield-lock me-2"></i> Admin Portal</a></li>' : ''}
                        <li><hr class="dropdown-divider"></li>
                        <li><button class="dropdown-item py-2 text-danger" id="logout-btn"><i class="bi bi-box-arrow-right me-2"></i> Logout</button></li>
                    </ul>
                `;
                navRight.appendChild(dropdownDiv);
            }
        }

        // Custom branding logic removed
    }


    // Use Event Delegation for Logout Button (More Robust)
    document.addEventListener('click', (e) => {
        if (e.target && (e.target.id === 'logout-btn' || e.target.closest('#logout-btn'))) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                Auth.logout();
            }
        }
    });
});
