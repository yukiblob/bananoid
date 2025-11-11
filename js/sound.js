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

            const handleUserInteraction = (e) => {
                const isValidGesture =
                    e.type === 'click' ||
                    e.type === 'touchstart' ||
                    e.type === 'mousedown' ||
                    (e.type === 'keydown' && (
                        e.key === ' ' ||
                        e.key === 'Enter' ||
                        e.key === 'ArrowUp' ||
                        e.key === 'ArrowDown' ||
                        e.key === 'ArrowLeft' ||
                        e.key === 'ArrowRight' ||
                        (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key))
                    ));

                if (isValidGesture && audioContext && audioContext.state === 'suspended') {
                    audioContext.resume().then(() => {
                        console.log('Audio context resumed successfully via:', e.type, e.key);
                        isAudioResumed = true;
                    }).catch(error => {
                        console.warn('Failed to resume audio:', error);
                    });
                }
            };

            const interactionEvents = ['click', 'keydown', 'touchstart', 'mousedown'];
            interactionEvents.forEach(event => {
                window.addEventListener(event, handleUserInteraction, {
                    once: false,
                    capture: true
                });
            });

            isInitialized = true;
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            isAudioEnabled = false;
            isInitialized = false;
        }
    }

    function canPlaySound() {
        return audioContext && audioContext.state === 'running';
    }

    function Beep(frequency, duration, volume = 0.1, type = 'sine') {
        if (!canPlaySound()) return;

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

            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
            };
        } catch (error) {
            console.warn('Error creating beep:', error);
        }
    }

    function Tone(frequency, duration, volume = 0.1) {
        if (!canPlaySound()) return;

        try {
            const osc1 = audioContext.createOscillator();
            const osc2 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            osc1.type = 'sine';
            osc2.type = 'triangle';
            osc1.frequency.value = frequency;
            osc2.frequency.value = frequency * 2;

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(audioContext.destination);

            const now = audioContext.currentTime;

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume, now + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + duration);
            osc2.stop(now + duration);

            const cleanUp = () => {
                osc1.disconnect();
                osc2.disconnect();
                gainNode.disconnect();
            };

            osc1.onended = cleanUp;
            osc2.onended = cleanUp;
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

    function playMenuNavigate() {
        Beep(600, 0.06, 0.08, 'sine');
    }

    function playMenuSelect() {
        Tone(800, 0.1, 0.12);
    }

    function playBulletFire() {
        if (!canPlaySound()) return;

        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.08);

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.08);

            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
            };
        } catch (error) {
            console.warn('Error playing bullet fire sound:', error);
            Beep(800, 0.05, 0.1, 'square');
        }
    }

    function playPowerup() {
        if (!canPlaySound()) return;

        try {
            const osc1 = audioContext.createOscillator();
            const osc2 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(audioContext.destination);

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(400, audioContext.currentTime);
            osc1.frequency.linearRampToValueAtTime(1000, audioContext.currentTime + 0.3);

            osc2.type = 'square';
            osc2.frequency.setValueAtTime(600, audioContext.currentTime);
            osc2.frequency.linearRampToValueAtTime(1200, audioContext.currentTime + 0.3);

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);

            osc1.start();
            osc2.start();
            osc1.stop(audioContext.currentTime + 0.4);
            osc2.stop(audioContext.currentTime + 0.4);

            const cleanUp = () => {
                osc1.disconnect();
                osc2.disconnect();
                gainNode.disconnect();
            };

            osc1.onended = cleanUp;
            osc2.onended = cleanUp;
        } catch (error) {
            console.warn('Error playing powerup sound:', error);
            Beep(600, 0.2, 0.2, 'sine');
        }
    }

    function playLifeLost() {
        if (!canPlaySound()) return;

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

            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
            };
        } catch (error) {
            console.warn('Error playing life lost sound:', error);
        }
    }

    function playLaugh() {
        if (!canPlaySound()) return;

        try {
            const osc1 = audioContext.createOscillator();
            const osc2 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioContext.destination);

            filter.type = 'lowpass';
            filter.frequency.value = 800;
            filter.Q.value = 5;

            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(180, audioContext.currentTime);

            osc2.type = 'square';
            osc2.frequency.setValueAtTime(90, audioContext.currentTime);

            const now = audioContext.currentTime;

            const laughPattern = [
                { start: 0.0, end: 0.15 },
                { start: 0.3, end: 0.45 },
                { start: 0.6, end: 0.75 }
            ];

            laughPattern.forEach((timing, index) => {
                const startTime = now + timing.start;
                const endTime = now + timing.end;

                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
                gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

                const pitchBend = 180 + (index * 10);
                osc1.frequency.setValueAtTime(pitchBend, startTime);
                osc1.frequency.linearRampToValueAtTime(pitchBend - 30, endTime);
            });

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.9);
            osc2.stop(now + 0.9);

            const cleanUp = () => {
                osc1.disconnect();
                osc2.disconnect();
                filter.disconnect();
                gainNode.disconnect();
            };

            osc1.onended = cleanUp;
            osc2.onended = cleanUp;
        } catch (error) {
            console.warn('Error playing laugh:', error);
            // Fallback: simple triple beep
            Beep(180, 0.15, 0.15, 'sawtooth');
            setTimeout(() => Beep(180, 0.15, 0.15, 'sawtooth'), 300);
            setTimeout(() => Beep(180, 0.15, 0.15, 'sawtooth'), 600);
        }
    }

    function playGameStart() {
        Tone(400, 0.1, 0.1);
        setTimeout(() => Tone(500, 0.1, 0.1), 120);
        setTimeout(() => Tone(600, 0.2, 0.1), 240);
    }

    function forceResume() {
        if (audioContext && audioContext.state === 'suspended') {
            return audioContext.resume().then(() => {
                console.log('Audio context force-resumed');
                isAudioResumed = true;
            });
        }
        return Promise.resolve();
    }

    return {
        init: init,
        playWallHit: playWallHit,
        playPaddleHit: playPaddleHit,
        playBrickHit: playBrickHit,
        playPowerup: playPowerup,
        playLifeLost: playLifeLost,
        playGameStart: playGameStart,
        playMenuNavigate: playMenuNavigate,
        playMenuSelect: playMenuSelect,
        playBulletFire: playBulletFire,
        playLaugh: playLaugh,
        setEnabled: function(enabled) {
            isAudioEnabled = enabled;
        },
        isEnabled: function() {
            return isAudioEnabled && audioContext !== null;
        },
        resume: forceResume,
        getState: function() {
            return audioContext ? audioContext.state : 'no-context';
        }
    };
})();
