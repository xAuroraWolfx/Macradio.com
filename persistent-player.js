(function () {
    const STORAGE_KEY = 'mstCrossPagePlayerStateV1';
    const SKIP_HOME_LOADING_KEY = 'mstSkipHomeLoadingOnce';
    const RELOAD_HOME_PLAYER_KEY = 'mstReloadHomePlayerOnce';
    const MINI_IDLE_FADE_DELAY_MS = 2600;
    let handoffAudioEl = null;
    let miniIdleFadeTimer = null;
    let pageIsNavigatingAway = false;

    function markSkipHomeLoadingOnce() {
        try {
            localStorage.setItem(SKIP_HOME_LOADING_KEY, '1');
        } catch (error) {
            // Ignore storage failures.
        }
    }

    function markReloadHomePlayerOnce() {
        try {
            localStorage.setItem(RELOAD_HOME_PLAYER_KEY, '1');
        } catch (error) {
            // Ignore storage failures.
        }
    }

    // Any navigation away from internal content pages should skip replaying the home intro once.
    window.addEventListener('pagehide', markSkipHomeLoadingOnce);
    document.addEventListener('click', (event) => {
        const link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
        if (!link) return;
        const href = String(link.getAttribute('href') || '').trim();
        if (href.startsWith('index.html')) {
            markSkipHomeLoadingOnce();
            markReloadHomePlayerOnce();
        }
    }, { capture: true });

    function readState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return null;
            return parsed;
        } catch (error) {
            return null;
        }
    }

    function writeState(nextState) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
        } catch (error) {
            // Ignore storage failures.
        }
    }

    function clampPercent(value) {
        return Math.max(0, Math.min(100, Number(value || 0)));
    }

    function getVolumeStateKey(normalizedVolume) {
        if (normalizedVolume <= 0) return 'muted';
        if (normalizedVolume <= 45) return 'low';
        return 'high';
    }

    function updateSoundIconState(buttonEl, normalizedVolume) {
        if (!buttonEl) return;
        const key = getVolumeStateKey(normalizedVolume);
        buttonEl.setAttribute('data-volume-state', key);
        buttonEl.setAttribute('aria-label', key === 'muted' ? 'Unmute live stream' : 'Mute live stream');
    }

    function syncSliderVisual(sliderEl, normalizedVolume) {
        if (!sliderEl) return;
        const safeVolume = clampPercent(normalizedVolume);
        sliderEl.style.setProperty('--volume-fill', `${safeVolume}%`);
    }

    function buildHomeMiniPlayerMarkup() {
        const wrap = document.createElement('div');
        wrap.id = 'miniPlayer';
        wrap.className = 'mini-player show';
        wrap.setAttribute('role', 'region');
        wrap.setAttribute('aria-label', 'Floating mini player');

        wrap.innerHTML = `
            <div class="mini-player-art-wrap" aria-hidden="true">
                <img id="miniPlayerArt" class="mini-player-art" src="images/mst-logo.png" alt="">
            </div>
            <div class="mini-player-meta">
                <p id="miniPlayerStation" class="mini-player-station">K101</p>
                <div class="mini-player-playback-wrap mini-player-track" role="status" aria-live="polite">
                    <span class="live-broadcast-pill">LIVE</span>
                    <span class="live-broadcast-text">
                        <span id="miniLiveBroadcastPrimary" class="live-broadcast-primary">On Air</span>
                        <span id="miniLiveBroadcastSecondary" class="live-broadcast-secondary">Loading update...</span>
                    </span>
                    <span id="miniLiveBroadcastTime" class="live-broadcast-time"></span>
                </div>
                <div class="mini-player-volume-inline">
                    <button id="miniPlayerVolumeMute" class="sound-icon-button compact" type="button" aria-label="Mute live stream">
                        <svg viewBox="0 0 24 24" class="sound-icon-svg" aria-hidden="true" focusable="false">
                            <path class="speaker" d="M3.5 9.5h4.6l4.1-3.5v12l-4.1-3.5H3.5z"></path>
                            <path class="wave wave-1" d="M14.6 9.2c1.2.8 2 2.1 2 3.8s-.8 3-2 3.8"></path>
                            <path class="wave wave-2" d="M16.9 6.8c2 1.3 3.3 3.4 3.3 6.2s-1.3 4.9-3.3 6.2"></path>
                            <path class="mute-slash" d="M16.5 8l5 8"></path>
                        </svg>
                    </button>
                    <input id="miniPlayerVolume" class="mini-player-volume" type="range" min="0" max="100" step="1" value="100" aria-label="Mini player volume">
                </div>
            </div>
            <div class="mini-player-controls">
                <button id="miniPlayerToggle" class="mini-player-toggle" type="button" aria-label="Pause playback">⏸</button>
            </div>
        `;

        document.body.appendChild(wrap);

        const audio = handoffAudioEl || document.createElement('audio');
        audio.id = 'globalMiniPlayerAudio';
        if (!audio.src) {
            audio.preload = 'auto';
        }
        audio.hidden = true;
        wrap.appendChild(audio);

        return {
            wrap,
            audio,
            miniPlayerArt: wrap.querySelector('#miniPlayerArt'),
            miniPlayerStation: wrap.querySelector('#miniPlayerStation'),
            miniLiveBroadcastPrimary: wrap.querySelector('#miniLiveBroadcastPrimary'),
            miniLiveBroadcastSecondary: wrap.querySelector('#miniLiveBroadcastSecondary'),
            miniLiveBroadcastTime: wrap.querySelector('#miniLiveBroadcastTime'),
            miniPlayerVolumeMute: wrap.querySelector('#miniPlayerVolumeMute'),
            miniPlayerVolume: wrap.querySelector('#miniPlayerVolume'),
            miniPlayerToggle: wrap.querySelector('#miniPlayerToggle')
        };
    }

    function startEarlyHandoffPlayback() {
        const state = readState();
        if (!state || !state.streamUrl || !state.isPlaying) return;

        try {
            const audio = document.createElement('audio');
            audio.id = 'globalMiniPlayerAudioSeed';
            audio.preload = 'auto';
            audio.src = String(state.streamUrl || '');
            audio.volume = clampPercent(Number(state.volume || 1) * 100) / 100;
            audio.muted = Boolean(state.muted) || Number(audio.volume || 0) <= 0;
            handoffAudioEl = audio;

            audio.play().catch(() => {
                // If autoplay is blocked, user interaction on mini controls can start playback.
            });
        } catch (error) {
            handoffAudioEl = null;
        }
    }

    function initPersistentMiniPlayer() {
        if (document.getElementById('player-audio')) return;

        const state = readState();
        if (!state || !state.streamUrl) return;

        const ui = buildHomeMiniPlayerMarkup();

        function clearMiniIdleFadeTimer() {
            if (!miniIdleFadeTimer) return;
            window.clearTimeout(miniIdleFadeTimer);
            miniIdleFadeTimer = null;
        }

        function revealMiniPlayerFromIdle() {
            if (!ui.wrap) return;
            ui.wrap.classList.remove('idle-hidden');
        }

        function scheduleMiniIdleFade() {
            clearMiniIdleFadeTimer();
            miniIdleFadeTimer = window.setTimeout(() => {
                ui.wrap.classList.add('idle-hidden');
            }, MINI_IDLE_FADE_DELAY_MS);
        }

        function markMiniActivity() {
            revealMiniPlayerFromIdle();
            scheduleMiniIdleFade();
        }

        ui.audio.src = String(state.streamUrl || '');
        ui.audio.volume = clampPercent(Number(state.volume || 1) * 100) / 100;
        ui.audio.muted = Boolean(state.muted) || Number(ui.audio.volume || 0) <= 0;

        if (ui.miniPlayerArt) {
            ui.miniPlayerArt.src = String(state.artwork || 'images/mst-logo.png');
        }
        if (ui.miniPlayerStation) {
            ui.miniPlayerStation.textContent = String(state.stationName || 'K101');
        }
        if (ui.miniLiveBroadcastPrimary) {
            ui.miniLiveBroadcastPrimary.textContent = String(state.primary || 'On Air');
        }
        if (ui.miniLiveBroadcastSecondary) {
            ui.miniLiveBroadcastSecondary.textContent = String(state.secondary || state.stationGenre || 'Live station programming');
        }
        if (ui.miniLiveBroadcastTime) {
            ui.miniLiveBroadcastTime.textContent = '';
        }

        function saveCurrentState() {
            const nextState = {
                ...state,
                volume: Number(ui.audio.volume || 1),
                muted: Boolean(ui.audio.muted),
                isPlaying: !ui.audio.paused,
                updatedAt: Date.now()
            };
            writeState(nextState);
        }

        function syncUi() {
            const normalizedVolume = ui.audio.muted ? 0 : Math.round((ui.audio.volume || 0) * 100);

            if (ui.miniPlayerVolume) {
                if (Number(ui.miniPlayerVolume.value) !== normalizedVolume) {
                    ui.miniPlayerVolume.value = String(normalizedVolume);
                }
                ui.miniPlayerVolume.setAttribute('aria-valuenow', String(normalizedVolume));
                syncSliderVisual(ui.miniPlayerVolume, normalizedVolume);
            }

            updateSoundIconState(ui.miniPlayerVolumeMute, normalizedVolume);

            if (ui.miniPlayerToggle) {
                ui.miniPlayerToggle.textContent = ui.audio.paused ? '▶' : '⏸';
                ui.miniPlayerToggle.setAttribute('aria-label', ui.audio.paused ? 'Play live stream' : 'Pause live stream');
            }
        }

        ui.miniPlayerToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            markMiniActivity();
            if (ui.audio.paused) {
                ui.audio.play().catch(() => {
                    // Playback may require another user interaction.
                });
            } else {
                ui.audio.pause();
            }
        });

        ui.miniPlayerVolumeMute.addEventListener('click', (e) => {
            e.stopPropagation();
            markMiniActivity();
            const currentlyMuted = ui.audio.muted || Number(ui.audio.volume || 0) <= 0;
            if (currentlyMuted) {
                ui.audio.muted = false;
                if (Number(ui.audio.volume || 0) <= 0) {
                    ui.audio.volume = 0.6;
                }
            } else {
                ui.audio.muted = true;
            }
            syncUi();
            saveCurrentState();
        });

        ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach((eventName) => {
            ui.miniPlayerVolume.addEventListener(eventName, (e) => {
                e.stopPropagation();
            });
        });

        const onSliderInput = (e) => {
            if (e) e.stopPropagation();
            markMiniActivity();
            const nextPercent = clampPercent(ui.miniPlayerVolume.value);
            ui.audio.volume = nextPercent / 100;
            ui.audio.muted = nextPercent <= 0;
            syncUi();
            saveCurrentState();
        };

        ui.miniPlayerVolume.addEventListener('input', onSliderInput);
        ui.miniPlayerVolume.addEventListener('change', onSliderInput);

        ['play', 'pause', 'volumechange'].forEach((eventName) => {
            ui.audio.addEventListener(eventName, () => {
                if (eventName === 'pause' && (pageIsNavigatingAway || document.visibilityState === 'hidden')) {
                    syncUi();
                    return;
                }
                syncUi();
                saveCurrentState();
            });
        });

        ui.wrap.addEventListener('click', (e) => {
            markMiniActivity();
            const shouldNavigate = Boolean(
                e.target.closest('.mini-player-art-wrap') ||
                e.target.closest('.mini-player-station') ||
                e.target.closest('.mini-player-track')
            );
            if (shouldNavigate) {
                window.location.href = 'index.html#stations';
            }
        });

        window.addEventListener('scroll', markMiniActivity, { passive: true });
        window.addEventListener('wheel', markMiniActivity, { passive: true });
        window.addEventListener('touchmove', markMiniActivity, { passive: true });
        window.addEventListener('mousemove', markMiniActivity, { passive: true });
        window.addEventListener('beforeunload', () => {
            pageIsNavigatingAway = true;
        });
        window.addEventListener('pagehide', () => {
            pageIsNavigatingAway = true;
        });

        syncUi();
        revealMiniPlayerFromIdle();
        scheduleMiniIdleFade();

        if (state.isPlaying) {
            ui.audio.play().catch(() => {
                syncUi();
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPersistentMiniPlayer);
    } else {
        initPersistentMiniPlayer();
    }

    // Kick off stream connection as early as possible to minimize audible gaps across page navigation.
    startEarlyHandoffPlayback();
})();
