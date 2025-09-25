const Movement = (function() {
    let gameState;

    function handleInput() {
        const state = gameState.getState();
        let newSpeed = 0;

        if (state.keys['ArrowRight']) {
            newSpeed = state.maxPaddleSpeed;
        }
        else if (state.keys['ArrowLeft']) {
            newSpeed = -state.maxPaddleSpeed;
        } else {
            newSpeed = 0;
        }

        gameState.setState({ paddleSpeed: newSpeed });
    }

    function updatePaddle() {
        const state = gameState.getState();
        const paddle = document.getElementById('paddle');
        const gameArea = document.getElementById('gameArea');

        const paddleWidth = paddle.offsetWidth;
        const gameWidth = gameArea.clientWidth;

        // update center position
        let newPaddleX = state.paddleX + state.paddleSpeed;

        // clamp center so paddle never leaves walls
        if (newPaddleX < paddleWidth / 2) {
            newPaddleX = paddleWidth / 2;
        } else if (newPaddleX > gameWidth - paddleWidth / 2) {
            newPaddleX = gameWidth - paddleWidth / 2;
        }

        gameState.setState({ paddleX: newPaddleX });

        // position paddle with left offset
        paddle.style.left = `${newPaddleX - paddleWidth / 2}px`;

        paddle.style.bottom = '20px';
        paddle.style.top = 'auto';
    }

    return {
        init: function(GameState) {
            gameState = GameState;

            window.addEventListener('keydown', (e) => {
                gameState.setState({
                    keys: { ...gameState.getState().keys, [e.key]: true }
                });
            });

            window.addEventListener('keyup', (e) => {
                gameState.setState({
                    keys: { ...gameState.getState().keys, [e.key]: false }
                });
            });
        },

        update: function() {
            if (!gameState) {
                console.error('Movement module not properly initialized with GameState');
                return;
            }
            handleInput();
            updatePaddle();
        }
    };
})();
