const Score = (function() {
    let score = 0;

    function init() {
        score = 0;
        updateUI();
    }

    function reset() {
        score = 0;
        updateUI();
    }

    function add(points) {
        score += points;
        updateUI();
    }

    function updateUI() {
        const scoreEl = document.getElementById('score');
        if (scoreEl) {
            scoreEl.textContent = `Score: ${score}`;
        }
    }

    function getScore() {
        return score;
    }

    return {
        init,
        reset,
        add,
        getScore
    };
})();
