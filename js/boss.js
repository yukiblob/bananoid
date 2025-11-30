const Boss = (function() {
    let gameState;
    let bossElement = null;
    let bossHealth = 30;
    let maxBossHealth = 30;
    let isBossActive = false;
    let bossMovementInterval = null;
    let bossPowerupInterval = null;
    let healthBarElement = null;

    function createBoss() {
        const gameArea = document.getElementById('gameArea');

        if (typeof Music !== 'undefined' && Music.playMoaiMenace) {
            Music.stop();
            setTimeout(() => {
                Music.playMoaiMenace();
            }, 100);
        }

        bossElement = document.createElement('div');
        bossElement.id = 'boss';
        bossElement.className = 'boss-entity';

        bossElement.innerHTML = `
            <div class="moai-boss boss-level">
                <div class="boss-eyebrow left"></div>
                <div class="boss-eyebrow right"></div>
                <div class="moai-eye left"></div>
                <div class="moai-eye right"></div>
                <div class="moai-nose"></div>
                <div class="moai-mouth angry"></div>
            </div>
        `;

        gameArea.appendChild(bossElement);

        createHealthbar();
        
        positionBoss();
        
        startBossBehavior();

        isBossActive = true;

        bossHealth = maxBossHealth;
        updateHealthBar();
    }

    function createHealthbar() {
        const gameArea = document.getElementById('gameArea');

        healthBarElement = document.createElement('div');
        healthBarElement.id = 'bossHealthBar';
        healthBarElement.className = 'boss-health-bar';
        healthBarElement.innerHTML = `
            <div class="health-bar-container">
                <div class="health-bar-fill"></div>
                <div class="health-bar-text">D'OH: ${bossHealth}/${maxBossHealth}</div>
            </div>
        `;

        gameArea.appendChild(healthBarElement);
        updateHealthBar();
    }

    function updateHealthBar() {
        if (!healthBarElement) return;

        const fillElement = healthBarElement.querySelector('.health-bar-fill');
        const textElement = healthBarElement.querySelector('.health-bar-text');

        const healthPercent = (bossHealth/maxBossHealth) * 100;

        fillElement.style.width = `${healthPercent}%`;
        textElement.textContent = `D'OH: ${bossHealth}/${maxBossHealth}`;

        if (healthPercent > 60) {
            fillElement.style.background = 'linear-gradient(to right, #00ff00, #00cc00)';
        } else if (healthPercent > 30) {
            fillElement.style.background = 'linear-gradient(to right, #ffff00, #ffcc00)';
        } else {
            fillElement.style.background = 'linear-gradient(to right, #ff0000, #cc0000)';
        }

        updateMusicPhase(healthPercent);
    }

    function updateMusicPhase(healthPercent) {
        if (typeof Music !== 'undefined' && Music.getBossHealth) {
            Music.getBossHealth(healthPercent);
        }
    }

    function positionBoss() {
        if (!bossElement) return;

        const gameArea = document.getElementById('gameArea');
        const gameAreaWidth = gameArea.offsetWidth;

        const bossWidth = 200;
        const bossHeight = 250;
        const topOffset = 50;

        bossElement.style.left = `${(gameAreaWidth - bossWidth) / 2}px`;
        bossElement.style.top = `${topOffset}px`;
        bossElement.style.width = `${bossWidth}px`;
        bossElement.style.height = `${bossHeight}px`;

        if (healthBarElement) {
            healthBarElement.style.left = `${(gameAreaWidth - 300) / 2}px`;
            healthBarElement.style.top = `${topOffset - 40}px`;
        }
    }

    function startBossBehavior() {
        if (bossMovementInterval) clearInterval(bossMovementInterval);
        if (bossPowerupInterval) clearInterval(bossPowerupInterval);

        bossMovementInterval = setInterval(() => {
            if (!bossElement || !isBossActive) return;

            const gameArea = document.getElementById('gameArea');
            const gameAreaWidth = gameArea.offsetWidth;
            const bossWidth = 200;

            const bounceRange = 20;

            const time = Date.now() / 1000;
            const horizontalMovement = Math.sin(time * 0.5) * (gameAreaWidth - bossWidth - 100) / 2;
            const verticalBounce = Math.sin(time * 2) * bounceRange;

            bossElement.style.left = `${(gameAreaWidth - bossWidth) / 2 + horizontalMovement}px`;
            bossElement.style.top = `${50 + verticalBounce}px`;
        }, 16);

        bossPowerupInterval = setInterval(() => {
            if (!bossElement || !isBossActive) return;

            dropBossPowerup();
        }, 1500 + Math.random() * 1500); // every 2-4 seconds
    }

    function dropBossPowerup() {
        if (!bossElement) return;

        const bossRect = bossElement.getBoundingClientRect();
        const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

        const dropX = bossRect.left - gameAreaRect.left + bossRect.width / 2;
        const dropY = bossRect.bottom - gameAreaRect.top;

        createFreezePill(dropX, dropY);
    }

    function createFreezePill(x, y) {
        const gameArea = document.getElementById('gameArea');
        const pill = document.createElement('div');
        pill.className = 'powerup-pill freeze';
        pill.style.left = `${x}px`;
        pill.style.top = `${y}px`;
        pill.dataset.type = 'freeze';
        pill.classList.add('negative');

        gameArea.appendChild(pill);

        if (typeof Powerups !== 'undefined' && Powerups.addPowerupElement) {
            Powerups.addPowerupElement(pill);
        }

        let fallSpeed = 4;
        function fall() {
            const currentY = parseFloat(pill.style.top);
            if (currentY > gameArea.clientHeight) {
                if (typeof Powerups !== 'undefined' && Powerups.removePowerupElement) {
                    Powerups.removePowerupElement(pill);
                }
                pill.remove();
                return;
            }
            pill.style.top = `${currentY + fallSpeed}px`;
            requestAnimationFrame(fall);
        }
        requestAnimationFrame(fall);
    }

    function checkBossCollision(ballData) {
        if (!bossElement || !isBossActive) return false;

        const bossRect = bossElement.getBoundingClientRect();
        const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

        const bossLeft = bossRect.left - gameAreaRect.left;
        const bossTop = bossRect.top - gameAreaRect.top;
        const bossRight = bossLeft + bossRect.width;
        const bossBottom = bossTop + bossRect.height;

        const ballRadius = 10;
        const ballLeft = ballData.x - ballRadius;
        const ballRight = ballData.x + ballRadius;
        const ballTop = ballData.y - ballRadius;
        const ballBottom = ballData.y + ballRadius;

        if (ballRight >= bossLeft &&
            ballLeft <= bossRight &&
            ballBottom >= bossTop &&
            ballTop <= bossBottom) {

            handleBossHit(ballData, bossLeft, bossTop, bossRight, bossBottom);
            return true;
        }
        return false;
    }

    function handleBossHit(ballData, bossLeft, bossTop, bossRight, bossBottom) {
        bossHealth--;
        updateHealthBar();

        if (typeof SoundManager !== 'undefined' && SoundManager.playBrickHit) {
            SoundManager.playBrickHit();
        }

        if (typeof Score !== 'undefined') {
            Score.add(200);
        }

        const ballRadius = 10;

        const overlapLeft = (ballData.x + ballRadius) - bossLeft;
        const overlapRight = bossRight - (ballData.x - ballRadius);
        const overlapTop = (ballData.y + ballRadius) - bossTop;
        const overlapBottom = bossBottom - (ballData.y - ballRadius);

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapLeft) {
            ballData.x = bossLeft - ballRadius - 0.1;
            ballData.speedX = -Math.abs(ballData.speedX);
        } else if (minOverlap === overlapRight) {
            ballData.x = bossRight + ballRadius + 0.1;
            ballData.speedX = Math.abs(ballData.speedX);
        } else if (minOverlap === overlapTop) {
            ballData.y = bossTop - ballRadius - 0.1;
            ballData.speedY = -Math.abs(ballData.speedY);
        } else if (minOverlap === overlapBottom) {
            ballData.y = bossBottom + ballRadius + 0.1;
            ballData.speedY = Math.abs(ballData.speedY);
        }

        bossElement.style.filter = 'brightness(1.5)';
        setTimeout(() => {
            if (bossElement) bossElement.style.filter = '';
        }, 100);

        dropRandomPowerup();

        if (bossHealth <= 0) {
            defeatBoss();
        }

        if (typeof Ball !== 'undefined' && Ball.applyAcceleration) {
            Ball.applyAcceleration();
        }
    }

    function handleBulletHit() {
        if (!isBossActive) return;

        bossHealth--;
        updateHealthBar();

        if (bossElement) {
            bossElement.style.filter = 'brightness(1.5)';
            setTimeout(() => {
                if (bossElement) bossElement.style.filter = '';
            }, 100);
        }

        if (bossHealth <= 0) {
            defeatBoss();
        }
    }

    function dropRandomPowerup() {
        const bossRect = bossElement.getBoundingClientRect();
        const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();

        const dropX = bossRect.left - gameAreaRect.left + bossRect.width / 2;
        const dropY = bossRect.bottom - gameAreaRect.top;

        if (typeof Powerups !== 'undefined' && Powerups.createPill) {
            Powerups.createPill(dropX, dropY);
        }
    }

    function defeatBoss() {
        if (typeof Powerups !== 'undefined' && Powerups.cleanAllPowerups) {
            Powerups.cleanAllPowerups();
        }
        isBossActive = false;

        if (bossMovementInterval) clearInterval(bossMovementInterval);
        if (bossPowerupInterval) clearInterval(bossPowerupInterval);
        
        if (typeof GameState !== 'undefined') {
            GameState.setState({ isPaused: true });
        }

        if (typeof GameState !== 'undefined' && GameState.setBananaUnlocked) {
            GameState.setBananaUnlocked(true);
        }

        const powerups = document.querySelectorAll('.powerup-pill');
        powerups.forEach(powerup => powerup.remove());

        if (typeof Powerups !== 'undefined' && Powerups.cleanAllPowerups) {
            Powerups.cleanAllPowerups();
        }

        if (healthBarElement) {
            healthBarElement.remove();
            healthBarElement = null;
        }

        if (typeof SoundManager !== 'undefined' && SoundManager.playGameStart) {
            SoundManager.playGameStart();
        }

        if (typeof Music !== 'undefined') {
            Music.stop();
            setTimeout(() => {
                Music.playCrystalHammer();
            }, 100);
        }

        if (bossElement) {
            bossElement.style.animation = 'bossDefeat 1s forwards';
        }

        setTimeout(() => {
            if (bossElement) {
                bossElement.remove();
                bossElement = null;
            }

            if (typeof CutsceneManager !== 'undefined' && CutsceneManager.showVictory) {
                CutsceneManager.showVictory();
            } else {
                if (typeof GameState !== 'undefined' && GameState.showWinScreen) {
                    GameState.showWinScreen();
                }
            }
        }, 1000);
    }

    function cleanup() {
        isBossActive = false;

        if (bossMovementInterval) clearInterval(bossMovementInterval);
        if (bossPowerupInterval) clearInterval(bossPowerupInterval);

        if (bossElement) {
            bossElement.remove();
            bossElement = null;
        }

        if (healthBarElement) {
            healthBarElement.remove();
            healthBarElement = null;
        }

        bossHealth = maxBossHealth;
    }

    return {
        init: function(GameState) {
            gameState = GameState;
        },

        createBoss: createBoss,
        checkBossCollision: checkBossCollision,
        cleanup: cleanup,
        isBossActive: function() { return isBossActive; },

        handleBulletHit: handleBulletHit,
        getBossHealth: function() { return bossHealth; },
        getBossHealthPercent: function() { return (bossHealth/maxBossHealth) * 100; }
    };
})();