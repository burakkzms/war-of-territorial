// War of Territorials - Akıllı Yayılma ve Savaş Oyun Motoru
// Boş bölgelere ve komşu ülkelere aynı anda genişleme + savaş mekaniği

const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
const mapCols = 50;
const mapRows = 30;
const cellSize = 18;
canvas.width = mapCols * cellSize;
canvas.height = mapRows * cellSize;

const colors = [
    '#317bbb', '#e64759', '#77c949', '#fdbf27', '#7e5bef', '#43c0c1', '#f59342', '#ffc30a', '#c14f89', '#87cfeb',
];
const factionCount = colors.length;

let mapGrid = [];
let turn = 0;
let expanding = true;

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
        // Aynı noktaya çakışma yok
        while (mapGrid[row][col] !== -1) {
            row = Math.floor(Math.random() * mapRows);
            col = Math.floor(Math.random() * mapCols);
        }
        seeds.push({ row, col, id: i });
        mapGrid[row][col] = i;
    }
}

function drawMap() {
    for (let r = 0; r < mapRows; r++) {
        for (let c = 0; c < mapCols; c++) {
            let f = mapGrid[r][c];
            ctx.fillStyle = (f >= 0) ? colors[f] : '#333';
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#222';
            ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
    }
}

// Her ülkenin büyüklüğü (toprak sayısı) güncellenir
function getFactionSizes() {
    let sizes = Array(factionCount).fill(0);
    for (let r = 0; r < mapRows; r++) {
        for (let c = 0; c < mapCols; c++) {
            let f = mapGrid[r][c];
            if (f >= 0) sizes[f]++;
        }
    }
    return sizes;
}

function expandAndFight() {
    let changed = false;
    let newMap = JSON.parse(JSON.stringify(mapGrid));
    let sizes = getFactionSizes();
    // Her ülkenin elindeki tüm hücrelerden yayılım (aynı anda)
    for (let f = 0; f < factionCount; f++) {
        for (let r = 0; r < mapRows; r++) {
            for (let c = 0; c < mapCols; c++) {
                if (mapGrid[r][c] !== f) continue;
                // Komşulara bak
                [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr,dc]) => {
                    let nr = r+dr, nc = c+dc;
                    if (nr<0 || nr>=mapRows || nc<0 || nc>=mapCols) return;
                    const neighbor = mapGrid[nr][nc];
                    // Boşsa direkt yay
                    if (neighbor === -1 && newMap[nr][nc] === -1) {
                        newMap[nr][nc] = f;
                        changed = true;
                    }
                    // Başka ülke ise savaş
                    else if (
                        neighbor >= 0 && neighbor !== f && newMap[nr][nc] !== f
                    ) {
                        let myPower = sizes[f] + Math.floor(Math.random()*5);
                        let enemyPower = sizes[neighbor] + Math.floor(Math.random()*5);
                        if (myPower > enemyPower) {
                            newMap[nr][nc] = f;
                            changed = true;
                        }
                    }
                });
            }
        }
    }
    mapGrid = newMap;
    return changed;
}

function gameLoopStep() {
    if (!expanding) return;
    turn++;
    const spread = expandAndFight();
    drawMap();
    if (!spread) expanding = false;
}

function startGame() {
    randomInitMap();
    turn = 0;
    expanding = true;
    drawMap();
    clearInterval(window._expandIntv);
    window._expandIntv = setInterval(gameLoopStep, 180);
}

window.onload = startGame;
const resetBtn = document.getElementById('resetBtn');
if (resetBtn) resetBtn.onclick = startGame;
