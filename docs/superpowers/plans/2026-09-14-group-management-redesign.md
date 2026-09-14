# Group Management Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the admin group schedule page to support manual group CRUD with super-admin only access, modern card grid UI, and team assignment validation.

**Architecture:** Hybrid approach — new `GroupManagement.tsx` frontend component with minimal backend additions (4 new endpoints) to existing `groupController.js`. Auto-scheduler removed from server startup.

**Tech Stack:** Node.js/Express, MongoDB/Mongoose, React/TypeScript, shadcn/ui, Tailwind CSS

## Global Constraints

- Only `super-admin` role can create/edit/delete groups
- Only teams with `status: "approved"` appear in selection dropdowns
- A team assigned to one group cannot be in another group for the same season
- Group names default to A, B, C... but are editable
- Auto-scheduler removed from `server.js`
- Existing match schedule tab unchanged

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `backend/controllers/groupController.js` | Modify | Add `createGroup`, `updateGroup`, `deleteGroup`, `getApprovedTeams` handlers |
| `backend/routes/groupRoutes.js` | Modify | Add 4 new routes |
| `backend/server.js` | Modify | Remove auto-scheduler call (lines 42-50) |
| `frontend/src/pages/admin/GroupManagement.tsx` | Create | New component for group management UI |
| `frontend/src/pages/admin/ScheduleMatch.tsx` | Modify | Import and render `GroupManagement` for groups sub-tab |

---

### Task 1: Remove Auto-Scheduler from Server

**Files:**
- Modify: `backend/server.js:42-50`

**Interfaces:**
- Consumes: none
- Produces: auto-scheduler no longer starts on server boot

- [ ] **Step 1: Remove the auto-scheduler import and call**

Open `backend/server.js`. Remove lines 42-50:

```javascript
// REMOVE these lines:
const { startAutoGroupScheduler } = require('./utils/scheduleGroupGeneration');

// Start background schedulers
try {
  startAutoGroupScheduler(10); // runs every 10 minutes
} catch (err) {
  console.warn('Failed to start group scheduler:', err?.message || err);
}
```

Keep the `startNewsScheduler` block (lines 52-56) unchanged.

- [ ] **Step 2: Verify server starts without errors**

Run: `cd backend && node server.js`
Expected: Server starts, "Auto group scheduler started..." message is gone, MongoDB connects successfully.

- [ ] **Step 3: Commit**

```bash
git add backend/server.js
git commit -m "feat: remove auto group scheduler from server startup"
```

---

### Task 2: Add Backend CRUD Endpoints

**Files:**
- Modify: `backend/controllers/groupController.js` (add 4 handlers)
- Modify: `backend/routes/groupRoutes.js` (add 4 routes)

**Interfaces:**
- Consumes: `GroupSchedule` model, `Team` model, `Season` model, `Match` model
- Produces: `createGroup`, `updateGroup`, `deleteGroup`, `getApprovedTeams` handlers; 4 new routes

- [ ] **Step 1: Add `getApprovedTeams` handler to groupController.js**

Append to `backend/controllers/groupController.js` before the `module.exports`:

```javascript
// ================== APPROVED TEAMS ==================

// GET /api/teams/approved?seasonId=X
const getApprovedTeams = async (req, res) => {
  try {
    const { seasonId } = req.query;

    if (!seasonId || !mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({ success: false, message: "Invalid season ID" });
    }

    const season = await Season.findById(seasonId);
    if (!season) {
      return res.status(404).json({ success: false, message: "Season not found" });
    }

    // Get all approved teams for this season
    const teams = await Team.find({ seasonNumber: seasonId, status: /^approved$/i })
      .select("_id teamName teamCode teamLogo")
      .lean();

    // Get the current group schedule to determine which teams are assigned
    const schedule = await GroupSchedule.findOne({ seasonNumber: seasonId });
    const assignedTeamIds = new Set();
    const teamGroupMap = {};

    if (schedule && schedule.groups) {
      for (const group of schedule.groups) {
        for (const t of group.teams) {
          const teamId = t.team?.toString() || t.team;
          assignedTeamIds.add(teamId);
          teamGroupMap[teamId] = group.groupName;
        }
      }
    }

    // Add assignedGroup field to each team
    const teamsWithAssignment = teams.map((t) => ({
      ...t,
      assignedGroup: teamGroupMap[t._id.toString()] || null,
    }));

    return res.json({
      success: true,
      teams: teamsWithAssignment,
    });
  } catch (err) {
    console.error("❌ Failed to fetch approved teams:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
```

- [ ] **Step 2: Add `createGroup` handler to groupController.js**

Append after `getApprovedTeams`:

```javascript
// ================== GROUP CRUD ==================

// POST /api/groups/:seasonId/groups
const createGroup = async (req, res) => {
  try {
    const { seasonId } = req.params;
    const { groupName, teamIds } = req.body;

    if (!seasonId || !mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({ success: false, message: "Invalid season ID" });
    }

    const season = await Season.findById(seasonId);
    if (!season) {
      return res.status(404).json({ success: false, message: "Season not found" });
    }

    // Find or create GroupSchedule
    let schedule = await GroupSchedule.findOne({ seasonNumber: seasonId });
    if (!schedule) {
      schedule = new GroupSchedule({ seasonNumber: seasonId, groups: [] });
    }

    // Determine group name (auto-assign next letter if not provided)
    const existingNames = schedule.groups.map((g) => g.groupName);
    let finalGroupName = groupName;
    if (!finalGroupName) {
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      for (let i = 0; i < alphabet.length; i++) {
        if (!existingNames.includes(alphabet[i])) {
          finalGroupName = alphabet[i];
          break;
        }
      }
      if (!finalGroupName) {
        return res.status(400).json({ success: false, message: "Maximum groups (26) reached" });
      }
    } else {
      // Validate name doesn't already exist
      if (existingNames.includes(finalGroupName)) {
        return res.status(400).json({ success: false, message: `Group ${finalGroupName} already exists` });
      }
    }

    // Validate team IDs if provided
    let teamsData = [];
    if (teamIds && teamIds.length > 0) {
      // Check all teams are approved and belong to this season
      const teams = await Team.find({
        _id: { $in: teamIds },
        seasonNumber: seasonId,
        status: /^approved$/i,
      }).lean();

      if (teams.length !== teamIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more teams are not approved or do not belong to this season",
        });
      }

      // Check none are already assigned to another group
      const assignedTeamIds = new Set();
      for (const g of schedule.groups) {
        for (const t of g.teams) {
          assignedTeamIds.add(t.team?.toString() || t.team);
        }
      }

      const alreadyAssigned = teamIds.filter((id) => assignedTeamIds.has(id));
      if (alreadyAssigned.length > 0) {
        return res.status(400).json({
          success: false,
          message: "One or more teams are already assigned to another group",
        });
      }

      teamsData = teams.map((t) => ({
        team: t._id,
        teamName: t.teamName,
        teamCode: t.teamCode,
      }));
    }

    // Add the new group
    schedule.groups.push({ groupName: finalGroupName, teams: teamsData });
    await schedule.save();

    // Sync to Season.groups
    season.groups = schedule.groups.map((g) => ({
      groupName: g.groupName,
      teams: g.teams.map((t) => ({
        team: t.team,
        teamName: t.teamName,
        teamCode: t.teamCode,
      })),
    }));
    await season.save();

    return res.json({
      success: true,
      message: `Group ${finalGroupName} created successfully`,
      schedule,
    });
  } catch (err) {
    console.error("❌ Failed to create group:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
```

- [ ] **Step 3: Add `updateGroup` handler to groupController.js**

Append after `createGroup`:

```javascript
// PUT /api/groups/:seasonId/groups/:groupName
const updateGroup = async (req, res) => {
  try {
    const { seasonId, groupName } = req.params;
    const { newName, addTeam, removeTeam } = req.body;

    if (!seasonId || !mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({ success: false, message: "Invalid season ID" });
    }

    const season = await Season.findById(seasonId);
    if (!season) {
      return res.status(404).json({ success: false, message: "Season not found" });
    }

    const schedule = await GroupSchedule.findOne({ seasonNumber: seasonId });
    if (!schedule) {
      return res.status(404).json({ success: false, message: "No groups found for this season" });
    }

    const groupIndex = schedule.groups.findIndex((g) => g.groupName === groupName);
    if (groupIndex === -1) {
      return res.status(404).json({ success: false, message: `Group ${groupName} not found` });
    }

    const group = schedule.groups[groupIndex];

    // Rename group
    if (newName && newName !== groupName) {
      const existingNames = schedule.groups.map((g) => g.groupName);
      if (existingNames.includes(newName)) {
        return res.status(400).json({ success: false, message: `Group ${newName} already exists` });
      }
      schedule.groups[groupIndex].groupName = newName;
    }

    // Add team to group
    if (addTeam) {
      const team = await Team.findOne({
        _id: addTeam,
        seasonNumber: seasonId,
        status: /^approved$/i,
      }).lean();

      if (!team) {
        return res.status(400).json({ success: false, message: "Team not found or not approved" });
      }

      // Check team is not in another group
      for (const g of schedule.groups) {
        if (g.groupName === (newName || groupName)) continue;
        const found = g.teams.find((t) => (t.team?.toString() || t.team) === addTeam);
        if (found) {
          return res.status(400).json({
            success: false,
            message: "Team is already assigned to another group",
          });
        }
      }

      // Check team not already in this group
      const alreadyInGroup = group.teams.find(
        (t) => (t.team?.toString() || t.team) === addTeam
      );
      if (alreadyInGroup) {
        return res.status(400).json({ success: false, message: "Team is already in this group" });
      }

      schedule.groups[groupIndex].teams.push({
        team: team._id,
        teamName: team.teamName,
        teamCode: team.teamCode,
      });
    }

    // Remove team from group
    if (removeTeam) {
      const teamIdx = group.teams.findIndex(
        (t) => (t.team?.toString() || t.team) === removeTeam
      );
      if (teamIdx === -1) {
        return res.status(400).json({ success: false, message: "Team not found in this group" });
      }
      schedule.groups[groupIndex].teams.splice(teamIdx, 1);
    }

    await schedule.save();

    // Sync to Season.groups
    season.groups = schedule.groups.map((g) => ({
      groupName: g.groupName,
      teams: g.teams.map((t) => ({
        team: t.team,
        teamName: t.teamName,
        teamCode: t.teamCode,
      })),
    }));
    await season.save();

    return res.json({
      success: true,
      message: "Group updated successfully",
      schedule,
    });
  } catch (err) {
    console.error("❌ Failed to update group:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
```

- [ ] **Step 4: Add `deleteGroup` handler to groupController.js**

Append after `updateGroup`:

```javascript
// DELETE /api/groups/:seasonId/groups/:groupName
const deleteGroup = async (req, res) => {
  try {
    const { seasonId, groupName } = req.params;
    const { deleteMatches } = req.query;

    if (!seasonId || !mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({ success: false, message: "Invalid season ID" });
    }

    const season = await Season.findById(seasonId);
    if (!season) {
      return res.status(404).json({ success: false, message: "Season not found" });
    }

    const schedule = await GroupSchedule.findOne({ seasonNumber: seasonId });
    if (!schedule) {
      return res.status(404).json({ success: false, message: "No groups found for this season" });
    }

    const groupIndex = schedule.groups.findIndex((g) => g.groupName === groupName);
    if (groupIndex === -1) {
      return res.status(404).json({ success: false, message: `Group ${groupName} not found` });
    }

    // Check if matches exist for this group
    const matchCount = await Match.countDocuments({
      seasonNumber: seasonId,
      groupName: groupName,
      stage: "league",
    });

    if (matchCount > 0 && deleteMatches !== "true") {
      return res.json({
        success: false,
        hasMatches: true,
        matchCount,
        message: `${matchCount} matches exist for Group ${groupName}. Set deleteMatches=true to delete them.`,
      });
    }

    // Delete matches if requested
    if (matchCount > 0 && deleteMatches === "true") {
      await Match.deleteMany({
        seasonNumber: seasonId,
        groupName: groupName,
        stage: "league",
      });
    }

    // Remove group
    schedule.groups.splice(groupIndex, 1);
    await schedule.save();

    // Sync to Season.groups
    season.groups = schedule.groups.map((g) => ({
      groupName: g.groupName,
      teams: g.teams.map((t) => ({
        team: t.team,
        teamName: t.teamName,
        teamCode: t.teamCode,
      })),
    }));
    await season.save();

    return res.json({
      success: true,
      message: `Group ${groupName} deleted successfully`,
      schedule,
    });
  } catch (err) {
    console.error("❌ Failed to delete group:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
```

- [ ] **Step 5: Update module.exports in groupController.js**

Replace the existing `module.exports` block:

```javascript
// ================== EXPORTS ==================
module.exports = {
  generateGroups,
  deleteGroupsBySeason,
  setScheduleTime,
  getSchedule,
  generateLeagueMatches,
  deleteMatchesBySeason,
  getApprovedTeams,
  createGroup,
  updateGroup,
  deleteGroup,
};
```

- [ ] **Step 6: Add routes to groupRoutes.js**

Append to `backend/routes/groupRoutes.js` before `module.exports`:

```javascript
// ✅ Get approved teams for a season (with assignment info)
router.get(
  '/teams/approved',
  protect,
  requireAdminOrSuperAdmin,
  groupController.getApprovedTeams
);

// ✅ Create a new group (super-admin only)
router.post(
  '/:seasonId/groups',
  protect,
  requireAdminOrSuperAdmin,
  groupController.createGroup
);

// ✅ Update a group (rename, add/remove team)
router.put(
  '/:seasonId/groups/:groupName',
  protect,
  requireAdminOrSuperAdmin,
  groupController.updateGroup
);

// ✅ Delete a group
router.delete(
  '/:seasonId/groups/:groupName',
  protect,
  requireAdminOrSuperAdmin,
  groupController.deleteGroup
);
```

- [ ] **Step 7: Update imports in groupRoutes.js**

Update the destructured imports at the top of `groupRoutes.js`:

```javascript
const {
  generateLeagueMatches,
  deleteGroupsBySeason,
  deleteMatchesBySeason,
  getApprovedTeams,
  createGroup,
  updateGroup,
  deleteGroup,
} = require('../controllers/groupController');
```

- [ ] **Step 8: Verify backend starts and endpoints respond**

Run: `cd backend && node server.js`
Expected: Server starts without errors.

Test endpoint manually or via curl:
```
GET /api/groups/teams/approved?seasonId=<valid-season-id>
```
Expected: `{ success: true, teams: [...] }`

- [ ] **Step 9: Commit**

```bash
git add backend/controllers/groupController.js backend/routes/groupRoutes.js
git commit -m "feat: add group CRUD endpoints (create, update, delete, getApprovedTeams)"
```

---

### Task 3: Create GroupManagement.tsx Component

**Files:**
- Create: `frontend/src/pages/admin/GroupManagement.tsx`

**Interfaces:**
- Consumes: `api` from `@/lib/api`, shadcn/ui components (`Button`, `Card`, `Dialog`, `Input`, `Badge`)
- Produces: `GroupManagement` React component

- [ ] **Step 1: Create the component file with types and state**

Create `frontend/src/pages/admin/GroupManagement.tsx`:

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, X, RefreshCcw, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

interface TeamData {
  _id: string;
  teamName: string;
  teamCode: string;
  teamLogo?: string;
  assignedGroup: string | null;
}

interface GroupTeam {
  team: { _id: string; teamName: string; teamCode: string; teamLogo?: string } | string;
  teamName: string;
  teamCode: string;
}

interface Group {
  groupName: string;
  teams: GroupTeam[];
}

interface Schedule {
  _id: string;
  seasonNumber: {
    _id: string;
    seasonNumber: number;
    entryDeadline: string;
  };
  groups: Group[];
}

interface Season {
  _id: string;
  seasonNumber: number;
  isCurrent: boolean;
  entryDeadline?: string;
}

const GroupManagement: React.FC = () => {
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem('pplt20_user') || '{}');
  const isSuperAdmin = user?.role === 'super-admin';

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [approvedTeams, setApprovedTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [matchWarningOpen, setMatchWarningOpen] = useState(false);

  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editSelectedTeamIds, setEditSelectedTeamIds] = useState<string[]>([]);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const [deleteMatches, setDeleteMatches] = useState(false);
  const [pendingRegenerate, setPendingRegenerate] = useState(false);

  return (
    <div>
      {/* Component will be built in subsequent steps */}
      <p>Group Management</p>
    </div>
  );
};

export default GroupManagement;
```

- [ ] **Step 2: Add data fetching functions**

Add these functions inside the `GroupManagement` component, after the state declarations:

```tsx
  const fetchSeasons = async () => {
    try {
      const res = await api.get('/seasons');
      const allSeasons = (res.data?.seasons || []).map((s: any) => ({
        _id: s._id,
        seasonNumber: s.seasonNumber,
        isCurrent: s.isCurrent,
        entryDeadline: s.entryDeadline,
      }));
      allSeasons.sort((a: any, b: any) => b.seasonNumber - a.seasonNumber);
      setSeasons(allSeasons);
      return allSeasons;
    } catch (err) {
      console.error('Failed to fetch seasons:', err);
      return [];
    }
  };

  const fetchSchedule = async (seasonId: string) => {
    try {
      setLoading(true);
      const res = await api.get('/groups/schedule', { params: { seasonId } });
      setSchedule(res.data?.schedule || null);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setSchedule(null);
      } else {
        console.error('Failed to fetch schedule:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedTeams = async (seasonId: string) => {
    try {
      const res = await api.get('/groups/teams/approved', { params: { seasonId } });
      setApprovedTeams(res.data?.teams || []);
    } catch (err) {
      console.error('Failed to fetch approved teams:', err);
    }
  };

  const refreshData = useCallback(async (seasonId: string) => {
    await Promise.all([
      fetchSchedule(seasonId),
      fetchApprovedTeams(seasonId),
    ]);
  }, []);

  useEffect(() => {
    const init = async () => {
      const allSeasons = await fetchSeasons();
      const current = allSeasons.find((s: Season) => s.isCurrent) || allSeasons[0];
      if (current) {
        setSelectedSeasonId(current._id);
        await refreshData(current._id);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedSeasonId) {
      refreshData(selectedSeasonId);
    }
  }, [selectedSeasonId]);
```

- [ ] **Step 3: Add the next group name calculation helper**

Add after the `useEffect` blocks:

```tsx
  const getNextGroupName = (): string => {
    if (!schedule?.groups) return 'A';
    const existingNames = schedule.groups.map((g) => g.groupName).sort();
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < alphabet.length; i++) {
      if (!existingNames.includes(alphabet[i])) {
        return alphabet[i];
      }
    }
    return 'Z';
  };

  const getUnassignedTeams = (): TeamData[] => {
    return approvedTeams.filter((t) => !t.assignedGroup);
  };

  const getTeamsForGroup = (groupName: string): TeamData[] => {
    return approvedTeams.filter(
      (t) => !t.assignedGroup || t.assignedGroup === groupName
    );
  };
```

- [ ] **Step 4: Add CRUD handler functions**

Add after the helper functions:

```tsx
  const handleCreateGroup = async () => {
    try {
      const res = await api.post(`/groups/${selectedSeasonId}/groups`, {
        groupName: newGroupName || undefined,
        teamIds: selectedTeamIds,
      });
      toast({ title: 'Success', description: res.data?.message || 'Group created' });
      setCreateDialogOpen(false);
      setNewGroupName('');
      setSelectedTeamIds([]);
      await refreshData(selectedSeasonId);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to create group',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    try {
      const res = await api.put(`/groups/${selectedSeasonId}/groups/${editingGroup.groupName}`, {
        newName: editGroupName !== editingGroup.groupName ? editGroupName : undefined,
      });
      toast({ title: 'Success', description: res.data?.message || 'Group updated' });
      setEditDialogOpen(false);
      setEditingGroup(null);
      await refreshData(selectedSeasonId);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to update group',
        variant: 'destructive',
      });
    }
  };

  const handleAddTeamToGroup = async (groupName: string, teamId: string) => {
    try {
      const res = await api.put(`/groups/${selectedSeasonId}/groups/${groupName}`, {
        addTeam: teamId,
      });
      toast({ title: 'Success', description: 'Team added to group' });
      await refreshData(selectedSeasonId);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to add team',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveTeamFromGroup = async (groupName: string, teamId: string) => {
    try {
      const res = await api.put(`/groups/${selectedSeasonId}/groups/${groupName}`, {
        removeTeam: teamId,
      });
      toast({ title: 'Success', description: 'Team removed from group' });
      await refreshData(selectedSeasonId);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to remove team',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;
    try {
      const params = new URLSearchParams();
      if (deleteMatches) params.set('deleteMatches', 'true');
      const res = await api.delete(
        `/groups/${selectedSeasonId}/groups/${deletingGroup.groupName}?${params.toString()}`
      );
      toast({ title: 'Success', description: res.data?.message || 'Group deleted' });
      setDeleteDialogOpen(false);
      setDeletingGroup(null);
      setDeleteMatches(false);
      await refreshData(selectedSeasonId);
    } catch (err: any) {
      if (err?.response?.data?.hasMatches) {
        setDeleteMatches(true);
        return;
      }
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to delete group',
        variant: 'destructive',
      });
    }
  };

  const handleRegenerateMatches = async () => {
    try {
      // Check if matches exist first
      const matchRes = await api.get('/matches', {
        params: { seasonNumber: selectedSeasonId, stage: 'league' },
      });
      const existingMatches = matchRes.data?.matches || [];
      if (existingMatches.length > 0) {
        setPendingRegenerate(true);
        setMatchWarningOpen(true);
        return;
      }
      await doRegenerateMatches();
    } catch (err) {
      console.error('Failed to check matches:', err);
    }
  };

  const doRegenerateMatches = async () => {
    try {
      const res = await api.post(`/groups/generate/league/${selectedSeasonId}`);
      toast({ title: 'Success', description: res.data?.message || 'Matches regenerated' });
      setMatchWarningOpen(false);
      setPendingRegenerate(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to regenerate matches',
        variant: 'destructive',
      });
    }
  };

  const handleOpenDeleteDialog = async (group: Group) => {
    setDeletingGroup(group);
    setDeleteMatches(false);
    // Check if matches exist for this group
    try {
      const matchRes = await api.get('/matches', {
        params: { seasonNumber: selectedSeasonId, stage: 'league' },
      });
      const groupMatches = (matchRes.data?.matches || []).filter(
        (m: any) => m.groupName === group.groupName
      );
      if (groupMatches.length > 0) {
        // Store match count for the dialog
        setDeletingGroup({ ...group, matchCount: groupMatches.length } as any);
      }
    } catch (err) {
      // Ignore error, just open dialog
    }
    setDeleteDialogOpen(true);
  };
```

- [ ] **Step 5: Add the main render JSX**

Replace the placeholder return with the full UI:

```tsx
  const selectedSeason = seasons.find((s) => s._id === selectedSeasonId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
            <span className="text-indigo-600 text-3xl">🏆</span>
            <span>
              UPPL Season{' '}
              <select
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className="ml-2 bg-white border border-gray-300 rounded-lg px-3 py-1 text-lg font-semibold text-gray-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {seasons.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.seasonNumber}{s.isCurrent ? ' (Current)' : ''}
                  </option>
                ))}
              </select>
            </span>
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-gray-600 text-sm">
            <p>📅 Year: {selectedSeason?.entryDeadline ? new Date(selectedSeason.entryDeadline).getFullYear() : 'N/A'}</p>
            <span className="text-gray-400">|</span>
            <p>🏅 Status: {schedule?.groups?.length ? <span className="text-green-600 font-semibold">Active</span> : <span className="text-gray-500">No Groups Yet</span>}</p>
            <span className="text-gray-400">|</span>
            <p>👥 Teams: {approvedTeams.length} approved</p>
          </div>
        </div>
        {isSuperAdmin && (
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setNewGroupName(getNextGroupName());
                setSelectedTeamIds([]);
                setCreateDialogOpen(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus size={16} /> Create Group
            </Button>
            <Button
              variant="outline"
              onClick={handleRegenerateMatches}
              className="flex items-center gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              <RefreshCcw size={16} /> Regenerate Matches
            </Button>
          </div>
        )}
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading groups...</div>
      ) : !schedule?.groups?.length ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Groups Created</h3>
          <p className="text-gray-500 mb-4">Create your first group to get started.</p>
          {isSuperAdmin && (
            <Button
              onClick={() => {
                setNewGroupName(getNextGroupName());
                setSelectedTeamIds([]);
                setCreateDialogOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus size={16} className="mr-2" /> Create Group
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedule.groups.map((group) => {
            const assignedCount = group.teams.length;
            return (
              <Card key={group.groupName} className="relative hover:shadow-lg transition-shadow border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Group {group.groupName}
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {assignedCount} {assignedCount === 1 ? 'team' : 'teams'}
                    </Badge>
                  </CardTitle>
                  {isSuperAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-indigo-600"
                        onClick={() => {
                          setEditingGroup(group);
                          setEditGroupName(group.groupName);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                        onClick={() => handleOpenDeleteDialog(group)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {assignedCount === 0 ? (
                    <p className="text-gray-400 text-sm italic py-4 text-center">No teams yet</p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {group.teams.map((t) => {
                        const teamId = typeof t.team === 'object' ? t.team._id : t.team;
                        const teamName = t.teamName || (typeof t.team === 'object' ? t.team.teamName : '');
                        const teamCode = t.teamCode || (typeof t.team === 'object' ? t.team.teamCode : '');
                        return (
                          <div key={teamId} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">{teamName}</span>
                              <Badge variant="outline" className="text-xs">{teamCode}</Badge>
                            </div>
                            {isSuperAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                onClick={() => handleRemoveTeamFromGroup(group.groupName, teamId)}
                              >
                                <X size={12} />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {isSuperAdmin && (() => {
                    const unassigned = getUnassignedTeams();
                    if (unassigned.length === 0) return null;
                    return (
                      <Select onValueChange={(val) => handleAddTeamToGroup(group.groupName, val)}>
                        <SelectTrigger className="w-full border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600">
                          <SelectValue placeholder="+ Add Team" />
                        </SelectTrigger>
                        <SelectContent>
                          {unassigned.map((team) => (
                            <SelectItem key={team._id} value={team._id}>
                              {team.teamName} ({team.teamCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  })()}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a group and assign approved teams to it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Group Name</label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. A, B, C"
                maxLength={10}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Select Teams ({selectedTeamIds.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {getUnassignedTeams().length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No unassigned approved teams</p>
                ) : (
                  getUnassignedTeams().map((team) => (
                    <label
                      key={team._id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeamIds.includes(team._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTeamIds([...selectedTeamIds, team._id]);
                          } else {
                            setSelectedTeamIds(selectedTeamIds.filter((id) => id !== team._id));
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-sm">{team.teamName}</span>
                      <Badge variant="outline" className="text-xs ml-auto">{team.teamCode}</Badge>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateGroup}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Group {editingGroup?.groupName}</DialogTitle>
            <DialogDescription>
              Rename the group or manage team assignments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Group Name</label>
              <Input
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                placeholder="e.g. A, B, C"
                maxLength={10}
              />
            </div>
            {editingGroup && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Current Teams ({editingGroup.teams.length})
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                  {editingGroup.teams.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No teams in this group</p>
                  ) : (
                    editingGroup.teams.map((t) => {
                      const teamId = typeof t.team === 'object' ? t.team._id : t.team;
                      const teamName = t.teamName || (typeof t.team === 'object' ? t.team.teamName : '');
                      const teamCode = t.teamCode || (typeof t.team === 'object' ? t.team.teamCode : '');
                      return (
                        <div key={teamId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{teamName} ({teamCode})</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                            onClick={() => handleRemoveTeamFromGroup(editingGroup.groupName, teamId)}
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateGroup}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Group {deletingGroup?.groupName}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {(deletingGroup as any)?.matchCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-amber-800 text-sm">
                  ⚠️ {(deletingGroup as any).matchCount} match(es) exist for this group.
                </p>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteMatches}
                    onChange={(e) => setDeleteMatches(e.target.checked)}
                    className="rounded border-gray-300 text-red-600"
                  />
                  <span className="text-sm text-amber-800">Also delete associated matches</span>
                </label>
              </div>
            )}
            <p className="text-sm text-gray-600">
              Are you sure you want to delete Group {deletingGroup?.groupName}?
              {deletingGroup?.teams.length ? ` This will remove ${deletingGroup.teams.length} team(s) from the group.` : ''}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDeleteGroup}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Matches Warning Dialog */}
      <Dialog open={matchWarningOpen} onOpenChange={setMatchWarningOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Regenerate Matches?</DialogTitle>
            <DialogDescription>
              This will delete all existing league matches and recreate them from the current groups.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              This action cannot be undone. All current league match data will be lost.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMatchWarningOpen(false); setPendingRegenerate(false); }}>
              Cancel
            </Button>
            <Button
              onClick={doRegenerateMatches}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Confirm Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupManagement;
```

- [ ] **Step 6: Verify component compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No TypeScript errors in `GroupManagement.tsx`.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/admin/GroupManagement.tsx
git commit -m "feat: create GroupManagement component with CRUD dialogs and card grid UI"
```

---

### Task 4: Integrate GroupManagement into ScheduleMatch.tsx

**Files:**
- Modify: `frontend/src/pages/admin/ScheduleMatch.tsx:1-10` (imports)
- Modify: `frontend/src/pages/admin/ScheduleMatch.tsx:728-817` (groups sub-tab)

**Interfaces:**
- Consumes: `GroupManagement` component from Task 3
- Produces: Groups sub-tab now renders `GroupManagement` instead of inline code

- [ ] **Step 1: Add import for GroupManagement**

Add to the imports at the top of `ScheduleMatch.tsx`:

```tsx
import GroupManagement from './GroupManagement';
```

- [ ] **Step 2: Replace the groups sub-tab content**

In `ScheduleMatch.tsx`, find the block starting with `{subTab === 'groups' ? (` (around line 728). Replace the entire groups section (lines 728-817) with:

```tsx
    {subTab === 'groups' ? (
      <GroupManagement />
    ) : (
```

Keep everything from the `) : (` onwards (the matches sub-tab) unchanged.

- [ ] **Step 3: Verify the app compiles and renders**

Run: `cd frontend && npx tsc --noEmit`
Expected: No TypeScript errors.

Run: `cd frontend && npm run dev`
Expected: App loads, navigating to Schedule > Groups shows the new `GroupManagement` component.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/admin/ScheduleMatch.tsx
git commit -m "feat: integrate GroupManagement component into ScheduleMatch sub-tab"
```

---

### Task 5: End-to-End Verification

**Files:**
- Test: all files from Tasks 1-4

**Interfaces:**
- Consumes: all endpoints and components from previous tasks
- Produces: verified working feature

- [ ] **Step 1: Start backend and verify new endpoints**

Start backend: `cd backend && node server.js`

Test with curl or Postman:
```bash
# Get approved teams (replace <seasonId> with a valid ID)
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/groups/teams/approved?seasonId=<seasonId>

# Create a group
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"groupName":"A","teamIds":["teamId1","teamId2"]}' \
  http://localhost:5000/api/groups/<seasonId>/groups

# Update a group (rename)
curl -X PUT -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"newName":"Alpha"}' \
  http://localhost:5000/api/groups/<seasonId>/groups/A

# Delete a group
curl -X DELETE -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/groups/<seasonId>/groups/Alpha
```

Expected: All endpoints return success responses.

- [ ] **Step 2: Start frontend and test the UI**

Start frontend: `cd frontend && npm run dev`

Test the following flows:
1. Navigate to Admin Dashboard > Schedule > Groups
2. Verify season dropdown works and loads groups
3. Click "Create Group" — verify dialog opens with next letter pre-filled
4. Select teams and create a group — verify card appears
5. Click edit icon — verify rename dialog works
6. Click delete icon — verify confirmation dialog
7. Add a team via "+ Add Team" dropdown — verify team appears in card
8. Remove a team via `-` button — verify team removed
9. Click "Regenerate Matches" — verify warning dialog appears
10. Verify non-super-admin users see read-only view (no buttons)

- [ ] **Step 3: Verify auto-scheduler is removed**

Restart backend and check console output:
Expected: No "Auto group scheduler started..." message.

- [ ] **Step 4: Commit final verification**

```bash
git add -A
git commit -m "feat: group management redesign complete - manual CRUD with modern UI"
```
