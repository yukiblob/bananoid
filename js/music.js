const Music = (function() {
    let audioContext = null;
    let isPlaying = false;
    let currentSequence = null;
    let masterGain = null;
    let volume = 0.05;

    const chordProgressions = {
        tropical: [
            { notes: [261.63, 329.63, 392.00 ], duration: 2 }, // C major (C4, E4, G4)
            { notes: [220.00, 261.63, 329.63 ], duration: 2 }, // A minor (A3, C4, E4)
            { notes: [174.61, 220.00, 261.63 ], duration: 2 }, // F major (F3, A3, C4)
            { notes: [196.00, 246.94, 293.66 ], duration: 2 } // G major (G3, B3, D4)
        ]
    };

    const melodies = {
        tropical: [
            { note: 523.25, duration: 0.5 }, // C5
            { note: 587.33, duration: 0.5 }, // D5
            { note: 659.25, duration: 1.0 }, // E5
            { note: 523.25, duration: 0.5 }, // C5
            { note: 493.88, duration: 0.5 }, // B4
            { note: 440.00, duration: 1.0 }, // A4
            { note: 392.00, duration: 0.5 }, // G4
            { note: 440.00, duration: 0.5 }, // A4
            { note: 493.88, duration: 1.0 } // B4
        ]
    };

    const drumPatterns = {
        tropical: [
            { time: 0.0, type: 'kick' },
            { time: 0.5, type: 'snare' },
            { time: 1.0, type: 'kick' },
            { time: 1.5, type: 'snare' },
            { time: 2.0, type: 'kick' },
            { time: 2.25, type: 'hihat' },
            { time: 2.5, type: 'snare' },
            { time: 2.75, type: 'hihat' },
            { time: 3.0, type: 'kick' },
            { time: 3.5, type: 'snare' }
        ]
    };

    function init() {
        if (audioContext) return;

        try {
            // Try to use SoundManager's audio context if available
            if (typeof SoundManager !== 'undefined' && SoundManager.getState) {
                console.log('Music: Attempting to use SoundManager audio context');
            }
            
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioContext = new AudioContextClass();
                masterGain = audioContext.createGain();
                masterGain.connect(audioContext.destination);
                masterGain.gain.value = volume;
                console.log('Music module initialized with volume:', volume);
            }
        } catch (error) {
            console.warn('Music module: Web Audio API not supported', error);
        }
    }

    function createOscillator(frequency, type = 'sine', duration = 1) {
        if (!audioContext) return null;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(masterGain);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        const now = audioContext.currentTime;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.8, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);

        oscillator.onended = () => {
            try {
                oscillator.disconnect();
                gainNode.disconnect();
            } catch (e) {
                // Ignore
            }
        };

        return oscillator;
    }

    function createChord(notes, duration, type = 'sawtooth') {
        if (!audioContext) return;

        notes.forEach(note => {
            createOscillator(note, type, duration);

            createOscillator(note * 2, 'triangle', duration * 0.8);
        });
    }

    function playMelodyNote(note, duration, type = 'square') {
        if (!audioContext) return;

        const oscillator = createOscillator(note, type, duration);

        if (oscillator) {
            const vibrato = audioContext.createOscillator();
            const vibratoGain = audioContext.createGain();

            vibrato.connect(vibratoGain);
            vibratoGain.connect(oscillator.frequency);

            vibrato.type = 'sine';
            vibrato.frequency.value = 5;
            vibratoGain.gain.value = 2;

            vibrato.start();
            vibrato.stop(audioContext.currentTime + duration);
        }
    }

    function createDrumSound(type, time) {
        if (!audioContext) return;

        const now = audioContext.currentTime + time;

        switch (type) {
            case 'kick':
                const kickOsc = audioContext.createOscillator();
                const kickGain = audioContext.createGain();

                kickOsc.connect(kickGain);
                kickGain.connect(masterGain);

                kickOsc.frequency.setValueAtTime(150, now);
                kickOsc.frequency.exponentialRampToValueAtTime(0.001, now + 0.5);

                kickGain.gain.setValueAtTime(1, now);
                kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

                kickOsc.start(now);
                kickOsc.stop(now + 0.5);
                break;

            case 'snare':
                const noise = audioContext.createBufferSource();
                const noiseGain = audioContext.createGain();
                const filter = audioContext.createBiquadFilter();

                const bufferSize = audioContext.sampleRate * 0.1;
                const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                const data = buffer.getChannelData(0);

                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }

                noise.buffer = buffer;
                noise.connect(filter);
                filter.connect(noiseGain);
                noiseGain.connect(masterGain);

                filter.frequency.setValueAtTime(1000, now);
                noiseGain.gain.setValueAtTime(0.5, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

                noise.start(now);
                noise.stop(now + 0.3);
                break;

            case 'hihat':
                const hatOsc = audioContext.createOscillator();
                const hatGain = audioContext.createGain();
                const hatFilter = audioContext.createBiquadFilter();

                hatOsc.connect(hatFilter);
                hatFilter.connect(hatGain);
                hatGain.connect(masterGain);

                hatOsc.type = 'square';
                hatOsc.frequency.setValueAtTime(1000, now);
                hatFilter.frequency.setValueAtTime(5000, now);
                hatGain.gain.setValueAtTime(0.3, now);
                hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

                hatOsc.start(now);
                hatOsc.stop(now + 0.1);
                break;
        }
    }

    function playTropicalTheme() {
        if (!audioContext) {
            console.warn('Music: No audio context available');
            return;
        }

        if (isPlaying) {
            console.log('Music: Already playing');
            return;
        }

        console.log('Music: Starting tropical theme');
        isPlaying = true;
        
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('Music: Audio context resumed');
                startMusicLoop();
            }).catch(error => {
                console.warn('Music: Failed to resume audio context:', error);
                isPlaying = false;
            });
        } else {
            startMusicLoop();
        }
    }

    function startMusicLoop() {
        if (!audioContext || !isPlaying) return;

        let currentTime = audioContext.currentTime;
        const loopDuration = 8;

        function scheduleLoop() {
            if (!isPlaying || !audioContext) return;

            const startTime = currentTime;

            // Schedule chords
            chordProgressions.tropical.forEach((chord, index) => {
                const chordTime = startTime + (index * 2);
                setTimeout(() => {
                    if (isPlaying) {
                        createChord(chord.notes, chord.duration, 'sawtooth');
                    }
                }, (chordTime - audioContext.currentTime) * 1000);
            });

            // Schedule melody
            let melodyTime = startTime;
            melodies.tropical.forEach(melodyNote => {
                setTimeout(() => {
                    if (isPlaying) {
                        playMelodyNote(melodyNote.note, melodyNote.duration, 'square');
                    }
                }, (melodyTime - audioContext.currentTime) * 1000);
                melodyTime += melodyNote.duration;
            });

            // Schedule drums
            drumPatterns.tropical.forEach(drum => {
                const drumTime = startTime + drum.time;
                setTimeout(() => {
                    if (isPlaying) {
                        createDrumSound(drum.type, 0);
                    }
                }, (drumTime - audioContext.currentTime) * 1000);
            });

            currentTime += loopDuration;

            currentSequence = setTimeout(scheduleLoop, (loopDuration * 1000) - 50);
        }

        scheduleLoop();
        console.log('Music: Music loop started');
    }

    function stop() {
        isPlaying = false;
        if (currentSequence) {
            clearTimeout(currentSequence);
            currentSequence = null;
        }
    }

    function setVolume(newVolume) {
        volume = Math.max(0, Math.min(1, newVolume));
        if (masterGain) {
            masterGain.gain.value = volume;
        }
    }

    function resume() {
        if (audioContext && audioContext.state === 'suspended') {
            return audioContext.resume();
        }
        return Promise.resolve();
    }

    return {
        init: init,
        playTropicalTheme: playTropicalTheme,
        stop: stop,
        setVolume: setVolume,
        resume: resume,
        isPlaying: function() { return isPlaying; }
    };
})();