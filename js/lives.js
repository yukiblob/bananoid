const Lives = (function() {
    let gameState;
    let livesContainer;
    let currentLives = 3;
    const maxLives = 5;

    function createLivesDisplay() {
        livesContainer = document.createElement('div');
        livesContainer.id = 'livesContainer';
        livesContainer.className = 'lives-container';

        const gameArea = document.getElementById('gameArea');
        gameArea.appendChild(livesContainer);

        updateLivesDisplay();
    }

    function updateLivesDisplay() {
        // Clear existing hearts
        livesContainer.innerHTML = '';

        // Add hearts for current lives
        for (let i = 0; i < currentLives; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.innerHTML = '❤️';
            heart.style.animationDelay = `${i * 0.1}s`; // Stagger animation
            livesContainer.appendChild(heart);
        }

        // Add empty hearts for lost lives (optional visual feedback)
        for (let i = currentLives; i < maxLives; i++) {
            const emptyHeart = document.createElement('div');
            emptyHeart.className = 'heart empty';
            emptyHeart.innerHTML = '🤍';
            livesContainer.appendChild(emptyHeart);
        }
    }

    function loseLife() {
        if (currentLives > 0) {
            currentLives--;
            updateLivesDisplay();

            // Visual feedback for losing a life
            livesContainer.classList.add('life-lost');
            setTimeout(() => {
                livesContainer.classList.remove('life-lost');
            }, 500);

            // Check for game over
            if (currentLives === 0) {
                gameOver();
                return true; // Game over
            }

            return false; // Still has lives
        }
        return true; // Game over
    }

    function gainLife() {
        if (currentLives < maxLives) {
            currentLives++;
            updateLivesDisplay();

            // Visual feedback for gaining a life
            livesContainer.classList.add('life-gained');
            setTimeout(() => {
                livesContainer.classList.remove('life-gained');
            }, 500);
        }
    }

    function gameOver() {
        // Trigger game over logic
        if (typeof gameState !== 'undefined') {
            gameState.setState({ isPaused: true });
        }

        // Show game over message
        const gameOverMsg = document.createElement('div');
        gameOverMsg.id = 'gameOverMessage';
        gameOverMsg.className = 'game-over-message';
        gameOverMsg.innerHTML = `
            <h2>Game Over</h2>
            <p>You ran out of lives!</p>
            <button onclick="Lives.restartGame()">Play Again</button>
        `;

        document.getElementById('gameArea').appendChild(gameOverMsg);
    }

    function restartGame() {
        // Remove game over message
        const gameOverMsg = document.getElementById('gameOverMessage');
        if (gameOverMsg) {
            gameOverMsg.remove();
        }

        // Reset lives
        currentLives = 3;
        updateLivesDisplay();

        // Reset game state
        if (typeof gameState !== 'undefined') {
            gameState.setState({ isPaused: false });
        }

        // Reset ball and other game elements
        if (typeof Ball !== 'undefined' && Ball.reset) {
            Ball.reset();
        }

        // Reload level
        if (typeof gameState !== 'undefined' && gameState.loadLevel) {
            gameState.loadLevel(0);
        }

        // Reset score if needed
        if (typeof Score !== 'undefined' && Score.reset) {
            Score.reset();
        }

        // Reset timer if needed
        if (typeof Timer !== 'undefined' && Timer.reset) {
            Timer.reset();
        }

        if (typeof Powerups !== 'undefined') {
            // add powerup clear logic so they don't carry over to the next game
        }
    }

    function getCurrentLives() {
        return currentLives;
    }

    function setLives(lives) {
        currentLives = Math.min(Math.max(0, lives), maxLives);
        updateLivesDisplay();
    }

    return {
        init: function(GameState) {
            gameState = GameState;
            createLivesDisplay();
        },

        loseLife: loseLife,
        gainLife: gainLife,
        getCurrentLives: getCurrentLives,
        setLives: setLives,
        restartGame: restartGame
    };
})();
