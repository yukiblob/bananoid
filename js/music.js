const Music = (function() {
    let audioContext = null;
    let isPlaying = false;
    let currentSequence = null;
    let masterGain = null;
    let volume = 0.04;
    let isPaused = false;
    let pauseVolume = 0.02;
    let activeLayers = new Set();

    let scheduledTimeouts = new Set();
    let activeOscillators = new Set();
    let nextScheduledTime = 0;

    const chordProgressions = {
        tropical: [
            { notes: [261.63, 329.63, 392.00], duration: 2 }, // C major (C4, E4, G4)
            { notes: [220.00, 261.63, 329.63], duration: 2 }, // A minor (A3, C4, E4)
            { notes: [174.61, 220.00, 261.63], duration: 2 }, // F major (F3, A3, C4)
            { notes: [196.00, 246.94, 293.66], duration: 2 } // G major (G3, B3, D4)
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

    const bassLines = {
        tropical: [
            { note: 65.41, duration: 2 }, // C2
            { note: 73.42, duration: 2 }, // D2  
            { note: 82.41, duration: 2 }, // E2
            { note: 98.00, duration: 2 }  // G2
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

        activeOscillators.add(oscillator);

        oscillator.onended = () => {
            activeOscillators.delete(oscillator);
            try {
                oscillator.disconnect();
                gainNode.disconnect();
            } catch (e) {
                // Ignore
            }
        };

        return oscillator;
    }

    function createPianoOscillator(frequency, duration, volumeScale = 1) {
        if (!audioContext) return null;

        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const osc3 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        activeOscillators.add(osc1);
        activeOscillators.add(osc2);
        activeOscillators.add(osc3);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc3.connect(gainNode);
        gainNode.connect(filter);
        filter.connect(masterGain);

        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc3.type = 'sawtooth';

        osc1.frequency.value = frequency;
        osc2.frequency.value = frequency * 2.01;
        osc3.frequency.value = frequency * 3.02;

        filter.type = 'lowpass';
        filter.frequency.value = 2000 + (frequency * 0.5);
        filter.Q.value = 1.0;

        const now = audioContext.currentTime;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.6 * volumeScale, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.3 * volumeScale, now + duration * 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
        osc3.stop(now + duration);

        const cleanup = () => {
            activeOscillators.delete(osc1);
            activeOscillators.delete(osc2);
            activeOscillators.delete(osc3);
            try {
                osc1.disconnect();
                osc2.disconnect();
                osc3.disconnect();
                gainNode.disconnect();
                filter.disconnect();
            } catch (e) {
                // Ignore
            }
        };

        osc1.onended = cleanup;
        return { osc1, osc2, osc3, gainNode, filter };
    }

    function playArcadeMelody(note, duration, type = 'arcade') {
        if (!audioContext) return;

        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const osc3 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc3.connect(gainNode);
        gainNode.connect(filter);
        filter.connect(masterGain);

        lfo.connect(lfoGain);
        lfoGain.connect(osc1.detune);
        lfoGain.connect(osc2.detune);

        osc1.type = 'square';
        osc2.type = 'sawtooth';
        osc3.type = 'triangle';

        osc1.frequency.value = note;
        osc2.frequency.value = note * 1.005;
        osc3.frequency.value = note * 0.995;

        lfo.frequency.value = 0.3 + Math.random() * 0.5;
        lfoGain.gain.value = 5 + Math.random() * 5;

        filter.type = 'lowpass';
        filter.frequency.value = 2000 + (note * 0.8);
        filter.Q.value = 0.7;

        const now = audioContext.currentTime;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.8, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.6, now + duration * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        lfo.start(now);

        osc1.stop(now + duration);
        osc2.stop(now + duration);
        osc3.stop(now + duration);
        lfo.stop(now + duration);

        activeOscillators.add(osc1);
        activeOscillators.add(osc2);
        activeOscillators.add(osc3);
        activeOscillators.add(lfo);

        const cleanup = () => {
            activeOscillators.delete(osc1);
            activeOscillators.delete(osc2);
            activeOscillators.delete(osc3);
            activeOscillators.delete(lfo);
            try {
                osc1.disconnect();
                osc2.disconnect();
                osc3.disconnect();
                gainNode.disconnect();
                filter.disconnect();
                lfo.disconnect();
                lfoGain.disconnect();
            } catch (e) {
                // Ignore
            }
        };

        osc1.onended = cleanup;
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
        
        createPianoOscillator(note, duration, 0.6);

        const subOsc = audioContext.createOscillator();
        const subGain = audioContext.createGain();

        subOsc.connect(subGain);
        subGain.connect(masterGain);

        subOsc.type = 'sine';
        subOsc.frequency.value = note * 0.5;

        const now = audioContext.currentTime;
        subGain.gain.setValueAtTime(0, now);
        subGain.gain.linearRampToValueAtTime(0.3, now + 0.1);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        subOsc.start(now);
        subOsc.stop(now + duration);
    }

    function playMelodyNote(note, duration, type = 'square') {
        if (!audioContext) return;

        if (type === 'piano') {
            createPianoOscillator(note, duration, 0.8);
        } else {
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
    }

    function createDrumSound(type, time) {
        if (!audioContext) return;

        const now = audioContext.currentTime + time;

        switch (type) {
            case 'kick':
                const kickOsc = audioContext.createOscillator();
                const kickGain = audioContext.createGain();

                activeOscillators.add(kickOsc);

                kickOsc.onended = () => {
                    activeOscillators.delete(kickOsc);
                    try {
                        kickOsc.disconnect();
                        kickGain.disconnect();
                    } catch (e) {
                        // Ignore
                    }
                };

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

                activeOscillators.add(noise);
                noise.onended = () => activeOscillators.delete(noise);
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

                activeOscillators.add(hatOsc);
                hatOsc.onended = () => activeOscillators.delete(hatOsc);
                break;
        }
    }

    function playTropicalTheme() {
        if (!audioContext) {
            console.warn('Music: No audio context available');
            return;
        }

        if (isPlaying) {
            stop();
        }

        console.log('Music: Starting tropical theme');
        isPlaying = true;

        if (masterGain) {
            const now = audioContext.currentTime;
            masterGain.gain.cancelScheduledValues(now);
            masterGain.gain.setValueAtTime(volume, now);
        }

        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('Music: Audio context resumed');
                startTropicalMusicLoop();
            }).catch(error => {
                console.warn('Music: Failed to resume audio context:', error);
                isPlaying = false;
            });
        } else {
            startTropicalMusicLoop();
        }
    }

    function startTropicalMusicLoop() {
        if (!audioContext || !isPlaying) return;

        let nextScheduleTime = audioContext.currentTime;
        const loopDuration = 8;

        function scheduleLoop() {
            if (!isPlaying || !audioContext) return;

            const startTime = nextScheduleTime;

            // Schedule chords
            chordProgressions.tropical.forEach((chord, index) => {
                const chordTime = startTime + (index * 2);
                const timeoutId  = setTimeout(() => {
                    scheduledTimeouts.delete(timeoutId);
                    if (isPlaying) {
                        createChord(chord.notes, chord.duration, 'sawtooth');
                    }
                }, (chordTime - audioContext.currentTime) * 1000);
                scheduledTimeouts.add(timeoutId);
            });

            // Schedule bass
            const tropicalBass = bassLines.tropical;
            tropicalBass.forEach((bassNote, index) => {
                const bassTime = startTime + (index * 2);
                const timeoutId = setTimeout(() => {
                    scheduledTimeouts.delete(timeoutId)
                    if (isPlaying) {
                        playBassNote(bassNote.note, bassNote.duration);
                    }
                }, (bassTime - audioContext.currentTime) * 1000);
                scheduledTimeouts.add(timeoutId);
            });

            // Schedule melody
            let melodyTime = startTime;
            melodies.tropical.forEach(melodyNote => {
                const timeoutId = setTimeout(() => {
                    scheduledTimeouts.delete(timeoutId);
                    if (isPlaying) {
                        playMelodyNote(melodyNote.note, melodyNote.duration, 'square');
                    }
                }, (melodyTime - audioContext.currentTime) * 1000);
                melodyTime += melodyNote.duration;
                scheduledTimeouts.add(timeoutId);
            });

            // Schedule drums
            drumPatterns.tropical.forEach(drum => {
                const drumTime = startTime + drum.time;
                const timeoutId = setTimeout(() => {
                    if (isPlaying && audioContext) {
                        createDrumSound(drum.type, drumTime - audioContext.currentTime);
                    }
                }, (drumTime - audioContext.currentTime) * 1000);
                scheduledTimeouts.add(timeoutId);
            });

            nextScheduleTime = startTime + loopDuration;
            const timeUntilNext = (nextScheduleTime - audioContext.currentTime) * 1000;

            if (timeUntilNext > 10) {
                currentSequence = setTimeout(scheduleLoop, timeUntilNext - 10);
                scheduledTimeouts.add(currentSequence);
            } else {
                currentSequence = setTimeout(scheduleLoop, 10);
                scheduledTimeouts.add(currentSequence);
            }
        }

        scheduleLoop();
        console.log('Music: Music loop started');
    }

    function playCrystalHammer() {
        if (!audioContext) {
            console.warn('Music: no audio context available');
            return;
        }

        if (isPlaying) {
            stop();
        }

        console.log('Starting Crystal Hammer');
        isPlaying = true;

        if (masterGain) {
            const now = audioContext.currentTime;
            masterGain.gain.cancelScheduledValues(now);
            masterGain.gain.setValueAtTime(volume, now);
        }

        activeLayers = new Set(['foundation'])

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

        const foundationDuration = 8;

        function scheduleCrystalFoundation() {
            if (!isPlaying || !audioContext) return;

            const startTime = audioContext.currentTime;

            if (activeLayers.has('foundation')) {
                scheduleLayer(startTime, 'foundation');
            }

            activeLayers.forEach(layer => {
                if (layer !== 'foundation') {
                    scheduleLayer(startTime, layer);
                }
            });

            currentSequence = setTimeout(scheduleCrystalFoundation, foundationDuration * 1000);
            scheduledTimeouts.add(currentSequence);
        }
        scheduleCrystalFoundation();
        scheduleLayerProgression();
    }

    function scheduleLayerProgression() {
        if (!isPlaying) return;

        const progression = [
            { time: 0, layers: ['foundation'] },
            { time: 8, layers: ['foundation', 'bass'] },
            { time: 16, layers: ['foundation', 'bass', 'arpeggio'] },
            { time: 24, layers: ['foundation', 'bass', 'lead'] },
            { time: 32, layers: ['foundation', 'bass', 'arpeggio', 'lead'] },
            { time: 40, layers: ['foundation'] },
            { time: 44, layers: ['foundation', 'bass', 'arpeggio', 'lead'] }
        ];

        const totalTime = 52;

        progression.forEach(({ time, layers }) => {
            const timeoutId = setTimeout(() => {
                scheduledTimeouts.delete(timeoutId);
                if (isPlaying) {
                    activeLayers = new Set(layers);
                    console.log('Music: layers changed to:', Array.from(activeLayers));
                }
            }, time * 1000);
            scheduledTimeouts.add(timeoutId)
        });

        const loopTimeoutId = setTimeout(() => {
            scheduledTimeouts.delete(loopTimeoutId);
            if (isPlaying) {
                console.log('Music: restarting loop');
                scheduleLayerProgression();
            }
        }, totalTime * 1000);
        scheduledTimeouts.add(loopTimeoutId);
    }

    function scheduleLayer(startTime, layerType) {
        switch (layerType) {
            case 'foundation':
                scheduleFoundationMelody(startTime);
                scheduleFoundationDrums(startTime);
                break;
            case 'bass':
                scheduleBassLayer(startTime);
                break;
            case 'arpeggio':
                scheduleArpeggioLayer(startTime);
                break;
            case 'lead':
                scheduleLeadLayer(startTime);
                break;
        }
    }

    function scheduleFoundationMelody(startTime) {
        const section1 = [
            { note: 659.25, duration: 0.125 }, // E5
            { note: 659.25, duration: 0.125 }, // E5
            { note: 587.33, duration: 0.25 },  // D5
            { note: 659.25, duration: 0.25 },  // E5
            { note: 587.33, duration: 0.125 }, // D5
            { note: 659.25, duration: 0.25 },  // E5
            { note: 659.25, duration: 0.125 }, // E5
            { note: 587.33, duration: 0.25 },  // D5
            { note: 659.25, duration: 0.25 },  // E5
            { note: 523.25, duration: 0.25 }   // C5
        ];

        const section2 = [
            { note: 587.33, duration: 0.25 },  // D5
            { note: 523.25, duration: 0.25 },  // C5
            { note: 587.33, duration: 0.125 }, // D5
            { note: 659.25, duration: 0.125 }, // E5
            { note: 523.25, duration: 0.125 }, // C5
            { note: 587.33, duration: 0.875 }, // D5
            { note: 523.25, duration: 0.125 }, // C5
            { note: 587.33, duration: 0.125 }  // D5
        ];

        const section3 = [
            { note: 698.46, duration: 0.25 },  // F5
            { note: 659.25, duration: 0.25 },  // E5
            { note: 523.25, duration: 0.25 },  // C5
            { note: 349.23, duration: 1.0 },  // F4 (lower octave)
            { note: 523.25, duration: 0.125 }, // C5
            { note: 587.33, duration: 0.125 }  // D5
        ];

        scheduleFoundationPads(startTime);

        const foundationMelody = [
            ...section1,
            ...section2,
            ...section1,
            ...section3
        ];

        let melodyTime = startTime;
        foundationMelody.forEach(melodyNote => {
            const timeoutId = setTimeout(() => {
                scheduledTimeouts.delete(timeoutId);
                if (isPlaying) {
                    playArcadeMelody(melodyNote.note, melodyNote.duration, 'piano');
                }
            }, (melodyTime - audioContext.currentTime) * 1000);
            melodyTime += melodyNote.duration;
            scheduledTimeouts.add(timeoutId);
        });
    }

    function scheduleFoundationPads(startTime) {
        if (!audioContext || !isPlaying) return;

        const section1Pads = [
            { notes: [130.81, 196.00, 293.66], duration: 2.0 }, // C3, G3, D4
            { notes: [261.63, 392.00, 523.25], duration: 2.0 }  // C4, G4, C5
        ];

        const section2Pads = [
            { notes: [98.00, 146.83], duration: 2.0 },  // G2, D3
            { notes: [196.00, 293.66], duration: 2.0 }  // G3, D4
        ];

        const section1AgainPads = [
            { notes: [110.00, 130.81, 164.81, 146.83], duration: 1.875 }, // A2, C3, E3, D3
            { notes: [98.00, 146.83], duration: 0.125 }  // G2, D3
        ];

        const section3Pads = [
            { notes: [87.31, 130.81, 164.81], duration: 1.5 }, // F2, C3, E3
            { notes: [98.00, 146.83], duration: 0.5 }  // G2, D3
        ];

        let currentTime = startTime;

        section1Pads.forEach(pad => {
            const timeoutId = setTimeout(() => {
                scheduledTimeouts.delete(timeoutId);
                if (isPlaying) {
                    createPadChord(pad.notes, pad.duration);
                }
            }, (currentTime - audioContext.currentTime) * 1000);
            scheduledTimeouts.add(timeoutId);
        });
        currentTime += 2;

        section2Pads.forEach(pad => {
            const timeoutId = setTimeout(() => {
                scheduledTimeouts.delete(timeoutId);
                if (isPlaying) {
                    createPadChord(pad.notes, pad.duration);
                }
            }, (currentTime - audioContext.currentTime) * 1000);
            scheduledTimeouts.add(timeoutId);
        });
        currentTime += 2;

        section1AgainPads.forEach(pad => {
            const timeoutId = setTimeout(() => {
                scheduledTimeouts.delete(timeoutId);
                if (isPlaying) {
                    createPadChord(pad.notes, pad.duration);
                }
            }, (currentTime - audioContext.currentTime) * 1000);
            currentTime += pad.duration;
            scheduledTimeouts.add(timeoutId);
        });

        section3Pads.forEach(pad => {
            const timeoutId = setTimeout(() => {
                scheduledTimeouts.delete(timeoutId);
                if (isPlaying) {
                    createPadChord(pad.notes, pad.duration);
                }
            }, (currentTime - audioContext.currentTime) * 1000);
            currentTime += pad.duration;
            scheduledTimeouts.add(timeoutId);
        });
    }

    function createPadChord(notes, duration) {
        if (!audioContext) return;

        notes.forEach(note => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();

            oscillator.connect(gainNode);
            gainNode.connect(filter);
            filter.connect(masterGain);

            oscillator.type = 'sine';
            oscillator.frequency.value = note;

            filter.type = 'lowpass';
            filter.frequency.value = 800 + (note * 0.5);
            filter.Q.value = 0.5;

            const now = audioContext.currentTime;

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.15, now + 0.5);
            gainNode.gain.setValueAtTime(0.15, now + duration - 0.5);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        });
    }

    function scheduleFoundationDrums(startTime) {
        const foundationDrums = [
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
        ];

        for (let section = 0; section < 4; section++) {
            const sectionStart = startTime + (section * 2);
            foundationDrums.forEach(drum => {
                const drumTime = sectionStart + drum.time;
                const timeoutId = setTimeout(() => {
                    scheduledTimeouts.delete(timeoutId);
                    if (isPlaying && audioContext) {
                        createDrumSound(drum.type, drumTime - audioContext.currentTime);
                    }
                }, (drumTime - audioContext.currentTime) * 1000);
                scheduledTimeouts.add(timeoutId);
            });
        }
    }

    function scheduleBassLayer(startTime) {
        const bassSection1 = [
            { note: 130.81, duration: 0.5 }, // C3 - follows E melody
            { note: 130.81, duration: 0.5 }, // C3
            { note: 146.83, duration: 0.5 }, // D3 - follows D melody  
            { note: 130.81, duration: 0.5 }  // C3 - follows E melody
        ];

        const bassSection2 = [
            { note: 146.83, duration: 0.5 }, // D3
            { note: 130.81, duration: 0.5 }, // C3
            { note: 146.83, duration: 0.5 }, // D3
            { note: 130.81, duration: 0.5 }  // C3
        ];

        const bassSection3 = [
            { note: 174.61, duration: 1.0 }, // F3 - matches F section
            { note: 130.81, duration: 1.0 }  // C3 - resolution
        ];

        const bassLayer = [
            ...bassSection1,
            ...bassSection2,
            ...bassSection1,
            ...bassSection3
        ];

        let bassTime = startTime;
        bassLayer.forEach(bassNote => {
            const timeoutId = setTimeout(() => {
                scheduledTimeouts.delete(timeoutId);
                if (isPlaying) {
                    playBassNote(bassNote.note, bassNote.duration);
                }
            }, (bassTime - audioContext.currentTime) * 1000);
            bassTime += bassNote.duration;
            scheduledTimeouts.add(timeoutId);
        });
    }

    function scheduleArpeggioLayer(startTime) {
        const arpeggioPattern = [
            { note: 261.63, duration: 0.125 }, // C4
            { note: 329.63, duration: 0.125 }, // E4
            { note: 392.00, duration: 0.125 }, // G4
            { note: 493.88, duration: 0.125 }, // B4
            { note: 392.00, duration: 0.125 }, // G4
            { note: 329.63, duration: 0.125 }, // E4
            { note: 261.63, duration: 0.125 }, // C4
            { note: 196.00, duration: 0.125 }, // G3
        ];

        const arpeggio = [
            ...arpeggioPattern,
            ...arpeggioPattern,
            ...arpeggioPattern,
            ...arpeggioPattern
        ];

        let arpTime = startTime;
        arpeggio.forEach(arpNote => {
            const timeoutId = setTimeout(() => {
                scheduledTimeouts.delete(timeoutId);
                if (isPlaying) {
                    playMelodyNote(arpNote.note, arpNote.duration, 'piano');
                }
            }, (arpTime - audioContext.currentTime) * 1000);
            arpTime += arpNote.duration;
            scheduledTimeouts.add(timeoutId);
        });
    }

    function scheduleLeadLayer(startTime) {
        const leadSection1 = [
            { note: 523.25, duration: 0.25 }, // C5
            { note: 587.33, duration: 0.25 }, // D5
            { note: 659.25, duration: 0.5 }, // E5
            { note: 523.25, duration: 0.5 }, // C5
            { note: 587.33, duration: 0.5 }  // D5
        ];

        const leadSection2 = [
            { note: 659.25, duration: 0.5 }, // E5
            { note: 587.33, duration: 0.5 }, // D5
            { note: 523.25, duration: 1.0 }  // C5
        ];

        const leadSection3 = [
            { note: 698.46, duration: 0.5 }, // F5
            { note: 659.25, duration: 0.5 }, // E5
            { note: 523.25, duration: 1.0 }  // C5
        ];

        const leadMelody = [
            ...leadSection1,
            ...leadSection2,
            ...leadSection1,
            ...leadSection3
        ];

        let leadTime = startTime;
        leadMelody.forEach(leadNote => {
            const timeoutId = setTimeout(() => {
                scheduledTimeouts.delete(timeoutId);
                if (isPlaying) {
                    playMelodyNote(leadNote.note, leadNote.duration, 'piano');
                }
            }, (leadTime - audioContext.currentTime) * 1000);
            leadTime += leadNote.duration;
            scheduledTimeouts.add(timeoutId);
        });
    }

    function setPaused(paused) {
        isPaused = paused;
        if (masterGain) {
            masterGain.gain.value = paused ? pauseVolume : volume;
        }
    }

    function stop() {
        isPlaying = false;
        activeLayers.clear();
        
        scheduledTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        scheduledTimeouts.clear();

        activeOscillators.forEach(oscillator => {
            try {
                oscillator.stop();
                oscillator.disconnect();
            } catch (e) {
                // Ignore
            }
        });
        activeOscillators.clear();

        if (currentSequence) {
            clearTimeout(currentSequence);
            currentSequence = null;
        }

        if (masterGain && audioContext) {
            const now = audioContext.currentTime;
            masterGain.gain.cancelScheduledValues(now);
            masterGain.gain.setValueAtTime(masterGain.gain.value, now);
            masterGain.gain.linearRampToValueAtTime(0.001, now + 0.1);
        }

        console.log('Music: Stopped all playback');
    }

    function fadeStop(fadeDuration = 0.1) {
        isPlaying = false;
        activeLayers.clear();

        scheduledTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        scheduledTimeouts.clear();

        activeOscillators.forEach(oscillator => {
            try {
                oscillator.stop();
                oscillator.disconnect();
            } catch (e) {
                // Ignore
            }
        });
        activeOscillators.clear();

        if (currentSequence) {
            clearTimeout(currentSequence);
            currentSequence = null;
        }

        if (masterGain && audioContext) {
            const now = audioContext.currentTime;
            masterGain.gain.cancelScheduledValues(now);
            masterGain.gain.setValueAtTime(0.001, now);
        }

        console.log('Music: fade Stopped for transition')
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
        fadeStop: fadeStop,
        setVolume: setVolume,
        setPaused: setPaused,
        resume: resume,
        isPlaying: function() { return isPlaying; },
        setLayers: function(layers) {
            activeLayers = new Set(layers);
        }
    }
})();
