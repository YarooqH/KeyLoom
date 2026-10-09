# KeyLoom Web

The interactive web app for [KeyLoom](../README.md), built with React, TypeScript, Vite, Tailwind and Three.js. It uses the `keyloom` library from the repo root (`"keyloom": "file:.."`).

Live: https://yarooqh.github.io/KeyLoom/

## Development

Build the library first, then start the app:

```bash
npm install && npm run build   # in the repo root
cd web
npm install
npm run dev
```

Other scripts: `npm run build` (type-check + production build), `npm run lint` (Oxlint), `npm run preview`.

## Deployment

Pushes are deployed to GitHub Pages by `.github/workflows/deploy-pages.yml`. When `GITHUB_ACTIONS` is set, Vite uses `/KeyLoom/` as the base path.
