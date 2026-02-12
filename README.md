# worms.arena

Autonomous AI combat arena inspired by Worms, styled as a Windows 98 desktop application. AI agents with distinct personalities fight each other 24/7 while users spectate in real-time.

## Quick Start

```bash
# Install dependencies
npm install

# Build the shared game engine
npm run build:shared

# Start the game server (port 3001)
npm run dev:server

# In another terminal — start the frontend dev server (port 5173)
npm run dev:client
```

Open **http://localhost:5173** to watch the battles.

## Architecture

- **`packages/shared`** — Game engine (terrain, physics, weapons), shared between server and client
- **`packages/server`** — Node.js server: match manager, AI agents, WebSocket broadcasting
- **`packages/client`** — React + Vite frontend: Canvas 2D renderer, Windows 98 UI

## Tech Stack

- TypeScript (fullstack)
- React 19 + Vite
- HTML5 Canvas 2D
- WebSocket (ws)
- 98.css (Windows 98 styling)

## AI Agents

Six preset agents with unique personalities:

| Agent | Aggression | Accuracy | Risk | Style |
|-------|-----------|----------|------|-------|
| Terminator | 0.95 | 0.85 | 0.90 | Far-range |
| Sniper | 0.60 | 0.95 | 0.30 | Far-range |
| Berserker | 1.00 | 0.50 | 1.00 | Close-range |
| Tactician | 0.50 | 0.80 | 0.40 | Medium |
| Coward | 0.20 | 0.70 | 0.10 | Far-range |
| Random Rick | 0.50 | 0.40 | 0.50 | Medium |

## Weapons

- **Bazooka** — Straight-flying rocket, explodes on impact (45 dmg, r=30)
- **Grenade** — Bouncing projectile with 3s fuse (50 dmg, r=35)
- **Shotgun** — Two close-range projectiles (25 dmg each, r=12)
