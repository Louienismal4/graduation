# Graduation Time Machine - Design Specification

**Date:** 2026-05-23
**Status:** Draft (Pending Final Review)

## 1. Overview
A mobile-first web application designed for graduation events. It allows graduates to capture memories, immediately share them via "Spotify-style" story cards, and lock specific moments into a digital time capsule that requires a journal entry. A curated "Graduation Wall" will be launched days after the event.

## 2. Goals & Success Criteria
- **Mobile-First Experience:** Accessible via QR code at the event.
- **Viral Sharing:** High-quality "Story Cards" for Instagram/Social media.
- **Intentionality:** 5-image limit per user.
- **Moderation:** Full admin control over the public Graduation Wall.
- **Nostalgia:** A "Time Machine" mechanic that unlocks journaled memories in the future.

## 3. Architecture & Tech Stack
- **Framework:** Next.js (React) for optimized performance and SEO.
- **Styling:** Vanilla CSS (Mobile-First, gradients, glassmorphism).
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage).
- **Image Processing:** HTML Canvas API for dynamic Story Card generation.
- **Hosting:** Vercel (recommended for Next.js/Supabase integration).

## 4. Data Model

### `moments` table
| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Links to Auth User |
| `image_url` | String | URL of the photo in Supabase Storage |
| `journal_entry` | Text | The "letter to self" (Required for Time Capsule) |
| `is_approved` | Boolean | `false` by default; toggled by Admin for the Wall |
| `is_capsule` | Boolean | `true` if it includes a journal entry and should be locked |
| `unlock_date` | Timestamp | Date when the capsule becomes readable |
| `created_at` | Timestamp | Capture time |

### Constraints
- **Limit:** Max 5 rows in `moments` per `user_id`. (Enforced via Database Trigger or Supabase RLS).

## 5. Key Features & Workflows

### 5.1 Capture & Share Flow
1. **Upload:** User captures/uploads a photo.
2. **Generation:** App uses Canvas to merge photo + themed background + "Grad 2026" text.
3. **Immediate Actions:**
   - **Download:** Save the generated PNG to the device.
   - **Direct Share:** Link to a private viewing page (`/moment/[id]`).
   - **Social Share:** Open native share sheet with the PNG.
4. **Time Capsule Prompt:** *"Want to lock this in the Time Machine? Write a short journal about your journey."*
5. **Completion:** On save, `is_capsule` is set to `true` if a journal entry exists.

### 5.2 The Graduation Wall
- **Launch State:** Initially hidden or showing a "Coming Soon" countdown.
- **Post-Graduation:** Admin flips a switch; the homepage becomes a scrollable masonry gallery of approved moments (`is_approved = true`).

### 5.3 Admin Dashboard
- **Route:** `/admin-gate` (Password protected).
- **Functionality:** 
  - View a feed of all uploads.
  - Approve/Reject buttons for the Wall.
  - View user counts and storage usage.

## 6. UI/UX Design
- **Theme:** "Premium Night" (Dark mode by default, deep purples/blues, vibrant gradients).
- **Story Card:** 9:16 aspect ratio (1080x1920) for perfect Instagram Story fit.
- **Typography:** Bold, modern sans-serif.

## 7. Future Unlock (The Time Machine)
- One year (or custom date) after graduation, users receive an automated email.
- **Email Delivery:** Triggered via Supabase Edge Functions using a provider like Resend or Postmark.
- Clicking the link takes them to their "Time Machine" view where their journal entries and original photos are revealed.
