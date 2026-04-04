const map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        sources: {
            'raster-tiles': {
                type: 'raster',
                tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                tileSize: 256,
                attribution: 'Esri'
            }
        },
        layers: [{ id: 'simple-tiles', type: 'raster', source: 'raster-tiles' }]
    },
    center: [0, 20],
    zoom: 1.8,
    projection: 'globe'
});

// 1. Rotation douce qui s'arrête au clic
let isRotating = true;
function rotateGlobe() {
    if (isRotating && map.getZoom() < 4) {
        map.setCenter([map.getCenter().lng + 0.15, map.getCenter().lat]);
        requestAnimationFrame(rotateGlobe);
    }
}
// On arrête la rotation dès que l'utilisateur interagit avec la souris ou au doigt
map.on('mousedown', () => { isRotating = false; });
map.on('touchstart', () => { isRotating = false; });
rotateGlobe();

// 2. Configuration de la Popup (SANS l'ouvrir tout de suite)
const popup = new maplibregl.Popup({ 
    offset: 25, 
    closeButton: true, 
    closeOnClick: true 
}).setHTML(
    `<div style="color:#000; padding:5px;">
        <h3 style="margin:0 0 10px 0;">Le Mans</h3>
        <button id="enter-btn" style="background:#e10600; color:white; border:none; padding:10px 15px; cursor:pointer; font-weight:bold; border-radius:4px;">
            ENTRER SUR LE CIRCUIT
        </button>
    </div>`
);

// 3. Le Marqueur
const marker = new maplibregl.Marker({ color: "#ff0000" })
    .setLngLat([0.205, 47.950])
    .setPopup(popup) // La popup est liée mais reste cachée
    .addTo(map);

/* ===================================================
   CHECKERED FLAG TRANSITION
=================================================== */
function buildCheckerOverlay() {
    const overlay = document.getElementById('checker-overlay');
    overlay.innerHTML = '';
    const COLS = 10;
    const ROWS = 6;
    overlay.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

    for (let c = 0; c < COLS; c++) {
        const col = document.createElement('div');
        col.className = 'checker-col';
        col.style.transitionDelay = `${c * 42}ms`;
        for (let r = 0; r < ROWS; r++) {
            const cell = document.createElement('div');
            cell.className = 'checker-cell';
            const isBlack = (c + r) % 2 === 0;
            cell.style.background = isBlack ? '#000' : '#fff';
            col.appendChild(cell);
        }
        overlay.appendChild(col);
    }
}
buildCheckerOverlay();

function launchCheckerFlag(callback) {
    const cols = document.querySelectorAll('.checker-col');
    cols.forEach(col => col.classList.add('drop'));
    setTimeout(callback, 1000); // dernière colonne finit à ~828ms (378ms stagger + 450ms transition)
}

/* ===================================================
   SPEED LINES CANVAS
=================================================== */
const speedCanvas = document.getElementById('speed-canvas');
const sCtx = speedCanvas.getContext('2d');
function resizeSpeedCanvas() {
    speedCanvas.width = window.innerWidth;
    speedCanvas.height = window.innerHeight;
}
resizeSpeedCanvas();
window.addEventListener('resize', resizeSpeedCanvas);

let speedIntensity = 0;

function drawSpeedLines(intensity) {
    const w = speedCanvas.width;
    const h = speedCanvas.height;
    const cx = w / 2, cy = h / 2;
    sCtx.clearRect(0, 0, w, h);

    const lineCount = 80;
    for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const len = (200 + Math.random() * 400) * intensity;
        const startR = 80 + Math.random() * 100;

        sCtx.beginPath();
        sCtx.moveTo(cx + Math.cos(angle) * startR, cy + Math.sin(angle) * startR);
        sCtx.lineTo(cx + Math.cos(angle) * (startR + len), cy + Math.sin(angle) * (startR + len));
        sCtx.strokeStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.12 * intensity})`;
        sCtx.lineWidth = 0.5 + Math.random() * 1.5;
        sCtx.stroke();
    }
}

// 4. Action quand on clique sur le bouton DANS la popup
document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'enter-btn') {
        isRotating = false; // Stop rotation si ce n'est pas déjà fait
        
        // Zoom cinématique
        map.flyTo({
            center: [0.205, 47.950],
            zoom: 15,
            pitch: 65,
            speed: 0.6,
            essential: true
        });

        const DURATION = 4500;
        let tStart = null;
        let flagLaunched = false;

        document.getElementById('speed-canvas').classList.add('active');
        document.getElementById('speed-overlay').classList.add('active');

        function zoomAnim(ts) {
            if (!tStart) tStart = ts;
            const t = Math.min((ts - tStart) / DURATION, 1);

            speedIntensity = Math.min(t * 1.8, 1.0);
            drawSpeedLines(speedIntensity);

            document.getElementById('zoom-cta').classList.toggle('visible', t > 0.2 && t < 0.77);

            if (t > 0.77 && !flagLaunched) {
                flagLaunched = true;
                document.getElementById('zoom-cta').classList.remove('visible');
                launchCheckerFlag(() => {
                    window.location.href = 'circuit2.html';
                });
            }

            if (t < 1) {
                requestAnimationFrame(zoomAnim);
            }
        }
        
        requestAnimationFrame(zoomAnim);
    }
});
