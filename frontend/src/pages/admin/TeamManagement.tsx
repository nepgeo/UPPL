import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { Label } from '@/components/ui/label';
// import  from '@/lib/api';
import { BASE_URL ,api} from "@/lib/api";

import {
  Dialog,
  DialogTrigger,
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
import { Eye, Trash2, Pencil, Plus, Save, ImageIcon,ZoomIn,Settings ,X} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';


const TeamManagement = () => {
  const navigate = useNavigate();

  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [teams, setTeams] = useState([]);

  const [newSeason, setNewSeason] = useState({
    number: '',
    endDate: new Date().toISOString().slice(0, 16),
  });
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSeason, setEditingSeason] = useState({ number: '', endDate: ''});
  const [seasonInput, setSeasonInput] = useState({
    number: '',
    endDate: new Date().toISOString().slice(0, 16),
  });
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null as any | null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [editableTeam, setEditableTeam] = useState(null as Team | null);

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
const [logoFile, setLogoFile] = useState<File | null>(null); // if not already declared




  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    if (selectedSeasonId) fetchTeamsBySeason(selectedSeasonId);
  }, [selectedSeasonId]);


  const fetchSeasons = async () => {
    try {
      const token = localStorage.getItem('pplt20_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const res = await api.get('/seasons', config);
      console.log('📅 Raw seasons from API:', res.data); 
      const mapped = res.data.map((s) => ({
        id: s._id,
        number: s.seasonNumber,
        year: new Date(s.entryDeadline).getFullYear(),
        endDate: s.entryDeadline,
        isCurrent: s.isCurrent,
      }));

      setSeasons(mapped);

      const current = mapped.find((s) => s.isCurrent);
      if (current) {
        setSelectedSeasonId(current.id);
        setSeasonInput({
          number: current.number.toString(),
          endDate: new Date(current.endDate).toISOString().slice(0, 16),
        });
      } else if (mapped.length > 0) {
        const first = mapped[0];
        setSelectedSeasonId(first.id);
        setSeasonInput({
          number: first.number.toString(),
          endDate: new Date(first.endDate).toISOString().slice(0, 16),
        });
      }
    } catch (err) {
      console.error('❌ Failed to load seasons:', err);
    }
  };






  const fetchTeamsBySeason = async (seasonId: string) => {
    try {
      const token = localStorage.getItem('pplt20_token'); // or your actual token key

      const res = await api.get(`/teams?seasonId=${seasonId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`👥 Teams for season ${seasonId}:`, res.data); 

      setTeams(res.data);
    } catch (err) {
      console.error('Failed to load teams', err);
    }
  };


  

  const handleCreateSeason = async () => {
    if (!newSeason.number || !newSeason.endDate) {
      return alert('All fields are required');
    }

    try {
      const token = localStorage.getItem('pplt20_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        seasonNumber: Number(newSeason.number),
        entryDeadline: newSeason.endDate,
      };

      await api.post('/seasons', payload, config);

      await fetchSeasons(); // Refresh updated seasons list
      setNewSeason({
        number: '',
        endDate: new Date().toISOString().slice(0, 16),
      });
      alert('✅ Season created!');
    } catch (err) {
      console.error('❌ Failed to create season:', err);
      alert('❌ Failed to create season');
    }
  };


  const handleDeleteSeason = async (id: string) => {
    if (!window.confirm('Delete this season?')) return;

    try {
      const token = localStorage.getItem('pplt20_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await api.delete(`/seasons/${id}`, config);

      await fetchSeasons(); // Refresh after delete
      if (id === selectedSeasonId) {
        setSelectedSeasonId('');
        setTeams([]);
      }
      alert('🗑️ Season deleted successfully!');
    } catch (err) {
      console.error('❌ Failed to delete season:', err);
      alert('❌ Could not delete season');
    }
  };


  const handleEditClick = (season: { id: string; number: number; endDate: string }) => {
    setEditingId(season.id);
    setEditingSeason({
      number: season.number.toString(),
      endDate: new Date(season.endDate).toISOString().slice(0, 16),
    });
  };


  const handleSaveEdit = async () => {
    if (!editingSeason.number || !editingSeason.endDate) {
      alert('All fields are required');
      return;
    }

    try {
      const token = localStorage.getItem('pplt20_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        seasonNumber: Number(editingSeason.number),
        entryDeadline: editingSeason.endDate,
      };

      await api.put(`/seasons/${editingId}`, payload, config);

      await fetchSeasons(); // refresh list
      setEditingId(null);
      alert('✅ Season updated successfully!');
    } catch (err) {
      console.error('❌ Failed to update season:', err);
      alert('❌ Failed to update season');
    }
  };



  const handleSetSeason = async () => {
    const found = seasons.find((s) => s.number === Number(seasonInput.number));
    if (!found) return alert('Season not found');

    try {
      const token = localStorage.getItem('pplt20_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Only mark the season as current (no entryDeadline update now)
      await api.put(`/seasons/${found.id}/set-current`, {}, config);

      await fetchSeasons();
      setSelectedSeasonId(found.id);

      alert('✅ Season set as current!');
    } catch (error) {
      console.error('❌ Failed to set season:', error);
      alert('❌ Failed to update season');
    }
  };
  
  
  
  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId);

  const handleUpdateTeam = async () => {
  try {
    const token = localStorage.getItem('pplt20_token');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    };

    const formData = new FormData();

    formData.append('teamName', editableTeam.teamName || '');
    formData.append('coachName', editableTeam.coachName || '');
    formData.append('captainName', editableTeam.captainName || '');
    formData.append('managerName', editableTeam.managerName || '');
    formData.append('contactNumber', editableTeam.contactNumber || '');

    if (logoFile) {
      formData.append('teamLogo', logoFile);
    }

    if (receiptFile) {
      formData.append('paymentReceipt', receiptFile);
    }

    const playersWithCode = editableTeam.players.map((p) => ({
      ...p,
      playerCode: p.playerCode || p.code || '',
    }));

    formData.append('players', JSON.stringify(playersWithCode));

    await api.put(
      `/teams/${editableTeam._id}`,
      formData,
      config
    );

    const res = await api.get(
      `/teams/${editableTeam._id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setEditableTeam(res.data);
    setSelectedTeam(res.data); // ✅ this is the key fix
    setEditMode(false);

    await fetchTeamsBySeason(selectedSeasonId);
    alert('✅ Team updated successfully');
  } catch (err) {
    console.error('❌ Failed to update team:', err);
    alert('❌ Failed to update team');
  }
};




const handleEditTeam = (team: any) => {
  const formattedPlayers = team.players?.map((p: any) => ({
    name: p.name || p.user?.name || '',
    position: p.position || p.user?.position || '',
    jerseyNumber: p.jerseyNumber?.toString() || '',
    playerCode: p.code || p.playerCode || p.user?.playerCode || '',
    code: p.code || '',          // include actual code field
    user: p.user || null,        // include full user object
    status: p.status || 'not_registered', // preserve status
    _id: p._id || undefined,     // optional: preserve for tracking
  })) || [];

  setEditableTeam({
    teamName: team.teamName || '',
    coachName: team.coachName || '',
    managerName: team.managerName || '',
    captainName: team.captainName || '',
    contactNumber: team.contactNumber || '',
    teamCode: team.teamCode || '',
    status: team.status || 'pending',
    email: team.createdBy?.email || '',
    teamLogo: team.teamLogo
      ? `${BASE_URL}/${team.teamLogo.replace(/\\/g, '/')}`
      : '',
    paymentReceipt: team.paymentReceipt
      ? `${BASE_URL}/${team.paymentReceipt.replace(/\\/g, '/')}`
      : '',
    players: formattedPlayers,
    _id: team._id,
  });

  setEditMode(true);
};

  const handleVerifyTeam = async (teamId: string) => {
    try {
      const token = localStorage.getItem('pplt20_token');
      const res = await api.patch(`/teams/${teamId}/verify`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert(res.data.message || 'Team verified successfully');
      await fetchTeamsBySeason(selectedSeasonId); // refresh team list
    } catch (err) {
      console.error('❌ Failed to verify team:', err);
      alert('Failed to verify team');
    }
  };


  const handleRejectTeam = async (teamId: string) => {
    try {
      const token = localStorage.getItem('pplt20_token');
      const res = await api.patch(`/teams/${teamId}/reject`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert(res.data.message || 'Team rejected');
      await fetchTeamsBySeason(selectedSeasonId);
    } catch (err) {
      console.error('❌ Failed to reject team:', err);
      alert('Failed to reject team');
    }
  };



  return (
    <div className="p-6 space-y-6">
      {/* Season Management */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Seasons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Season Number"
              value={newSeason.number}
              onChange={(e) => setNewSeason({ ...newSeason, number: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Team Entry Date:
              </label>
              <Input
                type="datetime-local"
                value={newSeason.endDate}
                onChange={(e) =>
                  setNewSeason({
                    ...newSeason,
                    endDate: e.target.value,
                    year: new Date(e.target.value).getFullYear().toString(), // auto-set year
                  })
                }
                className="min-w-[240px]"
                title="Entry Ends"
              />
            </div>

            <Button onClick={handleCreateSeason}>
              <Plus className="h-4 w-4 mr-1" /> Add Season
            </Button>
            <Button variant="outline" onClick={() => setShowSeasonModal(true)}>
              View All Seasons
            </Button>
          </div>

          <div className="pt-2 space-y-4">
            <p className="text-sm text-muted-foreground font-medium">Set Active Season</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={seasonInput.number}
                onValueChange={(val) => setSeasonInput((prev) => ({ ...prev, number: val }))}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select Season Number" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((s) => (
                    <SelectItem key={`season-${s.id}`} value={s.number.toString()}>
                      Season {s.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-4 ml-auto">
                <label className="text-sm">Entry Ends:</label>
                <Input
                  type="datetime-local"
                  className="w-[220px]"
                  value={seasonInput.endDate}
                  disabled // 🔒 Make it read-only
                />
              </div>

              <Button onClick={handleSetSeason}>Set</Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Team View Section */}
      <Card>
  <Card>
  <CardHeader className="flex flex-col sm:flex-row justify-between items-center gap-4">
    <CardTitle className="text-2xl">Team Management</CardTitle>
    <div className="flex items-center gap-4">
      <span>Season:</span>
      <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Select Season" />
        </SelectTrigger>
        <SelectContent>
          {seasons.map((s) => (
            <SelectItem key={s.id} value={s.id}>{`S${s.number} - ${s.year}`}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => alert("Show Add Team Modal")}>
            <Plus className="w-4 h-4 mr-2" /> Add Team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </CardHeader>

  <CardContent>
    {teams.length === 0 ? (
      <p className="text-center text-muted-foreground py-8">
        No teams registered for Season {selectedSeason?.year}.
      </p>
    ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <div
            key={team._id}
            className="cursor-pointer transition-transform transform hover:scale-[1.02] bg-white rounded-xl shadow p-4 border"
            onClick={() => setSelectedTeam(team)}
          >
            <div className="w-full h-32 overflow-hidden rounded-md mb-3">
              <img
                src={team.teamLogo}
                alt={team.teamName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <h2 className="font-bold text-lg">{team.teamName}</h2>
              <p className="text-sm text-muted-foreground">{team.captainName}</p>
              <p className="text-sm text-muted-foreground">{team.contactNumber}</p>
              <p className="text-sm mt-1">{team.players.length} Players</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </CardContent>

  {selectedTeam && (
    <Dialog open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
      <DialogContent className="max-w-5xl w-full rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-semibold">{selectedTeam.teamName}</DialogTitle>
        </DialogHeader>

        {/* Team Logo */}
        <div className="w-full h-64 overflow-hidden rounded-xl mb-6 shadow">
          <img
            src={selectedTeam.teamLogo}
            alt={selectedTeam.teamName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Team Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-base">
          <div className="space-y-1.5">
            <p><strong>Captain:</strong> {selectedTeam.captainName || "—"}</p>
            <p><strong>Contact:</strong> {selectedTeam.contactNumber || "—"}</p>
            <p><strong>Team Code:</strong> {selectedTeam.teamCode || "—"}</p>
            <p>
              <strong>Season:</strong>{" "}
              {selectedTeam.season?.number && selectedTeam.season?.year
                ? `S${selectedTeam.season.number} - ${selectedTeam.season.year}`
                : "—"}
            </p>
            <p><strong>Status:</strong> {selectedTeam.status || "—"}</p>
          </div>
          <div className="space-y-1.5">
            <p><strong>Coach:</strong> {selectedTeam.coachName || "—"}</p>
            <p><strong>Manager:</strong> {selectedTeam.managerName || "—"}</p>
            <p><strong>Total Players:</strong> {selectedTeam.players?.length ?? "0"}</p>
            <p>
              <strong>Created By:</strong>{" "}
              {selectedTeam.createdBy?.name || selectedTeam.createdBy || "—"}
            </p>
            <p>
              <strong>Created At:</strong>{" "}
              {selectedTeam.createdAt
                ? new Date(selectedTeam.createdAt).toLocaleString()
                : "—"}
            </p>
          </div>
        </div>


        {/* Player List */}
          <div className="mt-6">
    <h3 className="text-lg font-semibold mb-2">Players</h3>

    {/* Warning for unnamed */}
    {selectedTeam.players.filter((p) => !p.name).length >= 3 && (
      <p className="text-sm text-red-500 mb-2">
        ⚠️ Multiple unnamed players. Please complete player registrations.
      </p>
    )}

    <div className="max-h-[400px] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[...selectedTeam.players]
          .sort((a, b) => {
            const statusOrder = { verified: 1, pending: 2, not_registered: 3 };
            return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
          })
          .map((player) => (
            <div
              key={player._id}
              onClick={() => setSelectedPlayer(player)}
              className="cursor-pointer bg-white border rounded-lg p-3 shadow hover:shadow-md transition text-[13px]"
            >
              <div className="flex items-center gap-2">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold overflow-hidden">
                  {player.user?.profileImage ? (
                    <img
                      src={
                        player.user.profileImage.startsWith('http')
                          ? player.user.profileImage
                          : `${BASE_URL}/${player.user.profileImage
                              .replace(/^\/+/, '')
                              .replace(/\\/g, '/')}`
                      }
                      alt={player.user.name || player.name || 'Player'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/default-avatar.png';
                      }}
                    />
                  ) : (
                    <span>
                      {player.user?.name?.[0]?.toUpperCase() ||
                        player.name?.[0]?.toUpperCase() ||
                        '?'}
                    </span>
                  )}
                </div>

                {/* Name + Code */}
                <div>
                  <p className="font-medium">{player.name || 'Unnamed'}</p>
                  <p className="text-muted-foreground text-xs">
                    Code: {player.code || '—'}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="mt-2">
                <span
                  className={`inline-block text-[11px] px-2 py-0.5 rounded text-white ${
                    player.status === 'verified'
                      ? 'bg-green-500'
                      : player.status === 'pending'
                      ? 'bg-yellow-500'
                      : 'bg-gray-400'
                  }`}
                >
                  {player.status}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  </div>

        
        {selectedPlayer && (
          <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
            <DialogContent className="max-w-3xl w-full h-[90vh] overflow-y-auto p-6 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  {selectedPlayer.user?.name || "Unnamed Player"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Player Code:{" "}
                  <span className="font-medium">
                    {selectedPlayer.user?.playerCode || "No Code Assigned"}
                  </span>
                </p>
              </DialogHeader>

              {/* Player Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedPlayer.user?.email || "No Email Provided"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{selectedPlayer.user?.phone || "No Contact Number"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <span
                    className={`inline-block px-2 py-0.5 mt-1 rounded text-white text-xs font-semibold ${
                      selectedPlayer.status === "verified"
                        ? "bg-green-500"
                        : selectedPlayer.status === "pending"
                        ? "bg-yellow-500"
                        : "bg-gray-400"
                    }`}
                  >
                    {selectedPlayer.status || "not_registered"}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">
                    {selectedPlayer.user?.role || "No Role Assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Position</p>
                  <p className="font-medium capitalize">
                    {selectedPlayer.user?.position || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {selectedPlayer.user?.dateOfBirth
                      ? new Date(selectedPlayer.user.dateOfBirth).toLocaleDateString()
                      : "Not Provided"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Batting Style</p>
                  <p className="font-medium">
                    {selectedPlayer.user?.battingStyle || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bowling Style</p>
                  <p className="font-medium">
                    {selectedPlayer.user?.bowlingStyle || "Not specified"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground">Bio</p>
                  <p className="font-medium whitespace-pre-line">
                    {selectedPlayer.user?.bio || "No bio available"}
                  </p>
                </div>
              </div>

              {/* Player Photo */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-2">Player Photo</h4>
                {selectedPlayer.user?.profileImage ? (
                  <img
                    src={selectedPlayer.user.profileImage}
                    alt="Player"
                    className="w-full max-w-sm rounded-lg border shadow-md cursor-pointer hover:scale-105 transition"
                    onClick={() => setZoomedImage(selectedPlayer.user.profileImage)}
                  />
                ) : (
                  <div className="w-full max-w-sm h-48 flex items-center justify-center border border-dashed rounded-lg text-sm text-muted-foreground bg-gray-100">
                    No photo uploaded
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-2">Documents</h4>
                {selectedPlayer.user?.documents?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedPlayer.user.documents.map((doc: string, idx: number) => (
                      <img
                        key={idx}
                        src={doc}
                        alt={`Document ${idx + 1}`}
                        className="w-full h-32 object-cover rounded shadow cursor-pointer hover:scale-105 transition"
                        onClick={() => setZoomedImage(doc)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No documents uploaded.</div>
                )}
              </div>

              {/* Admin Actions */}
              <div className="mt-8 flex justify-end gap-3">
                <Button>Edit</Button>
                <Button
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-100"
                >
                  Verify
                </Button>
                <Button variant="destructive">Reject</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}


        {zoomedImage && (
          <Dialog open onOpenChange={() => setZoomedImage(null)}>
            <DialogContent
              className="p-0 bg-black/95 max-w-[95vw] max-h-[95vh] flex items-center justify-center"
            >
              {/* Close button */}
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute top-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full shadow-md z-50"
                aria-label="Close"
              >
                <X size={22} className="text-gray-700" />
              </button>

              {/* Image */}
              <img
                src={zoomedImage}
                alt="Zoomed"
                className="
                  max-h-[90vh] max-w-[90vw]
                  md:max-h-[85vh] md:max-w-[80vw]
                  lg:max-h-[90vh] lg:max-w-[70vw]
                  object-contain rounded-lg shadow-lg
                "
              />
            </DialogContent>
          </Dialog>
        )}


        {/* Payment Receipt */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Payment Receipt</h3>

          {selectedTeam.paymentReceipt ? (
            <div
              className="relative w-48 h-48 border-2 border-dashed border-slate-300 rounded-lg overflow-hidden cursor-pointer group"
              onClick={() =>
                setZoomedImage(
                  selectedTeam.paymentReceipt.startsWith("http")
                    ? selectedTeam.paymentReceipt
                    : `${BASE_URL}/${selectedTeam.paymentReceipt.replace(/\\/g, "/")}`
                )
              }
            >
              <img
                src={
                  selectedTeam.paymentReceipt.startsWith("http")
                    ? selectedTeam.paymentReceipt
                    : `${BASE_URL}/${selectedTeam.paymentReceipt.replace(/\\/g, "/")}`
                }
                alt="Payment Receipt"
                className="w-full h-full object-contain p-2 transition-transform group-hover:scale-105"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
              </div>
            </div>
          ) : (
            <div className="w-48 h-48 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-sm bg-gray-50">
              <ImageIcon size={24} />
              No receipt uploaded
            </div>
          )}
        </div>



        {/* Actions */}
        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button onClick={() => {
            setEditMode(true);
            setEditableTeam(selectedTeam); // prefill
          }}>
            Edit
          </Button>
          <Button
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-100"
            // disabled={selectedTeam.players.some((p) => p.status === "not_registered")}
            onClick={() => handleVerifyTeam(selectedTeam._id)}
          >
            Verify
          </Button>
          <Button
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-100"
            onClick={() => handleRejectTeam(selectedTeam._id)}
          >
            Reject
          </Button>

        </DialogFooter>
      </DialogContent>
    </Dialog>
  )}
</Card>

</Card>

      {editMode && editableTeam && (
        <Dialog
          open
          onOpenChange={() => {
            setEditMode(false);
            setEditableTeam(null);
          }}
        >
          <DialogContent className="max-w-5xl w-full rounded-2xl p-6 h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Edit Team</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Update full team details including squad and documents.
              </DialogDescription>
            </DialogHeader>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={editableTeam.teamName}
                  onChange={(e) => setEditableTeam({ ...editableTeam, teamName: e.target.value })}
                  placeholder="Team Name"
                />
              </div>
              <div>
                <Label htmlFor="coachName">Coach Name</Label>
                <Input
                  id="coachName"
                  value={editableTeam.coachName}
                  onChange={(e) => setEditableTeam({ ...editableTeam, coachName: e.target.value })}
                  placeholder="Coach Name"
                />
              </div>
              <div>
                <Label htmlFor="captainName">Captain Name</Label>
                <Input
                  id="captainName"
                  value={editableTeam.captainName}
                  onChange={(e) => setEditableTeam({ ...editableTeam, captainName: e.target.value })}
                  placeholder="Captain Name"
                />
              </div>
              <div>
                <Label htmlFor="managerName">Manager Name</Label>
                <Input
                  id="managerName"
                  value={editableTeam.managerName}
                  onChange={(e) => setEditableTeam({ ...editableTeam, managerName: e.target.value })}
                  placeholder="Manager Name"
                />
              </div>
              <div>
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  value={editableTeam.contactNumber}
                  onChange={(e) => setEditableTeam({ ...editableTeam, contactNumber: e.target.value })}
                  placeholder="Contact Number"
                />
              </div>
              <div>
                <Label htmlFor="email">Registered By</Label>
                <Input
                  id="email"
                  value={editableTeam.email || ''}
                  disabled
                  placeholder="Creator's Email"
                  className="bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <Label htmlFor="teamCode">Team Code</Label>
                <Input
                  id="teamCode"
                  value={editableTeam.teamCode}
                  onChange={(e) => setEditableTeam({ ...editableTeam, teamCode: e.target.value })}
                  placeholder="Team Code"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editableTeam.status || 'pending'}
                  onValueChange={(val) => setEditableTeam({ ...editableTeam, status: val })}
                  disabled // ✅ disables the dropdown
                >
                  <SelectTrigger id="status" className="bg-gray-100 cursor-not-allowed">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>

            {/* Team Logo */}
            <div className="mt-6">
              <Label className="block mb-2" htmlFor="teamLogo">Team Logo</Label>
              <div className="flex items-center gap-4">
                {editableTeam.teamLogo && (
                  <img
                    src={
                      typeof editableTeam.teamLogo === 'string'
                        ? editableTeam.teamLogo.startsWith('data:')
                          ? editableTeam.teamLogo
                          : `${BASE_URL}/${editableTeam.teamLogo.replace(/\\\\/g, '/').replace(/\\/g, '/')}`
                        : ''
                    }
                    alt="Team Logo"
                    className="w-20 h-20 rounded-lg border object-cover"
                  />
                )}
                <Input
                  type="file"
                  id="teamLogo"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      setEditableTeam({ ...editableTeam, teamLogo: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                    setLogoFile(file);
                  }}
                />
              </div>
            </div>

            {/* Payment Receipt */}
            <div className="mt-6">
              <Label className="block mb-2" htmlFor="paymentReceipt">Payment Receipt</Label>
              <div className="flex items-center gap-4">
                {editableTeam.paymentReceipt && (
                  <img
                    src={
                      typeof editableTeam.paymentReceipt === 'string'
                        ? editableTeam.paymentReceipt.startsWith('data:')
                          ? editableTeam.paymentReceipt
                          : `${BASE_URL}/${editableTeam.paymentReceipt.replace(/\\/g, '/')}`
                        : ''
                    }
                    alt="Receipt"
                    className="w-20 h-20 rounded-lg border object-cover"
                  />
                )}
                <Input
                  type="file"
                  id="paymentReceipt"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      setEditableTeam({ ...editableTeam, paymentReceipt: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                    setReceiptFile(file);
                  }}
                />
              </div>
            </div>

            {/* Squad Details */}
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-2">Players</h4>
              {editableTeam.players?.map((player, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
                  <div>
                    <Label htmlFor={`player-name-${index}`}>Name</Label>
                    <Input
                      id={`player-name-${index}`}
                      placeholder={`Player ${index + 1} Name`}
                      value={player.name}
                      onChange={(e) => {
                        const updated = [...editableTeam.players];
                        updated[index].name = e.target.value;
                        setEditableTeam({ ...editableTeam, players: updated });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`player-role-${index}`}>Role</Label>
                    <Input
                      id={`player-role-${index}`}
                      placeholder="Role"
                      value={player.position}
                      onChange={(e) => {
                        const updated = [...editableTeam.players];
                        updated[index].position = e.target.value;
                        setEditableTeam({ ...editableTeam, players: updated });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`player-jersey-${index}`}>Jersey No</Label>
                    <Input
                      id={`player-jersey-${index}`}
                      placeholder="Jersey Number"
                      value={player.jerseyNumber}
                      onChange={(e) => {
                        const updated = [...editableTeam.players];
                        updated[index].jerseyNumber = e.target.value;
                        setEditableTeam({ ...editableTeam, players: updated });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`player-code-${index}`}>Player Code</Label>
                    <Input
                      id={`player-code-${index}`}
                      placeholder="Player Code"
                      value={player.playerCode}
                      onChange={(e) => {
                        const updated = [...editableTeam.players];
                        updated[index].playerCode = e.target.value;
                        setEditableTeam({ ...editableTeam, players: updated });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
              <Button onClick={handleUpdateTeam}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}





      {/* View All Seasons Modal */}
      {showSeasonModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">All Seasons</h2>
              <Button size="sm" onClick={() => setShowSeasonModal(false)}>
                Close
              </Button>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b font-semibold text-slate-700">
                  <tr>
                    <th className="py-2">#</th>
                    <th className="py-2">Season Number</th>
                    <th className="py-2">Ends On</th>
                    <th className="py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {seasons.map((s, i) => (
                    <tr key={s.id} className="border-b hover:bg-slate-50">
                      <td className="py-2">{i + 1}</td>

                      {/* Season Number */}
                      <td className="py-2">
                        {editingId === s.id ? (
                          <Input
                            value={editingSeason.number}
                            onChange={(e) =>
                              setEditingSeason({ ...editingSeason, number: e.target.value })
                            }
                            className="h-8 text-sm"
                          />
                        ) : (
                          `Season ${s.number}`
                        )}
                      </td>

                      {/* Ends On */}
                      <td className="py-2 text-sm text-gray-700">
                        {editingId === s.id ? (
                          <Input
                            type="datetime-local"
                            className="h-8 text-sm"
                            value={editingSeason.endDate}
                            onChange={(e) =>
                              setEditingSeason({ ...editingSeason, endDate: e.target.value })
                            }
                          />
                        ) : (
                          new Date(s.endDate).toLocaleString()
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2 text-center">
                        {editingId === s.id ? (
                          <Button size="icon" variant="default" onClick={handleSaveEdit}>
                            <Save className="w-4 h-4" />
                          </Button>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleEditClick(s)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => handleDeleteSeason(s.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
