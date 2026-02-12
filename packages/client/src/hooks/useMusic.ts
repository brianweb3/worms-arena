// ---------------------------------------------------------------------------
// worms.arena — Background music hook
// ---------------------------------------------------------------------------

import { useRef, useState, useCallback, useEffect } from 'react';

export function useMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(true); // Default to playing
  const [volume, setVolume] = useState(0.3);
  const startedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio('/assets/worms-theme.mp3');
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    // Try to start playing automatically
    audio.play().then(() => {
      setPlaying(true);
      startedRef.current = true;
    }).catch(() => {
      // Autoplay blocked — will need user interaction
      setPlaying(false);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => {
        setPlaying(true);
        startedRef.current = true;
      }).catch(() => {
        // Autoplay blocked — will need user interaction
      });
    }
  }, [playing]);

  // Try to start on first user interaction if not yet started
  const tryAutostart = useCallback(() => {
    if (startedRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(() => {
      setPlaying(true);
      startedRef.current = true;
    }).catch(() => {});
  }, []);

  return { playing, toggle, volume, setVolume, tryAutostart };
}
