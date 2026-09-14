import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, X, RefreshCcw, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

interface TeamData {
  _id: string;
  teamName: string;
  teamCode: string;
  teamLogo?: { url: string; public_id: string };
  assignedGroup?: string;
}

interface GroupTeam {
  team: { _id: string; teamName: string; teamCode: string; teamLogo?: { url: string; public_id: string } };
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
  id: string;
  number: number;
  year: string;
}

const GROUP_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'from-blue-500 to-blue-600', badge: 'bg-blue-100 text-blue-700', text: 'text-blue-700' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'from-emerald-500 to-emerald-600', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700' },
  { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'from-amber-500 to-amber-600', badge: 'bg-amber-100 text-amber-700', text: 'text-amber-700' },
  { bg: 'bg-rose-50', border: 'border-rose-200', accent: 'from-rose-500 to-rose-600', badge: 'bg-rose-100 text-rose-700', text: 'text-rose-700' },
  { bg: 'bg-violet-50', border: 'border-violet-200', accent: 'from-violet-500 to-violet-600', badge: 'bg-violet-100 text-violet-700', text: 'text-violet-700' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', accent: 'from-cyan-500 to-cyan-600', badge: 'bg-cyan-100 text-cyan-700', text: 'text-cyan-700' },
  { bg: 'bg-pink-50', border: 'border-pink-200', accent: 'from-pink-500 to-pink-600', badge: 'bg-pink-100 text-pink-700', text: 'text-pink-700' },
  { bg: 'bg-orange-50', border: 'border-orange-200', accent: 'from-orange-500 to-orange-600', badge: 'bg-orange-100 text-orange-700', text: 'text-orange-700' },
];

const GroupManagement = () => {
  const { toast } = useToast();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [addTeamDialogOpen, setAddTeamDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [editGroupName, setEditGroupName] = useState('');
  const [deleteGroupName, setDeleteGroupName] = useState('');
  const [selectedCreateTeamIds, setSelectedCreateTeamIds] = useState<string[]>([]);
  const [addTeamGroupId, setAddTeamGroupId] = useState('');
  const [selectedTeamToAdd, setSelectedTeamToAdd] = useState('');
  const [hasExistingMatches, setHasExistingMatches] = useState(false);
  const [deleteMatchCount, setDeleteMatchCount] = useState<number | null>(null);
  const [deleteWithMatches, setDeleteWithMatches] = useState(false);

  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    if (selectedSeasonId) {
      refreshData();
    }
  }, [selectedSeasonId]);

  const fetchSeasons = async () => {
    try {
      const res = await api.get('/seasons');
      const allSeasons = (res.data?.seasons || res.data || []).map((s: any) => ({
        id: s._id,
        number: s.seasonNumber,
        year: new Date(s.entryDeadline).getFullYear(),
        isCurrent: s.isCurrent,
      }));
      setSeasons(allSeasons);
      const current = allSeasons.find((s: any) => s.isCurrent);
      if (current) {
        setSelectedSeasonId(current.id);
      } else if (allSeasons.length > 0) {
        setSelectedSeasonId(allSeasons[0].id);
      }
    } catch (err) {
      console.error('Failed to load seasons:', err);
    }
  };

  const fetchSchedule = async (seasonId: string) => {
    try {
      const res = await api.get('/groups/schedule', { params: { seasonId } });
      setSchedule(res.data.schedule || null);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    }
  };

  const fetchApprovedTeams = async (seasonId: string) => {
    try {
      const res = await api.get('/groups/teams/approved', { params: { seasonId } });
      setTeams(res.data.teams || []);
    } catch (err) {
      console.error('Failed to load approved teams:', err);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchSchedule(selectedSeasonId), fetchApprovedTeams(selectedSeasonId)]);
    setLoading(false);
  };

  const getNextGroupName = () => {
    if (!schedule || !schedule.groups || schedule.groups.length === 0) return 'A';
    const existing = new Set(schedule.groups.map(g => g.groupName));
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      if (!existing.has(letter)) return letter;
    }
    return String.fromCharCode(65 + existing.size);
  };

  const getUnassignedTeams = () => {
    return teams.filter(t => !t.assignedGroup);
  };

  const getTeamsForGroup = (groupName: string) => {
    const group = schedule?.groups.find(g => g.groupName === groupName);
    return group?.teams || [];
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({ title: 'Error', description: 'Group name is required', variant: 'destructive' });
      return;
    }
    try {
      const payload: any = { groupName: newGroupName.trim() };
      if (selectedCreateTeamIds.length > 0) {
        payload.teamIds = selectedCreateTeamIds;
      }
      await api.post(`/groups/${selectedSeasonId}/groups`, payload);
      toast({ title: 'Success', description: `Group ${newGroupName.trim()} created` });
      setCreateDialogOpen(false);
      setNewGroupName('');
      setSelectedCreateTeamIds([]);
      await refreshData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create group', variant: 'destructive' });
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup || !editGroupName.trim()) return;
    try {
      await api.put(`/groups/${selectedSeasonId}/groups/${selectedGroup.groupName}`, { newName: editGroupName.trim() });
      toast({ title: 'Success', description: `Group renamed to ${editGroupName.trim()}` });
      setEditDialogOpen(false);
      setSelectedGroup(null);
      setEditGroupName('');
      await refreshData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update group', variant: 'destructive' });
    }
  };

  const handleAddTeamToGroup = async () => {
    if (!addTeamGroupId || !selectedTeamToAdd) return;
    try {
      await api.put(`/groups/${selectedSeasonId}/groups/${addTeamGroupId}`, { addTeam: selectedTeamToAdd });
      toast({ title: 'Success', description: 'Team added to group' });
      setAddTeamDialogOpen(false);
      setAddTeamGroupId('');
      setSelectedTeamToAdd('');
      await refreshData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to add team', variant: 'destructive' });
    }
  };

  const handleRemoveTeamFromGroup = async (groupName: string, teamId: string) => {
    try {
      await api.put(`/groups/${selectedSeasonId}/groups/${groupName}`, { removeTeam: teamId });
      toast({ title: 'Success', description: 'Team removed from group' });
      await refreshData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to remove team', variant: 'destructive' });
    }
  };

  const handleDeleteGroup = async (forceDelete = false) => {
    if (!deleteGroupName) return;
    try {
      const url = forceDelete
        ? `/groups/${selectedSeasonId}/groups/${deleteGroupName}?deleteMatches=true`
        : `/groups/${selectedSeasonId}/groups/${deleteGroupName}`;
      await api.delete(url);
      toast({ title: 'Success', description: `Group ${deleteGroupName} deleted` });
      setDeleteDialogOpen(false);
      setDeleteGroupName('');
      setDeleteMatchCount(null);
      setDeleteWithMatches(false);
      await refreshData();
    } catch (err: any) {
      if (err?.response?.data?.hasMatches === true) {
        setDeleteMatchCount(err.response.data.matchCount);
        setDeleteWithMatches(true);
        return;
      }
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to delete group', variant: 'destructive' });
    }
  };

  const handleRegenerateMatches = async () => {
    try {
      const matchesRes = await api.get('/matches', { params: { seasonNumber: schedule?.seasonNumber?.seasonNumber, stage: 'league' } });
      setHasExistingMatches(matchesRes.data.length > 0);
      setRegenerateDialogOpen(true);
    } catch (err) {
      console.error('Failed to check existing matches:', err);
      setRegenerateDialogOpen(true);
    }
  };

  const doRegenerateMatches = async () => {
    try {
      await api.post(`/groups/generate/league/${selectedSeasonId}`);
      toast({ title: 'Success', description: 'League matches regenerated' });
      setRegenerateDialogOpen(false);
      await refreshData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to regenerate matches', variant: 'destructive' });
    }
  };

  const handleOpenDeleteDialog = (groupName: string) => {
    setDeleteGroupName(groupName);
    setDeleteDialogOpen(true);
  };

  const user = JSON.parse(localStorage.getItem('pplt20_user') || '{}');
  const isSuperAdmin = user?.role === 'super-admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Group Management</h2>
          <p className="text-sm text-gray-500">Create and manage groups for the tournament</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Season" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map(s => (
                <SelectItem key={s.id} value={s.id}>{`Season ${s.number} (${s.year})`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isSuperAdmin && (
            <>
              <Button onClick={() => { setNewGroupName(getNextGroupName()); setCreateDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Create Group
              </Button>
              <Button variant="outline" onClick={handleRegenerateMatches} disabled={!schedule?.groups?.length}>
                <RefreshCcw className="w-4 h-4 mr-2" /> Regenerate Matches
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading groups...</div>
      ) : !schedule?.groups?.length ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Found</h3>
          <p className="text-gray-500 mb-4">Create groups to start organizing teams</p>
          {isSuperAdmin && (
            <Button onClick={() => { setNewGroupName(getNextGroupName()); setCreateDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Create First Group
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {schedule.groups.map((group, i) => {
            const color = GROUP_COLORS[i % GROUP_COLORS.length];
            return (
              <Card key={group.groupName} className={`relative overflow-hidden hover:shadow-xl transition-all duration-200 border ${color.border}`}>
                <div className={`h-2 bg-gradient-to-r ${color.accent}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-lg font-bold ${color.text}`}>Group {group.groupName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={`${color.badge} font-semibold`}>{group.teams.length} {group.teams.length === 1 ? 'team' : 'teams'}</Badge>
                      {isSuperAdmin && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedGroup(group); setEditGroupName(group.groupName); setEditDialogOpen(true); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDeleteDialog(group.groupName)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {group.teams.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">No teams assigned</div>
                  ) : (
                    <div className="space-y-2">
                      {group.teams.map(team => {
                        const logoUrl = team.team?.teamLogo?.url;
                        return (
                          <div key={team.team._id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color.accent} flex items-center justify-center text-white text-sm font-bold overflow-hidden shadow-sm`}>
                                {logoUrl ? (
                                  <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  team.teamName[0]
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{team.teamName}</p>
                                <p className="text-xs text-gray-500">{team.teamCode}</p>
                              </div>
                            </div>
                            {isSuperAdmin && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleRemoveTeamFromGroup(group.groupName, team.team._id)}>
                                <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {isSuperAdmin && (
                    <Button variant="outline" size="sm" className={`w-full mt-3 border-dashed ${color.border} ${color.text} hover:${color.bg}`} onClick={() => { setAddTeamGroupId(group.groupName); setSelectedTeamToAdd(''); setAddTeamDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" /> Add Team
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>Enter a group name (auto-assigned: A, B, C...)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Group Name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
            {getUnassignedTeams().length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Assign Teams (optional)</p>
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
                  {getUnassignedTeams().map(team => (
                    <label key={team._id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-gray-50">
                      <Checkbox
                        checked={selectedCreateTeamIds.includes(team._id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCreateTeamIds(prev => [...prev, team._id]);
                          } else {
                            setSelectedCreateTeamIds(prev => prev.filter(id => id !== team._id));
                          }
                        }}
                      />
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
                        {team.teamLogo?.url ? (
                          <img src={team.teamLogo.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          team.teamName[0]
                        )}
                      </div>
                      <span className="text-sm">{team.teamName} ({team.teamCode})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Group</DialogTitle>
            <DialogDescription>Change the group name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="New Group Name" value={editGroupName} onChange={e => setEditGroupName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateGroup}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              {deleteWithMatches && deleteMatchCount !== null
                ? `Group ${deleteGroupName} has ${deleteMatchCount} existing match(es). Deleting the group will also remove these matches. Are you sure?`
                : `Are you sure you want to delete Group ${deleteGroupName}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteWithMatches(false); setDeleteMatchCount(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDeleteGroup(deleteWithMatches)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Matches Dialog */}
      <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate League Matches</DialogTitle>
            <DialogDescription>
              {hasExistingMatches
                ? 'Existing league matches will be overwritten. Continue?'
                : 'Generate league matches based on current groups?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateDialogOpen(false)}>Cancel</Button>
            <Button onClick={doRegenerateMatches}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Team to Group Dialog */}
      <Dialog open={addTeamDialogOpen} onOpenChange={setAddTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team to Group {addTeamGroupId}</DialogTitle>
            <DialogDescription>Select an unassigned team to add</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {getUnassignedTeams().length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No unassigned teams available</p>
            ) : (
              <Select value={selectedTeamToAdd} onValueChange={setSelectedTeamToAdd}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {getUnassignedTeams().map(team => (
                    <SelectItem key={team._id} value={team._id}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-[9px] font-bold overflow-hidden">
                          {team.teamLogo?.url ? (
                            <img src={team.teamLogo.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            team.teamName[0]
                          )}
                        </div>
                        <span>{team.teamName} ({team.teamCode})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTeamDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTeamToGroup} disabled={!selectedTeamToAdd}>Add Team</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupManagement;