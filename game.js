// War of Territorials - Basit Oyun Motoru
// 1. Haritanın oluşturulması ve başlangıç bölgeleri
// 2. Uluslar tur bazlı yayılabiliyor!

const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

// Harita ayarları
const mapCols = 50;
const mapRows = 30;
const cellSize = 18; // px
canvas.width = mapCols * cellSize;
canvas.height = mapRows * cellSize;

// Ulus/faction renkleri
const colors = [
    '#317bbb', '#e64759', '#77c949', '#fdbf27', '#7e5bef', '#43c0c1', '#f59342', '#ffc30a', '#c14f89', '#87cfeb',
];
const factionCount = colors.length;

let mapGrid = [];
let turn = 0;
let expanding = true; // Yayılma devam ediyor mu?

function randomInitMap() {
    let seeds = [];
    mapGrid = [];
    for (let r = 0; r < mapRows; r++) {
        mapGrid[r] = [];
        for (let c = 0; c < mapCols; c++) {
            mapGrid[r][c] = -1;
        }
    }
    for (let i = 0; i < factionCount; i++) {
        let row = Math.floor(Math.random() * mapRows);
        let col = Math.floor(Math.random() * mapCols);
        seeds.push({ row, col, id: i });
        mapGrid[row][col] = i;
    }
}

function drawMap() {
    for (let r = 0; r < mapRows; r++) {
        for (let c = 0; c < mapCols; c++) {
            let f = mapGrid[r][c];
            ctx.fillStyle = (f >= 0) ? colors[f] : '#333';
            ctx.fillRect(c*cellSize, r*cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#222';
            ctx.strokeRect(c*cellSize, r*cellSize, cellSize, cellSize);
        }
    }
}

function expandTerritories() {
    // Yayılma algoritması: boş komşuları mevcut ülkelere ata
    let changed = false;
    let newMap = JSON.parse(JSON.stringify(mapGrid));
    for (let r = 0; r < mapRows; r++) {
        for (let c = 0; c < mapCols; c++) {
            if (mapGrid[r][c] === -1) { // boşsa
                // Çevrede ülke varsa oradan "yayılma"
                let factionNeighbors = [];
                [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr,dc]) => {
                    let nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < mapRows && nc >= 0 && nc < mapCols && mapGrid[nr][nc] !== -1)
                        factionNeighbors.push(mapGrid[nr][nc]);
                });
                if (factionNeighbors.length > 0) {
                    let chosen = factionNeighbors[Math.floor(Math.random() * factionNeighbors.length)];
                    newMap[r][c] = chosen;
                    changed = true;
                }
            }
        }
    }
    mapGrid = newMap;
    return changed;
}

function gameLoopStep() {
    if (!expanding) return;
    turn++;
    const spread = expandTerritories();
    drawMap();
    if (!spread) expanding = false; // Bitince dur
}

function startGame() {
    randomInitMap();
    turn = 0;
    expanding = true;
    drawMap();
    // Loop başlat
    clearInterval(window._expandIntv);
    window._expandIntv = setInterval(gameLoopStep, 180);
}

window.onload = startGame;
// Yeni oyun için reset dinleyicisini de ekleyebilirsin
const resetBtn = document.getElementById('resetBtn');
if (resetBtn) resetBtn.onclick = startGame;
