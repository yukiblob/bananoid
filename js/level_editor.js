const LevelEditor = (function() {
    let gameState;
    let editorElement;
    let isEditorVisible = false;
    let currentGrid = [];
    let cursorX = 0;
    let cursorY = 0;
    const GRID_ROWS = 14;
    const GRID_COLS = 11;
    const BLOCK_WIDTH = 80;
    const BLOCK_HEIGHT = 30;
    const GRID_GAP = 2;

    function createEditor() {
        const gameArea = document.getElementById('gameArea');

        // Create editor container
        editorElement = document.createElement('div');
        editorElement.id = 'levelEditor';
        editorElement.className = 'level-editor';

        // Create editor UI
        editorElement.innerHTML = `
             <div class="editor-header">
                <h1 class="menu-title">LEVEL EDITOR</h1>
                <h2 class="menu-subtitle">CREATE YOUR OWN LEVEL</h2>
            </div>

            <div class="editor-grid-container">
                <div class="editor-grid" id="editorGrid"></div>
                <div class="editor-cursor" id="editorCursor"></div>
            </div>

            <div class="editor-controls">
                <div class="control-group">
                    <h3>CONTROLS</h3>
                    <p><strong>Arrow Keys:</strong> Move cursor</p>
                    <p><strong>0 or Delete:</strong> Remove Block</p>
                    <p><strong>Space:</strong> Clear All Blocks</p>
                    <p><strong>Enter:</strong> Save Level</p>
                    <p><strong>Escape:</strong> Exit Editor</p>
                </div>

                <div class="block-preview">
                    <h3>BLOCK TYPES</h3>
                    <div class="preview-item">
                        <div class="preview-block normal"></div>
                        <span>1 - Normal (Green)</span>
                    </div>
                    <div class="preview-item">
                        <div class="preview-block strong"></div>
                        <span>2 - Strong (Red)</span>
                    </div>
                    <div class="preview-item">
                        <div class="preview-block unbreakable"></div>
                        <span>3 - Unbreakable (Gray)</span>
                    </div>
                    <div class="preview-item">
                        <div class="preview-block empty"></div>
                        <span>0 - Empty</span>
                    </div>
                </div>
            </div>
        `;

        gameArea.appendChild(editorElement);
        initializeGrid();
        updateCursorPosition();
        updateGridDisplay();
    }

    function initializeGrid() {
        // Create empty grid
        currentGrid = [];
        for (let y = 0; y < GRID_ROWS; y++) {
            const row = []
            for (let x = 0; x < GRID_COLS; x++) {
                row.push(0); // empty
            }
            currentGrid.push(row);
        }
    }

    function createEditorGrid() {
        const gridElement = document.getElementById('editorGrid');
        gridElement.innerHTML = '';

        const totalWidth = GRID_COLS * BLOCK_WIDTH + (GRID_COLS - 1) * GRID_GAP;
        const totalHeight = GRID_ROWS * BLOCK_HEIGHT + (GRID_ROWS - 1) * GRID_GAP;

        gridElement.style.width = `${totalWidth}px`;
        gridElement.style.height = `${totalHeight}px`;

        // Create grid cells
        for (let y = 0; y < GRID_ROWS; y++) {
            for (let x = 0; x < GRID_COLS; x++) {
                const cell = document.createElement('div');
                cell.className = 'editor-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;

                const blockType = currentGrid[y][x];
                if (blockType !== 0) {
                    const block = document.createElement('div');
                    block.className = `editor-block ${getBlockClass(blockType)}`;

                    block.style.width = `${BLOCK_WIDTH}px`;
                    block.style.height = `${BLOCK_HEIGHT}px`;
                    cell.appendChild(block);
                }

                cell.style.left = `${x * (BLOCK_WIDTH + GRID_GAP)}px`;
                cell.style.top = `${y * (BLOCK_HEIGHT + GRID_GAP)}px`;
                cell.style.width = `${BLOCK_WIDTH}px`;
                cell.style.height = `${BLOCK_HEIGHT}px`;

                gridElement.appendChild(cell);
            }
        }
    }

    function getBlockClass(blockType) {
        switch (blockType) {
            case 1: return 'normal';
            case 2: return 'strong';
            case 3: return 'unbreakable';
            default: return '';
        }
    }

    function updateGridDisplay() {
        createEditorGrid();
    }

    function updateCursorPosition() {
        const cursor = document.getElementById('editorCursor');
        if (!cursor) return;

        const left = cursorX * (BLOCK_WIDTH + GRID_GAP);
        const top = cursorY * (BLOCK_HEIGHT + GRID_GAP);

        cursor.style.left = `${left + 20}px`;
        cursor.style.top = `${top + 20}px`;
        cursor.style.width = `${BLOCK_WIDTH}px`;
        cursor.style.height = `${BLOCK_HEIGHT}px`;

        cursor.style.transform = 'translate(0, 0)';
    }

    function placeBlock(blockType) {
        currentGrid[cursorY][cursorX] = blockType;
        updateGridDisplay();
    }

    function clearAllBlocks() {
        initializeGrid();
        updateGridDisplay();
    }

    async function saveLevel() {
        // Remove empty rows from the top and bottom
        let startRow = 0;
        let endRow = GRID_ROWS - 1;

        // Find first non-empty row from top
        while (startRow < GRID_ROWS && currentGrid[startRow].every(cell => cell === 0)) {
            startRow++;
        }

        // Find first non-empty row from bottom
        while (endRow >= 0 && currentGrid[endRow].every(cell => cell === 0)) {
            endRow--;
        }

        if (startRow > endRow) {
            alert('Cannot save empty level!');
            return;
        }

        // Extract the relevant rows
        const levelData = currentGrid.slice(startRow, endRow + 1);

        // Generate level name
        const levelName = prompt('Enter a name for your level:', `Custom Level ${new Date().toLocaleDateString()}`);

        if (!levelName) {
            return; // User cancelled
        }

        try {
            console.log('🔄 Saving level to server...', levelData);

            const response = await fetch('/api/levels/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: levelData,
                    name: levelName
                })
            });

            console.log('📡 Response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Level saved successfully:', result);
                alert(`✅ Level "${levelName}" saved successfully!`);
            } else {
                const errorText = await response.text();
                console.error('❌ Server error:', errorText);
                alert(`❌ Failed to save level. Server error: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('💥 Network error saving level:', error);
            alert(`❌ Network error: ${error.message}\n\nPlease ensure the Go server is running on http://localhost:8080`);
        }
    }

    function saveToCustomLevels(levelData, levelName) {
        // Check if custom_levels.js exists
        if (typeof window.customLevels === 'undefined') {
            window.customLevels = [];
        }

        // Add new level
        window.customLevels.push(levelData);

        // Create download link for the custom levels file
        const dataStr = "window.customLevels = " + JSON.stringify(window.customLevels, null, 2) + ";";
        const dataBlob = new Blob([dataStr], { type: 'application/javascript' });

        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = 'custom_levels.js';
        downloadLink.click();

        console.log('Level saved to custom_levels.js');
    }

    function handleEditorKeydown(e) {
        if (!isEditorVisible) return;

        switch (e.key) {
            case 'ArrowUp':
                cursorY = Math.max(0, cursorY - 1);
                updateCursorPosition();
                e.preventDefault();
                break;

            case 'ArrowDown':
                cursorY = Math.min(GRID_ROWS - 1, cursorY + 1);
                updateCursorPosition();
                e.preventDefault();
                break;

            case 'ArrowLeft':
                cursorX = Math.max(0, cursorX - 1);
                updateCursorPosition();
                e.preventDefault();
                break;

            case 'ArrowRight':
                cursorX = Math.min(GRID_COLS - 1, cursorX + 1);
                updateCursorPosition();
                e.preventDefault();
                break;

            case '1':
                placeBlock(1);
                e.preventDefault();
                break;

            case '2':
                placeBlock(2);
                e.preventDefault();
                break;

            case '3':
                placeBlock(3);
                e.preventDefault();
                break;

            case '0':
            case 'Delete':
            case 'Backspace':
                placeBlock(0);
                e.preventDefault();
                break;

            case ' ':
                clearAllBlocks();
                e.preventDefault();
                break;

            case 'Enter':
                saveLevel();
                e.preventDefault();
                break;

            case 'Escape':
            case 'p':
            case 'P':
                hideEditor();
                e.preventDefault();
                break;
        }
    }

    function showEditor() {
        editorElement.style.display = 'flex';
        isEditorVisible = true;

        // Hide game UI elements
        const elementsToHide = [
            '#score',
            '#livesContainer',
            '#gameTimer',
            '.controls',
            '#paddle',
            '.ball',
            '.powerup-pill',
            '.bullet',
            '.celebration-particle'
        ];

        elementsToHide.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.style.visibility = 'hidden';
            });
        });

        document.querySelectorAll('.block').forEach(block => {
            block.style.visibility = 'hidden';
        });

        // Add keyboard listener
        window.addEventListener('keydown', handleEditorKeydown);
    }

    function hideEditor() {
        editorElement.style.display = 'none';
        isEditorVisible = false;

        // Show game UI elements
        const elementsToShow = [
            '#score',
            '#livesContainer',
            '#gameTimer',
            '.controls',
            '#paddle',
            '.ball',
            '.powerup-pill',
            '.bullet',
            '.celebration-particle'
        ];

        elementsToShow.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.style.visibility = 'visible';
            });
        });

        document.querySelectorAll('.block').forEach(block => {
            block.style.visibility = 'visible';
        });

        // Remove keyboard listener
        window.removeEventListener('keydown', handleEditorKeydown);

        if (typeof GameState !== 'undefined') {
            GameState.setState({ isPaused: true });
        }

        setTimeout(() => {
            if (typeof Music !== 'undefined' && Music.playTropicalTheme) {
                Music.resume().then(() => {
                    Music.playTropicalTheme();
                });
            }
        }, 100);

        if (typeof Menu !== 'undefined') {
            Menu.setCurrentMenu('main');
            Menu.show();
        }
    }

    function init(GameState) {
        gameState = GameState;
        createEditor();

        // Add editor buttons handlers
        document.addEventListener('click', (e) => {
            if (!isEditorVisible) return;

            const button = e.target.closest('.menu-button');
            if (!button) return;

            const action = button.getAttribute('data-action');
            switch (action) {
                case 'save':
                    saveLevel();
                    break
                case 'clear':
                    clearAllBlocks();
                    break;
                case 'exit':
                    hideEditor();
                    break;
            }
        });
    }

    return {
        init,
        show: showEditor,
        hide: hideEditor,
        isVisible: function() { return isEditorVisible; }
    };
})();
