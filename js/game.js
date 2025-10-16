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

        let allLevels = [];

        try {
            // Try to load from API first
            const response = await fetch('http://localhost:8080/api/levels');
            if (response.ok) {
                const data = await response.json();
                allLevels = data.levels || [];
            }
        } catch (error) {
            console.warn('Could not load levels from API, using default levels');
        }

        // If no levels from API, use default levels
        if (allLevels.length === 0) {
            allLevels =
                (typeof levels !== "undefined" && Array.isArray(levels)) ? levels :
                    (typeof window !== "undefined" && Array.isArray(window.levels)) ? window.levels :
                        defaultLevels;
        }

        state.totalLevels = allLevels.length;
        state.currentLevel = levelIndex;

        const grid = allLevels[levelIndex]?.data || allLevels[levelIndex] || allLevels[0]?.data || allLevels[0];

        const blockWidth = 80;
        const blockHeight = 30;
        const gap = 2;

        const cols = grid[0].length;

        const totalWidth = cols * blockWidth + (cols - 1) * gap;

        // center horizontally and keep a bit of padding from the top
        const offsetX = (gameArea.clientWidth - totalWidth) / 2;
        const offsetY = 40; // small top margin

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
    }

    // Win Condition/screen
    function checkWinCondition() {
        const breakableBlocks = document.querySelectorAll('.block:not(.unbreakable)');

        if (breakableBlocks.length === 0) {
            showWinScreen();
            return true;
        }
        return false;
    }

    function showWinScreen() {
        // Pause the game
        state.isPaused = true;

        // Calculate final score
        const finalScore = typeof Score !== 'undefined' ? Score.getScore() : 0;
        const timeElapsed = typeof Timer !== 'undefined' ? Timer.getElapsedTime() : 0;
        const livesLeft = typeof Lives !== 'undefined' ? Lives.getCurrentLives() : 0;

        // Create win screen
        const winScreen = document.createElement('div');
        winScreen.id = "winScreen";
        winScreen.className = 'win-screen';

        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;

        winScreen.innerHTML = `
             <div class="win-content">
                <div class="title-wrapper">
                    <h1 class="menu-title">LEVEL COMPLETE!</h1>
                    <h2 class="menu-subtitle">CONGRATULATIONS</h2>
                </div>
                <div class="win-stats">
                    <p>Final Score: <span class="score-value">${finalScore}</span></p>
                    <p>Time: <span class="time-value">${minutes}:${seconds.toString().padStart(2, '0')}</span></p>
                    <p>Lives Remaining: <span class="lives-value">${livesLeft}</span></p>
                </div>
                <div class="menu-buttons">
                    ${state.currentLevel < state.totalLevels - 1 ?
                '<div class="menu-button" data-action="nextLevel"><span class="arrow-indicator">▶</span><span class="button-text">Next Level</span></div>' :
                ''
            }
                <div class="menu-button" data-action="restart"><span class="arrow-indicator">▶</span><span class="button-text">Restart</span></div>
                <div class="menu-button" data-action="menu"><span class="arrow-indicator">▶</span><span class="button-text">Main Menu</span></div>
            </div>
        </div>
    `;

        document.getElementById('gameArea').appendChild(winScreen);

        // Initialize win screen navigation
        initWinScreenNavigation();

        // Add celebration effect
        createCelebrationEffects();
    }

    function initWinScreenNavigation() {
        const winScreen = document.getElementById('winScreen');
        if (!winScreen) return;

        let selectedButtonIndex = 0;
        let winButtons = [];

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

        function activateSelectedButton() {
            if (winButtons[selectedButtonIndex]) {
                const action = winButtons[selectedButtonIndex].getAttribute('data-action');
                handleWinScreenAction(action);
            }
        }

        function handleWinScreenAction(action) {
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
            }
        }

        // Get all win screen buttons
        winButtons = Array.from(winScreen.querySelectorAll('.menu-button'));

        // Set up initial selection
        updateButtonSelection();

        // Add keyboard event listener for win screen
        function handleWinScreenKeydown(e) {
            if (!document.getElementById('winScreen')) {
                // Win screen is gone, remove listener
                window.removeEventListener('keydown', handleWinScreenKeydown);
                return;
            }

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
                    // Escape goes to main menu
                    returnToMenu();
                    e.preventDefault();
                    break;
            }
        }

        // Add event listener
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

        if (winScreen) winScreen.remove();
        particles.forEach(particle => particle.remove());

        // Load next level
        const nextLevelIndex = state.currentLevel + 1;
        if (nextLevelIndex < state.totalLevels) {
            state.currentLevel = nextLevelIndex;
            loadLevel(nextLevelIndex);

            // Reset ball
            if (typeof Ball !== 'undefined' && Ball.reset) {
                Ball.reset();
            }

            // Unpause game
            state.isPaused = false;
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

        // Reset to current level
        loadLevel(state.currentLevel);

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
            Timer.start();
        }

        // Reset to first level
        state.currentLevel = 0;

        // Ensure game is paused
        state.isPaused = true;

        // Clear any existing blocks
        const gameArea = document.getElementById('gameArea');
        if (gameArea) {
            gameArea.querySelectorAll('.block').forEach(b => b.remove());
        }

        setTimeout(() => {
            if (typeof Music !== 'undefined' && Music.playTropicalTheme) {
                Music.resume().then(() => {
                    Music.playTropicalTheme();
                });
            }
        }, 100);

        // Show menu
        if (typeof Menu !== 'undefined' && Menu.show) {
            Menu.show();
        } else {
            // Fallback: if Menu module isn't available, just pause the game
            state.isPaused = true;
            console.warn('Menu module not available');
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
        showWinScreen,
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
