// ---------------------------------------------------------------------------
// worms.arena — Weapon Definitions
// ---------------------------------------------------------------------------

import { WEAPON_BAZOOKA, WEAPON_GRENADE, WEAPON_SHOTGUN } from './constants';
import type { WeaponDef, WeaponId } from './types';

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  [WEAPON_BAZOOKA]: {
    id: 'bazooka',
    name: 'Bazooka',
    damage: 45,
    radius: 30,
    windAffected: true,
    fuseTime: 0,
    projectileCount: 1,
    spreadAngle: 0,
    speedMultiplier: 500,
  },
  [WEAPON_GRENADE]: {
    id: 'grenade',
    name: 'Grenade',
    damage: 50,
    radius: 35,
    windAffected: true,
    fuseTime: 3,
    projectileCount: 1,
    spreadAngle: 0,
    speedMultiplier: 400,
  },
  [WEAPON_SHOTGUN]: {
    id: 'shotgun',
    name: 'Shotgun',
    damage: 25,
    radius: 12,
    windAffected: false,
    fuseTime: 0,
    projectileCount: 2,
    spreadAngle: 0.08,
    speedMultiplier: 600,
  },
};

export const WEAPON_LIST: WeaponDef[] = Object.values(WEAPONS);
