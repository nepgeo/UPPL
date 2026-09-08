import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserCheck, CheckCircle, XCircle, Phone, CalendarDays, Mail, User, FileText, X, FileX, Search, ArrowUpDown, Shield, ChevronLeft, ChevronRight, CheckSquare, Square, AlertTriangle, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminDashboard } from "@/services/adminService";
import { approvePlayer, rejectPlayer } from "@/services/playerVerificationService";
import BatIcon from "@/assets/icons/bat.png";
import BallIcon from "@/assets/icons/ball.png";
import AllRounderIcon from "@/assets/icons/all.png";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BASE_URL } from '@/config';

const getProfileImageUrl = (img: any): string => {
  if (!img) return `${BASE_URL}/favicon.png`;
  if (typeof img === "string") {
    if (img.startsWith("data:") || img.startsWith("http://") || img.startsWith("https://")) return img;
    return `${BASE_URL}/${img.replace(/\\/g, "/")}`;
  }
  if (typeof img === "object") {
    return img.secure_url || img.url || `${BASE_URL}/favicon.png`;
  }
  return `${BASE_URL}/favicon.png`;
};

const roleIcon = (role?: string) => {
  const r = (role || "").toLowerCase();
  if (r === "batsman") return <img src={BatIcon} alt="" className="w-4 h-4" />;
  if (r === "bowler") return <img src={BallIcon} alt="" className="w-4 h-4" />;
  if (r === "all-rounder") return <img src={AllRounderIcon} alt="" className="w-4 h-4" />;
  if (["wicketkeeper", "wicket-keeper", "wk"].includes(r)) return <Shield className="w-4 h-4" />;
  return null;
};

const positions = ["All", "Batsman", "Bowler", "All-Rounder", "Wicketkeeper"];

const PlayerVerification = () => {
  const { user } = useAuth();
  const [pendingPlayers, setPendingPlayers] = useState<any[]>([]);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [sortKey, setSortKey] = useState("submittedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmPlayerId, setConfirmPlayerId] = useState<string | null>(null);
  const [rejectingPlayer, setRejectingPlayer] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [docIndex, setDocIndex] = useState<number | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const perPage = 6;

  useEffect(() => { fetchPendingPlayers() }, []);

  const fetchPendingPlayers = async () => {
    try {
      const res = await getAdminDashboard();
      const normalized = (res.pendingPlayersList ?? []).map((p: any) => ({
        id: p.id || p._id || p.userId,
        name: p.name ?? "Unknown",
        email: p.email ?? "No Email",
        phone: p.phone ?? "N/A",
        bio: p.bio ?? "",
        position: p.position ?? "Unknown",
        battingStyle: p.battingStyle ?? "N/A",
        bowlingStyle: p.bowlingStyle ?? "N/A",
        profilePicture: p.profileImage ?? "",
        submittedAt: p.submittedAt ?? new Date().toISOString(),
        documents: p.documents ?? [],
        role: p.role ?? "player",
      }));
      setPendingPlayers(normalized);
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Failed to fetch players", err);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approvePlayer(id);
      toast({ title: "Approved", description: "Player verified successfully" });
      await fetchPendingPlayers();
      setPage(1);
    } catch {
      toast({ title: "Error", description: "Failed to approve", variant: "destructive" });
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    try {
      await rejectPlayer(id, reason);
      toast({ title: "Rejected", description: "Player has been rejected" });
      await fetchPendingPlayers();
      setPage(1);
    } catch {
      toast({ title: "Error", description: "Failed to reject", variant: "destructive" });
    }
  };

  const handleBulkApprove = async () => {
    setBulkLoading(true);
    for (const id of selectedIds) {
      try { await approvePlayer(id) } catch { /* skip */ }
    }
    toast({ title: "Bulk Approve", description: `${selectedIds.size} player(s) approved` });
    await fetchPendingPlayers();
    setBulkLoading(false);
  };

  const handleBulkReject = async () => {
    setBulkLoading(true);
    for (const id of selectedIds) {
      try { await rejectPlayer(id) } catch { /* skip */ }
    }
    toast({ title: "Bulk Reject", description: `${selectedIds.size} player(s) rejected` });
    await fetchPendingPlayers();
    setBulkLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === display.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(display.map(p => p.id)));
    }
  };

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = React.useMemo(() => {
    const list = [...pendingPlayers];
    if (!sortKey) return list;
    list.sort((a, b) => {
      if (sortKey === "submittedAt") {
        const d = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        return sortDir === "asc" ? d : -d;
      }
      const av = (a[sortKey] ?? "").toString().toLowerCase();
      const bv = (b[sortKey] ?? "").toString().toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [pendingPlayers, sortKey, sortDir]);

  const filtered = sorted.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === "All" ||
      p.position.toLowerCase() === positionFilter.toLowerCase();
    return matchesSearch && matchesPosition;
  });

  useEffect(() => { setPage(1) }, [searchTerm, positionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const display = filtered.slice((page - 1) * perPage, page * perPage);
  const selectedPlayer = pendingPlayers.find(p => p.id === expandedPlayerId) || null;

  if (user?.role !== "admin" && user?.role !== "super-admin") {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="p-8 text-center max-w-md">
          <CardContent>
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-1">Access Denied</h2>
            <p className="text-sm text-gray-500">You don't have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-6 -mb-6" />
          <div className="relative">
            <p className="text-3xl font-bold">{pendingPlayers.length}</p>
            <p className="text-sm text-white/80 mt-1">Pending Verification</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-5 text-white shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
          <div className="relative">
            <p className="text-3xl font-bold">{selectedIds.size}</p>
            <p className="text-sm text-white/80 mt-1">Selected</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-5 text-white shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
          <div className="relative">
            <p className="text-3xl font-bold">{filtered.length}</p>
            <p className="text-sm text-white/80 mt-1">Total Filtered</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search players by name or email..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full sm:w-40 h-10 rounded-xl">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                {positions.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={fetchPendingPlayers}
              className="h-10 px-4 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Refresh
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
              {selectedIds.size}
            </div>
            <span className="text-sm font-medium text-blue-800">players selected</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              onClick={handleBulkApprove}
              disabled={bulkLoading}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white text-xs h-9 rounded-xl px-4"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" /> Approve All
            </Button>
            <Button
              onClick={handleBulkReject}
              disabled={bulkLoading}
              size="sm"
              variant="destructive"
              className="text-xs h-9 rounded-xl px-4"
            >
              <XCircle className="w-4 h-4 mr-1.5" /> Reject All
            </Button>
            <Button
              onClick={() => setSelectedIds(new Set())}
              size="sm"
              variant="ghost"
              className="text-xs h-9 text-gray-500 rounded-xl"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Player Cards Grid */}
      {display.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No pending players found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {display.map((player) => (
            <div
              key={player.id}
              className={`group relative bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                selectedIds.has(player.id) ? "ring-2 ring-blue-500 border-blue-300" : ""
              }`}
            >
              {/* Select Checkbox */}
              <div className="absolute top-3 left-3 z-10">
                <button
                  onClick={() => toggleSelect(player.id)}
                  className="w-6 h-6 rounded-lg bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  {selectedIds.has(player.id) ? (
                    <CheckSquare className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-300" />
                  )}
                </button>
              </div>

              {/* Card Header */}
              <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-5 py-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRoMnYyaC0yem0wLThoMnYyaC0yek0yMCAzNGgydjJoLTJ6bTAtOGgydjJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                <div className="relative flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-lg shrink-0">
                    {player.profilePicture ? (
                      <img src={getProfileImageUrl(player.profilePicture)} alt="" className="w-full h-full object-contain" />
                    ) : (
                      player.name.charAt(0)?.toUpperCase() || "?"
                    )}
                  </div>
                  <div className="min-w-0">
                    <button
                      onClick={() => setExpandedPlayerId(player.id)}
                      className="text-lg font-bold text-white hover:text-white/90 transition-colors text-left truncate block w-full"
                    >
                      {player.name}
                    </button>
                    <div className="flex items-center gap-2 mt-1">
                      {roleIcon(player.position)}
                      <span className="text-sm text-white/80">{player.position}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{player.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{player.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>Submitted {new Date(player.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Button
                    onClick={() => setConfirmPlayerId(player.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-9 rounded-xl"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" /> Accept
                  </Button>
                  <Button
                    onClick={() => setRejectingPlayer({ id: player.id })}
                    variant="destructive"
                    className="flex-1 text-xs h-9 rounded-xl"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-9 rounded-xl px-4">
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                  p === page
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-9 rounded-xl px-4">
            Next
          </Button>
        </div>
      )}

      {/* Player Detail Dialog */}
      {selectedPlayer && (
        <Dialog open={!!expandedPlayerId} onOpenChange={() => setExpandedPlayerId(null)}>
          <DialogContent className="max-w-3xl bg-white rounded-2xl shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Hero Header */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-6 py-8 shrink-0">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRoMnYyaC0yem0wLThoMnYyaC0yek0yMCAzNGgydjJoLTJ6bTAtOGgydjJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
              <div className="relative flex items-end gap-5">
                <div className="w-28 h-28 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white text-4xl font-bold overflow-hidden shadow-xl shrink-0">
                  {selectedPlayer.profilePicture ? (
                    <img src={getProfileImageUrl(selectedPlayer.profilePicture)} alt="" className="w-full h-full object-contain" />
                  ) : (
                    selectedPlayer.name.charAt(0)?.toUpperCase() || "?"
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <h2 className="text-2xl font-bold text-white truncate">{selectedPlayer.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm capitalize">
                      {selectedPlayer.position}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/80 text-white backdrop-blur-sm">
                      Pending Review
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Quick Info Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100 border-b">
                {[
                  { label: 'Email', value: selectedPlayer.email, icon: Mail },
                  { label: 'Phone', value: selectedPlayer.phone, icon: Phone },
                  { label: 'Submitted', value: new Date(selectedPlayer.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), icon: CalendarDays },
                  { label: 'Role', value: selectedPlayer.role, icon: User },
                ].map((item, i) => (
                  <div key={i} className="bg-white p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
                      <p className="text-xs font-medium text-gray-800 truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 space-y-5">
                {/* Playing Style */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Playing Style</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-6 -mt-6" />
                      <p className="text-xs text-blue-600 font-medium mb-1">Batting Style</p>
                      <p className="text-sm font-bold text-gray-800">{selectedPlayer.battingStyle}</p>
                    </div>
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 p-4">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -mr-6 -mt-6" />
                      <p className="text-xs text-purple-600 font-medium mb-1">Bowling Style</p>
                      <p className="text-sm font-bold text-gray-800">{selectedPlayer.bowlingStyle}</p>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">About</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedPlayer.bio && selectedPlayer.bio !== "N/A" ? selectedPlayer.bio : "No bio provided."}</p>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Documents ({selectedPlayer.documents?.length || 0})
                  </h3>
                  {selectedPlayer.documents?.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {selectedPlayer.documents.map((doc: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => setDocIndex(i)}
                          className="aspect-[4/3] rounded-xl overflow-hidden border-2 border-gray-100 hover:border-indigo-400 hover:shadow-md transition-all duration-200 bg-gray-50 group"
                        >
                          <img
                            src={getProfileImageUrl(doc)}
                            alt={`Doc ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={e => ((e.currentTarget as HTMLImageElement).src = "/placeholder.svg")}
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400">
                      <FileX className="w-5 h-5" /> No documents uploaded
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <Button
                    onClick={() => { setExpandedPlayerId(null); setConfirmPlayerId(selectedPlayer.id) }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm h-10 rounded-xl"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve Player
                  </Button>
                  <Button
                    onClick={() => { setExpandedPlayerId(null); setRejectingPlayer({ id: selectedPlayer.id }) }}
                    variant="destructive"
                    className="flex-1 text-sm h-10 rounded-xl"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject Player
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Approval Dialog — Email Preview */}
      <Dialog open={!!confirmPlayerId} onOpenChange={() => setConfirmPlayerId(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-white text-lg font-semibold">Confirm Approval</DialogTitle>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              Approve <strong>{pendingPlayers.find(p => p.id === confirmPlayerId)?.name}</strong> as a verified player.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Preview</p>
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-xs text-gray-600 space-y-2">
                <p><span className="font-semibold text-gray-700">To:</span> {pendingPlayers.find(p => p.id === confirmPlayerId)?.email}</p>
                <p><span className="font-semibold text-gray-700">Subject:</span> Your Player Account Has Been Verified</p>
                <hr className="border-gray-200" />
                <p>Hi {pendingPlayers.find(p => p.id === confirmPlayerId)?.name},</p>
                <p>Your account has been verified. Your player code will be included in the verification email.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => { const id = confirmPlayerId; setConfirmPlayerId(null); if (id) handleApprove(id) }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm h-10 rounded-xl"
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Send Approval
              </Button>
              <Button onClick={() => setConfirmPlayerId(null)} variant="outline" className="flex-1 text-sm h-10 rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={!!rejectingPlayer} onOpenChange={() => { setRejectingPlayer(null); setRejectReason("") }}>
        <DialogContent className="max-w-md bg-white rounded-2xl shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-white text-lg font-semibold">Reject Player</DialogTitle>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              Reject <strong>{pendingPlayers.find(p => p.id === rejectingPlayer?.id)?.name}</strong>. They will be able to sign up again and submit a new request.
            </p>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Rejection Reason <span className="text-gray-400 normal-case font-normal">(optional — included in email)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete documents, invalid information..."
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none h-24 transition-all bg-gray-50 focus:bg-white"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => { const id = rejectingPlayer?.id; const reason = rejectReason; setRejectingPlayer(null); setRejectReason(""); if (id) handleReject(id, reason) }}
                variant="destructive"
                className="flex-1 text-sm h-10 rounded-xl"
              >
                <XCircle className="w-4 h-4 mr-2" /> Reject
              </Button>
              <Button onClick={() => { setRejectingPlayer(null); setRejectReason("") }} variant="outline" className="flex-1 text-sm h-10 rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Lightbox Carousel */}
      {docIndex !== null && selectedPlayer && selectedPlayer.documents?.length > 0 && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000]"
          onClick={() => setDocIndex(null)}
        >
          <div className="relative max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setDocIndex(null)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative flex items-center justify-center">
              {docIndex > 0 && (
                <button
                  onClick={() => setDocIndex(i => i! - 1)}
                  className="absolute left-2 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white backdrop-blur-sm transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              <img
                src={getProfileImageUrl(selectedPlayer.documents[docIndex])}
                alt={`Document ${docIndex + 1}`}
                className="max-h-[80vh] w-auto rounded-2xl shadow-2xl"
              />
              {docIndex < selectedPlayer.documents.length - 1 && (
                <button
                  onClick={() => setDocIndex(i => i! + 1)}
                  className="absolute right-2 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white backdrop-blur-sm transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
            <p className="text-center text-sm text-white/70 mt-4">
              Document {docIndex + 1} of {selectedPlayer.documents.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerVerification;
