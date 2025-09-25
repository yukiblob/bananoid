const Ball = (function() {
    let gameState;
    let balls = new Map();
    const ballRadius = 10;
    const baseSpeed = 8;
    let accelerationFactor = 1.0;
    const accelerationRate = 1.01;
    let nextBallID = 1;

    function createBall() {
        const gameArea = document.getElementById('gameArea');
        const ballElement = document.createElement('div');
        const ballID = 'ball_' + nextBallID++;
        ballElement.id = ballID;
        ballElement.className = 'ball';
        ballElement.style.width = `${ballRadius * 2}px`;
        ballElement.style.height = `${ballRadius * 2}px`;
        gameArea.appendChild(ballElement);

        const ballData = {
            element: ballElement,
            x: 0, y: 0,
            speedX: 0, speedY: 0,
            isLaunched: false
        };

        balls.set(ballID, ballData);
        resetBall(ballID);

        return ballID;
    }

    function createBonusBall(x, y, originalVelocity, angleOffset) {
        const gameArea = document.getElementById('gameArea');
        const ballElement = document.createElement('div');
        const ballID = 'ball_' + nextBallID++;
        ballElement.id = ballID;
        ballElement.className = 'ball';
        ballElement.style.width = `${ballRadius * 2}px`;
        ballElement.style.height = `${ballRadius * 2}px`;
        ballElement.style.left = `${x - ballRadius}px`;
        ballElement.style.top = `${y - ballRadius}px`;
        gameArea.appendChild(ballElement);

        const originalAngle = Math.atan2(originalVelocity.y, originalVelocity.x);
        const originalSpeed = Math.sqrt(originalVelocity.x * originalVelocity.x + originalVelocity.y * originalVelocity.y);

        const newAngle = originalAngle + (angleOffset * Math.PI / 180);
        const speedX = originalSpeed * Math.cos(newAngle);
        const speedY = originalSpeed * Math.sin(newAngle);

        const ballData = {
            element: ballElement,
            x: x, y: y,
            speedX: speedX, speedY: speedY,
            isLaunched: true
        };

        balls.set(ballID, ballData);
        return ballID;
    }

    function getBallState(ballID) {
        return balls.get(ballID);
    }

    function getBallVelocity(ballID) {
        const ballData = balls.get(ballID);
        return ballData ? { x: ballData.speedX, y: ballData.speedY } : null;
    }

    function resetBall(ballID) {
        const ballData = balls.get(ballID);
        if (!ballData) return;

        const paddle = document.getElementById('paddle');
        const paddleRect = paddle.getBoundingClientRect();
        const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

        const paddleCenterX = paddleRect.left - gameAreaRect.left + paddleRect.width / 2;
        const paddleTop = paddleRect.top - gameAreaRect.top;

        ballData.x = paddleCenterX;
        ballData.y = paddleTop - ballRadius;
        ballData.speedX = 0;
        ballData.speedY = 0;
        ballData.isLaunched = false;

        updateBallPosition(ballData);
    }

    function resetAllBalls() {
        const ballIDs = Array.from(balls.keys());

        if (ballIDs.length > 0) {
            for (let i = 1; i < ballIDs.length; i++) {
                removeBall(ballIDs[i]);
            }
            resetBall(ballIDs[0]);
        } else {
            createBall();
        }
    }

    function updateBallPosition(ballData) {
        ballData.element.style.left = `${ballData.x - ballRadius}px`;
        ballData.element.style.top = `${ballData.y - ballRadius}px`;
    }

    function launchBall(ballID) {
        const ballData = balls.get(ballID);
        if (!ballData || ballData.isLaunched) return;

        const angle = (Math.random() * 120 - 60) * Math.PI / 180;
        ballData.speedX = baseSpeed * Math.sin(angle) * accelerationFactor;
        ballData.speedY = -baseSpeed * Math.cos(angle) * accelerationFactor;
        ballData.isLaunched = true;

        if (typeof gameState !== 'undefined' && gameState.startGame && !gameState.hasGameStarted()) {
            gameState.startGame();
        }
    }

    function launchAllBalls() {
        balls.forEach((ballData, ballID) => {
            if (!ballData.isLaunched) {
                launchBall(ballID);
            }
        });
    }

    function applyAcceleration(ballData) {
        accelerationFactor *= accelerationRate;
        const currentSpeed = Math.sqrt(ballData.speedX * ballData.speedX + ballData.speedY * ballData.speedY);
        const angle = Math.atan2(ballData.speedY, ballData.speedX);

        ballData.speedX = baseSpeed * Math.cos(angle) * accelerationFactor;
        ballData.speedY = baseSpeed * Math.sin(angle) * accelerationFactor;
    }

    function checkWallCollision(ballData) {
        const gameArea = document.getElementById('gameArea');
        const gameAreaWidth = gameArea.offsetWidth;
        const gameAreaHeight = gameArea.offsetHeight;

        // left and right walls
        if (ballData.x - ballRadius <= 0) {
            ballData.x = ballRadius;
            ballData.speedX = Math.abs(ballData.speedX);
            applyAcceleration(ballData);
        } else if (ballData.x + ballRadius >= gameAreaWidth) {
            ballData.x = gameAreaWidth - ballRadius;
            ballData.speedX = -Math.abs(ballData.speedX);
            applyAcceleration(ballData);
        }

        // top wall
        if (ballData.y - ballRadius <= 0) {
            ballData.y = ballRadius;
            ballData.speedY = Math.abs(ballData.speedY);
            applyAcceleration(ballData);
        }

        // bottom wall (lose a life)
        if (ballData.y + ballRadius >= gameAreaHeight) {
            return true; // ball lost
        }

        return false; // ball still in play
    }

    function checkPaddleCollision(ballData) {
        if (!ballData.isLaunched) return false;

        const paddle = document.getElementById('paddle');
        const paddleRect = paddle.getBoundingClientRect();
        const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

        const paddleTop = paddleRect.top - gameAreaRect.top;
        const paddleLeft = paddleRect.left - gameAreaRect.left;
        const paddleRight = paddleLeft + paddleRect.width;
        const paddleBottom = paddleTop + paddleRect.height;
        const paddleCenterX = paddleLeft + (paddleRect.width / 2);

        if (ballData.y + ballRadius >= paddleTop &&
            ballData.y - ballRadius <= paddleBottom &&
            ballData.x + ballRadius >= paddleLeft &&
            ballData.x - ballRadius <= paddleRight) {

            const hitPosition = (ballData.x - paddleCenterX) / (paddleRect.width / 2);
            const maxBounceAngle = 75 * Math.PI / 180; // 75 degrees max bounce

            const angle = hitPosition * maxBounceAngle;
            const speed = Math.sqrt(ballData.speedX * ballData.speedX + ballData.speedY * ballData.speedY);

            ballData.speedX = speed * Math.sin(angle) * accelerationFactor;
            ballData.speedY = -speed * Math.cos(angle) * accelerationFactor;

            ballData.y = paddleTop - ballRadius;

            applyAcceleration(ballData);
            return true;
        }
        return false;
    }

    function checkBlockCollisions(ballData) {
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
            if (ballData.x + ballRadius > blockLeft &&
                ballData.x - ballRadius < blockRight &&
                ballData.y + ballRadius > blockTop &&
                ballData.y - ballRadius < blockBottom) {

                // Collision detected
                const blockType = block.classList.contains("unbreakable") ? "unbreakable"
                    : block.classList.contains("strong") ? "strong"
                        : "normal";

                if (blockType !== "unbreakable") {
                    if (blockType === "strong") {
                        // Turn strong into normal on first hit
                        block.classList.remove("strong");
                        block.classList.add("normal");
                        if (typeof Score !== 'undefined') Score.add(50);
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
                const overlapLeft = ballData.x + ballRadius - blockLeft;
                const overlapRight = blockRight - (ballData.x - ballRadius);
                const overlapTop = ballData.y + ballRadius - blockTop;
                const overlapBottom = blockBottom - (ballData.y - ballRadius);

                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                if (minOverlap === overlapLeft) {
                    // hit from left
                    ballData.x = blockLeft - ballRadius;
                    ballData.speedX = -Math.abs(ballData.speedX);
                } else if (minOverlap === overlapRight) {
                    // hit from right
                    ballData.x = blockRight + ballRadius;
                    ballData.speedX = Math.abs(ballData.speedX);
                } else if (minOverlap === overlapTop) {
                    // hit from top
                    ballData.y = blockTop - ballRadius;
                    ballData.speedY = -Math.abs(ballData.speedY);
                } else if (minOverlap === overlapBottom) {
                    // hit from bottom
                    ballData.y = blockBottom + ballRadius;
                    ballData.speedY = Math.abs(ballData.speedY);
                }

                applyAcceleration(ballData);
                return true; // stop after first hit (one block per frame)
            }
        }
        return false;
    }

    function removeBall(ballID) {
        const ballData = balls.get(ballID);
        if (ballData) {
            ballData.element.remove();
            balls.delete(ballID);
        }
    }

    function update() {
        const ballsToRemove = [];

        balls.forEach((ballData, ballID) => {
            if (!ballData.isLaunched) {
                if (ballID === Array.from(balls.keys())[0]) {
                    const paddle = document.getElementById('paddle');
                    const paddleRect = paddle.getBoundingClientRect();
                    const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

                    const paddleCenterX = paddleRect.left - gameAreaRect.left + paddleRect.width / 2;
                    const paddleTop = paddleRect.top - gameAreaRect.top;

                    ballData.x = paddleCenterX;
                    ballData.y = paddleTop - ballRadius;
                }
            } else {
                ballData.x += ballData.speedX;
                ballData.y += ballData.speedY;

                if (checkWallCollision(ballData)) {
                    ballsToRemove.push(ballID);
                } else {
                    checkPaddleCollision(ballData);
                    checkBlockCollisions(ballData);
                }
            }

            updateBallPosition(ballData);
        });

        ballsToRemove.forEach(ballID => {
            removeBall(ballID);
        });

        if (balls.size === 0) {
            // implement life loss logic
            resetAllBalls();
        }
    }

    function setAcceleration(factor) {
        accelerationFactor = factor;
        
        balls.forEach((ballData) => {
            if (ballData.isLaunched) {
                const currentSpeed = Math.sqrt(ballData.speedX * ballData.speedX + ballData.speedY * ballData.speedY);
                const angle = Math.atan2(ballData.speedY, ballData.speedX);

                ballData.speedX = baseSpeed * Math.cos(angle) * accelerationFactor;
                ballData.speedY = baseSpeed * Math.sin(angle) * accelerationFactor;
            }
        });
    }

    return {
        init: function(GameState) {
            gameState = GameState;
            createBall();

            // key listener for launching
            window.addEventListener('keydown', (e) => {
                if (e.key === ' ' && !gameState.getState().isPaused) {
                    launchAllBalls();
                    e.preventDefault();
                }
            });
        },

        update: update,
        reset: resetAllBalls,
        createBonusBall: createBonusBall,
        getBallState: getBallState,
        getBallVelocity: getBallVelocity,
        getBallCount: function() { return balls.size; },
        removeBall: removeBall,
        setAcceleration: setAcceleration,

        getPosition: function() {
            const firstBall = balls.values().next().value;
            return firstBall ? { x: firstBall.x, y: firstBall.y, radius: ballRadius } : { x: 0, y: 0, radius: ballRadius };
        },

        getVelocity: function() {
            const firstBall = balls.values().next().value;
            return firstBall ? { x: firstBall.speedX, y: firstBall.speedY } : { x: 0, y: 0 };
        },

        isLaunched: function() {
            const firstBall = balls.values().next().value;
            return firstBall ? firstBall.isLaunched : false;
        }
    };
})();
