# Design: Sketchboard AI

## System
- React client for upload, parsing, preview, and result display
- Express server for OpenRouter calls
- Client-side zip parsing with JSZip
- Simple structured JSON contract for generated UI plans

## Flow
1. User uploads a sketch zip or image.
2. Client extracts `canvas.png` preview and computes rough shape boxes from `data.json` if available.
3. Client sends a compact sketch summary plus user intent to `/api/analyze-sketch`.
4. Server calls OpenRouter free model and asks for strict JSON.
5. Client renders the returned concept, copy, component tree, and generated preview.

## Key decisions
- Keep the preview deterministic by rendering from structured JSON, not arbitrary HTML.
- Make AI user-facing: the core value is interpretation and transformation of a rough sketch.
- Support the uploaded sample as a built-in demo so the homepage works instantly.
