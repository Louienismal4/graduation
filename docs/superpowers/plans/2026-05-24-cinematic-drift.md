# Cinematic Drift & Slower Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Slow down the per-word reveal animation to 1.8s and add an independent, randomized floating/tilting "drift" effect to each word.

**Architecture:**
- Update `CinematicIntro.module.css` with slower `wordBlurIn` and a new `drift` animation.
- Modify `CinematicIntro.tsx` to wrap each word in a nested `.drifter` span.
- Inject randomized `animation-duration` and `animation-delay` (negative) into the `.drifter` spans to ensure unique movement rhythms.
- Update the dynamic auto-advance timer to wait for the 1.8s animation duration.

**Tech Stack:** React, TypeScript, Next.js (CSS Modules)

---

### Task 1: Update CSS Animations

**Files:**
- Modify: `src/components/CinematicIntro.module.css`

- [ ] **Step 1: Update wordBlurIn and add drift keyframes**

```css
@keyframes wordBlurIn {
  0% {
    opacity: 0;
    filter: blur(12px);
    transform: translateY(8px) scale(0.95);
  }
  100% {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0) scale(1);
  }
}

@keyframes drift {
  0%   { transform: translateY(0px) rotate(0deg); }
  25%  { transform: translateY(-4px) rotate(-1.5deg); }
  75%  { transform: translateY(4px) rotate(1.5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}

.word {
  display: inline-block;
  opacity: 0;
  animation: wordBlurIn 1.8s ease-out forwards;
  margin-right: 0.25em;
}

.drifter {
  display: inline-block;
  animation: drift 5s ease-in-out infinite;
}

.newLine {
  display: block;
  height: 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CinematicIntro.module.css
git commit -m "feat: update CSS for slower reveal and organic drift"
```

---

### Task 2: Refactor Rendering and Randomize Drift

**Files:**
- Modify: `src/components/CinematicIntro.tsx`

- [ ] **Step 1: Update renderContent to use nested drifter spans with randomized styles**

```typescript
// ... inside renderContent ...
if (currentStep < FINAL_TITLE_STEP) {
  const words = calculateWordDelays(steps[currentStep]);
  return (
    <div key={currentStep} style={textStyle}>
      {words.map((word, i) => {
        // Randomize the "soul" of the word
        // Using a seed-like approach or just Math.random since it's a render cycle
        // But to avoid jitter on re-renders, we'll use the word index/content as a simple seed
        const randomDuration = 4 + (i % 3); // 4s, 5s, or 6s
        const randomDelay = -(i % 5); // 0s to -4s offset

        return (
          <React.Fragment key={i}>
            {word.isNewLine && <div className={styles.newLine} />}
            <span
              className={styles.word}
              style={{ animationDelay: `${word.delay}s` }}
            >
              <span 
                className={styles.drifter}
                style={{ 
                  animationDuration: `${randomDuration}s`,
                  animationDelay: `${randomDelay}s`
                }}
              >
                {word.text}
              </span>
            </span>
            {" "}
          </React.Fragment>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CinematicIntro.tsx
git commit -m "feat: implement nested drift spans and randomized word rhythms"
```

---

### Task 3: Update Auto-Advance Timing

**Files:**
- Modify: `src/components/CinematicIntro.tsx`

- [ ] **Step 1: Update the useEffect timer calculation**

```typescript
// ... inside useEffect ...
if (currentStep < FINAL_TITLE_STEP) {
  const words = calculateWordDelays(steps[currentStep]);
  const lastWordDelay = words[words.length - 1]?.delay || 0;
  // Animation duration is now 1.8s
  duration = (lastWordDelay + 1.8 + 2.5) * 1000;
}
```

- [ ] **Step 2: Commit and verify**

```bash
git add src/components/CinematicIntro.tsx
git commit -m "feat: update auto-advance timer for slower 1.8s transition"
```
