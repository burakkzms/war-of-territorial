// War of Territorials - Basit Oyun Motoru
// 1. Haritanın oluşturulması ve başlangıç bölgeleri

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

// Haritada her hücre için: hangi ülke?
let mapGrid = [];

function randomInitMap() {
    // Her faction için random başlangıç noktası
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
    // Basit rastgele bölge yayılmaları
    let iterations = mapCols * mapRows;
    for (let i = 0; i < iterations; i++) {
        let r = Math.floor(Math.random() * mapRows);
        let c = Math.floor(Math.random() * mapCols);
        // Çevresinden (komşudan) ülke bulaşsın
        let factionNeighbors = [];
        [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr,dc]) => {
            let nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < mapRows && nc >= 0 && nc < mapCols && mapGrid[nr][nc] !== -1)
                factionNeighbors.push(mapGrid[nr][nc]);
        });
        if (factionNeighbors.length > 0) {
            let chosen = factionNeighbors[Math.floor(Math.random() * factionNeighbors.length)];
            mapGrid[r][c] = chosen;
        }
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

function startGame() {
    randomInitMap();
    drawMap();
}

window.onload = startGame;