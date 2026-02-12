// ---------------------------------------------------------------------------
// worms.arena — WebSocket Broadcaster (multi-match aware)
// ---------------------------------------------------------------------------

import { WebSocketServer, WebSocket } from 'ws';
import type { GameEvent } from '@worms-arena/shared';
import type { Server } from 'http';

export class Broadcaster {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private connectionHandlers: Array<(ws: WebSocket) => void> = [];

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log(`[ws] client connected (total: ${this.clients.size})`);

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[ws] client disconnected (total: ${this.clients.size})`);
      });

      ws.on('error', (err) => {
        console.error('[ws] client error:', err.message);
        this.clients.delete(ws);
      });

      ws.send(JSON.stringify({ type: 'welcome', clientCount: this.clients.size }));

      // Notify all handlers about new client
      for (const handler of this.connectionHandlers) {
        handler(ws);
      }
    });

    console.log('[ws] WebSocket server ready on /ws');
  }

  /** Broadcast a game event to all connected clients. */
  broadcast(event: GameEvent): void {
    const data = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  /** Send event to a specific client. */
  send(ws: WebSocket, event: GameEvent | Record<string, unknown>): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  get clientCount(): number {
    return this.clients.size;
  }

  /** Register handler for new client connections. */
  onNewClient(handler: (ws: WebSocket) => void): void {
    this.connectionHandlers.push(handler);
  }
}
