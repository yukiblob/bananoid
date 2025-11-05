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
            heart.innerHTML = '🍌';
            heart.style.animationDelay = `${i * 0.1}s`; // Stagger animation
            livesContainer.appendChild(heart);
        }

        // Add empty hearts for lost lives
        for (let i = currentLives; i < maxLives; i++) {
            const emptyHeart = document.createElement('div');
            emptyHeart.className = 'heart empty';
            emptyHeart.innerHTML = '💀';
            livesContainer.appendChild(emptyHeart);
        }
    }

    function loseLife() {
        if (currentLives > 0) {
            currentLives--;
            updateLivesDisplay();

            if (typeof SoundManager !== 'undefined') {
                SoundManager.playLifeLost();
            }

            // Visual feedback for losing a life
            livesContainer.classList.add('life-lost');
            setTimeout(() => {
                livesContainer.classList.remove('life-lost');
            }, 500);

            // Check for game over
            if (currentLives === 0) {
                gameOver();
                return true;
            }

            return false;
        }
        return true;
    }

    function gainLife() {
        if (currentLives < maxLives) {
            currentLives++;
            updateLivesDisplay();

            // Visual feedback for gaining a life
            livesContainer.classList.add('life-gained');
            setTimeout(() => {
                livesContainer.classList.remove('life-gained');
            }, 100);
        }
    }

    function gameOver() {
        // Trigger game over logic
        if (typeof gameState !== 'undefined') {
            gameState.setState({ isPaused: true });
        }

        // Show game over message
        const gameOverScreen = document.createElement('div');
        gameOverScreen.id = 'gameOverScreen';
        gameOverScreen.className = 'game-over-screen';

        gameOverScreen.innerHTML = `
            <div class="game-over-content">
                <div class="title-wrapper">
                    <h1 class="menu-title">YOU DIED</h1>
                    <h2 class="menu-subtitle">Failed to restore your banana form</h2>
                </div>
                <div class="menu-buttons">
                    <div class="menu-button" data-action="restart"><span class="arrow-indicator">▶</span><span class="button-text">Restart</span></div>
                    <div class="menu-button" data-action="menu"><span class="arrow-indicator">▶</span><span class="button-text">Main Menu</span></div>
                </div>
            </div>
        `;

        document.getElementById('gameArea').appendChild(gameOverScreen);

        initGameOverNavigation();
    }

    function initGameOverNavigation() {
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (!gameOverScreen) return;

        let selectedButtonIndex = 0;
        let gameOverButtons = [];

        function updateButtonSelection() {
            // Remove highlight from all buttons and hide arrows
            gameOverButtons.forEach(button => {
                button.classList.remove('selected');
                const arrow = button.querySelector('.arrow-indicator');
                if (arrow) arrow.style.visibility = 'hidden';
            });

            // Add highlight to selected button to show arrow
            if (gameOverButtons[selectedButtonIndex]) {
                gameOverButtons[selectedButtonIndex].classList.add('selected');
                const arrow = gameOverButtons[selectedButtonIndex].querySelector('.arrow-indicator');
                if (arrow) arrow.style.visibility = 'visible';
            }
        }

        function handleGameOverNavigation(direction) {
            if (direction === 'up') {
                selectedButtonIndex = (selectedButtonIndex - 1 + gameOverButtons.length) % gameOverButtons.length;
            } else if (direction === 'down') {
                selectedButtonIndex = (selectedButtonIndex + 1) % gameOverButtons.length;
            }

            updateButtonSelection();
        }

        function activateSelectedButton() {
            if (gameOverButtons[selectedButtonIndex]) {
                const action = gameOverButtons[selectedButtonIndex].getAttribute('data-action');
                handleGameOverAction(action);
            }
        }

        function handleGameOverAction(action) {
            // Remove game over screen first
            const gameOverScreen = document.getElementById('gameOverScreen');
            if (gameOverScreen) {
                gameOverScreen.remove();
            }

            switch (action) {
                case 'restart':
                    if (typeof GameState !== 'undefined' && GameState.restartGame) {
                        GameState.restartGame();
                    }
                    break;
                case 'menu':
                    if (typeof GameState !== 'undefined' && GameState.returnToMenu) {
                        GameState.returnToMenu();
                        setTimeout(() => {
                            if (typeof Music !== 'undefined' && Music.playTropicalTheme) {
                                Music.resume().then(() => {
                                    Music.playTropicalTheme();
                                });
                            }
                        }, 100);
                    }
                    break;
            }
        }

        // Get all game over screen buttons
        gameOverButtons = Array.from(gameOverScreen.querySelectorAll('.menu-button'));

        // Set up initial selection
        updateButtonSelection();

        // Add keyboard event listener for game over screen
        function handleGameOverKeydown(e) {
            if (!document.getElementById('gameOverScreen')) {
                // Game over screen is gone, remove listener
                window.removeEventListener('keydown', handleGameOverKeydown);
                return;
            }

            switch (e.key) {
                case 'ArrowUp':
                    handleGameOverNavigation('up');
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    handleGameOverNavigation('down');
                    e.preventDefault();
                    break;
                case 'Enter':
                case ' ':
                    activateSelectedButton();
                    e.preventDefault();
                    break;
                case 'Escape':
                    // Escape goes to main menu
                    handleGameOverAction('menu');
                    e.preventDefault();
                    break;
            }
        }

        // Add event listener
        window.addEventListener('keydown', handleGameOverKeydown);
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
    };
})();
