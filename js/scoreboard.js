const Scoreboard = (function() {
    let currentScore = 0;
    let currentTime = 0;
    let playerName = '';
    let currentPage = 1;
    let totalPages = 1;
    let isScoreSubmitted = false;

    function showScoreboard(isWin = true) {
        const existingScreens = document.querySelectorAll('#gameOverScreen, #winScreen, #scoreboardScreen');
        existingScreens.forEach(screen => {
            if (screen) screen.remove();
        });

        // Get final score and time from game state
        const finalScore = typeof Score !== 'undefined' ? Score.getScore() : 0;
        const timeElapsed = typeof Timer !== 'undefined' ? Timer.getElapsedTime() : 0;

        currentScore = finalScore;
        currentTime = timeElapsed;
        isScoreSubmitted = false;

        // Create scoreboard screen
        const scoreboardScreen = document.createElement('div');
        scoreboardScreen.id = 'scoreboardScreen';
        scoreboardScreen.className = 'scoreboard-screen';
        scoreboardScreen.tabIndex = 0;

        scoreboardScreen.innerHTML = `
        <div class="scoreboard-content">
            <div class="title-wrapper">
                <h1 class="menu-title">${isWin ? 'VICTORY!' : 'GAME OVER'}</h1>
                <h2 class="menu-subtitle">${isWin ? 'CONGRATULATIONS!' : 'BETTER LUCK NEXT TIME!'}</h2>
            </div>

            <div class="score-stats">
                <p>Final Score: <span class="score-value">${finalScore.toLocaleString()}</span></p>
                <p>Time: <span class="time-value">${formatTime(timeElapsed)}</span></p>
            </div>

            <div class="name-input-section" id="nameInputSection">
                <h3>ENTER YOUR NAME (MAX 10 CHARACTERS)</h3>
                <input type="text" id="playerNameInput" maxlength="10" placeholder="PLAYER" value="ANON">
                <div class="input-hint">Press ENTER to submit</div>
            </div>

            <div class="scoreboard-display" id="scoreboardDisplay" style="display: none;">
                <div class="rank-message" id="rankMessage"></div>

                <div class="game-over-stats">
                    <p>Your Score: <span class="score-value">${finalScore.toLocaleString()}</span></p>
                    <p>Your Time: <span class="time-value">${formatTime(timeElapsed)}</span></p>
                </div>

                <div class="scoreboard-table">
                    <div class="table-header">
                        <span>RANK</span>
                        <span>NAME</span>
                        <span>SCORE</span>
                        <span>TIME</span>
                    </div>
                    <div class="table-body" id="scoreboardBody"></div>
                </div>

                <div class="scoreboard-pagination">
                    <div class="arrow-indicator">←</div>
                    <div class="pagination-info" id="pageInfo">Page 1/1</div>
                    <div class="arrow-indicator">→</div>
                </div>
                <div class="pagination-hint">Use LEFT/RIGHT to navigate pages</div>
            </div>

            <div class="menu-buttons" id="menuButtons" style="display: none;">
                <div class="menu-button" data-action="playAgain">
                    <span class="arrow-indicator">▶</span>
                    <span class="button-text">PLAY AGAIN</span>
                </div>
                <div class="menu-button" data-action="mainMenu">
                    <span class="arrow-indicator">▶</span>
                    <span class="button-text">MAIN MENU</span>
                </div>
            </div>
        </div>
    `;

        document.getElementById('gameArea').appendChild(scoreboardScreen);

        // Focus the scoreboard for keyboard events
        scoreboardScreen.focus();
        setupScoreboardEvents();
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    function formatRank(rank) {
        if (rank === 1) return '1st';
        if (rank === 2) return '2nd';
        if (rank === 3) return '3rd';
        return `${rank}th`;
    }

    async function submitScore(playerName = null, score = null, time = null) {
        const finalScore = score !== null ? score : (typeof Score !== 'undefined' ? Score.getScore() : 0);
        const timeElapsed = time !== null ? time : (typeof Timer !== 'undefined' ? Timer.getElapsedTime() : 0);

        let name = playerName;

        // ONLY show prompt if no name is provided
        if (name === null || name === '') {
            name = prompt('Enter your name for the leaderboard (max 10 characters):', 'ANON');
            if (name === null) return null; // User cancelled
        }

        name = name.trim().substring(0, 10) || 'ANON';

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
            return null;
        }
    }

    async function showRankAndScoreboard(submissionResult, name, isWin = false) {
        const rankMessage = document.getElementById('rankMessage');
        const nameInputSection = document.getElementById('nameInputSection');
        const scoreboardDisplay = document.getElementById('scoreboardDisplay');
        const menuButtons = document.getElementById('menuButtons');

        // Store player name
        playerName = name;

        // Show rank message
        if (submissionResult.percentile !== undefined) {
            rankMessage.innerHTML = `
        Congrats ${playerName}, you are in the top ${submissionResult.percentile}%, 
        on the ${formatRank(submissionResult.rank)} position!
    `;
        } else {
            rankMessage.innerHTML = `
        Score submitted, ${playerName}! Loading scoreboard...
    `;
        }

        // Hide name input, show scoreboard and menu buttons
        nameInputSection.style.display = 'none';
        scoreboardDisplay.style.display = 'block';
        menuButtons.style.display = 'flex';

        // Load and display scoreboard
        await loadScoreboard(1);

        // Focus the scoreboard again for keyboard navigation
        document.getElementById('scoreboardScreen').focus();

        isScoreSubmitted = true;
    }

    async function handleExternalScoreSubmission(name, score, time, isWin = false) {
        try {
            const result = await submitScore(name, score, time);
            if (result) {
                const existingScreens = document.querySelectorAll('#gameOverScreen, #winScreen, #scoreboardScreen');
                existingScreens.forEach(screen => {
                    if (screen) screen.remove();
                });

                // Show the scoreboard screen
                showScoreboard(isWin);

                // Wait a bit for DOM to render, then show the rank and scoreboard
                setTimeout(async () => {
                    await showRankAndScoreboard(result, name, isWin);
                }, 100);

                return result;
            }
            return null;
        } catch (error) {
            console.error('External score submission failed:', error);
            return null;
        }
    }

    async function loadScoreboard(page = 1) {
        try {
            const response = await fetch(`/api/scoreboard?page=${page}&pageSize=5`);
            if (response.ok) {
                const data = await response.json();
                currentPage = data.page;
                totalPages = data.totalPages;
                displayScoreboard(data);
            }
        } catch (error) {
            console.error('Error loading scoreboard:', error);
            // Show empty scoreboard if loading fails
            displayScoreboard({ scores: [], page: 1, totalPages: 1 });
        }
    }

    function displayScoreboard(data) { // Remove containerId parameter
        const container = document.getElementById('scoreboardBody');
        if (!container) return;

        let html = '';

        if (data.scores && data.scores.length > 0) {
            data.scores.forEach((score, index) => {
                const rank = (data.page - 1) * 5 + index + 1;
                html += `
            <div class="table-row">
                <span>${formatRank(rank)}</span>
                <span>${score.name}</span>
                <span>${score.score.toLocaleString()}</span>
                <span>${formatTime(score.time)}</span>
            </div>
        `;
            });
        } else {
            html = `
        <div class="table-row">
            <span colspan="4" style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                No scores yet! Be the first!
            </span>
        </div>
    `;
        }

        container.innerHTML = html;

        // Update pagination info
        const pageInfo = document.getElementById('pageInfo');
        if (pageInfo) {
            pageInfo.textContent = `Page ${data.page}/${data.totalPages}`;
        }
    }

    function handleScoreboardKeydown(e) {
        const nameInputSection = document.getElementById('nameInputSection');
        const scoreboardDisplay = document.getElementById('scoreboardDisplay');

        // If we're in name input phase
        if (nameInputSection.style.display !== 'none') {
            const nameInput = document.getElementById('playerNameInput');

            switch (e.key) {
                case 'Enter':
                    e.preventDefault();
                    submitScore();
                    break;
                case 'Escape':
                    e.preventDefault();
                    // Use ANON as name and submit
                    document.getElementById('playerNameInput').value = 'ANON';
                    submitScore();
                    break;
                default:
                    // Let the input handle typing
                    break;
            }
        }
        // If we're in scoreboard view phase
        else if (scoreboardDisplay.style.display !== 'none') {
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    if (currentPage > 1) {
                        loadScoreboard(currentPage - 1);
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (currentPage < totalPages) {
                        loadScoreboard(currentPage + 1);
                    }
                    break;
                case 'ArrowUp':
                case 'ArrowDown':
                    e.preventDefault();
                    // Navigate menu buttons
                    handleMenuButtonNavigation(e.key);
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    activateSelectedMenuButton();
                    break;
                case 'Escape':
                    e.preventDefault();
                    // Go to main menu
                    handleScoreboardAction('mainMenu');
                    break;
            }
        }
    }

    let selectedMenuButtonIndex = 0;
    let menuButtons = [];

    function handleMenuButtonNavigation(direction) {
        menuButtons = Array.from(document.querySelectorAll('#menuButtons .menu-button'));

        if (menuButtons.length === 0) return;

        if (direction === 'ArrowUp') {
            selectedMenuButtonIndex = (selectedMenuButtonIndex - 1 + menuButtons.length) % menuButtons.length;
        } else if (direction === 'ArrowDown') {
            selectedMenuButtonIndex = (selectedMenuButtonIndex + 1) % menuButtons.length;
        }

        updateMenuButtonSelection();
    }

    function updateMenuButtonSelection() {
        menuButtons.forEach(button => {
            button.classList.remove('selected');
        });

        if (menuButtons[selectedMenuButtonIndex]) {
            menuButtons[selectedMenuButtonIndex].classList.add('selected');
        }
    }

    function activateSelectedMenuButton() {
        if (menuButtons[selectedMenuButtonIndex]) {
            const action = menuButtons[selectedMenuButtonIndex].getAttribute('data-action');
            handleScoreboardAction(action);
        }
    }

    function setupScoreboardEvents() {
        const scoreboardScreen = document.getElementById('scoreboardScreen');

        // Add keyboard event listener
        scoreboardScreen.addEventListener('keydown', handleScoreboardKeydown);

        // Focus the name input initially
        const nameInput = document.getElementById('playerNameInput');
        nameInput.focus();
        nameInput.select();

        // Add arrow indicators to menu buttons when they're created
        setTimeout(() => {
            menuButtons = Array.from(document.querySelectorAll('#menuButtons .menu-button'));
            menuButtons.forEach((button, index) => {
                const arrow = document.createElement('span');
                arrow.className = 'arrow-indicator';
                arrow.innerHTML = '▶';
                button.insertBefore(arrow, button.firstChild);
            });
            selectedMenuButtonIndex = 0;
            updateMenuButtonSelection();
        }, 100);
    }

    function handleScoreboardAction(action) {
        console.log('Scoreboard action triggered:', action);

        const scoreboardScreen = document.getElementById('scoreboardScreen');
        if (scoreboardScreen) {
            console.log('Removing scoreboard screen');
            scoreboardScreen.remove();
        }

        // Remove keyboard event listener
        if (scoreboardScreen) {
            scoreboardScreen.removeEventListener('keydown', handleScoreboardKeydown);
        }

        console.log('GameState available:', typeof GameState !== 'undefined');
        console.log('GameState.restartGame:', GameState && typeof GameState.restartGame);
        console.log('GameState.returnToMenu:', GameState && typeof GameState.returnToMenu);

        switch (action) {
            case 'playAgain':
                console.log('Attempting to restart game...');
                if (typeof GameState !== 'undefined' && GameState.restartGame) {
                    GameState.restartGame();
                } else {
                    console.log('Fallback: reloading page');
                    location.reload();
                }
                break;
            case 'mainMenu':
                console.log('Attempting to return to main menu...');
                if (typeof GameState !== 'undefined' && GameState.returnToMenu) {
                    GameState.returnToMenu();
                } else if (typeof showMainMenu !== 'undefined') {
                    showMainMenu();
                } else {
                    console.log('Fallback: reloading page');
                    location.reload();
                }
                break;
        }
    }

    function showTraditionalEndScreen(isWin) {
        // Show traditional win/lose screen
        if (isWin) {
            if (typeof GameState !== 'undefined' && GameState.showWinScreen) {
                GameState.showWinScreen();
            }
        } else {
            if (typeof gameOver !== 'undefined') {
                gameOver();
            }
        }
    }

    return {
        showScoreboard,
        submitScore,
        handleExternalScoreSubmission,
        init: function() {
        }
    };
})();
