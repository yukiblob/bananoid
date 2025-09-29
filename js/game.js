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

    function loadLevel(levelIndex = 0) {
        const gameArea = document.getElementById("gameArea");
        if (!gameArea) return;

        // clear old blocks
        gameArea.querySelectorAll(".block").forEach(b => b.remove());

        const defaultLevels = [
            [
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [0, 0, 1, 1, 1, 1, 1, 1, 3, 0, 0],
                [2, 2, 2, 0, 0, 3, 3, 0, 2, 2, 2],
            ]
        ];
        const source =
            (typeof levels !== "undefined" && Array.isArray(levels)) ? levels :
                (typeof window !== "undefined" && Array.isArray(window.levels)) ? window.levels :
                    defaultLevels;

        state.totalLevels = source.length;
        state.currentLevel = levelIndex;

        const grid = source[levelIndex] || source[0];

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
                <h2>Level Complete!</h2>
                <div class="win-stats">
                    <p>Final Score: <span class="score-value">${finalScore}</span></p>
                    <p>Time: <span class="time-value">${minutes}:${seconds.toString().padStart(2, '0')}</span></p>
                    <p>Lives Remaining: <span class="lives-value">${livesLeft}</span></p>
                </div>
                <div class="win-buttons">
                    ${state.currentLevel < state.totalLevels - 1 ?
                '<button onclick="GameState.nextLevel()" class="next-level-btn">Next Level</button>' :
                ''
            }
                    <button onclick="GameState.restartGame()" class="restart-btn">Restart</button>
                    <button onclick="GameState.returnToMenu()" class="menu-btn">Main Menu</button>
                </div>
            </div>
        `;

        document.getElementById('gameArea').appendChild(winScreen);

        // Add celebration effect
        createCelebrationEffects();
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
        document.querySelectorAll('#winscreen, .celebration-particle').forEach(el => el.remove());

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

    //NOTE: this exists in Lives.js, will fix it
    function restartGame() {
        // Remove win screen and particles
        document.querySelectorAll('#winscreen, .celebration-particle').forEach(el => el.remove());

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

        // Unpause game
        state.isPaused = false;
    }

    function returnToMenu() {
        // Remove win screen and particles
        document.querySelectorAll('#winscreen, .celebration-particle').forEach(el => el.remove());

        // Reset to first level
        state.currentLevel = 0;
        loadLevel(0);

        // Reset game elements
        if (typeof Ball !== 'undefined' && Ball.reset) {
            Ball.reset();
        }

        if (typeof Lives !== 'undefined' && Lives.setLives) {
            Lives.setLives(3);
        }

        // Show menu
        if (typeof Menu !== 'undefined' && Menu.showGameMenu) {
            Menu.showGameMenu();
        }

        state.isPaused = true;
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
        GameState.init();

        if (typeof Lives !== 'undefined' && Lives.init) {
            console.log('Initializing Lives module...');
            Lives.init(GameState);
        } else {
            console.error('Lives module not found or not properly defined');
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
    } catch (err) {
        console.error('Init error:', err);
    }
});
