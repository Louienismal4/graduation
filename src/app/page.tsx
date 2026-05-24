'use client';

import React, { useState, useEffect } from 'react';
import CaptureFlow from '@/components/CaptureFlow';
import GraduationWall from '@/components/GraduationWall';
import CinematicIntro from '@/components/CinematicIntro';
import { LayoutGrid, Camera, History } from 'lucide-react';

export default function Home() {
  const isWallLive = process.env.NEXT_PUBLIC_WALL_LIVE === 'true';
  const [mode, setMode] = useState<'capture' | 'wall'>(isWallLive ? 'wall' : 'capture');
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('grad_intro_seen');
    if (hasSeenIntro) {
      setShowIntro(false);
    } else {
      setShowIntro(true);
    }
  }, []);

  const handleIntroComplete = () => {
    localStorage.setItem('grad_intro_seen', 'true');
    setShowIntro(false);
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  // Avoid hydration flicker
  if (showIntro === null) {
    return <main style={{ background: '#000', minHeight: '100vh', width: '100%' }} />;
  }

  return (
    <main style={{ flexDirection: 'column', width: '100%', alignItems: 'stretch' }}>
      {showIntro && (
        <CinematicIntro onComplete={handleIntroComplete} />
      )}

      <div style={{ 
        position: 'fixed', 
        top: '1.5rem', 
        right: '1.5rem', 
        zIndex: 50,
        display: 'flex',
        gap: '0.75rem'
      }}>
        <button
          onClick={handleReplayIntro}
          title="Replay Intro"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '9999px',
            background: 'rgba(24, 24, 27, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #27272a',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <History size={18} />
        </button>

        <button
          onClick={() => setMode(mode === 'capture' ? 'wall' : 'capture')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            borderRadius: '9999px',
            background: 'rgba(24, 24, 27, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #27272a',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
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
