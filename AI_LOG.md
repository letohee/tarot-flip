# AI Usage Log – Tarot Flip

Author: Antoan “Tony” Bachev  
Project: Tarot Flip (Pixi.js v7 card game)  
Date: November 2025

This document briefly explains how I used AI when working on this task.

---

## 1. Tools

- **ChatGPT (ChatGPT Plus)** – used occasionally as a helper.
- Local tools:
  - VS Code
  - TypeScript compiler
  - Vite dev server & build
  - Browser DevTools

---

## 2. How I used AI

I did **not** generate the whole project in a single prompt. Instead, I used AI in a few focused ways:

### 2.1 Setup & small boilerplate

- Asked for a reminder of the recommended way to set up a **Pixi.js v7 + TypeScript + Vite** project.
- Looked up examples of:
  - how to create a `PIXI.Application` and attach it to a DOM element
  - basic npm scripts (`dev`, `build`, `preview`).

I still wired everything myself and adjusted it to match this repository structure.

### 2.2 Comments, naming and small snippets

- Used AI mainly to:
  - refine **comments** so they clearly explain what each block of code is responsible for
  - get suggestions for variable/method names that better describe intent
  - check small utilities (e.g. formatting text for UI, structuring a simple state enum).

The implementation of the game logic, UI wiring and state flow was written and iterated on by me in the editor.

### 2.3 Pixi / TypeScript questions

- Used AI to clarify some details about:
  - the difference between older Pixi examples (global `PIXI.*`) and the modern ES module setup
  - how to structure the project into folders like `/game`, `/ui`, `/config`.
- I experimented with **pixi-projection** based on those hints, but in the end kept a simpler / more robust card flip (scale-based) after running into compatibility/typing issues with the 3D examples.

### 2.4 README and this AI log

- The initial drafts of `README.md` and `AI_LOG.md` were written with help from AI, then edited by me to:
  - match the final code and behaviour
  - reflect the actual feature set
  - keep the explanations short and readable.

---

## 3. What I did manually

Some examples of work done directly by me (without copying full AI outputs):

- Implemented the **game flow**:
  - bet & balance updates
  - multipliers per card
  - product calculation and payout
  - reveal order and result popup behaviour.
- Hooked up the **UI**:
  - bet controls, play button, auto-play toggle, speed toggle
  - layout and coordinates for the table and elements.
- Debugged:
  - TypeScript errors related to Pixi types
  - Vercel build issues (scripts, configuration)
  - edge cases with low balance and auto-play.
- Tested the game locally (`npm run dev`, `npm run build`) and updated the code until the UX felt consistent.

---

## 4. Verification

- `npm run dev` – used during implementation to check rendering, input and game flow.
- `npm run build` – verified before deployment.
- Manual testing in the browser:
  - different bets and multipliers
  - auto-play behaviour
  - reload with persisted bet & balance.
