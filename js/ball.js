const Ball = (function() {
    let gameState;
    let balls = new Map();
    const ballRadius = 10;
    const baseSpeed = 8;
    const MAX_SPEED_MULTIPLIER = 1.8;
    const MAX_SPEED = baseSpeed * MAX_SPEED_MULTIPLIER;
    let accelerationFactor = 1.0;
    const accelerationRate = 1.006;
    let nextBallID = 1;
    let stickyPowerupActive = false;
    let stuckBalls = new Map();
    let ballGracePeriods = new Map();
    const STICKY_GRACE_PERIOD = 150;

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
        const cappedSpeed = Math.min(originalSpeed, MAX_SPEED);

        const newAngle = originalAngle + (angleOffset * Math.PI / 180);
        const speedX = cappedSpeed * Math.cos(newAngle);
        const speedY = cappedSpeed * Math.sin(newAngle);

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
            accelerationFactor = 1.00;
            resetBall(ballIDs[0]);
        } else {
            accelerationFactor = 1.00;
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

        if (stuckBalls.has(ballID)) {
            launchStuckBall(ballID);
            return;
        }

        const angle = (Math.random() * 60 - 30) * Math.PI / 180;
        ballData.speedX = baseSpeed * Math.sin(angle) * accelerationFactor;
        ballData.speedY = -baseSpeed * Math.cos(angle) * accelerationFactor;
        ballData.isLaunched = true;

        setGracePeriod(ballID);

        if (typeof gameState !== 'undefined' && gameState.startGame && !gameState.hasGameStarted()) {
            gameState.startGame();
        }
    }

    function launchAllBalls() {
        balls.forEach((ballData, ballID) => {
            if (!ballData.isLaunched || stuckBalls.has(ballID)) {
                launchBall(ballID);
            }
        });
    }

    function stickBall(ballID, ballData) {
        if (!stickyPowerupActive) return false;

        const paddle = document.getElementById('paddle');
        const paddleRect = paddle.getBoundingClientRect();
        const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

        const paddleLeft = paddleRect.left - gameAreaRect.left;
        const paddleCenterX = paddleLeft + (paddleRect.width / 2);

        const offsetX = ballData.x - paddleCenterX;

        stuckBalls.set(ballID, {
            offsetX: offsetX,
            paddleCenterX: paddleCenterX,
            paddleWidth: paddleRect.width,
            originalAcceleration: accelerationFactor
        });

        ballData.speedX = 0;
        ballData.speedY = 0;
        ballData.isLaunched = false;

        return true;
    }

    function updateStuckBalls() {
        if (stuckBalls.size === 0) return;

        const paddle = document.getElementById('paddle');
        const paddleRect = paddle.getBoundingClientRect();
        const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

        const paddleLeft = paddleRect.left - gameAreaRect.left;
        const paddleTop = paddleRect.top - gameAreaRect.top;
        const paddleCenterX = paddleLeft + (paddleRect.width / 2);

        stuckBalls.forEach((stuckData, ballID) => {
            const ballData = balls.get(ballID);
            if (ballData) {
                ballData.x = paddleCenterX + stuckData.offsetX;
                ballData.y = paddleTop - ballRadius;
                stuckData.paddleCenterX = paddleCenterX;
                stuckData.paddleWidth = paddleRect.width;
                updateBallPosition(ballData);
            }
        });
    }

    function launchStuckBall(ballID) {
        const stuckData = stuckBalls.get(ballID);
        const ballData = balls.get(ballID);

        if (!stuckData || !ballData) return;

        const hitPosition = (ballData.x - stuckData.paddleCenterX) / (stuckData.paddleWidth / 2);
        const maxBounceAngle = 75 * Math.PI / 180;

        const angle = hitPosition * maxBounceAngle;
        const speed = Math.min(baseSpeed * accelerationFactor, MAX_SPEED);

        ballData.speedX = speed * Math.sin(angle);
        ballData.speedY = -speed * Math.cos(angle);
        ballData.isLaunched = true;

        setGracePeriod(ballID);

        stuckBalls.delete(ballID);
    }

    function launchAllStuckBalls() {
        const ballIDs = Array.from(stuckBalls.keys());
        ballIDs.forEach(ballID => launchStuckBall(ballID));
    }

    function setStickyPowerup(active) {
        stickyPowerupActive = active;

        if (!active) {
            launchAllStuckBalls();
        }
    }

    function applyAcceleration(ballData) {
        const currentSpeed = Math.sqrt(ballData.speedX * ballData.speedX + ballData.speedY * ballData.speedY);
        if (currentSpeed < MAX_SPEED) {
            accelerationFactor *= accelerationRate;

            const newSpeed = Math.min(baseSpeed * accelerationFactor, MAX_SPEED);
            const angle = Math.atan2(ballData.speedY, ballData.speedX);

            ballData.speedX = newSpeed * Math.cos(angle);
            ballData.speedY = newSpeed * Math.sin(angle);
        }
    }

    function checkWallCollision(ballData) {
        const gameArea = document.getElementById('gameArea');
        const gameAreaWidth = gameArea.offsetWidth;
        const gameAreaHeight = gameArea.offsetHeight;

        let collision = false;

        // left and right walls
        if (ballData.x - ballRadius <= 0) {
            ballData.x = ballRadius;
            ballData.speedX = Math.abs(ballData.speedX);
            applyAcceleration(ballData);
            collision = true;
        } else if (ballData.x + ballRadius >= gameAreaWidth) {
            ballData.x = gameAreaWidth - ballRadius;
            ballData.speedX = -Math.abs(ballData.speedX);
            applyAcceleration(ballData);
            collision = true;
        }

        // top wall
        if (ballData.y - ballRadius <= 0) {
            ballData.y = ballRadius;
            ballData.speedY = Math.abs(ballData.speedY);
            applyAcceleration(ballData);
            collision = true;
        }

        if (collision && typeof SoundManager !== 'undefined') {
            SoundManager.playWallHit();
        }

        // bottom wall (lose a life)
        if (ballData.y + ballRadius >= gameAreaHeight) {
            return true; // ball lost
        }

        return false; // ball still in play
    }

    function checkPaddleCollision(ballData) {
        if (!ballData.isLaunched) return false;

        const ballID = Array.from(balls.keys()).find(id => balls.get(id) === ballData);
        if (ballID && isInGrace(ballID)) {
            return false;
        }

        const paddle = document.getElementById('paddle');
        const paddleRect = paddle.getBoundingClientRect();
        const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

        const paddleTop = paddleRect.top - gameAreaRect.top;
        const paddleLeft = paddleRect.left - gameAreaRect.left;
        const paddleRight = paddleLeft + paddleRect.width;
        const paddleBottom = paddleTop + paddleRect.height;
        const paddleCenterX = paddleLeft + (paddleRect.width / 2);

        const ballLeft = ballData.x - ballRadius;
        const ballRight = ballData.x + ballRadius;
        const ballTop = ballData.y - ballRadius;
        const ballBottom = ballData.y + ballRadius;

        if (ballBottom >= paddleTop &&
            ballTop <= paddleBottom &&
            ballRight >= paddleLeft &&
            ballLeft <= paddleRight) {
            const overlapLeft = ballRight - paddleLeft;
            const overlapRight = paddleRight - ballLeft;
            const overlapTop = ballBottom - paddleTop;
            const overlapBottom = paddleBottom - ballTop;

            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapTop) {
                if (stickyPowerupActive && !stuckBalls.has(ballID)) {
                    if (stickBall(ballID, ballData)) {
                        if (typeof SoundManager !== 'undefined') {
                            SoundManager.playPaddleHit();
                        }
                        return true;
                    }
                }

                const hitPosition = (ballData.x - paddleCenterX) / (paddleRect.width / 2);
                const maxBounceAngle = 75 * Math.PI / 180;

                const angle = hitPosition * maxBounceAngle;
                const currentSpeed = Math.sqrt(ballData.speedX * ballData.speedX + ballData.speedY * ballData.speedY);
                const speed = Math.min(currentSpeed, MAX_SPEED);

                ballData.speedX = speed * Math.sin(angle);
                ballData.speedY = -speed * Math.cos(angle);

                ballData.y = paddleTop - ballRadius;

                applyAcceleration(ballData);
            }

            else if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                ballData.speedX = -ballData.speedX;

                if (minOverlap === overlapLeft) {
                    ballData.x = paddleLeft - ballRadius;
                } else {
                    ballData.x = paddleRight + ballRadius;
                }
                applyAcceleration(ballData);
            }

            if (typeof SoundManager !== 'undefined') {
                SoundManager.playPaddleHit();
            }
            return true;
        }
        return false;
    }

    function setGracePeriod(ballID) {
        ballGracePeriods.set(ballID, Date.now() + STICKY_GRACE_PERIOD);
    }
    function isInGrace(ballID) {
        const graceEnd = ballGracePeriods.get(ballID);
        return graceEnd && Date.now() < graceEnd;
    }

    function checkBlockCollisions(ballData) {
        const blocks = document.querySelectorAll('.block');
        const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

        let collision = false
        let collisionStep = -1;
        let collidedBlock = null;
        let blockRectData = null;

        const steps = calculateSteps(ballData);
        const stepX = ballData.speedX / steps;
        const stepY = ballData.speedY / steps;

        const originalX = ballData.x;
        const originalY = ballData.y;

        for (let step = 0; step < steps; step++) {
            const testX = originalX + stepX * step;
            const testY = originalY + stepY * step;

            for (let block of blocks) {
                if (!block.parentElement) continue;

                const rect = block.getBoundingClientRect();

                // Block position relative to gameArea
                const blockLeft = rect.left - gameAreaRect.left;
                const blockTop = rect.top - gameAreaRect.top;
                const blockRight = blockLeft + rect.width;
                const blockBottom = blockTop + rect.height;

                if (testX + ballRadius > blockLeft &&
                    testX - ballRadius < blockRight &&
                    testY + ballRadius > blockTop &&
                    testY - ballRadius < blockBottom) {

                    collision = true;
                    collisionStep = step;
                    collidedBlock = block;
                    blockRectData = { blockLeft, blockTop, blockRight, blockBottom }

                    break;
                }
            }
            if (collision) break;
        }
        if (collision && collisionStep >= 0) {
            if (collisionStep === 0) {
                ballData.x = originalX - Math.sign(ballData.speedX) * 0.1;
                ballData.y = originalY - Math.sign(ballData.speedY) * 0.1;
            } else {
                ballData.x = originalX + stepX * (collisionStep - 1);
                ballData.y = originalY + stepY * (collisionStep - 1);
            }

            handleBlockCollision(ballData, collidedBlock,
                blockRectData.blockLeft, blockRectData.blockTop,
                blockRectData.blockRight, blockRectData.blockBottom);
            return true;
        }

        return false;
    }

    function calculateSteps(ballData) {
        const distance = Math.sqrt(ballData.speedX * ballData.speedX + ballData.speedY * ballData.speedY);
        const steps = Math.max(2, Math.min(8, Math.ceil(distance / 5)));
        return steps;
    }

    function handleBlockCollision(ballData, block, blockLeft, blockTop, blockRight, blockBottom) {
        const overlapLeft = (ballData.x + ballRadius) - blockLeft;
        const overlapRight = blockRight - (ballData.x - ballRadius);
        const overlapTop = (ballData.y + ballRadius) - blockTop;
        const overlapBottom = blockBottom - (ballData.y - ballRadius);

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapLeft) {
            ballData.x = blockLeft - ballRadius - 0.1;
            ballData.speedX = -Math.abs(ballData.speedX);
        } else if (minOverlap === overlapRight) {
            ballData.x = blockRight + ballRadius + 0.1;
            ballData.speedX = Math.abs(ballData.speedX);
        } else if (minOverlap === overlapTop) {
            ballData.y = blockTop - ballRadius - 0.1;
            ballData.speedY = -Math.abs(ballData.speedY);
        } else if (minOverlap === overlapBottom) {
            ballData.y = blockBottom + ballRadius + 0.1;
            ballData.speedY = Math.abs(ballData.speedY);
        }

        if (typeof SoundManager !== 'undefined') {
            SoundManager.playBrickHit();
        }

        const blockType = block.classList.contains("unbreakable") ? "unbreakable"
            : block.classList.contains("strong") ? "strong"
                : "normal";

        if (blockType !== "unbreakable") {
            if (blockType === "strong") {
                block.classList.remove("strong");
                block.classList.add("normal");
                if (typeof Score !== "undefined") Score.add(50);
            } else {
                const blockRect = block.getBoundingClientRect();
                const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

                const blockCenterX = blockRect.left - gameAreaRect.left + blockRect.width / 2;
                const blockCenterY = blockRect.top - gameAreaRect.top + blockRect.height / 2;

                block.remove();
                Score.add(100);

                if (typeof Powerups !== 'undefined' && Powerups.createPill) {
                    Powerups.createPill(blockCenterX, blockCenterY);
                }
            }

            setTimeout(() => {
                if (typeof GameState !== 'undefined' && GameState.checkWinCondition) {
                    GameState.checkWinCondition();
                }
            }, 0);
        }
        applyAcceleration(ballData);
    }

    function removeBall(ballID) {
        const ballData = balls.get(ballID);
        if (ballData) {
            ballData.element.remove();
            balls.delete(ballID);
        }
    }

    function update() {
        normalizeBallSpeed();
        const ballsToRemove = [];

        updateStuckBalls();

        const currentTime = Date.now();
        ballGracePeriods.forEach((graceEnd, ballID) => {
            if (currentTime >= graceEnd) {
                ballGracePeriods.delete(ballID);
            }
        });

        balls.forEach((ballData, ballID) => {

            if (stuckBalls.has(ballID)) return;

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
            stuckBalls.delete(ballID);
            ballGracePeriods.delete(ballID);
        });

        if (balls.size === 0) {
            if (typeof Lives !== 'undefined' && Lives.loseLife) {
                const isGameOver = Lives.loseLife();
                if (!isGameOver) {
                    resetAllBalls();
                }
            } else {
                resetAllBalls();
            }
        }
    }

    function setAcceleration(factor) {
        accelerationFactor = Math.min(factor, MAX_SPEED_MULTIPLIER);

        balls.forEach((ballData) => {
            if (ballData.isLaunched) {
                const angle = Math.atan2(ballData.speedY, ballData.speedX);
                const speed = Math.min(baseSpeed * accelerationFactor, MAX_SPEED);

                ballData.speedX = speed * Math.cos(angle);
                ballData.speedY = speed * Math.sin(angle);
            }
        });
    }

    function normalizeBallSpeed() {
        balls.forEach((ballData) => {
            if (ballData.isLaunched) {
                const currentSpeed = Math.sqrt(ballData.speedX * ballData.speedX + ballData.speedY * ballData.speedY);
                if (currentSpeed > MAX_SPEED) {
                    const ratio = MAX_SPEED / currentSpeed;
                    ballData.speedX *= ratio;
                    ballData.speedY *= ratio;
                    console.warn('Ball speed was normalized');
                }
            }
        });
    }

    return {
        init: function(GameState) {
            gameState = GameState;
            createBall();
            resetBall();

            // key listener for launching
            window.addEventListener('keydown', (e) => {
                const isMenuVisible = typeof Menu !== 'undefined' && Menu.isVisible ? Menu.isVisible() : false;
                if (e.key === ' ' && !gameState.getState().isPaused && !isMenuVisible) {
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
        setStickyPowerup: setStickyPowerup,
        launchAllStuckBalls: launchAllStuckBalls,
        launchStuckBall: launchStuckBall,

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
