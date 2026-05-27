const demos = [
  {
    slug: "block-blast",
    title: "Block Blast",
    genre: "Puzzle",
    tone: "8x8 board / line clearing",
    url: "demo/block-blast/",
    note: "Place shapes, clear rows and columns, chase higher scores."
  },
  {
    slug: "garden-guard",
    title: "Garden Guard",
    genre: "Tower Defense",
    tone: "vegetable garden / wave strategy",
    url: "demo/garden-guard/",
    note: "Place towers, start waves, protect the garden."
  },
  {
    slug: "slide-painter",
    title: "Star Slide Painter",
    genre: "Puzzle",
    tone: "sliding path / color coverage",
    url: "demo/slide-painter/",
    note: "Slide until collision, paint every reachable tile."
  },
  {
    slug: "happy-harvest",
    title: "Happy Harvest Match",
    genre: "Match-3",
    tone: "orchard board / handcrafted levels",
    url: "demo/happy-harvest/",
    note: "Swap adjacent tiles, clear goals before moves run out."
  },
  {
    slug: "klotsk",
    title: "Cao Cao's Escape",
    genre: "Klotski",
    tone: "wooden board / classical puzzle",
    url: "demo/klotsk/",
    note: "Move Cao Cao to the bottom exit."
  },
  {
    slug: "sudoku",
    title: "Ink Garden Sudoku",
    genre: "Sudoku",
    tone: "ink garden / narrative puzzle",
    url: "demo/sudoku/",
    note: "Complete chapter puzzles and restore harmony."
  },
  {
    slug: "super-squad",
    title: "Super Sugar Squad",
    genre: "Action",
    tone: "city brawl / Phaser combat",
    url: "demo/super-squad/",
    note: "A compact 2D brawler generated from a reusable game template."
  },
  {
    slug: "top-down-adventure",
    title: "Moonstone After Closing",
    genre: "Adventure",
    tone: "museum mystery / inventory flow",
    url: "demo/top-down-adventure/",
    note: "Explore, collect clues, repair power, and escape."
  }
];

const grid = document.querySelector("#demoGrid");

const architectureDetails = {
  "game-agent": {
    kicker: "Game Agent",
    title: "Code revision from play evidence",
    body: "Produces or revises the game code using the latest build plus episode, skill, and world memories. Its output is written into the shared runtime as a self-contained HTML artifact the GUI agent can immediately load."
  },
  "shared-runtime": {
    kicker: "Shared Runtime",
    title: "A playable HTML artifact",
    body: "The generated build is packaged as a browser-ready game. This shared surface lets the game agent write code while the GUI agent experiences the result through interaction."
  },
  "gui-agent": {
    kicker: "GUI Agent",
    title: "Play without code access",
    body: "Loads the game in a browser and plays through it using only memory and a game guide. At episode end, it writes a play summary and actionable fixes that connect observed failures to concrete code-level changes."
  },
  "between-rounds": {
    kicker: "Between Rounds",
    title: "Advice, not instruction",
    body: "The game agent reads the summary and fix list, then decides which issues to address, defer, or discard. A new round begins with a revised build and ends when intent is met or the round budget is exhausted."
  },
  "memory-system": {
    kicker: "Memory System",
    title: "Experience that accumulates",
    body: "Episode memory stores in-task summaries, fixes, and attempts. Skill memory preserves each agent's cross-task know-how, while world memory records shared rules, archetypes, and design principles."
  }
};

function setupArchitectureDetails() {
  const detail = document.querySelector("#archDetail");
  const panel = document.querySelector(".architecture-panel");
  const nodes = Array.from(document.querySelectorAll(".arch-node"));
  if (!detail || !panel || !nodes.length) return;

  const positionDetail = (node) => {
    const panelRect = panel.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const detailWidth = Math.min(360, panelRect.width - 48);
    const detailHeight = detail.offsetHeight || 170;
    const gap = 16;

    let x = nodeRect.right - panelRect.left + gap;
    let y = nodeRect.top - panelRect.top + (nodeRect.height - detailHeight) / 2;

    if (x + detailWidth > panelRect.width - 18) {
      x = nodeRect.left - panelRect.left - detailWidth - gap;
    }

    x = Math.max(18, Math.min(x, panelRect.width - detailWidth - 18));
    y = Math.max(18, Math.min(y, panelRect.height - detailHeight - 18));

    detail.style.setProperty("--tip-x", `${Math.round(x - 24)}px`);
    detail.style.setProperty("--tip-y", `${Math.round(y - 24)}px`);
  };

  const setActive = (node, keepVisible = true) => {
    const content = architectureDetails[node.dataset.detail];
    if (!content) return;
    nodes.forEach((item) => item.classList.toggle("is-active", item === node));
    detail.innerHTML = `
      <span class="arch-detail-kicker">${content.kicker}</span>
      <h3>${content.title}</h3>
      <p>${content.body}</p>
    `;
    positionDetail(node);
    detail.classList.toggle("is-visible", keepVisible);
    detail.setAttribute("aria-hidden", keepVisible ? "false" : "true");
  };

  const hideDetail = () => {
    detail.classList.remove("is-visible");
    detail.setAttribute("aria-hidden", "true");
    nodes.forEach((item) => item.classList.remove("is-active"));
  };

  nodes.forEach((node) => {
    node.addEventListener("mouseenter", () => setActive(node));
    node.addEventListener("mouseover", () => setActive(node));
    node.addEventListener("pointerenter", () => setActive(node));
    node.addEventListener("pointerover", () => setActive(node));
    node.addEventListener("mousemove", () => positionDetail(node));
    node.addEventListener("pointermove", () => positionDetail(node));
    node.addEventListener("mouseleave", hideDetail);
    node.addEventListener("pointerleave", hideDetail);
    node.addEventListener("focus", () => setActive(node));
    node.addEventListener("blur", hideDetail);
    node.addEventListener("click", () => setActive(node));
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActive(node);
      }
    });
  });
}

function runHeroTypewriter() {
  const heading = document.querySelector(".typewriter");
  const target = document.querySelector(".typed-text");
  if (!heading || !target) return;

  const text = target.dataset.text || "";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    target.textContent = text;
    heading.classList.add("done");
    return;
  }

  target.textContent = "";
  let index = 0;
  const tick = () => {
    target.textContent = text.slice(0, index);
    index += 1;
    if (index <= text.length) {
      window.setTimeout(tick, 38);
    } else {
      window.setTimeout(() => heading.classList.add("done"), 520);
    }
  };
  window.setTimeout(tick, 280);
}

runHeroTypewriter();
setupArchitectureDetails();

for (const demo of demos) {
  const card = document.createElement("article");
  card.className = "demo-card";
  card.innerHTML = `
    <div class="demo-card-topbar">
      <div>
        <span class="demo-kicker">${demo.genre}</span>
        <h3>${demo.title}</h3>
      </div>
      <a class="button small" href="${demo.url}" target="_blank" rel="noreferrer">Open</a>
    </div>
    <p>${demo.note}</p>
    <small>${demo.tone}</small>
    <iframe src="${demo.url}" title="${demo.title} playable demo" loading="lazy"></iframe>
  `;
  grid.append(card);
}
