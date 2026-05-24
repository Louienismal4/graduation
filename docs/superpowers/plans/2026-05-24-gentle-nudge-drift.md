# Gentle Nudge Drift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the intensity of the "drift" animation in `CinematicIntro` to create a more subtle, elegant "gentle nudge" effect.

**Architecture:**
- Update the `@keyframes drift` in `CinematicIntro.module.css` to halve the vertical translation (from ±4px to ±2px) and the rotation (from ±1.5deg to ±0.5deg).

**Tech Stack:** React, Next.js (CSS Modules)

---

### Task 1: Update Drift Keyframes

**Files:**
- Modify: `src/components/CinematicIntro.module.css`

- [ ] **Step 1: Reduce translation and rotation in drift keyframes**

```css
@keyframes drift {
  0%   { transform: translateY(0px) rotate(0deg); }
  25%  { transform: translateY(-2px) rotate(-0.5deg); }
  75%  { transform: translateY(2px) rotate(0.5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CinematicIntro.module.css
git commit -m "style: reduce drift animation intensity to a gentle nudge"
```
