# Spec: Cinematic Drift & Slower Per-Word Reveal

## Overview
This specification updates the `CinematicIntro` component to enhance its "dream-like" aesthetic. The per-word reveal will be slowed significantly, and each word will gain a continuous "organic drift" (floating and tilting) to feel "alive" and more cinematic.

## Goals
- Slow down the entrance animation of individual words for higher emotional impact.
- Add a continuous, subtle floating and tilting movement to each word.
- Randomize the floating rhythms so words move independently ("Organic Sway").

## Technical Design

### 1. Style Modifications (`CinematicIntro.module.css`)

#### Keyframe Updates
- **`wordBlurIn`**: Slowed to 1.8s.
- **`drift`**: A new looping animation that combines vertical movement (sway) and rotation (tilt).

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
```

### 2. Component Modification (`CinematicIntro.tsx`)

#### Rendering Structure
To support independent "entrance" and "looping" animations without CSS conflicts, each word will be wrapped in an additional container:
- Parent `<span>` (`.word`): Handles the entrance (fade/blur/delay).
- Child `<span>` (`.drifter`): Handles the continuous floating/tilting.

#### Randomized "Soul" Logic
Each word will receive inline styles for the `drifter` animation to ensure they don't move in sync:
- `animationDuration`: Randomized between 4s and 7s.
- `animationDelay`: Randomized (negative delay) so words start at different points in the drift loop.

#### Auto-Advance Timer
The `useEffect` timer will be updated to reflect the new 1.8s entrance duration:
- `duration = (lastWordDelay + 1.8 + 2.5) * 1000;`

## Success Criteria
- Words emerge very slowly (1.8s) from a blur.
- Words exhibit a clear, persistent floating and tilting motion once they appear.
- Words move independently of each other (not in sync).
- Auto-advance timing remains comfortable for reading.
