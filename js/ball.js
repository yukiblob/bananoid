const Ball = (function() {
    let gameState;
    let ballElement;
    const ballRadius = 10;
    let ballX, ballY;
    let ballSpeedX = 0, ballSpeedY = 0;
    let isBallLaunched = false;
    const baseSpeed = 5;
    let accelerationFactor = 1.0;

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
        const paddleRect = paddle.getBoundingClientRect();
        const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

        ballX = state.paddleX;
        ballY = paddleRect.top - ballRadius - gameAreaRect.top;
        ballSpeedX = 0;
        ballSpeedY = 0;
        isBallLaunched = false;

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

    function checkWallCollision() {
        const gameArea = document.getElementById('gameArea');
        const gameAreaWidth = gameArea.offsetWidth;
        const gameAreaHeight = gameArea.offsetHeight;

        // left and right walls
        if (ballX - ballRadius <= 0) {
            ballX = ballRadius;
            ballSpeedX = Math.abs(ballSpeedX);
        } else if (ballX + ballRadius >= gameAreaWidth) {
            ballX = gameAreaWidth - ballRadius;
            ballSpeedX = -Math.abs(ballSpeedX);
        }

        // top wall
        if (ballY - ballRadius <= 0) {
            ballY = ballRadius;
            ballSpeedY = Math.abs(ballSpeedY);
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
        const paddleRect = paddle.getBoundingClientRect();
        const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

        const paddleTop = paddleRect.top - gameAreaRect.top;
        const paddleLeft = paddleRect.left - gameAreaRect.left;
        const paddleRight = paddleLeft + paddleRect.width;
        const paddleBottom = paddleTop + paddleRect.height;

        if (ballY + ballRadius >= paddleTop &&
            ballY - ballRadius <= paddleBottom &&
            ballX + ballRadius >= paddleLeft &&
            ballX - ballRadius <= paddleRight) {
            
                const hitPosition = (ballX - (paddleLeft + paddleRect.width / 2)) / (paddleRect.width / 2);
                const maxBounceAngle = 75 * Math.PI / 180; // 75 degrees max bounce

                const angle = hitPosition * maxBounceAngle;
                const speed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
                ballSpeedX = speed * Math.sin(angle) * accelerationFactor;
                ballSpeedY = -speed * Math.cos(angle) * accelerationFactor;

                ballY = paddleTop - ballRadius;

                return true;
        }
        return false;
    }

    function update() {
        if (!isBallLaunched) {
            // ball should follow paddle
            const state = gameState.getState();
            const paddle = document.getElementById('paddle');
            const paddleRect = paddle.getBoundingClientRect();
            const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

            ballX = state.paddleX;
            ballY = paddleRect.top - ballRadius - gameAreaRect.top;
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