/* ============================================================
   DATA
============================================================ */
const HOTSPOTS = [
    { id: 'hotspot-1', label: 'Ligne de départ', title: "Ligne de départ", desc: "Le point de départ mythique des 24 Heures du Mans, où les voitures s'élancent devant les tribunes combles." },
    { id: 'hotspot-2', label: 'Chicane Dunlop', title: "Chicane Dunlop", desc: "Une chicane rapide située sous la passerelle Dunlop, véritable icône du circuit." },
    { id: 'hotspot-3', label: 'Tertre Rouge', title: "Tertre Rouge", desc: "Un virage crucial car il conditionne toute la vitesse de pointe dans la ligne droite des Hunaudières." },
    { id: 'hotspot-5', label: 'Hunaudières - Début', title: "Début Hunaudières", desc: "Le début de la légendaire ligne droite de 6 km où les voitures atteignent leurs vitesses maximales." },
    { id: 'hotspot-6', label: 'Chicane 1', title: "Chicane 1", desc: "La première chicane de la ligne droite des Hunaudières, ajoutée en 1990 pour la sécurité." },
    { id: 'hotspot-7', label: 'Chicane 2', title: "Chicane 2", desc: "La seconde chicane sur les Hunaudières, testant l'endurance des freins à haute vitesse." },
    { id: 'hotspot-9', label: 'Virage Mulsanne', title: "Virage Mulsanne", desc: "Un freinage brutal à angle droit au bout des Hunaudières, l'un des virages les plus célèbres du circuit." },
    { id: 'hotspot-10', label: 'Indy + Arnage', title: "Indianapolis + Arnage", desc: "Un enchaînement technique composé d'Indianapolis (relevé) et d'Arnage (le plus lent du circuit)." },
    { id: 'hotspot-12', label: 'Virage Porsche', title: "Virages Porsche", desc: "Une section ultra-rapide et technique qui serpente le long du circuit permanent." },
    { id: 'hotspot-13', label: 'Virage Karting', title: "Virage Karting", desc: "Un virage serré situé juste avant le raccordement, nommé en raison de la piste de karting adjacente." },
    { id: 'hotspot-14', label: 'Ford + Raccordement', title: "Ford + Raccordement", desc: "Le dernier défi avant la ligne droite des stands, où se jouent souvent les victoires serrées." }
];

/* ============================================================
   ELEMENTS
============================================================ */
const modelViewer = document.getElementById('mv');
const infoPanel = document.getElementById('info-panel');
const infoTitle = document.getElementById('info-title');
const infoDesc = document.getElementById('info-description');
const closeInfo = document.querySelector('.close-info');
const listItems = document.querySelectorAll('#hotspot-list li');
const hotspotBtns = document.querySelectorAll('.Hotspot');
const resetBtn = document.getElementById('reset-button');
const fullscreenBtn = document.getElementById('fullscreen-button');
const viewerContainer = document.querySelector('.viewer-container');
const sidebar = document.getElementById('sidebar');
const toggleSidebar = document.getElementById('toggle-sidebar');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const tourBtn = document.getElementById('tour-btn');
const locationIndex = document.getElementById('location-index');
const locationName = document.getElementById('location-name');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const kbdToast = document.getElementById('kbd-toast');
const bgMusic = document.getElementById('bg-music');
const soundBtn = document.getElementById('sound-toggle');
const volumeSlider = document.getElementById('volume-slider');

const initialTarget = modelViewer.cameraTarget;

let currentIndex = -1; // -1 = vue globale
let tourInterval = null;
let isTourActive = false;

/* ============================================================
   DARK / LIGHT MODE
============================================================ */
const MOON_ICON = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
const SUN_ICON = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.innerHTML = theme === 'dark' ? MOON_ICON : SUN_ICON;
    localStorage.setItem('circuit-theme', theme);
}

// Init from localStorage
const savedTheme = localStorage.getItem('circuit-theme') || 'dark';
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ============================================================
   SOUND LOGIC (SYNCED WITH INDEX)
============================================================ */
let isMuted = localStorage.getItem('le-mans-muted') === 'true';
let userVolume = localStorage.getItem('le-mans-volume') || 0.5;

// Initial state
volumeSlider.value = userVolume;
if (isMuted) {
    soundBtn.classList.add('muted');
    bgMusic.volume = 0;
} else {
    bgMusic.volume = userVolume;
}

// Start music on first interaction
function startMusic() {
    if (bgMusic.paused && !isMuted) {
        bgMusic.play().catch(e => console.warn("Autoplay blocked", e));
    }
}
document.addEventListener('mousedown', startMusic, { once: true });
document.addEventListener('keydown', startMusic, { once: true });

soundBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    localStorage.setItem('le-mans-muted', isMuted);
    soundBtn.classList.toggle('muted', isMuted);
    
    if (isMuted) {
        bgMusic.pause();
    } else {
        bgMusic.volume = userVolume;
        bgMusic.play().catch(e => console.warn("Audio play blocked", e));
    }
});

volumeSlider.addEventListener('input', (e) => {
    userVolume = e.target.value;
    localStorage.setItem('le-mans-volume', userVolume);
    
    if (!isMuted) {
        bgMusic.volume = userVolume;
    }
});

/* ============================================================
   CINEMATIC INTRO
============================================================ */
const viewerEl = document.querySelector('.viewer-container');
const introOverlay = document.createElement('div');
introOverlay.id = 'intro-overlay';
introOverlay.innerHTML = `
    <div class="intro-label">24 Heures du Mans</div>
    <div class="intro-title">Circuit de la Sarthe</div>
    <div class="intro-sub">— Modélisation 3D Interactive —</div>`;
viewerEl.appendChild(introOverlay);

modelViewer.addEventListener('load', () => {
    modelViewer.interpolationDecay = 160;
    modelViewer.cameraOrbit = '30deg 12deg 1600m';

    setTimeout(() => { modelViewer.cameraOrbit = '200deg 55deg 600m'; }, 1400);

    setTimeout(() => {
        introOverlay.classList.add('fade-out');
        modelViewer.cameraOrbit = 'auto 75deg 100m';
    }, 2800);

    setTimeout(() => { introOverlay.style.display = 'none'; }, 4400);
});

/* ============================================================
   FOCUS HOTSPOT
============================================================ */
function focusHotspot(idx) {
    if (idx < 0 || idx >= HOTSPOTS.length) return;
    currentIndex = idx;
    const hs = HOTSPOTS[idx];

    modelViewer.interpolationDecay = 280;
    const hotspotEl = document.querySelector(`[slot="${hs.id}"]`);
    if (hotspotEl) {
        const coords = hotspotEl.dataset.position.split(' ').map(parseFloat);
        modelViewer.cameraTarget = `${coords[0]}m ${coords[1] + 5}m ${coords[2]}m`;
    }
    modelViewer.cameraOrbit = "auto auto 20m";

    // Info panel
    infoTitle.innerText = hs.title;
    infoDesc.innerText = hs.desc;
    infoPanel.classList.remove('hidden');

    // Sidebar active state
    listItems.forEach((li, i) => li.classList.toggle('active', i === idx));

    // Hotspot active state
    hotspotBtns.forEach(btn => btn.classList.toggle('active-hotspot', btn.slot === hs.id));

    // Location badge
    locationIndex.textContent = `${idx + 1} / ${HOTSPOTS.length}`;
    locationName.textContent = hs.label;
}

function resetView() {
    currentIndex = -1;
    stopTour();
    modelViewer.cameraTarget = initialTarget;
    modelViewer.cameraOrbit = "auto 75deg 100m";
    modelViewer.fieldOfView = "auto";
    infoPanel.classList.add('hidden');
    listItems.forEach(li => li.classList.remove('active'));
    hotspotBtns.forEach(btn => btn.classList.remove('active-hotspot'));
    locationIndex.textContent = '—';
    locationName.textContent = 'Vue globale';
}

/* ============================================================
   LIST ITEMS & HOTSPOT CLICKS
============================================================ */
listItems.forEach((li, idx) => li.addEventListener('click', () => focusHotspot(idx)));
hotspotBtns.forEach((btn, idx) => btn.addEventListener('click', () => focusHotspot(idx)));

closeInfo.addEventListener('click', () => infoPanel.classList.add('hidden'));
resetBtn.addEventListener('click', resetView);

/* ============================================================
   PREV / NEXT
============================================================ */
prevBtn.addEventListener('click', () => {
    const next = currentIndex <= 0 ? HOTSPOTS.length - 1 : currentIndex - 1;
    focusHotspot(next);
});
nextBtn.addEventListener('click', () => {
    const next = (currentIndex + 1) % HOTSPOTS.length;
    focusHotspot(next);
});

/* ============================================================
   TOUR GUIDÉ
============================================================ */
function startTour() {
    isTourActive = true;
    tourBtn.textContent = '⏹ Arrêter le Tour';
    tourBtn.classList.add('active');
    if (currentIndex < 0) currentIndex = -1;

    function step() {
        const next = (currentIndex + 1) % HOTSPOTS.length;
        focusHotspot(next);

        // Laisser la caméra arriver (~1.5s) puis activer la rotation lente autour du point
        modelViewer.autoRotate = false;
        setTimeout(() => {
            if (isTourActive) {
                modelViewer.autoRotate = true;
                modelViewer.setAttribute('rotation-per-second', '20deg');
            }
        }, 1500);
    }

    step();
    tourInterval = setInterval(step, 10000);
}

function stopTour() {
    isTourActive = false;
    clearInterval(tourInterval);
    tourInterval = null;
    modelViewer.autoRotate = false;
    modelViewer.setAttribute('rotation-per-second', '10deg'); // restaurer la valeur par défaut
    tourBtn.textContent = '▶ Tour Guidé';
    tourBtn.classList.remove('active');
}

tourBtn.addEventListener('click', () => {
    if (isTourActive) stopTour(); else startTour();
});

/* ============================================================
   KEYBOARD SHORTCUTS
============================================================ */
let toastTimer = null;
function showToast(msg) {
    kbdToast.textContent = msg;
    kbdToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => kbdToast.classList.remove('show'), 1800);
}

document.addEventListener('keydown', (e) => {
    // Don't trigger if in an input
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    switch (e.key) {
        case 'ArrowRight':
            e.preventDefault();
            const ni = (currentIndex + 1) % HOTSPOTS.length;
            focusHotspot(ni);
            showToast(`→ ${HOTSPOTS[ni].label}`);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            const pi = currentIndex <= 0 ? HOTSPOTS.length - 1 : currentIndex - 1;
            focusHotspot(pi);
            showToast(`← ${HOTSPOTS[pi].label}`);
            break;
        case 'r': case 'R':
            resetView();
            showToast('🔄 Vue réinitialisée');
            break;
        case 'f': case 'F':
            fullscreenBtn.click();
            break;
        case 't': case 'T':
            tourBtn.click();
            showToast(isTourActive ? '⏹ Tour arrêté' : '▶ Tour lancé');
            break;
        case 'Escape':
            infoPanel.classList.add('hidden');
            if (isTourActive) stopTour();
            break;
    }
});

/* ============================================================
   SIDEBAR TOGGLE
============================================================ */
toggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    toggleSidebar.querySelector('.chevron').innerText = isCollapsed ? '›' : '‹';
    toggleSidebar.classList.toggle('collapsed', isCollapsed);
    toggleSidebar.style.left = isCollapsed ? '22px' : '230px';
    setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
});

/* ============================================================
   FULLSCREEN
============================================================ */
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        viewerContainer.requestFullscreen().catch(console.error);
    } else {
        document.exitFullscreen();
    }
});

document.addEventListener('fullscreenchange', () => {
    const icon = document.querySelector('#fullscreen-icon path');
    icon.setAttribute('d', document.fullscreenElement
        ? 'M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z'
        : 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z');
});

/* ============================================================
   DYNAMIC FOV + SMART RESET
============================================================ */
modelViewer.addEventListener('camera-change', (e) => {
    if (e.detail.source === 'user-interaction') {
        modelViewer.autoRotate = false;
        if (isTourActive) stopTour();
    }
    const radius = modelViewer.getCameraOrbit().radius;
    modelViewer.fieldOfView = radius < 200
        ? `${40 + (Math.max(0, radius - 20) / 180) * 20}deg`
        : 'auto';
});

modelViewer.addEventListener('pointerdown', () => { modelViewer.interpolationDecay = 20; });
modelViewer.addEventListener('pointerup', () => {
    modelViewer.interpolationDecay = 300;
});
modelViewer.addEventListener('pointercancel', () => { modelViewer.interpolationDecay = 300; });

/* ============================================================
   MOBILE MENU TOGGLE
============================================================ */
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const headerRight = document.getElementById('header-right');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        headerRight.classList.toggle('open');
    });
    // Close menu when clicking a link
    headerRight.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            headerRight.classList.remove('open');
        });
    });
}
