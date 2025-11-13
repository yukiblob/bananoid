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
        } else {
            Score.add(10000);
        }
    }

    async function gameOver() {
        // Trigger game over logic
        if (typeof gameState !== 'undefined') {
            gameState.setState({ isPaused: true });
        }

        // Calculate final score
        const finalScore = typeof Score !== 'undefined' ? Score.getScore() : 0;
        const timeElapsed = typeof Timer !== 'undefined' ? Timer.getElapsedTime() : 0;

        // Show game over screen
        const gameOverScreen = document.createElement('div');
        gameOverScreen.id = 'gameOverScreen';
        gameOverScreen.className = 'game-over-screen';

        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;

        gameOverScreen.innerHTML = `
    <div class="game-over-content">
        <div class="title-wrapper">
            <h1 class="menu-title">GAME OVER</h1>
            <h2 class="menu-subtitle">BETTER LUCK NEXT TIME!</h2>
        </div>

        <div class="game-over-stats">
            <p>
                <span class="game-over-stats-label">Final Score:</span>
                <span class="game-over-stats-value">${finalScore.toLocaleString()}</span>
            </p>
            <p>
                <span class="game-over-stats-label">Time:</span>
                <span class="game-over-stats-value">${minutes}:${seconds.toString().padStart(2, '0')}</span>
            </p>
        </div>

        <div class="name-input-section">
            <h3>ENTER YOUR NAME FOR LEADERBOARD</h3>
            <input type="text" id="playerNameInput" maxlength="10" placeholder="ANON" 
                   style="font-family: 'Press Start 2P', monospace; padding: 10px; text-align: center; text-transform: uppercase;">
            <div class="input-hint">Type your name and press ENTER to submit</div>
            <div id="submitStatus" style="margin-top: 10px; min-height: 20px;"></div>
        </div>

        <div class="menu-buttons">
            <div class="menu-button" data-action="restart"><span class="arrow-indicator">▶</span><span class="button-text">Play Again</span></div>
            <div class="menu-button" data-action="menu"><span class="arrow-indicator">▶</span><span class="button-text">Main Menu</span></div>
        </div>
    </div>
    `;

        document.getElementById('gameArea').appendChild(gameOverScreen);

        // Auto-focus on input
        const nameInput = document.getElementById('playerNameInput');
        const submitStatus = document.getElementById('submitStatus');
        nameInput.focus();

        // Remove mouse event listeners from name input section
        const nameInputSection = document.querySelector('.name-input-section');
        nameInputSection.style.pointerEvents = 'none'; // Disable mouse interactions

        // But allow focus on the input
        nameInput.style.pointerEvents = 'auto';


        // Keyboard-only submission
        nameInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();

                const name = nameInput.value.trim().substring(0, 10) || 'ANON';

                submitStatus.textContent = 'SUBMITTING...';
                submitStatus.style.color = '#ffcc00';

                try {
                    let result;

                    if (typeof Scoreboard !== 'undefined' && typeof Scoreboard.handleExternalScoreSubmission === 'function') {
                        // Use the new integrated approach
                        result = await Scoreboard.handleExternalScoreSubmission(name, finalScore, timeElapsed, false);
                    } else if (typeof Scoreboard !== 'undefined' && typeof Scoreboard.submitScore === 'function') {
                        result = await Scoreboard.submitScore(name, finalScore, timeElapsed);
                        if (result) {
                            // If we only have submitScore, show the custom scoreboard
                            showGameOverScoreboard(result, name, finalScore, timeElapsed);
                        }
                    } else {
                        result = await submitScoreDirectly(name, finalScore, timeElapsed);
                        if (result) {
                            showGameOverScoreboard(result, name, finalScore, timeElapsed);
                        }
                    }

                    if (result) {
                    } else {
                        throw new Error('Submission returned no result');
                    }
                } catch (error) {
                    console.error('Score submission error:', error);
                    submitStatus.textContent = `SUBMISSION FAILED: ${error.message} - PRESS ENTER TO RETRY`;
                    submitStatus.style.color = '#f44336';
                    nameInput.focus();
                }
            }
        });
    }

    async function submitScoreAutomatically(finalScore, timeElapsed) {
        const name = 'ANON'; // Default name

        try {
            const response = await fetch('/api/scoreboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    score: finalScore,
                    time: timeElapsed
                })
            });

            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                throw new Error('Failed to submit score');
            }
        } catch (error) {
            console.error('Error submitting score:', error);
            return { rank: null, percentile: null }; // Return empty data but continue
        }
    }

    function initGameOverNavigation() {
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (!gameOverScreen) return;

        let selectedButtonIndex = 0;
        let gameOverButtons = [];
        let currentScoreboardPage = 1;
        let totalScoreboardPages = 1;
        let scoreSubmitted = false;

        function updateButtonSelection() {
            gameOverButtons.forEach(button => {
                button.classList.remove('selected');
                const arrow = button.querySelector('.arrow-indicator');
                if (arrow) arrow.style.visibility = 'hidden';
            });

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

        async function handleScoreboardPageChange(newPage) {
            if (newPage >= 1 && newPage <= totalScoreboardPages && newPage !== currentScoreboardPage) {
                currentScoreboardPage = newPage;
                if (typeof GameState !== 'undefined' && GameState.loadAndDisplayScoreboard) {
                    await GameState.loadAndDisplayScoreboard('gameOverScoreboard', currentScoreboardPage);
                }
            }
        }

        function activateSelectedButton() {
            if (!scoreSubmitted) {
                const nameInput = document.getElementById('playerNameInput');
                const submitStatus = document.getElementById('submitStatus');
                if (nameInput && submitStatus) {
                    submitStatus.textContent = 'PLEASE SUBMIT SCORE FIRST (PRESS ENTER ON NAME FIELD)';
                    submitStatus.style.color = '#ffcc00';
                    nameInput.focus();
                }
                return;
            }

            if (gameOverButtons[selectedButtonIndex]) {
                const action = gameOverButtons[selectedButtonIndex].getAttribute('data-action');
                handleGameOverAction(action);
            }
        }

        function handleGameOverAction(action) {
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

        window.markScoreSubmitted = function() {
            scoreSubmitted = true;
        };

        // Get all game over screen buttons
        gameOverButtons = Array.from(gameOverScreen.querySelectorAll('.menu-button'));

        // Set up initial selection
        updateButtonSelection();

        // Add keyboard event listener for game over screen
        function handleGameOverKeydown(e) {
            if (!document.getElementById('gameOverScreen')) {
                window.removeEventListener('keydown', handleGameOverKeydown);
                return;
            }

            if (!scoreSubmitted) {
                const nameInput = document.getElementById('playerNameInput');
                if (nameInput && e.target !== nameInput) {
                    // Allow only name input navigation
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        nameInput.focus();
                        return;
                    }
                    // Block arrow keys and Enter for menu navigation
                    if (['ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) {
                        e.preventDefault();
                        const submitStatus = document.getElementById('submitStatus');
                        if (submitStatus) {
                            submitStatus.textContent = 'PLEASE SUBMIT SCORE FIRST (TYPE NAME AND PRESS ENTER)';
                            submitStatus.style.color = '#ffcc00';
                        }
                        nameInput.focus();
                        return;
                    }
                }
            }

            // Check if we're trying to navigate scoreboard pages (only allow after submission)
            const scoreboardSection = gameOverScreen.querySelector('.scoreboard-section');
            if (scoreboardSection && scoreboardSection.style.display !== 'none' && scoreSubmitted) {
                if (e.key === 'ArrowLeft') {
                    handleScoreboardPageChange(currentScoreboardPage - 1);
                    e.preventDefault();
                    return;
                } else if (e.key === 'ArrowRight') {
                    handleScoreboardPageChange(currentScoreboardPage + 1);
                    e.preventDefault();
                    return;
                }
            }

            // Regular navigation for buttons (only if score submitted)
            if (scoreSubmitted) {
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
                        handleGameOverAction('menu');
                        e.preventDefault();
                        break;
                }
            }
        }

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
