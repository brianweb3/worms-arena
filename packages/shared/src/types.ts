// ---------------------------------------------------------------------------
// worms.arena — Core Types
// ---------------------------------------------------------------------------

/** Weapon identifier */
export type WeaponId = 'bazooka' | 'grenade' | 'shotgun';

/** Weapon definition */
export interface WeaponDef {
  id: WeaponId;
  name: string;
  damage: number;
  radius: number; // explosion radius in pixels
  /** If true, projectile is affected by wind */
  windAffected: boolean;
  /** Fuse time in seconds (only for grenade) — 0 means explode on impact */
  fuseTime: number;
  /** Number of projectiles (shotgun fires multiple) */
  projectileCount: number;
  /** Spread angle in radians (for shotgun) */
  spreadAngle: number;
  /** Speed multiplier (base speed * power * this) */
  speedMultiplier: number;
}

/** A single worm on the battlefield */
export interface Worm {
  id: number;
  name: string;
  teamId: number;
  hp: number;
  x: number;
  y: number;
  alive: boolean;
  facing: -1 | 1; // -1 = left, 1 = right
}

/** Team */
export interface Team {
  id: number;
  name: string;
  agentId: string;
  /** Colour used for rendering */
  color: string;
  /** Team inventory */
  inventory: Inventory;
}

/** Active projectile in flight */
export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  weaponId: WeaponId;
  /** Remaining fuse time (seconds). When <= 0, explode. */
  fuse: number;
  active: boolean;
}

/** An explosion event (for broadcast / rendering) */
export interface Explosion {
  x: number;
  y: number;
  radius: number;
  damage: number;
}

/** Wind value for the current turn (-1..1) */
export type Wind = number;

/** Inventory for a team */
export interface Inventory {
  weapons: Record<WeaponId, number>; // количество каждого оружия
  healthKits: number; // аптечки
  shields: number; // щиты
  speedBoosts: number; // ускорения
}

/** Item type for items on the map */
export type ItemType = 'healthKit' | 'shield' | 'speedBoost' | 'weapon';

/** Item on the map that can be picked up */
export interface Item {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  weaponId?: WeaponId; // если type === 'weapon'
}

/** Turn action — what the AI decided */
export type TurnAction =
  | {
      type: 'shoot';
      weaponId: WeaponId;
      angle: number; // radians
      power: number; // 0..1
    }
  | {
      type: 'move';
      direction: -1 | 1; // left or right
    }
  | {
      type: 'moveTo';
      targetX: number;
      targetY: number;
    }
  | {
      type: 'useItem';
      itemType: 'healthKit' | 'shield' | 'speedBoost';
    }
  | {
      type: 'skip';
    };

/** Result of simulating one turn */
export interface TurnResult {
  turnNumber: number;
  activeWormId: number;
  wind: Wind;
  action: TurnAction;
  /** Projectile trajectory frames (for animation) */
  trajectoryFrames: Array<{ x: number; y: number }>;
  explosions: Explosion[];
  /** Worm state after the turn */
  wormsAfter: Worm[];
  /** Terrain destruction circles */
  terrainDamage: Array<{ x: number; y: number; radius: number }>;
  /** Worms that died this turn */
  deaths: number[];
  /** Movement path frames (for moveTo animation) */
  movementFrames?: Array<{ x: number; y: number }>;
  /** Items picked up this turn */
  itemsPicked?: Item[];
}

/** Match statistics */
export interface MatchStats {
  totalShots: number;
  totalDamage: number;
  weaponsUsed: Record<WeaponId, number>;
  movementDistance: number;
  itemsPicked: number;
}

/** Full game state snapshot */
export interface GameState {
  matchId: string;
  seed: number;
  mapWidth: number;
  mapHeight: number;
  teams: Team[];
  worms: Worm[];
  turnNumber: number;
  currentTeamIndex: number;
  currentWormIndices: number[]; // per-team rotating worm index
  wind: Wind;
  isFinished: boolean;
  winnerId: number | null; // team id or null for draw
  /** Terrain stored as base64-encoded Uint8Array on wire */
  terrainBase64?: string;
  /** Match statistics */
  matchStats?: MatchStats;
  /** Items on the map */
  items?: Item[];
}

/** Summary of a live match (for the games list widget) */
export interface MatchSummary {
  matchId: string;
  agent1: string;
  agent2: string;
  agent1Id: string;
  agent2Id: string;
  agent1Color: string;
  agent2Color: string;
  turnNumber: number;
  alive1: number;
  alive2: number;
  totalHp1: number;
  totalHp2: number;
  startedAt: number;
}

// ---- WebSocket protocol events ----
// Every game event carries a matchId so the client can route it.

export interface MatchStartEvent {
  type: 'match:start';
  matchId: string;
  state: GameState;
}

export interface TurnStartEvent {
  type: 'turn:start';
  matchId: string;
  turnNumber: number;
  activeWormId: number;
  wind: Wind;
}

export interface TurnActionEvent {
  type: 'turn:action';
  matchId: string;
  turnNumber: number;
  action: TurnAction;
}

export interface ProjectileUpdateEvent {
  type: 'projectile:update';
  matchId: string;
  frames: Array<{ x: number; y: number }>;
}

export interface ExplosionEvent {
  type: 'explosion';
  matchId: string;
  explosions: Explosion[];
}

export interface TerrainUpdateEvent {
  type: 'terrain:update';
  matchId: string;
  damage: Array<{ x: number; y: number; radius: number }>;
}

export interface WormUpdateEvent {
  type: 'worm:update';
  matchId: string;
  worms: Worm[];
  deaths: number[];
}

export interface MatchEndEvent {
  type: 'match:end';
  matchId: string;
  winnerId: number | null;
  teams: Team[];
  worms: Worm[];
}

/** Periodic update listing all live matches */
export interface MatchListEvent {
  type: 'match:list';
  matches: MatchSummary[];
}

/** Match statistics update */
export interface MatchStatsEvent {
  type: 'match:stats';
  matchId: string;
  stats: MatchStats;
}

/** Movement update event */
export interface MovementUpdateEvent {
  type: 'movement:update';
  matchId: string;
  frames: Array<{ x: number; y: number }>;
  wormId: number;
}

export type GameEvent =
  | MatchStartEvent
  | TurnStartEvent
  | TurnActionEvent
  | ProjectileUpdateEvent
  | ExplosionEvent
  | TerrainUpdateEvent
  | WormUpdateEvent
  | MatchEndEvent
  | MatchListEvent
  | MatchStatsEvent
  | MovementUpdateEvent;
