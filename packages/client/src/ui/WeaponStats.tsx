// ---------------------------------------------------------------------------
// worms.arena — Weapon Statistics Component
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';

interface WeaponStats {
  bazooka: number;
  grenade: number;
  shotgun: number;
}

export default function WeaponStats() {
  const [stats, setStats] = useState<WeaponStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function fetchStats() {
      fetch('/api/weapon-stats')
        .then((r) => r.json())
        .then((data: WeaponStats) => {
          setStats(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: 'rgba(0,0,0,0.5)' }}>
        Loading...
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: 'rgba(0,0,0,0.5)' }}>
        No statistics available
      </div>
    );
  }

  const total = stats.bazooka + stats.grenade + stats.shotgun;
  const percentages = {
    bazooka: total > 0 ? (stats.bazooka / total) * 100 : 0,
    grenade: total > 0 ? (stats.grenade / total) * 100 : 0,
    shotgun: total > 0 ? (stats.shotgun / total) * 100 : 0,
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
        Most Used Weapons
      </h3>

      <div style={{ marginBottom: 8, fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
        Total uses: {total.toLocaleString()}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <WeaponBar 
          name="Bazooka" 
          count={stats.bazooka} 
          percentage={percentages.bazooka}
          color="#e74c3c"
        />
        <WeaponBar 
          name="Grenade" 
          count={stats.grenade} 
          percentage={percentages.grenade}
          color="#f39c12"
        />
        <WeaponBar 
          name="Shotgun" 
          count={stats.shotgun} 
          percentage={percentages.shotgun}
          color="#3498db"
        />
      </div>

      <div style={{ 
        marginTop: 16, 
        padding: 12, 
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 4,
        fontSize: 11,
        color: 'rgba(0,0,0,0.7)',
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Most Popular:</div>
        <div>
          {percentages.bazooka >= percentages.grenade && percentages.bazooka >= percentages.shotgun && 'Bazooka'}
          {percentages.grenade >= percentages.bazooka && percentages.grenade >= percentages.shotgun && 'Grenade'}
          {percentages.shotgun >= percentages.bazooka && percentages.shotgun >= percentages.grenade && 'Shotgun'}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {iconSrc && (
            <img 
              src={iconSrc} 
              alt={name}
              style={{ 
                width: 24, 
                height: 24, 
                imageRendering: 'pixelated',
                objectFit: 'contain'
              }} 
            />
          )}
          <span style={{ fontWeight: 'bold' }}>{name}:</span>
        </div>
        <span>{count.toLocaleString()} ({percentage.toFixed(1)}%)</span>
      </div>
      <div style={{
        width: '100%',
        height: 20,
        backgroundColor: '#e0e0e0',
        border: '1px solid #808080',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}
