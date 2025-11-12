const CutsceneManager = (function() {
    let currentCutscene = null;
    let currentSceneIndex = 0;
    let cutsceneElement = null;
    let currentSceneData = null;
    let currrentKeydownHandler = null;

    function createCutsceneElement() {
        const cutscene = document.createElement('div');
        cutscene.id = 'cutsceneContainer';
        cutscene.className = 'cutscene-container';
        cutscene.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
            display: none;
        `;
        document.getElementById('gameArea').appendChild(cutscene);
        return cutscene;
    }

    const introCutscene = [
        {
            background: 'linear-gradient(rgba(12, 16, 39, 0.85), rgba(12, 16, 39, 0.95)), url(\'/media/banana-tree-beach.jpg\')',
            content: `
                <div class="cutscene-content">
                    <div class="beach-scene">
                        <div class="palm-grove">
                            <div class="palm-tree-left-1">🌴</div>
                            <div class="palm-tree-left-2">🌴</div>
                            <div class="palm-tree-left-3">🌴</div>
                            <div class="palm-tree-right-1">🌴</div>
                            <div class="palm-tree-right-2">🌴</div>
                            <div class="palm-tree-right-3">🌴</div>
                        </div>
                        <div class="recliner">
                            <div class="banana-paddle"></div>
                        </div>
                        <div class="sun"></div>
                    </div>
                    <div class="cutscene-textbox">
                        <div class="cutscene-text">Once upon a time, there was a happy banana...</div>
                    </div>
                    <div class="cutscene-prompt">Press SPACE to continue</div>
                    <div class="cutscene-prompt">or ENTER to skip</div>
                </div>
            `,
            onEnter: null
        },
        {
            background: 'linear-gradient(rgba(12, 16, 39, 0.85), rgba(12, 16, 39, 0.95)), url(\'/media/banana-tree-beach.jpg\')',
            content: `
                <div class="cutscene-content">
                    <div class="beach-scene">
                        <div class="palm-grove">
                            <div class="palm-tree-left-1">🌴</div>
                            <div class="palm-tree-left-2">🌴</div>
                            <div class="palm-tree-left-3">🌴</div>
                            <div class="palm-tree-right-1">🌴</div>
                            <div class="palm-tree-right-2">🌴</div>
                            <div class="palm-tree-right-3">🌴</div>
                        </div>
                        <div class="recliner">
                            <div class="banana-paddle"></div>
                        </div>
                        <div class="sun"></div>
                        <div class="boss-container scene-2">
                            <div class="moai-boss">
                                <div class="moai-eye left"></div>
                                <div class="moai-eye right"></div>
                                <div class="moai-nose"></div>
                                <div class="moai-mouth"></div>
                            </div>
                        </div>
                    </div>
                    <div class="cutscene-textbox">
                        <div class="cutscene-text">Then, one day, the evil D'oh visited bananaland...</div>
                    </div>
                    <div class="cutscene-prompt">Press SPACE to continue</div>
                    <div class="cutscene-prompt">or ENTER to skip</div>
                </div>
            `,
            onEnter: function() {
                setTimeout(() => {
                    const boss = document.querySelector('.boss-container.scene-2');
                    if (boss) boss.classList.add('boss-enter-complete');
                }, 100);
            }
        },
        {
            background: 'linear-gradient(rgba(12, 16, 39, 0.85), rgba(12, 16, 39, 0.95)), url(\'/media/banana-tree-beach.jpg\')',
            content: `
                <div class="cutscene-content">
                    <div class="beach-scene">
                        <div class="palm-grove">
                            <div class="palm-tree-left-1">🌴</div>
                            <div class="palm-tree-left-2">🌴</div>
                            <div class="palm-tree-left-3">🌴</div>
                            <div class="palm-tree-right-1">🌴</div>
                            <div class="palm-tree-right-2">🌴</div>
                            <div class="palm-tree-right-3">🌴</div>
                        </div>
                        <div class="recliner">
                            <div class="naked-banana-paddle banana-shaking"></div>
                            <div class="stolen-banana-peel scene-3"></div>
                        </div>
                        <div class="sun"></div>
                        <div class="boss-container scene-3">
                            <div class="moai-boss">
                                <div class="moai-eye left"></div>
                                <div class="moai-eye right"></div>
                                <div class="moai-nose"></div>
                                <div class="moai-mouth"></div>
                            </div>
                        </div>
                    </div>
                    <div class="cutscene-textbox">
                        <div class="cutscene-text">And stole the banana's peel!</div>
                    </div>
                    <div class="cutscene-prompt">Press SPACE to continue</div>
                    <div class="cutscene-prompt">or ENTER to skip</div>
                </div>
            `,
            onEnter: function() {
                if (typeof SoundManager !== 'undefined' && SoundManager.playPowerup) {
                    SoundManager.playPowerup();
                }

                setTimeout(() => {
                    const peel = document.querySelector('.stolen-banana-peel.scene-3');
                    if (peel) {
                        peel.classList.add('peel-stolen');
                    }
                }, 100);
            }
        },
        {
            background: 'linear-gradient(rgba(12, 16, 39, 0.85), rgba(12, 16, 39, 0.95)), url(\'/media/banana-tree-beach.jpg\')',
            content: `
                <div class="cutscene-content">
                    <div class="beach-scene">
                        <div class="palm-grove">
                            <div class="palm-tree-left-1">🌴</div>
                            <div class="palm-tree-left-2">🌴</div>
                            <div class="palm-tree-left-3">🌴</div>
                            <div class="palm-tree-right-1">🌴</div>
                            <div class="palm-tree-right-2">🌴</div>
                            <div class="palm-tree-right-3">🌴</div>
                        </div>
                        <div class="recliner">
                            <div class="naked-banana-paddle banana-shaking"></div>
                            <div class="stolen-banana-peel scene-4"></div>
                        </div>
                        <div class="sun"></div>
                        <div class="boss-container scene-4">
                            <div class="moai-boss">
                                <div class="moai-eye left"></div>
                                <div class="moai-eye right"></div>
                                <div class="moai-nose"></div>
                                <div class="moai-mouth"></div>
                            </div>
                        </div>
                    </div>
                    <div class="cutscene-textbox">
                        <div class="cutscene-text">You must assault D'oh's fortress and get it back!</div>
                    </div>
                    <div class="cutscene-prompt">Press SPACE to begin your quest!</div>
                </div>
            `,
            onEnter: function() {
                if (typeof SoundManager !== 'undefined' && SoundManager.playLaugh) {
                    SoundManager.playLaugh();
                }

                setTimeout(() => {
                    const boss = document.querySelector('.boss-container.scene-4');
                    const peel = document.querySelector('.stolen-banana-peel.scene-4');
                    if (boss) boss.classList.add('boss-exit-complete');
                    if (peel) peel.classList.add('peel-exit-complete');
                }, 100);
            }
        }
    ];

    const victoryCutscene = [
        {
            background: 'linear-gradient(to bottom, #0c1027, #1a1f4a)',
            content: `
                <div class="cutscene-content">
                    <div class="victory-scene">
                        <div class="naked-banana-paddle victory-banana"></div>
                    </div>
                    <div class="cutscene-textbox">
                        <div class="cutscene-text">At last, the villainous D'oh has been defeated...</div>
                    </div>
                    <div class="cutscene-prompt">Press SPACE to continue</div>
                    <div class="cutscene-prompt">or ENTER to skip</div>
                </div>
            `,
            onEnter: null
        },
        {
            background: 'linear-gradient(to bottom, #0c1027, #1a1f4a)',
            content: `
                <div class="cutscene-content">
                    <div class="victory-scene">
                        <div class="naked-banana-paddle victory-banana"></div>
                        <div class="banana-peel victory-peel-falling"></div>
                    </div>
                    <div class="cutscene-textbox">
                        <div class="cutscene-text">And with the banana peel recovered...</div>
                    </div>
                    <div class="cutscene-prompt">Press SPACE to continue</div>
                    <div class="cutscene-prompt">or ENTER to skip</div>
                </div>
            `,
            onEnter: function() {
                setTimeout(() => {
                    const peel = document.querySelector('.banana-peel.victory-peel-falling');
                    if (peel) {
                        peel.classList.add('peel-landed');
                    }
                }, 3000);
            }
        },
        {
            background: 'linear-gradient(to bottom, #0c1027, #1a1f4a)',
            content: `
                <div class="cutscene-content">
                    <div class="party-light"></div>
                    <div class="light-rays"></div>
                    <div class="victory-scene">
                        <div class="banana-peel victory-peel-jumping">
                        </div>
                    </div>
                    <div class="cutscene-textbox">
                        <div class="cutscene-text">It's time to PAR TAY!></div>
                    </div>
                    <div class="cutscene-prompt">PAR TAY!</div>
                </div>
            `,
            onEnter: function() {
                setTimeout(() => {
                    startJumpingSound();
                }, 100);
            }
        }
    ];

    let jumpingInterval = null;

    function startJumpingSound() {
        if (typeof SoundManager !== 'undefined' && SoundManager.Beep) {
            SoundManager.Beep(800, 0.1, 0.1, 'square');
        }
        let jumpCount = 0;
        const maxJumps = 20;

        jumpingInterval = setInterval(() => {
            if (jumpCount >= maxJumps) {
                clearInterval(jumpingInterval);
                return;
            }

            if (typeof SoundManager !== 'undefined' && SoundManager.Beep) {
                SoundManager.Beep(800, 0.1, 0.1, 'square');
            }
            jumpCount++;
        }, 1600);
    }

    function stopJumpingSound() {
        if (jumpingInterval) {
            clearInterval(jumpingInterval);
            jumpingInterval = null;
        }
    }

    function showScene() {
        if (!currentSceneData || currentSceneIndex >= currentSceneData.length) {
            if (currentCutscene === 'victory') {
                endVictoryCutscene();
            } else {
                endCutscene();
            }
            return;
        }

        const scene = currentSceneData[currentSceneIndex];
        cutsceneElement.style.background = scene.background;
        cutsceneElement.innerHTML = scene.content;

        if (scene.onEnter) {
            scene.onEnter();
        }
    }

    function nextScene() {
        currentSceneIndex++;
        if (currentSceneIndex < currentSceneData.length) {
            showScene();
        } else {
            if (currentCutscene === 'victory') {
                endVictoryCutscene();
            } else {
                endCutscene();
            }
        }
    }

    function showIntroCutscene() {
        if (!cutsceneElement) {
            cutsceneElement = createCutsceneElement();
        }

        currentCutscene = 'intro';
        currentSceneIndex = 0;
        currentSceneData = introCutscene;

        removeCurrentEventListener();

        cutsceneElement.style.display = 'block';
        showScene();

        function handleCutsceneKeydown(e) {
            if (e.key === ' ') {
                nextScene();
                e.preventDefault();
            } else if (e.key === 'Enter') {
                endCutscene();
                removeCurrentEventListener();
                e.preventDefault();
            }
        }

        currrentKeydownHandler = handleCutsceneKeydown;
        window.addEventListener('keydown', currrentKeydownHandler);
    }

    function showVictoryCutscene() {
        if (!cutsceneElement) {
            cutsceneElement = createCutsceneElement();
        }

        currentCutscene = 'victory';
        currentSceneIndex = 0;
        currentSceneData = victoryCutscene;

        if (typeof GameState !== 'undefined') {
            GameState.setState({ isPaused: true });
        }

        if (typeof Timer !== 'undefined' && Timer.pause) {
            Timer.pause();
        }

        removeCurrentEventListener();

        cutsceneElement.style.display = 'block';
        showScene();

        function handleVictoryKeydown(e) {
            if (e.key === ' ') {
                nextScene();
                e.preventDefault();
            } else if (e.key === 'Enter') {
                if (currentCutscene === 'victory') {
                    endVictoryCutscene();
                } else {
                    endCutscene();
                }
                removeCurrentEventListener();
                e.preventDefault();
            }
        }

        currrentKeydownHandler = handleVictoryKeydown;
        window.addEventListener('keydown', currrentKeydownHandler);
    }

    function removeCurrentEventListener() {
        if (currrentKeydownHandler) {
            window.removeEventListener('keydown', currrentKeydownHandler);
            currrentKeydownHandler = null;
        }
    }

    function endVictoryCutscene() {
        stopJumpingSound();
        removeCurrentEventListener();

        if (cutsceneElement) {
            cutsceneElement.style.display = 'none';
            cutsceneElement.innerHTML = '';
        }

        currentCutscene = null;
        currentSceneIndex = 0;
        currentSceneData = null;

        if (typeof GameState !== 'undefined' && GameState.showWinScreen) {
            GameState.showWinScreen();
        }
    }

    function endCutscene() {
        removeCurrentEventListener();
        
        if (cutsceneElement) {
            cutsceneElement.style.display = 'none';
            cutsceneElement.innerHTML = '';
        }
        currentCutscene = null;
        currentSceneIndex = 0;
        currentSceneData = null;

        if (typeof GameState !== 'undefined') {
            GameState.setState({ isPaused: false });
            GameState.loadLevel(0);
            if (typeof Ball !== 'undefined' && Ball.reset) Ball.reset();
            if (typeof Timer !== 'undefined' && Timer.start) Timer.start();

            setTimeout(() => {
                if (typeof Music !== 'undefined' && Music.playCrystalHammer) {
                    Music.playCrystalHammer();
                }
            }, 50);
        }
    }

    return {
        showIntro: showIntroCutscene,
        showVictory: showVictoryCutscene,
        end: endCutscene,
        nextScene: nextScene
    };
})();