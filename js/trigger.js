const TunnelTrigger = (function() {
    let isTriggered = false;
    const triggerZone = {
        x: 0, y: 0, width: 0, height: 0
    };
    const blockingBlocks = [];

    function initTriggerForLevel9() {
        isTriggered = false;
        blockingBlocks.forEach(block => {
            if (block.parentElement) block.remove();
        });
        blockingBlocks.length = 0;

        const gameArea = document.getElementById('gameArea');
        const blockWidth = 88;
        const blockHeight = 30;
        const gap = 0;

        const offsetX = Math.min((gameArea.clientWidth - (11 * blockWidth + 10 * gap)) / 2, 7);
        const offsetY = 40;

        triggerZone.x = offsetX + 3 * (blockWidth + gap);
        triggerZone.y = offsetY + 8 * (blockHeight + gap);
        triggerZone.width = blockWidth;
        triggerZone.height = blockHeight * 4;
    }

    function checkBallTrigger(ballX, ballY, ballRadius) {
        if (isTriggered) return false;

        return ballX + ballRadius >= triggerZone.x &&
            ballX - ballRadius <= triggerZone.x + triggerZone.width &&
            ballY + ballRadius >= triggerZone.y &&
            ballY - ballRadius <= triggerZone.y + triggerZone.height;
    }

    function createVictoryBlocks() {
        if (isTriggered) return;
        isTriggered = true;

        const gameArea = document.getElementById('gameArea');
        const blockWidth = 88;
        const blockHeight = 30;
        const gap = 0;
        const offsetX = Math.min((gameArea.clientWidth - (11 * blockWidth + 10 * gap)) / 2, 7);
        const offsetY = 40;

        const blockingPositions = [
            { row: 8, col: 3 }, 
            { row: 9, col: 3 },
            { row: 10, col: 3 },
            { row: 11, col: 3 }
        ];

        blockingPositions.forEach(pos => {
            const block = GameState.createBlock(
                offsetX + pos.col * (blockWidth + gap),
                offsetY + pos.row * (blockHeight + gap),
                blockWidth,
                blockHeight,
                "unbreakable"
            );

            blockingBlocks.push(block);
        });

        console.log('Tunnel sealed!');

        if (typeof SoundManager !== 'undefined' && SoundManager.playGameStart) {
            SoundManager.playGameStart();
        }
    }
    
    function update() {
        if (isTriggered) return;

        if (typeof Ball !== 'undefined') {
            const ballCount = Ball.getBallCount();

            if (ballCount > 0) {
                const mainBallState = Ball.getBallState('ball_1');
                if (mainBallState && mainBallState.isLaunched) {
                    const inTrigger = checkBallTrigger(mainBallState.x, mainBallState.y, 10);

                    if (inTrigger) {
                        console.log('Tunnel trigger activated');
                        createVictoryBlocks();
                        return;
                    }
                }
            }
        }
    }

    function reset() {
        isTriggered = false;
        blockingBlocks.forEach(block => {
            if (block.parentElement) block.remove();
        });
        blockingBlocks.length = 0;
    }

    return {
        initTriggerForLevel9: initTriggerForLevel9,
        update: update,
        reset: reset,
        isTriggered: () => isTriggered
    };
})();