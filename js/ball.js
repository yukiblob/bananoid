const Ball = (function() {
    let gameState;
    let ballElement;
    const ballRadius = 10;
    let ballX, ballY;
    let ballSpeedX = 0, ballSpeedY = 0;
    let isBallLaunched = false;
    const baseSpeed = 8;
    let accelerationFactor = 1.0;
    const accelerationRate = 1.01;

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
        const paddle = document.getElementById('paddle');
        const paddleRect = paddle.getBoundingClientRect();
        const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

        const paddleCenterX = paddleRect.left - gameAreaRect.left + paddleRect.width / 2;
        const paddleTop = paddleRect.top - gameAreaRect.top;

        ballX = paddleCenterX;
        ballY = paddleTop - ballRadius;
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

        if (typeof GameState !== 'undefined' && GameState.startGame && !GameState.hasGameStarted()) {
            GameState.startGame();
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
            if (typeof Lives !== 'undefined' && Lives.loseLife) {
                const isGameOver = Lives.loseLife();
                if (!isGameOver) {
                    resetBall();
                }
            } else {
                resetBall();
            }

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
        const paddleCenterX = paddleLeft + (paddleRect.width / 2);

        if (ballY + ballRadius >= paddleTop &&
            ballY - ballRadius <= paddleBottom &&
            ballX + ballRadius >= paddleLeft &&
            ballX - ballRadius <= paddleRight) {

            const hitPosition = (ballX - paddleCenterX) / (paddleRect.width / 2);
            const maxBounceAngle = 75 * Math.PI / 180; // 75 degrees max bounce

            const angle = hitPosition * maxBounceAngle;
            const speed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);

            ballSpeedX = speed * Math.sin(angle) * accelerationFactor;
            ballSpeedY = -speed * Math.cos(angle) * accelerationFactor;

            ballY = paddleTop - ballRadius;

            applyAcceleration();
            return true;
        }
        return false;
    }

    function checkBlockCollisions() {
        const blocks = document.querySelectorAll('.block');
        const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

        for (let block of blocks) {
            const rect = block.getBoundingClientRect();

            // Block position relative to gameArea
            const blockLeft = rect.left - gameAreaRect.left;
            const blockTop = rect.top - gameAreaRect.top;
            const blockRight = blockLeft + rect.width;
            const blockBottom = blockTop + rect.height;

            // Check overlap
            if (ballX + ballRadius > blockLeft &&
                ballX - ballRadius < blockRight &&
                ballY + ballRadius > blockTop &&
                ballY - ballRadius < blockBottom) {

                // Collision detected
                const blockType = block.classList.contains("unbreakable") ? "unbreakable"
                    : block.classList.contains("strong") ? "strong"
                        : "normal";

                if (blockType !== "unbreakable") {
                    if (blockType === "strong") {
                        // Turn strong into normal on first hit
                        block.classList.remove("strong");
                        block.classList.add("normal");
                        Score.add(50);
                    } else {
                        const blockRect = block.getBoundingClientRect();
                        const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

                        const blockCenterX = blockRect.left - gameAreaRect.left + blockRect.width / 2;
                        const blockCenterY = blockRect.top - gameAreaRect.top + blockRect.height / 2;

                        // Remove block
                        block.remove();
                        Score.add(100);

                        if (typeof Powerups !== 'undefined' && Powerups.createPill) {
                            Powerups.createPill(blockCenterX, blockCenterY);
                        }
                    }
                }

                // Adjust ball direction
                const overlapLeft = ballX + ballRadius - blockLeft;
                const overlapRight = blockRight - (ballX - ballRadius);
                const overlapTop = ballY + ballRadius - blockTop;
                const overlapBottom = blockBottom - (ballY - ballRadius);

                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                if (minOverlap === overlapLeft) {
                    // hit from left
                    ballX = blockLeft - ballRadius;
                    ballSpeedX = -Math.abs(ballSpeedX);
                } else if (minOverlap === overlapRight) {
                    // hit from right
                    ballX = blockRight + ballRadius;
                    ballSpeedX = Math.abs(ballSpeedX);
                } else if (minOverlap === overlapTop) {
                    // hit from top
                    ballY = blockTop - ballRadius;
                    ballSpeedY = -Math.abs(ballSpeedY);
                } else if (minOverlap === overlapBottom) {
                    // hit from bottom
                    ballY = blockBottom + ballRadius;
                    ballSpeedY = Math.abs(ballSpeedY);
                }

                applyAcceleration();
                return true; // stop after first hit (one block per frame)
            }
        }
        return false;
    }

    function update() {
        if (!isBallLaunched) {
            // ball should follow paddle
            const paddle = document.getElementById('paddle');
            const paddleRect = paddle.getBoundingClientRect();
            const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

            const paddleCenterX = paddleRect.left - gameAreaRect.left + paddleRect.width / 2;
            const paddleTop = paddleRect.top - gameAreaRect.top;

            ballX = paddleCenterX;
            ballY = paddleTop - ballRadius;
        } else {
            // move
            ballX += ballSpeedX;
            ballY += ballSpeedY;

            // check collisions
            checkWallCollision();
            checkPaddleCollision();
            checkBlockCollisions();
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
