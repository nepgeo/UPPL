import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, CalendarDays, Mail, User, Info, Trophy, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BatIcon from "@/assets/icons/bat.png";
import BallIcon from "@/assets/icons/ball.png";
import { API_BASE, BASE_URL } from '@/config';


// ✅ Utility to format profile image
function getProfileImageUrl(path?: string | null) {
  if (!path) return `${BASE_URL}/favicon.png`;
  if (path.startsWith("http")) return path;

  let cleanPath = path
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/uploads\/uploads\//, "/uploads/")
    .replace(/^uploads\//, "/uploads/");

  if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;
  return `${BASE_URL}${cleanPath}`;
}

// ✅ Utility to calculate age
function calculateAge(dob?: string | null) {
  if (!dob) return "N/A";
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return "N/A";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return `${age} years`;
}

const PlayersPage = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const playersPerPage = 6;

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const token = localStorage.getItem("pplt20_token");

      const res = await fetch(`${BASE_URL}/api/admin/users?limit=9999`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("✅ API raw response:", data);

      const usersArray = Array.isArray(data?.users) ? data.users : [];
      console.log("🔎 Extracted usersArray:", usersArray);

      const verifiedPlayers = usersArray
        .filter((u: any) => u.role === "player" && u.verified === true)
        .map((u: any) => ({
          id: u.id || u._id,
          playerCode: u.playerCode ?? "N/A",
          name: u.name ?? "Unknown",
          email: u.email ?? "No Email",
          phone: u.phone ?? "N/A",
          bio: u.bio ?? "N/A",
          position: u.position ?? "Unknown",
          battingStyle: u.battingStyle ?? "N/A",
          bowlingStyle: u.bowlingStyle ?? "N/A",
          dateOfBirth: u.dateOfBirth ?? null,
          profilePicture: u.profileImage ?? u.playerDetails?.profileImage ?? "",
          submittedAt: u.submittedAt || u.createdAt || u.updatedAt || null, 
          role: u.role ?? "user",
          verified: u.verified ?? false,
        }));

      // ✅ Sort alphabetically by name
      const sortedPlayers = verifiedPlayers.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      console.log("🎯 Normalized + Sorted verified players:", sortedPlayers);

      setPlayers(sortedPlayers);
    } catch (err) {
      console.error("❌ Failed to fetch players", err);
    }
  };

  // ✅ Search filter (name, email, phone)
  const filteredPlayers = players.filter(
    (player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.phone.includes(searchTerm)
  );

  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / playersPerPage));
  const playersToDisplay = filteredPlayers.slice(
    (page - 1) * playersPerPage,
    page * playersPerPage
  );

  const selectedPlayer = players.find((p) => p.id === expandedPlayerId) || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto"
      >
        <Card className="overflow-hidden shadow-xl rounded-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="flex items-center text-xl font-bold">
              Public Player Directory
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {/* Search */}
            <div className="p-3 border-b bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="relative w-full md:w-64">
                  <input
                    type="text"
                    placeholder="Search players..."
                    className="w-full pl-3 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    value={searchTerm}
                    onChange={(e) => {
                      setPage(1); // reset to first page when searching
                      setSearchTerm(e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      # Player
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                      Position
                    </th>
                    {/* <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                      Joined
                    </th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {playersToDisplay.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No players found.
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
                              <div className="text-sm font-medium text-gray-600 w-6">
                                {serial}.
                              </div>
                              <div className="flex-shrink-0 h-9 w-9 ml-2">
                                <img
                                  className="h-9 w-9 rounded-full object-cover border-2 border-blue-100"
                                  src={getProfileImageUrl(player.profilePicture)}
                                  alt={player.name}
                                />
                              </div>
                              <div className="ml-3">
                                <div
                                  className="text-sm font-medium text-blue-600 hover:underline cursor-pointer"
                                  onClick={() => setExpandedPlayerId(player.id)}
                                >
                                  {player.name}
                                </div>
                                {/* ✅ Show Player Code below name */}
                                <div className="text-xs text-gray-500">
                                  Code: {player.playerCode}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{player.email}</td>
                          <td className="px-4 py-3 hidden md:table-cell uppercase">{player.position}</td>
                          {/* <td className="px-4 py-3 hidden lg:table-cell">
                            {new Date(player.submittedAt).toLocaleDateString()}
                          </td> */}
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-3 px-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1 text-sm border rounded-md"
              >
                Previous
              </button>
              <span className="text-xs sm:text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1 text-sm border rounded-md"
              >
                Next
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Player Details Dialog */}
      <AnimatePresence>
        {selectedPlayer && (
          <Dialog open={!!expandedPlayerId} onOpenChange={() => setExpandedPlayerId(null)}>
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
                  <div className="relative z-10 px-6 py-4">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-semibold text-white flex items-center gap-2">
                        <User className="h-5 w-5 text-white" />
                        Player Profile
                      </DialogTitle>
                    </DialogHeader>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                  <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left Column */}
                    <div className="lg:col-span-1 space-y-4 text-center">
                      <img
                        src={getProfileImageUrl(selectedPlayer.profilePicture)}
                        alt="Profile"
                        className="w-32 h-32 object-cover rounded-2xl shadow-md ring-4 ring-white mx-auto"
                      />
                      <h2 className="text-lg font-semibold mt-4">
                        {selectedPlayer.name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        Code: {selectedPlayer.playerCode}
                      </p>
                      <p className="uppercase text-gray-700">{selectedPlayer.position}</p>
                    </div>

                    {/* Right Column */}
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

                      {/* Bio */}
                      <div className="p-4 rounded-2xl border bg-white">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <User className="h-4 w-4 text-indigo-600" /> Player Bio
                        </h3>
                        {selectedPlayer.bio ? (
                          <p className="text-sm">{selectedPlayer.bio}</p>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No bio provided.</p>
                        )}
                      </div>

                      {/* Player Details */}
                      <div className="p-4 rounded-2xl border bg-white">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Info className="h-4 w-4 text-green-600" /> Player Details
                        </h3>
                        <p className="text-sm">
                          <strong>Date of Birth:</strong>{" "}
                          {selectedPlayer.dateOfBirth
                            ? new Date(selectedPlayer.dateOfBirth).toLocaleDateString()
                            : "N/A"}
                        </p>
                        <p className="text-sm">
                          <strong>Age:</strong> {calculateAge(selectedPlayer.dateOfBirth)}
                        </p>
                      </div>

                      {/* Contact Info */}
                      <div className="p-4 rounded-2xl border bg-white">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-600" /> Contact Information
                        </h3>
                        <p className="text-sm">
                          <Mail className="inline h-4 w-4 mr-2" /> {selectedPlayer.email}
                        </p>
                        <p className="text-sm">
                          <Phone className="inline h-4 w-4 mr-2" /> {selectedPlayer.phone}
                        </p>
                        <p className="text-sm">
                          <CalendarDays className="inline h-4 w-4 mr-2" />{" "}
                          {new Date(selectedPlayer.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-3 border-t flex justify-between items-center text-sm">
                  <p className="text-sm text-gray-500">
                    Player ID: #{selectedPlayer.id}
                  </p>
                  <button
                    onClick={() => setExpandedPlayerId(null)}
                    className="px-3 py-1 border rounded-md flex items-center gap-2 text-sm"
                  >
                    <X className="h-4 w-4" /> Close
                  </button>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayersPage;
