'use client';

import React, { useState, useEffect } from 'react';
import CaptureFlow from '@/components/CaptureFlow';
import GraduationWall from '@/components/GraduationWall';
import CinematicIntro from '@/components/CinematicIntro';
import { LayoutGrid, Camera, History } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const isWallLive = process.env.NEXT_PUBLIC_WALL_LIVE === 'true';
  const [mode, setMode] = useState<'capture' | 'wall'>(isWallLive ? 'wall' : 'capture');
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  useEffect(() => {
    const checkIntroStatus = () => {
      try {
        const hasSeenIntro = localStorage.getItem('grad_intro_seen');
        setShowIntro(!hasSeenIntro);
      } catch (error) {
        console.warn('localStorage not available:', error);
        setShowIntro(true); // Default to showing intro if storage fails
      }
    };
    
    checkIntroStatus();
  }, []);

  useEffect(() => {
    if (mode === 'capture' && !showIntro) {
      document.body.classList.add('light-theme');
      document.body.classList.add('neo-brutalist-theme');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.remove('neo-brutalist-theme');
    }
    return () => {
      document.body.classList.remove('light-theme');
      document.body.classList.remove('neo-brutalist-theme');
    };
  }, [mode, showIntro]);

  const handleIntroComplete = () => {
    try {
      localStorage.setItem('grad_intro_seen', 'true');
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
    setShowIntro(false);
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  // Avoid hydration flicker
  if (showIntro === null) {
    return <main style={{ background: '#000', minHeight: '100vh', width: '100%' }} />;
  }

  if (showIntro) {
    return <CinematicIntro onComplete={handleIntroComplete} />;
  }

  return (
    <main style={{ flexDirection: 'column', width: '100%', alignItems: 'stretch' }}>
      <div className={styles.controls}>
        <button
          onClick={handleReplayIntro}
          title="Replay Intro"
          className={styles.iconButton}
        >
          <History size={18} />
        </button>

        <button
          onClick={() => setMode(mode === 'capture' ? 'wall' : 'capture')}
          className={styles.pillButton}
        >
          {mode === 'capture' ? (
            <>
              <LayoutGrid size={18} />
              <span>View The Wall</span>
            </>
          ) : (
            <>
              <Camera size={18} />
              <span>Capture Moment</span>
            </>
          )}
        </button>
      </div>

      {mode === 'capture' ? <CaptureFlow /> : <GraduationWall />}
    </main>
  );
}
