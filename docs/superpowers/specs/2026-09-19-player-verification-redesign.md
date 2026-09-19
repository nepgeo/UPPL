# Player Verification Page Redesign

## Overview
Complete UI overhaul of the admin player verification page. Modern, mobile-first design with numbered cards, tabbed detail dialog, and clean visual hierarchy.

## File
- `frontend/src/pages/admin/playerVerification.tsx` (full rewrite)

## Design

### 1. Page Header
- Full-width gradient banner: `from-amber-500 via-orange-500 to-red-500`
- Title: "PLAYER VERIFICATIONS" — uppercase, bold, centered
- Subtitle: "Review and approve player registration requests" — white/70, centered
- Large pending count badge centered below subtitle

### 2. Stat Cards (hidden on mobile)
- `hidden sm:grid grid-cols-3 gap-3`
- Orange: Pending count
- Green: Selected count
- Blue: Filtered count
- Each card: gradient bg, icon + number + label, centered text

### 3. Filter Bar
- Single row on desktop: Search input (flex-1) + Position Select dropdown + Refresh button
- Mobile: Search full-width, dropdown + button in a row below
- All rounded-xl, consistent with rest of app

### 4. Bulk Action Bar
- Shows when players selected
- Left: count badge + "players selected"
- Right: Approve All (green) + Reject All (red) + Clear buttons
- Gradient background `from-blue-50 to-indigo-50`

### 5. Player Cards (Numbered)
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Each card row: flex with number badge on LEFT (outside card), card on right
- Number badge: `w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm font-bold flex items-center justify-center shrink-0 self-center`
- Card design:
  - White bg, rounded-2xl, border-gray-100, hover:shadow-lg
  - Left border stripe: `border-l-4 border-l-amber-400`
  - Content: Profile photo (w-12 h-12 rounded-xl) + name + position with icon
  - Info rows: email, phone, submitted date (each with icon)
  - Action buttons: Accept (green) + Reject (red) at bottom

### 6. Detail Dialog (Tabbed)
**Desktop**: Centered `max-w-2xl`, max-height `85vh`, scrollable
**Mobile**: Full-screen overlay

#### Hero Header
- Gradient bg: `from-indigo-600 via-purple-600 to-pink-500`
- Large profile photo (w-20 h-20 rounded-2xl)
- Name (text-2xl font-bold)
- Position badge + "Pending Review" status badge

#### Tabs (3)
- Profile | Documents | Actions
- Underline style, uppercase labels
- Scrollable horizontally on mobile if needed

#### Profile Tab
- Info grid: `grid-cols-2 gap-3` — Email, Phone, Submitted, Role (each in a card with icon)
- Playing Style: Batting + Bowling in gradient cards
- Bio: gray bg card with text

#### Documents Tab
- Grid: `grid-cols-2 sm:grid-cols-3 gap-2`
- Each doc: thumbnail with hover zoom, click opens lightbox
- Empty state: dashed border with "No documents uploaded"

#### Actions Tab
- Two full-width stacked buttons:
  - "APPROVE PLAYER" — green, `py-3`, with check icon
  - "REJECT PLAYER" — red, `py-3`, with x icon

### 7. Approve Confirmation Dialog
- Centered `max-w-md`
- Green gradient header with Send icon
- "Confirm Approval" title
- Player name + email preview (like current)
- Send Approval button (green) + Cancel

### 8. Reject Dialog
- Centered `max-w-md`
- Red gradient header with AlertTriangle icon
- "Reject Player" title
- Player name + rejection reason textarea
- Reject button (red) + Cancel

### 9. Document Lightbox
- Same as current — full-screen black overlay
- Left/right navigation arrows
- Document counter "Document X of Y"

## Responsive Behavior
| Element | Mobile | sm | md | lg |
|---------|--------|----|----|-----|
| Stat cards | hidden | grid-3 | grid-3 | grid-3 |
| Player grid | 1-col | 1-col | 2-col | 3-col |
| Card number | visible left | visible left | visible left | visible left |
| Detail dialog | full-screen | full-screen | centered | centered |
| Filter bar | stacked | stacked | inline | inline |

## Existing Backend (No Changes)
- `verifyPlayer`: Sends approval email with player code
- `rejectPlayer`: Sends rejection email with optional reason
- Both endpoints already functional

## Implementation Steps
1. Rewrite `playerVerification.tsx` with new layout
2. Keep all existing state/logic (fetch, approve, reject, bulk, pagination)
3. Restructure JSX for new card layout with external numbers
4. Add tabbed dialog with Profile/Documents/Actions tabs
5. Responsive classes throughout (sm:, md:, lg:)
6. Test mobile layout, card numbering, dialog tabs
7. Run lint + build
