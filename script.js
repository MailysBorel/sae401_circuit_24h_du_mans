// Initialisation de la carte (Vue globale)
const map = L.map('map').setView([47.95, 0.20], 4);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// Marqueur spécial Le Mans
const leMansMarker = L.marker([47.950, 0.205]).addTo(map);

leMansMarker.bindPopup(`
    <div style="text-align:center">
        <strong>Circuit des 24 Heures</strong><br>
        <button onclick="revealContent()" style="margin-top:10px; background:red; color:white; border:none; padding:5px 10px; cursor:pointer;">
            Entrer sur le circuit
        </button>
    </div>
`);

function revealContent() {
    // 1. On réduit la taille de la carte
    const mapDiv = document.getElementById('map');
    mapDiv.style.height = "50vh"; // La carte passe à moitié d'écran
    setTimeout(() => { map.invalidateSize(); }, 600); // Recalcule la carte après animation

    // 2. On affiche le Header et les Sections
    document.getElementById('main-content').classList.remove('hidden');

    // 3. On scrolle automatiquement vers le Header
    setTimeout(() => {
        document.querySelector('.main-header').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}