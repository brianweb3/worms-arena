// ---------------------------------------------------------------------------
// worms.arena — Server Entry Point
// ---------------------------------------------------------------------------

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Broadcaster } from './broadcast.js';
import { MatchManager } from './match.js';
import { initDb, getLeaderboard, getAllAgents, getAgentStats } from './db.js';
import { getWeaponStats } from './match.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = parseInt(process.env.PORT || '3001', 10);
const VITE_PORT = parseInt(process.env.VITE_PORT || '5173', 10);

// ---- Express setup ----
const app = express();
const server = createServer(app);

app.use(express.json());

// CORS for dev
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static client build in production, or proxy to Vite in dev
const clientDist = path.resolve(__dirname, '..', '..', 'client', 'dist');
const isProduction = existsSync(clientDist);

if (isProduction) {
  app.use(express.static(clientDist));
} else {
  // Proxy to Vite dev server in development (but not API/WS routes)
  const viteProxy = createProxyMiddleware({
    target: `http://localhost:${VITE_PORT}`,
    changeOrigin: true,
    ws: true,
  });
  
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    return viteProxy(req, res, next);
  });
}

// ---- API routes ----

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/leaderboard', (_req, res) => {
  try {
    const rows = getLeaderboard();
    console.log(`[api] Leaderboard request: returning ${rows.length} agents`);
    res.json(rows);
  } catch (err) {
    console.error('[api] Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.get('/api/agents', (_req, res) => {
  try {
    const agents = getAllAgents();
    res.json(agents);
  } catch {
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

app.get('/api/agent/:id/stats', (req, res) => {
  try {
    const stats = getAgentStats(req.params.id);
    if (!stats) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(stats);
  } catch {
    res.status(500).json({ error: 'Failed to fetch agent stats' });
  }
});

app.get('/api/weapon-stats', (_req, res) => {
  try {
    const stats = getWeaponStats();
    res.json(stats);
  } catch {
    res.status(500).json({ error: 'Failed to fetch weapon stats' });
  }
});

// SPA fallback (only in production)
if (isProduction) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ---- Start ----

// Global match manager instance (for Vercel serverless)
let globalMatchManager: MatchManager | null = null;
let globalBroadcaster: Broadcaster | null = null;

async function main() {
  console.log('[server] Environment:', {
    PORT,
    VERCEL: process.env.VERCEL,
    NODE_ENV: process.env.NODE_ENV,
  });
  
  console.log('[server] Initializing data store...');
  initDb();

  console.log('[server] Starting WebSocket server...');
  const broadcaster = new Broadcaster(server);
  globalBroadcaster = broadcaster;

  console.log('[server] Starting match manager...');
  const matchManager = new MatchManager(broadcaster);
  globalMatchManager = matchManager;

  server.listen(PORT, () => {
    console.log(`[server] worms.arena running on http://localhost:${PORT}`);
  });

  // Start the infinite match loop (non-blocking)
  matchManager.start().catch((err) => {
    console.error('[server] Match manager crashed:', err);
    // Don't exit on Vercel - let it restart. Railway will handle restarts automatically.
    if (!process.env.VERCEL && !process.env.RAILWAY_ENVIRONMENT) {
      process.exit(1);
    }
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[server] Shutting down...');
    matchManager.stop();
    server.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n[server] SIGTERM received, shutting down...');
    matchManager.stop();
    server.close();
    process.exit(0);
  });
}

// Initialize immediately
main().catch((err) => {
  console.error('[server] Failed to start:', err);
});

export default app;
