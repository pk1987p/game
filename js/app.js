/**
 * GameJio App - General utilities and functions
 */

// Initialize index page auth UI
function initIndexPage() {
    const userMenu = document.getElementById('userMenu');
    const authMenu = document.getElementById('authMenu');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');

    if (isUserLoggedIn()) {
        const user = getCurrentUser();
        if (user && userName) {
            userName.textContent = user.username || 'Player';
        }
        if (userMenu) userMenu.classList.remove('hidden');
        if (authMenu) authMenu.classList.add('hidden');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logoutUser);
        }
    } else {
        if (userMenu) userMenu.classList.add('hidden');
        if (authMenu) authMenu.classList.remove('hidden');
    }
}

// Call on page load for index.html
if (document.body && (window.location.pathname === '/index.html' || window.location.pathname.endsWith('index.html') || window.location.pathname === '/')) {
    window.addEventListener('load', initIndexPage);
    initIndexPage();
}

// Prevent users who are not logged in from accessing game pages
function protectGamePage() {
    if (!isUserLoggedIn()) {
        alert('Please login to play games!');
        window.location.href = './login.html';
    }
}

// Redirect to game page helper
function redirectToGame(gamePath) {
    if (!isUserLoggedIn()) {
        window.location.href = './login.html';
    } else {
        window.location.href = gamePath;
    }
}

// Initialize game page with user info
function initGamePage(gameName) {
    if (!isUserLoggedIn()) {
        window.location.href = '/login.html';
        return;
    }

    const user = getCurrentUser();
    const gameTitle = document.querySelector('h1');
    if (gameTitle) {
        gameTitle.textContent = gameName + ' - GameJio';
    }

    // Display high score if available
    displayHighScore(gameName);
}

// Display high score on game page
function displayHighScore(gameName) {
    const highScore = getHighScore(gameName);
    const scoreDisplay = document.getElementById('highScoreDisplay');
    if (scoreDisplay) {
        scoreDisplay.textContent = 'High Score: ' + highScore;
    }
}

// Show game over screen
function showGameOverScreen(score, gameName, onRestart) {
    // Save the score
    saveGameScore(gameName, score);

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-sm w-full text-center shadow-2xl">
            <h2 class="text-3xl font-bold text-gray-800 mb-4">Game Over!</h2>
            <div class="mb-6">
                <p class="text-gray-600 mb-2">Your Score</p>
                <p class="text-5xl font-bold" style="background: linear-gradient(135deg, #10b981 0%, #f97316 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                    ${score}
                </p>
            </div>
            <div class="space-y-3">
                <button id="restartBtn" class="w-full py-3 bg-gradient-to-r from-green-500 to-orange-500 text-white font-bold rounded-lg hover:shadow-lg transition-all">
                    Play Again
                </button>
                <a href="./index.html" class="block py-3 bg-gray-300 text-gray-800 font-bold rounded-lg hover:bg-gray-400 transition-all">
                    Back to Games
                </a>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('restartBtn').addEventListener('click', () => {
        modal.remove();
        if (onRestart) onRestart();
    });
}

// Responsive canvas sizing for mobile
function setupResponsiveCanvas(canvas) {
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return resizeCanvas;
}

// Touch support for games
function addTouchControls(element, onTouchLeft, onTouchRight, onTap) {
    let touchStartX = 0;
    let touchStartY = 0;

    element.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, false);

    element.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Swipe threshold
        const threshold = 50;

        if (Math.abs(deltaX) > threshold) {
            if (deltaX > 0 && onTouchRight) {
                onTouchRight();
            } else if (deltaX < 0 && onTouchLeft) {
                onTouchLeft();
            }
        }

        // Tap gesture
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && onTap) {
            onTap();
        }
    }, false);
}

// Utility: Format time (ms to HH:MM:SS)
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Utility: Random range
function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Utility: Distance between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
