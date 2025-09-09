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
})