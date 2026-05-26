# Garden Guard

A cute fixed-level tower defense game about protecting a vegetable garden from cartoon bug waves.

The towers and enemies use GPT Image generated spritesheets in `assets/`. The active animations are individual 4-frame strips under `assets/animations/`, with one file per tower or enemy so characters do not bleed into neighboring frames. Chroma-key source images are kept beside the transparent PNGs for reference.

## Play

Open `index.html` in a browser, choose one of the three stages, place towers on marked build tiles, then press **Start Wave**.

Or run a local dev server:

```bash
npm run dev
```

Then open `http://localhost:5173`.

- Green soil tiles accept plant towers.
- Burrow tiles accept animal towers.
- Golden tiles accept any tower and give a range bonus.
- Click a tower to view stats and upgrade it.
- Right-click a tower to sell it for a 60% refund.
- You have 3 lives. Each bug that reaches the garden costs 1 life and reduces the wave clear bonus.

The game is self-contained and does not require a build step or npm dependencies.
