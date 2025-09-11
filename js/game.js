// FIX: weird bug occurs when hitting the edge of the block sometimes it doesn't bounce back.
// FIX: paddle corners weird ball behaviour.
const GameState = (function() {
    const state = {
        paddleX: 400, // center position
        paddleSpeed: 0,
        maxPaddleSpeed: 10,
        keys: {},
        lastTime: 0,
        isPaused: false,
        fps: 60,
        frameCount: 0,
        lastFPSUpdate: 0
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
        startGameLoop() {
            function gameLoop(timestamp) {
                if (!state.isPaused) {
                    if (typeof Movement !== 'undefined' && Movement.update) {
                        Movement.update();
                    }
                    if (typeof Ball !== 'undefined' && Ball.update) {
                        Ball.update();
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

        GameState.loadLevel(0);

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
