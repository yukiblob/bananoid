const GameState = (function() {
    const state = {
        paddleX: 400, // center position 
        paddleSpeed: 0,
        maxPaddleSpeed: 10,
        keys: {},
        lastTime: 0,
        fps: 60,
        isPaused: false
    };

    // Create background grid
    function createGrid() {
        const gameArea = document.getElementById('gameArea');
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

    // Level load
    function loadLevel(levelIndex) {
        const gameArea = document.getElementById("gameArea");
        gameArea.querySelectorAll(".block").forEach(b => b.remove());

        const grid = levels[levelIndex];
        const blockWidth = 80;
        const blockHeight = 30;
        const offsetX = 50;
        const offsetY = 50;

        grid.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell != 0) {
                    let type = "normal";
                    if (cell == 2) type = "strong";
                    if (cell == 3) type = "unbreakable";
                    createBlock(
                        offsetX + colIndex + blockWidth,
                        offsetY + rowIndex + blockHeight,
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
        if (state.lastTime !== 0) {
            const deltaTime = now - state.lastTime;
            state.fps = Math.round(1000 / deltaTime);
        }
        state.lastTime = now;
        document.getElementById('fpsCounter').textContent = `FPS: ${state.fps}`;
    }

    return {
        init: function() {
            createGrid();
            return { ...state };
        },

        getState: function() {
            return { ...state };
        },

        setState: function(newState) {
            for (let key in newState) {
                if (state.hasOwnProperty(key)) {
                    state[key] = newState[key];
                }
            }
        },

        startGameLoop: function() {
            function gameLoop(timestamp) {
                if (!state.isPaused) {
                    if (typeof Movement !== 'undefined' && Movement.update) {
                        Movement.update();
                    }
                    updateFPS(timestamp);
                }
                requestAnimationFrame(gameLoop);
            }

            requestAnimationFrame(gameLoop);
        }
    };
})();

// Initialize the game
window.addEventListener('load', () => {
    console.log('Initializing game...');
    GameState.init();


    if (typeof Movement !== 'undefined' && Movement.init) {
        console.log('Initializing Movement module...');
        Movement.init(GameState);
    } else {
        console.error('Movement module not found or not properly defined');
    }

    GameState.startGameLoop();

    // this prevents the arrow keys from scrolling
    window.addEventListener('keydown', (e) => {
        if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
    });
});
