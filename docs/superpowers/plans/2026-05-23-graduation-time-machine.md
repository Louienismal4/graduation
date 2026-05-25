# Graduation Time Machine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first photobooth web app with curated sharing and a time-locked journal.

**Architecture:** Next.js frontend with Supabase for storage/database. Image processing via Canvas for story-ready sharing.

---

### Task 1: Project Setup & Database Schema
**Files:**
- Create: `supabase/migrations/20260523000000_init.sql`
- Create: `src/lib/supabase.ts`
- Modify: `package.json`

- [x] **Step 1: Define the Database Schema**
```sql
-- Create moments table
CREATE TABLE moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  image_url TEXT NOT NULL,
  journal_entry TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  is_capsule BOOLEAN DEFAULT FALSE,
  unlock_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;

-- 5-image limit trigger
CREATE OR REPLACE FUNCTION check_moment_limit() 
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM moments WHERE user_id = NEW.user_id) >= 5 THEN
    RAISE EXCEPTION 'Moment limit reached (Max 5)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER limit_moments_trigger
BEFORE INSERT ON moments
FOR EACH ROW EXECUTE FUNCTION check_moment_limit();
```

- [x] **Step 2: Install Dependencies**
Run: `npm install @supabase/auth-helpers-nextjs @supabase/supabase-js lucide-react`

- [x] **Step 3: Initialize Supabase Client**
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
export const supabase = createClientComponentClient();
```

- [x] **Step 4: Commit**
```bash
git add .
git commit -m "chore: initial setup and database schema"
```

---

### Task 2: Capture Flow & Image Upload
**Files:**
- Create: `src/components/CaptureFlow.tsx`
- Create: `src/app/page.tsx`

- [x] **Step 1: Implement Image Selection & Preview**
- [x] **Step 2: Upload to Supabase Storage**
- [x] **Step 3: Save metadata to `moments` table**
- [x] **Step 4: Commit**
```bash
git add .
git commit -m "feat: add image capture and upload flow"
```

---

### Task 3: "Spotify-Style" Story Card Generation
**Files:**
- Create: `src/components/StoryCard.tsx`
- Create: `src/lib/imageUtils.ts`

- [x] **Step 1: Write Canvas rendering logic**
```typescript
export const generateStoryCard = async (imageUrl: string, text: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  // 1. Draw Gradient Background
  // 2. Draw Image (centered)
  // 3. Draw "Graduation 2026" text overlay
  return canvas.toDataURL('image/png');
};
```
- [x] **Step 2: Add Download & Native Share buttons**
- [x] **Step 3: Commit**
```bash
git add .
git commit -m "feat: add story card generation and sharing"
```

---

### Task 4: Admin Moderation Dashboard
**Files:**
- Create: `src/app/admin-gate/page.tsx`

- [x] **Step 1: Build feed of `is_approved = false` moments**
- [x] **Step 2: Add Toggle Approval/Reject buttons**
- [x] **Step 3: Commit**
```bash
git add .
git commit -m "feat: add admin moderation dashboard"
```

---

### Task 5: The Graduation Wall (Post-Event View)
**Files:**
- Modify: `src/app/page.tsx`

- [x] **Step 1: Create conditional homepage view**
- [x] **Step 2: Build Masonry gallery for approved moments**
- [x] **Step 3: Commit**
```bash
git add .
git commit -m "feat: add graduation wall gallery"
```
