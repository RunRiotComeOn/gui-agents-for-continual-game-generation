const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  level: document.querySelector("#levelText"),
  moves: document.querySelector("#movesText"),
  left: document.querySelector("#leftText"),
  time: document.querySelector("#timeText"),
  message: document.querySelector("#message"),
  complete: document.querySelector("#levelComplete"),
  completeStats: document.querySelector("#completeStats"),
  next: document.querySelector("#nextLevelBtn"),
  replay: document.querySelector("#replayBtn"),
  reset: document.querySelector("#resetBtn"),
  random: document.querySelector("#randomBtn"),
  hint: document.querySelector("#hintBtn"),
};

const dirs = {
  up: { dr: -1, dc: 0, key: "up", label: "↑" },
  down: { dr: 1, dc: 0, key: "down", label: "↓" },
  left: { dr: 0, dc: -1, key: "left", label: "←" },
  right: { dr: 0, dc: 1, key: "right", label: "→" },
};

const keyToDir = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

const spriteAtlas = {
  player: { x: 60, y: 205, w: 330, h: 350 },
  tile: { x: 470, y: 212, w: 330, h: 320 },
  painted: { x: 870, y: 210, w: 345, h: 330 },
  wall: { x: 56, y: 690, w: 360, h: 370 },
  durable: { x: 460, y: 682, w: 345, h: 360 },
  sparkle: { x: 855, y: 655, w: 380, h: 385 },
};

const sprites = new Image();
sprites.src = "./assets/slide-painter-sprites.png";
sprites.addEventListener("load", () => {
  state.assetsReady = true;
});

const state = {
  assetsReady: false,
  levelNumber: 1,
  seedSalt: Date.now(),
  level: null,
  hits: [],
  player: { r: 0, c: 0 },
  moves: 0,
  startedAt: performance.now(),
  elapsedWhenComplete: 0,
  animation: null,
  completed: false,
  hintIndex: 0,
  flashCells: new Map(),
  messageTimer: 0,
};

function cellKey(r, c) {
  return `${r},${c}`;
}

function cellIndex(r, c, cols) {
  return r * cols + c;
}

function inBounds(level, r, c) {
  return r >= 0 && c >= 0 && r < level.rows && c < level.cols;
}

function isWall(level, r, c) {
  return !inBounds(level, r, c) || level.walls.has(cellKey(r, c));
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function random() {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function shuffle(items, rng) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeLevel(levelNumber, seedSalt = Date.now()) {
  const baseSeed = (seedSalt + levelNumber * 1000003) >>> 0;
  for (let attempt = 0; attempt < 160; attempt += 1) {
    const rng = mulberry32((baseSeed + attempt * 2654435761) >>> 0);
    const rows = levelNumber < 4 ? 9 : levelNumber < 8 ? 10 : 11;
    const cols = levelNumber < 3 ? 9 : levelNumber < 7 ? 10 : 11;
    const start = {
      r: randomInt(rng, 1, rows - 2),
      c: randomInt(rng, 1, cols - 2),
    };
    const open = new Set([cellKey(start.r, start.c)]);
    const reservedWalls = new Set();
    const solution = [];
    let current = { ...start };
    let previousDir = null;
    const targetSegments = Math.min(30, 12 + levelNumber * 2);

    for (let step = 0; step < targetSegments; step += 1) {
      const candidates = carveCandidates({
        rows,
        cols,
        open,
        reservedWalls,
        current,
        previousDir,
        rng,
        step,
      });

      if (candidates.length === 0) break;

      const choice = weightedPick(candidates, rng);
      for (const cell of choice.path) open.add(cellKey(cell.r, cell.c));
      if (choice.blocker) reservedWalls.add(cellKey(choice.blocker.r, choice.blocker.c));
      current = { ...choice.endpoint };
      previousDir = choice.dirName;
      solution.push(choice.dirName);
    }

    const minOpen = Math.min(rows * cols - 18, 22 + levelNumber * 2);
    const turnCount = solution.filter((dirName, index) => index > 0 && solution[index - 1] !== dirName).length;
    if (open.size < minOpen || solution.length < 9 || turnCount < 7) continue;

    const level = buildLevelFromOpenCells({
      rows,
      cols,
      open,
      start,
      solution: expandSolutionForDifficulty(solution, levelNumber),
      seed: baseSeed + attempt,
    });

    const visits = countSolutionVisits(level);
    if (!visits) continue;

    applyDurableTiles(level, visits, rng, levelNumber);
    if (routeCompletes(level)) return level;
  }

  return makeFallbackLevel(levelNumber, baseSeed);
}

function carveCandidates({ rows, cols, open, reservedWalls, current, previousDir, rng, step }) {
  const candidates = [];
  const maxSpan = Math.max(rows, cols);

  for (const dirName of shuffle(Object.keys(dirs), rng)) {
    if (previousDir && oppositeDir(dirName) === previousDir && rng() > 0.25) continue;

    const dir = dirs[dirName];
    const ray = [];
    for (let length = 1; length <= maxSpan; length += 1) {
      const r = current.r + dir.dr * length;
      const c = current.c + dir.dc * length;
      const key = cellKey(r, c);
      if (!inGrid(rows, cols, r, c) || reservedWalls.has(key)) break;
      ray.push({ r, c });
    }

    for (let length = 2; length <= ray.length; length += 1) {
      const endpoint = ray[length - 1];
      const blocker = {
        r: current.r + dir.dr * (length + 1),
        c: current.c + dir.dc * (length + 1),
      };
      const blockerKey = cellKey(blocker.r, blocker.c);
      const inBoardBlocker = inGrid(rows, cols, blocker.r, blocker.c);
      if (inBoardBlocker && open.has(blockerKey)) continue;

      const path = ray.slice(0, length);
      const newCells = path.filter((cell) => !open.has(cellKey(cell.r, cell.c))).length;
      if (newCells === 0 && step < 8) continue;
      if (newCells === 0 && rng() > 0.22) continue;

      const turnBonus = previousDir && previousDir !== dirName ? 6 : 0;
      const revisitBonus = path.length - newCells > 0 ? 2 : 0;
      const shortTurnBonus = path.length <= 4 ? 3 : 0;
      candidates.push({
        dirName,
        path,
        endpoint,
        blocker: inBoardBlocker ? blocker : null,
        weight: 1 + newCells * 8 + turnBonus + revisitBonus + shortTurnBonus + rng() * 3,
      });
    }
  }

  return candidates.sort((a, b) => b.weight - a.weight).slice(0, 14);
}

function weightedPick(candidates, rng) {
  const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  let ticket = rng() * total;
  for (const candidate of candidates) {
    ticket -= candidate.weight;
    if (ticket <= 0) return candidate;
  }
  return candidates[0];
}

function buildLevelFromOpenCells({ rows, cols, open, start, solution, seed }) {
  const walls = new Set();
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const key = cellKey(r, c);
      if (!open.has(key)) walls.add(key);
    }
  }

  return {
    rows,
    cols,
    start,
    walls,
    required: new Map([...open].map((key) => [key, 1])),
    solution,
    seed,
  };
}

function expandSolutionForDifficulty(solution, levelNumber) {
  if (levelNumber < 3) return [...solution];
  const reverse = solution
    .slice()
    .reverse()
    .map((dirName) => oppositeDir(dirName));
  if (levelNumber < 8) return [...solution, ...reverse];
  return [...solution, ...reverse, ...solution];
}

function applyDurableTiles(level, visits, rng, levelNumber) {
  const openKeys = [...level.required.keys()];
  const eligible = shuffle(
    openKeys.filter((key) => key !== cellKey(level.start.r, level.start.c) && (visits.get(key) || 0) >= 2),
    rng,
  );
  const durableCount =
    levelNumber < 3 ? 0 : Math.min(eligible.length, Math.ceil(openKeys.length * Math.min(0.3, 0.06 + levelNumber * 0.018)));

  for (let i = 0; i < durableCount; i += 1) {
    const key = eligible[i];
    const maxVisits = visits.get(key) || 1;
    const need = levelNumber >= 8 && maxVisits >= 3 && rng() > 0.5 ? 3 : 2;
    level.required.set(key, Math.min(need, maxVisits));
  }
}

function oppositeDir(dirName) {
  return {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  }[dirName];
}

function inGrid(rows, cols, r, c) {
  return r >= 0 && c >= 0 && r < rows && c < cols;
}

function countSolutionVisits(level) {
  const visits = new Map([[cellKey(level.start.r, level.start.c), 1]]);
  let pos = { ...level.start };
  for (const dirName of level.solution) {
    const path = slidePath(level, pos.r, pos.c, dirName);
    if (path.length === 0) return null;
    for (const cell of path) {
      const key = cellKey(cell.r, cell.c);
      visits.set(key, (visits.get(key) || 0) + 1);
    }
    pos = path[path.length - 1];
  }
  return visits;
}

function routeCompletes(level) {
  const hits = new Array(level.rows * level.cols).fill(0);
  let pos = { ...level.start };
  hits[cellIndex(pos.r, pos.c, level.cols)] += 1;
  for (const dirName of level.solution) {
    const path = slidePath(level, pos.r, pos.c, dirName);
    for (const cell of path) hits[cellIndex(cell.r, cell.c, level.cols)] += 1;
    if (path.length > 0) pos = path[path.length - 1];
  }
  for (const [key, required] of level.required) {
    const [r, c] = key.split(",").map(Number);
    if (hits[cellIndex(r, c, level.cols)] < required) return false;
  }
  return true;
}

function makeFallbackLevel(levelNumber, seed) {
  const rows = 7;
  const cols = 7;
  const walls = new Set();
  const required = new Map();
  const openKeys = new Set();
  const map = [
    "#######",
    "#.....#",
    "#####.#",
    "#.....#",
    "#.#####",
    "#.....#",
    "#######",
  ];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const key = cellKey(r, c);
      if (map[r][c] === "#") walls.add(key);
      else {
        openKeys.add(key);
        required.set(key, 1);
      }
    }
  }
  return {
    rows,
    cols,
    start: { r: 1, c: 1 },
    walls,
    required,
    solution: ["right", "down", "left", "down", "right"],
    seed,
  };
}

function slidePath(level, r, c, dirName) {
  const dir = dirs[dirName];
  const path = [];
  let nr = r + dir.dr;
  let nc = c + dir.dc;
  while (!isWall(level, nr, nc)) {
    path.push({ r: nr, c: nc });
    nr += dir.dr;
    nc += dir.dc;
  }
  return path;
}

function beginLevel(levelNumber, seedSalt = state.seedSalt) {
  state.levelNumber = levelNumber;
  state.seedSalt = seedSalt;
  state.level = makeLevel(levelNumber, seedSalt);
  state.hits = new Array(state.level.rows * state.level.cols).fill(0);
  state.player = { ...state.level.start };
  state.moves = 0;
  state.startedAt = performance.now();
  state.elapsedWhenComplete = 0;
  state.animation = null;
  state.completed = false;
  state.hintIndex = 0;
  state.flashCells.clear();
  paintCells([{ ...state.player }]);
  ui.complete.classList.add("hidden");
  showMessage(`Level ${levelNumber} generated. The saved solution takes ${state.level.solution.length} moves.`);
  syncUi();
}

function resetLevel() {
  state.hits.fill(0);
  state.player = { ...state.level.start };
  state.moves = 0;
  state.startedAt = performance.now();
  state.completed = false;
  state.animation = null;
  state.hintIndex = 0;
  state.flashCells.clear();
  paintCells([{ ...state.player }]);
  ui.complete.classList.add("hidden");
  showMessage("Returned to the starting position.");
  syncUi();
}

function paintCells(cells) {
  const now = performance.now();
  for (const cell of cells) {
    const idx = cellIndex(cell.r, cell.c, state.level.cols);
    const required = state.level.required.get(cellKey(cell.r, cell.c)) || 0;
    if (required > 0 && state.hits[idx] < required) {
      const wasComplete = state.hits[idx] >= required;
      state.hits[idx] += 1;
      const isComplete = state.hits[idx] >= required;
      if (!wasComplete && isComplete) state.flashCells.set(cellKey(cell.r, cell.c), now);
    }
  }
}

function remainingPaint() {
  let remaining = 0;
  for (const [key, required] of state.level.required) {
    const [r, c] = key.split(",").map(Number);
    const hit = state.hits[cellIndex(r, c, state.level.cols)] || 0;
    remaining += Math.max(0, required - hit);
  }
  return remaining;
}

function tryMove(dirName) {
  if (state.completed || state.animation) return;
  const path = slidePath(state.level, state.player.r, state.player.c, dirName);
  if (path.length === 0) {
    showMessage("That direction is blocked.");
    return;
  }

  state.moves += 1;
  const from = { ...state.player };
  const to = path[path.length - 1];
  const started = performance.now();
  const duration = Math.min(560, 130 + path.length * 64);
  state.animation = { from, to, path, started, duration };
  state.player = { ...to };
  paintCells(path);

  if (state.level.solution[state.hintIndex] === dirName) state.hintIndex += 1;
  else state.hintIndex = Number.POSITIVE_INFINITY;

  syncUi();
}

function completeLevel() {
  state.completed = true;
  state.elapsedWhenComplete = performance.now() - state.startedAt;
  ui.completeStats.textContent = `Level ${state.levelNumber} · ${state.moves} moves · ${formatTime(state.elapsedWhenComplete)}`;
  ui.complete.classList.remove("hidden");
}

function syncUi() {
  ui.level.textContent = state.levelNumber;
  ui.moves.textContent = state.moves;
  ui.left.textContent = remainingPaint();
  ui.time.textContent = formatTime(state.completed ? state.elapsedWhenComplete : performance.now() - state.startedAt);
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function showMessage(text) {
  ui.message.textContent = text;
  ui.message.classList.remove("hidden");
  state.messageTimer = performance.now() + 1800;
}

function boardMetrics() {
  const padding = 58;
  const hudReserve = 10;
  const maxW = canvas.width - padding * 2;
  const maxH = canvas.height - padding * 2 - hudReserve;
  const tile = Math.floor(Math.min(maxW / state.level.cols, maxH / state.level.rows));
  const boardW = tile * state.level.cols;
  const boardH = tile * state.level.rows;
  return {
    tile,
    x: Math.floor((canvas.width - boardW) / 2),
    y: Math.floor((canvas.height - boardH) / 2 + 18),
    w: boardW,
    h: boardH,
  };
}

function cellCenter(metrics, r, c) {
  return {
    x: metrics.x + c * metrics.tile + metrics.tile / 2,
    y: metrics.y + r * metrics.tile + metrics.tile / 2,
  };
}

function drawSprite(name, x, y, w, h, alpha = 1) {
  const src = spriteAtlas[name];
  ctx.save();
  ctx.globalAlpha = alpha;
  if (state.assetsReady) {
    ctx.drawImage(sprites, src.x, src.y, src.w, src.h, x, y, w, h);
  } else {
    ctx.fillStyle = name === "player" ? "#28c8ff" : name === "wall" ? "#a78b55" : "#6f8581";
    roundRect(x, y, w, h, 10);
    ctx.fill();
  }
  ctx.restore();
}

function render() {
  const now = performance.now();
  if (!state.level) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground(now);

  const metrics = boardMetrics();
  drawBoardShadow(metrics);
  drawTiles(metrics, now);
  drawPlayer(metrics, now);

  if (state.messageTimer && now > state.messageTimer) {
    ui.message.classList.add("hidden");
    state.messageTimer = 0;
  }

  if (state.animation && now - state.animation.started >= state.animation.duration) {
    state.animation = null;
    if (remainingPaint() === 0 && !state.completed) completeLevel();
  }

  syncUi();
  requestAnimationFrame(render);
}

function drawBackground(now) {
  const t = now / 1000;
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#08293a");
  gradient.addColorStop(0.55, "#0b4955");
  gradient.addColorStop(1, "#0a1628");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 72; i += 1) {
    const x = (i * 137 + Math.sin(t * 0.4 + i) * 9) % canvas.width;
    const y = (i * 89 + Math.cos(t * 0.35 + i * 2) * 7) % canvas.height;
    const size = i % 7 === 0 ? 2.1 : 1.1;
    ctx.fillStyle = i % 5 === 0 ? "rgba(87, 231, 255, 0.8)" : "rgba(255, 255, 255, 0.82)";
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBoardShadow(metrics) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  roundRect(metrics.x - 18, metrics.y - 16, metrics.w + 36, metrics.h + 36, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(151, 232, 255, 0.24)";
  ctx.lineWidth = 2;
  roundRect(metrics.x - 12, metrics.y - 10, metrics.w + 24, metrics.h + 24, 14);
  ctx.stroke();
  ctx.restore();
}

function drawTiles(metrics, now) {
  for (let r = 0; r < state.level.rows; r += 1) {
    for (let c = 0; c < state.level.cols; c += 1) {
      const x = metrics.x + c * metrics.tile;
      const y = metrics.y + r * metrics.tile;
      const key = cellKey(r, c);
      if (state.level.walls.has(key)) {
        drawWallTile(x, y, metrics.tile);
      } else {
        drawOpenTile(x, y, metrics.tile, r, c, now);
      }
    }
  }
}

function drawOpenTile(x, y, tile, r, c, now) {
  const key = cellKey(r, c);
  const required = state.level.required.get(key) || 1;
  const hit = state.hits[cellIndex(r, c, state.level.cols)] || 0;
  const isComplete = hit >= required;
  const inset = Math.max(3, tile * 0.05);

  drawSprite(required > 1 && !isComplete ? "durable" : "tile", x + inset, y + inset, tile - inset * 2, tile - inset * 2, 0.86);

  if (isComplete) {
    ctx.save();
    drawSprite("painted", x + inset, y + inset, tile - inset * 2, tile - inset * 2, 1);
    ctx.restore();
  }

  if (required > 1) {
    const remaining = Math.max(0, required - hit);
    if (remaining > 0) {
      ctx.save();
      ctx.fillStyle = remaining >= 2 ? "#ffc85a" : "#ff9354";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.36)";
      ctx.lineWidth = 3;
      ctx.font = `900 ${Math.max(14, tile * 0.28)}px ui-rounded, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeText(String(remaining), x + tile / 2, y + tile / 2);
      ctx.fillText(String(remaining), x + tile / 2, y + tile / 2);
      ctx.restore();
    }
  }

  const flashStart = state.flashCells.get(key);
  if (flashStart) {
    const age = now - flashStart;
    if (age > 420) {
      state.flashCells.delete(key);
    } else {
      const alpha = 1 - age / 420;
      ctx.save();
      ctx.globalAlpha = alpha;
      drawSprite("sparkle", x - tile * 0.08, y - tile * 0.08, tile * 1.16, tile * 1.16, 0.9);
      ctx.restore();
    }
  }
}

function drawWallTile(x, y, tile) {
  const pad = tile * 0.02;
  drawSprite("wall", x - pad, y - tile * 0.1, tile + pad * 2, tile * 1.18, 0.96);
}

function drawPlayer(metrics, now) {
  const pos = animatedPlayerPosition(metrics, now);
  const size = metrics.tile * 0.86;
  ctx.save();
  ctx.shadowColor = "rgba(87, 231, 255, 0.86)";
  ctx.shadowBlur = 24;
  drawSprite("player", pos.x - size / 2, pos.y - size / 2 - metrics.tile * 0.04, size, size * 1.05, 1);
  ctx.restore();
}

function animatedPlayerPosition(metrics, now) {
  if (!state.animation) return cellCenter(metrics, state.player.r, state.player.c);
  const { from, to, started, duration } = state.animation;
  const a = Math.min(1, (now - started) / duration);
  const eased = 1 - Math.pow(1 - a, 3);
  const start = cellCenter(metrics, from.r, from.c);
  const end = cellCenter(metrics, to.r, to.c);
  return {
    x: start.x + (end.x - start.x) * eased,
    y: start.y + (end.y - start.y) * eased,
  };
}

function roundRect(x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

window.addEventListener("keydown", (event) => {
  const dirName = keyToDir[event.code];
  if (!dirName) return;
  event.preventDefault();
  tryMove(dirName);
});

document.querySelectorAll(".dpad button").forEach((button) => {
  button.addEventListener("click", () => tryMove(button.dataset.dir));
});

ui.reset.addEventListener("click", resetLevel);
ui.random.addEventListener("click", () => beginLevel(state.levelNumber, Date.now()));
ui.next.addEventListener("click", () => beginLevel(state.levelNumber + 1, Date.now()));
ui.replay.addEventListener("click", resetLevel);
ui.hint.addEventListener("click", () => {
  if (state.hintIndex === Number.POSITIVE_INFINITY) {
    showMessage("Hints are most accurate from the starting position. Reset first if needed.");
    return;
  }
  const dirName = state.level.solution[state.hintIndex];
  if (!dirName) {
    showMessage("The saved route has already been completed.");
    return;
  }
  showMessage(`Suggested next move: ${dirs[dirName].label}`);
});

beginLevel(1, state.seedSalt);
requestAnimationFrame(render);
