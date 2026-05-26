# GUI Agents for Continual Game Generation

Static Play2Code demo gallery with eight playable browser games.

## Local Preview

```bash
npm start
```

Open `http://127.0.0.1:4321/`.

## Deploy

The deployable site lives in `public/`.

- Main page: `public/index.html`
- Demo games: `public/demo/<game>/`
- Shared mute script: `public/mute.js`

For Vercel, import this repository and keep the default build command (`npm run build`). `vercel.json` points the output directory to `public`.
