# Graduation Time Machine - Cinematic Intro Design Specification

**Date:** 2026-05-24
**Status:** Approved

## 1. Overview
A high-impact, emotional opening sequence for the Graduation Time Machine web application. It uses a minimal aesthetic (white background, navy serif typography) to tell the story of the graduates' journey before transitioning into the main application.

## 2. Visual Design
- **Background:** `#FFFFFF` (Pure White)
- **Primary Font:** `Playfair Display` (Google Fonts)
- **Text Color:** `#1E2D93` (Deep Navy Blue)
- **Alignment:** Center-middle on all axes.
- **Mobile-First:** Responsive text sizing (larger on desktop, readable on mobile).

## 3. The Script (Sequence)
The intro will cycle through these screens:
1. "Four years ago... we walked in as strangers."
2. "With dreams too big for our fears... and fears too heavy for our hearts."
3. "We survived deadlines, breakdowns, sleepless nights, and moments nobody else saw."
4. "But somehow... we kept going."
5. "Every sacrifice. Every late-night review. Every silent prayer. Led us here."
6. "These aren’t just pictures. They are proof that we lived this chapter."
7. "Tonight, we celebrate the present... ...while sending memories into the future."
8. **Main Title:** "Graduation Time Machine" -> Subtext: "Lock your memories. Write your story. Meet yourself again someday."
9. **Final CTA:** "Because years from now... you’ll want to remember who you were tonight." -> Button: "[ Enter the Time Machine ]"

## 4. Technical Implementation

### 4.1 Intro Controller
- **Component:** `CinematicIntro.tsx`
- **State Management:**
  - `currentStep`: Integer (0-8).
  - `isVisible`: Boolean (controls transition to main app).
- **Auto-Advance:** Each step lasts 3500ms by default.
- **Manual Override:** Tapping/Clicking the screen advances to the next step.

### 4.2 Transitions
- **CSS Animations:** Smooth fade-in/fade-out using `opacity` and `transform: translateY` for a gentle upward drift.
- **Transition Duration:** 800ms.

### 4.3 Persistence (Option C)
- **localStorage:** Key `grad_intro_seen` will be set to `true` once the intro is completed or skipped.
- **Logic:** The `Home` component in `page.tsx` will check `localStorage` on mount.
- **Replay:** A "Replay Story" button (Info icon) will be added to the main UI to reset `grad_intro_seen` and trigger the component.

## 5. Components to Create/Update
- `src/components/CinematicIntro.tsx`: New component for the sequence.
- `src/app/page.tsx`: Updated to handle the conditional rendering of the intro.
- `src/app/layout.tsx`: Updated to include `Playfair Display` font.

## 6. Success Criteria
- [ ] Intro plays on first visit.
- [ ] Animation is smooth (no stuttering).
- [ ] Font matches the design requirement perfectly.
- [ ] Users can skip the intro or enter the app immediately from the final screen.
- [ ] Replay button correctly resets the flow.
