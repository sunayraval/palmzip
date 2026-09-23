# Archived Development Editor & API Routes

This directory contains the development editing suite and internal JSON save endpoints that were used during development to prototype and update portfolio content and story milestones.

## Archived Contents
- **`editor/page.tsx`**: Interactive split-screen/full-screen visual editor (`/editor`) with preview toggles (desktop, tablet, mobile) and forms for editing `content.json` and `story.json`.
- **`api/content/route.ts`**: Endpoint for reading and saving `data/content.json` to the local filesystem.
- **`api/story/route.ts`**: Endpoint for reading and saving `data/story.json` to the local filesystem.

## Why This Was Archived
To prevent visitors or unauthorized users from accessing the editor or calling filesystem mutation APIs on the live production site.

## How to Restore (If Needed in Local Development)
1. Copy `archive/editor` back into `app/editor`.
2. Copy `archive/api` back into `app/api`.
3. Re-add the Dev Edit floating trigger button to `app/page.tsx` and `app/story/page.tsx`.
