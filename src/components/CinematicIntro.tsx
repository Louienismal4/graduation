'use client';

import React, { useState, useEffect } from 'react';

const steps = [
  "Four years ago...\nwe walked in as strangers.",
  "With dreams too big for our fears...\nand fears too heavy for our hearts.",
  "We survived deadlines, breakdowns, sleepless nights,\nand moments nobody else saw.",
  "But somehow...\nwe kept going.",
  "Every sacrifice.\nEvery late-night review.\nEvery silent prayer.\nLed us here.",
  "These aren’t just pictures.",
  "They are proof\nthat we lived this chapter.",
  "Tonight, we celebrate the present...\n...while sending memories into the future."
];

export default function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFinal, setIsFinal] = useState(false);

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 3500);
      return () => clearTimeout(timer);
    } else {
      setIsFinal(true);
    }
  }, [currentStep]);

  // Styles based on spec: White background, #1E2D93 text color, Playfair Display font
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    color: '#1E2D93',
    fontFamily: 'var(--font-playfair), serif',
    zIndex: 9999,
    padding: '2rem',
    cursor: 'pointer'
  };

  const textStyle: React.CSSProperties = {
    fontSize: '1.75rem',
    lineHeight: '1.4',
    whiteSpace: 'pre-line',
  };

  const buttonStyle: React.CSSProperties = {
    marginTop: '2rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#1E2D93',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.125rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  };

  if (isFinal) {
    return (
      <div style={containerStyle}>
         <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Graduation Time Machine</h1>
         <p style={{ fontSize: '1.25rem', marginBottom: '2rem', maxWidth: '600px' }}>
           Lock your memories. Write your story. Meet yourself again someday.
         </p>
         <div style={{ fontStyle: 'italic', marginBottom: '2rem', maxWidth: '600px' }}>
           Because years from now... you’ll want to remember who you were tonight.
         </div>
         <button onClick={onComplete} style={buttonStyle}>
           Enter the Time Machine
         </button>
      </div>
    );
  }

  return (
    <div onClick={() => setCurrentStep(prev => prev + 1)} style={containerStyle}>
      <div key={currentStep} className="animate-fade-in-out" style={textStyle}>
        {steps[currentStep]}
      </div>
    </div>
  );
}
