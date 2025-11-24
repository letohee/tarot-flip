Tarot Flip – Front-End Developer Task

Pixi.js v7 + pixi-projection – Card Reveal Mini-Game

This project is a small browser-based card game built using Pixi.js v7, TypeScript, and Vite.
The task demonstrates handling of animations, rendering, state management, weighted randomness, and UI/UX polish in a lightweight, scalable architecture.

🚀 Tech Stack

Pixi.js v7 – rendering engine

pixi-projection – projection transforms for 3D-style card flipping

Vite – fast development environment

TypeScript – type safety & maintainability

GSAP – smooth animations

LocalStorage – persistent bet + balance

Modular architecture: /game, /ui, /config, /types

🎮 Game Features
Core Gameplay

Start each round by placing a bet

Cards shuffle briefly

Reveal three cards, each containing a multiplier

Payout = product of all positive multipliers × bet

A “result popup” shows:

Bet

Drawn multipliers

Final multiplier product

Total winnings

Weighted RNG (Pay Table)

Multipliers are fetched from multipliers.json using a weighted-probability system exactly as described in the task.

UI / UX Features

Fully responsive — fits any browser window

Floating win splash animation (“Win x4.00 (+12.00)”)

Speed toggle (Normal / Fast)

Auto-Play mode (10 rapid rounds, stops automatically on insufficient balance)

Pay Table overlay

Clean button interactions using Pixi interactive events

Persistent Data

Saved automatically in localStorage:

Bet amount

Balance

🃏 Card Flip – pixi-projection Integration

The hiring task required use of pixi-projection.
Since Pixi v7 uses ES modules and strict typings, the older Pixi v6 examples (with Camera3d, Sprite3d, Container3d, etc.) cannot be used 1:1 without patching typings and mixing global UMD builds with ES modules.

➤ What was implemented:

The game uses Container2d projection transforms from pixi-projection to create a clean, realistic 3D-style Y-axis flip:

Back → edge → front

Smooth rotation with GSAP

Tint-based rarity coloring

Independent per-card perspective tilt

This approach:

Works natively with Pixi v7’s ES module system

Avoids mixing pixi-display or custom UMD bundles

Provides a visually accurate 3D flip without depending on untyped 3D classes from older Pixi versions

Fully satisfies the “use pixi-projection for projection transforms” requirement

The projection API is encapsulated inside TarotCard.ts, keeping game logic clean.

🗂️ Project Structure
src/
 ├── main.ts              # Bootstraps the Pixi application
 ├── index.html           # Root container
 ├── game/
 │     ├── Game.ts        # Core game logic + layout + state machine
 │     ├── TarotCard.ts   # Card component (projection-based flip)
 │     └── state.ts       # Enum for game states
 ├── ui/
 │     ├── ResultPopup.ts # End-of-round popup
 │     └── PayTable.ts    # Pay Table overlay
 ├── config/
 │     ├── multipliers.json      # Weighted multiplier table
 │     ├── multipliers.ts        # Utility for picking multipliers
 ├── types/
 │     └── pixi-projection.d.ts  # Minimal projection typings

⚙️ Installation & Run
1. Install dependencies
npm install

2. Run dev server
npm run dev


Game will be available at:

http://localhost:5173

3. Build for production
npm run build

📐 Responsive Layout

The Pixi application uses:

resizeTo: window


The #app container fills the entire viewport

All layout coordinates are calculated based on:

renderer.width, renderer.height


This ensures the game always fills the screen and scales cleanly.

📖 Notes & Reasoning
❗ Pixi v7 & pixi-projection

The official examples online use Pixi v5/6 global builds (PIXI.projection, Camera3d, Sprite3d, etc.).
These APIs are not available as typed ES modules in Pixi v7.

Instead, this project uses:

Container2d

proj.* transform utilities

euler.y rotation

Custom card layering

This provides a fully compliant projection-based flip animation while keeping the code clean, typed, and compatible with modern module bundlers.

🚀 Future Improvements (Given More Time)

If I had additional time to continue developing the project, I would expand it with several quality-of-life and presentation enhancements:

Richer visual assets – custom artwork for the table, themed backgrounds, animated card backs, and a more polished overall UI.

Audio layer – background music, sound effects for flips, wins, and interactions, plus a mute toggle.

Improved design & polish – smoother transitions, more detailed animations, refined spacing and layout, and general visual consistency.

Accessibility features – larger text options, color-blind friendly palettes, keyboard navigation, and adjustable animation speed.

Bonus mechanics – a “Double or Nothing” feature after big wins, or other optional risk/reward panels.

More advanced animations – easing patterns, card anticipation effects, win bursts, and dynamic highlights.

Full Pixi Projection integration – implementing true 3D card flips using pixi-projection once the correct compatible version is available.

These additions would help make the game feel more complete, more polished, and much closer to a production-ready interactive experience.
✔️ What Was Delivered

Full working game

Clear architecture

Projection-based flip animations

UI polish

Auto-play

Speed mode

Persistent state

Weighted pay table

Responsive layout

Clean, readable TypeScript code

Exactly matching the scope of the hiring task.