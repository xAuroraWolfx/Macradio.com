// Disable browser scroll restoration immediately (with Safari fallback)
if (window.history && window.history.scrollRestoration) {
    window.history.scrollRestoration = 'manual';
}

// Notification providers for sign-up confirmations.
// Configure these keys/IDs to enable real email and SMS delivery.
const NOTIFICATION_CONFIG = {
    emailjs: {
        enabled: false,
        serviceId: '',
        templateId: '',
        publicKey: ''
    },
    textbelt: {
        enabled: false,
        key: ''
    }
};

const STREAMING_FEATURE_ENABLED = false;

function getPlanLabel(tier) {
    if (!tier) return 'No plan selected';
    const map = {
        basic: 'Basic ($4.99/month)',
        premium: 'Premium ($9.99/month)',
        family: 'Family ($14.99/month)'
    };
    return map[tier] || tier;
}

function normalizePhoneNumber(phone) {
    return (phone || '').replace(/[^\d+]/g, '');
}

function formatDisplayName(name) {
    return (name || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}

function isValidFullName(name) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    return parts.length >= 2 && parts.every(part => part.length >= 2);
}

function isStreamingActive(account) {
    if (!account) return false;
    if (!STREAMING_FEATURE_ENABLED) return false;
    if (typeof account.streamingActivated === 'boolean') {
        return account.streamingActivated;
    }
    return Boolean(account.subscriptionTier && account.paymentMethod && account.paymentMethod.cardNumber);
}

async function sendEmailConfirmation(account) {
    if (!NOTIFICATION_CONFIG.emailjs.enabled) {
        return { status: 'skipped', reason: 'EmailJS disabled' };
    }

    const payload = {
        service_id: NOTIFICATION_CONFIG.emailjs.serviceId,
        template_id: NOTIFICATION_CONFIG.emailjs.templateId,
        user_id: NOTIFICATION_CONFIG.emailjs.publicKey,
        template_params: {
            to_name: account.name,
            to_email: account.email,
            plan_name: getPlanLabel(account.subscriptionTier),
            app_name: 'MST Radio Network'
        }
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error('Email delivery failed');
    }

    return { status: 'sent' };
}

async function sendSmsConfirmation(account) {
    if (!NOTIFICATION_CONFIG.textbelt.enabled) {
        return { status: 'skipped', reason: 'TextBelt disabled' };
    }

    const phone = normalizePhoneNumber(account.phone);
    const message = `Hi ${account.name}, your MST Radio account was created successfully. Plan: ${getPlanLabel(account.subscriptionTier)}.`;

    const response = await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            phone,
            message,
            key: NOTIFICATION_CONFIG.textbelt.key
        })
    });

    const data = await response.json();
    if (!data.success) {
        throw new Error(data.error || 'SMS delivery failed');
    }

    return { status: 'sent' };
}

async function sendSignupNotifications(account) {
    const result = {
        email: { status: 'skipped' },
        sms: { status: 'skipped' }
    };

    try {
        result.email = await sendEmailConfirmation(account);
    } catch (error) {
        result.email = { status: 'failed', reason: error.message };
    }

    try {
        result.sms = await sendSmsConfirmation(account);
    } catch (error) {
        result.sms = { status: 'failed', reason: error.message };
    }

    return result;
}

function enforceStreamingDisabled(account) {
    if (!account) return account;
    account.subscriptionTier = account.subscriptionTier || '';
    account.streamingActivated = false;
    return account;
}

// Force scroll to top on page load for all browsers including Safari
window.addEventListener('load', function() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
}, false);

// News Articles Data
const newsArticles = {
    community: {
        title: 'Local News',
        articles: [
            {
                headline: 'McAlester Man Officially Charged with First-Degree Murder; Bond Set at $3 Million',
                date: 'June 9, 2026',
                content: 'MST local news reported court filings in Pittsburg County for charges connected to a June 5 shooting. Coverage includes first-degree murder and additional assault-related counts.'
            },
            {
                headline: 'Street Closure to Last at Least a Week',
                date: 'June 9, 2026',
                content: 'MST updates reported utility repair work and lane closure impacts near Sixth Street and Monroe Avenue, including additional concrete cure time after repairs.'
            },
            {
                headline: 'Primary Election Coverage Across KNED and K101',
                date: 'June 16, 2026',
                content: 'MST stations carried election reminders and evening results coverage, with on-air and online streaming access for listeners across the network.'
            }
        ]
    },
    sports: {
        title: 'Artist Interviews',
        articles: [
            {
                headline: 'Soul Circus Cowboys Interview',
                date: 'April 29, 2025',
                content: 'Featured K101 artist interview available in the station podcast feed. Listen to conversations and performances from regional and national artists.'
            },
            {
                headline: 'Kaitlyn Kohler Interview and Live Performance',
                date: 'July 12, 2023',
                content: 'K101 continues to spotlight interviews and in-studio performances through the station\'s on-demand audio content.'
            },
            {
                headline: 'Cutter Elliott Interview',
                date: 'June 5, 2023',
                content: 'Additional artist features and interviews are available through K101\'s podcast library and station pages.'
            }
        ]
    },
    weather: {
        title: 'Station Updates',
        articles: [
            {
                headline: 'Rise Up Country Airs Sundays 9:00 AM - 11:00 AM',
                date: 'Programming',
                content: 'Tune in to Rise Up Country on K101 every Sunday morning for a dedicated two-hour block of country programming.'
            },
            {
                headline: 'K-101 Is Your Thunder Connection',
                date: 'Seasonal Coverage',
                content: 'K101 promotes live Thunder coverage throughout the season, including game-related updates and on-air callouts in Southeastern Oklahoma.'
            },
            {
                headline: 'Listen on the MST Mobile Apps',
                date: 'Always On',
                content: 'Listeners can stream K101, Rock 105, KNED, and Cool 96.7 using official iOS and Android apps for each station.'
            }
        ]
    },
    jobListings: {
        title: 'Job Listings',
        articles: [
            {
                headline: 'McAlester Area Job Listings and Hiring Resources',
                date: 'Updated from Local Listings',
                imageUrl: 'images/mst-logo.png',
                sourceUrl: 'https://mcalesterradio.com/joblistings/',
                content: 'View current local hiring opportunities from the McAlester Radio job listings hub. This article is part of the MST article system and links to the official source for full posting details, updates, and application instructions.'
            }
        ]
    }
};

// Local Events Data
const localEvents = {
    festival: {
        title: 'Rise Up Country',
        details: {
            name: 'Rise Up Country on K101',
            date: 'Every Sunday',
            location: 'K101 101.3 FM + Streaming',
            time: '9:00 AM - 11:00 AM',
            description: 'K101 features Rise Up Country every Sunday morning. Stream on the K101 app or listen on-air for a dedicated weekend country block built for Southeastern Oklahoma listeners.'
        }
    },
    concert: {
        title: 'Thunder Connection Live Season',
        details: {
            name: 'K101 Thunder Connection',
            date: 'In-Season',
            location: 'Southeastern Oklahoma Broadcast Area',
            time: 'Game-Day Coverage',
            description: 'K101 promotes Thunder coverage all season with live action callouts and station-wide game updates. Follow broadcasts on-air and through MST digital channels.'
        }
    },
    tournament: {
        title: 'Community Calendar Highlights',
        details: {
            name: 'MST Community Calendar and Notices',
            date: 'Updated Regularly',
            location: 'McAlester and Surrounding Communities',
            time: 'All Day Coverage',
            description: 'MST shares community calendar items, local notices, and civic updates across station pages and daily broadcasts so listeners can keep up with what is happening nearby.'
        }
    }
};

// Advertising Plans Data
const advertisingPlans = {
    starter: {
        name: 'Starter',
        price: '$99/month',
        description: 'Perfect for small local businesses just starting out',
        features: [
            '✓ 30-second radio spot',
            '✓ 5 plays per day across selected station',
            '✓ Access to one local radio station',
            '✓ Email support',
            '✓ Basic scheduling',
            '✗ Custom production included',
            '✗ Premium time slots'
        ],
        details: 'The Starter package is ideal for local small businesses looking to build brand awareness. Get your message heard 5 times daily on one of our popular stations. Perfect for restaurants, shops, and local services.\n\nWhat\'s Included:\n- Professional audio delivery system\n- Standard time slot placement\n- Monthly performance report\n- Email support from our team\n\nGreat for: Hair salons, local shops, restaurants, service providers'
    },
    professional: {
        name: 'Professional',
        price: '$299/month',
        description: 'Most Popular - Best for growing local businesses',
        features: [
            '✓ 60-second radio spot',
            '✓ 10 plays per day',
            '✓ All 4 local MST stations',
            '✓ Phone & email support',
            '✓ Custom production available',
            '✓ Priority scheduling',
            '✓ Monthly performance analytics'
        ],
        details: 'The Professional package is our most popular choice! Reach thousands of listeners across all four MST stations with professional custom production. Your message gets heard 10 times daily across our entire network.\n\nWhat\'s Included:\n- Professional custom production and editing\n- Priority time slot placement\n- All 4 stations: K101, ROCK 105, KNED, COOL 96.7\n- Dedicated account support\n- Detailed monthly analytics\n- Seasonal campaign adjustments\n\nGreat for: Growing businesses, professional services, community events'
    },
    premium: {
        name: 'Premium',
        price: '$599/month',
        description: 'Maximum exposure for serious businesses',
        features: [
            '✓ 60-second + 30-second combo spots',
            '✓ 15 plays per day',
            '✓ All 4 local stations',
            '✓ Premium time slots',
            '✓ Professional custom production & editing',
            '✓ Priority support 24/5',
            '✓ Advanced analytics & reporting'
        ],
        details: 'The Premium package provides maximum exposure with our highest play frequency. Get both long and short spots across all four MST stations with guaranteed premium time slots.\n\nWhat\'s Included:\n- Full production suite with editing\n- 60-second main spot + 30-second additional spots\n- Peak hour time slot guarantee\n- All 4 stations with priority placement\n- Weekly performance tracking\n- Dedicated account manager\n- Campaign optimization support\n- Exclusive sponsor recognition on-air\n\nGreat for: Major retailers, automotive dealers, healthcare providers, large events'
    }
};

function disablePersistedStreamingAccounts() {
    if (STREAMING_FEATURE_ENABLED) return;

    try {
        const storedAccounts = JSON.parse(localStorage.getItem('radioAccounts')) || [];
        let changed = false;

        const migratedAccounts = storedAccounts.map((account) => {
            if (!account || typeof account !== 'object') return account;

            const nextAccount = { ...account };
            if (nextAccount.streamingActivated) {
                nextAccount.streamingActivated = false;
                changed = true;
            }
            return nextAccount;
        });

        if (changed) {
            localStorage.setItem('radioAccounts', JSON.stringify(migratedAccounts));
        }

        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (currentUser && currentUser.streamingActivated) {
            currentUser.streamingActivated = false;
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    } catch (error) {
        // Ignore storage failures.
    }
}

disablePersistedStreamingAccounts();

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const skipLoadingFromUrl = urlParams.get('skipLoading') === '1';
    let shouldSkipLoadingAnimation = false;
    try {
        shouldSkipLoadingAnimation = localStorage.getItem('mstSkipHomeLoadingOnce') === '1';
        if (shouldSkipLoadingAnimation) {
            localStorage.removeItem('mstSkipHomeLoadingOnce');
        }
    } catch (error) {
        shouldSkipLoadingAnimation = false;
    }
    shouldSkipLoadingAnimation = shouldSkipLoadingAnimation || skipLoadingFromUrl;

    if (skipLoadingFromUrl) {
        try {
            const cleanUrl = `${window.location.pathname}${window.location.hash || ''}`;
            window.history.replaceState({}, '', cleanUrl);
        } catch (error) {
            // Ignore history API failures.
        }
    }

    // Lock body scrolling during loading screen
    if (!shouldSkipLoadingAnimation) {
        document.body.classList.add('loading-locked');
    }
    
    // Ensure scroll is at top immediately
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Hide loading screen after animation completes (or immediately when returning from internal pages).
    const hideLoadingScreen = function() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }

        // Unlock body scrolling
        document.body.classList.remove('loading-locked');

        // Keep scroll at top after loading screen hides
        requestAnimationFrame(function() {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        });
    };

    if (shouldSkipLoadingAnimation) {
        hideLoadingScreen();
    } else {
        setTimeout(hideLoadingScreen, 2800);
    }
    
    // Scroll to top on page load - ensure it happens immediately and stays
    requestAnimationFrame(function() {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    });

    initializeAutoHideHeader();

    function setFormMessage(messageId, text, type) {
        const el = document.getElementById(messageId);
        if (!el) return;
        el.textContent = text;
        el.classList.remove('error', 'success', 'info');
        if (type) el.classList.add(type);
    }

    function clearFormMessage(messageId) {
        const el = document.getElementById(messageId);
        if (!el) return;
        el.textContent = '';
        el.classList.remove('error', 'success', 'info');
    }

    function setSubscribeButtonAvailability(isAvailable) {
        const subscribeBtn = document.getElementById('subscribeBtn');
        if (!subscribeBtn) return;
        subscribeBtn.disabled = !isAvailable;
        subscribeBtn.classList.toggle('disabled', !isAvailable);
        subscribeBtn.setAttribute('aria-disabled', String(!isAvailable));
    }

    function openSubscribeModalWithTier(tier) {
        const subscribeModal = document.getElementById('subscribeModal');
        const subscribeContent = document.querySelector('.subscribe-modal-content');
        const subTierSelect = document.getElementById('subTier');
        const subPasswordInput = document.getElementById('subPassword');
        if (!subscribeModal) return;

        if (subTierSelect) {
            subTierSelect.value = tier || '';
        }

        clearFormMessage('subscribeMessage');
        subscribeModal.classList.add('active');
        if (subscribeContent) subscribeContent.scrollTop = 0;
        if (subPasswordInput) {
            updateSignupPasswordRequirements(subPasswordInput.value);
        }
    }

    let siteToastTimer = null;
    function showSiteToast(text, type = 'info', duration = 2600) {
        const toast = document.getElementById('siteToast');
        if (!toast || !text) return;
        toast.textContent = text;
        toast.classList.remove('show', 'error', 'success', 'info');
        if (type) toast.classList.add(type);
        // Force reflow so repeated toasts retrigger the transition reliably.
        void toast.offsetWidth;
        toast.classList.add('show');
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        if (siteToastTimer) {
            clearTimeout(siteToastTimer);
        }
        siteToastTimer = setTimeout(() => {
            toast.classList.remove('show');
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
        }, duration);
    }

    function getReloadCounterKey(email) {
        return `pageReloadCount:${String(email || '').trim().toLowerCase()}`;
    }

    function resetReloadCounter(email) {
        if (!email) return;
        localStorage.setItem(getReloadCounterKey(email), '0');
    }

    function incrementReloadCounter(email) {
        if (!email) return 0;
        const key = getReloadCounterKey(email);
        const nextCount = Number(localStorage.getItem(key) || '0') + 1;
        localStorage.setItem(key, String(nextCount));
        return nextCount;
    }

    function clearReloadCounter(email) {
        if (!email) return;
        localStorage.removeItem(getReloadCounterKey(email));
    }

    function isValidPassword(password) {
        return password.length >= 6 && /[A-Z]/.test(password);
    }

    function updateSignupPasswordRequirements(password) {
        const reqLength = document.getElementById('reqLength');
        const reqUpper = document.getElementById('reqUpper');
        if (!reqLength || !reqUpper) return;

        const hasMinLength = (password || '').length >= 6;
        const hasUppercase = /[A-Z]/.test(password || '');

        reqLength.classList.toggle('valid', hasMinLength);
        reqLength.classList.toggle('invalid', !hasMinLength);
        const reqLengthIcon = reqLength.querySelector('.req-icon');
        if (reqLengthIcon) reqLengthIcon.textContent = hasMinLength ? '✓' : 'X';

        reqUpper.classList.toggle('valid', hasUppercase);
        reqUpper.classList.toggle('invalid', !hasUppercase);
        const reqUpperIcon = reqUpper.querySelector('.req-icon');
        if (reqUpperIcon) reqUpperIcon.textContent = hasUppercase ? '✓' : 'X';
    }
    
    // Check if on index.html (has newsModal element)
    const isIndexPage = document.getElementById('newsModal') !== null;
    
    // Check if returning from article detail to open news modal
    const newsCategory = sessionStorage.getItem('newsCategory');
    const returnFromArticle = sessionStorage.getItem('returnFromArticle');
    
    if (isIndexPage && !skipLoadingFromUrl && newsCategory && returnFromArticle === 'true' && newsArticles[newsCategory]) {
        // Clear the flag so it doesn't reopen on subsequent page loads
        sessionStorage.removeItem('returnFromArticle');
        
        // Ensure scroll stays at top before opening modal
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        // Small delay to ensure DOM is ready
        setTimeout(function() {
            const newsData = newsArticles[newsCategory];
            document.getElementById('modalTitle').textContent = newsData.title;
            
            let articlesHTML = '';
            newsData.articles.forEach((article, index) => {
                const articleId = `${newsCategory}-${index}`;
                articlesHTML += `
                    <a href="article-detail.html?id=${articleId}" class="article-link">
                        <div class="article">
                            ${article.imageUrl ? `<img src="${article.imageUrl}" alt="${article.headline}" class="article-thumb">` : ''}
                            <h3>${article.headline}</h3>
                            <div class="article-date">${article.date}</div>
                            <p>${article.content}</p>
                            ${article.sourceUrl ? `<div class="article-source-link">Source: ${article.sourceUrl}</div>` : ''}
                        </div>
                    </a>
                `;
            });
            
            document.getElementById('modalBody').innerHTML = articlesHTML;
            
            // Add click handler for article links
            document.querySelectorAll('.article-link').forEach((link, index) => {
                link.addEventListener('click', function(e) {
                    const article = newsData.articles[index];
                    sessionStorage.setItem('currentArticle', JSON.stringify(article));
                    sessionStorage.setItem('newsCategory', newsCategory);
                    sessionStorage.setItem('returnFromArticle', 'false');
                });
            });
            
            document.querySelector('.news-modal-content').scrollTop = 0;
            document.getElementById('modalBody').scrollTop = 0;
            document.getElementById('newsModal').classList.add('active');
        }, 100);
    }
    
    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menu.classList.toggle('active');
        });

        // Close menu when a link is clicked
        document.querySelectorAll('.menu a').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && !menuToggle.contains(e.target)) {
                menu.classList.remove('active');
            }
        });
    }

    // Smooth Scrolling for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                // Home link scrolls to top
                if (this.getAttribute('href') === '#home') {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                } else {
                    const headerHeight = document.querySelector('header').offsetHeight;
                    // Use extra offset for better visibility below header
                    const offset = this.getAttribute('href') === '#advertise' ? 120 : 60;
                    const targetPosition = target.offsetTop - headerHeight - offset;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    const stationStreams = {
        'K101': 'https://ice6.securenetsystems.net/KMCO',
        'ROCK 105': 'https://ice6.securenetsystems.net/KTMCFM',
        'KNED': 'https://ice5.securenetsystems.net/KNED',
        'COOL 96.7': 'https://ice42.securenetsystems.net/KTMC'
    };

    const stationNowPlayingFeeds = {
        'K101': 'https://streamdb7web.securenetsystems.net/player_status_update/KMCO_history.xml',
        'ROCK 105': 'https://streamdb3web.securenetsystems.net/player_status_update/KTMCFM_history.xml',
        'KNED': 'https://streamdb8web.securenetsystems.net/player_status_update/KNED_history.xml',
        'COOL 96.7': 'https://streamdb4web.securenetsystems.net/player_status_update/KTMC_history.xml'
    };

    const stationPageSources = {
        'K101': 'https://mcalesterradio.com/k101/',
        'ROCK 105': 'https://mcalesterradio.com/rock105/'
    };

    const stationArtworks = {
        'K101': 'https://cdnrf.securenetsystems.net/file_radio/stations_large/KMCO/v5/logo.png',
        'ROCK 105': 'https://cdnrf.securenetsystems.net/file_radio/stations_large/KTMCFM/v5/logo.png',
        'KNED': 'https://cdnrf.securenetsystems.net/file_radio/stations_large/KNED/v5/logo.png',
        'COOL 96.7': 'https://cdnrf.securenetsystems.net/file_radio/stations_large/KTMC/v5/logo.png'
    };

    const audioEl = document.getElementById('player-audio');
    const miniPlayerEl = document.getElementById('miniPlayer');
    const miniPlayerArtEl = document.getElementById('miniPlayerArt');
    const miniPlayerStationEl = document.getElementById('miniPlayerStation');
    const miniPlayerTrackEl = document.getElementById('miniPlayerTrack');
    const miniLiveBroadcastPrimaryEl = document.getElementById('miniLiveBroadcastPrimary');
    const miniLiveBroadcastSecondaryEl = document.getElementById('miniLiveBroadcastSecondary');
    const miniLiveBroadcastTimeEl = document.getElementById('miniLiveBroadcastTime');
    const miniPlayerToggleEl = document.getElementById('miniPlayerToggle');
    const miniPlayerVolumeMuteEl = document.getElementById('miniPlayerVolumeMute');
    const playerVolumeMuteEl = document.getElementById('playerVolumeMute');
    const miniPlayerVolumeEl = document.getElementById('miniPlayerVolume');
    const playerVolumeEl = document.getElementById('playerVolume');
    const liveBroadcastPrimaryEl = document.getElementById('liveBroadcastPrimary');
    const liveBroadcastSecondaryEl = document.getElementById('liveBroadcastSecondary');
    const liveBroadcastTimeEl = document.getElementById('liveBroadcastTime');
    let lastNonZeroVolume = 1;
    const VOLUME_STEP_PERCENT = 5;
    const CROSS_PAGE_PLAYER_KEY = 'mstCrossPagePlayerStateV1';
    const RELOAD_HOME_PLAYER_KEY = 'mstReloadHomePlayerOnce';

    function syncSliderVisual(sliderEl, normalizedVolume) {
        if (!sliderEl) return;
        const safeVolume = Math.max(0, Math.min(100, Number(normalizedVolume || 0)));
        sliderEl.style.setProperty('--volume-fill', `${safeVolume}%`);
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

    function persistCrossPagePlayerState(isPlaying) {
        if (!audioEl) return;
        const stationName = document.getElementById('station-name')?.textContent?.trim() || currentPlayerStation || 'K101';
        const stationGenre = document.querySelector(`.station-card[data-station="${stationName}"]`)?.dataset?.genre || 'Live station programming';
        const payload = {
            stationName,
            stationGenre,
            streamUrl: audioEl.currentSrc || stationStreams[stationName] || '',
            artwork: document.getElementById('playerArt')?.getAttribute('src') || stationArtworks[stationName] || stationArtworks.K101,
            primary: liveBroadcastPrimaryEl ? String(liveBroadcastPrimaryEl.textContent || 'On Air').trim() : 'On Air',
            secondary: liveBroadcastSecondaryEl ? String(liveBroadcastSecondaryEl.textContent || stationGenre).trim() : stationGenre,
            volume: Number(audioEl.volume || 1),
            muted: Boolean(audioEl.muted),
            isPlaying: Boolean(isPlaying),
            updatedAt: Date.now()
        };

        try {
            localStorage.setItem(CROSS_PAGE_PLAYER_KEY, JSON.stringify(payload));
        } catch (error) {
            // Ignore localStorage failures.
        }
    }

    function restoreCrossPagePlayerStateOnHome() {
        if (!audioEl) return;

        let stored = null;
        try {
            stored = JSON.parse(localStorage.getItem(CROSS_PAGE_PLAYER_KEY) || 'null');
        } catch (error) {
            stored = null;
        }
        if (!stored || !stored.streamUrl) return;

        const restoredStation = String(stored.stationName || '').trim();
        const hasStation = Boolean(restoredStation && stationStreams[restoredStation]);
        const stationName = hasStation ? restoredStation : 'K101';
        const stationGenre = document.querySelector(`.station-card[data-station="${stationName}"]`)?.dataset?.genre
            || String(stored.stationGenre || '').trim()
            || 'Live stream';
        const sourceEl = audioEl.querySelector('source');
        const targetStream = String(stored.streamUrl || stationStreams[stationName] || '').trim();

        currentPlayerStation = stationName;
        const stationNameEl = document.getElementById('station-name');
        const stationInfoEl = document.getElementById('station-info');
        if (stationNameEl) stationNameEl.textContent = stationName;
        if (stationInfoEl) {
            stationInfoEl.textContent = `Now playing ${stationName} - ${stationGenre}`;
        }
        updatePlayerArt(stationName);

        if (sourceEl && targetStream) {
            const previousSrc = sourceEl.src || '';
            if (!previousSrc || previousSrc !== targetStream) {
                sourceEl.src = targetStream;
                audioEl.load();
            }
        }

        const normalizedVolume = Math.max(0, Math.min(1, Number(stored.volume)));
        if (Number.isFinite(normalizedVolume)) {
            audioEl.volume = normalizedVolume;
            if (normalizedVolume > 0) {
                lastNonZeroVolume = normalizedVolume;
            }
        }
        audioEl.muted = Boolean(stored.muted) || Number(audioEl.volume || 0) <= 0;

        const savedPrimary = String(stored.primary || '').trim();
        const savedSecondary = String(stored.secondary || '').trim();
        if (savedPrimary || savedSecondary) {
            renderLiveBroadcastStack(savedPrimary || `On Air - ${stationName}`, savedSecondary || stationGenre, '');
        } else {
            renderLiveBroadcastDescription(stationName, stationGenre);
        }

        if (stored.isPlaying) {
            hasMiniPlayerSession = true;
            keepMiniVisibleWhenPaused = false;
            audioEl.play().catch(() => {
                // Browser policy may delay autoplay until interaction.
            });
        }

        syncMiniPlayerState();
    }

    function reloadListenLivePanelOnHomeReturn() {
        if (!audioEl) return;
        let shouldReload = false;
        try {
            shouldReload = localStorage.getItem(RELOAD_HOME_PLAYER_KEY) === '1';
        } catch (error) {
            shouldReload = false;
        }
        if (!shouldReload) return;
        try {
            localStorage.removeItem(RELOAD_HOME_PLAYER_KEY);
        } catch (error) {
            // Ignore storage failures.
        }

        let stored = null;
        try {
            stored = JSON.parse(localStorage.getItem(CROSS_PAGE_PLAYER_KEY) || 'null');
        } catch (error) {
            stored = null;
        }
        if (!stored || !stored.streamUrl) return;

        const restoredStation = String(stored.stationName || '').trim();
        const hasStation = Boolean(restoredStation && stationStreams[restoredStation]);
        const stationName = hasStation ? restoredStation : currentPlayerStation || 'K101';
        const stationGenre = document.querySelector(`.station-card[data-station="${stationName}"]`)?.dataset?.genre
            || String(stored.stationGenre || '').trim()
            || 'Live stream';

        currentPlayerStation = stationName;
        const stationNameEl = document.getElementById('station-name');
        const stationInfoEl = document.getElementById('station-info');
        if (stationNameEl) stationNameEl.textContent = stationName;
        if (stationInfoEl) stationInfoEl.textContent = `Now playing ${stationName} - ${stationGenre}`;
        updatePlayerArt(stationName);

        const sourceEl = audioEl.querySelector('source');
        if (sourceEl) {
            sourceEl.src = String(stored.streamUrl || stationStreams[stationName] || '').trim();
            audioEl.load();
        }

        const normalizedVolume = Math.max(0, Math.min(1, Number(stored.volume)));
        if (Number.isFinite(normalizedVolume)) {
            audioEl.volume = normalizedVolume;
            if (normalizedVolume > 0) lastNonZeroVolume = normalizedVolume;
        }
        audioEl.muted = Boolean(stored.muted) || Number(audioEl.volume || 0) <= 0;

        const savedPrimary = String(stored.primary || '').trim();
        const savedSecondary = String(stored.secondary || '').trim();
        if (savedPrimary || savedSecondary) {
            renderLiveBroadcastStack(savedPrimary || `On Air - ${stationName}`, savedSecondary || stationGenre, '');
        } else {
            renderLiveBroadcastDescription(stationName, stationGenre);
        }

        if (stored.isPlaying) {
            hasMiniPlayerSession = true;
            keepMiniVisibleWhenPaused = false;
            audioEl.play().catch(() => {
                // Browser policy may delay autoplay until interaction.
            });
        }

        syncMiniPlayerState();
    }

    function setAudioVolumePercent(rawValue) {
        if (!audioEl) return;
        const nextPercent = Math.max(0, Math.min(100, Number(rawValue || 0)));
        const nextVolume = nextPercent / 100;
        audioEl.volume = nextVolume;
        audioEl.muted = nextVolume <= 0;
        if (nextVolume > 0) lastNonZeroVolume = nextVolume;
        revealMiniPlayerFromIdle();
        scheduleMiniIdleFade();
        syncMiniPlayerState();
    }

    function adjustAudioVolumeByStep(stepPercent) {
        if (!audioEl) return;
        const currentPercent = audioEl.muted ? 0 : Math.round((audioEl.volume || 0) * 100);
        setAudioVolumePercent(currentPercent + stepPercent);
    }

    if ('mediaSession' in navigator) {
        try {
            navigator.mediaSession.setActionHandler('nexttrack', null);
            navigator.mediaSession.setActionHandler('previoustrack', null);
            navigator.mediaSession.setActionHandler('seekto', null);
            navigator.mediaSession.setActionHandler('seekforward', null);
            navigator.mediaSession.setActionHandler('seekbackward', null);
        } catch (error) {
            // Some browsers may not support all action handlers.
        }
    }

    let currentPlayerStation = 'K101';
    let currentNowPlayingTrack = null;
    let hasMiniPlayerSession = false;
    let keepMiniVisibleWhenPaused = false;
    let pauseTriggeredByMiniToggle = false;
    let pageIsNavigatingAway = false;
    let miniWasVisible = false;
    let miniIdleFadeTimer = null;
    const MINI_IDLE_FADE_DELAY_MS = 2600;
    const coverArtLookupCache = new Map();
    const pendingTrackChanges = new Map();

    function clearMiniIdleFadeTimer() {
        if (!miniIdleFadeTimer) return;
        window.clearTimeout(miniIdleFadeTimer);
        miniIdleFadeTimer = null;
    }

    function revealMiniPlayerFromIdle() {
        if (!miniPlayerEl) return;
        miniPlayerEl.classList.remove('idle-hidden');
    }

    function scheduleMiniIdleFade() {
        if (!miniPlayerEl || !miniPlayerEl.classList.contains('show')) return;
        clearMiniIdleFadeTimer();
        miniIdleFadeTimer = window.setTimeout(() => {
            if (!miniPlayerEl.classList.contains('show')) return;
            miniPlayerEl.classList.add('idle-hidden');
        }, MINI_IDLE_FADE_DELAY_MS);
    }

    function markMiniScrollActivity() {
        if (!miniPlayerEl || !miniPlayerEl.classList.contains('show')) return;
        revealMiniPlayerFromIdle();
        scheduleMiniIdleFade();
    }

    function normalizeTrackPart(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    }

    function buildTrackKey(track) {
        if (!track) return '';
        const title = normalizeTrackPart(track.title);
        const artist = normalizeTrackPart(track.artist);
        if (!title && !artist) return '';
        return `${title}::${artist}`;
    }

    function shouldCommitTrackUpdate(stationName, incomingTrack) {
        const incomingKey = buildTrackKey(incomingTrack);
        if (!incomingKey) return false;

        const currentTrackForStation = currentNowPlayingTrack && currentNowPlayingTrack.stationName === stationName
            ? currentNowPlayingTrack
            : null;

        if (!currentTrackForStation) {
            pendingTrackChanges.delete(stationName);
            return true;
        }

        const currentKey = buildTrackKey(currentTrackForStation);
        if (!currentKey || incomingKey === currentKey) {
            pendingTrackChanges.delete(stationName);
            return true;
        }

        const now = Date.now();
        const pending = pendingTrackChanges.get(stationName);
        if (!pending || pending.key !== incomingKey) {
            pendingTrackChanges.set(stationName, {
                key: incomingKey,
                firstSeenMs: now,
                count: 1
            });
            return false;
        }

        pending.count += 1;
        pendingTrackChanges.set(stationName, pending);
        const seenLongEnough = now - pending.firstSeenMs >= 45000;
        const seenEnoughTimes = pending.count >= 2;

        if (seenEnoughTimes || seenLongEnough) {
            pendingTrackChanges.delete(stationName);
            return true;
        }

        return false;
    }

    function updatePlayerArt(stationName) {
        const playerArtEl = document.getElementById('playerArt');
        if (!playerArtEl) return;

        const fallbackArt = stationArtworks.K101;
        const stationArt = stationArtworks[stationName] || fallbackArt;

        playerArtEl.src = stationArt;
        playerArtEl.alt = `${stationName} station art`;
        playerArtEl.onerror = () => {
            playerArtEl.onerror = null;
            playerArtEl.src = fallbackArt;
            playerArtEl.alt = 'Station art';
        };

        syncMiniPlayerState();
    }

    function isPlayerSectionVisible() {
        const playerSection = document.getElementById('player');
        if (!playerSection) return false;

        const rect = playerSection.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const headerEl = document.querySelector('header');
        const headerHeight = headerEl ? headerEl.offsetHeight : 0;
        const visibleTopBound = headerHeight + 20;
        const visibleBottomBound = viewportHeight - 20;
        return rect.bottom > visibleTopBound && rect.top < visibleBottomBound;
    }

    function syncMiniPlayerState() {
        if (!miniPlayerEl || !audioEl) return;

        const stationName = document.getElementById('station-name')?.textContent?.trim() || currentPlayerStation;
        const stationGenre = document.querySelector(`.station-card[data-station="${stationName}"]`)?.dataset?.genre || 'Live station programming';
        const artSrc = document.getElementById('playerArt')?.getAttribute('src') || stationArtworks[stationName] || stationArtworks.K101;

        if (miniPlayerStationEl) miniPlayerStationEl.textContent = stationName;
        if (miniPlayerTrackEl && !miniPlayerTrackEl.querySelector('.live-broadcast-text')) {
            const stationInfo = document.getElementById('station-info')?.textContent?.trim() || `Now playing ${stationName}`;
            miniPlayerTrackEl.textContent = stationInfo;
        }
        if (miniPlayerArtEl) miniPlayerArtEl.src = artSrc;

        if (miniLiveBroadcastPrimaryEl && miniLiveBroadcastSecondaryEl && miniLiveBroadcastTimeEl) {
            if (!currentNowPlayingTrack || currentNowPlayingTrack.stationName !== stationName) {
                miniLiveBroadcastPrimaryEl.textContent = `On Air - ${stationName}`;
                miniLiveBroadcastSecondaryEl.textContent = stationGenre;
                miniLiveBroadcastTimeEl.textContent = '';
            } else {
                const title = currentNowPlayingTrack.title || 'Live track';
                const artist = currentNowPlayingTrack.artist || 'Unknown artist';
                const durationSeconds = currentNowPlayingTrack.durationSeconds;
                const startedMs = currentNowPlayingTrack.programStartMs;
                miniLiveBroadcastPrimaryEl.textContent = title;
                miniLiveBroadcastSecondaryEl.textContent = artist;
                if (Number.isFinite(durationSeconds) && Number.isFinite(startedMs)) {
                    const elapsed = Math.max(0, Math.floor((Date.now() - startedMs) / 1000));
                    const boundedElapsed = Math.min(elapsed, durationSeconds);
                    miniLiveBroadcastTimeEl.textContent = `${formatSongTime(boundedElapsed)} / ${formatSongTime(durationSeconds)}`;
                } else {
                    miniLiveBroadcastTimeEl.textContent = '';
                }
            }
        }

        if (miniPlayerToggleEl) {
            const paused = audioEl.paused;
            miniPlayerToggleEl.textContent = paused ? '▶' : '⏸';
            miniPlayerToggleEl.setAttribute('aria-label', paused ? 'Play live stream' : 'Pause live stream');
        }

        if (miniPlayerVolumeEl) {
            const normalizedVolume = audioEl.muted ? 0 : Math.round((audioEl.volume || 0) * 100);
            if (Number(miniPlayerVolumeEl.value) !== normalizedVolume) {
                miniPlayerVolumeEl.value = String(normalizedVolume);
            }
            miniPlayerVolumeEl.setAttribute('aria-valuenow', String(normalizedVolume));
            syncSliderVisual(miniPlayerVolumeEl, normalizedVolume);
            updateSoundIconState(miniPlayerVolumeMuteEl, normalizedVolume);
            updateSoundIconState(playerVolumeMuteEl, normalizedVolume);

            if (playerVolumeEl && Number(playerVolumeEl.value) !== normalizedVolume) {
                playerVolumeEl.value = String(normalizedVolume);
            }
            if (playerVolumeEl) {
                playerVolumeEl.style.setProperty('--player-volume-fill', `${normalizedVolume}%`);
            }
        } else if (playerVolumeEl) {
            const normalizedVolume = audioEl.muted ? 0 : Math.round((audioEl.volume || 0) * 100);
            if (Number(playerVolumeEl.value) !== normalizedVolume) {
                playerVolumeEl.value = String(normalizedVolume);
            }
            playerVolumeEl.style.setProperty('--player-volume-fill', `${normalizedVolume}%`);
            updateSoundIconState(playerVolumeMuteEl, normalizedVolume);
            updateSoundIconState(miniPlayerVolumeMuteEl, normalizedVolume);
        }

        const canShowWhilePaused = !audioEl.paused || keepMiniVisibleWhenPaused;
        const shouldShowMini = hasMiniPlayerSession && Boolean(audioEl.currentSrc) && canShowWhilePaused && !isPlayerSectionVisible();
        miniPlayerEl.classList.toggle('show', shouldShowMini);

        if (shouldShowMini !== miniWasVisible) {
            if (shouldShowMini) {
                revealMiniPlayerFromIdle();
                scheduleMiniIdleFade();
            } else {
                clearMiniIdleFadeTimer();
                revealMiniPlayerFromIdle();
            }
        }
        miniWasVisible = shouldShowMini;
    }

    function parseProgramStartTimestamp(rawValue) {
        const raw = String(rawValue || '').trim();
        if (!raw) return null;

        const monthMap = {
            jan: 0,
            feb: 1,
            mar: 2,
            apr: 3,
            may: 4,
            jun: 5,
            jul: 6,
            aug: 7,
            sep: 8,
            oct: 9,
            nov: 10,
            dec: 11
        };

        const m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
        if (!m) {
            const fallback = new Date(raw).getTime();
            return Number.isFinite(fallback) ? fallback : null;
        }

        const day = Number(m[1]);
        const month = monthMap[m[2].toLowerCase()];
        const year = Number(m[3]);
        const hour = Number(m[4]);
        const minute = Number(m[5]);
        const second = Number(m[6]);

        if (!Number.isFinite(month)) return null;

        const asUtc = Date.UTC(year, month, day, hour, minute, second);
        const asLocal = new Date(year, month, day, hour, minute, second).getTime();
        const now = Date.now();

        // Prefer whichever parse is closest to the current clock, to avoid timezone drift.
        const utcDelta = Math.abs(now - asUtc);
        const localDelta = Math.abs(now - asLocal);
        return utcDelta <= localDelta ? asUtc : asLocal;
    }

    function parseNowPlayingFromXml(xmlText) {
        if (!xmlText) return null;
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'application/xml');
        if (doc.querySelector('parsererror')) return null;

        const firstSong = doc.querySelector('playHistory > song');
        if (!firstSong) return null;

        const title = (firstSong.querySelector('title')?.textContent || '').trim();
        const artist = (firstSong.querySelector('artist')?.textContent || '').trim();
        const cover = (firstSong.querySelector('cover')?.textContent || '').trim();
        const durationRaw = (firstSong.querySelector('duration')?.textContent || '').trim();
        const programStartRaw = (firstSong.querySelector('programStartTS')?.textContent || '').trim();

        const durationSeconds = Number(durationRaw);
        const programStartTime = parseProgramStartTimestamp(programStartRaw);

        return {
            title,
            artist,
            cover,
            durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
            programStartMs: Number.isFinite(programStartTime) ? programStartTime : null,
            programStartRaw
        };
    }

    function formatSongTime(totalSeconds) {
        const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
        const mins = Math.floor(safeSeconds / 60);
        const secs = safeSeconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    }

    function renderLiveBroadcastStack(primaryText, secondaryText, timeText) {
        const descEl = document.getElementById('liveBroadcastDescription');
        if (!descEl) return;

        const primary = String(primaryText || '').trim();
        const secondary = String(secondaryText || '').trim();
        const timeValue = String(timeText || '').trim();

        if (liveBroadcastPrimaryEl && liveBroadcastSecondaryEl && liveBroadcastTimeEl) {
            liveBroadcastPrimaryEl.textContent = primary || 'On Air';
            liveBroadcastSecondaryEl.textContent = secondary || 'Live station programming';
            liveBroadcastTimeEl.textContent = timeValue;

            if (miniLiveBroadcastPrimaryEl && miniLiveBroadcastSecondaryEl && miniLiveBroadcastTimeEl) {
                miniLiveBroadcastPrimaryEl.textContent = primary || 'On Air';
                miniLiveBroadcastSecondaryEl.textContent = secondary || 'Live station programming';
                miniLiveBroadcastTimeEl.textContent = timeValue;
            }
            return;
        }

        // Fallback for legacy markup if nested elements are unavailable.
        const combined = [primary, secondary, timeValue].filter(Boolean).join(' • ');
        descEl.textContent = combined || 'On Air';
    }

    function renderLiveBroadcastDescription(stationName, stationGenre) {
        const safeStation = String(stationName || '').trim() || 'Live';
        const safeGenre = String(stationGenre || '').trim() || 'Live station programming';

        if (!currentNowPlayingTrack || currentNowPlayingTrack.stationName !== stationName) {
            renderLiveBroadcastStack(`On Air - ${safeStation}`, safeGenre, '');
            return;
        }

        const title = currentNowPlayingTrack.title || 'Live track';
        const artist = currentNowPlayingTrack.artist || 'Unknown artist';
        const durationSeconds = currentNowPlayingTrack.durationSeconds;
        const startedMs = currentNowPlayingTrack.programStartMs;

        if (Number.isFinite(durationSeconds) && Number.isFinite(startedMs)) {
            const elapsed = Math.max(0, Math.floor((Date.now() - startedMs) / 1000));
            const boundedElapsed = Math.min(elapsed, durationSeconds);
            renderLiveBroadcastStack(title, artist, `${formatSongTime(boundedElapsed)} / ${formatSongTime(durationSeconds)}`);
            return;
        }

        renderLiveBroadcastStack(title, artist, '');
    }

    async function fetchNowPlayingFeed(stationName) {
        const feedUrl = stationNowPlayingFeeds[stationName];
        if (!feedUrl) return null;

        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
        const candidates = [feedUrl, proxyUrl];

        for (const candidate of candidates) {
            try {
                const text = await requestText(candidate, 5000);
                const parsed = parseNowPlayingFromXml(text);
                if (parsed) return parsed;
            } catch (error) {
                // Try next endpoint option.
            }
        }

        return null;
    }

    function parseNowPlayingFromStationPage(html, stationName) {
        const source = String(html || '');
        if (!source) return null;

        let title = '';
        let artist = '';
        let cover = '';

        const titleMatch = source.match(/<h2[^>]*>([^<]+)<\/h2>/i);
        if (titleMatch) title = titleMatch[1].trim();

        const artistMatch = source.match(/<p[^>]*class="[^"]*artist[^"]*"[^>]*>([^<]+)<\/p>/i)
            || source.match(/<h3[^>]*>([^<]+)<\/h3>/i);
        if (artistMatch) artist = artistMatch[1].trim();

        const coverMatch = source.match(/https?:\/\/cdnrf\.securenetsystems\.net\/file_radio\/album_art\/[^"'\s<]+/i);
        if (coverMatch) cover = coverMatch[0].trim();

        if (!title && !artist && !cover) return null;

        return {
            title,
            artist,
            cover,
            durationSeconds: null,
            programStartMs: null,
            programStartRaw: null,
            source: `${stationName} page`
        };
    }

    async function fetchNowPlayingFromStationPage(stationName) {
        const pageUrl = stationPageSources[stationName];
        if (!pageUrl) return null;

        const candidates = [
            `https://r.jina.ai/http://${pageUrl.replace(/^https?:\/\//, '')}`,
            pageUrl
        ];

        for (const candidate of candidates) {
            try {
                const html = await requestText(candidate, 5500);
                const parsed = parseNowPlayingFromStationPage(html, stationName);
                if (parsed) return parsed;
            } catch (error) {
                // Try next source option.
            }
        }

        return null;
    }

    async function lookupCoverArtByTrack(title, artist) {
        const safeTitle = String(title || '').trim();
        const safeArtist = String(artist || '').trim();
        if (!safeTitle && !safeArtist) return '';

        const cacheKey = `${safeArtist}__${safeTitle}`.toLowerCase();
        if (coverArtLookupCache.has(cacheKey)) {
            return coverArtLookupCache.get(cacheKey);
        }

        const term = encodeURIComponent(`${safeArtist} ${safeTitle}`.trim());
        const lookupUrl = `https://itunes.apple.com/search?term=${term}&entity=song&limit=1`;

        try {
            const payload = await requestText(lookupUrl, 4500);
            const parsed = JSON.parse(payload || '{}');
            const result = Array.isArray(parsed.results) ? parsed.results[0] : null;
            const artwork = result && result.artworkUrl100
                ? String(result.artworkUrl100).replace('100x100bb.jpg', '600x600bb.jpg')
                : '';

            coverArtLookupCache.set(cacheKey, artwork || '');
            return artwork || '';
        } catch (error) {
            coverArtLookupCache.set(cacheKey, '');
            return '';
        }
    }

    async function resolveNowPlayingCover(stationName, nowPlaying) {
        if (!nowPlaying) return '';

        const directCover = String(nowPlaying.cover || '').trim();
        if (directCover) return directCover;

        const lookedUpCover = await lookupCoverArtByTrack(nowPlaying.title, nowPlaying.artist);
        if (lookedUpCover) return lookedUpCover;

        return stationArtworks[stationName] || stationArtworks.K101;
    }

    async function refreshNowPlayingForStation(stationName, stationGenre) {
        let nowPlaying = await fetchNowPlayingFeed(stationName);
        if (!nowPlaying || (!nowPlaying.title && !nowPlaying.artist)) {
            const pageNowPlaying = await fetchNowPlayingFromStationPage(stationName);
            if (pageNowPlaying) nowPlaying = pageNowPlaying;
        }
        const stationInfoEl = document.getElementById('station-info');
        if (!stationInfoEl) return;

        if (nowPlaying) {
            const playerArtEl = document.getElementById('playerArt');
            const coverArt = await resolveNowPlayingCover(stationName, nowPlaying);
            if (playerArtEl) {
                playerArtEl.src = coverArt;
                playerArtEl.alt = `${stationName} now playing artwork`;
            }
        } else {
            updatePlayerArt(stationName);
        }

        if (nowPlaying && (nowPlaying.title || nowPlaying.artist)) {
            const canSwitchTrack = shouldCommitTrackUpdate(stationName, nowPlaying);
            if (!canSwitchTrack) {
                renderLiveBroadcastDescription(stationName, stationGenre);
                syncMiniPlayerState();
                return;
            }

            currentNowPlayingTrack = {
                stationName,
                title: nowPlaying.title,
                artist: nowPlaying.artist,
                durationSeconds: nowPlaying.durationSeconds,
                programStartMs: nowPlaying.programStartMs,
                programStartRaw: nowPlaying.programStartRaw
            };

            const titlePart = nowPlaying.title || 'Live audio';
            const artistPart = nowPlaying.artist ? ` - ${nowPlaying.artist}` : '';
            stationInfoEl.textContent = `Now playing ${stationName}: ${titlePart}${artistPart}`;
            renderLiveBroadcastDescription(stationName, stationGenre);
            syncMiniPlayerState();
            return;
        }

        currentNowPlayingTrack = null;
        stationInfoEl.textContent = `Now playing ${stationName} - ${stationGenre || 'Live stream'}`;
        renderLiveBroadcastDescription(stationName, stationGenre);

        syncMiniPlayerState();
    }

    function scrollToPlayerNowPlaying() {
        const playerSection = document.getElementById('player');
        const stationNameEl = document.getElementById('station-name');
        const headerEl = document.querySelector('header');
        const headerHeight = headerEl ? headerEl.offsetHeight : 0;

        if (!playerSection) return;

        const targetEl = stationNameEl || playerSection;
        const rectTop = targetEl.getBoundingClientRect().top;
        const absoluteTop = window.scrollY + rectTop;
        const targetTop = Math.max(0, absoluteTop - headerHeight - 20);
        window.scrollTo(0, targetTop);
    }

    // Station Selection - Update player when clicking Listen Live
    document.querySelectorAll('.listen-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const station = btn.closest('.station-card');
            if (!station) return;
            const stationName = station.dataset.station;
            const stationGenre = station.dataset.genre;
            const sourceEl = audioEl ? audioEl.querySelector('source') : null;
            hasMiniPlayerSession = true;
            scrollToPlayerNowPlaying();
            
            // Update player display
            currentPlayerStation = stationName;
            document.getElementById('station-name').textContent = stationName;
            document.getElementById('station-info').textContent = `Now playing ${stationName} - ${stationGenre}`;
            updatePlayerArt(stationName);
            renderLiveBroadcastDescription(stationName, stationGenre);
            refreshNowPlayingForStation(stationName, stationGenre);

            const streamUrl = stationStreams[stationName];
            if (audioEl && sourceEl && streamUrl) {
                sourceEl.src = streamUrl;
                audioEl.load();
                audioEl.play().catch(() => {
                    // Keep controls available if browser blocks immediate playback.
                });
            }
        });
    });

    updatePlayerArt('K101');
    syncMiniPlayerState();

    if (audioEl) {
        ['ended', 'emptied', 'stalled', 'waiting', 'playing', 'volumechange'].forEach(eventName => {
            audioEl.addEventListener(eventName, () => {
                syncMiniPlayerState();
                persistCrossPagePlayerState(!audioEl.paused);
            });
        });
        audioEl.addEventListener('play', () => {
            hasMiniPlayerSession = true;
            keepMiniVisibleWhenPaused = false;
            pauseTriggeredByMiniToggle = false;
            syncMiniPlayerState();
            persistCrossPagePlayerState(true);
        });
        audioEl.addEventListener('pause', () => {
            const isTransientNavigationPause = pageIsNavigatingAway || document.visibilityState === 'hidden';
            if (!pauseTriggeredByMiniToggle) {
                keepMiniVisibleWhenPaused = false;
            }
            pauseTriggeredByMiniToggle = false;
            syncMiniPlayerState();
            if (!isTransientNavigationPause) {
                persistCrossPagePlayerState(false);
            }
        });
    }

    window.addEventListener('beforeunload', () => {
        pageIsNavigatingAway = true;
    });
    window.addEventListener('pagehide', () => {
        pageIsNavigatingAway = true;
    });

    if (miniPlayerToggleEl && audioEl) {
        miniPlayerToggleEl.addEventListener('click', (e) => {
            e.stopPropagation();
            revealMiniPlayerFromIdle();
            scheduleMiniIdleFade();
            if (audioEl.paused) {
                keepMiniVisibleWhenPaused = false;
                pauseTriggeredByMiniToggle = false;
                audioEl.play().catch(() => {
                    // Keep controls responsive if autoplay is restricted.
                });
            } else {
                keepMiniVisibleWhenPaused = true;
                pauseTriggeredByMiniToggle = true;
                audioEl.pause();
            }
            syncMiniPlayerState();
        });
    }

    if (miniPlayerVolumeEl && audioEl) {
        const updateAudioVolume = (rawValue) => {
            setAudioVolumePercent(rawValue);
        };

        // Block slider pointer/click bubbling so it never triggers mini-player scroll navigation.
        ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach(eventName => {
            miniPlayerVolumeEl.addEventListener(eventName, (e) => {
                e.stopPropagation();
            });
        });

        miniPlayerVolumeEl.addEventListener('input', (e) => {
            e.stopPropagation();
            updateAudioVolume(miniPlayerVolumeEl.value);
        });

        miniPlayerVolumeEl.addEventListener('change', (e) => {
            e.stopPropagation();
            updateAudioVolume(miniPlayerVolumeEl.value);
        });

        if (playerVolumeEl) {
            playerVolumeEl.addEventListener('input', () => {
                updateAudioVolume(playerVolumeEl.value);
            });

            playerVolumeEl.addEventListener('change', () => {
                updateAudioVolume(playerVolumeEl.value);
            });
        }
    } else if (playerVolumeEl && audioEl) {
        const updateAudioVolume = () => {
            setAudioVolumePercent(playerVolumeEl.value);
        };

        playerVolumeEl.addEventListener('input', updateAudioVolume);
        playerVolumeEl.addEventListener('change', updateAudioVolume);
    }

    function toggleQuickMute() {
        if (!audioEl) return;
        const currentlyMuted = audioEl.muted || Number(audioEl.volume || 0) <= 0;
        if (currentlyMuted) {
            audioEl.muted = false;
            audioEl.volume = Math.max(0.08, lastNonZeroVolume || 0.5);
        } else {
            if (Number(audioEl.volume || 0) > 0) {
                lastNonZeroVolume = Number(audioEl.volume || 1);
            }
            audioEl.muted = true;
        }
        syncMiniPlayerState();
    }

    if (miniPlayerVolumeMuteEl) {
        miniPlayerVolumeMuteEl.addEventListener('click', (e) => {
            e.stopPropagation();
            revealMiniPlayerFromIdle();
            scheduleMiniIdleFade();
            toggleQuickMute();
        });
    }

    if (playerVolumeMuteEl) {
        playerVolumeMuteEl.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleQuickMute();
        });
    }

    window.addEventListener('keydown', (e) => {
        if (!audioEl) return;
        const target = e.target;
        const tagName = target && target.tagName ? String(target.tagName).toUpperCase() : '';
        const isTypingContext = (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT')
            || Boolean(target && target.isContentEditable);
        if (isTypingContext) return;

        const key = String(e.key || '');
        const code = String(e.code || '');
        if (key === 'AudioVolumeUp' || code === 'AudioVolumeUp') {
            e.preventDefault();
            adjustAudioVolumeByStep(VOLUME_STEP_PERCENT);
            return;
        }
        if (key === 'AudioVolumeDown' || code === 'AudioVolumeDown') {
            e.preventDefault();
            adjustAudioVolumeByStep(-VOLUME_STEP_PERCENT);
            return;
        }
        if (key === 'AudioVolumeMute' || code === 'AudioVolumeMute') {
            e.preventDefault();
            toggleQuickMute();
        }
    });

    if (miniPlayerEl) {
        miniPlayerEl.addEventListener('click', (e) => {
            revealMiniPlayerFromIdle();
            scheduleMiniIdleFade();
            const shouldNavigate = Boolean(
                e.target.closest('.mini-player-art-wrap') ||
                e.target.closest('.mini-player-station') ||
                e.target.closest('.mini-player-track')
            );
            if (shouldNavigate) {
                scrollToPlayerNowPlaying();
            }
        });
    }

    window.addEventListener('scroll', () => {
        markMiniScrollActivity();
        syncMiniPlayerState();
    }, { passive: true });
    window.addEventListener('wheel', markMiniScrollActivity, { passive: true });
    window.addEventListener('touchmove', markMiniScrollActivity, { passive: true });
    window.addEventListener('resize', syncMiniPlayerState);

    restoreCrossPagePlayerStateOnHome();
    reloadListenLivePanelOnHomeReturn();
    refreshNowPlayingForStation('K101', "Today's Best Country");
    setInterval(() => {
        const stationCard = document.querySelector(`.station-card[data-station="${currentPlayerStation}"]`);
        const stationGenre = stationCard ? stationCard.dataset.genre : 'Live stream';
        refreshNowPlayingForStation(currentPlayerStation, stationGenre);
    }, 30000);
    setInterval(() => {
        const stationCard = document.querySelector(`.station-card[data-station="${currentPlayerStation}"]`);
        const stationGenre = stationCard ? stationCard.dataset.genre : 'Live stream';
        renderLiveBroadcastDescription(currentPlayerStation, stationGenre);
        syncMiniPlayerState();
    }, 1000);

    // Contact Form Handler
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showSiteToast('Thank you for your message! We will get back to you soon.', 'success');
            contactForm.reset();
        });
    }

    // Watch Now access flow used by card button and nav tab links.
    const youtubeChannelId = 'UCZ5Q3ccVL6l93Oq3qPnnxBg';
    const latestLiveGamesUrl = `https://www.youtube.com/channel/${youtubeChannelId}/live`;
    const allVideosUrl = 'https://www.youtube.com/@mcalesterradio/videos';
    const fallbackPreviewVideoUrl = 'https://www.youtube.com/watch?v=BBjSrcLbe2U';
    const youtubeFeedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${youtubeChannelId}`;
    let latestRecordedGameUrl = allVideosUrl;
    let latestRecordedGameVideoId = getYouTubeVideoId(fallbackPreviewVideoUrl);

    function getPlayableStreamUrl(url = latestLiveGamesUrl) {
        return url.includes('?')
            ? `${url}&autoplay=1`
            : `${url}?autoplay=1`;
    }

    function getYouTubeVideoId(url) {
        if (!url) return '';
        const match = String(url).match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : '';
    }

    function setPreviewThumbnailById(elementId, videoId) {
        const previewEl = document.getElementById(elementId);
        if (!previewEl || !videoId) return;

        const previewUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        previewEl.style.backgroundImage =
            `linear-gradient(180deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.5)), url('${previewUrl}')`;
        previewEl.classList.add('has-preview');
    }

    function setLivePreviewThumbnail(videoId) {
        setPreviewThumbnailById('livePreviewThumbnail', videoId || latestRecordedGameVideoId);
    }

    function setHighlightsPreviewThumbnail(videoId) {
        setPreviewThumbnailById('highlightsPreviewThumbnail', videoId || latestRecordedGameVideoId);
    }

    function formatPublishedDate(dateText) {
        if (!dateText) return 'recently';
        const parsed = new Date(dateText);
        if (Number.isNaN(parsed.getTime())) return 'recently';
        return parsed.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function parseYouTubeFeed(xmlText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'application/xml');
        if (doc.querySelector('parsererror')) return null;

        const getNodeText = (entry, nodeName) => {
            const byName = entry.getElementsByTagName(nodeName)[0];
            if (byName && byName.textContent) return byName.textContent.trim();

            const byNs = entry.getElementsByTagNameNS('*', nodeName)[0];
            return byNs && byNs.textContent ? byNs.textContent.trim() : '';
        };

        const entries = Array.from(doc.querySelectorAll('entry')).map(entry => {
            const title = getNodeText(entry, 'title');
            const published = getNodeText(entry, 'published');
            const videoId = getNodeText(entry, 'videoId');
            const link = entry.querySelector('link')?.getAttribute('href') || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '');
            return { title, published, videoId, link };
        }).filter(item => item.title && item.link);

        if (entries.length === 0) return null;

        const gamePattern = /(football|basketball|baseball|softball|soccer|volleyball|wrestling|game|vs\.?|buffaloes|lady buffs?|playoffs?|state)/i;
        const latestGame = entries.find(item => gamePattern.test(item.title)) || entries[0];

        return {
            latestGame
        };
    }

    async function requestText(url, timeoutMs = 6000) {
        if (typeof fetch === 'function') {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const response = await fetch(url, {
                    cache: 'no-store',
                    signal: controller.signal,
                    headers: {
                        Accept: 'text/html, text/plain;q=0.9, */*;q=0.8'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                return await response.text();
            } finally {
                clearTimeout(timeoutId);
            }
        }

        return await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.timeout = timeoutMs;
            xhr.setRequestHeader('Accept', 'text/html, text/plain;q=0.9, */*;q=0.8');

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.responseText || '');
                } else {
                    reject(new Error(`HTTP ${xhr.status}`));
                }
            };

            xhr.onerror = () => reject(new Error('Network error'));
            xhr.ontimeout = () => reject(new Error('Request timeout'));
            xhr.send();
        });
    }

    async function fetchYouTubeGamesFeed() {
        const proxyUrls = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(youtubeFeedUrl)}`,
            `https://r.jina.ai/http://${youtubeFeedUrl.replace(/^https?:\/\//, '')}`
        ];

        for (const url of proxyUrls) {
            try {
                const text = await requestText(url, 6000);
                if (!text || text.length < 100) continue;

                const parsed = parseYouTubeFeed(text);
                if (!parsed || !parsed.latestGame) continue;

                const latest = parsed.latestGame;
                latestRecordedGameUrl = latest.link;
                latestRecordedGameVideoId = latest.videoId || latestRecordedGameVideoId;

                const liveTitleEl = document.getElementById('watchLiveTitle');
                const liveMetaEl = document.getElementById('watchLiveMeta');
                const highlightsTitleEl = document.getElementById('watchHighlightsTitle');
                const highlightsMetaEl = document.getElementById('watchHighlightsMeta');

                if (liveTitleEl) liveTitleEl.textContent = 'Live Games (Channel Stream)';
                if (liveMetaEl) liveMetaEl.textContent = 'Live game coverage from McAlester Radio YouTube channel.';
                if (highlightsTitleEl) highlightsTitleEl.textContent = latest.title;
                if (highlightsMetaEl) highlightsMetaEl.textContent = `Latest recorded game • ${formatPublishedDate(latest.published)}`;

                setLivePreviewThumbnail(latestRecordedGameVideoId);
                setHighlightsPreviewThumbnail(latestRecordedGameVideoId);
                return;
            } catch (error) {
                // Continue trying alternate proxy endpoints.
            }
        }

        const liveMetaEl = document.getElementById('watchLiveMeta');
        const highlightsMetaEl = document.getElementById('watchHighlightsMeta');
        if (liveMetaEl) {
            liveMetaEl.textContent = 'Live game coverage from McAlester Radio YouTube channel.';
        }
        if (highlightsMetaEl) {
            highlightsMetaEl.textContent = 'Latest recorded game from McAlester Radio YouTube channel.';
        }

        setLivePreviewThumbnail(latestRecordedGameVideoId);
        setHighlightsPreviewThumbnail(latestRecordedGameVideoId);
    }

    function startGameBannerClock() {
        const localTimeEl = document.getElementById('gameLocalTime');
        if (!localTimeEl) return;

        const update = () => {
            const now = new Date();
            localTimeEl.textContent = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        };

        update();
        setInterval(update, 1000);
    }

    startGameBannerClock();

    function setTextIfChanged(el, text) {
        if (!el) return;
        const next = String(text ?? '');
        if (el.textContent !== next) {
            el.textContent = next;
        }
    }

    function setGameStateBadge(stateType, labelText) {
        const stateEl = document.getElementById('gameState');
        if (!stateEl) return;

        const normalizedType = stateType || 'live';
        if (!stateEl.classList.contains(normalizedType)) {
            stateEl.classList.remove('live', 'ended', 'scheduled');
            stateEl.classList.add(normalizedType);
        }

        setTextIfChanged(stateEl, labelText || 'LIVE');
    }

    function updateTickerFromFeed(message) {
        const tickerTrack = document.getElementById('scoreTickerTrack');
        if (!tickerTrack || !message) return;

        const safeText = String(message).trim();
        if (!safeText) return;

        if (tickerTrack.dataset.tickerMessage === safeText) {
            return;
        }

        const sequence = [
            'Game Feed:',
            safeText,
            'Game Center',
            safeText,
            'Game Feed:',
            safeText
        ];

        const seamlessItems = sequence.concat(sequence);
        const existingSpans = Array.from(tickerTrack.querySelectorAll('span'));

        if (existingSpans.length === seamlessItems.length) {
            for (let i = 0; i < seamlessItems.length; i += 1) {
                setTextIfChanged(existingSpans[i], seamlessItems[i]);
            }
        } else {
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < seamlessItems.length; i += 1) {
                const span = document.createElement('span');
                span.textContent = seamlessItems[i];
                fragment.appendChild(span);
            }
            tickerTrack.replaceChildren(fragment);
        }

        tickerTrack.dataset.tickerMessage = safeText;
    }

    function updateGameDateDisplay(dateText) {
        const gameDateEl = document.getElementById('gameDate');
        if (!gameDateEl) return;

        if (!dateText) {
            const today = new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            setTextIfChanged(gameDateEl, `Game Date: ${today}`);
            return;
        }

        setTextIfChanged(gameDateEl, `Game Date: ${dateText}`);
    }

    function parseMaxPrepsSnapshot(text) {
        const normalized = String(text || '').replace(/\s+/g, ' ').trim();
        const lower = normalized.toLowerCase();

        const snapshot = {
            stateType: 'live',
            stateLabel: 'LIVE',
            clockText: null,
            homeScore: null,
            awayScore: null,
            tickerText: null,
            gameDate: null
        };

        if (/\b(final|ended|game over)\b/.test(lower)) {
            snapshot.stateType = 'ended';
            snapshot.stateLabel = 'ENDED';
            snapshot.clockText = 'Final';
            snapshot.tickerText = 'Game ended: final status reported from the live stats feed.';
        } else if (/\b(scheduled|preview|upcoming|pregame)\b/.test(lower)) {
            snapshot.stateType = 'scheduled';
            snapshot.stateLabel = 'SCHEDULED';
            snapshot.tickerText = 'Upcoming matchup: schedule info reported from the live stats feed.';
        }

        const scoreMatch = normalized.match(
            /mcalester(?:\s+buffaloes)?[^\d]{0,50}(\d{1,2})[^\d]{0,30}(\d{1,2})[^\da-z]{0,20}(?:collinsville|cardinals)/i
        ) || normalized.match(/\b(\d{1,2})\s*[-:]\s*(\d{1,2})\b/);

        if (scoreMatch) {
            snapshot.homeScore = scoreMatch[1];
            snapshot.awayScore = scoreMatch[2];
        }

        const quarterMatch = normalized.match(/\b(Q[1-4]|OT|HALF)\b[^\d]{0,8}(\d{1,2}:\d{2})/i);
        if (quarterMatch) {
            snapshot.clockText = `${quarterMatch[1].toUpperCase()} ${quarterMatch[2]}`;
        }

        const datePatterns = [
            /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},\s+\d{4}\b/i,
            /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/
        ];

        for (const pattern of datePatterns) {
            const match = normalized.match(pattern);
            if (match) {
                snapshot.gameDate = match[0];
                break;
            }
        }

        return snapshot;
    }

    function parseDateValue(dateText) {
        if (!dateText) return null;
        const parsed = new Date(dateText);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    function formatResultSnippet(text) {
        const compact = String(text || '')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            .replace(/\[([^\]]+)\]\(https?:\/\/\S+/g, '$1')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/[\[\]\(\)]/g, '')
            .replace(/^\d+\.?\s*/, '')
            .replace(/\s+/g, ' ')
            .trim();
        if (compact.length <= 170) return compact;
        return `${compact.slice(0, 167)}...`;
    }

    function extractOpponentName(resultText) {
        const plain = String(resultText || '').replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
        const againstMatch = plain.match(/\bagainst\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/i);
        if (againstMatch) return againstMatch[1].trim();

        const versusMatch = plain.match(/\b(?:vs\.?|versus)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/i);
        if (versusMatch) return versusMatch[1].trim();

        const cleaned = String(resultText || '')
            .replace(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4}\b/gi, ' ')
            .replace(/\bMcAlester(?:\s+Buffaloes)?\b/gi, ' ')
            .replace(/\b\d{1,3}\s*[-:]\s*\d{1,3}\b/g, ' ')
            .replace(/\b(Final|Ended|W|L|OT|Scheduled|Preview|District|Overall)\b/gi, ' ')
            .replace(/[^A-Za-z\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleaned) return 'Opponent';
        return cleaned.split(' ').slice(0, 3).join(' ');
    }

    function extractMaxPrepsSummary(text, sourceLabel = 'General') {
        const normalized = String(text || '').replace(/\s+/g, ' ').trim();
        const summary = {
            overallRecord: null,
            districtRecord: null,
            recentResults: [],
            statSnippets: [],
            recentGames: []
        };

        const overallMatch = normalized.match(/overall[^\d]{0,30}(\d{1,2}-\d{1,2})/i);
        if (overallMatch) summary.overallRecord = overallMatch[1];

        const districtMatch = normalized.match(/district[^\d]{0,35}(\d{1,2}-\d{1,2})/i);
        if (districtMatch) summary.districtRecord = districtMatch[1];

        const dateRegex = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4}\b/gi;
        const scoreRegex = /\b\d{1,2}\s*[-:]\s*\d{1,2}\b/;
        let dateMatch;

        while ((dateMatch = dateRegex.exec(normalized)) && summary.recentGames.length < 8) {
            const start = Math.max(0, dateMatch.index - 15);
            const chunk = normalized.slice(start, dateMatch.index + 220).replace(/\s+/g, ' ').trim();
            const scoreMatch = chunk.match(/\b(\d{1,3})\s*[-:]\s*(\d{1,3})\b/);
            if (scoreMatch) {
                const resultText = formatResultSnippet(chunk);
                summary.recentGames.push({
                    sportLabel: sourceLabel,
                    dateText: dateMatch[0],
                    parsedDate: parseDateValue(dateMatch[0]),
                    resultText,
                    mcalesterScore: scoreMatch[1],
                    opponentScore: scoreMatch[2],
                    opponentName: extractOpponentName(chunk)
                });
            }
        }

        const statRegex = /\b[^.]{0,30}(passing|rushing|receiving|points|rebounds|assists|yards|tackles)[^.]{0,80}\b/gi;
        let statMatch;
        while ((statMatch = statRegex.exec(normalized)) && summary.statSnippets.length < 3) {
            const cleaned = statMatch[0].replace(/\s+/g, ' ').trim();
            if (cleaned.length > 12) summary.statSnippets.push(cleaned);
        }

        summary.recentResults = summary.recentGames.slice(0, 3).map(game => game.resultText);
        return summary;
    }

    function mergeMaxPrepsSummaries(summaries) {
        const merged = {
            overallRecord: null,
            districtRecord: null,
            recentResults: [],
            statSnippets: [],
            recentGames: []
        };

        const statSeen = new Set();
        const gameSeen = new Set();

        summaries.forEach(summary => {
            if (!merged.overallRecord && summary.overallRecord) merged.overallRecord = summary.overallRecord;
            if (!merged.districtRecord && summary.districtRecord) merged.districtRecord = summary.districtRecord;

            summary.statSnippets.forEach(snippet => {
                const key = snippet.toLowerCase();
                if (!statSeen.has(key) && merged.statSnippets.length < 3) {
                    statSeen.add(key);
                    merged.statSnippets.push(snippet);
                }
            });

            summary.recentGames.forEach(game => {
                const key = `${game.dateText}|${game.resultText}`.toLowerCase();
                if (!gameSeen.has(key)) {
                    gameSeen.add(key);
                    merged.recentGames.push(game);
                }
            });
        });

        merged.recentGames.sort((a, b) => {
            if (!a.parsedDate && !b.parsedDate) return 0;
            if (!a.parsedDate) return 1;
            if (!b.parsedDate) return -1;
            return b.parsedDate.getTime() - a.parsedDate.getTime();
        });

        merged.recentResults = merged.recentGames.slice(0, 3).map(game => game.resultText);
        return merged;
    }

    function applyRecentGameToBanner(game) {
        if (!game) return;

        const homeNameEl = document.getElementById('homeTeamName');
        const awayNameEl = document.getElementById('awayTeamName');
        const awayRecordEl = document.getElementById('awayTeamRecord');

        if (homeNameEl) homeNameEl.textContent = 'McAlester';
        if (awayNameEl) awayNameEl.textContent = game.opponentName || 'Opponent';
        if (awayRecordEl) awayRecordEl.textContent = game.sportLabel || 'Visitor';
    }

    function updateMaxPrepsCards(summary, sourcesCount = 1) {
        const overallEl = document.getElementById('overallRecordPill');
        const districtEl = document.getElementById('districtRecordPill');
        const subtitleEl = document.getElementById('scoreboardSubtitle');
        const homeRecordEl = document.getElementById('homeTeamRecord');
        const resultsListEl = document.getElementById('recentResultsList');
        const statsListEl = document.getElementById('recentStatsList');

        if (overallEl && summary.overallRecord) {
            overallEl.textContent = `Overall: ${summary.overallRecord}`;
        }

        if (districtEl && summary.districtRecord) {
            districtEl.textContent = `District: ${summary.districtRecord}`;
        }

        if (homeRecordEl && (summary.overallRecord || summary.districtRecord)) {
            const overall = summary.overallRecord || '--';
            const district = summary.districtRecord || '--';
            homeRecordEl.textContent = `${overall} • District ${district}`;
        }

        if (subtitleEl) {
            const stamp = new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            subtitleEl.textContent = `McAlester Games • Live stats update ${stamp} from ${sourcesCount} sport pages`;
        }

        if (resultsListEl && summary.recentResults.length) {
            resultsListEl.innerHTML = '';
            summary.recentResults.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                resultsListEl.appendChild(li);
            });
        }

        if (statsListEl && summary.statSnippets.length) {
            statsListEl.innerHTML = '';
            summary.statSnippets.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                statsListEl.appendChild(li);
            });
        }
    }

    async function fetchMaxPrepsBannerData() {
        const banner = document.getElementById('gameScoreBanner');
        if (!banner) return;

        const sourceUrl = banner.dataset.scoreSourceUrl;
        if (!sourceUrl) return;

        async function fetchMaxPrepsTextForUrl(targetUrl) {
            const proxyUrls = [
                `https://r.jina.ai/http://${targetUrl.replace(/^https?:\/\//, '')}`,
                `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
            ];

            for (const url of proxyUrls) {
                try {
                    const candidate = await requestText(url, 4500);
                    if (candidate && candidate.length > 200) {
                        return candidate;
                    }
                } catch (error) {
                    // Try the next proxy endpoint.
                }
            }

            return '';
        }

        const normalizedBase = sourceUrl.replace(/\/+$/, '');
        const sportPaths = ['football', 'basketball', 'baseball', 'softball', 'soccer', 'volleyball'];
        const targetUrls = [
            normalizedBase,
            ...sportPaths.map(path => `${normalizedBase}/${path}/`)
        ];

        const sourceResponses = await Promise.all(
            targetUrls.map(async url => ({
                url,
                text: await fetchMaxPrepsTextForUrl(url)
            }))
        );

        const validSources = sourceResponses.filter(item => item.text && item.text.length > 200);
        const fetchedText = validSources.sort((a, b) => b.text.length - a.text.length)[0]?.text || '';

        if (!fetchedText) {
            updateGameDateDisplay(null);
            updateTickerFromFeed('Live stats feed is unavailable right now. Showing last known game details.');
            return;
        }

        const snapshot = parseMaxPrepsSnapshot(fetchedText);
        const summaries = validSources.map(source => {
            const sportLabel = source.url
                .replace(normalizedBase, '')
                .replaceAll('/', '')
                .trim() || 'General';
            return extractMaxPrepsSummary(source.text, sportLabel.charAt(0).toUpperCase() + sportLabel.slice(1));
        });
        const summary = mergeMaxPrepsSummaries(summaries);
        const latestGame = summary.recentGames[0];

        if (latestGame) {
            snapshot.homeScore = latestGame.mcalesterScore || snapshot.homeScore;
            snapshot.awayScore = latestGame.opponentScore || snapshot.awayScore;
            snapshot.gameDate = latestGame.dateText || snapshot.gameDate;
            snapshot.stateType = 'ended';
            snapshot.stateLabel = 'ENDED';
            snapshot.clockText = 'Final';
            snapshot.tickerText = `${latestGame.sportLabel} update: ${latestGame.resultText}`;
        }

        setGameStateBadge(snapshot.stateType, snapshot.stateLabel);
        updateGameDateDisplay(snapshot.gameDate);
        updateMaxPrepsCards(summary, validSources.length);
        applyRecentGameToBanner(latestGame);

        if (snapshot.clockText) {
            const gameClockEl = document.getElementById('gameClock');
            setTextIfChanged(gameClockEl, snapshot.clockText);
        }

        if (snapshot.homeScore) {
            const homeEl = document.getElementById('homeScore');
            setTextIfChanged(homeEl, snapshot.homeScore);
        }

        if (snapshot.awayScore) {
            const awayEl = document.getElementById('awayScore');
            setTextIfChanged(awayEl, snapshot.awayScore);
        }

        const stamp = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        updateTickerFromFeed(snapshot.tickerText || `Live update synced at ${stamp}.`);
    }

    function startContinuousContentUpdates() {
        const cadence = {
            youtubeMs: 180000,
            scoreboardMs: 90000,
            fullSyncMs: 600000
        };

        let youtubeInFlight = false;
        let scoreboardInFlight = false;

        const runYouTubeSync = async (force = false) => {
            if (youtubeInFlight && !force) return;
            youtubeInFlight = true;
            try {
                await fetchYouTubeGamesFeed();
            } finally {
                youtubeInFlight = false;
            }
        };

        const runScoreboardSync = async (force = false) => {
            if (scoreboardInFlight && !force) return;
            scoreboardInFlight = true;
            try {
                await fetchMaxPrepsBannerData();
            } finally {
                scoreboardInFlight = false;
            }
        };

        const runFullSync = async (force = false) => {
            await Promise.all([
                runYouTubeSync(force),
                runScoreboardSync(force)
            ]);
        };

        // Start with an immediate full sync, then keep data continuously fresh.
        runFullSync(true);
        setInterval(() => {
            runYouTubeSync();
        }, cadence.youtubeMs);
        setInterval(() => {
            runScoreboardSync();
        }, cadence.scoreboardMs);
        setInterval(() => {
            runFullSync(true);
        }, cadence.fullSyncMs);

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                runFullSync(true);
            }
        });

        window.addEventListener('online', () => {
            runFullSync(true);
        });
    }

    startContinuousContentUpdates();

    function openWatchSubscriptionsModal(messageText) {
        const accessMessageEl = document.getElementById('subscriptionsAccessMessage');
        if (accessMessageEl) {
            accessMessageEl.classList.remove('payment-shortcut-enabled');
            accessMessageEl.removeAttribute('role');
            accessMessageEl.removeAttribute('tabindex');
            accessMessageEl.removeAttribute('title');
        }
        clearFormMessage('subscriptionsAccessMessage');
        if (messageText) {
            setFormMessage('subscriptionsAccessMessage', messageText, 'info');
        }
        document.getElementById('subscriptionsModal').classList.add('active');
    }

    function showPlanNeedsPaymentMessage(tierName) {
        const accessMessageEl = document.getElementById('subscriptionsAccessMessage');
        setFormMessage(
            'subscriptionsAccessMessage',
            'Add payment.',
            'error'
        );
        if (accessMessageEl) {
            accessMessageEl.classList.add('payment-shortcut-enabled');
            accessMessageEl.setAttribute('role', 'button');
            accessMessageEl.setAttribute('tabindex', '0');
            accessMessageEl.setAttribute('title', 'Click to add payment method');
        }
        document.getElementById('subscriptionsModal').classList.add('active');
    }

    function openAddPaymentShortcutFromSubscriptions() {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!currentUser) {
            showSiteToast('Please sign in first.', 'info');
            document.getElementById('signInModal').classList.add('active');
            return;
        }

        const tierName = currentUser.subscriptionTier
            ? currentUser.subscriptionTier.charAt(0).toUpperCase() + currentUser.subscriptionTier.slice(1)
            : 'Your Plan';
        const packageNameEl = document.getElementById('paymentPackageName');
        if (packageNameEl) packageNameEl.textContent = tierName;

        document.getElementById('subscriptionsModal').classList.remove('active');
        const profileTriggerEl = document.getElementById('profileNavBtn') || document.getElementById('userNameDisplay') || document.getElementById('profileMenuItem');
        if (profileTriggerEl) profileTriggerEl.click();

        setTimeout(() => {
            setFormMessage('paymentMessage', 'Add payment.', 'error');
            document.getElementById('paymentModal').classList.add('active');
        }, 220);
    }

    function openLiveStream() {
        window.open(getPlayableStreamUrl(), '_blank', 'noopener');
    }

    function openHighlightsStream() {
        const url = latestRecordedGameUrl;
        const isSingleVideo = /youtube\.com\/watch\?v=|youtu\.be\//i.test(url);
        window.open(isSingleVideo ? getPlayableStreamUrl(url) : url, '_blank', 'noopener');
    }

    function handleWatchAccess(onOpenStream) {
        let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

        // Use latest account data so watch-access checks are always current.
        if (currentUser && currentUser.email) {
            const accounts = JSON.parse(localStorage.getItem('radioAccounts')) || [];
            const refreshed = accounts.find(acc => acc.email === currentUser.email);
            if (refreshed) {
                currentUser = refreshed;
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
        }

        if (currentUser && isStreamingActive(currentUser)) {
            onOpenStream();
            return;
        }

        // Check if user is logged in with a selected subscription
        if (currentUser && currentUser.subscriptionTier) {
            // User has a plan but not fully activated streaming yet.
            const tierName = currentUser.subscriptionTier.charAt(0).toUpperCase() + currentUser.subscriptionTier.slice(1);
            showPlanNeedsPaymentMessage(tierName);
        } else if (currentUser) {
            // User is logged in but has no plan selected.
            openWatchSubscriptionsModal('Choose your access plan to watch live streams.');
        } else {
            // User not logged in.
            openWatchSubscriptionsModal('Sign in and choose your access plan to watch live streams.');
        }
    }

    function handleWatchNowAccess() {
        if (!STREAMING_FEATURE_ENABLED) {
            showSiteToast('Live streaming is temporarily disabled.', 'info', 3000);
            return;
        }
        handleWatchAccess(openLiveStream);
    }

    function handleHighlightsAccess() {
        handleWatchAccess(openHighlightsStream);
    }

    if (isIndexPage) {
        document.querySelectorAll('.watch-btn:not(.watch-highlight-btn)').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                handleWatchNowAccess();
            });
        });

        document.querySelectorAll('.watch-highlight-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                handleHighlightsAccess();
            });
        });

        // Make the play icon/thumbnail use the same gated watch flow.
        document.querySelectorAll('.sports-thumbnail-live').forEach(trigger => {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                handleWatchNowAccess();
            });
        });

        document.querySelectorAll('.sports-thumbnail-highlights').forEach(trigger => {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                handleHighlightsAccess();
            });
        });

        // Make header/hero Watch Now links trigger the same popup/paywall flow.
        document.querySelectorAll('.watch-now-trigger').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                if (!STREAMING_FEATURE_ENABLED) {
                    showSiteToast('Live streaming is temporarily disabled.', 'info', 3000);
                    return;
                }
                handleWatchNowAccess();
            });
        });
    }

    // News Card Click Handler
    document.querySelectorAll('.news-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() {
            const newsType = this.dataset.news;
            const newsData = newsArticles[newsType];
            
            if (newsData) {
                // Update modal title
                document.getElementById('modalTitle').textContent = newsData.title;
                
                // Build articles HTML
                let articlesHTML = '';
                newsData.articles.forEach((article, index) => {
                    const articleId = `${newsType}-${index}`;
                    articlesHTML += `
                        <a href="article-detail.html?id=${articleId}" class="article-link">
                            <div class="article">
                                ${article.imageUrl ? `<img src="${article.imageUrl}" alt="${article.headline}" class="article-thumb">` : ''}
                                <h3>${article.headline}</h3>
                                <div class="article-date">${article.date}</div>
                                <p>${article.content}</p>
                                ${article.sourceUrl ? `<div class="article-source-link">Source: ${article.sourceUrl}</div>` : ''}
                            </div>
                        </a>
                    `;
                });
                
                document.getElementById('modalBody').innerHTML = articlesHTML;
                
                // Add click handler for article links
                document.querySelectorAll('.article-link').forEach((link, index) => {
                    link.addEventListener('click', function(e) {
                        const article = newsData.articles[index];
                        sessionStorage.setItem('currentArticle', JSON.stringify(article));
                        sessionStorage.setItem('newsCategory', newsType);
                    });
                });
                
                // Reset scroll to top of modal before showing
                document.querySelector('.news-modal-content').scrollTop = 0;
                document.getElementById('modalBody').scrollTop = 0;
                
                // Show modal
                document.getElementById('newsModal').classList.add('active');
            }
        });
    });

// Close News Modal
        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const modal = document.getElementById('newsModal');
                modal.classList.remove('active');
                // Reset scroll position to top
                document.querySelector('.news-modal-content').scrollTop = 0;
            });
        }

        // Close Events Modal
        const closeEventsBtn = document.querySelector('.close-btn-events');
        if (closeEventsBtn) {
            closeEventsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const modal = document.getElementById('eventsModal');
            modal.classList.remove('active');
            // Reset scroll position to top
            document.querySelector('.news-modal-content').scrollTop = 0;
        });
    }

    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('newsModal');
        if (event.target === modal) {
            modal.classList.remove('active');
            // Reset scroll position to top
            document.querySelector('.news-modal-content').scrollTop = 0;
        }
    });

    // Local Events Card Click Handler
    document.querySelectorAll('.event-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() {
            const eventType = this.dataset.event;
            const eventData = localEvents[eventType];
            
            if (eventData) {
                document.getElementById('eventsModalTitle').textContent = eventData.title;
                
                let eventHTML = `
                    <div class="event-detail">
                        <h3>${eventData.details.name}</h3>
                        <div class="event-meta">
                            <p><strong>📅 Date:</strong> ${eventData.details.date}</p>
                            <p><strong>🕐 Time:</strong> ${eventData.details.time}</p>
                            <p><strong>📍 Location:</strong> ${eventData.details.location}</p>
                        </div>
                        <div class="event-description">
                            ${eventData.details.description.split('\n\n').map(p => `<p>${p}</p>`).join('')}
                        </div>
                    </div>
                `;
                
                document.getElementById('eventsModalBody').innerHTML = eventHTML;
                document.querySelector('.news-modal-content').scrollTop = 0;
                document.getElementById('eventsModal').classList.add('active');
            }
        });
    });

    // Close Events Modal
    document.addEventListener('click', function(event) {
        if (event.target.closest('#eventsModal') && event.target.id === 'eventsModal') {
            document.getElementById('eventsModal').classList.remove('active');
            document.querySelector('.news-modal-content').scrollTop = 0;
        }
    });

    // Advertising Plans Click Handler
    if (isIndexPage) {
        document.querySelectorAll('.pricing-card').forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', function(e) {
                e.stopPropagation();
                const plan = this.dataset.plan;
                const planData = advertisingPlans[plan];
                
                if (planData) {
                    document.getElementById('advertiseModalTitle').textContent = planData.name + ' Plan';
                    
                    let planHTML = `
                        <div class="plan-detail">
                            <h3>${planData.name}</h3>
                            <div class="plan-price">${planData.price}</div>
                            <p class="plan-tagline">${planData.description}</p>
                            <div class="plan-features">
                                <h4>What's Included:</h4>
                                <ul>
                                    ${planData.features.map(f => `<li>${f}</li>`).join('')}
                                </ul>
                            </div>
                            <div class="plan-description">
                                ${planData.details.split('\n\n').map(p => `<p>${p}</p>`).join('')}
                            </div>
                            <div class="plan-cta">
                                <a href="#contact" class="btn">Contact Sales Team</a>
                            </div>
                        </div>
                    `;
                    
                    document.getElementById('advertiseModalBody').innerHTML = planHTML;
                    document.querySelector('.news-modal-content').scrollTop = 0;
                    document.getElementById('advertiseModal').classList.add('active');
                }
            });
        });
    }

    // Close Advertise Modal
    const closeBtnAdvertise = document.querySelector('.close-btn-advertise');
    if (closeBtnAdvertise) {
        closeBtnAdvertise.addEventListener('click', function(e) {
            e.stopPropagation();
            document.getElementById('advertiseModal').classList.remove('active');
            document.querySelector('.news-modal-content').scrollTop = 0;
        });
    }

    document.addEventListener('click', function(event) {
        if (event.target.id === 'advertiseModal') {
            document.getElementById('advertiseModal').classList.remove('active');
            document.querySelector('.news-modal-content').scrollTop = 0;
        }
    });

    // Contact Sales Team Button - Close modal and navigate
    document.addEventListener('click', function(event) {
        if (event.target.textContent === 'Contact Sales Team' || event.target.closest('a[href="#contact"]')) {
            document.getElementById('advertiseModal').classList.remove('active');
        }
    });

    // Subscribe Button Handler
    const subscribeBtn = document.getElementById('subscribeBtn');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', function() {
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (currentUser) {
                showSiteToast('You already have an account. Update preferences in your profile.', 'info');
                return;
            }
            openSubscribeModalWithTier('');
        });
    }

    const switchToSignInBtn = document.getElementById('switchToSignInBtn');
    if (switchToSignInBtn) {
        switchToSignInBtn.addEventListener('click', function() {
            document.getElementById('subscribeModal').classList.remove('active');
            const signInModal = document.getElementById('signInModal');
            if (signInModal) {
                signInModal.classList.add('active');
                const content = signInModal.querySelector('.subscribe-modal-content');
                if (content) content.scrollTop = 0;
            }
        });
    }

    // Subscribe Modal Close Button Handler
    const closeSubscribeBtn = document.querySelector('.close-btn-subscribe');
    if (closeSubscribeBtn) {
        closeSubscribeBtn.addEventListener('click', function() {
            document.getElementById('subscribeModal').classList.remove('active');
            document.querySelector('.subscribe-modal-content').scrollTop = 0;
        });
    }

    // Close modal when clicking outside it
    document.addEventListener('click', function(event) {
        if (event.target.id === 'subscribeModal') {
            document.getElementById('subscribeModal').classList.remove('active');
            document.querySelector('.subscribe-modal-content').scrollTop = 0;
        }
    });

    const subscriptionsAccessMessage = document.getElementById('subscriptionsAccessMessage');
    if (subscriptionsAccessMessage) {
        subscriptionsAccessMessage.addEventListener('click', function() {
            if (!subscriptionsAccessMessage.classList.contains('payment-shortcut-enabled')) return;
            openAddPaymentShortcutFromSubscriptions();
        });

        subscriptionsAccessMessage.addEventListener('keydown', function(e) {
            if (!subscriptionsAccessMessage.classList.contains('payment-shortcut-enabled')) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openAddPaymentShortcutFromSubscriptions();
            }
        });
    }

    // Subscribe Form Submission Handler
    const subscribeForm = document.getElementById('subscribeForm');
    const subPasswordInput = document.getElementById('subPassword');
    if (subPasswordInput) {
        subPasswordInput.addEventListener('input', function() {
            updateSignupPasswordRequirements(subPasswordInput.value);
        });
        updateSignupPasswordRequirements(subPasswordInput.value);
    }

    if (subscribeForm) {
        subscribeForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('subName').value;
            const formattedName = formatDisplayName(name);
            const email = document.getElementById('subEmail').value.trim().toLowerCase();
            const phone = document.getElementById('subPhone').value;
            const password = document.getElementById('subPassword').value;
            const confirmPassword = document.getElementById('subConfirmPassword').value;
            const emailUpdates = document.getElementById('emailUpdates').checked;
            const smsUpdates = document.getElementById('smsUpdates').checked;
            const subscriptionTier = document.getElementById('subTier').value;
            
            if (!isValidFullName(name)) {
                setFormMessage('subscribeMessage', 'Please enter your first and last name.', 'error');
                return;
            }

            // Validate passwords match
            if (!isValidPassword(password)) {
                setFormMessage('subscribeMessage', 'Password must be at least 6 characters and include at least 1 capital letter.', 'error');
                return;
            }

            // Validate passwords match
            if (password !== confirmPassword) {
                setFormMessage('subscribeMessage', 'Passwords do not match!', 'error');
                return;
            }
            
            // Validate at least one preference selected
            if (!emailUpdates && !smsUpdates) {
                setFormMessage('subscribeMessage', 'Please select at least one update preference!', 'error');
                return;
            }
            
            // Calculate next billing date (30 days from today)
            const nextBillingDate = new Date();
            nextBillingDate.setDate(nextBillingDate.getDate() + 30);
            const billingDateStr = nextBillingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            
            // Create account object with subscription info
            const account = {
                name: formattedName,
                email: email,
                phone: phone,
                password: password,
                emailUpdates: emailUpdates,
                smsUpdates: smsUpdates,
                subscriptionTier: subscriptionTier,
                streamingActivated: false,
                nextBillingDate: billingDateStr,
                paymentMethod: null,
                createdDate: new Date().toISOString()
            };
            
            // Store in localStorage (in a real app, this would be sent to a server)
            let accounts = JSON.parse(localStorage.getItem('radioAccounts')) || [];

            // Prevent duplicate accounts for the same email.
            if (accounts.some(acc => (acc.email || '').trim().toLowerCase() === email)) {
                setFormMessage('subscribeMessage', 'An account with this email already exists!', 'error');
                return;
            }

            accounts.push(account);
            localStorage.setItem('radioAccounts', JSON.stringify(accounts));

            // Account access is available immediately; streaming stays locked until the feature is re-enabled.
            sessionStorage.setItem('currentUser', JSON.stringify(account));
            resetReloadCounter(account.email);
            setSubscribeButtonAvailability(false);
            updateNavForSignedIn(account);
            
            // Show success message
            const messageEl = document.getElementById('subscribeMessage');
            messageEl.textContent = '✓ Account created successfully! Check your ' + 
                (emailUpdates ? 'email' : '') + 
                (emailUpdates && smsUpdates ? ' and ' : '') + 
                (smsUpdates ? 'phone' : '') + 
                ' for updates.';
            messageEl.classList.remove('error', 'success', 'info');
            messageEl.classList.add('success');

            // Trigger confirmation notifications.
            const notificationResult = await sendSignupNotifications(account);
            if (notificationResult.email.status === 'sent' || notificationResult.sms.status === 'sent') {
                messageEl.textContent = '✓ Account created! Confirmation ' +
                    (notificationResult.email.status === 'sent' && notificationResult.sms.status === 'sent'
                        ? 'email and text were sent.'
                        : notificationResult.email.status === 'sent'
                            ? 'email was sent.'
                            : 'text message was sent.');
            }
            
            // Scroll to top
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            
            // Reset form
            subscribeForm.reset();
            updateSignupPasswordRequirements('');
            
            setTimeout(() => {
                document.getElementById('subscribeModal').classList.remove('active');
            }, 600);

            // Clear signup message after completion
            setTimeout(() => {
                clearFormMessage('subscribeMessage');
            }, 3000);
        });
    }

    // Payment Form Handler
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        const expirationDateInput = document.getElementById('expirationDate');
        if (expirationDateInput) {
            expirationDateInput.addEventListener('input', function() {
                const digits = this.value.replace(/\D/g, '').slice(0, 4);
                this.value = digits.length > 2
                    ? digits.slice(0, 2) + '/' + digits.slice(2)
                    : digits;
            });
        }

        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const cardholderName = document.getElementById('cardholderName').value;
            const cardNumber = document.getElementById('cardNumber').value;
            const expirationDate = document.getElementById('expirationDate').value;
            const cvv = document.getElementById('cvv').value;
            const billingAddress = document.getElementById('billingAddress').value;
            const billingCity = document.getElementById('billingCity').value;
            const billingState = document.getElementById('billingState').value;
            const billingZip = document.getElementById('billingZip').value;
            const billingAgreement = document.getElementById('billingAgreement').checked;
            
            // Basic validation
            if (!cardNumber || cardNumber.length !== 16 || isNaN(cardNumber)) {
                setFormMessage('paymentMessage', 'Please enter a valid 16-digit card number!', 'error');
                return;
            }
            
            if (!expirationDate || !expirationDate.match(/^\d{2}\/\d{2}$/)) {
                setFormMessage('paymentMessage', 'Please enter expiration date in MM/YY format!', 'error');
                return;
            }
            
            if (!cvv || cvv.length !== 3 || isNaN(cvv)) {
                setFormMessage('paymentMessage', 'Please enter a valid 3-digit CVV!', 'error');
                return;
            }
            
            if (!billingAgreement) {
                setFormMessage('paymentMessage', 'Please agree to the billing terms!', 'error');
                return;
            }
            
            // Get target account from signed-in user or pending activation flow.
            const signedInUser = JSON.parse(sessionStorage.getItem('currentUser'));
            const pendingActivationEmail = sessionStorage.getItem('pendingActivationEmail');
            const targetEmail = signedInUser ? signedInUser.email : pendingActivationEmail;

            if (!targetEmail) {
                setFormMessage('paymentMessage', 'Please sign in first!', 'error');
                return;
            }

            let accounts = JSON.parse(localStorage.getItem('radioAccounts')) || [];
            const accountIndex = accounts.findIndex(acc => (acc.email || '').trim().toLowerCase() === String(targetEmail).trim().toLowerCase());

            if (accountIndex === -1) {
                setFormMessage('paymentMessage', 'Account not found. Please sign up again.', 'error');
                return;
            }

            // Create payment method object (mask card number for security)
            const paymentMethod = {
                cardholderName: cardholderName,
                cardNumber: cardNumber.slice(-4), // Only store last 4 digits
                last4: cardNumber.slice(-4),
                cardNumberFull: cardNumber, // For validation purposes
                expirationDate: expirationDate,
                cvv: cvv,
                billingAddress: billingAddress,
                billingCity: billingCity,
                billingState: billingState,
                billingZip: billingZip,
                addedDate: new Date().toISOString()
            };

            // Update account with payment. Streaming activates only when plan + payment exist.
            const updatedAccount = {
                ...accounts[accountIndex],
                paymentMethod: paymentMethod,
                streamingActivated: false
            };
            accounts[accountIndex] = updatedAccount;
            localStorage.setItem('radioAccounts', JSON.stringify(accounts));

            // Keep account signed in after payment update.
            sessionStorage.setItem('currentUser', JSON.stringify(updatedAccount));
            resetReloadCounter(updatedAccount.email);
            sessionStorage.removeItem('pendingActivationEmail');
            setSubscribeButtonAvailability(false);
            updateNavForSignedIn(updatedAccount);
            
            // Show success message
            const messageEl = document.getElementById('paymentMessage');
            const activeTier = updatedAccount.subscriptionTier || 'selected';
            messageEl.textContent = '✓ Payment method saved. Streaming packages are currently disabled.';
            messageEl.classList.remove('error', 'success', 'info');
            messageEl.classList.add('success');
            
            // Reset form
            paymentForm.reset();
            
            // Refresh page after payment save so account state/UI updates immediately.
            setTimeout(() => {
                document.getElementById('paymentModal').classList.remove('active');
                clearFormMessage('paymentMessage');
                window.location.reload();
            }, 1200);
        });
    }

    // Check if user is already signed in on page load
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        const parsedCurrentUser = JSON.parse(currentUser);
        const reloadCount = incrementReloadCounter(parsedCurrentUser.email);

        if (reloadCount > 3) {
            sessionStorage.removeItem('currentUser');
            clearReloadCounter(parsedCurrentUser.email);
            updateNavForSignedOut();
            setSubscribeButtonAvailability(true);
            showSiteToast('For security, you were signed out after multiple page reloads.', 'info', 3200);
        } else {
            updateNavForSignedIn(parsedCurrentUser);
            setSubscribeButtonAvailability(false);
        }
    } else {
        setSubscribeButtonAvailability(true);
    }

    // Sign In Button Handler
    const signInNavBtn = document.getElementById('signInNavBtn');
    if (signInNavBtn) {
        signInNavBtn.onclick = function(e) {
            e.preventDefault();
            document.getElementById('signInModal').classList.add('active');
            const content = document.querySelector('.subscribe-modal-content');
            if (content) content.scrollTop = 0;
        };
    }

    // Sign Up Button Handler
    const signUpNavBtn = document.getElementById('signUpNavBtn');
    if (signUpNavBtn) {
        signUpNavBtn.onclick = function(e) {
            e.preventDefault();
            document.getElementById('subscribeModal').classList.add('active');
            const content = document.querySelector('.subscribe-modal-content');
            if (content) content.scrollTop = 0;
        };
    }

    // Universal modal close handlers for all popup types
    function closeModal(modalEl) {
        if (!modalEl) return;
        modalEl.classList.remove('active');
        if (modalEl.id === 'subscriptionsModal') {
            clearFormMessage('subscriptionsAccessMessage');
        }
        const modalContent = modalEl.querySelector('.news-modal-content');
        if (modalContent) modalContent.scrollTop = 0;
    }

    document.querySelectorAll('.news-modal .close-btn, .news-modal .close-btn-events, .news-modal .close-btn-advertise, .news-modal .close-btn-subscribe').forEach(closeBtn => {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal(this.closest('.news-modal'));
        });
    });

    // Close popup by clicking outside modal content
    document.querySelectorAll('.news-modal, .payment-modal').forEach(modal => {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
    });

    // Show Password Toggle Handlers
    // Sign In password
    const showSignInPassword = document.getElementById('showSignInPassword');
    if (showSignInPassword) {
        showSignInPassword.addEventListener('change', function() {
            const passwordInput = document.getElementById('signInPassword');
            passwordInput.type = this.checked ? 'text' : 'password';
        });
    }

    // Sign Up password
    const showSubPassword = document.getElementById('showSubPassword');
    if (showSubPassword) {
        showSubPassword.addEventListener('change', function() {
            const passwordInput = document.getElementById('subPassword');
            passwordInput.type = this.checked ? 'text' : 'password';
        });
    }

    // Sign Up confirm password
    const showSubConfirmPassword = document.getElementById('showSubConfirmPassword');
    if (showSubConfirmPassword) {
        showSubConfirmPassword.addEventListener('change', function() {
            const passwordInput = document.getElementById('subConfirmPassword');
            passwordInput.type = this.checked ? 'text' : 'password';
        });
    }

    // Sign In Form Submission
    const signInForm = document.getElementById('signInForm');
    if (signInForm) {
        signInForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('signInEmail').value.trim().toLowerCase();
            const password = document.getElementById('signInPassword').value;
            
            // Get stored accounts
            const accounts = JSON.parse(localStorage.getItem('radioAccounts')) || [];
            
            // Find matching account
            const account = accounts.find(acc => acc.email === email && acc.password === password);
            
            if (account) {
                // Store current user in sessionStorage
                sessionStorage.setItem('currentUser', JSON.stringify(account));
                resetReloadCounter(account.email);
                setSubscribeButtonAvailability(false);
                
                // Update nav
                updateNavForSignedIn(account);
                
                // Show success and close
                const messageEl = document.getElementById('signInMessage');
                messageEl.textContent = '✓ Signed in successfully!';
                messageEl.classList.remove('error', 'success', 'info');
                messageEl.classList.add('success');
                
                // Scroll to top
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
                
                setTimeout(() => {
                    document.getElementById('signInModal').classList.remove('active');
                    signInForm.reset();
                    clearFormMessage('signInMessage');
                }, 2000);
            } else {
                setFormMessage('signInMessage', 'Username or password is wrong.', 'error');
            }
        });
    }

    // Profile Button Handler
    const profileTrigger = document.getElementById('profileNavBtn') || document.getElementById('userNameDisplay') || document.getElementById('profileMenuItem');
    if (profileTrigger) {
        profileTrigger.addEventListener('click', function() {
            let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (currentUser) {
                // Always use the freshest account data so payment/activation status is accurate.
                const accounts = JSON.parse(localStorage.getItem('radioAccounts')) || [];
                const refreshedUser = accounts.find(acc => acc.email === currentUser.email);
                if (refreshedUser) {
                    currentUser = refreshedUser;
                    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                    updateNavForSignedIn(currentUser);
                }

                const streamingActive = isStreamingActive(currentUser);
                const profileNameEl = document.getElementById('profileName');
                profileNameEl.textContent = formatDisplayName(currentUser.name);
                profileNameEl.classList.toggle('streaming-active', streamingActive);
                profileNameEl.classList.toggle('streaming-inactive', !streamingActive);
                document.getElementById('profileEmail').textContent = currentUser.email;
                document.getElementById('profilePhone').textContent = currentUser.phone;
                document.getElementById('profileEmailUpdates').checked = currentUser.emailUpdates;
                document.getElementById('profileSmsUpdates').checked = currentUser.smsUpdates;
                
                // Display streaming status based on activation state.
                const profileSubStatusEl = document.getElementById('profileSubStatus');
                if (streamingActive) {
                    const tierName = currentUser.subscriptionTier.charAt(0).toUpperCase() + currentUser.subscriptionTier.slice(1);
                    document.getElementById('profileSubscriptionTier').textContent = tierName;
                    document.getElementById('profileBillingDate').textContent = currentUser.nextBillingDate || '--';
                    profileSubStatusEl.textContent = 'Active';
                    profileSubStatusEl.style.color = '#4caf50';
                } else {
                    if (currentUser.subscriptionTier) {
                        const tierName = currentUser.subscriptionTier.charAt(0).toUpperCase() + currentUser.subscriptionTier.slice(1);
                        document.getElementById('profileSubscriptionTier').textContent = tierName + ' (Pending Activation)';
                    } else {
                        document.getElementById('profileSubscriptionTier').textContent = 'No Active Subscription';
                    }
                    document.getElementById('profileBillingDate').textContent = currentUser.nextBillingDate || '--';
                    profileSubStatusEl.textContent = 'Inactive';
                    profileSubStatusEl.style.color = '#ff0000';
                }
                
                // Display payment method
                if (currentUser.paymentMethod) {
                    const paymentDisplay = document.getElementById('paymentDisplay');
                    paymentDisplay.classList.add('has-method');
                    const last4 = currentUser.paymentMethod.last4 || currentUser.paymentMethod.cardNumber || '----';
                    const info = `<p class="payment-info-text">💳 Card ending in ${last4}</p>`;
                    document.getElementById('paymentInfo').innerHTML = info;
                } else {
                    const paymentDisplay = document.getElementById('paymentDisplay');
                    paymentDisplay.classList.remove('has-method');
                    document.getElementById('paymentInfo').textContent = 'No payment method added';
                }
                
                document.getElementById('profileModal').classList.add('active');
            }
        });
    }

    // Update Preferences Button
    const updatePreferencesBtn = document.getElementById('updatePreferencesBtn');
    if (updatePreferencesBtn) {
        updatePreferencesBtn.addEventListener('click', function() {
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (currentUser) {
                currentUser.emailUpdates = document.getElementById('profileEmailUpdates').checked;
                currentUser.smsUpdates = document.getElementById('profileSmsUpdates').checked;
                
                // Update in sessionStorage
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Update in localStorage
                let accounts = JSON.parse(localStorage.getItem('radioAccounts')) || [];
                const accountIndex = accounts.findIndex(acc => acc.email === currentUser.email);
                if (accountIndex !== -1) {
                    accounts[accountIndex] = currentUser;
                    localStorage.setItem('radioAccounts', JSON.stringify(accounts));
                }
                
                showSiteToast('Preferences updated successfully!', 'success');
            }
        });
    }

    // Sign Out Button
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', function() {
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (currentUser && currentUser.email) {
                clearReloadCounter(currentUser.email);
            }
            sessionStorage.removeItem('currentUser');
            localStorage.removeItem('loggedInEmail');
            document.getElementById('profileModal').classList.remove('active');
            setSubscribeButtonAvailability(true);
            updateNavForSignedOut();
        });
    }

    // Payment Method Edit Button
    const editPaymentBtn = document.getElementById('editPaymentBtn');
    if (editPaymentBtn) {
        editPaymentBtn.addEventListener('click', function() {
            clearFormMessage('paymentMessage');
            paymentForm.reset();

            const sessionUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (sessionUser) {
                const accounts = JSON.parse(localStorage.getItem('radioAccounts')) || [];
                const latestUser = accounts.find(acc => acc.email === sessionUser.email) || sessionUser;
                const savedPayment = latestUser.paymentMethod;

                if (savedPayment) {
                    document.getElementById('cardholderName').value = savedPayment.cardholderName || '';
                    document.getElementById('cardNumber').value = savedPayment.cardNumberFull || '';
                    document.getElementById('expirationDate').value = savedPayment.expirationDate || '';
                    document.getElementById('cvv').value = savedPayment.cvv || '';
                    document.getElementById('billingAddress').value = savedPayment.billingAddress || '';
                    document.getElementById('billingCity').value = savedPayment.billingCity || '';
                    document.getElementById('billingState').value = savedPayment.billingState || '';
                    document.getElementById('billingZip').value = savedPayment.billingZip || '';
                    document.getElementById('billingAgreement').checked = true;
                }
            }

            document.getElementById('paymentModal').classList.add('active');
        });
    }

    // Payment Modal Cancel Button
    const cancelPaymentBtn = document.querySelector('.btn-cancel-payment');
    if (cancelPaymentBtn) {
        cancelPaymentBtn.addEventListener('click', function() {
            document.getElementById('paymentModal').classList.remove('active');
        });
    }

    // Subscription Cards Click Handler
    document.querySelectorAll('.subscription-card').forEach(card => {
        card.addEventListener('click', function() {
            const tier = this.dataset.tier;
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            
            if (!currentUser) {
                const subModal = document.getElementById('subscriptionsModal');
                if (subModal && subModal.classList) {
                    subModal.classList.remove('active');
                }
                openSubscribeModalWithTier(tier);
                showSiteToast('Create an account to purchase this package. Already have one? Use Sign In at the bottom.', 'info', 3500);
            } else {
                // Update subscription
                currentUser.subscriptionTier = tier;
                currentUser.streamingActivated = false;
                
                // Calculate next billing date
                const nextBillingDate = new Date();
                nextBillingDate.setDate(nextBillingDate.getDate() + 30);
                const billingDateStr = nextBillingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                currentUser.nextBillingDate = billingDateStr;
                
                // Update sessionStorage
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Update localStorage
                let accounts = JSON.parse(localStorage.getItem('radioAccounts')) || [];
                const accountIndex = accounts.findIndex(acc => acc.email === currentUser.email);
                if (accountIndex !== -1) {
                    accounts[accountIndex] = currentUser;
                    localStorage.setItem('radioAccounts', JSON.stringify(accounts));
                }

                updateNavForSignedIn(currentUser);
                
                const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
                
                // Close subscription modal
                const subModal = document.getElementById('subscriptionsModal');
                if (subModal && subModal.classList) {
                    subModal.classList.remove('active');
                }
                
                // Check if user has payment method, if not show payment form
                if (!currentUser.paymentMethod || !currentUser.paymentMethod.cardNumber) {
                    showPlanNeedsPaymentMessage(tierName);
                } else {
                    showSiteToast(`Upgraded to ${tierName} plan. Your next billing date is ${billingDateStr}.`, 'success');
                }
            }
        });
    });
});

function initializeAutoHideHeader() {
    if (window.__headerAutoHideInitialized) return;

    const pageHeader = document.querySelector('header');
    if (!pageHeader) return;

    window.__headerAutoHideInitialized = true;

    let lastScrollY = window.scrollY;
    let lastUpdateMs = 0;
    const minDelta = 8;
    const throttleMs = 35;

    const updateHeaderVisibility = () => {
        const now = Date.now();
        if (now - lastUpdateMs < throttleMs) {
            return;
        }

        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY;

        if (Math.abs(delta) < minDelta) {
            return;
        }

        if (currentScrollY <= 24) {
            pageHeader.classList.remove('header-hidden');
            lastScrollY = currentScrollY;
            lastUpdateMs = now;
            return;
        }

        const mobileMenu = document.querySelector('header .menu');
        const isMenuOpen = mobileMenu && mobileMenu.classList.contains('active');
        if (isMenuOpen) {
            pageHeader.classList.remove('header-hidden');
            lastScrollY = currentScrollY;
            lastUpdateMs = now;
            return;
        }

        if (delta > 0) {
            pageHeader.classList.add('header-hidden');
        } else {
            pageHeader.classList.remove('header-hidden');
        }

        lastScrollY = currentScrollY;
        lastUpdateMs = now;
    };

    window.addEventListener('scroll', updateHeaderVisibility, { passive: true });
}

// Function to update nav for signed in user
function updateNavForSignedIn(account) {
    document.getElementById('signInMenuItem').style.display = 'none';
    document.getElementById('signUpMenuItem').style.display = 'none';
    document.getElementById('profileMenuItem').style.display = 'block';
    const userNameDisplay = document.getElementById('userNameDisplay');
    userNameDisplay.textContent = formatDisplayName(account.name);
    userNameDisplay.classList.toggle('streaming-active', isStreamingActive(account));
}

// Function to update nav for signed out user
function updateNavForSignedOut() {
    document.getElementById('signInMenuItem').style.display = 'block';
    document.getElementById('signUpMenuItem').style.display = 'block';
    document.getElementById('profileMenuItem').style.display = 'none';
    document.getElementById('userNameDisplay').classList.remove('streaming-active');
}

// Force scroll to top on page load and after any scroll events
window.addEventListener('load', function() {
    // Multiple attempts to ensure scroll stays at top
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    requestAnimationFrame(function() {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    });
    
    // Final check after a short delay
    setTimeout(function() {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, 100);
});

// Fail-safe: prevent occasional stuck loading overlay if earlier timers are interrupted.
function forceHideLoadingOverlay() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen && getComputedStyle(loadingScreen).display !== 'none') {
        loadingScreen.style.display = 'none';
    }
    document.body.classList.remove('loading-locked');
}

window.addEventListener('load', function() {
    setTimeout(forceHideLoadingOverlay, 3300);
});

setTimeout(forceHideLoadingOverlay, 4500);

// Prevent scroll during page load (first 3 seconds)
let isLoading = true;
setTimeout(function() {
    isLoading = false;
}, 3000);

window.addEventListener('scroll', function(e) {
    if (isLoading && window.scrollY > 0) {
        window.scrollTo(0, 0);
    }
}, true);

if (document.readyState !== 'loading') {
    setTimeout(initializeAutoHideHeader, 0);
} else {
    document.addEventListener('DOMContentLoaded', initializeAutoHideHeader);
}

window.addEventListener('load', initializeAutoHideHeader);
