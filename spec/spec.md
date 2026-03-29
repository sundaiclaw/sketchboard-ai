# Sketchboard AI

Build a polished Sundai MVP called Sketchboard AI.

## What it does
Users upload a rough sketch export and get an AI-generated app concept, UI breakdown, launch copy, and a live mock preview. The uploaded sample should work out of the box as a demo.

## Tech stack
- React + Vite
- Express server
- JSZip for reading sketch exports
- OpenRouter free model for structured UI interpretation

## AI requirements
- AI is core and user-facing
- Use OpenRouter free model via env vars only
- Return strict JSON with concept, summary, audience, features, hero copy, layout plan, and cards

## Demo flow
1. Load sample sketch
2. Review extracted layout summary
3. Click analyze
4. See AI interpretation and generated UI preview

## OpenSpec change
- change name: sketchboard-ai
