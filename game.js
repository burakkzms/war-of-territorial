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
const factionNames = ['Azure Kingdom', 'Crimson Empire', 'Green Dynasty', 'Golden Realm', 'Violet Dominion', 'Cyan Federation', 'Orange Alliance', 'Yellow Confederation', 'Magenta Coalition', 'Sky Territories'];
const factionCount = colors.length;

let mapGrid = [];
let mapMask = [];
let turn = 0;
let expanding = true;
let currentMap = 'world';
let playerFaction = -1; // Oyuncunun kontrol ettiği ülke (-1 = seçilmedi)
let gameActive = true;

// ==================== HARITA MASKELERİ ====================

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
    let mask = [];
    for (let r = 0; r < mapRows; r++) {
        mask[r] = [];
        for (let c = 0; c < mapCols; c++) {
            mask[r][c] = 0;
        }
    }
    return mask;
}

function createEuropeMask() {
    let mask = Array(mapRows).fill(null).map(() => Array(mapCols).fill(-1));
    for (let r = 8; r < 20; r++) {
        for (let c = 5; c < 20; c++) {
            mask[r][c] = 0;
        }
    }
    for (let r = 15; r < 25; r++) {
        for (let c = 18; c < 28; c++) {
            mask[r][c] = 0;
        }
    }
    for (let r = 5; r < 22; r++) {
        for (let c = 25; c < 40; c++) {
            mask[r][c] = 0;
        }
    }
    for (let r = 2; r < 10; r++) {
        for (let c = 18; c < 35; c++) {
            mask[r][c] = 0;
        }
    }
    return mask;
}

function createNorthAmericaMask() {
    let mask = Array(mapRows).fill(null).map(() => Array(mapCols).fill(-1));
    for (let r = 3; r < 25; r++) {
        for (let c = 5; c < 25; c++) {
            mask[r][c] = 0;
        }
    }
    return mask;
}

function createSouthAmericaMask() {
    let mask = Array(mapRows).fill(null).map(() => Array(mapCols).fill(-1));
    for (let r = 10; r < 28; r++) {
        for (let c = 12; c < 22; c++) {
            mask[r][c] = 0;
        }
    }
    return mask;
}

function createMiddleEastMask() {
    let mask = Array(mapRows).fill(null).map(() => Array(mapCols).fill(-1));
    for (let r = 8; r < 25; r++) {
        for (let c = 20; c < 40; c++) {
            mask[r][c] = 0;
        }
    }
    return mask;
}

function createAsiaMask() {
    let mask = Array(mapRows).fill(null).map(() => Array(mapCols).fill(-1));
    for (let r = 5; r < 26; r++) {
        for (let c = 25; c < 50; c++) {
            mask[r][c] = 0;
        }
    }
    return mask;
}

function createAfricaMask() {
    let mask = Array(mapRows).fill(null).map(() => Array(mapCols).fill(-1));
    for (let r = 12; r < 28; r++) {
        for (let c = 15; c < 35; c++) {
            mask[r][c] = 0;
        }
    }
    return mask;
}

function createAnatoliaMask() {
    let mask = Array(mapRows).fill(null).map(() => Array(mapCols).fill(-1));
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
                mapGrid[r][c] = -1;
            } else {
                mapGrid[r][c] = -1;
            }
        }
    }
    
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
                ctx.fillStyle = '#111';
            } else if (f >= 0) {
                ctx.fillStyle = colors[f];
                // Oyuncu ülkesini daha parlak göster
                if (f === playerFaction) {
                    ctx.fillStyle = colors[f];
                }
            } else {
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
                    if (mapMask[nr][nc] === -1) return;
                    
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
    if (!expanding || !gameActive) return;
    turn++;
    const spread = expandAndFight();
    drawMap();
    updateUI();
    if (!spread) expanding = false;
}

function updateUI() {
    document.getElementById('timeDisplay').textContent = `Year: ${1000 + turn * 10}`;
    
    // Oyuncu bilgisi güncelle
    if (playerFaction >= 0) {
        let sizes = getFactionSizes();
        document.getElementById('playerInfo').innerHTML = `
            <div style="text-align: left;">
                <strong style="color: ${colors[playerFaction]};">● ${factionNames[playerFaction]}</strong><br>
                <span style="font-size: 11px; color: #aaa;">Territory: ${sizes[playerFaction]} cells</span>
            </div>
        `;
    }
    
    // Tüm ülkeleri listele
    let sizes = getFactionSizes();
    let factionsList = '<div class="legend">';
    for (let i = 0; i < factionCount; i++) {
        if (sizes[i] > 0) {
            let isPlayer = i === playerFaction;
            factionsList += `
                <div class="legend-item" onclick="selectFaction(${i})" style="cursor: pointer; padding: 5px; background: ${isPlayer ? 'rgba(255,255,0,0.2)' : 'transparent'}; border-radius: 3px;">
                    <div class="legend-color" style="background: ${colors[i]};"></div>
                    <span style="font-size: 11px;">${factionNames[i]}: ${sizes[i]}</span>
                </div>
            `;
        }
    }
    factionsList += '</div>';
    document.getElementById('factionsList').innerHTML = factionsList;
}

function selectFaction(factionId) {
    playerFaction = factionId;
    updateUI();
    console.log(`You selected ${factionNames[factionId]}`);
}

function startGame() {
    currentMap = document.getElementById('mapSelect').value;
    mapMask = mapMasks[currentMap];
    randomInitMap();
    turn = 0;
    expanding = true;
    gameActive = true;
    playerFaction = -1;
    drawMap();
    updateUI();
    
    clearInterval(window._expandIntv);
    window._expandIntv = setInterval(gameLoopStep, 180);
}

// ==================== ARAYÜZ ETKİLEŞİMLERİ ====================

// Harita tıklama - ülke seçme
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    
    if (row >= 0 && row < mapRows && col >= 0 && col < mapCols) {
        const factionAtClick = mapGrid[row][col];
        if (factionAtClick >= 0) {
            selectFaction(factionAtClick);
        }
    }
});

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
