const GameState = (function() {
    const state = {
        paddleX: 400, // center position
        paddleSpeed: 0,
        maxPaddleSpeed: 12,
        keys: {},
        lastTime: 0,
        isPaused: false,
        fps: 60,
        frameCount: 0,
        lastFPSUpdate: 0,
        currentLevel: 0,
        totalLevels: 1
    };

    // Create background grid
    function createGrid() {
        const gameArea = document.getElementById('gameArea');
        if (!gameArea) return;

        // clears old grid lines
        gameArea.querySelectorAll('.grid-line').forEach(el => el.remove());


        const containerWidth = gameArea.offsetWidth;
        const containerHeight = gameArea.offsetHeight;

        const cellSize = 50; // consistent grid size

        // horizontal lines
        for (let y = 0; y <= containerHeight; y += cellSize) {
            const line = document.createElement('div');
            line.className = 'grid-line horizontal';
            line.style.top = `${y}px`;
            gameArea.appendChild(line);
        }

        // vertical lines
        for (let x = 0; x <= containerWidth; x += cellSize) {
            const line = document.createElement('div');
            line.className = 'grid-line vertical';
            line.style.left = `${x}px`;
            gameArea.appendChild(line);
        }
    }

    // Blocks
    function createBlock(x, y, width = 80, height = 30, type = "normal") {
        const gameArea = document.getElementById("gameArea");
        const block = document.createElement("div");
        block.classList.add("block", type);
        block.style.left = x + "px";
        block.style.top = y + "px";
        block.style.width = width + "px";
        block.style.height = height + "px";
        gameArea.appendChild(block);
        return block;
    }

    async function loadLevel(levelIndex = 0) {
        const gameArea = document.getElementById("gameArea");
        if (!gameArea) return;

        // clear old blocks
        gameArea.querySelectorAll(".block").forEach(b => b.remove());

        if (typeof Boss !== 'undefined' && Boss.cleanup) {
            Boss.cleanup();
        }

        let originalLevels = [];
        let customLevels = [];

        // Get original levels
        originalLevels =
            (typeof levels !== "undefined" && Array.isArray(levels)) ? levels :
                (typeof window !== "undefined" && Array.isArray(window.levels)) ? window.levels :
                    defaultLevels;

        // Load custom levels from API
        try {
            const response = await fetch('http://localhost:8080/api/levels');
            if (response.ok) {
                const data = await response.json();
                customLevels = data.levels || [];
            }
        } catch (error) {
            console.warn('Could not load levels from API:', error);
        }

        // Combine original and custom levels
        const allLevels = [...originalLevels, ...customLevels];
        state.totalLevels = allLevels.length;
        state.currentLevel = levelIndex;

        console.log('Loading level:', levelIndex, 'Total levels:', state.totalLevels);
        console.log('Original levels:', originalLevels.length, 'Custom levels:', customLevels.length);

        if (allLevels.length === 0) {
            console.error('No levels available to load!');
            return;
        }

        if (levelIndex >= allLevels.length) {
            console.warn('Level index out of bounds, loading first level instead');
            state.currentLevel = 0;
        }

        let grid;
        const levelObj = allLevels[state.currentLevel];

        if (levelObj && levelObj.isBossLevel) {
            console.log('loading boss level');
            if (typeof Boss !== 'undefined' && Boss.createBoss) {
                Boss.createBoss();
            }
            return;
        }

        console.log('Raw level data:', levelObj); // Debug log

        if (levelObj && levelObj.data) {
            if (Array.isArray(levelObj.data[0])) {
                grid = levelObj.data;
                console.log('Loading level (nested format):', levelObj.name);
            } else if (Array.isArray(levelObj.data)) {
                const rows = 14;
                const cols = 11;
                grid = [];

                // Convert flattened array back to 2D grid
                for (let i = 0; i < rows; i++) {
                    const start = i * cols;
                    const end = start + cols;
                    let row = [];

                    if (i * cols < levelObj.data.length) {
                        row = levelObj.data.slice(start, end);
                    }

                    // Ensure row has exactly cols elements (pad with 0 if needed)
                    while (row.length < cols) {
                        row.push(0);
                    }

                    grid.push(row);
                }
                console.log('Loading level (flattened format):', levelObj.name);
            }
        }

        console.log('Processed grid dimensions:', grid.length, 'rows x', grid[0].length, 'columns');

        // Ensure grid has at least one row and column
        if (!grid || !grid.length || !grid[0] || !grid[0].length) {
            console.error('Invalid grid after processing, using fallback');
            grid = Array(14).fill().map(() => Array(11).fill(0));
            grid[0] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
        }

        const blockWidth = 88;
        const blockHeight = 30;
        const gap = 0;

        const cols = grid[0].length;
        const totalWidth = cols * blockWidth + (cols - 1) * gap;

        // center horizontally and keep a bit of padding from the top
        const maxSidePadding = 7;
        const calculatedOffset = (gameArea.clientWidth - totalWidth) / 2;
        const offsetX = Math.min(calculatedOffset, maxSidePadding);
        const offsetY = 40;

        console.log('Rendering blocks at offset:', offsetX, offsetY); // Debug log

        // Use the full grid for rendering
        grid.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell != 0) {
                    const type = cell === 2 ? "strong" : cell === 3 ? "unbreakable" : "normal";
                    createBlock(
                        offsetX + colIndex * (blockWidth + gap),
                        offsetY + rowIndex * (blockHeight + gap),
                        blockWidth,
                        blockHeight,
                        type
                    );
                }
            });
        });
        console.log('Finished loading level, blocks created:', document.querySelectorAll('.block').length); // Debug log
    }

    // Win Condition/screen
    function checkWinCondition() {
        if (typeof Boss !== 'undefined' && Boss.isBossActive && Boss.isBossActive()) {
            return false;
        }

        const breakableBlocks = document.querySelectorAll('.block:not(.unbreakable)');

        if (breakableBlocks.length === 0) {
            const powerups = document.querySelectorAll('.powerup-pill');
            powerups.forEach(powerup => powerup.remove());

            if (typeof Powerups !== 'undefined' && Powerups.cleanAllPowerups) {
                Powerups.cleanAllPowerups();
            }

            showWinScreen();
            return true;
        }
        return false;
    }

    function getOriginalLevelsCount() {
        const originalLevels =
            (typeof levels !== "undefined" && Array.isArray(levels)) ? levels :
                (typeof window !== "undefined" && Array.isArray(window.levels)) ? window.levels :
                    defaultLevels;

        return originalLevels.length;
    }

    async function showWinScreen() {
        // Pause the game
        state.isPaused = true;

        // Calculate final score
        const finalScore = typeof Score !== 'undefined' ? Score.getScore() : 0;
        const timeElapsed = typeof Timer !== 'undefined' ? Timer.getElapsedTime() : 0;
        const livesLeft = typeof Lives !== 'undefined' ? Lives.getCurrentLives() : 0;

        // Check if this is the final level
        const isFinalLevel = state.currentLevel >= getOriginalLevelsCount() - 1;

        // Create win screen
        const winScreen = document.createElement('div');
        winScreen.id = "winScreen";
        winScreen.className = 'win-screen';

        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;

        // Only show next level button if it's NOT the final level
        const showNextLevelButton = state.currentLevel < getOriginalLevelsCount() - 1;

        winScreen.innerHTML = `
    <div class="win-content">
        <div class="title-wrapper">
            <h1 class="menu-title">${isFinalLevel ? 'GAME COMPLETED!' : 'LEVEL COMPLETE!'}</h1>
            <h2 class="menu-subtitle">${isFinalLevel ? 'BANANA FORM RESTORED!' : 'CONGRATULATIONS!'}</h2>
        </div>

        <div class="win-stats">
            <p>
                <span class="win-stats-label">Final Score:</span>
                <span class="win-stats-value">${finalScore.toLocaleString()}</span>
            </p>
            <p>
                <span class="win-stats-label">Time:</span>
                <span class="win-stats-value">${minutes}:${seconds.toString().padStart(2, '0')}</span>
            </p>
            <p>
                <span class="win-stats-label">Lives Remaining:</span>
                <span class="win-stats-value">${livesLeft}</span>
            </p>
        </div>

        ${isFinalLevel ? `
        <!-- NAME INPUT SECTION - Keyboard Only -->
        <div class="name-input-section">
            <h3>ENTER YOUR NAME FOR LEADERBOARD</h3>
            <input type="text" id="playerNameInput" maxlength="10" placeholder="ANON" 
                   style="font-family: 'Press Start 2P', monospace; padding: 10px; text-align: center; text-transform: uppercase;">
            <div class="input-hint">Type your name and press ENTER to submit</div>
            <div id="submitStatus" style="margin-top: 10px; min-height: 20px; font-size: 10px;"></div>
        </div>
        ` : ''}

        <div class="menu-buttons">
            ${showNextLevelButton ?
                '<div class="menu-button" data-action="nextLevel"><span class="arrow-indicator">▶</span><span class="button-text">Next Level</span></div>' :
                ''}
            <div class="menu-button" data-action="restart"><span class="arrow-indicator">▶</span><span class="button-text">Restart Game</span></div>
            <div class="menu-button" data-action="menu"><span class="arrow-indicator">▶</span><span class="button-text">Main Menu</span></div>
        </div>
    </div>
    `;

        document.getElementById('gameArea').appendChild(winScreen);

        // Keyboard-only name input for final level
        if (isFinalLevel) {
            const nameInput = document.getElementById('playerNameInput');
            const submitStatus = document.getElementById('submitStatus');

            // Auto-focus on input
            nameInput.focus();

            // Remove mouse event listeners from name input section
            const nameInputSection = document.querySelector('.name-input-section');
            nameInputSection.style.pointerEvents = 'none'; // Disable mouse interactions

            // But allow focus on the input
            nameInput.style.pointerEvents = 'auto';

            // Keyboard-only submission
            nameInput.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();

                    const name = nameInput.value.trim().substring(0, 10) || 'ANON';

                    submitStatus.textContent = 'SUBMITTING...';
                    submitStatus.style.color = '#ffcc00';

                    try {
                        console.log('Attempting to submit score...'); // DEBUG
                        console.log('Name:', name, 'Score:', finalScore, 'Time:', timeElapsed); // DEBUG
                        console.log('scoreboard available:', typeof Scoreboard !== 'undefined'); // DEBUG
                        console.log('submitScore available:', Scoreboard && typeof Scoreboard.submitScore !== 'undefined'); // DEBUG

                        if (!Scoreboard || typeof Scoreboard.submitScore !== 'function') {
                            throw new Error('scoreboard.submitScore is not available');
                        }

                        const result = await Scoreboard.submitScore(name, finalScore, timeElapsed);
                        console.log('Submission result:', result); // DEBUG

                        if (result) {
                            submitStatus.textContent = `SUCCESS! Rank: ${result.rank} (Top ${result.percentile}%)`;
                            submitStatus.style.color = '#4caf50';

                            nameInput.disabled = true;
                            nameInput.style.background = 'rgba(255,255,255,0.1)';

                            // MARK SCORE AS SUBMITTED
                            if (window.markScoreSubmitted) window.markScoreSubmitted();

                            setTimeout(() => {
                                const firstButton = document.querySelector('.menu-button');
                                if (firstButton) firstButton.focus();
                            }, 500);
                        } else {
                            throw new Error('Submission returned null result');
                        }
                    } catch (error) {
                        console.error('Score submission error:', error); // DEBUG
                        submitStatus.textContent = `SUBMISSION FAILED: ${error.message} - PRESS ENTER TO RETRY`;
                        submitStatus.style.color = '#f44336';
                        nameInput.focus();
                    }
                } else if (e.key === 'Tab') {
                    e.preventDefault();
                    // Only allow tab navigation AFTER score is submitted
                    if (window.markScoreSubmitted && typeof window.markScoreSubmitted === 'function') {
                        // Check if we can call it to verify score was submitted
                        const firstButton = document.querySelector('.menu-button');
                        if (firstButton) firstButton.focus();
                    } else {
                        // Score not submitted yet, keep focus on input
                        nameInput.focus();
                    }
                }
            });

            initGameOverNavigation();
        }
    }

    async function submitScoreAutomatically(finalScore, timeElapsed) {
        const name = 'ANON'; // Default name

        try {
            const response = await fetch('/api/scoreboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    score: finalScore,
                    time: timeElapsed
                })
            });

            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                throw new Error('Failed to submit score');
            }
        } catch (error) {
            console.error('Error submitting score:', error);
            return { rank: null, percentile: null }; // Return empty data but continue
        }
    }

    async function promptAndSubmitScore(finalScore, timeElapsed) {
        // Simple alert for name input
        const playerName = prompt('Enter your name for the leaderboard (max 10 characters):', 'ANON');

        if (playerName === null) {
            return null; // User cancelled
        }

        const name = playerName.trim().substring(0, 10) || 'ANON';

        try {
            const response = await fetch('/api/scoreboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    score: finalScore,
                    time: timeElapsed
                })
            });

            if (response.ok) {
                const result = await response.json();
                return result; // Return rank and percentile info
            } else {
                throw new Error('Failed to submit score');
            }
        } catch (error) {
            console.error('Error submitting score:', error);
            alert('Failed to submit score. Please try again.');
            return { rank: null, percentile: null }; // Return empty data but continue
        }
    }

    async function loadAndDisplayScoreboard(containerId, page = 1) {
        try {
            const response = await fetch(`/api/scoreboard?page=${page}&pageSize=5`);
            if (response.ok) {
                const data = await response.json();

                // Store page info for navigation
                if (typeof currentScoreboardPage !== 'undefined') {
                    currentScoreboardPage = data.page;
                }
                if (typeof totalScoreboardPages !== 'undefined') {
                    totalScoreboardPages = data.totalPages;
                }

                displayScoreboard(containerId, data);
            }
        } catch (error) {
            console.error('Error loading scoreboard:', error);
        }
    }

    function displayScoreboard(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let html = `
        <div class="table-header">
            <span>RANK</span>
            <span>NAME</span>
            <span>SCORE</span>
            <span>TIME</span>
        </div>
    `;

        if (data.scores && data.scores.length > 0) {
            data.scores.forEach((score, index) => {
                const rank = (data.page - 1) * 5 + index + 1;
                html += `
                <div class="table-row">
                    <span>${formatRank(rank)}</span>
                    <span>${score.name}</span>
                    <span>${score.score.toLocaleString()}</span>
                    <span>${formatTime(score.time)}</span>
                </div>
            `;
            });
        } else {
            html += `
            <div class="table-row">
                <span colspan="4" style="text-align: center; padding: 20px;">
                    No scores yet! Be the first!
                </span>
            </div>
        `;
        }

        container.innerHTML = html;
    }

    function formatRank(rank) {
        if (rank === 1) return '1st';
        if (rank === 2) return '2nd';
        if (rank === 3) return '3rd';
        return `${rank}th`;
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    function initWinScreenNavigation() {
        const winScreen = document.getElementById('winScreen');
        if (!winScreen) return;

        let selectedButtonIndex = 0;
        let winButtons = [];
        let currentScoreboardPage = 1;
        let totalScoreboardPages = 1;

        function updateButtonSelection() {
            // Remove highlight from all buttons and hide arrows
            winButtons.forEach(button => {
                button.classList.remove('selected');
                const arrow = button.querySelector('.arrow-indicator');
                if (arrow) arrow.style.visibility = 'hidden';
            });

            // Add highlight to selected button and show arrow
            if (winButtons[selectedButtonIndex]) {
                winButtons[selectedButtonIndex].classList.add('selected');
                const arrow = winButtons[selectedButtonIndex].querySelector('.arrow-indicator');
                if (arrow) arrow.style.visibility = 'visible';
            }
        }

        function handleWinScreenNavigation(direction) {
            if (direction === 'up') {
                selectedButtonIndex = (selectedButtonIndex - 1 + winButtons.length) % winButtons.length;
            } else if (direction === 'down') {
                selectedButtonIndex = (selectedButtonIndex + 1) % winButtons.length;
            }

            updateButtonSelection();
        }

        async function activateSelectedButton() {
            if (winButtons[selectedButtonIndex]) {
                const action = winButtons[selectedButtonIndex].getAttribute('data-action');
                await handleWinScreenAction(action);
            }
        }

        async function handleScoreboardPageChange(newPage) {
            if (newPage >= 1 && newPage <= totalScoreboardPages && newPage !== currentScoreboardPage) {
                currentScoreboardPage = newPage;
                await loadAndDisplayScoreboard('winScoreboard', currentScoreboardPage);
            }
        }

        async function handleWinScreenAction(action) {
            switch (action) {
                case 'nextLevel':
                    nextLevel();
                    break;
                case 'restart':
                    restartGame();
                    break;
                case 'menu':
                    returnToMenu();
                    break;
                case 'submitScore':
                    await Scoreboard.submitScore();
                    break;
            }
        }

        // Get all win screen buttons
        winButtons = Array.from(winScreen.querySelectorAll('.menu-button'));

        // Set up initial selection
        updateButtonSelection();

        // Add keyboard event listener for win screen
        function handleWinScreenKeydown(e) {
            if (!document.getElementById('winScreen')) {
                window.removeEventListener('keydown', handleWinScreenKeydown);
                return;
            }

            // Check if we're trying to navigate scoreboard pages
            const scoreboardSection = winScreen.querySelector('.scoreboard-section');
            if (scoreboardSection && scoreboardSection.style.display !== 'none') {
                if (e.key === 'ArrowLeft') {
                    handleScoreboardPageChange(currentScoreboardPage - 1);
                    e.preventDefault();
                    return;
                } else if (e.key === 'ArrowRight') {
                    handleScoreboardPageChange(currentScoreboardPage + 1);
                    e.preventDefault();
                    return;
                }
            }

            // Regular navigation for buttons
            switch (e.key) {
                case 'ArrowUp':
                    handleWinScreenNavigation('up');
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    handleWinScreenNavigation('down');
                    e.preventDefault();
                    break;
                case 'Enter':
                case ' ':
                    activateSelectedButton();
                    e.preventDefault();
                    break;
                case 'Escape':
                    returnToMenu();
                    e.preventDefault();
                    break;
            }
        }

        window.addEventListener('keydown', handleWinScreenKeydown);
    }

    function createCelebrationEffects() {
        const gameArea = document.getElementById('gameArea');
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff9ff3', '#54a0ff'];

        // Create some floating particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle';
            particle.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation: float 2s ease-in-out ${i * 0.1}s infinite;
            `;
            gameArea.appendChild(particle);
        }
    }

    function nextLevel() {
        // Remove win screen and particles
        const winScreen = document.getElementById('winScreen');
        const particles = document.querySelectorAll('.celebration-particle');
        particles.forEach(particle => particle.remove());

        if (winScreen) winScreen.remove();
        particles.forEach(particle => particle.remove());

        // Load next level
        const nextLevelIndex = state.currentLevel + 1;
        const originalLevelsCount = getOriginalLevelsCount();

        // Check if next level exists (using the total levels from state)
        if (nextLevelIndex < originalLevelsCount) {
            state.currentLevel = nextLevelIndex;
            loadLevel(nextLevelIndex);

            // Reset ball
            if (typeof Ball !== 'undefined' && Ball.reset) {
                Ball.reset();
            }

            // Gain extra life
            if (typeof Lives !== 'undefined' && Lives.gainLife) {
                Lives.gainLife();
            }

            // Unpause game
            state.isPaused = false;
        } else {
            // If no more levels, go back to main menu
            console.log('All levels completed!');
            returnToMenu();
        }
    }

    function restartGame() {
        // Remove win screen, game over screen, and particles
        const winScreen = document.getElementById('winScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const particles = document.querySelectorAll('.celebration-particle');
        const powerups = document.querySelectorAll('.powerup-pill');

        if (winScreen) winScreen.remove();
        if (gameOverScreen) gameOverScreen.remove();
        particles.forEach(particle => particle.remove());
        powerups.forEach(powerup => powerup.remove());

        // Clean up powerups system
        if (typeof Powerups !== 'undefined' && Powerups.cleanAllPowerups) {
            Powerups.cleanAllPowerups();
        }

        // Reset game to level 1
        loadLevel(0);

        // Reset ball
        if (typeof Ball !== 'undefined' && Ball.reset) {
            Ball.reset();
        }

        // Reset timer
        if (typeof Timer !== 'undefined' && Timer.reset) {
            Timer.reset();
            Timer.start();
        }

        // Reset score
        if (typeof Score !== 'undefined' && Score.reset) {
            Score.reset();
        }

        // Reset Lives
        if (typeof Lives !== 'undefined' && Lives.setLives) {
            Lives.setLives(3);
        }

        // Reset paddle to normal state
        const paddle = document.getElementById('paddle');
        if (paddle) {
            paddle.className = 'paddle';
            paddle.style.width = '';
        }

        if (typeof Music !== 'undefined' && Music.playCrystalHammer && SoundManager.playGameStart) {
            Music.stop();
            SoundManager.playGameStart();
            setTimeout(() => {
                Music.playCrystalHammer();
            }, 100);
        }

        // Unpause game
        state.isPaused = false;
    }

    function returnToMenu() {
        // Remove win screen, game over screen, and particles
        const winScreen = document.getElementById('winScreen');
        const gameOverScreen = document.getElementById('gameOverMessage');
        const particles = document.querySelectorAll('.celebration-particle');
        const powerups = document.querySelectorAll('.powerup-pill');

        if (winScreen) winScreen.remove();
        if (gameOverScreen) gameOverScreen.remove();
        particles.forEach(particle => particle.remove());
        powerups.forEach(powerup => powerup.remove());

        // Clean up powerups system
        if (typeof Powerups !== 'undefined' && Powerups.cleanAllPowerups) {
            Powerups.cleanAllPowerups();
        }

        // Reset game elements
        if (typeof Ball !== 'undefined' && Ball.reset) {
            Ball.reset();
        }

        if (typeof Lives !== 'undefined' && Lives.setLives) {
            Lives.setLives(3);
        }

        if (typeof Score !== 'undefined' && Score.reset) {
            Score.reset();
        }

        if (typeof Timer !== 'undefined' && Timer.reset) {
            Timer.reset();
        }

        // Reset to first level
        state.currentLevel = 0;

        // Clear any existing blocks
        const gameArea = document.getElementById('gameArea');
        if (gameArea) {
            gameArea.querySelectorAll('.block').forEach(b => b.remove());
        }

        // Reset paddle to normal state
        const paddle = document.getElementById('paddle');
        if (paddle) {
            paddle.className = 'paddle';
            paddle.style.width = '';
        }

        state.isPaused = true;

        setTimeout(() => {
            if (typeof Music !== 'undefined' && Music.playTropicalTheme) {
                Music.stop();
                Music.playTropicalTheme();
            }
        }, 100);

        if (typeof Menu !== 'undefined') {
            Menu.setCurrentMenu('main');
        }

        // Show menu
        setTimeout(() => {
            if (typeof Menu !== 'undefined' && Menu.show) {
                Menu.show();
            } else {
                // Fallback: if Menu module isn't available, just pause the game
                state.isPaused = true;
                console.warn('Menu module not available');
            }
        }, 10);
    }

    function handleGamePaused(paused) {
        if (typeof Music !== 'undefined' && Music.setPaused) {
            Music.setPaused(paused);
        }
    }

    function handleReturnToMenu() {
        if (typeof Music !== 'undefined') {
            Music.stop();
        }
    }

    // FPS
    function updateFPS(now) {
        if (!state.lastFPSUpdate) state.lastFPSUpdate = now;
        state.frameCount++

        if (now - state.lastFPSUpdate >= 1000) {
            state.fps = Math.round((state.frameCount * 1000) / (now - state.lastFPSUpdate));
            document.getElementById('fpsCounter').textContent = `FPS: ${state.fps}`;
            state.frameCount = 0;
            state.lastFPSUpdate = now;
        }
    }

    return {
        init() {
            createGrid();
            return { ...state };
        },
        getState() { return { ...state }; },
        setState(newState) { for (let k in newState) if (k in state) state[k] = newState[k]; },
        checkWinCondition,
        nextLevel,
        restartGame,
        returnToMenu,
        promptAndSubmitScore: promptAndSubmitScore,
        loadAndDisplayScoreboard: loadAndDisplayScoreboard,
        displayScoreboard: displayScoreboard,
        formatRank: formatRank,
        formatTime: formatTime,
        showWinScreen,
        getOriginalLevelsCount,
        handleGamePaused: handleGamePaused,
        handleReturnToMenu: handleReturnToMenu,
        startGameLoop() {
            function gameLoop(timestamp) {
                if (!state.isPaused) {
                    if (typeof Movement !== 'undefined' && Movement.update) {
                        Movement.update();
                    }
                    if (typeof Ball !== 'undefined' && Ball.update) {
                        Ball.update();
                    }
                    if (typeof Powerups !== 'undefined' && Powerups.update) {
                        Powerups.update();
                    }
                    updateFPS(timestamp);
                }
                requestAnimationFrame(gameLoop);
            }

            requestAnimationFrame(gameLoop);
        },
        loadLevel,
        createBlock,
        createGrid
    };
})();

// Initialize the game
window.addEventListener('load', () => {
    try {
        console.log('Initializing game...');
        if (typeof Music !== 'undefined' && Music.init) {
            console.log('Initializing Music module...');
            Music.init();
        }

        if (typeof SoundManager !== 'undefined' && SoundManager.init) {
            console.log('Initializing Sound Manager...');
            SoundManager.init();

            if (typeof Menu !== 'undefined') {
                const originalStartGame = Menu.startGame;
                Menu.startGame = function() {
                    SoundManager.resume();
                    return originalStartGame.apply(this, arguments);
                };
            }
        } else {
            console.warn('Sound Manager not found or not properly defined');
        }

        GameState.init();

        if (typeof CutsceneManager !== 'undefined') {
            console.log('Initializing Cutscene Manager...');
        }

        if (typeof Boss !== 'undefined' && Boss.init) {
            console.log("Initializing Boss module...");
            Boss.init(GameState);
        } else {
            console.error('Boss module not found or properly defined');
        }

        if (typeof Lives !== 'undefined' && Lives.init) {
            console.log('Initializing Lives module...');
            Lives.init(GameState);
        } else {
            console.error('Lives module not found or not properly defined');
        }

        // Initialize Level Editor
        if (typeof LevelEditor !== 'undefined' && LevelEditor.init) {
            console.log('Initializing Level Editor module...');
            LevelEditor.init(GameState);
        } else {
            console.error('Level Editor module not found or not properly defined');
        }

        GameState.loadLevel(0);

        if (typeof Menu !== 'undefined' && Menu.init) {
            console.log('Initializing Menu module...');
            Menu.init(GameState);
        } else {
            console.error('Menu module not found or not properly defined');
        }

        GameState.setState({ isPaused: true });

        if (typeof Movement !== 'undefined' && Movement.init) {
            console.log('Initializing Movement module...');
            Movement.init(GameState);
        } else {
            console.error('Movement module not found or not properly defined');
        }

        if (typeof Ball !== 'undefined' && Ball.init) {
            console.log('Initializing Ball module...');
            Ball.init(GameState);
        } else {
            console.error('Ball module not found or not properly defined');
        }

        if (typeof Powerups !== 'undefined' && Powerups.init) {
            console.log('Initializing Powerups module...');
            Powerups.init(GameState);
        } else {
            console.error('Powerups module not found or not properly defined');
        }

        if (typeof Score !== 'undefined') {
            console.log('Initializing Score module...');
            Score.init();
        } else {
            console.error('Score module not found');
        }
        if (typeof Scoreboard !== 'undefined' && Scoreboard.init) {
            Scoreboard.init();
        } else {
            console.error('Scoreboard module not found');
        }

        GameState.startGameLoop();

        // this prevents the arrow keys from scrolling
        window.addEventListener('keydown', (e) => {
            if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
        });

        if (typeof Menu !== 'undefined') {
            const originalCoinInsert = Menu.coinInsert;
            Menu.coinInsert = function() {
                originalCoinInsert.apply(this, arguments);
                if (typeof Music !== 'undefined' && Music.playTropicalTheme) {
                    Music.resume().then(() => {
                        Music.playTropicalTheme();
                    });
                }
            };
        }
    } catch (err) {
        console.error('Init error:', err);
    }
});
