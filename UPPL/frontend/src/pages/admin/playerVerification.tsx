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
  const perPage = 5;

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

  const SortHeader = ({ label, field }: { label: string; field: string }) => (
    <th
      onClick={() => toggleSort(field)}
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortKey === field ? "text-blue-500" : "text-gray-300"}`} />
      </div>
    </th>
  );

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
    <>
      {pendingPlayers.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 mb-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg text-sm">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="font-medium text-orange-800">
            {pendingPlayers.length} player{pendingPlayers.length > 1 ? "s" : ""} pending verification
          </span>
        </div>
      )}

      <Card className="border-0 shadow-md rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Player Verification
              {selectedIds.size > 0 && (
                <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {selectedIds.size} selected
                </span>
              )}
            </CardTitle>
            <button
              onClick={fetchPendingPlayers}
              className="text-xs text-blue-300 hover:text-white transition-colors"
            >
              Refresh
            </button>
          </div>
        </CardHeader>

        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-40 text-sm h-9">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                {positions.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border-b border-blue-100">
            <span className="text-sm text-blue-700 font-medium">{selectedIds.size} selected</span>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                onClick={handleBulkApprove}
                disabled={bulkLoading}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white text-xs h-7"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve All
              </Button>
              <Button
                onClick={handleBulkReject}
                disabled={bulkLoading}
                size="sm"
                variant="destructive"
                className="text-xs h-7"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject All
              </Button>
              <Button
                onClick={() => setSelectedIds(new Set())}
                size="sm"
                variant="ghost"
                className="text-xs h-7 text-gray-500"
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                      {selectedIds.size === display.length && display.length > 0
                        ? <CheckSquare className="w-4 h-4" />
                        : <Square className="w-4 h-4" />
                      }
                    </button>
                  </th>
                  <SortHeader label="Player" field="name" />
                  <SortHeader label="Email" field="email" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Position</th>
                  <SortHeader label="Submitted" field="submittedAt" />
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {display.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">No pending players found.</td>
                  </tr>
                ) : (
                  display.map((player) => (
                    <tr key={player.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(player.id) ? "bg-blue-50/50" : ""}`}>
                      <td className="px-3 py-3">
                        <button onClick={() => toggleSelect(player.id)} className="text-gray-400 hover:text-gray-600">
                          {selectedIds.has(player.id)
                            ? <CheckSquare className="w-4 h-4 text-blue-500" />
                            : <Square className="w-4 h-4" />
                          }
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {player.name.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <button
                              onClick={() => setExpandedPlayerId(player.id)}
                              className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors"
                            >
                              {player.name}
                            </button>
                            <div className="text-xs text-gray-400">{player.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">{player.email}</div>
                        <div className="text-xs text-gray-400">{player.phone}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          {roleIcon(player.position)}
                          <span className="text-sm text-gray-700">{player.position}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(player.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => setConfirmPlayerId(player.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-2.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept
                          </Button>
                          <Button
                            onClick={() => setRejectingPlayer({ id: player.id })}
                            size="sm"
                            variant="destructive"
                            className="text-xs h-7 px-2.5"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-gray-100">
            {display.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-400">No pending players found.</div>
            ) : (
              display.map((player) => (
                <div key={player.id} className={`px-4 py-3 space-y-2 ${selectedIds.has(player.id) ? "bg-blue-50/50" : ""}`}>
                  <div className="flex items-center justify-between">
                    <button onClick={() => toggleSelect(player.id)} className="text-gray-400 mr-2">
                      {selectedIds.has(player.id)
                        ? <CheckSquare className="w-4 h-4 text-blue-500" />
                        : <Square className="w-4 h-4" />
                      }
                    </button>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {player.name.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => setExpandedPlayerId(player.id)}
                          className="text-sm font-medium text-gray-800 truncate block w-full text-left"
                        >
                          {player.name}
                        </button>
                        <div className="text-xs text-gray-400 truncate">{player.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setConfirmPlayerId(player.id)} size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-7">
                      <CheckCircle className="w-3 h-3 mr-1" /> Accept
                    </Button>
                    <Button onClick={() => setRejectingPlayer({ id: player.id })} size="sm" variant="destructive" className="flex-1 text-xs h-7">
                      <XCircle className="w-3 h-3 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-xs h-7">
                Previous
              </Button>
              <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="text-xs h-7">
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Detail Dialog */}
      {selectedPlayer && (
        <Dialog open={!!expandedPlayerId} onOpenChange={() => setExpandedPlayerId(null)}>
          <DialogContent className="max-w-2xl bg-white rounded-xl shadow-2xl p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {selectedPlayer.name}
                  </DialogTitle>
                </div>
                <p className="text-xs text-blue-300 mt-0.5">Player Verification Details</p>
              </DialogHeader>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="text-center space-y-3">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold mx-auto">
                    {selectedPlayer.name.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-800">{selectedPlayer.name}</p>
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {selectedPlayer.position}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-left bg-gray-50 rounded-lg p-3">
                    {[
                      { icon: Mail, label: "Email", value: selectedPlayer.email },
                      { icon: Phone, label: "Phone", value: selectedPlayer.phone },
                      { icon: CalendarDays, label: "Submitted", value: new Date(selectedPlayer.submittedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <item.icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-gray-700">{item.label}: <strong>{item.value}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-600 font-medium mb-0.5">Batting Style</p>
                      <p className="text-sm font-semibold text-gray-800">{selectedPlayer.battingStyle}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs text-purple-600 font-medium mb-0.5">Bowling Style</p>
                      <p className="text-sm font-semibold text-gray-800">{selectedPlayer.bowlingStyle}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Bio</p>
                    <p className="text-sm text-gray-700">{selectedPlayer.bio && selectedPlayer.bio !== "N/A" ? selectedPlayer.bio : "No bio provided."}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Documents ({selectedPlayer.documents?.length || 0})</p>
                    </div>
                    {selectedPlayer.documents?.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {selectedPlayer.documents.map((doc: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => setDocIndex(i)}
                            className="aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors bg-gray-50"
                          >
                            <img
                              src={getProfileImageUrl(doc)}
                              alt={`Doc ${i + 1}`}
                              className="w-full h-full object-cover"
                              onError={e => ((e.currentTarget as HTMLImageElement).src = "/placeholder.svg")}
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-5 bg-gray-50 rounded-lg text-sm text-gray-400">
                        <FileX className="w-4 h-4" /> No documents
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => { setExpandedPlayerId(null); setConfirmPlayerId(selectedPlayer.id) }} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm h-8">
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                    </Button>
                    <Button onClick={() => { setExpandedPlayerId(null); setRejectingPlayer({ id: selectedPlayer.id }) }} variant="destructive" className="flex-1 text-sm h-8">
                      <XCircle className="w-4 h-4 mr-1.5" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Approval Dialog — Email Preview */}
      <Dialog open={!!confirmPlayerId} onOpenChange={() => setConfirmPlayerId(null)}>
        <DialogContent className="max-w-md bg-white rounded-xl shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-4">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                <Send className="w-4 h-4" /> Confirm Approval
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              Approve <strong>{pendingPlayers.find(p => p.id === confirmPlayerId)?.name}</strong> as a verified player. An email will be sent to:
            </p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              <p className="font-medium text-gray-700">Email Preview</p>
              <div className="bg-white border border-gray-200 rounded p-3 text-xs text-gray-600 space-y-1">
                <p><strong>To:</strong> {pendingPlayers.find(p => p.id === confirmPlayerId)?.email}</p>
                <p><strong>Subject:</strong> Your Player Account Has Been Verified</p>
                <hr className="border-gray-200" />
                <p>Hi {pendingPlayers.find(p => p.id === confirmPlayerId)?.name},</p>
                <p>Your account has been verified. Your player code will be included in the verification email.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => { const id = confirmPlayerId; setConfirmPlayerId(null); if (id) handleApprove(id) }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm h-8"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" /> Send Approval
              </Button>
              <Button onClick={() => setConfirmPlayerId(null)} variant="outline" className="flex-1 text-sm h-8">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={!!rejectingPlayer} onOpenChange={() => { setRejectingPlayer(null); setRejectReason("") }}>
        <DialogContent className="max-w-md bg-white rounded-xl shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-rose-600 px-5 py-4">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Reject Player
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              Reject <strong>{pendingPlayers.find(p => p.id === rejectingPlayer?.id)?.name}</strong>. They will be able to sign up again and submit a new request.
            </p>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                Rejection Reason <span className="text-gray-400 normal-case">(optional — included in email)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete documents, invalid information..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none h-24 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => { const id = rejectingPlayer?.id; const reason = rejectReason; setRejectingPlayer(null); setRejectReason(""); if (id) handleReject(id, reason) }}
                variant="destructive"
                className="flex-1 text-sm h-8"
              >
                <XCircle className="w-4 h-4 mr-1.5" /> Reject
              </Button>
              <Button onClick={() => { setRejectingPlayer(null); setRejectReason("") }} variant="outline" className="flex-1 text-sm h-8">
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
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative flex items-center justify-center">
              {docIndex > 0 && (
                <button
                  onClick={() => setDocIndex(i => i! - 1)}
                  className="absolute left-2 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white backdrop-blur-sm transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <img
                src={getProfileImageUrl(selectedPlayer.documents[docIndex])}
                alt={`Document ${docIndex + 1}`}
                className="max-h-[80vh] w-auto rounded-lg shadow-2xl"
              />
              {docIndex < selectedPlayer.documents.length - 1 && (
                <button
                  onClick={() => setDocIndex(i => i! + 1)}
                  className="absolute right-2 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white backdrop-blur-sm transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="text-center text-sm text-white/70 mt-3">
              Document {docIndex + 1} of {selectedPlayer.documents.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerVerification;