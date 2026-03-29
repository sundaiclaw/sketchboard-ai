# Proposal: Sketchboard AI

## Why
Users sketch loose UI ideas on tablets and whiteboards, but turning those blobs into a coherent app plan still takes too much interpretation and rewrite work.

## What changes
Build a browser app that accepts a sketch export (zip with `canvas.png` and optional ink stroke JSON), extracts layout signals, and uses an OpenRouter free model to turn that into:
- a named product concept
- a UI component inventory
- launch copy
- a structured screen plan
- a rendered live mock preview

## Success criteria
- User can upload a sketch export and see a parsed summary.
- User gets an AI-generated app concept and layout plan.
- User sees a rendered preview generated from the AI response.
- User can copy the product brief and component list.
