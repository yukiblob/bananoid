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
