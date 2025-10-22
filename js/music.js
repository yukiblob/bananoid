const Music = (function() {
    let audioContext = null;
    let isPlaying = false;
    let currentSequence = null;
    let masterGain = null;
    let volume = 0.05;
    let currentSection = 0;
    let sectionStartTime = 0;
    let isPaused = false;
    let pauseVolume = 0.025;

    const chordProgressions = {
        tropical: [
            { notes: [261.63, 329.63, 392.00 ], duration: 2 }, // C major (C4, E4, G4)
            { notes: [220.00, 261.63, 329.63 ], duration: 2 }, // A minor (A3, C4, E4)
            { notes: [174.61, 220.00, 261.63 ], duration: 2 }, // F major (F3, A3, C4)
            { notes: [196.00, 246.94, 293.66 ], duration: 2 } // G major (G3, B3, D4)
        ],
        crystalSection1: [
            { notes: [261.63, 329.63, 392.00], duration: 2 }, // C major
            { notes: [293.66, 369.99, 440.00], duration: 2 }, // D minor
            { notes: [329.63, 415.30, 493.88], duration: 2 }, // E minor
            { notes: [392.00, 493.88, 587.33], duration: 2 }  // G major
        ],
        crystalSection2: [
            { notes: [261.63, 311.13, 392.00], duration: 2 }, // C minor
            { notes: [277.18, 329.63, 415.30], duration: 2 }, // C# diminished
            { notes: [293.66, 349.23, 440.00], duration: 2 }, // D major
            { notes: [329.63, 392.00, 493.88], duration: 2 }  // E minor
        ],
        crystalSection3: [
            { notes: [329.63, 415.30, 493.88], duration: 2 }, // E minor
            { notes: [293.66, 369.99, 440.00], duration: 2 }, // D minor
            { notes: [261.63, 329.63, 392.00], duration: 2 }, // C major
            { notes: [392.00, 493.88, 587.33], duration: 2 }  // G major
        ],
        crystalSection4: [
            { notes: [349.23, 440.00, 523.25], duration: 1.5 }, // F major
            { notes: [392.00, 493.88, 587.33], duration: 1.5 }, // G major
            { notes: [440.00, 554.37, 659.25], duration: 1 },   // A minor
            { notes: [493.88, 587.33, 698.46], duration: 1 },   // B diminished
            { notes: [523.25, 659.25, 783.99], duration: 2 }    // C major high
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
        ],
        crystalSection1: [ // Main melody
            { note: 523.25, duration: 0.5 }, // C5
            { note: 587.33, duration: 0.5 }, // D5
            { note: 659.25, duration: 1.0 }, // E5
            { note: 523.25, duration: 0.5 }, // C5
            { note: 493.88, duration: 0.5 }, // B4
            { note: 440.00, duration: 1.0 }, // A4
            { note: 392.00, duration: 0.5 }, // G4
            { note: 440.00, duration: 0.5 }, // A4
            { note: 493.88, duration: 1.0 }  // B4
        ],
        crystalSection2: [ // Counter melody
            { note: 659.25, duration: 0.25 }, // E5
            { note: 698.46, duration: 0.25 }, // F5
            { note: 783.99, duration: 0.5 },  // G5
            { note: 659.25, duration: 0.25 }, // E5
            { note: 587.33, duration: 0.25 }, // D5
            { note: 523.25, duration: 0.75 }, // C5
            { note: 493.88, duration: 0.25 }, // B4
            { note: 523.25, duration: 0.5 }   // C5
        ],
        crystalSection3: [ // Arpeggio style
            { note: 392.00, duration: 0.25 }, // G4
            { note: 493.88, duration: 0.25 }, // B4
            { note: 587.33, duration: 0.25 }, // D5
            { note: 659.25, duration: 0.75 }, // E5
            { note: 587.33, duration: 0.25 }, // D5
            { note: 493.88, duration: 0.25 }, // B4
            { note: 392.00, duration: 0.5 },  // G4
            { note: 440.00, duration: 0.25 }, // A4
            { note: 523.25, duration: 0.75 }  // C5
        ],
        crystalSection4: [ // High intensity
            { note: 783.99, duration: 0.125 }, // G5
            { note: 880.00, duration: 0.125 }, // A5
            { note: 987.77, duration: 0.25 },  // B5
            { note: 880.00, duration: 0.125 }, // A5
            { note: 783.99, duration: 0.125 }, // G5
            { note: 698.46, duration: 0.25 },  // F5
            { note: 659.25, duration: 0.5 },   // E5
            { note: 587.33, duration: 0.25 },  // D5
            { note: 523.25, duration: 0.5 }    // C5
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
        ],
        crystalSection1: [ // Basic rock beat
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
        ],
        crystalSection2: [ // More syncopated
            { time: 0.0, type: 'kick' },
            { time: 0.25, type: 'hihat' },
            { time: 0.5, type: 'snare' },
            { time: 0.75, type: 'hihat' },
            { time: 1.0, type: 'kick' },
            { time: 1.25, type: 'hihat' },
            { time: 1.5, type: 'snare' },
            { time: 1.75, type: 'hihat' },
            { time: 2.0, type: 'kick' },
            { time: 2.25, type: 'snare' },
            { time: 2.5, type: 'hihat' },
            { time: 2.75, type: 'kick' },
            { time: 3.0, type: 'snare' },
            { time: 3.25, type: 'hihat' },
            { time: 3.5, type: 'kick' },
            { time: 3.75, type: 'hihat' }
        ],
        crystalSection3: [ // Double-time feel
            { time: 0.0, type: 'kick' },
            { time: 0.125, type: 'hihat' },
            { time: 0.25, type: 'snare' },
            { time: 0.375, type: 'hihat' },
            { time: 0.5, type: 'kick' },
            { time: 0.625, type: 'hihat' },
            { time: 0.75, type: 'snare' },
            { time: 0.875, type: 'hihat' },
            { time: 1.0, type: 'kick' },
            { time: 1.125, type: 'hihat' },
            { time: 1.25, type: 'snare' },
            { time: 1.375, type: 'hihat' },
            { time: 1.5, type: 'kick' },
            { time: 1.625, type: 'hihat' },
            { time: 1.75, type: 'snare' },
            { time: 1.875, type: 'hihat' }
        ],
        crystalSection4: [ // Intense build-up
            { time: 0.0, type: 'kick' },
            { time: 0.25, type: 'snare' },
            { time: 0.5, type: 'kick' },
            { time: 0.75, type: 'snare' },
            { time: 1.0, type: 'kick' },
            { time: 1.0, type: 'snare' }, // Double hit
            { time: 1.25, type: 'hihat' },
            { time: 1.5, type: 'kick' },
            { time: 1.5, type: 'snare' }, // Double hit
            { time: 1.75, type: 'hihat' },
            { time: 2.0, type: 'kick' },
            { time: 2.25, type: 'snare' },
            { time: 2.5, type: 'kick' },
            { time: 2.75, type: 'snare' },
            { time: 3.0, type: 'kick' },
            { time: 3.25, type: 'snare' },
            { time: 3.5, type: 'kick' },
            { time: 3.75, type: 'snare' }
        ]
    };

    const bassLines = {
        tropical: [
        { note: 65.41, duration: 2 }, // C2
        { note: 73.42, duration: 2 }, // D2  
        { note: 82.41, duration: 2 }, // E2
        { note: 98.00, duration: 2 }  // G2
        ],
        crystalSection1: [
            { note: 65.41, duration: 2 }, // C2
            { note: 73.42, duration: 2 }, // D2
            { note: 82.41, duration: 2 }, // E2
            { note: 98.00, duration: 2 }  // G2
        ],
        crystalSection2: [
            { note: 65.41, duration: 1 }, // C2
            { note: 69.30, duration: 1 }, // C#2
            { note: 73.42, duration: 1 }, // D2
            { note: 77.78, duration: 1 }, // D#2
            { note: 82.41, duration: 2 }, // E2
            { note: 87.31, duration: 2 }  // F2
        ],
        crystalSection3: [
            { note: 82.41, duration: 1.5 }, // E2
            { note: 73.42, duration: 1.5 }, // D2
            { note: 65.41, duration: 2 },   // C2
            { note: 98.00, duration: 3 }    // G2
        ],
        crystalSection4: [
            { note: 87.31, duration: 0.75 }, // F2
            { note: 98.00, duration: 0.75 }, // G2
            { note: 110.00, duration: 0.5 }, // A2
            { note: 116.54, duration: 0.5 }, // A#2
            { note: 130.81, duration: 2 }    // C3
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

    function createOscillator(frequency, type = 'sine', duration = 1, volumeScale = 1) {
        if (!audioContext) return null;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(masterGain);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        const now = audioContext.currentTime;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.8 * volumeScale, now + 0.02);
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
            createOscillator(note, type, duration, 0.6);
            createOscillator(note * 2, 'triangle', duration * 0.8, 0.4);
        });
    }

    function playBassNote(note, duration) {
        if (!audioContext) return;
        createOscillator(note, 'sine', duration, 0.7);
        createOscillator(note * 2, 'triangle', duration * 0.8, 0.4);
    }

    function playMelodyNote(note, duration, type = 'square') {
        if (!audioContext) return;

        const oscillator = createOscillator(note, type, duration, 0.9);

        if (oscillator) {
            const vibrato = audioContext.createOscillator();
            const vibratoGain = audioContext.createGain();

            vibrato.connect(vibratoGain);
            vibratoGain.connect(oscillator.frequency);

            vibrato.type = 'sine';
            vibrato.frequency.value = 5 + Math.random() * 2;
            vibratoGain.gain.value = 1.5 + Math.random() * 1;

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

    function playCrystalHammer() {
        if (!audioContext) {
            console.warn('Music: no audio context available');
            return;
        }

        if (isPlaying) {
            console.log('Music: already playing');
            return;
        }

        console.log('Starting Crystal Hammer');
        isPlaying = true;
        currentSection = 0;
        sectionStartTime = audioContext.currentTime;

        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('Music: Audio context resumed');
                startCrystalMusicLoop();
            }).catch(error => {
                console.warn('Music: Failed to resume audio context:', error);
                isPlaying = false;
            });
        } else {
            startCrystalMusicLoop();
        }
    }

    function startCrystalMusicLoop() {
        if (!audioContext || !isPlaying) return;

        let currentTime = audioContext.currentTime;
        const sectionDuration = 16;
        const totalSections = 4;

        function scheduleLoop() {
            if (!isPlaying || !audioContext) return;

            const startTime = currentTime;
            const sectionName = `crystalSection${(currentSection % totalSections) +1}`;

            console.log(`Music: Playing section ${sectionName}`);

            const chords = chordProgressions[sectionName];
            chords.forEach((chord, index) => {
                const chordTime = startTime + (index * 4);
                setTimeout(() => {
                    if (isPlaying) {
                        createChord(chord.notes, chord.duration, 'sawtooth');
                    }
                }, (chordTime - audioContext.currentTime) * 1000);
            });

            const bass = bassLines[sectionName];
            bass.forEach((bassNote, index) => {
                const bassDuration = sectionDuration / bass.length;
                const bassTime = startTime + (index * bassDuration);
                setTimeout(() => {
                    if (isPlaying) {
                        playBassNote(bassNote.note, bassNote.duration);
                    }
                }, (bassTime - audioContext.currentTime) * 1000);
            });

            const melody = melodies[sectionName];
            let melodyTime = startTime;
            melody.forEach(melodyNote => {
                setTimeout(() => {
                    if (isPlaying) {
                        playMelodyNote(melodyNote.note, melodyNote.duration, 'square');
                    }
                }, (melodyTime - audioContext.currentTime) * 1000);
                melodyTime += melodyNote.duration;
            });

            const drums = drumPatterns[sectionName];
            drums.forEach(drum => {
                const drumTime = startTime + drum.time;
                setTimeout(() => {
                    if (isPlaying && audioContext) {
                        createDrumSound(drum.type, drumTime - audioContext.currentTime);
                    }
                }, (drumTime - audioContext.currentTime) * 1000);
            });

            currentTime += sectionDuration;
            currentSection++;

            currentSequence = setTimeout(scheduleLoop, (sectionDuration * 1000) - 50);
        }

        scheduleLoop();
        console.log('Music: Crystal Hammer started');
    }

    function setPaused(paused) {
        isPaused = paused;
        if (masterGain) {
            masterGain.gain.value = paused ? pauseVolume : volume;
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

            // Schedule bass
            const tropicalBass = bassLines.tropical;
            tropicalBass.forEach((bassNote, index) => {
                const bassTime = startTime + (index * 2);
                setTimeout(() => {
                    if (isPlaying) {
                        playBassNote(bassNote.note, bassNote.duration);
                    }
                }, (bassTime - audioContext.currentTime) * 1000);
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
                    if (isPlaying && audioContext) {
                        createDrumSound(drum.type, drumTime - audioContext.currentTime);
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
        currentSection = 0;
    }

    function setVolume(newVolume) {
        volume = Math.max(0, Math.min(1, newVolume));
        pauseVolume = volume * 0.5;
        if (masterGain && !isPaused) {
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
        playCrystalHammer: playCrystalHammer,
        stop: stop,
        setVolume: setVolume,
        setPaused: setPaused,
        resume: resume,
        isPlaying: function() { return isPlaying; }
    };
})();