const Powerups = (function() {
    let gameState;
    let activePowerup = null;
    let powerupElements = [];
    let powerupInterval = null;

    const types = [
        {
            name: 'longPaddle',
            duration: 10000, // 10 seconds
            effect: function() {
                const paddle = document.getElementById('paddle');
                paddle.classList.add('powerup-long');
            },
            cleanup: function() {
                const paddle = document.getElementById('paddle');
                paddle.classList.remove('powerup-long');
            }
        },
        {
            name: 'shortPaddle',
            duration: 10000,
            effect: function() {
                const paddle = document.getElementById('paddle');
                paddle.classList.add('powerup-short');
            },
            cleanup: function() {
                const paddle = document.getElementById('paddle');
                paddle.classList.remove('powerup-short');
            }
        },
        {
            name: 'guns',
            duration: 10000,
            effect: function() {
                const paddle = document.getElementById('paddle');
                paddle.classList.add('powerup-guns');
                // start the firing logic
                startFiring();
            },
            cleanup: function() {
                const paddle = document.getElementById('paddle');
                paddle.classList.remove('powerup-guns');
                // stop firing logic
                stopFiring();
            }
        },
        {
            name: 'multiball',
            duration: 0,
            effect: function() {
                const currentBalls = Array.from(document.querySelectorAll('.ball'));

                currentBalls.forEach(ball => {
                    createMultiBalls(ball);
                });
            },
                cleanup: function() {
            }
        }
    ];

    function getRandomType() {
        const randomIndex = Math.floor(Math.random() * types.length);
        return types[randomIndex];
    }

    function createPill(x, y) {
        if (Math.random() > 0.2) return;

        const pillType = getRandomType();
        const gameArea = document.getElementById('gameArea');
        const pill = document.createElement('div');
        pill.className = `powerup-pill ${pillType.name}`;
        pill.style.left = `${x}px`;
        pill.style.top = `${y}px`;
        pill.dataset.type = pillType.name;
        gameArea.appendChild(pill);

        // animate the pill fall
        let fallSpeed = 4;
        function fall() {
            const currentY = parseFloat(pill.style.top);
            if (currentY > gameArea.clientHeight) {
                powerupElements = powerupElements.filter(p => p !== pill);
                pill.remove();
                return;
            }
            pill.style.top = `${currentY + fallSpeed}px`;
            requestAnimationFrame(fall);
        }
        requestAnimationFrame(fall);

        powerupElements.push(pill);
    }

    function checkPaddleCollision() {
        if (powerupElements.length === 0) return;

        const paddle = document.getElementById('paddle');
        const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

        const paddleRect = paddle.getBoundingClientRect();

        const paddleLeft = paddleRect.left - gameAreaRect.left;
        const paddleTop = paddleRect.top - gameAreaRect.top;
        const paddleRight = paddleLeft + paddleRect.width;
        const paddleBottom = paddleTop + paddleRect.height;

        powerupElements.forEach((pill, index) => {
            const pillRect = pill.getBoundingClientRect();

            const pillLeft = pillRect.left - gameAreaRect.left;
            const pillTop = pillRect.top - gameAreaRect.top;
            const pillRight = pillLeft + pillRect.width;
            const pillBottom = pillTop + pillRect.height;

            if (pillBottom >= paddleTop &&
                pillTop <= paddleBottom &&
                pillRight >= paddleLeft &&
                pillLeft <= paddleRight) {
                const powerupType = pill.dataset.type;
                activatePowerup(powerupType);
                pill.remove();
                
                powerupElements.splice(index, 1);
                }
        });
    }

    function activatePowerup(typeName) {
        if (activePowerup) {
            clearTimeout(activePowerup.timeoutId);
            activePowerup.cleanup();
        }

        const type = types.find(t => t.name === typeName);
        if (!type) return;

        type.effect();
        Score.add(500);

        const timeoutId = setTimeout(() => {
            type.cleanup();
            activePowerup = null;
        }, type.duration);

        activePowerup = {
            type: typeName,
            timeoutId: timeoutId,
            cleanup: type.cleanup
        };
    }

    function startFiring() {
        let lastFired = 0;
        const fireRate = 500; // ms per shot

        function fireBullets(timestamp) {
            if (!activePowerup || activePowerup.type !== 'guns') return;

            if (timestamp - lastFired > fireRate) {
                createBullet();
                lastFired = timestamp;
            }
            requestAnimationFrame(fireBullets);
        }
        powerupInterval = requestAnimationFrame(fireBullets);
    }

    function stopFiring() {
        cancelAnimationFrame(powerupInterval);
    }

    function createBullet() {
        if (!gameState) {
            console.error('Powerups not properly initialized with GameState');
            return;
        }
        const state = gameState.getState();
        const gameArea = document.getElementById('gameArea');
        const paddle = document.getElementById('paddle');
        const gameAreaRect = gameArea.getBoundingClientRect();
        const paddleRect = paddle.getBoundingClientRect();

        const paddleWidth = paddle.offsetWidth;
        const paddleLeft = state.paddleX - paddleWidth / 2;
        const paddleTop = paddleRect.top - gameAreaRect.top;

        const leftBullet = document.createElement('div');
        leftBullet.className = 'bullet';
        leftBullet.style.left = `${paddleLeft + 5}px`;
        leftBullet.style.top = `${paddleTop - 10}px`;
        gameArea.appendChild(leftBullet);

        const rightBullet = document.createElement('div');
        rightBullet.className = 'bullet';
        rightBullet.style.left = `${paddleLeft + paddleWidth - 15}px`;
        rightBullet.style.top = `${paddleTop - 10}px`;
        gameArea.appendChild(rightBullet);

        animateBullet(leftBullet);
        animateBullet(rightBullet);
    }

    function checkBulletCollision(bullet) {
        const blocks = document.querySelectorAll('.block');
        const bulletRect = bullet.getBoundingClientRect();
        const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

        for (let block of blocks) {
            const blockRect = block.getBoundingClientRect();

            const blockLeft = blockRect.left - gameAreaRect.left;
            const blockTop = blockRect.top - gameAreaRect.top;
            const blockRight = blockLeft + blockRect.width;
            const blockBottom = blockTop + blockRect.height;

            const bulletLeft = bulletRect.left - gameAreaRect.left;
            const bulletTop = bulletRect.top - gameAreaRect.top;
            const bulletRight = bulletLeft + bulletRect.width;
            const bulletBottom = bulletTop + bulletRect.height;

            if (bulletBottom >= blockTop &&
                bulletTop <= blockBottom &&
                bulletRight >= blockLeft &&
                bulletLeft <= blockRight) {

                const blockType = block.classList.contains("unbreakable") ? "unbreakable" :
                                    block.classList.contains("strong") ? "strong" : "normal";

                if (blockType === "unbreakable") {
                    createSparks(bulletLeft, bulletTop);
                    bullet.remove();
                    return true;
                }
                
                else if (blockType === "strong") {
                    block.classList.remove("strong");
                    block.classList.add("normal");
                    Score.add(50);
                } else {
                    block.remove();
                    Score.add(100);

                    const blockCenterX = blockLeft + blockRect.width / 2;
                    const blockCenterY = blockTop + blockRect.height / 2;

                    if (typeof Powerups !== 'undefined' && Powerups.createPill) {
                        Powerups.createPill(blockCenterX, blockCenterY);
                    }
                }

                bullet.remove();
                return true;
            }
        }
        return false;
    }

    function animateBullet(bullet) {
        const bulletSpeed = 12;

        function move() {
            if (!bullet.parentElement) return;

            const currentTop = parseFloat(bullet.style.top);
            const newTop = currentTop - bulletSpeed;

            if (newTop < -20) {
                bullet.remove();
                return;
            }

            bullet.style.top = `${newTop}px`;

            if (checkBulletCollision(bullet)) {
                return;
            }

            requestAnimationFrame(move);
        }
        requestAnimationFrame(move);
    }

    function createSparks(x, y) {
        const spark = document.createElement('div');
        spark.style.position = 'absolute';
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        spark.style.width = '10px';
        spark.style.height = '10px';
        spark.style.background = 'radial-gradient(circle, yellow, orange, red)';
        spark.style.borderRadius = '50%';
        spark.style.boxShadow = '0 0 8px yellow';
        spark.style.zIndex = '10';

        document.getElementById('gameArea').appendChild(spark);
        setTimeout(() => spark.remove(), 100);
    }

    function createMultiBalls(originalBall) {
        const ballID = originalBall.id;
        const ballState = Ball.getBallState(ballID);

        if (!ballState) return;

        const ballX = ballState.x;
        const ballY = ballState.y;
        const originalVelocity = { x: ballState.speedX, y: ballState.speedY };

        Ball.createBonusBall(ballX, ballY, originalVelocity, 30);
        Ball.createBonusBall(ballX, ballY, originalVelocity, -30);

        if (typeof Score !== 'undefined') {
            Score.add(500);
        }
    }

    return {
        init: function(GameState) {
            gameState = GameState;
        },
        createPill,
        update: function() {
            checkPaddleCollision();
        }
    };
})();
