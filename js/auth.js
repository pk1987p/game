// Supabase Configuration
const SUPABASE_URL = 'https://nekiwesotdzzvxxzlagh.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'sb_publishable_f7zRjuw_E70J4DlOPoeFNA_4qtn7atV'; // Replace with your Supabase key

// Initialize Supabase with a check to ensure the library is loaded
let supabaseError = null;

function initSupabase() {
    if (!window.supabaseClient && window.supabase && window.supabase.createClient) {
        try {
            window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            // Set up auth state change listener for session management
            window.supabaseClient.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                    if (session) {
                        // Update stored token on refresh
                        localStorage.setItem('gamejio_token', session.access_token);
                        localStorage.setItem('gamejio_token_expires', session.expires_at);
                    } else {
                        // Clear on sign out
                        clearAuthData();
                    }
                }
            });
            return true;
        } catch (error) {
            console.error('Auth initialization error');
            supabaseError = error.message;
            return false;
        }
    }
    return !!window.supabaseClient;
}

// Try to initialize immediately, otherwise wait for it
if (!initSupabase()) {
    const checkSupabase = setInterval(() => {
        if (window.supabase && window.supabase.createClient) {
            if (initSupabase()) {
                clearInterval(checkSupabase);
            }
        }
    }, 100);
    
    setTimeout(() => {
        if (!window.supabaseClient) {
            supabaseError = 'Authentication service unavailable';
        }
    }, 5000);
}

// Helper function to get supabase client
function getSupabase() {
    return window.supabaseClient;
}

/**
 * Clear all auth data from localStorage
 */
function clearAuthData() {
    localStorage.removeItem('gamejio_user');
    localStorage.removeItem('gamejio_token');
    localStorage.removeItem('gamejio_token_expires');
    localStorage.removeItem('gamejio_user_id');
}

/**
 * Store user session securely (only non-sensitive data)
 */
function storeUserSession(user, session) {
    // Store only non-sensitive user info
    const safeUserData = {
        id: user.id,
        email: user.email ? user.email.substring(0, 3) + '***' : null, // Masked email
        username: user.user_metadata?.username || 'Player',
        created_at: user.created_at
    };
    localStorage.setItem('gamejio_user', JSON.stringify(safeUserData));
    localStorage.setItem('gamejio_user_id', user.id);
    localStorage.setItem('gamejio_token', session.access_token);
    localStorage.setItem('gamejio_token_expires', session.expires_at);
}

/**
 * Check if user is logged in with valid session
 */
function isUserLoggedIn() {
    const user = localStorage.getItem('gamejio_user');
    const token = localStorage.getItem('gamejio_token');
    const expiresAt = localStorage.getItem('gamejio_token_expires');
    
    if (!user || !token) return false;
    
    // Check if token is expired
    if (expiresAt) {
        const expirationTime = parseInt(expiresAt) * 1000; // Convert to milliseconds
        if (Date.now() > expirationTime) {
            // Token expired, try to refresh
            refreshSession();
            return false;
        }
    }
    
    return true;
}

/**
 * Refresh session token
 */
async function refreshSession() {
    const supabase = window.supabaseClient;
    if (!supabase) return false;
    
    try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) {
            clearAuthData();
            return false;
        }
        storeUserSession(data.user, data.session);
        return true;
    } catch (error) {
        clearAuthData();
        return false;
    }
}

/**
 * Get current user from localStorage
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('gamejio_user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}

/**
 * Get user ID
 */
function getUserId() {
    return localStorage.getItem('gamejio_user_id');
}

/**
 * Sanitize input to prevent XSS
 */
function sanitizeInput(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Logout user
 */
async function logoutUser() {
    try {
        // Sign out from Supabase
        const supabase = window.supabaseClient;
        if (supabase) {
            await supabase.auth.signOut();
        }
    } catch (error) {
        // Silent fail - still clear local data
    } finally {
        // Always clear auth data and redirect
        clearAuthData();
        window.location.href = '/index.html';
    }
}

/**
 * Save game score
 */
async function saveGameScore(gameName, score, time = null) {
    const userId = getUserId();
    if (!userId) {
        alert('Please login to save your score!');
        return false;
    }

    try {
        // For now, we'll store scores in localStorage as well
        const scoresKey = `gamejio_scores_${userId}`;
        let scores = JSON.parse(localStorage.getItem(scoresKey) || '[]');
        
        scores.push({
            game: gameName,
            score: score,
            time: time,
            timestamp: new Date().toISOString()
        });

        // Keep only last 50 scores
        if (scores.length > 50) {
            scores = scores.slice(-50);
        }

        localStorage.setItem(scoresKey, JSON.stringify(scores));
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Get game scores
 */
function getGameScores(gameName = null) {
    const userId = getUserId();
    if (!userId) return [];

    try {
        const scoresKey = `gamejio_scores_${userId}`;
        let scores = JSON.parse(localStorage.getItem(scoresKey) || '[]');

        if (gameName) {
            scores = scores.filter(s => s.game === gameName);
        }

        return scores.sort((a, b) => b.score - a.score);
    } catch (error) {
        return [];
    }
}

/**
 * Get high score for a game
 */
function getHighScore(gameName) {
    const scores = getGameScores(gameName);
    return scores.length > 0 ? scores[0].score : 0;
}

// Update UI based on login status when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = isUserLoggedIn();
    const userMenu = document.getElementById('userMenu');
    const authMenu = document.getElementById('authMenu');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');

    if (isLoggedIn && userMenu && authMenu) {
        const user = getCurrentUser();
        authMenu.classList.add('hidden');
        userMenu.classList.remove('hidden');
        if (userName) {
            userName.textContent = user.email || 'Player';
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', logoutUser);
        }
    } else if (!isLoggedIn && userMenu && authMenu) {
        userMenu.classList.add('hidden');
        authMenu.classList.remove('hidden');
    }
});
