const Menu = (function() {
    let gameState;
    let menuElement;
    let isMenuVisible = true;
    let currentMenu = 'main';
    let selectedButtonIndex = 0;
    let menuButtons = [];

    function createMenu() {
        const gameArea = document.getElementById('gameArea');

        // Create menu container
        menuElement = document.createElement('div');
        menuElement.id = 'mainMenu';

        // Add to game area
        gameArea.appendChild(menuElement);

        showMainMenu();
    }

    function createMenuButton(text, onClick, index) {
        const button = document.createElement('div');
        button.className = 'menu-button';
        button.dataset.index = index;
        button.style.cursor = 'default'; // Remove pointer cursor

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
    }

    function activateSelectedButton() {
        if (menuButtons[selectedButtonIndex]) {
            // Get the onClick function from the button's data attribute
            const onClickFunc = menuButtons[selectedButtonIndex].onClickFunction;
            if (onClickFunc) {
                onClickFunc();
            }
        }
    }

    function showLevelSelect() {
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

        // Create level buttons
        const levelCount = window.levels ? window.levels.length : 1;
        menuButtons = [];

        for (let i = 0; i < levelCount; i++) {
            const onClick = () => {
                hideMenu();
                GameState.loadLevel(i);
                if (typeof Ball !== 'undefined' && Ball.reset) Ball.reset();
                if (typeof Score !== 'undefined' && Score.init) Score.init();
            };

            const levelButton = createMenuButton(`Level ${i + 1}`, onClick, i);
            levelButton.onClickFunction = onClick; // Store function reference

            levelsContainer.appendChild(levelButton);
            menuButtons.push(levelButton);
        }

        const onClickBack = () => {
            showMainMenu();
        };

        const backButton = createMenuButton('Back', onClickBack, levelCount);
        backButton.onClickFunction = onClickBack; // Store function reference

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
            GameState.loadLevel(0);
            if (typeof Ball !== 'undefined' && Ball.reset) Ball.reset();
            if (typeof Score !== 'undefined' && Score.init) Score.init();
        };

        const startButton = createMenuButton('Start Game', onClickStart, 0);
        startButton.onClickFunction = onClickStart; // Store function reference

        const onClickLevelSelect = () => {
            showLevelSelect();
        };

        const levelSelectButton = createMenuButton('Level Select', onClickLevelSelect, 1);
        levelSelectButton.onClickFunction = onClickLevelSelect; // Store function reference

        const onClickControls = () => {
            showControls();
        };

        const controlsButton = createMenuButton('Controls', onClickControls, 2);
        controlsButton.onClickFunction = onClickControls; // Store function reference

        // Add buttons to container
        buttonsContainer.appendChild(startButton);
        buttonsContainer.appendChild(levelSelectButton);
        buttonsContainer.appendChild(controlsButton);

        // Add button containers to menu
        menuElement.appendChild(buttonsContainer);

        // Store buttons for navigation
        menuButtons = [startButton, levelSelectButton, controlsButton];

        const credits = document.createElement('div');
        credits.className = 'credits';
        credits.innerHTML = `
        <p>© BANANA CORP 2025</p>
        <p>ALL RIGHTS RESERVED</p>
        `;
        menuElement.appendChild(credits);

        updateButtonSelection();
    }

    function hideMenu() {
        menuElement.style.display = 'none';
        isMenuVisible = false;
        GameState.setState({ isPaused: false });
    }

    function showMenu() {
        menuElement.style.display = 'flex';
        isMenuVisible = true;
        GameState.setState({ isPaused: true });

        // Show appropriate menu based on current state
        if (currentMenu === 'levelSelect') {
            showLevelSelect();
        } else if (currentMenu === 'controls') {
            showControls();
        } else {
            showMainMenu();
        }
    }

    function init(GameState) {
        gameState = GameState;
        createMenu();

        window.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                if (isMenuVisible) {
                    hideMenu();
                } else {
                    showMenu();
                }
                e.preventDefault();
            }

            // Only process navigation keys if menu is visible
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
        isVisible: function() { return isMenuVisible; }
    };
})();
