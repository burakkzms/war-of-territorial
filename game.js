// War of Territorials - Akıllı Yayılma, Savaş ve Çok Haritası Oyun Motoru
// Her haritanın gerçekçi sınırları var ve seçmeli olarak oynanabilir

const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

let mapCols = 50;
let mapRows = 30;
let cellSize = 18;
canvas.width = mapCols * cellSize;
canvas.height = mapRows * cellSize;

const colors = [
    '#317bbb', '#e64759', '#77c949', '#fdbf27', '#7e5bef', '#43c0c1', '#f59342', '#ffc30a', '#c14f89', '#87cfeb',
];
const factionCount = colors.length;

let mapGrid = [];
let mapMask = []; // Oynanabilir bölgeler (-1 = boş, 0+ = ülke)
let turn = 0;
let expanding = true;
let currentMap = 'world';

// ==================== HARITA MASKELERİ ====================
// Harita maskeleri: -1 = boş (oyun alanı değil), 0+ = oynanabilir bölge

const mapMasks = {
    world: createWorldMask(),
    europe: createEuropeMask(),
    north_america: createNorthAmericaMask(),
    south_america: createSouthAmericaMask(),
    middle_east: createMiddleEastMask(),
    asia: createAsiaMask(),
    africa: createAfricaMask(),
    anatolia: createAnatoliaMask(),
};

function createWorldMask() {
    // Basit dünya haritası: tüm alanı oynanabilir yap
    let mask = [];
    for (let r = 0; r < mapRows; r++) {
        mask[r] = [];
        for (let c = 0; c < mapCols; c++) {
            mask[r][c] = 0; // Tüm alanı oynanabilir
        }
    }
    return mask;
}

function createEuropeMask() {
    // Avrupa haritası (sadeleştirilmiş gerçekçi sınırlar)
    // 0-49 col, 0-29 row içinde Avrupa şeklini temsil ediyor
    let mask = Array(mapRows).fill(null).map(() => Array(mapCols).fill(-1));
    
    // Batı Avrupa (İspanya, Fransa, İngiltere, Almanya)
    for (let r = 8; r < 20; r++) {
        for (let c = 5; c < 20; c++) {
            mask[r][c] = 0;
        }
    }
    
    // Güney Avrupa (İtalya, Yunanistan)
    for (let r = 15; r < 25; r++) {
        for (let c = 18; c < 28; c++) {
            mask[r][c] = 0;
        }
    }
    
    // Doğu Avrupa (Polonya, Rusya)
    for (let r = 5; r < 22; r++) {
        for (let c = 25; c < 40; c++) {
            mask[r][c] = 0;
        }
    }
    
    // Kuzey Avrupa (İskandinav)
    for (let r = 2; r < 10; r++) {
        for (let c = 18; c < 35; c++) {
            mask[r][c] = 0;
        }
    }
    
    return mask;
}

function createNorthAmericaMask() {
    let mask = Array(mapRows).fill(null).map(() => Array(mapCols).fill(-1));
    
    // Kuzey Amerika şekli (USA, Canada, Mexico)
    for (let r = 3; r < 25; r++) {
        for (let c = 5; c < 25; c++) {
            mask[r][c] = 0;
        }
    }
    
    return mask;
}

function createSouthAmericaMask() {
    let mask = Array(mapRows).fill(null).map(() => Array(mapCols).fill(-1));
    
    // Güney Amerika şekli
    for (let r = 10; r < 28; r++) {
        for (let c = 12; c < 22; c++) {
            mask[r][c] = 0;
        }
    }
    
    return mask;
}

function createMiddleEastMask() {
    let mask = Array(mapRows).fill(null).map(() => Array(mapCols).fill(-1));
    
    // Orta Doğu (Türkiye, İran, Irak, Suudi Arabistan)
    for (let r = 8; r < 25; r++) {
        for (let c = 20; c < 40; c++) {
            mask[r][c] = 0;
        }
    }
    
    return mask;
}

function createAsiaMask() {
    let mask = Array(mapRows).fill(null).map(() => Array(mapCols).fill(-1));
    
    // Asya (Çin, Hindistan, Japonya, vs.)
    for (let r = 5; r < 26; r++) {
        for (let c = 25; c < 50; c++) {
            mask[r][c] = 0;
        }
    }
    
    return mask;
}

function createAfricaMask() {
    let mask = Array(mapRows).fill(null).map(() => Array(mapCols).fill(-1));
    
    // Afrika
    for (let r = 12; r < 28; r++) {
        for (let c = 15; c < 35; c++) {
            mask[r][c] = 0;
        }
    }
    
    return mask;
}

function createAnatoliaMask() {
    let mask = Array(mapRows).fill(null).map(() => Array(mapCols).fill(-1));
    
    // Anadolu/Türkiye detaylı
    for (let r = 12; r < 22; r++) {
        for (let c = 22; c < 32; c++) {
            mask[r][c] = 0;
        }
    }
    
    return mask;
}

// ==================== OYUN LOJİĞİ ====================

function randomInitMap() {
    let seeds = [];
    mapGrid = [];
    for (let r = 0; r < mapRows; r++) {
        mapGrid[r] = [];
        for (let c = 0; c < mapCols; c++) {
            if (mapMask[r][c] === -1) {
                mapGrid[r][c] = -1; // Oyun alanı dışı
            } else {
                mapGrid[r][c] = -1; // Başlangıçta boş oynanabilir alanlar
            }
        }
    }
    
    // Rastgele başlangıç noktaları
    let attempts = 0;
    for (let i = 0; i < factionCount && attempts < 1000; i++) {
        let row = Math.floor(Math.random() * mapRows);
        let col = Math.floor(Math.random() * mapCols);
        
        if (mapGrid[row][col] === -1 && mapMask[row][col] !== -1) {
            mapGrid[row][col] = i;
            seeds.push({ row, col, id: i });
        }
        attempts++;
    }
}

function drawMap() {
    for (let r = 0; r < mapRows; r++) {
        for (let c = 0; c < mapCols; c++) {
            let f = mapGrid[r][c];
            
            if (mapMask[r][c] === -1) {
                // Oyun alanı dışı - mat siyah
                ctx.fillStyle = '#111';
            } else if (f >= 0) {
                // Ülke alanı - renk
                ctx.fillStyle = colors[f];
            } else {
                // Boş oynanabilir alan - koyu arka plan
                ctx.fillStyle = '#2a2a2a';
            }
            
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#222';
            ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
    }
}

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
    
    for (let f = 0; f < factionCount; f++) {
        for (let r = 0; r < mapRows; r++) {
            for (let c = 0; c < mapCols; c++) {
                if (mapGrid[r][c] !== f) continue;
                
                [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr,dc]) => {
                    let nr = r+dr, nc = c+dc;
                    if (nr<0 || nr>=mapRows || nc<0 || nc>=mapCols) return;
                    if (mapMask[nr][nc] === -1) return; // Oyun alanı dışı
                    
                    const neighbor = mapGrid[nr][nc];
                    
                    if (neighbor === -1 && newMap[nr][nc] === -1) {
                        newMap[nr][nc] = f;
                        changed = true;
                    } else if (neighbor >= 0 && neighbor !== f && newMap[nr][nc] !== f) {
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
    updateUI();
    if (!spread) expanding = false;
}

function updateUI() {
    document.getElementById('timeDisplay').textContent = `Year: ${1000 + turn * 10}`;
}

function startGame() {
    currentMap = document.getElementById('mapSelect').value;
    mapMask = mapMasks[currentMap];
    randomInitMap();
    turn = 0;
    expanding = true;
    drawMap();
    updateUI();
    
    clearInterval(window._expandIntv);
    window._expandIntv = setInterval(gameLoopStep, 180);
}

// ==================== ARAYÜZ ETKİLEŞİMLERİ ====================

document.getElementById('mapSelect').addEventListener('change', startGame);
document.getElementById('resetBtn').addEventListener('click', startGame);

document.getElementById('speedSlider').addEventListener('input', (e) => {
    let speed = parseFloat(e.target.value);
    let speedName = speed === 0.5 ? 'Slow' : speed === 1 ? 'Normal' : speed === 1.5 ? 'Fast' : 'Very Fast';
    document.getElementById('speedDisplay').textContent = speedName;
    
    let interval = 180 / speed;
    clearInterval(window._expandIntv);
    window._expandIntv = setInterval(gameLoopStep, interval);
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    expanding = !expanding;
    document.getElementById('pauseBtn').textContent = expanding ? '⏸ Pause' : '▶ Resume';
});

window.onload = startGame;
