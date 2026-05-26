"use strict";

const TILE = 64;
const COLS = 15;
const ROWS = 10;
const CANVAS_W = COLS * TILE;
const CANVAS_H = ROWS * TILE;
const MAX_WAVES = 10;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const stageSelect = document.getElementById("stageSelect");
const stageCards = document.getElementById("stageCards");
const gameScreen = document.getElementById("gameScreen");
const towerMenu = document.getElementById("towerMenu");
const resultOverlay = document.getElementById("resultOverlay");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const selectionPanel = document.getElementById("selectionPanel");
const towerGuide = document.getElementById("towerGuide");
const wavePreview = document.getElementById("wavePreview");
const coinsText = document.getElementById("coinsText");
const healthText = document.getElementById("healthText");
const waveText = document.getElementById("waveText");
const stageNameText = document.getElementById("stageNameText");
const countdownText = document.getElementById("countdownText");
const startWaveBtn = document.getElementById("startWaveBtn");
const soundToggle = document.getElementById("soundToggle");
const toastLayer = document.getElementById("toastLayer");

canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const spriteSheet = new Image();
spriteSheet.src = "./assets/garden-guard-sprites.png";
let spritesReady = false;
spriteSheet.addEventListener("load", () => {
  spritesReady = true;
});

const spriteSlots = {
  sunflower: [0, 0],
  hedgehog: [1, 0],
  mushroom: [2, 0],
  frog: [3, 0],
  carrot: [0, 1],
  bee: [1, 1],
  ant: [2, 1],
  beetle: [3, 1],
  caterpillar: [0, 2],
  mosquito: [1, 2],
  shield: [2, 2],
  boss: [3, 2],
  baby: [0, 2],
};

const towerAnimImages = {
  sunflower: loadImage("./assets/animations/towers/sunflower.png"),
  hedgehog: loadImage("./assets/animations/towers/hedgehog.png"),
  mushroom: loadImage("./assets/animations/towers/mushroom.png"),
  frog: loadImage("./assets/animations/towers/frog.png"),
  carrot: loadImage("./assets/animations/towers/carrot.png"),
  bee: loadImage("./assets/animations/towers/bee.png"),
};

const enemyAnimImages = {
  ant: loadImage("./assets/animations/enemies/ant.png"),
  beetle: loadImage("./assets/animations/enemies/beetle.png"),
  caterpillar: loadImage("./assets/animations/enemies/caterpillar.png"),
  baby: loadImage("./assets/animations/enemies/caterpillar.png"),
  mosquito: loadImage("./assets/animations/enemies/mosquito.png"),
  shield: loadImage("./assets/animations/enemies/shield.png"),
  boss: loadImage("./assets/animations/enemies/boss.png"),
};

const tileType = {
  PLANT: "plant",
  ANIMAL: "animal",
  PREMIUM: "premium",
};

const stages = [
  {
    name: "Sunny Sprout Patch",
    difficulty: "Easy",
    coins: 185,
    health: 3,
    description: "A friendly first garden with generous corners and many plant beds.",
    path: [
      [-1, 1],
      [1, 1],
      [1, 4],
      [5, 4],
      [5, 2],
      [9, 2],
      [9, 6],
      [13, 6],
      [13, 8],
      [15, 8],
    ],
    buildTiles: [
      [2, 1, "plant"],
      [0, 3, "plant"],
      [2, 5, "animal"],
      [4, 3, "premium"],
      [6, 4, "plant"],
      [7, 1, "animal"],
      [10, 1, "plant"],
      [8, 5, "animal"],
      [10, 7, "premium"],
      [12, 5, "plant"],
      [12, 8, "animal"],
      [4, 6, "plant"],
    ],
  },
  {
    name: "Pumpkin Bend",
    difficulty: "Medium",
    coins: 165,
    health: 3,
    description: "A tighter route where anti-air and splash coverage start to matter.",
    path: [
      [-1, 8],
      [2, 8],
      [2, 5],
      [6, 5],
      [6, 7],
      [10, 7],
      [10, 3],
      [4, 3],
      [4, 1],
      [15, 1],
    ],
    buildTiles: [
      [1, 7, "animal"],
      [3, 8, "plant"],
      [1, 4, "plant"],
      [4, 5, "premium"],
      [6, 4, "animal"],
      [7, 7, "plant"],
      [9, 6, "animal"],
      [11, 7, "plant"],
      [11, 3, "premium"],
      [8, 2, "animal"],
      [5, 2, "plant"],
      [12, 0, "plant"],
      [13, 2, "animal"],
    ],
  },
  {
    name: "Moonlit Melon Maze",
    difficulty: "Hard",
    coins: 150,
    health: 3,
    description: "Long sight lines are rare, and shield bugs love the crowded middle.",
    path: [
      [-1, 5],
      [1, 5],
      [1, 2],
      [4, 2],
      [4, 7],
      [7, 7],
      [7, 3],
      [11, 3],
      [11, 8],
      [14, 8],
      [14, 0],
      [15, 0],
    ],
    buildTiles: [
      [0, 4, "plant"],
      [2, 5, "animal"],
      [2, 1, "plant"],
      [5, 2, "animal"],
      [3, 6, "premium"],
      [5, 8, "plant"],
      [8, 7, "animal"],
      [6, 4, "plant"],
      [8, 2, "premium"],
      [10, 4, "plant"],
      [12, 3, "animal"],
      [10, 8, "animal"],
      [13, 7, "plant"],
      [13, 1, "premium"],
    ],
  },
];

const towerTypes = {
  sunflower: {
    name: "Sunflower",
    icon: "🌻",
    family: "plant",
    cost: 45,
    damage: 6,
    range: 116,
    rate: 0.85,
    effect: "Slows bugs in range",
    color: "#ffd84f",
  },
  hedgehog: {
    name: "Hedgehog",
    icon: "🦔",
    family: "animal",
    cost: 60,
    damage: 7,
    range: 88,
    rate: 0.24,
    effect: "Very fast pokes",
    color: "#9a6a48",
  },
  mushroom: {
    name: "Mushroom",
    icon: "🍄",
    family: "plant",
    cost: 85,
    damage: 16,
    range: 132,
    rate: 1.05,
    splash: 58,
    effect: "Splash spores",
    color: "#ff6377",
  },
  frog: {
    name: "Frog",
    icon: "🐸",
    family: "animal",
    cost: 95,
    damage: 24,
    range: 184,
    rate: 1.35,
    antiAir: true,
    effect: "Long range anti-air",
    color: "#4fbf63",
  },
  carrot: {
    name: "Carrot Cannon",
    icon: "🥕",
    family: "plant",
    cost: 130,
    damage: 48,
    range: 154,
    rate: 1.6,
    effect: "Heavy single-target hit",
    color: "#ff8e3c",
  },
  bee: {
    name: "Bee Hive",
    icon: "🍯",
    family: "animal",
    cost: 100,
    damage: 8,
    range: 142,
    rate: 0.72,
    multi: 3,
    antiAir: true,
    effect: "Hits several small bugs",
    color: "#f0b42f",
  },
};

const enemyTypes = {
  ant: {
    name: "Ant",
    icon: "•",
    specialIcon: "",
    maxHp: 32,
    speed: 54,
    reward: 8,
    damage: 1,
    radius: 15,
    color: "#54311f",
  },
  beetle: {
    name: "Beetle",
    icon: "◆",
    specialIcon: "🛡",
    maxHp: 105,
    speed: 34,
    reward: 18,
    damage: 2,
    radius: 18,
    armored: true,
    color: "#395b88",
  },
  caterpillar: {
    name: "Caterpillar",
    icon: "☘",
    specialIcon: "✂",
    maxHp: 130,
    speed: 42,
    reward: 22,
    damage: 2,
    radius: 18,
    splits: true,
    color: "#75b843",
  },
  baby: {
    name: "Baby Caterpillar",
    icon: "·",
    specialIcon: "",
    maxHp: 34,
    speed: 66,
    reward: 5,
    damage: 1,
    radius: 12,
    color: "#a5d760",
  },
  mosquito: {
    name: "Mosquito",
    icon: "✦",
    specialIcon: "↟",
    maxHp: 42,
    speed: 84,
    reward: 16,
    damage: 1,
    radius: 14,
    flying: true,
    color: "#7d67a8",
  },
  shield: {
    name: "Shield Bug",
    icon: "⬢",
    specialIcon: "◎",
    maxHp: 115,
    speed: 38,
    reward: 25,
    damage: 2,
    radius: 18,
    shieldAura: 86,
    color: "#3ca978",
  },
  boss: {
    name: "Boss Bug",
    icon: "★",
    specialIcon: "♛",
    maxHp: 680,
    speed: 28,
    reward: 95,
    damage: 8,
    radius: 28,
    boss: true,
    color: "#c44c65",
  },
};

const state = {
  mode: "stages",
  stageIndex: 0,
  stage: null,
  coins: 0,
  health: 0,
  wave: 0,
  countdown: 0,
  waveActive: false,
  spawns: [],
  spawnTimer: 0,
  enemies: [],
  towers: [],
  projectiles: [],
  effects: [],
  waveLeaks: 0,
  waveLivesLost: 0,
  selectedTile: null,
  selectedTower: null,
  mouse: { x: 0, y: 0 },
  lastTime: performance.now(),
  sound: true,
  audio: null,
  pathPoints: [],
  pathCells: new Set(),
  buildMap: new Map(),
  result: null,
};

function centerOf(cell) {
  return { x: cell[0] * TILE + TILE / 2, y: cell[1] * TILE + TILE / 2 };
}

function keyFor(x, y) {
  return `${x},${y}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function imageReady(image) {
  return Boolean(image?.complete && image.naturalWidth > 0);
}

function init() {
  renderStageCards();
  renderTowerGuide();
  wireEvents();
  requestAnimationFrame(loop);
}

function wireEvents() {
  startWaveBtn.addEventListener("click", startWave);
  document.getElementById("backToStages").addEventListener("click", showStageSelect);
  document.getElementById("chooseStage").addEventListener("click", showStageSelect);
  document.getElementById("restartStage").addEventListener("click", () => startStage(state.stageIndex));
  soundToggle.addEventListener("click", () => {
    state.sound = !state.sound;
    soundToggle.textContent = state.sound ? "♪" : "×";
    unlockAudio();
  });

  canvas.addEventListener("mousemove", (event) => {
    state.mouse = getCanvasPoint(event);
  });
  canvas.addEventListener("mouseleave", () => {
    state.mouse = { x: -999, y: -999 };
  });
  canvas.addEventListener("click", handleCanvasClick);
  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    handleRightClick(event);
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeTowerMenu();
  });
}

function unlockAudio() {
  if (!state.audio) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) state.audio = new AudioContext();
  }
  if (state.audio?.state === "suspended") state.audio.resume();
}

function playSound(kind) {
  if (!state.sound) return;
  unlockAudio();
  if (!state.audio) return;
  const sounds = {
    place: [440, 0.07, "triangle", 0.06],
    hit: [260, 0.04, "square", 0.035],
    coin: [720, 0.08, "sine", 0.05],
    leak: [120, 0.18, "sawtooth", 0.045],
    win: [880, 0.18, "triangle", 0.08],
    lose: [95, 0.35, "sawtooth", 0.06],
    upgrade: [620, 0.1, "sine", 0.07],
  };
  const [freq, duration, type, gainValue] = sounds[kind] || sounds.hit;
  const osc = state.audio.createOscillator();
  const gain = state.audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(gainValue, state.audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, state.audio.currentTime + duration);
  osc.connect(gain);
  gain.connect(state.audio.destination);
  osc.start();
  osc.stop(state.audio.currentTime + duration);
}

function renderStageCards() {
  stageCards.innerHTML = "";
  stages.forEach((stage, index) => {
    const card = document.createElement("article");
    card.className = "stage-card";
    const mini = document.createElement("canvas");
    mini.className = "mini-map";
    mini.width = 320;
    mini.height = 110;
    drawMiniMap(mini, stage);
    card.innerHTML = `
      <div>
        <h2>${stage.name}</h2>
        <div class="type-chip">${stage.difficulty}</div>
      </div>
      <p>${stage.description}</p>
    `;
    const button = document.createElement("button");
    button.textContent = "Play Stage";
    button.addEventListener("click", () => startStage(index));
    card.insertBefore(mini, card.children[1]);
    card.append(button);
    stageCards.append(card);
  });
}

function drawMiniMap(mini, stage) {
  const mctx = mini.getContext("2d");
  mctx.fillStyle = "#bce986";
  mctx.fillRect(0, 0, mini.width, mini.height);
  mctx.strokeStyle = "#d59a58";
  mctx.lineWidth = 12;
  mctx.lineCap = "round";
  mctx.lineJoin = "round";
  mctx.beginPath();
  stage.path.forEach((cell, index) => {
    const x = ((cell[0] + 0.5) / COLS) * mini.width;
    const y = ((cell[1] + 0.5) / ROWS) * mini.height;
    if (index === 0) mctx.moveTo(x, y);
    else mctx.lineTo(x, y);
  });
  mctx.stroke();
  for (const [x, y, type] of stage.buildTiles) {
    mctx.fillStyle = type === "premium" ? "#f3c74b" : type === "animal" ? "#7b5639" : "#4fbf63";
    mctx.beginPath();
    mctx.arc(((x + 0.5) / COLS) * mini.width, ((y + 0.5) / ROWS) * mini.height, 5, 0, Math.PI * 2);
    mctx.fill();
  }
}

function renderTowerGuide() {
  towerGuide.innerHTML = "";
  Object.entries(towerTypes).forEach(([id, tower]) => {
    const row = document.createElement("div");
    row.className = "guide-row";
    row.innerHTML = `
      <span class="enemy-chip">${tower.icon} ${tower.name}</span>
      <span>${tower.cost}c</span>
    `;
    row.title = `${tower.family} tile • ${tower.effect}`;
    towerGuide.append(row);
  });
}

function startStage(index) {
  const stage = stages[index];
  state.mode = "playing";
  state.stageIndex = index;
  state.stage = stage;
  state.coins = stage.coins;
  state.health = stage.health;
  state.wave = 0;
  state.countdown = 0;
  state.waveActive = false;
  state.spawns = [];
  state.spawnTimer = 0;
  state.enemies = [];
  state.towers = [];
  state.projectiles = [];
  state.effects = [];
  state.waveLeaks = 0;
  state.waveLivesLost = 0;
  state.selectedTile = null;
  state.selectedTower = null;
  state.result = null;
  state.pathPoints = stage.path.map(centerOf);
  state.pathCells = buildPathCells(stage.path);
  state.buildMap = new Map(stage.buildTiles.map(([x, y, type]) => [keyFor(x, y), type]));
  stageSelect.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  resultOverlay.classList.add("hidden");
  closeTowerMenu();
  updateHud();
  updateSelectionPanel();
  updateWavePreview();
}

function showStageSelect() {
  state.mode = "stages";
  state.waveActive = false;
  state.spawns = [];
  closeTowerMenu();
  gameScreen.classList.add("hidden");
  stageSelect.classList.remove("hidden");
}

function buildPathCells(path) {
  const cells = new Set();
  for (let i = 0; i < path.length - 1; i += 1) {
    const [x1, y1] = path[i];
    const [x2, y2] = path[i + 1];
    const dx = Math.sign(x2 - x1);
    const dy = Math.sign(y2 - y1);
    let x = x1;
    let y = y1;
    while (x !== x2 || y !== y2) {
      if (x >= 0 && x < COLS && y >= 0 && y < ROWS) cells.add(keyFor(x, y));
      x += dx;
      y += dy;
    }
    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) cells.add(keyFor(x, y));
  }
  return cells;
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * CANVAS_W,
    y: ((event.clientY - rect.top) / rect.height) * CANVAS_H,
  };
}

function getTileAt(point) {
  return {
    x: Math.floor(point.x / TILE),
    y: Math.floor(point.y / TILE),
  };
}

function handleCanvasClick(event) {
  if (state.mode !== "playing" || state.result) return;
  unlockAudio();
  const point = getCanvasPoint(event);
  const tower = towerAt(point);
  if (tower) {
    state.selectedTower = tower;
    state.selectedTile = null;
    closeTowerMenu();
    updateSelectionPanel();
    return;
  }

  const tile = getTileAt(point);
  const type = state.buildMap.get(keyFor(tile.x, tile.y));
  if (!type || state.pathCells.has(keyFor(tile.x, tile.y)) || towerAtTile(tile.x, tile.y)) {
    state.selectedTile = null;
    state.selectedTower = null;
    closeTowerMenu();
    updateSelectionPanel();
    return;
  }
  state.selectedTile = { ...tile, type };
  state.selectedTower = null;
  openTowerMenu(tile, type);
  updateSelectionPanel();
}

function handleRightClick(event) {
  if (state.mode !== "playing" || state.result) return;
  const point = getCanvasPoint(event);
  const tower = towerAt(point);
  if (tower) sellTower(tower);
}

function towerAt(point) {
  return state.towers.find((tower) => dist(point, tower) < 24);
}

function towerAtTile(x, y) {
  return state.towers.find((tower) => tower.tileX === x && tower.tileY === y);
}

function canPlaceTower(tower, tileKind) {
  return tileKind === tileType.PREMIUM || tower.family === tileKind;
}

function openTowerMenu(tile, tileKind) {
  towerMenu.innerHTML = "";
  const rect = canvas.getBoundingClientRect();
  const x = clamp(((tile.x + 1) * TILE / CANVAS_W) * rect.width, 8, rect.width - 340);
  const y = clamp(((tile.y + 0.2) * TILE / CANVAS_H) * rect.height, 8, rect.height - 310);
  towerMenu.style.left = `${x}px`;
  towerMenu.style.top = `${y}px`;
  Object.entries(towerTypes).forEach(([id, tower]) => {
    const allowed = canPlaceTower(tower, tileKind);
    const affordable = state.coins >= tower.cost;
    const option = document.createElement("button");
    option.className = "tower-option";
    option.disabled = !allowed || !affordable;
    option.innerHTML = `
      <span class="emoji">${tower.icon}</span>
      <strong>${tower.name}</strong>
      <small>${tower.cost}c • ${tower.effect}</small>
    `;
    option.addEventListener("click", () => placeTower(id, tile, tileKind));
    towerMenu.append(option);
  });
  towerMenu.classList.remove("hidden");
}

function closeTowerMenu() {
  towerMenu.classList.add("hidden");
}

function placeTower(typeId, tile, tileKind) {
  const type = towerTypes[typeId];
  if (!type || !canPlaceTower(type, tileKind) || state.coins < type.cost || towerAtTile(tile.x, tile.y)) return;
  const center = centerOf([tile.x, tile.y]);
  const tower = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    typeId,
    tileX: tile.x,
    tileY: tile.y,
    x: center.x,
    y: center.y,
    level: 1,
    cooldown: 0,
    invested: type.cost,
    premium: tileKind === tileType.PREMIUM,
    bob: Math.random() * Math.PI * 2,
    attackTimer: 0,
  };
  state.towers.push(tower);
  state.coins -= type.cost;
  state.selectedTower = tower;
  state.selectedTile = null;
  closeTowerMenu();
  addEffect("place", tower.x, tower.y, type.color);
  playSound("place");
  updateHud();
  updateSelectionPanel();
}

function sellTower(tower) {
  const refund = Math.floor(tower.invested * 0.6);
  state.coins += refund;
  state.towers = state.towers.filter((item) => item !== tower);
  if (state.selectedTower === tower) state.selectedTower = null;
  showCoinToast(tower.x, tower.y, `+${refund}`);
  playSound("coin");
  updateHud();
  updateSelectionPanel();
}

function upgradeTower(tower) {
  if (!tower || tower.level >= 3) return;
  const base = towerTypes[tower.typeId];
  const cost = Math.round(base.cost * (0.72 + tower.level * 0.38));
  if (state.coins < cost) return;
  state.coins -= cost;
  tower.invested += cost;
  tower.level += 1;
  addEffect("upgrade", tower.x, tower.y, "#fff176");
  playSound("upgrade");
  updateHud();
  updateSelectionPanel();
}

function getTowerStats(tower) {
  const base = towerTypes[tower.typeId];
  const levelBonus = 1 + (tower.level - 1) * 0.34;
  return {
    damage: Math.round(base.damage * levelBonus),
    range: Math.round(base.range * (tower.premium ? 1.12 : 1) * (1 + (tower.level - 1) * 0.08)),
    rate: Math.max(0.12, base.rate * (1 - (tower.level - 1) * 0.08)),
    splash: base.splash ? base.splash * (1 + (tower.level - 1) * 0.12) : 0,
  };
}

function updateSelectionPanel() {
  if (state.selectedTower) {
    const tower = state.selectedTower;
    const base = towerTypes[tower.typeId];
    const stats = getTowerStats(tower);
    const upgradeCost = tower.level < 3 ? Math.round(base.cost * (0.72 + tower.level * 0.38)) : 0;
    selectionPanel.innerHTML = `
      <div class="enemy-chip">${base.icon} ${base.name} Lv.${tower.level}</div>
      <div class="stat-row"><span>Cost invested</span><strong>${tower.invested}c</strong></div>
      <div class="stat-row"><span>Damage</span><strong>${stats.damage}</strong></div>
      <div class="stat-row"><span>Range</span><strong>${stats.range}</strong></div>
      <div class="stat-row"><span>Attack speed</span><strong>${(1 / stats.rate).toFixed(1)}/s</strong></div>
      <div class="stat-row"><span>Special</span><strong>${base.effect}</strong></div>
      <div class="tower-actions">
        <button id="upgradeTowerBtn"${tower.level >= 3 || state.coins < upgradeCost ? " disabled" : ""}>${tower.level >= 3 ? "Max Level" : `Upgrade ${upgradeCost}c`}</button>
        <button id="sellTowerBtn">Sell ${Math.floor(tower.invested * 0.6)}c</button>
      </div>
    `;
    document.getElementById("upgradeTowerBtn")?.addEventListener("click", () => upgradeTower(tower));
    document.getElementById("sellTowerBtn")?.addEventListener("click", () => sellTower(tower));
  } else if (state.selectedTile) {
    const label = state.selectedTile.type === "premium" ? "Golden premium" : state.selectedTile.type === "plant" ? "Green soil" : "Burrow";
    selectionPanel.innerHTML = `
      <div class="enemy-chip">${state.selectedTile.type === "premium" ? "★" : state.selectedTile.type === "plant" ? "✿" : "⌂"} ${label} tile</div>
      <p>${state.selectedTile.type === "premium" ? "Any tower can be placed here with a slight range bonus." : state.selectedTile.type === "plant" ? "Only plant towers can root here." : "Only animal towers can pop out here."}</p>
    `;
  } else {
    selectionPanel.innerHTML = "<p>Click a build tile to plant a defender. Right-click a tower to sell it.</p>";
  }
}

function updateHud() {
  coinsText.textContent = state.coins;
  healthText.textContent = state.health;
  const visibleWave = state.waveActive ? state.wave : Math.min(state.wave + 1, MAX_WAVES);
  waveText.textContent = `Wave ${visibleWave} / ${MAX_WAVES}`;
  stageNameText.textContent = state.stage?.name || "Stage";
  countdownText.textContent = state.waveActive ? "Bugs!" : state.countdown > 0 ? `${Math.ceil(state.countdown)}s` : "Ready";
  startWaveBtn.disabled = state.waveActive || state.result || state.wave >= MAX_WAVES;
}

function updateWavePreview() {
  const plan = makeWavePlan(state.wave + 1, state.stageIndex);
  const counts = {};
  plan.forEach((item) => {
    counts[item.type] = (counts[item.type] || 0) + item.count;
  });
  wavePreview.innerHTML = "";
  Object.entries(counts).forEach(([type, count]) => {
    const enemy = enemyTypes[type];
    const row = document.createElement("div");
    row.className = "preview-row";
    row.innerHTML = `<span class="enemy-chip">${enemy.specialIcon || enemy.icon} ${enemy.name}</span><strong>x${count}</strong>`;
    wavePreview.append(row);
  });
}

function makeWavePlan(wave, stageIndex) {
  const boost = stageIndex;
  const plan = [];
  const ants = 5 + wave * 2 + boost;
  plan.push({ type: "ant", count: ants, spacing: 0.58 });
  if (wave >= 2) plan.push({ type: "beetle", count: Math.floor(wave / 2) + boost, spacing: 1.1 });
  if (wave >= 4) plan.push({ type: "caterpillar", count: Math.floor((wave - 2) / 2) + 1 + boost, spacing: 1.25 });
  if (wave >= 5) plan.push({ type: "mosquito", count: 2 + Math.floor(wave / 2) + boost, spacing: 0.78 });
  if (wave >= 6) plan.push({ type: "shield", count: 1 + Math.floor((wave - 5) / 2) + Math.floor(boost / 2), spacing: 1.6 });
  if (wave === 10) plan.push({ type: "boss", count: 1, spacing: 0.1 });
  return plan;
}

function startWave() {
  if (state.waveActive || state.result || state.wave >= MAX_WAVES) return;
  unlockAudio();
  state.wave += 1;
  state.waveActive = true;
  state.countdown = 0;
  state.waveLeaks = 0;
  state.waveLivesLost = 0;
  state.spawns = flattenWave(makeWavePlan(state.wave, state.stageIndex));
  state.spawnTimer = 0.2;
  closeTowerMenu();
  updateHud();
  updateWavePreview();
}

function flattenWave(plan) {
  const queue = [];
  for (const group of plan) {
    for (let i = 0; i < group.count; i += 1) {
      queue.push({ type: group.type, gap: i === 0 ? 0.2 : group.spacing });
    }
    queue.push({ type: null, gap: 0.8 });
  }
  return queue;
}

function spawnEnemy(typeId, inherited = {}) {
  const type = enemyTypes[typeId];
  const waveScale = 1 + state.wave * 0.11 + state.stageIndex * 0.1;
  const start = state.pathPoints[0];
  const enemy = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    typeId,
    x: inherited.x ?? start.x,
    y: inherited.y ?? start.y,
    segment: inherited.segment ?? 0,
    progress: inherited.progress ?? 0,
    maxHp: Math.round((inherited.maxHp ?? type.maxHp) * (inherited.raw ? 1 : waveScale)),
    hp: 0,
    speed: (inherited.speed ?? type.speed) * (1 + state.stageIndex * 0.04 + Math.max(0, state.wave - 6) * 0.015),
    slow: 0,
    slowTime: 0,
    haste: 0,
    hasteTime: 0,
    skillTimer: type.boss ? 2.5 : 0,
    auraPulse: 0,
    animTime: Math.random() * 4,
    hurtTimer: 0,
    alive: true,
    leaked: false,
  };
  enemy.hp = inherited.hp ?? enemy.maxHp;
  state.enemies.push(enemy);
}

function loop(now) {
  const dt = Math.min(0.05, (now - state.lastTime) / 1000 || 0);
  state.lastTime = now;
  if (state.mode === "playing" && !state.result) update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  if (!state.waveActive && state.wave > 0 && state.wave < MAX_WAVES && state.countdown > 0) {
    state.countdown = Math.max(0, state.countdown - dt);
  }
  updateSpawns(dt);
  updateEnemies(dt);
  if (state.result) {
    updateHud();
    return;
  }
  updateTowers(dt);
  updateProjectiles(dt);
  updateEffects(dt);
  if (state.waveActive && state.spawns.length === 0 && state.enemies.length === 0) finishWave();
  updateHud();
}

function updateSpawns(dt) {
  if (!state.waveActive || state.spawns.length === 0) return;
  state.spawnTimer -= dt;
  while (state.spawnTimer <= 0 && state.spawns.length > 0) {
    const next = state.spawns.shift();
    if (next.type) spawnEnemy(next.type);
    state.spawnTimer += state.spawns[0]?.gap ?? 0.2;
  }
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    const type = enemyTypes[enemy.typeId];
    enemy.animTime += dt * (type.flying ? 9 : 6);
    enemy.hurtTimer = Math.max(0, enemy.hurtTimer - dt);
    enemy.slowTime = Math.max(0, enemy.slowTime - dt);
    enemy.hasteTime = Math.max(0, enemy.hasteTime - dt);
    if (enemy.slowTime <= 0) enemy.slow = 0;
    if (enemy.hasteTime <= 0) enemy.haste = 0;
    enemy.auraPulse = Math.max(0, enemy.auraPulse - dt);
    if (type.boss) updateBossSkill(enemy, dt);
    let speed = enemy.speed * (1 - enemy.slow) * (1 + enemy.haste);
    speed = Math.max(10, speed);
    moveEnemy(enemy, speed * dt);
  }
  for (const enemy of state.enemies) {
    if (enemy.leaked) {
      state.health = Math.max(0, state.health - 1);
      state.waveLeaks += 1;
      state.waveLivesLost += 1;
      addEffect("leak", enemy.x, enemy.y, "#ff6d8d");
      showCoinToast(enemy.x, enemy.y, "-1 life");
      playSound("leak");
    }
  }
  state.enemies = state.enemies.filter((enemy) => enemy.alive && !enemy.leaked);
  if (state.health <= 0) endGame(false);
}

function moveEnemy(enemy, distanceLeft) {
  while (distanceLeft > 0 && enemy.segment < state.pathPoints.length - 1) {
    const from = state.pathPoints[enemy.segment];
    const to = state.pathPoints[enemy.segment + 1];
    const segmentLength = dist(from, to);
    const remaining = segmentLength * (1 - enemy.progress);
    if (distanceLeft < remaining) {
      enemy.progress += distanceLeft / segmentLength;
      enemy.x = from.x + (to.x - from.x) * enemy.progress;
      enemy.y = from.y + (to.y - from.y) * enemy.progress;
      return;
    }
    distanceLeft -= remaining;
    enemy.segment += 1;
    enemy.progress = 0;
    enemy.x = to.x;
    enemy.y = to.y;
  }
  if (enemy.segment >= state.pathPoints.length - 1) enemy.leaked = true;
}

function updateBossSkill(enemy, dt) {
  enemy.skillTimer -= dt;
  if (enemy.skillTimer > 0) return;
  enemy.skillTimer = 5.2;
  enemy.auraPulse = 0.8;
  addEffect("boss", enemy.x, enemy.y, "#ff8ab0", 130);
  for (const other of state.enemies) {
    if (other !== enemy && dist(enemy, other) < 150) {
      other.haste = 0.55;
      other.hasteTime = 2.4;
      other.auraPulse = 0.45;
    }
  }
}

function updateTowers(dt) {
  for (const tower of state.towers) {
    tower.bob += dt * 4;
    tower.attackTimer = Math.max(0, tower.attackTimer - dt);
    tower.cooldown = Math.max(0, tower.cooldown - dt);
    if (tower.cooldown > 0) continue;
    const base = towerTypes[tower.typeId];
    const stats = getTowerStats(tower);
    const targets = findTargets(tower, stats.range, base);
    if (targets.length === 0) continue;
    tower.cooldown = stats.rate;
    fireTower(tower, targets, stats, base);
  }
}

function findTargets(tower, range, base) {
  const candidates = state.enemies
    .filter((enemy) => {
      const type = enemyTypes[enemy.typeId];
      if (type.flying && !base.antiAir) return false;
      return dist(tower, enemy) <= range;
    })
    .sort((a, b) => pathRank(b) - pathRank(a));
  return candidates.slice(0, base.multi || 1);
}

function pathRank(enemy) {
  return enemy.segment + enemy.progress;
}

function fireTower(tower, targets, stats, base) {
  tower.attackTimer = 0.42;
  for (const target of targets) {
    state.projectiles.push({
      x: tower.x,
      y: tower.y - 8,
      target,
      damage: stats.damage,
      towerType: tower.typeId,
      splash: stats.splash,
      speed: tower.typeId === "frog" ? 470 : tower.typeId === "carrot" ? 420 : 560,
      color: base.color,
      radius: tower.typeId === "carrot" ? 8 : tower.typeId === "mushroom" ? 7 : 5,
    });
  }
}

function updateProjectiles(dt) {
  for (const projectile of state.projectiles) {
    if (!projectile.target.alive) {
      projectile.dead = true;
      continue;
    }
    const d = dist(projectile, projectile.target);
    if (d < projectile.speed * dt || d < 10) {
      hitEnemy(projectile.target, projectile.damage, projectile.towerType, projectile.splash);
      addEffect("hit", projectile.target.x, projectile.target.y, projectile.color, projectile.splash || 24);
      playSound("hit");
      projectile.dead = true;
      continue;
    }
    projectile.x += ((projectile.target.x - projectile.x) / d) * projectile.speed * dt;
    projectile.y += ((projectile.target.y - projectile.y) / d) * projectile.speed * dt;
  }
  state.projectiles = state.projectiles.filter((projectile) => !projectile.dead);
}

function hitEnemy(enemy, damage, towerType, splash = 0) {
  applyDamage(enemy, damage, towerType);
  if (towerType === "sunflower") {
    enemy.slow = Math.max(enemy.slow, 0.38);
    enemy.slowTime = 1.4;
    enemy.auraPulse = 0.25;
  }
  if (splash > 0) {
    for (const other of state.enemies) {
      if (other !== enemy && other.alive && dist(enemy, other) <= splash) applyDamage(other, damage * 0.62, towerType);
    }
  }
}

function applyDamage(enemy, rawDamage, towerType) {
  const enemyType = enemyTypes[enemy.typeId];
  const tower = towerTypes[towerType];
  let damage = rawDamage;
  if (enemyType.armored && tower.rate < 0.6) damage *= 0.56;
  if (enemyType.armored && towerType === "bee") damage *= 0.5;
  if (hasShieldProtection(enemy)) damage *= 0.68;
  enemy.hp -= damage;
  enemy.hurtTimer = 0.18;
  if (enemy.hp <= 0 && enemy.alive) killEnemy(enemy);
}

function hasShieldProtection(enemy) {
  return state.enemies.some((other) => {
    if (other === enemy || !other.alive || other.typeId !== "shield") return false;
    return dist(enemy, other) < enemyTypes.shield.shieldAura;
  });
}

function killEnemy(enemy) {
  enemy.alive = false;
  const type = enemyTypes[enemy.typeId];
  state.coins += type.reward;
  showCoinToast(enemy.x, enemy.y, `+${type.reward}`);
  playSound("coin");
  if (type.splits) {
    for (let i = 0; i < 2; i += 1) {
      spawnEnemy("baby", {
        x: enemy.x + (i === 0 ? -8 : 8),
        y: enemy.y + (i === 0 ? 6 : -6),
        segment: enemy.segment,
        progress: enemy.progress,
        raw: true,
      });
    }
    addEffect("split", enemy.x, enemy.y, "#a5d760", 56);
  }
}

function finishWave() {
  state.waveActive = false;
  const clearBonus = state.waveLeaks === 0 ? 18 + state.wave * 3 : Math.max(0, 8 + state.wave - state.waveLeaks * 4);
  state.coins += clearBonus;
  if (state.waveLeaks === 0) {
    showToastCenter(`Wave ${state.wave} cleared! +${clearBonus}`);
  } else {
    showToastCenter(`${state.waveLeaks} bugs reached the garden! -${state.waveLivesLost} lives, +${clearBonus}`);
  }
  if (state.wave >= MAX_WAVES) {
    endGame(true);
  } else {
    state.countdown = 8;
    updateWavePreview();
  }
  updateHud();
}

function endGame(won) {
  state.result = won ? "victory" : "defeat";
  state.waveActive = false;
  state.spawns = [];
  resultTitle.textContent = won ? "Garden Saved!" : "Garden Overrun";
  resultText.textContent = won
    ? "Every vegetable is standing tall. The bugs will think twice next time."
    : "Three leaks are all the garden can take. Try a new tile mix and upgrade timing.";
  resultOverlay.classList.remove("hidden");
  playSound(won ? "win" : "lose");
}

function addEffect(kind, x, y, color, size = 36) {
  state.effects.push({ kind, x, y, color, size, age: 0, life: kind === "boss" ? 0.75 : 0.38 });
}

function updateEffects(dt) {
  for (const effect of state.effects) effect.age += dt;
  state.effects = state.effects.filter((effect) => effect.age < effect.life);
}

function showCoinToast(x, y, text) {
  const rect = canvas.getBoundingClientRect();
  const toast = document.createElement("div");
  toast.className = text.startsWith("-") ? "coin-toast damage-toast" : "coin-toast";
  toast.textContent = text;
  toast.style.left = `${(x / CANVAS_W) * rect.width}px`;
  toast.style.top = `${(y / CANVAS_H) * rect.height}px`;
  toastLayer.append(toast);
  setTimeout(() => toast.remove(), 950);
}

function showToastCenter(text) {
  showCoinToast(CANVAS_W / 2, CANVAS_H / 2, text);
}

function draw() {
  if (state.mode !== "playing") return;
  drawBackground();
  drawBuildTiles();
  drawPath();
  drawGarden();
  drawTowers();
  drawEnemies();
  drawProjectiles();
  drawEffects();
  drawHover();
}

function drawBackground() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = "#a8df78";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#aee681" : "#a1da70";
      roundRect(x * TILE + 2, y * TILE + 2, TILE - 4, TILE - 4, 8);
      ctx.fill();
    }
  }
  drawDecor();
}

function drawDecor() {
  const items = [
    [2.7, 0.55, "#ffdf5a"],
    [7.2, 8.75, "#ff80a1"],
    [12.5, 4.7, "#8ee2ff"],
    [0.4, 8.8, "#fff176"],
    [13.5, 5.1, "#ffdf5a"],
    [5.8, 0.5, "#ff80a1"],
  ];
  for (const [gx, gy, color] of items) {
    const x = gx * TILE;
    const y = gy * TILE;
    ctx.fillStyle = color;
    for (let i = 0; i < 5; i += 1) {
      const angle = (Math.PI * 2 * i) / 5;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(angle) * 7, y + Math.sin(angle) * 7, 5, 8, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#f5a623";
    circle(x, y, 5);
  }
}

function drawPath() {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#b87648";
  ctx.lineWidth = 46;
  ctx.beginPath();
  state.pathPoints.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  ctx.strokeStyle = "#dca267";
  ctx.lineWidth = 34;
  ctx.stroke();
  ctx.setLineDash([12, 18]);
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

function drawBuildTiles() {
  for (const [key, type] of state.buildMap) {
    const [x, y] = key.split(",").map(Number);
    const px = x * TILE + 8;
    const py = y * TILE + 8;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.16)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    if (type === tileType.PLANT) {
      ctx.fillStyle = "#5fbd58";
      roundRect(px, py, TILE - 16, TILE - 16, 12);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      for (let i = 0; i < 3; i += 1) ctx.fillRect(px + 10 + i * 12, py + 8, 5, TILE - 32);
    } else if (type === tileType.ANIMAL) {
      ctx.fillStyle = "#774e35";
      circle(x * TILE + TILE / 2, y * TILE + TILE / 2, 23);
      ctx.fillStyle = "#54351f";
      circle(x * TILE + TILE / 2, y * TILE + TILE / 2 + 3, 13);
    } else {
      ctx.fillStyle = "#f4c84a";
      roundRect(px, py, TILE - 16, TILE - 16, 12);
      ctx.fill();
      ctx.strokeStyle = "#fff4a8";
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.fillStyle = "#8a6313";
      drawStar(x * TILE + TILE / 2, y * TILE + TILE / 2, 12, 5);
    }
    ctx.restore();
  }
}

function drawGarden() {
  ctx.save();
  ctx.fillStyle = "#6dbe45";
  roundRect(CANVAS_W - 80, 10, 58, 84, 16);
  ctx.fill();
  ctx.fillStyle = "#ff914d";
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.ellipse(CANVAS_W - 64 + (i % 2) * 20, 32 + Math.floor(i / 2) * 30, 8, 16, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#305f37";
  ctx.font = "800 16px system-ui";
  ctx.fillText("Garden", CANVAS_W - 86, 112);
  ctx.restore();
}

function drawTowers() {
  for (const tower of state.towers) {
    const base = towerTypes[tower.typeId];
    const stats = getTowerStats(tower);
    if (state.selectedTower === tower) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = base.color;
      circle(tower.x, tower.y, stats.range);
      ctx.restore();
    }
    ctx.save();
    const bob = Math.sin(tower.bob) * 2;
    const animImage = towerAnimImages[tower.typeId];
    if (imageReady(animImage)) {
      const frame = getTowerAttackFrame(tower);
      drawStripSprite(animImage, frame, tower.x, tower.y + bob - 5, getTowerSpriteSize(tower.typeId));
    } else if (spritesReady) {
      drawSprite(tower.typeId, tower.x, tower.y + bob - 5, tower.typeId === "carrot" ? 72 : 66);
    } else {
      ctx.translate(tower.x, tower.y + bob);
      ctx.fillStyle = tower.premium ? "#f9da65" : "#fff7d6";
      circle(0, 11, 22);
      ctx.fillStyle = base.color;
      circle(0, -3, 22);
      ctx.fillStyle = "#fff";
      circle(-7, -7, 4);
      circle(7, -7, 4);
      ctx.fillStyle = "#26382d";
      circle(-7, -7, 2);
      circle(7, -7, 2);
      ctx.fillStyle = "#26382d";
      ctx.font = "900 24px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(base.icon, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.fillStyle = "#285438";
    ctx.font = "900 12px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Lv${tower.level}`, tower.x, tower.y + 31);
    ctx.restore();
  }
}

function getTowerAttackFrame(tower) {
  if (tower.attackTimer <= 0) return 0;
  const progress = 1 - tower.attackTimer / 0.42;
  return clamp(Math.floor(progress * 3) + 1, 1, 3);
}

function getTowerSpriteSize(typeId) {
  if (typeId === "carrot") return 114;
  if (typeId === "bee") return 110;
  if (typeId === "frog" || typeId === "hedgehog") return 104;
  if (typeId === "mushroom") return 96;
  return 92;
}

function drawEnemies() {
  for (const enemy of [...state.enemies].sort((a, b) => a.y - b.y)) {
    const type = enemyTypes[enemy.typeId];
    const animImage = enemyAnimImages[enemy.typeId];
    const visualRadius = imageReady(animImage) || spritesReady ? getEnemyVisualRadius(enemy, type) : type.radius;
    const hurtShake = enemy.hurtTimer > 0 ? Math.sin(enemy.hurtTimer * 90) * 3 : 0;
    if (type.shieldAura) {
      ctx.save();
      ctx.globalAlpha = 0.11 + Math.sin(performance.now() / 180) * 0.03;
      ctx.fillStyle = "#40d89a";
      circle(enemy.x, enemy.y, type.shieldAura);
      ctx.restore();
    }
    ctx.save();
    if (type.flying) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y + 20, type.radius * 1.3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (imageReady(animImage)) {
      const size = getEnemySpriteSize(type);
      const frame = Math.floor(enemy.animTime) % 4;
      const lift = type.flying ? Math.sin(enemy.animTime * 0.9) * 5 - 3 : Math.sin(enemy.animTime * 0.7) * 1.5;
      drawStripSprite(animImage, frame, enemy.x + hurtShake, enemy.y + lift, size);
    } else if (spritesReady) {
      const size = getEnemySpriteSize(type);
      drawSprite(enemy.typeId, enemy.x + hurtShake, enemy.y + (type.flying ? -3 : 0), size);
    } else {
      drawFallbackEnemy(enemy, type);
      if (type.flying) drawWings(enemy.x, enemy.y, type.radius);
    }
    if (enemy.hurtTimer > 0) {
      ctx.globalAlpha = enemy.hurtTimer / 0.18;
      ctx.fillStyle = "rgba(255,255,255,0.38)";
      circle(enemy.x, enemy.y, visualRadius * 0.75);
      ctx.globalAlpha = 1;
    }
    if (enemy.auraPulse > 0) {
      ctx.globalAlpha = enemy.auraPulse;
      ctx.strokeStyle = type.boss ? "#ff8ab0" : "#fff176";
      ctx.lineWidth = 3;
      circleStroke(enemy.x, enemy.y, type.radius + (1 - enemy.auraPulse) * 24);
      ctx.globalAlpha = 1;
    }
    drawHealthBar(enemy, visualRadius);
    if (type.specialIcon) {
      ctx.fillStyle = "#fffdf2";
      circle(enemy.x, enemy.y - visualRadius - 16, 11);
      ctx.fillStyle = "#324333";
      ctx.font = "900 13px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(type.specialIcon, enemy.x, enemy.y - visualRadius - 16);
    }
    ctx.restore();
  }
}

function getEnemySpriteSize(type) {
  if (type.boss) return 124;
  if (type.flying) return 96;
  if (type.radius <= 12) return 58;
  return type.radius * 5.1;
}

function getEnemyVisualRadius(enemy, type) {
  const animImage = enemyAnimImages[enemy.typeId];
  const sheet = imageReady(animImage) ? animImage : spriteSheet;
  const cellW = sheet.naturalWidth / 4;
  const cellH = imageReady(animImage) ? sheet.naturalHeight : sheet.naturalHeight / 3;
  return (getEnemySpriteSize(type) * cellH) / cellW / 2;
}

function drawStripSprite(sheet, frame, x, y, size) {
  if (!imageReady(sheet)) return;
  const cellW = sheet.naturalWidth / 4;
  const cellH = sheet.naturalHeight;
  ctx.drawImage(
    sheet,
    frame * cellW,
    0,
    cellW,
    cellH,
    x - size / 2,
    y - (size * cellH) / cellW / 2,
    size,
    (size * cellH) / cellW,
  );
}

function drawSprite(id, x, y, size) {
  const slot = spriteSlots[id];
  if (!slot || !spritesReady) return;
  const cellW = spriteSheet.naturalWidth / 4;
  const cellH = spriteSheet.naturalHeight / 3;
  const [col, row] = slot;
  const frameSize = Math.max(cellW, cellH);
  ctx.drawImage(
    spriteSheet,
    col * cellW,
    row * cellH,
    cellW,
    cellH,
    x - size / 2,
    y - (size * frameSize) / cellW / 2,
    size,
    (size * cellH) / cellW,
  );
}

function drawFallbackEnemy(enemy, type) {
  ctx.fillStyle = type.color;
  circle(enemy.x, enemy.y, type.radius);
  ctx.fillStyle = lighten(type.color, 28);
  ctx.beginPath();
  ctx.ellipse(enemy.x - 5, enemy.y - 5, type.radius * 0.56, type.radius * 0.42, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  circle(enemy.x - 6, enemy.y - 4, 3);
  circle(enemy.x + 6, enemy.y - 4, 3);
  ctx.fillStyle = "#273025";
  circle(enemy.x - 5, enemy.y - 4, 1.5);
  circle(enemy.x + 7, enemy.y - 4, 1.5);
  ctx.strokeStyle = "#273025";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y + 3, 5, 0.15, Math.PI - 0.15);
  ctx.stroke();
}

function drawWings(x, y, radius) {
  ctx.save();
  ctx.fillStyle = "rgba(230, 250, 255, 0.78)";
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.9, y - 4, radius * 0.75, radius * 0.42, -0.4, 0, Math.PI * 2);
  ctx.ellipse(x + radius * 0.9, y - 4, radius * 0.75, radius * 0.42, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHealthBar(enemy, visualRadius = enemyTypes[enemy.typeId].radius) {
  const type = enemyTypes[enemy.typeId];
  const w = Math.max(type.radius * 2.25, visualRadius * 1.2);
  const x = enemy.x - w / 2;
  const y = enemy.y - visualRadius - 9;
  ctx.fillStyle = "rgba(41, 54, 42, 0.35)";
  roundRect(x, y, w, 5, 3);
  ctx.fill();
  ctx.fillStyle = enemy.hp / enemy.maxHp > 0.45 ? "#5ed069" : enemy.hp / enemy.maxHp > 0.2 ? "#ffd35a" : "#ff6d70";
  roundRect(x, y, Math.max(0, w * (enemy.hp / enemy.maxHp)), 5, 3);
  ctx.fill();
}

function drawProjectiles() {
  for (const projectile of state.projectiles) {
    ctx.save();
    ctx.fillStyle = projectile.color;
    circle(projectile.x, projectile.y, projectile.radius);
    ctx.globalAlpha = 0.25;
    circle(projectile.x, projectile.y, projectile.radius + 5);
    ctx.restore();
  }
}

function drawEffects() {
  for (const effect of state.effects) {
    const t = effect.age / effect.life;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = effect.color;
    ctx.fillStyle = effect.color;
    ctx.lineWidth = 4;
    if (effect.kind === "hit" || effect.kind === "split") {
      circleStroke(effect.x, effect.y, effect.size * (0.35 + t));
    } else if (effect.kind === "boss") {
      circleStroke(effect.x, effect.y, effect.size * t);
      circleStroke(effect.x, effect.y, effect.size * 0.55 * t);
    } else {
      circleStroke(effect.x, effect.y, effect.size * t);
    }
    ctx.restore();
  }
}

function drawHover() {
  const tile = getTileAt(state.mouse);
  if (tile.x < 0 || tile.y < 0 || tile.x >= COLS || tile.y >= ROWS) return;
  const kind = state.buildMap.get(keyFor(tile.x, tile.y));
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = kind && !towerAtTile(tile.x, tile.y) ? "#fffdf2" : "rgba(255,255,255,0.35)";
  roundRect(tile.x * TILE + 5, tile.y * TILE + 5, TILE - 10, TILE - 10, 10);
  ctx.stroke();
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function circleStroke(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawStar(x, y, radius, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function lighten(hex, amount) {
  const num = Number.parseInt(hex.slice(1), 16);
  const r = clamp((num >> 16) + amount, 0, 255);
  const g = clamp(((num >> 8) & 255) + amount, 0, 255);
  const b = clamp((num & 255) + amount, 0, 255);
  return `rgb(${r}, ${g}, ${b})`;
}

init();
