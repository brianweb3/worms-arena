import { WebSocket } from 'ws';
import type { GameEvent } from '@worms-arena/shared';
import type { Server } from 'http';
export declare class Broadcaster {
    private wss;
    private clients;
    private connectionHandlers;
    constructor(server: Server);
    /** Broadcast a game event to all connected clients. */
    broadcast(event: GameEvent): void;
    /** Send event to a specific client. */
    send(ws: WebSocket, event: GameEvent | Record<string, unknown>): void;
    get clientCount(): number;
    /** Register handler for new client connections. */
    onNewClient(handler: (ws: WebSocket) => void): void;
}
//# sourceMappingURL=broadcast.d.ts.map