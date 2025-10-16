const Menu = (function() {
    let gameState;
    let menuElement;
    let coinInsertScreen;
    let isMenuVisible = true;
    let currentMenu = 'coinInsert';
    let selectedButtonIndex = 0;
    let menuButtons = [];

    function createCoinInsertScreen() {
        const gameArea = document.getElementById('gameArea');

        coinInsertScreen = document.createElement('div');
        coinInsertScreen.id = 'coinInsertScreen';
        coinInsertScreen.className = 'coin-insert-screen';

        const content = document.createElement('div');
        content.className = 'coin-insert-content';

        const title = document.createElement('h1');
        title.className = 'coin-insert-title';
        title.innerHTML = '<span class="logo-red">BANA</span><span class="logo-blue">NOID</span>';

        const subtitle = document.createElement('h2');
        subtitle.className = 'menu-subtitle';
        subtitle.textContent = 'REVENGE OF BANANA';

        const prompt = document.createElement('div');
        prompt.className = 'coin-insert-prompt';

        const line1 = document.createElement('div');
        line1.textContent = 'PRESS [ENTER] OR [SPACE]';
        line1.className = 'prompt-line';

        const line2 = document.createElement('div');
        line2.textContent = 'TO INSERT COIN';
        line2.className = 'prompt-line';

        prompt.appendChild(line1);
        prompt.appendChild(line2);

        content.appendChild(title);
        content.appendChild(subtitle);
        content.appendChild(prompt);
        coinInsertScreen.appendChild(content);

        gameArea.appendChild(coinInsertScreen);
    }

    function removeCoinInsertScreen() {
        if (coinInsertScreen) {
            coinInsertScreen.remove();
            coinInsertScreen = null;
        }
    }

    function coinInsert() {
        if (typeof SoundManager !== 'undefined' && SoundManager.playMenuSelect) {
            SoundManager.playMenuSelect();
        }

        removeCoinInsertScreen();
        showMainMenu();
        
        if (typeof SoundManager !== 'undefined' && SoundManager.resume) {
            SoundManager.resume();
        }
    }
    
    function createMenu() {
        const gameArea = document.getElementById('gameArea');

        // Create menu container
        menuElement = document.createElement('div');
        menuElement.id = 'mainMenu';
        menuElement.style.display = 'none';

        // Add to game area
        gameArea.appendChild(menuElement);

        createCoinInsertScreen();
    }

    function createMenuButton(text, index) {
        const button = document.createElement('div');
        button.className = 'menu-button';
        button.dataset.index = index;
        button.style.cursor = 'none';

        // Create arrow indicator
        const arrow = document.createElement('span');
        arrow.className = 'arrow-indicator';
        arrow.innerHTML = '▶';

        // Create text span
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        textSpan.className = 'button-text';

        // Append both to button
        button.appendChild(arrow);
        button.appendChild(textSpan);

        return button;
    }

    function updateButtonSelection() {
        // Remove highlight from all buttons and hide arrows
        menuButtons.forEach(button => {
            button.classList.remove('selected');
            const arrow = button.querySelector('.arrow-indicator');
            if (arrow) arrow.style.visibility = 'hidden';
        });

        // Add highlight to selected button and show arrow
        if (menuButtons[selectedButtonIndex]) {
            menuButtons[selectedButtonIndex].classList.add('selected');
            const arrow = menuButtons[selectedButtonIndex].querySelector('.arrow-indicator');
            if (arrow) arrow.style.visibility = 'visible';
        }
    }

    function handleMenuNavigation(direction) {
        if (!isMenuVisible) return;

        if (direction === 'up') {
            selectedButtonIndex = (selectedButtonIndex - 1 + menuButtons.length) % menuButtons.length;
        } else if (direction === 'down') {
            selectedButtonIndex = (selectedButtonIndex + 1) % menuButtons.length;
        }
        updateButtonSelection();
        
        // Just play the sound - SoundManager will handle the queuing if needed
        if (typeof SoundManager !== 'undefined' && SoundManager.playMenuNavigate) {
            SoundManager.playMenuNavigate();
        }
    }

    function activateSelectedButton() {
        if (menuButtons[selectedButtonIndex]) {
            const onClickFunc = menuButtons[selectedButtonIndex].onClickFunction;
            if (onClickFunc) {
                if (typeof SoundManager !== 'undefined' && SoundManager.playMenuSelect) {
                    SoundManager.playMenuSelect();
                }
                onClickFunc();
            }
        }
    }

    function playGameStartSound() {
        if (typeof SoundManager !== 'undefined' && SoundManager.playGameStart) {
            SoundManager.playGameStart();
        }
    }

    function showPauseMenu() {
        currentMenu = 'pause';
        selectedButtonIndex = 0;

        // Clear current menu content
        while (menuElement.firstChild) {
            menuElement.removeChild(menuElement.firstChild);
        }

        const titleWrapper = document.createElement('div');
        titleWrapper.className = 'title-wrapper';

        const title = document.createElement('h1');
        title.innerHTML = '<span class="logo-red">BANA</span><span class="logo-blue">NOID</span>';
        title.className = 'menu-title';

        const subtitle = document.createElement('h2');
        subtitle.textContent = 'GAME PAUSED';
        subtitle.className = 'menu-subtitle';

        titleWrapper.appendChild(title);
        titleWrapper.appendChild(subtitle);
        menuElement.appendChild(titleWrapper);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'menu-buttons';

        // Continue button
        const onClickContinue = () => {
            setTimeout(() => {
                hideMenu();
            }, 10);
        };

        const continueButton = createMenuButton('Continue', onClickContinue, 0);
        continueButton.onClickFunction = onClickContinue;

        // Restart button
        const onClickRestart = () => {
            hideMenu();
            setTimeout(() => {
                GameState.restartGame();
                playGameStartSound();
            }, 10);
        };

        const restartButton = createMenuButton('Restart', onClickRestart, 1);
        restartButton.onClickFunction = onClickRestart;

        // Add buttons to container
        buttonsContainer.appendChild(continueButton);
        buttonsContainer.appendChild(restartButton);

        // Add button containers to menu
        menuElement.appendChild(buttonsContainer);

        // Store buttons for navigation
        menuButtons = [continueButton, restartButton];

        updateButtonSelection();
    }

    async function showLevelSelect() {
        currentMenu = 'levelSelect';
        selectedButtonIndex = 0;

        // Clear current menu content
        while (menuElement.firstChild) {
            menuElement.removeChild(menuElement.firstChild);
        }

        const title = document.createElement('h2');
        title.textContent = 'SELECT LEVEL';
        title.className = 'menu-subtitle';
        menuElement.appendChild(title);

        const levelsContainer = document.createElement('div');
        levelsContainer.className = 'levels-grid';

        let allLevels = [];
        let levelSources = []; // Track which levels are custom

        try {
            // Load levels from API
            const response = await fetch('http://localhost:8080/api/levels');
            if (response.ok) {
                const data = await response.json();
                allLevels = data.levels || [];
                levelSources = allLevels.map(level => 'custom');
            }
        } catch (error) {
            console.warn('Could not load levels from API');
        }

        // If no custom levels, use default levels
        if (allLevels.length === 0) {
            allLevels =
                (typeof levels !== "undefined" && Array.isArray(levels)) ? levels :
                    (typeof window !== "undefined" && Array.isArray(window.levels)) ? window.levels :
                        defaultLevels;
            levelSources = allLevels.map(() => 'original');
        }

        if (allLevels.length === 0) {
            const noLevelsMsg = document.createElement('p');
            noLevelsMsg.textContent = 'No levels available';
            noLevelsMsg.style.color = '#ff6b6b';
            levelsContainer.appendChild(noLevelsMsg);
        }

        menuButtons = [];

        // Create level buttons for all available levels
        for (let i = 0; i < allLevels.length; i++) {
            const onClick = () => {
                hideMenu();
                GameState.loadLevel(i);
                if (typeof Ball !== 'undefined' && Ball.reset) Ball.reset();
                if (typeof Score !== 'undefined' && Score.reset) Score.reset();
                if (typeof Lives !== 'undefined' && Lives.setLives) Lives.setLives(3);
                if (typeof Timer !== 'undefined' && Timer.reset) Timer.reset();
            };

            const level = allLevels[i];
            const isCustom = levelSources[i] === 'custom';

            let buttonText;
            if (isCustom) {
                buttonText = level.name || `Custom ${i + 1}`;
            } else {
                buttonText = `Original ${i + 1}`;
            }

            const levelButton = createMenuButton(buttonText, i);
            levelButton.onClickFunction = onClick;

            // Visual distinction
            if (isCustom) {
                levelButton.style.color = '#4ecdc4'; // Cyan for custom
                levelButton.style.textShadow = '0 0 5px #4ecdc4';
                levelButton.title = level.name ? `Custom: ${level.name}` : 'Custom Level';
            } else {
                levelButton.style.color = '#ffcc00'; // Yellow for original
                levelButton.title = 'Original Level';
            }

            levelsContainer.appendChild(levelButton);
            menuButtons.push(levelButton);
        }

        const onClickBack = () => {
            showMainMenu();
        };

        const backButton = createMenuButton('Back', allLevels.length);
        backButton.onClickFunction = onClickBack;

        levelsContainer.appendChild(backButton);
        menuButtons.push(backButton);

        menuElement.appendChild(levelsContainer);

        updateButtonSelection();
    }

    function showControls() {
        currentMenu = 'controls';
        selectedButtonIndex = 0;

        // Clear current menu content
        while (menuElement.firstChild) {
            menuElement.removeChild(menuElement.firstChild);
        }

        const title = document.createElement('h2');
        title.textContent = 'CONTROLS';
        title.className = 'menu-subtitle';
        menuElement.appendChild(title);

        const controlsInfo = document.createElement('div');
        controlsInfo.className = 'controls-info';
        controlsInfo.innerHTML = `
            <p><strong>Up/Down Arrow:</strong> Navigate menu</p>
            <p><strong>Enter/Space:</strong> Select menu option</p>
            <p><strong>Left/Right Arrow:</strong> Move paddle</p>
            <p><strong>Space:</strong> Launch ball or shoot with paddle</p>
            <p><strong>P/Escape:</strong> Pause/Show menu</p>
        `;
        menuElement.appendChild(controlsInfo);

        const onClickBack = () => {
            showMainMenu();
        };

        const backButton = createMenuButton('Back', onClickBack, 0);
        backButton.onClickFunction = onClickBack; // Store function reference

        menuElement.appendChild(backButton);
        menuButtons = [backButton];

        updateButtonSelection();
    }

    function showMainMenu() {
        currentMenu = 'main';
        selectedButtonIndex = 0;

        // Clear current menu content
        while (menuElement.firstChild) {
            menuElement.removeChild(menuElement.firstChild);
        }

        const titleWrapper = document.createElement('div');
        titleWrapper.className = 'title-wrapper';

        const title = document.createElement('h1');
        title.innerHTML = '<span class="logo-red">BANA</span><span class="logo-blue">NOID</span>';
        title.className = 'menu-title';

        const subtitle = document.createElement('h2');
        subtitle.textContent = 'REVENGE OF BANANA';
        subtitle.className = 'menu-subtitle';

        titleWrapper.appendChild(title);
        titleWrapper.appendChild(subtitle);
        menuElement.appendChild(titleWrapper);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'menu-buttons';

        const onClickStart = () => {
            hideMenu();
            setTimeout(() => {
                GameState.loadLevel(0);
                if (typeof Ball !== 'undefined' && Ball.reset) Ball.reset();
                if (typeof Score !== 'undefined' && Score.init) Score.init();
                playGameStartSound();
            }, 10);
        };

        const startButton = createMenuButton('Start Game', onClickStart, 0);
        startButton.onClickFunction = onClickStart;

        const onClickLevelSelect = () => {
            showLevelSelect();
        };

        const levelSelectButton = createMenuButton('Level Select', onClickLevelSelect, 1);
        levelSelectButton.onClickFunction = onClickLevelSelect;

        const onClickLevelEditor = () => {
            hideMenu();
            setTimeout(() => {
                if (typeof LevelEditor !== 'undefined' && LevelEditor.show) {
                    LevelEditor.show();
                }
            }, 10);
        };

        const levelEditorButton = createMenuButton('Level Editor', onClickLevelEditor, 2);
        levelEditorButton.onClickFunction = onClickLevelEditor;

        const onClickControls = () => {
            showControls();
        };

        const controlsButton = createMenuButton('Controls', onClickControls, 3);
        controlsButton.onClickFunction = onClickControls;

        // Add buttons to container
        buttonsContainer.appendChild(startButton);
        buttonsContainer.appendChild(levelSelectButton);
        buttonsContainer.appendChild(levelEditorButton);
        buttonsContainer.appendChild(controlsButton);

        // Add button containers to menu
        menuElement.appendChild(buttonsContainer);

        // Store buttons for navigation
        menuButtons = [startButton, levelSelectButton, levelEditorButton, controlsButton];

        // Add Insert Coin message
        const insertCoin = document.createElement('div');
        insertCoin.className = 'insert-coin';
        insertCoin.innerHTML = 'Player 1';
        menuElement.appendChild(insertCoin);

        const credits = document.createElement('div');
        credits.className = 'credits';
        credits.innerHTML = `
            <p>© BANANA CORP 2025</p>
            <p>ALL RIGHTS RESERVED</p>
            `;
        menuElement.appendChild(credits);

        updateButtonSelection();

        menuElement.style.display = 'flex';
    }

    function hideMenu() {
        menuElement.style.display = 'none';
        isMenuVisible = false;
        GameState.setState({ isPaused: false });

        if (typeof Timer !== 'undefined' && Timer.start) {
            Timer.start();
        }

        if (typeof Ball !== 'undefined') {
            setTimeout(() => {
            }, 100);
        }
    }

    function showMenu() {
        if (currentMenu === 'coinInsert') {
            coinInsert();
            return;
        }

        menuElement.style.display = 'flex';
        isMenuVisible = true;
        GameState.setState({ isPaused: true });

        if (typeof Timer !== 'undefined' && Timer.pause) {
            Timer.pause();
        }

        // Show appropriate menu based on current state
        if (currentMenu === 'levelSelect') {
            showLevelSelect();
        } else if (currentMenu === 'controls') {
            showControls();
        } else if (currentMenu === 'pause') {
            showPauseMenu();
        } else {
            showMainMenu();
        }
    }

    function isInActiveGame() {
        const isPaused = gameState.getState().isPaused;
        const winScreen = document.getElementById('winScreen');
        const gameOverScreen = document.getElementById('gameOverMessage');
        const coinInsertScreen = document.getElementById('coinInsertScreen');

        return !isPaused && !isMenuVisible && !winScreen && !gameOverScreen && !coinInsertScreen;
    }

    function isCoinInsertVisible() {
        return document.getElementById('coinInsertScreen') !== null;
    }

    function init(GameState) {
        gameState = GameState;
        createMenu();

        if (typeof Timer !== 'undefined' && Timer.init) {
            Timer.init();
        }
        window.addEventListener('keydown', (e) => {
            const winScreen = document.getElementById('winScreen');
            const gameOverScreen = document.getElementById('gameOverMessage');
            const coinInsertScreenVisible = isCoinInsertVisible();
            const isInDisabledState = isMenuVisible || winScreen || gameOverScreen;

            if (coinInsertScreenVisible) {
                if (e.key === 'Enter' || e.key === ' ') {
                    coinInsert();
                    e.preventDefault();
                }
                return;
            }
            
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                if (isInDisabledState) {
                    e.preventDefault();
                    return;
                }

                if (isMenuVisible) {
                    hideMenu();
                } else {
                    if (isInActiveGame()) {
                        currentMenu = 'pause';
                        showMenu();
                    } else {
                        currentMenu = 'main';
                        showMenu();
                    }
                }
                e.preventDefault();
            }

            if (!isMenuVisible) return;

            switch (e.key) {
                case 'ArrowUp':
                    handleMenuNavigation('up');
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    handleMenuNavigation('down');
                    e.preventDefault();
                    break;
                case 'Enter':
                case ' ':
                    activateSelectedButton();
                    e.preventDefault();
                    break;
            }
        });
    }

    return {
        init,
        show: showMenu,
        hide: hideMenu,
        showPause: showPauseMenu,
        isVisible: function() { return isMenuVisible; },
        isInActiveGame: isInActiveGame,
        isCoinInsertVisible: isCoinInsertVisible
    };
})();
