import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserCheck, CheckCircle, XCircle, Phone, CalendarDays, Mail, User, Check, Info, Trophy, FileText, X, FileX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminDashboard } from "@/services/adminService";
import { approvePlayer, rejectPlayer } from "@/services/playerVerificationService";
import BatIcon from "@/assets/icons/bat.png";
import BallIcon from "@/assets/icons/ball.png";
import AllRounderIcon from "@/assets/icons/all.png";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE, BASE_URL } from '@/config';


const BASE_URL = BASE_URL;

/**
 * Normalize file path into a full URL served by backend static /uploads route.
 * Handles backslashes, duplicate slashes and missing leading slash.
 */
function getProfileImageUrl(path?: string | null) {
  if (!path) return `${BASE_URL}/uploads/default-avatar.png`;

  if (path.startsWith("http")) return path;

  let cleanPath = path
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/uploads\/uploads\//, "/uploads/")
    .replace(/^uploads\//, "/uploads/");

  if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;

  return `${BASE_URL}${cleanPath}`;
}

const PlayerVerification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingPlayers, setPendingPlayers] = useState<any[]>([]);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "submittedAt", direction: "desc" });
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const playersPerPage = 5; // changed from 10 to 5

  useEffect(() => {
    fetchPendingPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPendingPlayers = async () => {
    try {
      const res = await getAdminDashboard();
      const normalizedPlayers = (res.pendingPlayersList ?? []).map((p: any) => ({
        id: p.id || p._id || p.userId,
        name: p.name ?? "Unknown",
        email: p.email ?? "No Email",
        phone: p.phone ?? "N/A",
        bio: p.bio ?? p.user?.bio ?? "",  
        position: p.position ?? "Unknown",
        battingStyle: p.battingStyle ?? "N/A",
        bowlingStyle: p.bowlingStyle ?? "N/A",
        profilePicture: p.profileImage ?? "",
        citizenshipFront: p.citizenshipFront ?? "",
        citizenshipBack: p.citizenshipBack ?? "",
        submittedAt: p.submittedAt ?? new Date().toISOString(),
        documents: p.documents ?? [],
        role: p.role ?? "player",
      }));
      setPendingPlayers(normalizedPlayers);
    } catch (err) {
      console.error("Failed to fetch players", err);
    }
  };

  const handleApprovePlayer = async (playerId: string) => {
    try {
      await approvePlayer(playerId);
      toast({ title: "Player Approved", description: "Player has been successfully verified." });
      await fetchPendingPlayers();
      setPage(1);
    } catch (err) {
      console.error("Error approving player", err);
      toast({ title: "Error", description: "Failed to approve player", variant: "destructive" });
    }
  };

  const handleRejectPlayer = async (playerId: string) => {
    try {
      await rejectPlayer(playerId);
      toast({ title: "Player Rejected", description: "Player has been rejected." });
      await fetchPendingPlayers();
      setPage(1);
    } catch (err) {
      console.error("Error rejecting player", err);
      toast({ title: "Error", description: "Failed to reject player", variant: "destructive" });
    }
  };

  const handleSort = (key: string) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  // Improved sort: handles dates for submittedAt and strings for other keys
  const sortedPlayers = React.useMemo(() => {
    const sortable = [...pendingPlayers];
    if (!sortConfig?.key) return sortable;

    sortable.sort((a: any, b: any) => {
      const key = sortConfig.key as keyof typeof a;
      if (key === "submittedAt") {
        const diff = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        return sortConfig.direction === "asc" ? diff : -diff;
      }

      const aVal = (a[key] ?? "").toString().toLowerCase();
      const bVal = (b[key] ?? "").toString().toLowerCase();
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sortable;
  }, [pendingPlayers, sortConfig]);

  const filteredPlayers = sortedPlayers.filter((player) =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.phone.includes(searchTerm)
  );

  // Reset to first page when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / playersPerPage));
  const playersToDisplay = filteredPlayers.slice((page - 1) * playersPerPage, page * playersPerPage);

  if (user?.role !== "admin" && user?.role !== "super-admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="p-8 text-center w-full max-w-md">
          <CardContent>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-gray-600">You don't have permission to view this page.</p>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedPlayer = pendingPlayers.find((p) => p.id === expandedPlayerId) || null;
  console.log("Player data:", selectedPlayer);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="container mx-auto">
        <Card className="overflow-hidden shadow-xl rounded-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="flex items-center text-xl font-bold">
              <UserCheck className="h-5 w-5 mr-2" /> Player Verification Dashboard
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {/* Search and Controls */}
            <div className="p-3 border-b bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="relative w-full md:w-64">
                  <input
                    type="text"
                    placeholder="Search players..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative overflow-hidden border border-blue-500 text-blue-500 
                              rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                    onClick={() => fetchPendingPlayers()}
                  >
                    {/* Hover Fill Effect */}
                    <span className="absolute inset-0 bg-blue-500 opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
                    
                    <span className="relative">Refresh</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Table */}
            {/* Responsive Table / Cards */}
<div className="overflow-x-auto hidden sm:block">
  <table className="min-w-full divide-y divide-gray-200 text-sm">
    <thead className="bg-gray-50">
      <tr>
        <th onClick={() => handleSort("name")} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition">
          <div className="flex items-center">
            # &nbsp; Player Name
            {sortConfig.key === "name" && <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
          </div>
        </th>
        <th onClick={() => handleSort("email")} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition">
          <div className="flex items-center">
            Email
            {sortConfig.key === "email" && <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
          </div>
        </th>
        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Position</th>
        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Submitted</th>
        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {playersToDisplay.length === 0 ? (
        <tr>
          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
            No pending players found.
          </td>
        </tr>
      ) : (
        playersToDisplay.map((player, idx) => {
          const serial = (page - 1) * playersPerPage + idx + 1;
          return (
            <motion.tr
              key={player.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.01 }}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-600 w-6">{serial}.</div>
                  <div className="flex-shrink-0 h-9 w-9 ml-2">
                    <img
                      className="h-9 w-9 rounded-full object-cover border-2 border-blue-100"
                      src={getProfileImageUrl(player.profilePicture)}
                      alt={player.name}
                      onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/uploads/default-avatar.png")}
                    />
                  </div>
                  <div className="ml-3">
                    <div
                      className="text-sm font-medium text-blue-600 hover:underline cursor-pointer"
                      onClick={() => setExpandedPlayerId(player.id)}
                    >
                      {player.name}
                    </div>
                    <div className="text-xs text-gray-500">{player.role}</div>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-gray-900">{player.email}</div>
                <div className="text-xs text-gray-500">{player.phone}</div>
              </td>

              <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                <div className="flex items-center">
                  <img
                    src={player.position === "Batsman" ? BatIcon : player.position === "Bowler" ? BallIcon : AllRounderIcon}
                    alt={player.position}
                    className="h-4 w-4 mr-2"
                  />
                  <span className="text-sm text-gray-900">{player.position}</span>
                </div>
              </td>

              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                {new Date(player.submittedAt).toLocaleDateString()}
              </td>

              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium flex gap-2">
                <Button
                  onClick={() => handleApprovePlayer(player.id)}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 h-8"
                  size="sm"
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                </Button>
                <Button
                  onClick={() => handleRejectPlayer(player.id)}
                  variant="destructive"
                  className="text-xs py-1 px-2 h-8"
                  size="sm"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                </Button>
              </td>
            </motion.tr>
          );
        })
      )}
    </tbody>
  </table>
</div>

{/* Mobile Card Layout */}
{/* Mobile Card Layout */}
<div className="sm:hidden space-y-4">
  {playersToDisplay.length === 0 ? (
    <p className="text-center text-gray-500 py-6">No pending players found.</p>
  ) : (
    playersToDisplay.map((player, idx) => {
      const serial = (page - 1) * playersPerPage + idx + 1;
      return (
        <motion.div
          key={player.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-4 rounded-lg shadow border border-gray-200"
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-gray-600">{serial}.</div>
            <img
              className="h-10 w-10 rounded-full object-cover border"
              src={getProfileImageUrl(player.profilePicture)}
              alt={player.name}
              onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/uploads/default-avatar.png")}
            />
            <div>
              <p
                className="text-blue-600 font-semibold cursor-pointer hover:underline"
                onClick={() => setExpandedPlayerId(player.id)}
              >
                {player.name}
              </p>
              <p className="text-xs text-gray-500">{player.role}</p>
            </div>
          </div>

          {/* Details */}
          <div className="mt-3 space-y-1 text-sm">
            <p><span className="font-medium">Email:</span> {player.email}</p>
            <p><span className="font-medium">Phone:</span> {player.phone}</p>
            <p><span className="font-medium">Position:</span> {player.position}</p>
            <p className="text-gray-500 text-xs">
              Submitted: {new Date(player.submittedAt).toLocaleDateString()}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-col gap-2">
            <Button
              onClick={() => handleApprovePlayer(player.id)}
              className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 h-8"
              size="sm"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
            </Button>
            <Button
              onClick={() => handleRejectPlayer(player.id)}
              variant="destructive"
              className="text-xs py-1 h-8"
              size="sm"
            >
              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
            </Button>
          </div>
        </motion.div>
      );
    })
  )}
</div>



            {/* Pagination controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-3 px-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>Previous</Button>
              <span className="text-xs sm:text-sm text-gray-600">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>Next</Button>
            </div>

          </CardContent>
        </Card>
      </motion.div>

      {/* Player Details Dialog */}
      <AnimatePresence>
        {selectedPlayer && (
          <Dialog
            open={!!expandedPlayerId}
            onOpenChange={() => setExpandedPlayerId(null)}
          >
            {/* Reduce max width and overall padding/typography to make dialog smaller.
                Also removed inner scroll (no overflow-y-auto) so dialog content is not scrollable. */}
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="h-full flex flex-col"
              >
                {/* Header */}
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 opacity-90" />
                  <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-8" />
                  <div className="relative z-10 px-6 py-4">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-semibold text-white flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
                          <UserCheck className="h-5 w-5 text-white" />
                        </div>
                        Player Profile
                      </DialogTitle>
                      <p className="text-blue-100 mt-1 text-sm">
                        Verification Details & Documentation
                      </p>
                    </DialogHeader>
                  </div>
                </div>

                {/* Content: kept not scrollable; reduced paddings and image sizes */}
                <div className="flex-1 overflow-hidden">
                  <div className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Left Column - Profile */}
                      <div className="lg:col-span-1 space-y-4">
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-4 text-center">
                          <div className="relative inline-block cursor-pointer">
                            <img
                              src={getProfileImageUrl(selectedPlayer.profilePicture)}
                              alt="Profile"
                              className="w-32 h-32 object-cover rounded-2xl shadow-md ring-4 ring-white dark:ring-gray-700"
                              onClick={() =>
                                setZoomedImage(getProfileImageUrl(selectedPlayer.profilePicture))
                              }
                              onError={(e) =>
                                (e.currentTarget.src = "/uploads/default-avatar.png")
                              }
                            />
                            {/* <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full shadow">
                              <Check className="h-4 w-4" />
                            </div> */}
                          </div>

                          <h2 className="text-lg font-semibold mt-4 text-gray-900 dark:text-white">
                            {selectedPlayer.name}
                          </h2>
                          <p className="text-lg font-semibold uppercase px-4 py-2 mt-2 rounded-xl 
                              bg-white dark:bg-gray-800 
                              shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.1)] 
                              text-gray-800 dark:text-gray-100 text-center tracking-wide">
                            {selectedPlayer.position}
                          </p>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded-lg">
                              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            Contact Information
                          </h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Email
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white break-all">
                                  {selectedPlayer.email}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Phone
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {selectedPlayer.phone}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <CalendarDays className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Submitted
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {new Date(selectedPlayer.submittedAt).toLocaleDateString(
                                    "en-US",
                                    { year: "numeric", month: "long", day: "numeric" }
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Playing Details & Documents */}
                      <div className="lg:col-span-2 space-y-4">
                        {/* Playing Style */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-lg">
                              <Trophy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            Playing Style
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-xl">
                                  <img src={BatIcon} alt="Batting" className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-xs text-blue-700 dark:text-blue-300 uppercase tracking-wider font-medium">
                                    Batting Style
                                  </p>
                                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                    {selectedPlayer.battingStyle}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-200 dark:bg-purple-800 rounded-xl">
                                  <img src={BallIcon} alt="Bowling" className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-xs text-purple-700 dark:text-purple-300 uppercase tracking-wider font-medium">
                                    Bowling Style
                                  </p>
                                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                                    {selectedPlayer.bowlingStyle}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                          {/* 🆕 Bio Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                              <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            Player Bio
                          </h3>
                          {selectedPlayer.bio && selectedPlayer.bio !== "N/A" ? (
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {selectedPlayer.bio}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              No bio provided.
                            </p>
                          )}
                        </div>

                        {/* Documents */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
                              <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            Verification Documents
                            {selectedPlayer.documents?.length > 0 && (
                              <span className="ml-auto text-xs font-normal text-gray-500 dark:text-gray-400">
                                {selectedPlayer.documents.length} document{selectedPlayer.documents.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </h3>

                          {selectedPlayer.documents?.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {selectedPlayer.documents.map((doc: string, index: number) => (
                                <motion.div
                                  key={index}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="group relative rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 cursor-pointer"
                                  onClick={() => setZoomedImage(getProfileImageUrl(doc))}
                                >
                                  <div className="aspect-w-4 aspect-h-3 bg-gray-100 dark:bg-gray-800">
                                    <img
                                      src={getProfileImageUrl(doc)}
                                      alt={`Document ${index + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/no-image.png")}
                                    />
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                  <div className="absolute bottom-0 left-0 right-0 p-2 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                                    <p className="text-sm font-medium">Document {index + 1}</p>
                                    <p className="text-xs opacity-75">Click to view</p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                              <FileX className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Player ID: #{selectedPlayer.id}
                  </p>
                  <Button onClick={() => setExpandedPlayerId(null)} variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                    <X className="h-4 w-4 mr-2" /> Close
                  </Button>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Zoom Overlay */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] cursor-zoom-out"
            onClick={() => setZoomedImage(null)}
          >
            <motion.img
              src={zoomedImage}
              alt="Zoomed"
              className="max-h-[85vh] max-w-[90vw] rounded-xl shadow-2xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayerVerification;
