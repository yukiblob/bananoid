const Scoreboard = (function() {
    let currentScore = 0;
    let currentTime = 0;
    let playerName = '';
    let currentPage = 1;
    let totalPages = 1;
    let isScoreSubmitted = false;

    function showScoreboard(isWin = true) {
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
        scoreboardScreen.tabIndex = 0; // Make it focusable for keyboard events

        scoreboardScreen.innerHTML = `
            <div class="scoreboard-content">
                <div class="title-wrapper">
                    <h1 class="menu-title">${isWin ? 'VICTORY!' : 'GAME OVER'}</h1>
                    <h2 class="menu-subtitle">${isWin ? 'CONGRATULATIONS!' : 'BETTER LUCK NEXT TIME!'}</h2>
                </div>

                <div class="score-stats">
                    <p>Final Score: <span class="score-value">${finalScore}</span></p>
                    <p>Time: <span class="time-value">${formatTime(timeElapsed)}</span></p>
                </div>

                <div class="name-input-section" id="nameInputSection">
                    <h3>ENTER YOUR NAME (MAX 10 CHARACTERS)</h3>
                    <input type="text" id="playerNameInput" maxlength="10" placeholder="PLAYER" value="ANON">
                    <div class="input-hint">Press ENTER to submit</div>
                </div>

                <div class="scoreboard-display" id="scoreboardDisplay" style="display: none;">
                    <div class="rank-message" id="rankMessage"></div>
                    <div class="scoreboard-table">
                        <div class="table-header">
                            <span>RANK</span>
                            <span>NAME</span>
                            <span>SCORE</span>
                            <span>TIME</span>
                        </div>
                        <div class="table-body" id="scoreboardBody"></div>
                    </div>
                    <div class="pagination">
                        <div class="pagination-info" id="pageInfo">Page 1/1</div>
                        <div class="pagination-hint">Use LEFT/RIGHT to navigate pages</div>
                    </div>
                </div>

                <div class="menu-buttons" id="menuButtons" style="display: none;">
                    <div class="menu-button" data-action="playAgain">PLAY AGAIN</div>
                    <div class="menu-button" data-action="mainMenu">MAIN MENU</div>
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

    async function submitScore() {
        const finalScore = typeof Score !== 'undefined' ? Score.getScore() : 0;
        const timeElapsed = typeof Timer !== 'undefined' ? Timer.getElapsedTime() : 0;

        // Simple alert for name input
        const playerName = prompt('Enter your name for the leaderboard (max 10 characters):', 'ANON');

        if (playerName === null) {
            return; // User cancelled
        }

        const name = playerName.trim().substring(0, 10) || 'ANON';

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
                alert(`Score submitted successfully!\nRank: ${result.rank}\nTop ${result.percentile}% of players`);
            } else {
                throw new Error('Failed to submit score');
            }
        } catch (error) {
            console.error('Error submitting score:', error);
            alert('Failed to submit score. Please try again.');
        }
    }

    async function showRankAndScoreboard(submissionResult) {
        const rankMessage = document.getElementById('rankMessage');
        const nameInputSection = document.getElementById('nameInputSection');
        const scoreboardDisplay = document.getElementById('scoreboardDisplay');
        const menuButtons = document.getElementById('menuButtons');

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

        // After showing scoreboard for a moment, show the traditional win/lose screen
        setTimeout(() => {
            showTraditionalEndScreen(isWin);
        }, 3000);
    }

    function showTraditionalEndScreen(isWin) {
        // Remove scoreboard
        const scoreboardScreen = document.getElementById('scoreboardScreen');
        if (scoreboardScreen) {
            scoreboardScreen.remove();
        }

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

    function displayScoreboard(data) {
        const scoreboardBody = document.getElementById('scoreboardBody');
        const pageInfo = document.getElementById('pageInfo');

        // Clear existing scores
        scoreboardBody.innerHTML = '';

        // Add scores to table
        if (data.scores && data.scores.length > 0) {
            data.scores.forEach((score, index) => {
                const rank = (data.page - 1) * 5 + index + 1;
                const row = document.createElement('div');
                row.className = 'table-row';
                row.innerHTML = `
                    <span>${formatRank(rank)}</span>
                    <span>${score.name}</span>
                    <span>${score.score.toLocaleString()}</span>
                    <span>${formatTime(score.time)}</span>
                `;
                scoreboardBody.appendChild(row);
            });
        } else {
            const emptyRow = document.createElement('div');
            emptyRow.className = 'table-row';
            emptyRow.innerHTML = `<span colspan="4" style="grid-column: 1 / -1; text-align: center; padding: 20px;">No scores yet! Be the first to submit!</span>`;
            scoreboardBody.appendChild(emptyRow);
        }

        // Update pagination
        pageInfo.textContent = `Page ${data.page}/${data.totalPages}`;
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
            const arrow = button.querySelector('.arrow-indicator');
            if (arrow) arrow.style.visibility = 'hidden';
        });

        if (menuButtons[selectedMenuButtonIndex]) {
            menuButtons[selectedMenuButtonIndex].classList.add('selected');
            const arrow = menuButtons[selectedMenuButtonIndex].querySelector('.arrow-indicator');
            if (arrow) arrow.style.visibility = 'visible';
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
        nameInput.select(); // Select all text for easy replacement

        // Add arrow indicators to menu buttons when they're created
        setTimeout(() => {
            menuButtons = Array.from(document.querySelectorAll('#menuButtons .menu-button'));
            menuButtons.forEach((button, index) => {
                const arrow = document.createElement('span');
                arrow.className = 'arrow-indicator';
                arrow.innerHTML = '▶';
                arrow.style.visibility = 'hidden';
                button.insertBefore(arrow, button.firstChild);
            });
            selectedMenuButtonIndex = 0;
            updateMenuButtonSelection();
        }, 100);
    }

    function handleScoreboardAction(action) {
        const scoreboardScreen = document.getElementById('scoreboardScreen');
        if (scoreboardScreen) {
            scoreboardScreen.remove();
        }

        // Remove keyboard event listener
        scoreboardScreen.removeEventListener('keydown', handleScoreboardKeydown);

        // Instead of handling actions directly, show traditional screen first
        showTraditionalEndScreen(action === 'playAgain');
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
        init: function() {
        }
    };
})();
