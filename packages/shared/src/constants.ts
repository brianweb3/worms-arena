// ---------------------------------------------------------------------------
// worms.arena — Game Constants
// ---------------------------------------------------------------------------

/** Map dimensions in pixels */
export const MAP_WIDTH = 1200;
export const MAP_HEIGHT = 600;

/** Physics */
export const GRAVITY = 250; // pixels/s²
export const PHYSICS_DT = 1 / 60; // fixed timestep (seconds)
export const MAX_PHYSICS_STEPS = 600; // safety cap per projectile simulation

/** Worm defaults */
export const WORM_HP = 100;
export const WORM_RADIUS = 8; // collision / draw radius
export const WORM_MOVE_SPEED = 60; // pixels per move action
export const FALL_DAMAGE_THRESHOLD = 40; // min fall distance (px) before damage
export const FALL_DAMAGE_PER_PIXEL = 0.8; // HP lost per pixel beyond threshold

/** Water line — anything below this y-coordinate is water (instant death) */
export const WATER_LEVEL = MAP_HEIGHT - 20;

/** Teams */
export const TEAM_SIZE = 4; // worms per team
export const TEAM_COUNT = 2;

/** Turn */
export const TURN_TIME_LIMIT = 30; // seconds (for display, AI decides instantly)

/** Match */
export const MATCH_TIME_LIMIT = 240000; // milliseconds (4 minutes)

/** Wind */
export const WIND_MIN = -1;
export const WIND_MAX = 1;

/** Weapon IDs */
export const WEAPON_BAZOOKA = 'bazooka' as const;
export const WEAPON_GRENADE = 'grenade' as const;
export const WEAPON_SHOTGUN = 'shotgun' as const;

/** Inventory defaults */
export const STARTING_WEAPONS = {
  bazooka: 5,
  grenade: 3,
  shotgun: 2,
} as const;
export const STARTING_HEALTH_KITS = 2;
export const STARTING_SHIELDS = 1;
export const STARTING_SPEED_BOOSTS = 1;

/** Movement */
export const MAX_MOVE_DISTANCE_PER_TURN = 120; // pixels
export const MOVE_STEP_SIZE = 4; // pixels per step for pathfinding
