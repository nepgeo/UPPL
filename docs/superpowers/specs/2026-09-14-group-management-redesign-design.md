# Group Management Redesign — Design Spec

## Summary

Redesign the admin group schedule page to support manual group CRUD operations. Only super-admin can create/edit/delete groups. Groups are created manually by selecting approved teams from a dropdown. Teams already assigned to a group cannot be selected in another group. The auto-scheduler for group generation is removed.

## Requirements

1. **Super-admin only CRUD** — only `super-admin` role can create, edit, delete groups; admin/others see read-only view
2. **Manual group creation** — admin picks group name (default next letter, editable) and selects teams from dropdown
3. **Approved teams only** — only teams with `status: "approved"` appear in selection dropdown
4. **No duplicate assignment** — a team assigned to one group cannot be selected in another group for the same season
5. **Group names** — defaults to A, B, C... but admin can rename
6. **Warn before match regeneration** — when modifying groups or clicking "Regenerate Matches", show warning if matches exist
7. **Remove auto-scheduler** — remove the `startAutoGroupScheduler` call from `server.js`
8. **Modern card grid UI** — responsive grid of group cards, consistent with existing indigo/purple admin theme

## Backend Changes

### New Endpoints (add to `groupRoutes.js`)

| Method | Endpoint | Auth | Handler | Purpose |
|--------|----------|------|---------|---------|
| `POST` | `/api/groups/:seasonId/groups` | super-admin | `createGroup` | Create a new group |
| `PUT` | `/api/groups/:seasonId/groups/:groupName` | super-admin | `updateGroup` | Rename group, add/remove teams |
| `DELETE` | `/api/groups/:seasonId/groups/:groupName` | super-admin | `deleteGroup` | Delete a group |
| `GET` | `/api/teams/approved?seasonId=X` | admin+ | `getApprovedTeams` | Fetch approved teams for selection |

### Reused Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/groups/schedule` | Fetch existing groups |
| `POST` | `/api/groups/generate/league/:seasonId` | Generate league matches from groups |

### Removed

- Remove `startAutoGroupScheduler(10)` call from `server.js` lines 42-50
- Keep `scheduleGroupGeneration.js` and `groupLogic.js` files (don't delete, just stop calling)

### Backend Logic

#### `createGroup(seasonId, groupName, teamIds[])`
1. Validate season exists
2. Validate all teamIds are `status: "approved"` and belong to this season
3. Check none of the teamIds are already assigned to another group in this season
4. If groupName not provided, auto-assign next available letter (A, B, C...)
5. Create group in `GroupSchedule` document
6. Also update `Season.groups[]`
7. Return updated schedule

#### `updateGroup(seasonId, oldGroupName, { newName?, addTeam?, removeTeam? })`
1. Validate season and group exist
2. If `newName`: check new name doesn't conflict, rename group
3. If `addTeam`: validate team is approved, not in another group, add to group
4. If `removeTeam`: remove team from group
5. Update both `GroupSchedule` and `Season.groups[]`
6. Return updated schedule

#### `deleteGroup(seasonId, groupName, deleteMatches=false)`
1. Validate season and group exist
2. Check if league matches exist for this group
3. If matches exist and `deleteMatches` is false, return `hasMatches: true` with match count
4. If `deleteMatches` is true, delete matches for this group
5. Remove group from `GroupSchedule` and `Season.groups[]`
6. Return success

#### `getApprovedTeams(seasonId)`
1. Fetch teams where `seasonNumber: seasonId` and `status: "approved"`
2. Return all approved teams with `_id`, `teamName`, `teamCode`, `teamLogo`
3. Also return `assignedGroup` field (group name if assigned, null if unassigned) so frontend can filter/disable already-assigned teams in dropdowns

### Models Modified

**GroupSchedule** (`groupScheduleModel.js`):
- No schema changes needed — existing structure supports the use case

**Season** (`seasonModel.js`):
- No schema changes needed — `groups[]` array already exists

## Frontend Changes

### New File: `frontend/src/pages/admin/GroupManagement.tsx`

**Component:** `GroupManagement`

**Props:** none (receives season context via state)

**State:**
```typescript
 seasons: Array<{_id, seasonNumber, isCurrent}>
 selectedSeasonId: string
 schedule: Schedule | null
 approvedTeams: Team[]  // unassigned approved teams for current season
 loading: boolean
 createDialogOpen: boolean
 editDialogOpen: boolean
 deleteDialogOpen: boolean
 matchWarningOpen: boolean
 nextGroupName: string  // auto-suggested next letter
```

**Page Layout:**
```
┌─────────────────────────────────────────────────────┐
│  🏆 UPPL Season [Dropdown v]  Year | Deadline | Status │
│                                                     │
│  [+ Create Group]  [Regenerate Matches]             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────┐                │
│  │  Group A      │  │  Group B      │                │
│  │  ✏️ 🗑️       │  │  ✏️ 🗑️       │                │
│  │              │  │              │                │
│  │ Team Name    │  │ Team Name    │                │
│  │ Team Name    │  │ Team Name    │                │
│  │ Team Name    │  │ Team Name    │                │
│  │              │  │              │                │
│  │ [+ Add Team] │  │ [+ Add Team] │                │
│  └──────────────┘  └──────────────┘                │
│                                                     │
│  ┌──────────────┐                                   │
│  │  Group C      │                                   │
│  │  ...          │                                   │
│  └──────────────┘                                   │
└─────────────────────────────────────────────────────┘
```

**Card Details:**
- Each card: group name header, team count badge, edit/delete icon buttons (super-admin only)
- Teams listed: name, team code, `-` remove button
- "+ Add Team" at bottom: dropdown of unassigned approved teams
- Empty groups: "No teams yet" placeholder text

**Role Gating:**
- `super-admin`: full CRUD buttons visible
- `admin` / other: read-only view (no create/edit/delete buttons)

### Dialogs

#### 1. Create Group Dialog
- Group name input (pre-filled with next available letter, editable)
- Multi-select dropdown of unassigned approved teams
- "Create" and "Cancel" buttons
- On create: `POST /api/groups/:seasonId/groups`

#### 2. Edit Group Dialog
- Rename group text input
- Team list with remove buttons
- Add team dropdown (unassigned approved teams)
- "Save" and "Cancel" buttons
- On save: `PUT /api/groups/:seasonId/groups/:groupName`

#### 3. Delete Group Confirmation
- "Are you sure you want to delete Group X?"
- If matches exist: "X matches exist for this group. Delete matches too?" with checkbox
- "Delete" and "Cancel" buttons
- On delete: `DELETE /api/groups/:seasonId/groups/:groupName?deleteMatches=true/false`

#### 4. Regenerate Matches Warning
- "This will delete all existing league matches and recreate them from current groups. Continue?"
- "Confirm" and "Cancel" buttons
- On confirm: `POST /api/groups/generate/league/:seasonId`

### Integration with ScheduleMatch.tsx

- Import `GroupManagement` in `ScheduleMatch.tsx`
- When `subTab === 'groups'`, render `<GroupManagement />` instead of the current inline groups code
- Keep the existing match schedule tab unchanged

### Styling

- Use existing shadcn/ui components: `Button`, `Card`, `Dialog`, `Select`, `Badge`, `Input`
- Match existing admin theme: indigo/purple accents, light background
- Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Card hover effects for interactive elements

## Data Flow

```
Page Load
  → GET /api/seasons
  → GET /api/teams/approved?seasonId=X
  → GET /api/groups/schedule?seasonId=X

Create Group
  → POST /api/groups/:seasonId/groups {groupName, teamIds[]}
  → Refresh page data

Edit Group (rename)
  → PUT /api/groups/:seasonId/groups/:oldName {newName}
  → Refresh page data

Add Team to Group
  → PUT /api/groups/:seasonId/groups/:groupName {addTeam: teamId}
  → Refresh page data

Remove Team from Group
  → PUT /api/groups/:seasonId/groups/:groupName {removeTeam: teamId}
  → Refresh page data

Delete Group
  → DELETE /api/groups/:seasonId/groups/:groupName?deleteMatches=true/false
  → Refresh page data

Regenerate Matches
  → Check if matches exist → show warning dialog
  → POST /api/groups/generate/league/:seasonId
  → Refresh matches
```

## Files to Modify

| File | Change |
|------|--------|
| `backend/controllers/groupController.js` | Add `createGroup`, `updateGroup`, `deleteGroup`, `getApprovedTeams` handlers |
| `backend/routes/groupRoutes.js` | Add new routes |
| `backend/server.js` | Remove auto-scheduler call (lines 42-50) |
| `frontend/src/pages/admin/GroupManagement.tsx` | New component (main implementation) |
| `frontend/src/pages/admin/ScheduleMatch.tsx` | Import and render `GroupManagement` for groups sub-tab |

## Files NOT Modified

- `backend/models/groupScheduleModel.js` — no schema changes needed
- `backend/models/seasonModel.js` — no schema changes needed
- `backend/utils/scheduleGroupGeneration.js` — keep file, just stop calling it
- `backend/utils/groupLogic.js` — keep file, just stop calling it

## Edge Cases

1. **No approved teams** — show "No approved teams available" message, disable create button
2. **All teams assigned** — show "All teams are assigned to groups" message
3. **Delete last group** — warn that this will clear all group assignments
4. **Groups with matches** — require explicit confirmation before deleting groups that have associated matches
5. **Season with no groups** — show empty state with "Create your first group" CTA
