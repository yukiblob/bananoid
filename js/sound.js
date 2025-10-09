const SoundManager = (function() {
    let audioContext = null;
    let isAudioEnabled = true;
    let isInitialized = false;
    let isAudioResumed = false;

    function init() {
        if (isInitialized) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;

            if (AudioContextClass) {
                audioContext = new AudioContextClass();
                console.log('Audio context initialized')
            } else {
                console.warn('Web Audio API not supported');
                isAudioEnabled = false;
                return;
            }

            // this handles browser autoplay policies
            const resumeAudio = () => {
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume().then(() => {
                        console.log('Audio context resumed successfully!');
                        isAudioResumed = true;
                    }).catch(error => {
                        console.warn('Failed to resume audio:', error);
                    });
                }
            };

            const interactionEvents = ['click', 'keydown', 'touchstart', 'mousedown'];
            interactionEvents.forEach(event => {
                document.addEventListener(event, resumeAudio, { once: true }); // Only need one interaction
            });

            isInitialized = true;
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            isAudioEnabled = false;
            isInitialized = false;
        }
    }

    function ensureAudioContext() {
        if (isAudioEnabled || !audioContext) return false;

        if (audioContext.state === 'closed') {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        return true;
    }

    function Beep(frequency, duration, volume = 0.1, type = 'sine') {
        if (!ensureAudioContext()) return;

        if (!isAudioResumed && audioContext.state === 'suspended') {
            console.log('Sound blocked: waiting for user interaction');
            return;
        }

        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            const now = audioContext.currentTime;

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch (error) {
            console.warn('Error creating beep:', error);
        }
    }

    function Tone(frequency, duration, volume = 0.1) {
        if (!ensureAudioContext()) return;

        if (!isAudioResumed && audioContext.state === 'suspended') {
            console.log('Sound blocked: waiting for user interaction');
            return;
        }

        try {
            const osc1 = audioContext.createOscillator();
            const osc2 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            osc1.type = 'sine';
            osc2.type = 'triangle';
            osc1.frequency.value = frequency;
            osc2.frequency.value = frequency * 2;

            const now = audioContext.currentTime;

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume, now + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + duration);
            osc2.stop(now + duration);
        } catch (error) {
            console.warn('Error creating tone:', error);
        }
    }

    function playWallHit() {
        Beep(400, 0.08, 0.08, 'square');
    }

    function playPaddleHit() {
        Tone(300, 0.12, 0.1);
    }

    function playBrickHit() {
        Beep(600, 0.06, 0.1, 'sawtooth');
    }

    function playPowerup() {
        if (!ensureAudioContext()) return;

        if (!isAudioResumed && audioContext.state === 'suspended') {
            console.log('Sound blocked: waiting for user interaction');
            return;
        }

        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.3);

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.warn('Error playing powerup sound:', error);
        }
    }

    function playLifeLost() {
        if (!ensureAudioContext()) return;

        if (!isAudioResumed && audioContext.state === 'suspended') {
            console.log('Sound blocked: waiting for user interaction');
            return;
        }

        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(100, audioContext.currentTime + 0.5);

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Error playing life lost sound:', error);
        }
    }

    function playGameStart() {
        Tone(400, 0.1, 0.1);
        setTimeout(() => Tone(500, 0.1, 0.1), 120);
        setTimeout(() => Tone(600, 0.2, 0.1), 240);
    }

    return {
        init: init,
        playWallHit: playWallHit,
        playPaddleHit: playPaddleHit,
        playBrickHit: playBrickHit,
        playPowerup: playPowerup,
        playLifeLost: playLifeLost,
        playGameStart: playGameStart,
        setEnabled: function(enabled) {
            isAudioEnabled = enabled;
        },
        isEnabled: function() {
            return isAudioEnabled && audioContext !== null;
        },
        resume: function() {
            if (audioContext && audioContext.state === 'suspended') {
                return audioContext.resume();
            }
            return Promise.resolve();
        }
    };
})();