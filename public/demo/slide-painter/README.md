# Star Slide Painter

A 2D sliding paint puzzle. Use the arrow keys or WASD to move the glowing slider in straight lines. It stops at walls or board edges, painting every traversed tile. Clear the level once every walkable tile has been painted the required number of times.

## Run

```bash
npm run dev
```

The default local address is `http://127.0.0.1:5174`.

## How to Play

- Arrow keys / WASD: slide the block.
- Reset Position: restart the current generated board.
- New Board: keep the level number but generate a new solvable layout.
- Hint: show the next move from the generator's saved solution route.

Levels are generated randomly. The generator first constructs a legal sliding route and then turns off-route cells into walls, so every displayed level has at least one full solution. From level 3 onward, reinforced tiles gradually appear and require multiple passes.

## Assets

`assets/slide-painter-sprites.png` was generated with Codex image generation and is sliced at runtime by the Canvas renderer.
