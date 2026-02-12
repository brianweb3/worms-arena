/** Map dimensions in pixels */
export declare const MAP_WIDTH = 1200;
export declare const MAP_HEIGHT = 600;
/** Physics */
export declare const GRAVITY = 250;
export declare const PHYSICS_DT: number;
export declare const MAX_PHYSICS_STEPS = 600;
/** Worm defaults */
export declare const WORM_HP = 100;
export declare const WORM_RADIUS = 8;
export declare const WORM_MOVE_SPEED = 60;
export declare const FALL_DAMAGE_THRESHOLD = 40;
export declare const FALL_DAMAGE_PER_PIXEL = 0.8;
/** Water line — anything below this y-coordinate is water (instant death) */
export declare const WATER_LEVEL: number;
/** Teams */
export declare const TEAM_SIZE = 4;
export declare const TEAM_COUNT = 2;
/** Turn */
export declare const TURN_TIME_LIMIT = 30;
/** Match */
export declare const MATCH_TIME_LIMIT = 240000;
/** Wind */
export declare const WIND_MIN = -1;
export declare const WIND_MAX = 1;
/** Weapon IDs */
export declare const WEAPON_BAZOOKA: "bazooka";
export declare const WEAPON_GRENADE: "grenade";
export declare const WEAPON_SHOTGUN: "shotgun";
/** Inventory defaults */
export declare const STARTING_WEAPONS: {
    readonly bazooka: 5;
    readonly grenade: 3;
    readonly shotgun: 2;
};
export declare const STARTING_HEALTH_KITS = 2;
export declare const STARTING_SHIELDS = 1;
export declare const STARTING_SPEED_BOOSTS = 1;
/** Movement */
export declare const MAX_MOVE_DISTANCE_PER_TURN = 120;
export declare const MOVE_STEP_SIZE = 4;
//# sourceMappingURL=constants.d.ts.map