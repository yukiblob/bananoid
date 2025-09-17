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
        button.textContent = text;
        button.className = 'menu-button';
        button.dataset.index = index;
        button.addEventListener('click', onClick);
        return button;
    }

    function updateButtonSelection() {
        // Remove highlight from all buttons
        menuButtons.forEach(button => {
            button.classList.remove('selected');
        });

        // Add highlight to selected button
        if (menuButtons[selectedButtonIndex]) {
            menuButtons[selectedButtonIndex].classList.add('selected');
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
            menuButtons[selectedButtonIndex].click();
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
            const levelButton = createMenuButton(`Level ${i + 1}`, () => {
                hideMenu();
                GameState.loadLevel(i);
                if (typeof Ball !== 'undefined' && Ball.reset) Ball.reset();
                if (typeof Score !== 'undefined' && Score.init) Score.init();
            }, i);

            levelsContainer.appendChild(levelButton);
            menuButtons.push(levelButton);
        }

        const backButton = createMenuButton('Back', () => {
            showMainMenu();
        }, levelCount);

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

        const backButton = createMenuButton('Back', () => {
            showMainMenu();
        }, 0);

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

        const title = document.createElement('h1');
        title.innerHTML = '<span class="logo-red">BANA</span><span class="logo-blue">NOID</span>';
        title.className = 'menu-title';
        menuElement.appendChild(title);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'menu-buttons';

        const startButton = createMenuButton('Start Game', () => {
            hideMenu();
            GameState.loadLevel(0);
            if (typeof Ball !== 'undefined' && Ball.reset) Ball.reset();
            if (typeof Score !== 'undefined' && Score.init) Score.init();
        }, 0);

        const levelSelectButton = createMenuButton('Level Select', () => {
            showLevelSelect();
        }, 1);

        const controlsButton = createMenuButton('Controls', () => {
            showControls();
        }, 2);

        // Add buttons to container
        buttonsContainer.appendChild(startButton);
        buttonsContainer.appendChild(levelSelectButton);
        buttonsContainer.appendChild(controlsButton);

        // Add elements to menu
        menuElement.appendChild(title);
        menuElement.appendChild(buttonsContainer);

        // Store buttons for navigation
        menuButtons = [startButton, levelSelectButton, controlsButton];

        const credits = document.createElement('div');
        credits.className = 'credits';
        credits.innerHTML = `
        <p>© BANANO CORP 2025</p>
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
