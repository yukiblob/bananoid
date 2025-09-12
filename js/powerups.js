const Powerups = (function() {
    let gameState;
    let activePowerup = null;
    let powerupElement = null;
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
            duration: 15000,
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
        let fallSpeed = 2;
        function fall() {
            const currentY = parseFloat(pill.style.top);
            if (currentY > gameArea.clientHeight) {
                pill.remove();
                return;
            }
            pill.style.top = `${currentY + fallSpeed}px`;
            requestAnimationFrame(fall);
        }
        requestAnimationFrame(fall);

        powerupElement = pill;
    }

    function checkPaddleCollision() {
        if (!powerupElement) return;

        const paddle = document.getElementById('paddle');
        const pill = powerupElement;

        const paddleRect = paddle.getBoundingClientRect();
        const pillRect = pill.getBoundingClientRect();

        if (pillRect.bottom >= paddleRect.top &&
            pillRect.top <= paddleRect.bottom &&
            pillRect.right >= paddleRect.left &&
            pillRect.left <= paddleRect.right) {
                const powerupType = pill.dataset.type;
                activePowerup(powerupType);
                pill.remove();
                powerupElement = null;
            }
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
        const paddle = document.getElementById('paddle');
        const gameArea = document.getElementById('gameArea');
        const paddleRect = paddle.getBoundingClientRect();

        const leftBullet = document.createElement('div');
        leftBullet.className = 'bullet';
        leftBullet.style.left = `${paddleRect.right - 10}px`;
        leftBullet.style.top = `${paddleRect.top}px`;
        gameArea.appendChild(leftBullet);

        const rightBullet = document.createElement('div');
        rightBullet.className = 'bullet';
        rightBullet.style.left = `${paddleRect.right - 10}px`;
        rightBullet.style.top = `${paddleRect.top}px`;
        gameArea.appendChild(rightBullet);

        animateBullet(leftBullet);
        animateBullet(rightBullet);
    }

    function checkBulletCollision(bullet) {
        const blocks = document.querySelectorAll('.block:not(.unbreakable)');
        const bulletRect = bullet.getBoundingClientRect();

        for (let block of blocks) {
            const blockRect = block.getBoundingClientRect();
            if (bulletRect.bottom >= blockRect.top &&
                bulletRect.top <= blockRect.bottom &&
                bulletRect.right >= blockRect.right &&
                bulletRect.left <= blockRect.right) {
                    
                    block.classList.add('hit');
                    bullet.remove();
                    break;
                }
        }
    }

    return {
        init: function(GameState) {
            gameState = GameState;
        },
        createPill,
        upate: function() {
            checkPaddleCollision();
        }
    };
})();