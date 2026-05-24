# Spec: Expressive Per-Word Blur-In Transition

## Overview
This specification details the implementation of a per-word "blur-in" animation for the `CinematicIntro` component. The transition aims to create a cinematic, memory-like experience where words emerge individually with a rhythm that respects punctuation and line breaks ("Expressive" timing).

## Goals
- Enhance the emotional impact of the introductory story.
- Implement a per-word animation using CSS transitions/animations.
- Create a natural reading rhythm that pauses at punctuation and new lines.

## Technical Design

### 1. Component Modification (`CinematicIntro.tsx`)
The component will be updated to handle the splitting and rendering of words for each story step.

#### Text Processing Logic
- Each step in the `steps` array will be processed into an array of "word objects".
- A word object will contain:
  - `text`: The string content of the word.
  - `delay`: The calculated CSS animation delay (in seconds).
  - `isNewLine`: A boolean indicating if a line break should precede this word.

#### Delay Calculation Algorithm
A utility function will iterate through the words and calculate cumulative delays:
- `BASE_DELAY`: 0.3s (default time between words).
- `PUNCTUATION_PAUSE`: +0.4s (extra time for `,`, `.`, `!`, `?`, `...`).
- `LINE_BREAK_PAUSE`: +0.6s (extra time for `\n`).

### 2. Styles and Animations

#### CSS Keyframes (`CinematicIntro.module.css` or `globals.css`)
```css
@keyframes wordBlurIn {
  0% {
    opacity: 0;
    filter: blur(12px);
    transform: translateY(4px) scale(0.96);
  }
  100% {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0) scale(1);
  }
}

.word {
  display: inline-block;
  opacity: 0;
  animation: wordBlurIn 0.8s ease-out forwards;
}
```

### 3. Transition Logic
- The component will still auto-advance based on a timer, but the timer should account for the total duration of the word animations + a final dwell time.
- Total step duration = `Total word delays` + `Animation duration (0.8s)` + `Read time (e.g., 2.5s)`.

## Success Criteria
- Words appear one by one with a soft blur-to-focus effect.
- Punctuation causes a noticeable but natural pause in the reveal.
- Line breaks are respected and cause a longer pause.
- The "Skip" functionality remains intact.
- The final title and CTA steps maintain their existing animations or transition to the new style if appropriate.
