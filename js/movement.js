const Movement = (function() {
    let gameState;

    function handleInput() {
        const state = gameState.getState();

        if (state.keys['ArrowRight']) {
            gameState.setState({
                paddleSpeed: Math.min(state.paddleSpeed + 0.5, state.maxPaddleSpeed)
            });
        }
        else if (state.keys['ArrowLeft']) {
            gameState.setState({
                paddleSpeed: Math.max(state.paddleSpeed - 0.5, -state.maxPaddleSpeed)
            });
        }
        // this slows the paddle down when no key is pressed
        else {
            if (state.paddleSpeed > 0) {
                gameState.setState({
                    paddleSpeed: Math.max(state.paddleSpeed - 0.3, 0)
                });
            } else if (state.paddleSpeed < 0) {
                gameState.setState({
                    paddleSpeed: Math.min(state.paddleSpeed + 0.3, 0)
                });
            }
        }
    }

    function updatePaddle() {
        const state = gameState.getState();
        const paddle = document.getElementById('paddle');
        const paddleWidth = parseInt(getComputedStyle(paddle).width);

        let newPaddleX = state.paddleX + state.paddleSpeed;

        newPaddleX = Math.max(paddleWidth/2, Math.min(newPaddleX, 800 - paddleWidth/2));
        gameState.setState({ paddleX: newPaddleX });
        paddle.style.left = `${newPaddleX - paddleWidth/2}px`;
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