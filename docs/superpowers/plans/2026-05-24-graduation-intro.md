# Graduation Cinematic Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a cinematic, 8-screen emotional intro sequence with a white background and navy serif typography that plays on first visit.

**Architecture:** Use a standalone `CinematicIntro` component that manages a step-based animation state. Use `localStorage` to persist the "seen" state and add a replay button to the main UI.

**Tech Stack:** Next.js, React Hooks, Lucide React (for icons), Vanilla CSS / Inline Styles.

---

### Task 1: Setup Fonts and Global Styles

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [x] **Step 1: Add Playfair Display font to layout**

```tsx
// src/app/layout.tsx
import { Playfair_Display, Geist, Geist_Mono } from "next/font/google";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

// ... update html className to include playfair.variable
```

- [x] **Step 2: Add animation keyframes to globals.css**

```css
/* src/app/globals.css */
@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(10px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-10px); }
}

.animate-fade-in-out {
  animation: fadeInOut 3.5s ease-in-out forwards;
}
```

- [x] **Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "style: add Playfair Display font and fade animation keyframes"
```

---

### Task 2: Create CinematicIntro Component

**Files:**
- Create: `src/components/CinematicIntro.tsx`

- [x] **Step 1: Implement the component with step logic**

```tsx
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

  if (isFinal) {
    return (
      <div style={{ /* Final Screen Style */ }}>
         <h1>Graduation Time Machine</h1>
         <p>Lock your memories. Write your story. Meet yourself again someday.</p>
         <button onClick={onComplete}>Enter the Time Machine</button>
      </div>
    );
  }

  return (
    <div onClick={() => setCurrentStep(prev => prev + 1)} style={{ /* Intro Style */ }}>
      <div key={currentStep} className="animate-fade-in-out">
        {steps[currentStep]}
      </div>
    </div>
  );
}
```

- [x] **Step 2: Commit**

```bash
git add src/components/CinematicIntro.tsx
git commit -m "feat: implement CinematicIntro component with auto-advance logic"
```

---

### Task 3: Integrate Intro into Home Page

**Files:**
- Modify: `src/app/page.tsx`

- [x] **Step 1: Add persistence and conditional rendering**

```tsx
// src/app/page.tsx
const [showIntro, setShowIntro] = useState<boolean | null>(null);

useEffect(() => {
  const hasSeen = localStorage.getItem('grad_intro_seen');
  setShowIntro(!hasSeen);
}, []);

const handleIntroComplete = () => {
  localStorage.setItem('grad_intro_seen', 'true');
  setShowIntro(false);
};

if (showIntro === null) return null; // Prevent flash
if (showIntro) return <CinematicIntro onComplete={handleIntroComplete} />;
```

- [x] **Step 2: Add Replay Button to main UI**

```tsx
// Inside Home component main return
<button onClick={() => setShowIntro(true)}>
  <Info size={18} />
</button>
```

- [x] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: integrate cinematic intro with localStorage persistence"
```

---

### Task 4: Final Polishing & Verification

- [x] **Step 1: Verify on first visit** (Clear localStorage and refresh)
- [x] **Step 2: Verify skip-on-click works**
- [x] **Step 3: Verify replay button works**
- [x] **Step 4: Commit any final CSS tweaks**
