import React, { useEffect, useState } from 'react';

import { Label } from '@/components/ui/label';
import { BASE_URL } from "@/config";
import api from '@/lib/api';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Trash2, Pencil, Plus, Save, ImageIcon, ZoomIn, Settings, X, ChevronLeft, ChevronRight, Shield, CheckCircle, XCircle, Users, Calendar, Search, Mail, Phone, CalendarDays, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const getImageUrl = (img: any): string => {
  if (!img) return "";
  if (typeof img === "string") {
    if (img.startsWith("data:")) return img;
    if (img.startsWith("http")) return img;
    return `${BASE_URL}/${img.replace(/\\/g, "/")}`;
  }
  if (typeof img === "object") {
    return img.secure_url || img.url || "";
  }
  return "";
};

interface Team {
  _id?: string;
  teamName?: string;
  coachName?: string;
  captainName?: string;
  managerName?: string;
  contactNumber?: string;
  teamCode?: string;
  status?: string;
  email?: string;
  createdBy?: any;
  teamLogo?: string | { url?: string; secure_url?: string };
  paymentReceipt?: string | { url?: string; secure_url?: string };
  players: {
    _id?: string;
    name?: string;
    position?: string;
    jerseyNumber?: string;
    playerCode?: string;
    code?: string;
    status?: string;
    user?: {
      name?: string;
      email?: string;
      phone?: string;
      role?: string;
      position?: string;
      dateOfBirth?: string;
      battingStyle?: string;
      bowlingStyle?: string;
      bio?: string;
      playerCode?: string;
      profileImage?: string | { url?: string; secure_url?: string };
      documents?: Array<string | { url?: string; secure_url?: string }>;
      [key: string]: any;
    };
  }[];
  season?: { number?: number; year?: string };
  createdAt?: string;
}

const teamGradients = [
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-500',
  'from-violet-500 to-purple-500',
  'from-sky-500 to-indigo-500',
  'from-red-500 to-rose-600',
  'from-lime-500 to-green-500',
];

const statusColor = (status?: string) => {
  switch (status) {
    case 'verified': return 'bg-green-500';
    case 'approved': return 'bg-green-500';
    case 'pending': return 'bg-yellow-500';
    case 'rejected': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

const statusBadge = (status?: string, label?: string) => (
  <span className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full text-white ${statusColor(status)}`}>
    {label || status || 'unknown'}
  </span>
);

const TeamManagement = () => {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [teams, setTeams] = useState<any[]>([]);

  const [newSeason, setNewSeason] = useState<{ number: string; endDate: string; year?: string }>({
    number: "", endDate: "", year: undefined,
  });

  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSeason, setEditingSeason] = useState({ number: '', endDate: '' });
  const [seasonInput, setSeasonInput] = useState({
    number: '', endDate: new Date().toISOString().slice(0, 16),
  });
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editableTeam, setEditableTeam] = useState<Team | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomedDocIndex, setZoomedDocIndex] = useState<number | null>(null);

  useEffect(() => { fetchSeasons() }, []);
  useEffect(() => { if (selectedSeasonId) fetchTeamsBySeason(selectedSeasonId) }, [selectedSeasonId]);

  const fetchSeasons = async () => {
    try {
      const token = localStorage.getItem('pplt20_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await api.get('/seasons', config);
      const mapped = res.data.map((s: any) => ({
        id: s._id, number: s.seasonNumber, year: new Date(s.entryDeadline).getFullYear(),
        endDate: s.entryDeadline, isCurrent: s.isCurrent,
      }));
      setSeasons(mapped);
      const current = mapped.find((s: any) => s.isCurrent);
      if (current) {
        setSelectedSeasonId(current.id);
        setSeasonInput({ number: current.number.toString(), endDate: new Date(current.endDate).toISOString().slice(0, 16) });
      } else if (mapped.length > 0) {
        setSelectedSeasonId(mapped[0].id);
        setSeasonInput({ number: mapped[0].number.toString(), endDate: new Date(mapped[0].endDate).toISOString().slice(0, 16) });
      }
    } catch (err) { console.error('Failed to load seasons:', err) }
  };

  const fetchTeamsBySeason = async (seasonId: string) => {
    try {
      const token = localStorage.getItem('pplt20_token');
      const res = await api.get(`/teams?seasonId=${seasonId}`, { headers: { Authorization: `Bearer ${token}` } });
      setTeams(res.data);
    } catch (err) { console.error('Failed to load teams', err) }
  };

  const handleCreateSeason = async () => {
    if (!newSeason.number || !newSeason.endDate) return toast({ title: "Error", description: "All fields are required", variant: "destructive" });
    try {
      const token = localStorage.getItem('pplt20_token');
      await api.post('/seasons', { seasonNumber: Number(newSeason.number), entryDeadline: newSeason.endDate }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchSeasons();
      setNewSeason({ number: '', endDate: new Date().toISOString().slice(0, 16) });
      toast({ title: "Season Created", description: `Season ${newSeason.number} added successfully` });
    } catch { toast({ title: "Error", description: "Failed to create season", variant: "destructive" }) }
  };

  const handleDeleteSeason = async (id: string) => {
    try {
      const token = localStorage.getItem('pplt20_token');
      await api.delete(`/seasons/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      await fetchSeasons();
      if (id === selectedSeasonId) { setSelectedSeasonId(''); setTeams([]) }
      toast({ title: "Deleted", description: "Season deleted successfully" });
    } catch { toast({ title: "Error", description: "Could not delete season", variant: "destructive" }) }
  };

  const handleEditClick = (season: any) => {
    setEditingId(season.id);
    setEditingSeason({ number: season.number.toString(), endDate: new Date(season.endDate).toISOString().slice(0, 16) });
  };

  const handleSaveEdit = async () => {
    if (!editingSeason.number || !editingSeason.endDate) return toast({ title: "Error", description: "All fields are required", variant: "destructive" });
    try {
      const token = localStorage.getItem('pplt20_token');
      await api.put(`/seasons/${editingId}`, { seasonNumber: Number(editingSeason.number), entryDeadline: editingSeason.endDate }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchSeasons();
      setEditingId(null);
      toast({ title: "Updated", description: "Season updated successfully" });
    } catch { toast({ title: "Error", description: "Failed to update season", variant: "destructive" }) }
  };

  const handleSetSeason = async () => {
    const found = seasons.find((s: any) => s.number === Number(seasonInput.number));
    if (!found) return toast({ title: "Error", description: "Season not found", variant: "destructive" });
    try {
      const token = localStorage.getItem('pplt20_token');
      await api.put(`/seasons/${found.id}/set-current`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchSeasons();
      setSelectedSeasonId(found.id);
      toast({ title: "Active Season Set", description: `Season ${found.number} is now active` });
    } catch { toast({ title: "Error", description: "Failed to set season", variant: "destructive" }) }
  };

  const selectedSeason = seasons.find((s: any) => s.id === selectedSeasonId);

  const handleUpdateTeam = async () => {
    try {
      const token = localStorage.getItem('pplt20_token');
      const formData = new FormData();
      formData.append('teamName', editableTeam!.teamName || '');
      formData.append('coachName', editableTeam!.coachName || '');
      formData.append('captainName', editableTeam!.captainName || '');
      formData.append('managerName', editableTeam!.managerName || '');
      formData.append('contactNumber', editableTeam!.contactNumber || '');
      if (logoFile) formData.append('teamLogo', logoFile);
      if (receiptFile) formData.append('paymentReceipt', receiptFile);
      const playersWithCode = editableTeam!.players.map((p) => ({ ...p, playerCode: p.playerCode || p.code || '' }));
      formData.append('players', JSON.stringify(playersWithCode));
      await api.put(`/teams/${editableTeam!._id}`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      const res = await api.get(`/teams/${editableTeam!._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setEditableTeam(res.data);
      setSelectedTeam(res.data);
      setEditMode(false);
      await fetchTeamsBySeason(selectedSeasonId);
      toast({ title: "Team Updated", description: "Team saved successfully" });
    } catch { toast({ title: "Error", description: "Failed to update team", variant: "destructive" }) }
  };

  const handleEditTeam = (team: any) => {
    const formattedPlayers = team.players?.map((p: any) => ({
      name: p.name || p.user?.name || '',
      position: p.position || p.user?.position || '',
      jerseyNumber: p.jerseyNumber?.toString() || '',
      playerCode: p.code || p.playerCode || p.user?.playerCode || '',
      code: p.code || '', user: p.user || null, status: p.status || 'not_registered', _id: p._id || undefined,
    })) || [];
    setEditableTeam({
      teamName: team.teamName || '', coachName: team.coachName || '', managerName: team.managerName || '',
      captainName: team.captainName || '', contactNumber: team.contactNumber || '', teamCode: team.teamCode || '',
      status: team.status || 'pending', email: team.createdBy?.email || '',
      teamLogo: getImageUrl(team.teamLogo), paymentReceipt: getImageUrl(team.paymentReceipt),
      players: formattedPlayers, _id: team._id,
    });
    setEditMode(true);
  };

  const handleVerifyTeam = async (teamId: string) => {
    try {
      const token = localStorage.getItem('pplt20_token');
      await api.patch(`/teams/${teamId}/verify`, null, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: "Verified", description: "Team verified successfully" });
      await fetchTeamsBySeason(selectedSeasonId);
    } catch { toast({ title: "Error", description: "Failed to verify team", variant: "destructive" }) }
  };

  const handleRejectTeam = async (teamId: string) => {
    try {
      const token = localStorage.getItem('pplt20_token');
      await api.patch(`/teams/${teamId}/reject`, null, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: "Rejected", description: "Team has been rejected" });
      await fetchTeamsBySeason(selectedSeasonId);
    } catch { toast({ title: "Error", description: "Failed to reject team", variant: "destructive" }) }
  };

  const filteredTeams = teams.filter((t: any) =>
    t.teamName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const teamStatusBadge = (status?: string) => {
    if (status === 'approved' || status === 'verified') return statusBadge(status, 'Approved');
    if (status === 'pending') return statusBadge(status, 'Pending');
    if (status === 'rejected') return statusBadge(status, 'Rejected');
    return statusBadge(status, status);
  };

  return (
    <div className="space-y-6">
      {/* Season Management Card */}
      <Card className="border-0 shadow-md rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 px-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Manage Seasons
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Season Number</label>
              <Input placeholder="e.g. 102" value={newSeason.number} onChange={(e) => setNewSeason({ ...newSeason, number: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Team Entry Deadline</label>
              <Input type="datetime-local" value={newSeason.endDate} onChange={(e) => setNewSeason({ ...newSeason, endDate: e.target.value, year: new Date(e.target.value).getFullYear().toString() })} className="h-9 text-sm" />
            </div>
            <div className="flex gap-2 shrink-0">
              <Button onClick={handleCreateSeason} className="h-9 text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Add Season</Button>
              <Button variant="outline" onClick={() => setShowSeasonModal(true)} className="h-9 text-xs"><Eye className="w-3.5 h-3.5 mr-1" /> All Seasons</Button>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Set Active Season</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Select value={seasonInput.number} onValueChange={(val) => setSeasonInput(prev => ({ ...prev, number: val }))}>
                <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
                  <SelectValue placeholder="Select Season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((s: any) => (
                    <SelectItem key={`s-${s.id}`} value={s.number.toString()}>Season {s.number} {s.isCurrent ? '(Active)' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="datetime-local" value={seasonInput.endDate} disabled className="h-9 text-sm sm:w-52" />
              <Button onClick={handleSetSeason} className="h-9 text-xs">Set Active</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Management Card */}
      <Card className="border-0 shadow-md rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 px-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 shrink-0">
              <Users className="w-4 h-4" /> Team Management
            </CardTitle>
            <div className="relative flex-1 max-w-md mx-auto hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" placeholder="Search teams..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative sm:hidden">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  type="text" placeholder="Search..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-28 pl-8 pr-2.5 py-1.5 text-xs bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                />
              </div>
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                <SelectTrigger className="w-36 h-8 text-xs bg-white/10 text-white border-white/20">
                  <SelectValue placeholder="Season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{`S${s.number} - ${s.year}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {filteredTeams.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">
              {teams.length === 0 ? 'No teams registered for this season.' : 'No teams match your search.'}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTeams.map((team: any, idx: number) => (
                <div
                  key={team._id}
                  onClick={() => setSelectedTeam(team)}
                  className="cursor-pointer bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className={`h-32 bg-gradient-to-br ${teamGradients[idx % teamGradients.length]} relative overflow-hidden`}>
                    {getImageUrl(team.teamLogo) ? (
                      <img src={getImageUrl(team.teamLogo)} alt={team.teamName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Shield className="w-12 h-12 text-white/60" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">{teamStatusBadge(team.status)}</div>
                  </div>
                  <div className="p-4 space-y-1.5">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{team.teamName}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5"><Shield className="w-3 h-3" /> {team.captainName || 'No captain'}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5"><Phone className="w-3 h-3" /> {team.contactNumber || '—'}</p>
                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 mt-1.5">
                      <span className="text-xs text-gray-400">{team.players?.length || 0} players</span>
                      <span className="text-xs font-mono text-gray-400">{team.teamCode || '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Detail Dialog */}
      {selectedTeam && (
        <Dialog open={!!selectedTeam} onOpenChange={(open) => { if (!open) { setSelectedTeam(null); setSelectedPlayer(null) } }}>
          <DialogContent className="max-w-4xl bg-white rounded-xl shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4" /> {selectedTeam.teamName}
                </DialogTitle>
                <div>
                  {teamStatusBadge(selectedTeam.status)}
                </div>
              </div>
              <p className="text-xs text-blue-300 mt-0.5">Team Code: {selectedTeam.teamCode || '—'}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Team Logo + Info */}
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
                    {getImageUrl(selectedTeam.teamLogo) ? (
                      <img src={getImageUrl(selectedTeam.teamLogo)} alt={selectedTeam.teamName} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="h-40 flex items-center justify-center"><Shield className="w-16 h-16 text-gray-300" /></div>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
                    {[
                      { label: 'Captain', value: selectedTeam.captainName },
                      { label: 'Contact', value: selectedTeam.contactNumber },
                      { label: 'Coach', value: selectedTeam.coachName },
                      { label: 'Manager', value: selectedTeam.managerName },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-gray-500 text-xs">{item.label}</span>
                        <span className="font-medium text-gray-800 text-xs">{item.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                  {selectedTeam.paymentReceipt && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Payment Receipt</p>
                      <button onClick={() => setZoomedImage(getImageUrl(selectedTeam.paymentReceipt))} className="w-full rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors">
                        <img src={getImageUrl(selectedTeam.paymentReceipt)} alt="Receipt" className="w-full h-24 object-cover" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Players Grid */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">Squad ({selectedTeam.players?.length || 0})</p>
                    <div className="flex gap-2">
                      <Button onClick={() => handleEditTeam(selectedTeam)} size="sm" className="text-xs h-7"><Pencil className="w-3 h-3 mr-1" /> Edit</Button>
                      <Button onClick={() => handleVerifyTeam(selectedTeam._id)} size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Verify</Button>
                      <Button onClick={() => handleRejectTeam(selectedTeam._id)} size="sm" variant="destructive" className="text-xs h-7"><XCircle className="w-3 h-3 mr-1" /> Reject</Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                    {[...selectedTeam.players]
                      .sort((a, b) => {
                        const order: any = { verified: 1, pending: 2, not_registered: 3 };
                        return (order[a.status] || 4) - (order[b.status] || 4);
                      })
                      .map((player) => (
                        <div
                          key={player._id}
                          onClick={() => setSelectedPlayer(player)}
                          className="cursor-pointer bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-blue-300 transition-all text-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                              {player.user?.profileImage ? (
                                <img src={getImageUrl(player.user.profileImage)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (player.user?.name || player.name)?.[0]?.toUpperCase() || '?'
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 text-xs truncate">{player.name || 'Unnamed'}</p>
                              <p className="text-[10px] text-gray-400">#{player.code || player.jerseyNumber || '—'}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-1.5">
                            {statusBadge(player.status)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Player Profile Dialog */}
      {selectedPlayer && (
        <Dialog open={!!selectedPlayer} onOpenChange={(open) => { if (!open) setSelectedPlayer(null) }}>
          <DialogContent className="max-w-2xl bg-white rounded-xl shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 shrink-0">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <User className="w-4 h-4" /> {selectedPlayer.user?.name || selectedPlayer.name || 'Player'}
                  </DialogTitle>
                </div>
                <p className="text-xs text-blue-300 mt-0.5">Player Code: {selectedPlayer.user?.playerCode || selectedPlayer.code || 'No Code'}</p>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="text-center space-y-3">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold mx-auto overflow-hidden">
                    {selectedPlayer.user?.profileImage ? (
                      <img src={getImageUrl(selectedPlayer.user.profileImage)} alt="" className="w-full h-full object-cover" onClick={() => setZoomedImage(getImageUrl(selectedPlayer.user.profileImage))} />
                    ) : (
                      (selectedPlayer.user?.name || selectedPlayer.name)?.[0]?.toUpperCase() || '?'
                    )}
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium capitalize">
                      {selectedPlayer.user?.position || selectedPlayer.position || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-center">{statusBadge(selectedPlayer.status)}</div>
                  <div className="space-y-1.5 text-left bg-gray-50 rounded-lg p-3 text-sm">
                    {[
                      { icon: Mail, label: 'Email', value: selectedPlayer.user?.email },
                      { icon: Phone, label: 'Phone', value: selectedPlayer.user?.phone },
                      { icon: CalendarDays, label: 'DOB', value: selectedPlayer.user?.dateOfBirth ? new Date(selectedPlayer.user.dateOfBirth).toLocaleDateString() : 'N/A' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <item.icon className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="text-gray-600">{item.label}: <strong className="text-gray-800">{item.value || 'N/A'}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-600 font-medium mb-0.5">Batting Style</p>
                      <p className="text-sm font-semibold text-gray-800">{selectedPlayer.user?.battingStyle || 'N/A'}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs text-purple-600 font-medium mb-0.5">Bowling Style</p>
                      <p className="text-sm font-semibold text-gray-800">{selectedPlayer.user?.bowlingStyle || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Bio</p>
                    <p className="text-sm text-gray-700">{selectedPlayer.user?.bio || 'No bio available.'}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Documents ({selectedPlayer.user?.documents?.length || 0})</p>
                    </div>
                    {selectedPlayer.user?.documents?.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {selectedPlayer.user.documents.map((doc: any, i: number) => (
                          <button key={i} onClick={() => { setSelectedPlayer(selectedPlayer); setZoomedDocIndex(i) }} className="aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors bg-gray-50">
                            <img src={getImageUrl(doc)} alt={`Doc ${i + 1}`} className="w-full h-full object-cover" onError={e => (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"} />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-5 bg-gray-50 rounded-lg text-sm text-gray-400"><ImageIcon className="w-4 h-4" /> No documents</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Zoom Overlay */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center cursor-zoom-out" onClick={() => setZoomedImage(null)}>
          <img src={zoomedImage} alt="Zoomed" className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
          <button onClick={() => setZoomedImage(null)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
      )}

      {/* Document Lightbox Carousel */}
      {zoomedDocIndex !== null && selectedPlayer?.user?.documents?.length > 0 && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center" onClick={() => setZoomedDocIndex(null)}>
          <div className="relative max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setZoomedDocIndex(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="relative flex items-center justify-center">
              {zoomedDocIndex > 0 && (
                <button onClick={() => setZoomedDocIndex(i => i! - 1)} className="absolute left-2 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white backdrop-blur-sm">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <img src={getImageUrl(selectedPlayer.user.documents[zoomedDocIndex])} alt={`Document ${zoomedDocIndex + 1}`} className="max-h-[80vh] w-auto rounded-lg shadow-2xl" />
              {zoomedDocIndex < selectedPlayer.user.documents.length - 1 && (
                <button onClick={() => setZoomedDocIndex(i => i! + 1)} className="absolute right-2 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white backdrop-blur-sm">
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="text-center text-sm text-white/70 mt-3">Document {zoomedDocIndex + 1} of {selectedPlayer.user.documents.length}</p>
          </div>
        </div>
      )}

      {/* Edit Team Dialog */}
      {editMode && editableTeam && (
        <Dialog open onOpenChange={() => { setEditMode(false); setEditableTeam(null) }}>
          <DialogContent className="max-w-4xl bg-white rounded-xl shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 shrink-0">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <Pencil className="w-4 h-4" /> Edit Team
                  </DialogTitle>
                </div>
                <p className="text-xs text-blue-300 mt-0.5">{editableTeam.teamName}</p>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="text-xs">Team Name</Label><Input value={editableTeam.teamName} onChange={(e) => setEditableTeam({ ...editableTeam, teamName: e.target.value })} className="h-9 text-sm" /></div>
                <div><Label className="text-xs">Captain</Label><Input value={editableTeam.captainName} onChange={(e) => setEditableTeam({ ...editableTeam, captainName: e.target.value })} className="h-9 text-sm" /></div>
                <div><Label className="text-xs">Coach</Label><Input value={editableTeam.coachName} onChange={(e) => setEditableTeam({ ...editableTeam, coachName: e.target.value })} className="h-9 text-sm" /></div>
                <div><Label className="text-xs">Manager</Label><Input value={editableTeam.managerName} onChange={(e) => setEditableTeam({ ...editableTeam, managerName: e.target.value })} className="h-9 text-sm" /></div>
                <div><Label className="text-xs">Contact</Label><Input value={editableTeam.contactNumber} onChange={(e) => setEditableTeam({ ...editableTeam, contactNumber: e.target.value })} className="h-9 text-sm" /></div>
                <div><Label className="text-xs">Team Code</Label><Input value={editableTeam.teamCode} onChange={(e) => setEditableTeam({ ...editableTeam, teamCode: e.target.value })} className="h-9 text-sm" /></div>
                <div>
                  <Label className="text-xs">Registered By</Label>
                  <Input value={editableTeam.email || ''} disabled className="h-9 text-sm bg-gray-50" />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={editableTeam.status || 'pending'} onValueChange={(val) => setEditableTeam({ ...editableTeam, status: val })}>
                    <SelectTrigger className="h-9 text-sm bg-gray-50" disabled>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-xs mb-1 block">Team Logo</Label>
                  <div className="flex items-center gap-3">
                    {editableTeam.teamLogo && <img src={getImageUrl(editableTeam.teamLogo)} alt="" className="w-16 h-16 rounded-lg border object-cover" />}
                    <Input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setEditableTeam({ ...editableTeam, teamLogo: reader.result as string }); reader.readAsDataURL(file); setLogoFile(file) }} className="h-9 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Payment Receipt</Label>
                  <div className="flex items-center gap-3">
                    {editableTeam.paymentReceipt && <img src={getImageUrl(editableTeam.paymentReceipt)} alt="" className="w-16 h-16 rounded-lg border object-cover" />}
                    <Input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setEditableTeam({ ...editableTeam, paymentReceipt: reader.result as string }); reader.readAsDataURL(file); setReceiptFile(file) }} className="h-9 text-sm" />
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Players</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {editableTeam.players?.map((player, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 p-2.5 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-[10px]">Name</Label>
                        <Input value={player.name} onChange={(e) => { const u = [...editableTeam.players]; u[index].name = e.target.value; setEditableTeam({ ...editableTeam, players: u }) }} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Role</Label>
                        <Input value={player.position} onChange={(e) => { const u = [...editableTeam.players]; u[index].position = e.target.value; setEditableTeam({ ...editableTeam, players: u }) }} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Jersey</Label>
                        <Input value={player.jerseyNumber} onChange={(e) => { const u = [...editableTeam.players]; u[index].jerseyNumber = e.target.value; setEditableTeam({ ...editableTeam, players: u }) }} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Code</Label>
                        <Input value={player.playerCode} onChange={(e) => { const u = [...editableTeam.players]; u[index].playerCode = e.target.value; setEditableTeam({ ...editableTeam, players: u }) }} className="h-8 text-xs" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="mt-5 flex gap-2">
                <Button variant="outline" onClick={() => { setEditMode(false); setEditableTeam(null) }} className="text-xs h-8">Cancel</Button>
                <Button onClick={handleUpdateTeam} className="text-xs h-8"><Save className="w-3.5 h-3.5 mr-1" /> Save Changes</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* All Seasons Modal */}
      {showSeasonModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSeasonModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3.5 flex items-center justify-between shrink-0 rounded-t-xl">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Calendar className="w-4 h-4" /> All Seasons</h2>
              <button onClick={() => setShowSeasonModal(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Season</th>
                    <th className="pb-2 font-medium">Entry Deadline</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {seasons.map((s: any, i: number) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 text-xs text-gray-400">{i + 1}</td>
                      <td className="py-2.5">
                        {editingId === s.id ? (
                          <Input value={editingSeason.number} onChange={(e) => setEditingSeason({ ...editingSeason, number: e.target.value })} className="h-7 text-xs w-24" />
                        ) : (
                          <span className="text-sm font-medium text-gray-800">Season {s.number} {s.isCurrent && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded ml-1">Active</span>}</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {editingId === s.id ? (
                          <Input type="datetime-local" value={editingSeason.endDate} onChange={(e) => setEditingSeason({ ...editingSeason, endDate: e.target.value })} className="h-7 text-xs w-44" />
                        ) : (
                          <span className="text-sm text-gray-600">{new Date(s.endDate).toLocaleString('en-IN')}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        {editingId === s.id ? (
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" onClick={handleSaveEdit} className="h-7 w-7 p-0"><Save className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 w-7 p-0"><X className="w-3.5 h-3.5" /></Button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="outline" onClick={() => handleEditClick(s)} className="h-7 w-7 p-0"><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteSeason(s.id)} className="h-7 w-7 p-0"><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;