window.addEventListener('load', () => {
    // Hide controls after 7 seconds
    setTimeout(() => {
        const controls = document.querySelector('.controls');
        if (controls) {
            controls.style.transition = "opacity 1s ease";
            controls.style.opacity = "0";
            setTimeout(() => controls.style.display = "none", 1000);
        }
    }, 7000);
});

const Timer = (function() {
    let startTime = 0;
    let elapsedTime = 0;
    let timerInterval = null;
    let isRunning = false;
    let timerElement = null;

    function createTimeElement() {
        timerElement = document.createElement('div');
        timerElement.id = 'gameTimer';
        timerElement.className = 'timer';
        timerElement.textContent = 'Time: 0s';

        const gameArea = document.getElementById('gameArea');
        gameArea.appendChild(timerElement);
    }

    function updateTimer() {
        const currentTime = Math.floor((Date.now() - startTime) / 1000);
        elapsedTime = currentTime;
        if (timerElement) {
            // Format time as MM:SS
            const minutes = Math.floor(currentTime / 60);
            const seconds = currentTime % 60;
            timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    function start() {
        if (isRunning) return;

        isRunning = true;
        startTime = Date.now() - (elapsedTime * 1000);
        timerInterval = setInterval(updateTimer, 1000);
        updateTimer();
    }

    function pause() {
        if (!isRunning) return;

        isRunning = false;
        clearInterval(timerInterval);
    }

    function reset() {
        pause();
        elapsedTime = 0;
        if (timerElement) {
            timerElement.textContent = 'Time: 0s';
        }
    }

    function getElapsedTime() {
        return elapsedTime;
    }

    function init() {
        createTimeElement();
    }

    return {
        init,
        start,
        pause,
        reset,
        getElapsedTime,
        isRunning: function() { return isRunning; }
    };
})();
