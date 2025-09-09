const Ball = (function() {
    let gameState;
    let ballElement;
    const ballRadius = 10;
    let ballX, ballY;
    let ballSpeedX = 0, ballSpeedY = 0;
    let isBallLaunched = false;
    const baseSpeed = 10;
    let accelerationFactor = 1.0;
    const accelerationRate = 1.05;

    function createBall() {
        const gameArea = document.getElementById('gameArea');
        ballElement = document.createElement('div');
        ballElement.id = 'ball';
        ballElement.className = 'ball';
        ballElement.style.width = `${ballRadius * 2}px`;
        ballElement.style.height = `${ballRadius * 2}px`;
        gameArea.appendChild(ballElement);
    }

    function resetBall() {
        const state = gameState.getState();
        const paddle = document.getElementById('paddle');
        const paddleWidth = parseInt(getComputedStyle(paddle).width);

        ballX = state.paddleX;
        ballY = state.paddleY - ballRadius;

        ballSpeedX = 0;
        ballSpeedY = 0;
        isBallLaunched = false;
        accelerationFactor = 1.0;

        updateBallPosition();
    }

    function updateBallPosition() {
        ballElement.style.left = `${ballX - ballRadius}px`;
        ballElement.style.top = `${ballY - ballRadius}px`;
    }

    function launchBall() {
        if (!isBallLaunched) {
            const angle = (Math.random() * 120 - 60) * Math.PI / 180;
            ballSpeedX = baseSpeed * Math.sin(angle) * accelerationFactor;
            ballSpeedY = -baseSpeed * Math.cos(angle) * accelerationFactor;
            isBallLaunched = true;
        }
    }

    function applyAcceleration() {
        accelerationFactor *= accelerationRate;
        const currentSpeed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
        const angle = Math.atan2(ballSpeedY, ballSpeedX);

        ballSpeedX = baseSpeed * Math.cos(angle) * accelerationFactor;
        ballSpeedY = baseSpeed * Math.sin(angle) * accelerationFactor;
    }

    function checkWallCollision() {
        const gameArea = document.getElementById('gameArea');
        const gameAreaWidth = gameArea.offsetWidth;
        const gameAreaHeight = gameArea.offsetHeight;

        // left and right walls
        if (ballX - ballRadius <= 0) {
            ballX = ballRadius;
            ballSpeedX = Math.abs(ballSpeedX);
            applyAcceleration();
        } else if (ballX + ballRadius >= gameAreaWidth) {
            ballX = gameAreaWidth - ballRadius;
            ballSpeedX = -Math.abs(ballSpeedX);
            applyAcceleration();
        }

        // top wall
        if (ballY - ballRadius <= 0) {
            ballY = ballRadius;
            ballSpeedY = Math.abs(ballSpeedY);
            applyAcceleration();
        }

        // bottom wall (lose a life)
        if (ballY + ballRadius >= gameAreaHeight) {
            // TODO: Implement losing a life
            resetBall();
            return true; // ball lost
        }

        return false; // ball still in play
    }

    function checkPaddleCollision() {
        if (!isBallLaunched) return false;

        const paddle = document.getElementById('paddle');
        const paddleWidth = parseInt(getComputedStyle(paddle).width);
        const paddleHeight = parseInt(getComputedStyle(paddle).height);
        const state = gameState.getState();
        

        const paddleTop = state.paddleY - paddleHeight;
        const paddleLeft = state.paddleX - paddleWidth / 2;
        const paddleRight = state.paddleX + paddleWidth / 2;
        const paddleBottom = state.paddleY;

        if (ballY + ballRadius >= paddleTop &&
            ballY - ballRadius <= paddleBottom &&
            ballX + ballRadius >= paddleLeft &&
            ballX - ballRadius <= paddleRight) {
            
                const hitPosition = (ballX - state.paddleX) / (paddleWidth / 2);
                const maxBounceAngle = 75 * Math.PI / 180; // 75 degrees max bounce

                const currentAngle = Math.atan2(ballSpeedY, ballSpeedX);
                let newAngle;

                if (ballSpeedX > 0) {
                    newAngle = Math.PI - hitPosition * maxBounceAngle;
                } else {
                    newAngle = hitPosition * maxBounceAngle;
                }

                if (Math.abs(newAngle) > Math.PI / 2) {
                    newAngle = Math.PI - newAngle;
                }

                const speed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);

                ballSpeedX = speed * Math.sin(newAngle) * accelerationFactor;
                ballSpeedY = -speed * Math.cos(newAngle) * accelerationFactor;

                ballY = paddleTop - ballRadius;

                applyAcceleration();
                return true;
        }
        return false;
    }

    function update() {
        if (!isBallLaunched) {
            // ball should follow paddle
            const state = gameState.getState();
            ballX = state.paddleX;
            ballY = state.paddleY - ballRadius;
        } else {
            // move
            ballX += ballSpeedX;
            ballY += ballSpeedY;

            // check collisions
            checkWallCollision();
            checkPaddleCollision();

            // TODO: check block collisions
        }
        updateBallPosition();
    }

    function setAcceleration(factor) {
        accelerationFactor = factor;
        if (isBallLaunched) {
            const currentSpeed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
            const angle = Math.atan2(ballSpeedY, ballSpeedX);

            ballSpeedX = baseSpeed * Math.cos(angle) * accelerationFactor;
            ballSpeedY = baseSpeed * Math.sin(angle) * accelerationFactor;
        }
    }

    return {
        init: function(GameState) {
            gameState = GameState;
            createBall();
            resetBall();

            // key listener for launching
            window.addEventListener('keydown', (e) => {
                if (e.key === ' ' && !gameState.getState().isPaused) {
                    launchBall();
                    e.preventDefault();
                }
            });
        },

        update: function() {
            if (!gameState.getState().isPaused) {
                update();
            }
        },

        reset: function() {
            resetBall();
        },

        setAcceleration: setAcceleration,

        getPosition: function() {
            return { x: ballX, y: ballY, radius: ballRadius };
        },

        getVelocity: function() {
            return { x: ballSpeedX, y: ballSpeedY };
        },

        isLaunched: function() {
            return isBallLaunched;
        }
    };
})();