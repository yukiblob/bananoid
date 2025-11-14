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

        setTimeout(() => {
            if (typeof Music !== 'undefined' && Music.playTropicalTheme) {
                console.log('Attempting to start music...');
                Music.resume().then(() => {
                    Music.playTropicalTheme();
                });
            }
        }, 100);
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

        // Auto-scroll to keep selected button in view
        autoScrollToSelectedButton();

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
                if (typeof Music !== 'undefined' && Music.playCrystalHammer) {
                    Music.fadeStop();
                    Music.playCrystalHammer();
                }
            }, 10);
        };

        const restartButton = createMenuButton('Restart', onClickRestart, 1);
        restartButton.onClickFunction = onClickRestart;

        // Return to main menu
        const onClickMainMenu = () => {
            hideMenu();
            GameState.returnToMenu();
            showMainMenu();
            setTimeout(() => {
                if (typeof Music !== 'undefined' && Music.playTropicalTheme) {
                    Music.fadeStop();
                    Music.playTropicalTheme();
                }
            }, 100);
        };

        const mainMenuButton = createMenuButton('Main Menu', onClickMainMenu, 2);
        mainMenuButton.onClickFunction = onClickMainMenu;

        // Add buttons to container
        buttonsContainer.appendChild(continueButton);
        buttonsContainer.appendChild(restartButton);
        buttonsContainer.appendChild(mainMenuButton);

        // Add button containers to menu
        menuElement.appendChild(buttonsContainer);

        // Store buttons for navigation
        menuButtons = [continueButton, restartButton, mainMenuButton];

        updateButtonSelection();

        menuElement.style.display = 'flex';
        isMenuVisible = true;

        if (typeof Music !== 'undefined' && Music.setPaused) {
            Music.setPaused(true);
        }
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
        levelsContainer.className = 'level-select-container';

        let originalLevels = [];
        let customLevels = [];

        // Load original levels
        originalLevels =
            (typeof levels !== "undefined" && Array.isArray(levels)) ? levels :
                (typeof window !== "undefined" && Array.isArray(window.levels)) ? window.levels :
                    defaultLevels;

        // Load custom levels
        try {
            const response = await fetch('http://localhost:8080/api/levels');
            if (response.ok) {
                const data = await response.json();
                customLevels = data.levels || [];
            }
        } catch (error) {
            console.warn('Could not load custom levels from API:', error);
        }

        menuButtons = [];

        const onClickBack = () => {
            showMainMenu();
        };

        const backButton = createMenuButton('Back', 0);
        backButton.onClickFunction = onClickBack;
        backButton.style.marginBottom = '20px';

        levelsContainer.appendChild(backButton);
        menuButtons.push(backButton);

        // Create section headers
        if (originalLevels.length > 0) {
            const originalHeader = document.createElement('div');
            originalHeader.className = 'level-section-header';
            originalHeader.textContent = 'ORIGINAL LEVELS';
            originalHeader.style.width = '100%';
            originalHeader.style.color = '#ffcc00';
            originalHeader.style.marginTop = '10px';
            originalHeader.style.marginBottom = '10px';
            originalHeader.style.fontSize = '16px';
            originalHeader.style.textShadow = '0 0 5px #ffcc00';
            levelsContainer.appendChild(originalHeader);
        }

        // Create original level buttons
        for (let i = 0; i < originalLevels.length; i++) {
            const onClick = () => {
                if (typeof Music !== 'undefined' && Music.stop) {
                    Music.fadeStop();
                }
                hideMenu();

                setTimeout(() => {
                    // Make sure game is unpaused when starting a level
                    GameState.setState({ isPaused: false });

                    GameState.loadLevel(i);
                    if (typeof Ball !== 'undefined' && Ball.reset) Ball.reset();
                    if (typeof Score !== 'undefined' && Score.reset) Score.reset();
                    if (typeof Lives !== 'undefined' && Lives.setLives) Lives.setLives(3);
                    if (typeof Timer !== 'undefined') {
                        if (Timer.reset) Timer.reset();
                        if (Timer.start) Timer.start();
                    }

                    setTimeout(() => {
                        if (typeof Music !== 'undefined' && Music.playCrystalHammer) {
                            Music.playCrystalHammer();
                        }
                    }, 50);
                }, 10);
            };

            const level = originalLevels[i];
            const buttonText = level.name || `Original ${i + 1}1`;

            const levelButton = createMenuButton(buttonText, i + 1);
            levelButton.onClickFunction = onClick;

            // Style for original levels
            levelButton.style.color = '#ffcc00';
            levelButton.style.textShadow = '0 0 5px #ffcc00';
            levelButton.title = level.name ? `Original: ${level.name}` : 'Original Level';

            levelsContainer.appendChild(levelButton);
            menuButtons.push(levelButton);
        }

        // Create custom levels section
        if (customLevels.length > 0) {
            const customHeader = document.createElement('div');
            customHeader.className = 'level-section-header';
            customHeader.textContent = 'CUSTOM LEVELS';
            customHeader.style.width = '100%';
            customHeader.style.color = '#4ecdc4';
            customHeader.style.marginTop = '20px';
            customHeader.style.marginBottom = '10px';
            customHeader.style.fontSize = '16px';
            customHeader.style.textShadow = '0 0 5px #4ecdc4';
            levelsContainer.appendChild(customHeader);

            // Create custom level buttons
            for (let i = 0; i < customLevels.length; i++) {
                const onClick = () => {
                    if (typeof Music !== 'undefined' && Music.stop) {
                        Music.fadeStop();
                    }
                    hideMenu();

                    setTimeout(() => {
                        // Make sure game is unpaused when starting a level
                        GameState.setState({ isPaused: false });

                        // Load custom level (offset by original levels count)
                        GameState.loadLevel(i + originalLevels.length);
                        if (typeof Ball !== 'undefined' && Ball.reset) Ball.reset();
                        if (typeof Score !== 'undefined' && Score.reset) Score.reset();
                        if (typeof Lives !== 'undefined' && Lives.setLives) Lives.setLives(3);
                        if (typeof Timer !== 'undefined') {
                            if (Timer.reset) Timer.reset();
                            if (Timer.start) Timer.start();
                        }

                        setTimeout(() => {
                            if (typeof Music !== 'undefined' && Music.playCrystalHammer) {
                                Music.playCrystalHammer();
                            }
                        }, 50);
                    }, 10);
                };

                const level = customLevels[i];
                const buttonText = level.name || `Custom ${i + 1}`;

                const levelButton = createMenuButton(buttonText, i + 1 + originalLevels.length); // Adjust index for back button
                levelButton.onClickFunction = onClick;

                // Style for custom levels
                levelButton.style.color = '#4ecdc4';
                levelButton.style.textShadow = '0 0 5px #4ecdc4';
                levelButton.title = level.name ? `Custom: ${level.name}` : 'Custom Level';

                levelsContainer.appendChild(levelButton);
                menuButtons.push(levelButton);
            }
        }

        menuElement.appendChild(levelsContainer);
        updateButtonSelection();
    }

    function autoScrollToSelectedButton() {
        if (currentMenu !== 'levelSelect') return;

        const levelsContainer = document.querySelector('.level-select-container');
        const selectedButton = menuButtons[selectedButtonIndex];

        if (!levelsContainer || !selectedButton) return;

        const containerRect = levelsContainer.getBoundingClientRect();
        const buttonRect = selectedButton.getBoundingClientRect();
        const containerHeight = containerRect.height;
        const buttonTop = buttonRect.top - containerRect.top;
        const buttonBottom = buttonRect.bottom - containerRect.top;

        // Scroll if button is near top or bottom
        if (buttonTop < 50) {
            // Button is too high, scroll up
            levelsContainer.scrollTop += buttonTop - 50;
        } else if (buttonBottom > containerHeight - 50) {
            // Button is too low, scroll down
            levelsContainer.scrollTop += buttonBottom - containerHeight + 50;
        }
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
            showOptions();
        };

        const backButton = createMenuButton('Back', 0);
        backButton.onClickFunction = onClickBack; // Store function reference

        menuElement.appendChild(backButton);
        menuButtons = [backButton];

        updateButtonSelection();
    }

    function showOptions() {
        currentMenu = 'options';
        selectedButtonIndex = 0;

        while (menuElement.firstChild) {
            menuElement.removeChild(menuElement.firstChild);
        }

        const headerContainer = document.createElement('div');
        headerContainer.className = 'options-header';

        const title = document.createElement('h2');
        title.textContent = 'OPTIONS';
        title.className = 'menu-subtitle';
        headerContainer.appendChild(title);

        menuElement.appendChild(headerContainer);

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container';

        menuButtons = [];

        const musicVolumeButton = createVolumeButton('Music Volume', 'music', 0);
        const soundVolumeButton = createVolumeButton('Sound Volume', 'sound', 1);

        optionsContainer.appendChild(musicVolumeButton);
        optionsContainer.appendChild(soundVolumeButton);
        menuButtons.push(musicVolumeButton, soundVolumeButton);

        const onClickControls = () => {
            showControls();
        };

        const controlsButton = createMenuButton('Controls', 1);
        controlsButton.onClickFunction = onClickControls;
        controlsButton.title = 'View game controls';

        optionsContainer.appendChild(controlsButton);
        menuButtons.push(controlsButton);

        const onClickBack = () => {
            showMainMenu();
        };

        const backButton = createMenuButton('Back', 3);
        backButton.onClickFunction = onClickBack;
        backButton.style.marginBottom = '20px';

        optionsContainer.appendChild(backButton);
        menuButtons.push(backButton);

        menuElement.appendChild(optionsContainer);

        updateButtonSelection();
    }

    function createVolumeButton(label, type, index) {
        const button = document.createElement('div');
        button.className = 'menu-button volume-button';
        button.dataset.index = index;
        button.dataset.volumeType = type;
        button.style.cursor = 'none';
        button.style.flexDirection = 'column';
        button.style.gap = '10px';
        button.style.padding = '12px 0';

        const arrow = document.createElement('span');
        arrow.className = 'arrow-indicator';
        arrow.innerHTML = '▶';

        const textSpan = document.createElement('span');
        textSpan.textContent = label;
        textSpan.className = 'button-text';

        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'volume-slider-container';

        const slider = document.createElement('div');
        slider.className = 'volume-slider';
        slider.dataset.type = type;

        const notchesContainer = document.createElement('div');
        notchesContainer.className = 'volume-notches';

        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'volume-value';

        for (let i = 0; i < 10; i++) {
            const notch = document.createElement('div');
            notch.className = 'volume-notch';
            notch.dataset.index = i;
            notchesContainer.appendChild(notch);
        }

        slider.appendChild(notchesContainer);
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueDisplay);

        let currentVolume;
        if (type === 'music') {
            currentVolume = 0.04;
        } else {
            currentVolume = 0.1;
        }

        slider.dataset.currentVolume = currentVolume.toFixed(2);
        updateVolumeDisplay(slider, valueDisplay, currentVolume);

        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.alignItems = 'center';
        topRow.style.justifyContent = 'center';
        topRow.style.position = 'relative';
        topRow.style.width = '100%';

        topRow.appendChild(arrow);
        topRow.appendChild(textSpan);

        button.appendChild(topRow);
        button.appendChild(sliderContainer);

        button.slider = slider;
        button.valueDisplay = valueDisplay;

        return button;
    }

    function updateVolumeDisplay(slider, valueDisplay, volume) {
        const notches = slider.querySelectorAll('.volume-notch');
        const activeNotches = Math.round(volume * 100);
        
        notches.forEach((notch, index) => {
            if (index < activeNotches) {
                notch.classList.add('active');
            } else {
                notch.classList.remove('active');
            }
        });

        valueDisplay.textContent = activeNotches;
        slider.dataset.currentVolume = volume.toFixed(2);
    }

    function adjustSelectedVolume(direction) {
        if (currentMenu !== 'options') return;

        const selectedButton = menuButtons[selectedButtonIndex];
        if (!selectedButton || !selectedButton.classList.contains('volume-button')) return;

        const type = selectedButton.dataset.volumeType;
        const slider = selectedButton.slider;
        const valueDisplay = selectedButton.valueDisplay;

        let currentVolume = parseFloat(slider.dataset.currentVolume);
        const step = 0.01;

        if (direction === 'increase') {
            currentVolume = Math.min(0.10, currentVolume + step);
        } else if (direction === 'decrease') {
            currentVolume = Math.max(0.00, currentVolume - step);
        }

        if (type === 'music' && typeof Music !== 'undefined' && Music.setVolume) {
            Music.setVolume(currentVolume);
        } else if (type === 'sound' && typeof SoundManager !== 'undefined' && SoundManager.setVolume) {
            SoundManager.setVolume(currentVolume);

            if (SoundManager.playMenuNavigate) {
                SoundManager.playMenuNavigate();
            }
        }

        updateVolumeDisplay(slider, valueDisplay, currentVolume);
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
            if (typeof Music !== 'undefined' && Music.stop) {
                Music.fadeStop();
            }
            hideMenu();

            playGameStartSound();
            
            setTimeout(() => {
                if (typeof CutsceneManager !== 'undefined' && CutsceneManager.showIntro) {
                    CutsceneManager.showIntro();
                } else {
                    startGameDirectly();
                }
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

        const onClickOptions = () => {
            showOptions();
        };

        const optionsButton = createMenuButton('Options', onClickOptions, 3);
        optionsButton.onClickFunction = onClickOptions;

        // Add buttons to container
        buttonsContainer.appendChild(startButton);
        buttonsContainer.appendChild(levelSelectButton);
        buttonsContainer.appendChild(levelEditorButton);
        buttonsContainer.appendChild(optionsButton);

        // Add button containers to menu
        menuElement.appendChild(buttonsContainer);

        // Store buttons for navigation
        menuButtons = [startButton, levelSelectButton, levelEditorButton, optionsButton];

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

    function startGameDirectly() {
        GameState.loadLevel(0);
        if (typeof Ball !== 'undefined' && Ball.reset) Ball.reset();
        if (typeof Score !== 'undefined' && Score.init) Score.init();
        GameState.setState({ isPaused: false });
        if (typeof Timer !== 'undefined' && Timer.start) Timer.start();

        playGameStartSound();

        setTimeout(() => {
            if (typeof Music !== 'undefined' && Music.playCrystalHammer) {
                Music.playCrystalHammer();
            }
        }, 100);
    }

    function hideMenu() {
        menuElement.style.display = 'none';
        isMenuVisible = false;

        if (currentMenu === 'pause') {
            GameState.setState({ isPaused: false });

            if (typeof Timer !== 'undefined' && Timer.start) {
                Timer.start();
            }
        }

        if (currentMenu === 'pause') {
            if (typeof Music !== 'undefined' && Music.setPaused) {
                Music.setPaused(false);
            }
            currentMenu = 'main';
        }
    }

    function showMenu() {
        if (currentMenu === 'coinInsert') {
            coinInsert();
            return;
        }

        menuElement.style.display = 'flex';
        isMenuVisible = true;

        // Only pause the game if showing pause menu
        if (currentMenu === 'pause') {
            GameState.setState({ isPaused: true });

            if (typeof Timer !== 'undefined' && Timer.pause) {
                Timer.pause();
            }
        }

        // Show appropriate menu based on current state
        if (currentMenu === 'levelSelect') {
            showLevelSelect();
        } else if (currentMenu === 'controls') {
            showControls();
        } else if (currentMenu === 'pause') {
            showPauseMenu();
        } else if (currentMenu === 'options') {
            showOptions();
        } else {
            showMainMenu();
        }
    }

    function isInActiveGame() {
        const winScreen = document.getElementById('winScreen');
        const gameOverScreen = document.getElementById('gameOverMessage');
        const coinInsertScreen = document.getElementById('coinInsertScreen');

        return !isMenuVisible && !winScreen && !gameOverScreen && !coinInsertScreen;
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

        let audioContextResumed = false;

        const resumeAudioOnFirstInteraction = (e) => {
            if (audioContextResumed) return;

            if (e.type === 'keydown') {
                audioContextResumed = true;
                if (typeof SoundManager !== 'undefined' && SoundManager.resume) {
                    SoundManager.resume().then(() => {
                        console.log('Audio context resumed via first keypress');
                    }).catch(error => {
                        console.warn('Failed to resume audio:', error);
                    });
                }
            }
            else if (e.type === 'click' || e.type === 'touchstart') {
                audioContextResumed = true;
                if (typeof SoundManager !== 'undefined' && SoundManager.resume) {
                    SoundManager.resume().then(() => {
                        console.log('Audio context resumed via first click/touch');
                    });
                }
            }
        };

        window.addEventListener('keydown', resumeAudioOnFirstInteraction, {
            once: false,
            capture: true  // Important: capture before other handlers
        });
        window.addEventListener('click', resumeAudioOnFirstInteraction, {
            once: false,
            capture: true
        });
        window.addEventListener('touchstart', resumeAudioOnFirstInteraction, {
            once: false,
            capture: true
        });

        window.addEventListener('keydown', (e) => {
            const winScreen = document.getElementById('winScreen');
            const gameOverScreen = document.getElementById('gameOverMessage');
            const coinInsertScreenVisible = isCoinInsertVisible();

            if (coinInsertScreenVisible) {
                if (e.key === 'Enter' || e.key === ' ') {
                    coinInsert();
                    e.preventDefault();
                }
                return;
            }

            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                // Only allow pausing if we're in an active game
                if (!winScreen && !gameOverScreen) {
                    if (isMenuVisible && currentMenu === 'pause') {
                        // If pause menu is already visible, hide it
                        hideMenu();
                    } else if (!isMenuVisible) {
                        // If no menu is visible, show pause menu
                        currentMenu = 'pause';
                        showMenu();

                        GameState.setState({ isPaused: true });
                        if (typeof GameState.handleGamePause === 'function') {
                            GameState.handleGamePause();
                        }
                    }
                    e.preventDefault();
                }
            }

            if (!isMenuVisible) return;

            if (currentMenu === 'options') {
                const selectedButton = menuButtons[selectedButtonIndex];

                if (selectedButton && selectedButton.classList.contains('volume-button')) {
                    switch (e.key) {
                        case 'ArrowLeft':
                            adjustSelectedVolume('decrease');
                            e.preventDefault();
                            break;
                        case 'ArrowRight':
                            adjustSelectedVolume('increase');
                            e.preventDefault();
                            break;
                    }
                }
            }

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
        setCurrentMenu: function(menuType) {
            currentMenu = menuType;
        },
        isCoinInsertVisible: isCoinInsertVisible,
        coinInsert: coinInsert
    };
})();