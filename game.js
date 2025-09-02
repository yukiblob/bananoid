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

        // horizontal lines
        for (let y = 100; y < 600; y += 50) {
            const line = document.createElement('div');
            line.className = 'grid-line horizontal';
            line.style.top = `${y}px`;
            gameArea.appendChild(line);
        }

        // vertical lines
        for (let x = 100; x < 800; x += 100) {
            const line = document.createElement('div');
            line.className = 'grid-line vertical';
            line.style.left = `${x}px`;
            gameArea.appendChild(line);
        }
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