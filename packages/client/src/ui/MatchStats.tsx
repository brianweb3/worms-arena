// ---------------------------------------------------------------------------
// worms.arena — Match Statistics Component
// ---------------------------------------------------------------------------

import type { MatchStats as MatchStatsType } from '@worms-arena/shared';

interface Props {
  stats: MatchStatsType | null | undefined;
}

export default function MatchStats({ stats }: Props) {
  if (!stats) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: 'rgba(0,0,0,0.5)' }}>
        No statistics available
      </div>
    );
  }

  const totalWeaponsUsed = stats.weaponsUsed.bazooka + stats.weaponsUsed.grenade + stats.weaponsUsed.shotgun;
  const weaponPercentages = {
    bazooka: totalWeaponsUsed > 0 ? (stats.weaponsUsed.bazooka / totalWeaponsUsed) * 100 : 0,
    grenade: totalWeaponsUsed > 0 ? (stats.weaponsUsed.grenade / totalWeaponsUsed) * 100 : 0,
    shotgun: totalWeaponsUsed > 0 ? (stats.weaponsUsed.shotgun / totalWeaponsUsed) * 100 : 0,
  };

  return (
    <div style={{
      padding: '16px',
      fontSize: 13,
      fontFamily: "'MS Sans Serif', Arial, sans-serif",
      height: '100%',
      overflowY: 'auto',
    }}>
      <h3 style={{
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 16,
        borderBottom: '1px solid rgba(0,0,0,0.2)',
        paddingBottom: 8,
      }}>
        Match Statistics
      </h3>

      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>Total Shots:</strong> {stats.totalShots}
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Total Damage:</strong> {Math.round(stats.totalDamage)}
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Movement Distance:</strong> {Math.round(stats.movementDistance)}px
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Items Picked:</strong> {stats.itemsPicked}
        </div>
      </div>

      <div>
        <h4 style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
          Weapons Used
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <WeaponBar 
            name="Bazooka" 
            count={stats.weaponsUsed.bazooka} 
            percentage={weaponPercentages.bazooka}
            color="#e74c3c"
          />
          <WeaponBar 
            name="Grenade" 
            count={stats.weaponsUsed.grenade} 
            percentage={weaponPercentages.grenade}
            color="#f39c12"
          />
          <WeaponBar 
            name="Shotgun" 
            count={stats.weaponsUsed.shotgun} 
            percentage={weaponPercentages.shotgun}
            color="#3498db"
          />
        </div>
      </div>
    </div>
  );
}

function WeaponBar({ name, count, percentage, color }: { 
  name: string; 
  count: number; 
  percentage: number;
  color: string;
}) {
  const getWeaponIcon = (weaponName: string) => {
    switch (weaponName.toLowerCase()) {
      case 'bazooka':
        return '/assets/weapon-bazooka.png';
      case 'grenade':
        return '/assets/weapon-grenade.png';
      case 'shotgun':
        return '/assets/weapon-shotgun.png';
      default:
        return null;
    }
  };

  const iconSrc = getWeaponIcon(name);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {iconSrc && (
            <img 
              src={iconSrc} 
              alt={name}
              style={{ 
                width: 20, 
                height: 20, 
                imageRendering: 'pixelated',
                objectFit: 'contain'
              }} 
            />
          )}
          <span>{name}:</span>
        </div>
        <span>{count} ({percentage.toFixed(1)}%)</span>
      </div>
      <div style={{
        width: '100%',
        height: 16,
        backgroundColor: '#e0e0e0',
        border: '1px solid #808080',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}
