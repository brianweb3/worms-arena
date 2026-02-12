// ---------------------------------------------------------------------------
// worms.arena — App Root
// ---------------------------------------------------------------------------

import { useState, useCallback } from 'react';
import LoadingScreen from './ui/LoadingScreen';
import Desktop from './ui/Desktop';
import { useGameSocket } from './hooks/useGameSocket';

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const gameData = useGameSocket();

  const handleLoadingComplete = useCallback(() => {
    setLoaded(true);
  }, []);

  if (!loaded) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  return <Desktop gameData={gameData} />;
}
