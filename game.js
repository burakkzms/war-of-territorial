// War of Territorials - Akıllı Yayılma, Savaş ve Çok Haritası Oyun Motoru

const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

let mapCols = 50;
let mapRows = 30;
let cellSize = 18;
canvas.width = mapCols * cellSize;
canvas.height = mapRows * cellSize;

const colors = ['#317bbb', '#e64759', '#77c949', '#fdbf27', '#7e5bef', '#43c0c1', '#f59342', '#ffc30a', '#c14f89', '#87cfeb'];
const factionNames = ['Azure Kingdom', 'Crimson Empire', 'Green Dynasty', 'Golden Realm', 'Violet Dominion', 'Cyan Federation', 'Orange Alliance', 'Yellow Confederation', 'Magenta Coalition', 'Sky Territories'];
const factionCount = colors.length;

let mapGrid = [];
let mapMask = [];
let turn = 0;
let expanding = true;
let currentMap = 'world';
let playerFaction = -1;
let gameActive = true;
let alliances = {};
let wars = {};
let eventLog = [];

function getRelationship(f1, f2) {
    if (f1 === f2) return 'self';
    const key = `${Math.min(f1, f2)},${Math.max(f1, f2)}`;
    if (wars[key]) return 'war';
    if (alliances[key]) return 'alliance';
    return 'neutral';
}

function declareWar(attacker, target) {
    const key = `${Math.min(attacker, target)},${Math.max(attacker, target)}`;
    if (getRelationship(attacker, target) === 'alliance') {
        delete alliances[key];
    }
    wars[key] = true;
    addEvent(`${factionNames[attacker]} declared war on ${factionNames[target]}!`, 'war');
}

function formAlliance(f1, f2) {
    const key = `${Math.min(f1, f2)},${Math.max(f1, f2)}`;
    if (getRelationship(f1, f2) === 'war') {
        delete wars[key];
    }
    alliances[key] = true;
    addEvent(`${factionNames[f1]} and ${factionNames[f2]} formed an alliance!`);
}

function makePeace(f1, f2) {
    const key = `${Math.min(f1, f2)},${Math.max(f1, f2)}`;
    delete alliances[key];
    delete wars[key];
    addEvent(`${factionNames[f1]} and ${factionNames[f2]} made peace!`);
}

function addEvent(message, type = 'info') {
    eventLog.unshift({ message, turn, type });
    if (eventLog.length > 20) eventLog.pop();
    updateEventsList();
}

function updateEventsList() {
    let html = '';
    eventLog.forEach(e => {
        let color = e.type === 'war' ? '#f00' : '#0f0';
        html += `<div class="alert" style="border-left-color: ${color}; font-size: 10px; padding: 5px;">${e.message}</div>`;
    });
    document.getElementById('eventsList').innerHTML = html;
}

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

function randomInitMap() {
    mapGrid = [];
    for (let r = 0; r < mapRows; r++) {
        mapGrid[r] = [];
        for (let c = 0; c < mapCols; c++) {
            mapGrid[r][c] = mapMask[r][c] === -1 ? -1 : -1;
        }
    }
    
    let attempts = 0;
    for (let i = 0; i < factionCount && attempts < 1000; i++) {
        let row = Math.floor(Math.random() * mapRows);
        let col = Math.floor(Math.random() * mapCols);
        
        if (mapGrid[row][col] === -1 && mapMask[row][col] !== -1) {
            mapGrid[row][col] = i;
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
                        if (getRelationship(f, neighbor) === 'alliance') return;
                        
                        let myPower = sizes[f] + Math.floor(Math.random()*5);
                        let enemyPower = sizes[neighbor] + Math.floor(Math.random()*5);
                        
                        if (getRelationship(f, neighbor) === 'neutral') {
                            if (Math.random() < 0.3) {
                                declareWar(f, neighbor);
                            }
                        }
                        
                        if (getRelationship(f, neighbor) === 'war') {
                            if (myPower > enemyPower) {
                                newMap[nr][nc] = f;
                                changed = true;
                            }
                        }
                    }
                });
            }
        }
    }
    mapGrid = newMap;
    return changed;
}

function checkGameOver() {
    let sizes = getFactionSizes();
    let activeFactions = 0;
    let winner = -1;
    
    for (let i = 0; i < factionCount; i++) {
        if (sizes[i] > 0) {
            activeFactions++;
            winner = i;
        }
    }
    
    if (activeFactions === 1) {
        gameActive = false;
        expanding = false;
        let message = winner === playerFaction ? `🎉 You won! ${factionNames[playerFaction]} conquered!` : `Game Over! ${factionNames[winner]} won!`;
        showGameOver(message);
    }
}

function showGameOver(message) {
    const modal = document.getElementById('gameOverModal');
    if (modal) {
        document.getElementById('gameOverMessage').innerHTML = message;
        modal.classList.add('active');
    }
}

function gameLoopStep() {
    if (!expanding || !gameActive) return;
    turn++;
    const spread = expandAndFight();
    drawMap();
    updateUI();
    checkGameOver();
    if (!spread) expanding = false;
}

function updateUI() {
    document.getElementById('timeDisplay').textContent = `Year: ${1000 + turn * 10}`;
    
    let sizes = getFactionSizes();
    if (playerFaction >= 0) {
        document.getElementById('playerInfo').innerHTML = `<strong style="color: ${colors[playerFaction]};">● ${factionNames[playerFaction]}</strong><br><span style="font-size: 11px;">Territory: ${sizes[playerFaction]} cells</span>`;
        document.getElementById('declareWarBtn').disabled = false;
        document.getElementById('allianceBtn').disabled = false;
        document.getElementById('peaceBtn').disabled = false;
    } else {
        document.getElementById('playerInfo').innerHTML = 'Select a faction';
        document.getElementById('declareWarBtn').disabled = true;
        document.getElementById('allianceBtn').disabled = true;
        document.getElementById('peaceBtn').disabled = true;
    }
    
    let html = '';
    for (let i = 0; i < factionCount; i++) {
        if (sizes[i] > 0) {
            let isPlayer = i === playerFaction;
            let rel = playerFaction >= 0 && playerFaction !== i ? getRelationship(playerFaction, i) : '';
            let icon = rel === 'alliance' ? '🤝' : rel === 'war' ? '⚔️' : '';
            html += `<div class="faction-info" onclick="window.selectFaction(${i})" style="cursor: pointer; background: ${isPlayer ? 'rgba(255,255,0,0.2)' : 'transparent'};"><div class="faction-name" style="color: ${colors[i]};">● ${factionNames[i]} ${icon}</div><div class="faction-stats">${sizes[i]} cells</div></div>`;
        }
    }
    document.getElementById('factionsList').innerHTML = html;
}

window.selectFaction = function(id) {
    playerFaction = id;
    updateUI();
};

function startGame() {
    currentMap = document.getElementById('mapSelect').value;
    mapMask = mapMasks[currentMap];
    randomInitMap();
    alliances = {};
    wars = {};
    eventLog = [];
    turn = 0;
    expanding = true;
    gameActive = true;
    playerFaction = -1;
    drawMap();
    updateUI();
    
    clearInterval(window._expandIntv);
    window._expandIntv = setInterval(gameLoopStep, 180);
}

document.getElementById('mapSelect').addEventListener('change', startGame);
document.getElementById('resetBtn').addEventListener('click', startGame);

document.getElementById('declareWarBtn').addEventListener('click', () => {
    if (playerFaction < 0) return;
    let sizes = getFactionSizes();
    let enemies = [];
    for (let i = 0; i < factionCount; i++) {
        if (i !== playerFaction && sizes[i] > 0 && getRelationship(playerFaction, i) !== 'alliance') {
            enemies.push(i);
        }
    }
    if (enemies.length > 0) {
        let enemy = enemies[Math.floor(Math.random() * enemies.length)];
        declareWar(playerFaction, enemy);
    }
});

document.getElementById('allianceBtn').addEventListener('click', () => {
    if (playerFaction < 0) return;
    let sizes = getFactionSizes();
    let candidates = [];
    for (let i = 0; i < factionCount; i++) {
        if (i !== playerFaction && sizes[i] > 0 && getRelationship(playerFaction, i) === 'neutral') {
            candidates.push(i);
        }
    }
    if (candidates.length > 0) {
        let ally = candidates[Math.floor(Math.random() * candidates.length)];
        formAlliance(playerFaction, ally);
    }
});

document.getElementById('peaceBtn').addEventListener('click', () => {
    if (playerFaction < 0) return;
    let sizes = getFactionSizes();
    let enemies = [];
    for (let i = 0; i < factionCount; i++) {
        if (i !== playerFaction && sizes[i] > 0 && getRelationship(playerFaction, i) === 'war') {
            enemies.push(i);
        }
    }
    if (enemies.length > 0) {
        let enemy = enemies[Math.floor(Math.random() * enemies.length)];
        makePeace(playerFaction, enemy);
    }
});

document.getElementById('speedSlider').addEventListener('input', (e) => {
    let speed = parseFloat(e.target.value);
    let speedName = speed === 0.5 ? 'Slow' : speed === 1 ? 'Normal' : speed === 1.5 ? 'Fast' : 'Very Fast';
    document.getElementById('speedDisplay').textContent = speedName;
    clearInterval(window._expandIntv);
    window._expandIntv = setInterval(gameLoopStep, 180 / speed);
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    expanding = !expanding;
    document.getElementById('pauseBtn').textContent = expanding ? '⏸ Pause' : '▶ Resume';
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / cellSize);
    const row = Math.floor((e.clientY - rect.top) / cellSize);
    if (row >= 0 && row < mapRows && col >= 0 && col < mapCols && mapGrid[row][col] >= 0) {
        window.selectFaction(mapGrid[row][col]);
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGame);
} else {
    startGame();
}
