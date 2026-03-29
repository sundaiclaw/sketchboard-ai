# Sketchboard AI

Sketchboard AI turns rough wireframe sketches into launch-ready product concepts.

Upload a sketch export, let the app infer the layout structure, and get:
- an AI-generated product name and category
- target audience and summary
- hero copy and CTA
- component and feature lists
- a live mock preview rendered from structured JSON

## Live demo

- Demo: https://sketchboard-ai-859414203684.us-central1.run.app
- Repo: https://github.com/sundaiclaw/sketchboard-ai

## How it works

1. Load the built-in sample sketch or upload your own zip/image.
2. The client extracts structure from ink stroke data when available.
3. The server sends that sketch summary plus your notes to an OpenRouter free model.
4. The app renders the returned concept and a generated preview screen.

## Tech

- React + Vite
- Express
- JSZip
- OpenRouter free model (`arcee-ai/trinity-large-preview:free`)
- OpenSpec + Fabro workflow artifacts

## Run locally

```bash
cd app
npm install
cp .env.example .env
npm run build
npm run start
```

Required env vars:

```bash
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=arcee-ai/trinity-large-preview:free
OPENROUTER_API_KEY=your_key_here
PORT=8080
```

## Known limits

- Best results come from simple layout sketches, not dense illustrations.
- Image-only uploads rely on your notes because the MVP does not run computer vision locally.
- Sundai publish is pending while the workspace Sundai auth flow is blocked by GitHub verified-device re-auth.
