import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, CalendarDays, Mail, User, Info, Trophy, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BatIcon from "@/assets/icons/bat.png";
import BallIcon from "@/assets/icons/ball.png";
import { API_BASE, BASE_URL } from "@/config";

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

function calculateAge(dob?: string | null) {
  if (!dob) return "N/A";
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return "N/A";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return `${age} years`;
}

const PlayersPage = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const playersPerPage = 8;

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const token = localStorage.getItem("pplt20_token");
      const res = await fetch(`${BASE_URL}/api/admin/users?limit=9999`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const usersArray = Array.isArray(data?.users) ? data.users : [];

      const verifiedPlayers = usersArray
        .filter((u: any) => u.role === "player" && u.verified)
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
        }));

      setPlayers(verifiedPlayers.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error("❌ Failed to fetch players", err);
    }
  };

  const filteredPlayers = players.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm)
  );

  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / playersPerPage));
  const playersToDisplay = filteredPlayers.slice(
    (page - 1) * playersPerPage,
    page * playersPerPage
  );

  const selectedPlayer = players.find((p) => p.id === expandedPlayerId) || null;

  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 md:px-10 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">🏏 Player Directory</h1>

        <input
          type="text"
          placeholder="Search players..."
          className="w-full sm:w-72 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={searchTerm}
          onChange={(e) => {
            setPage(1);
            setSearchTerm(e.target.value);
          }}
        />
      </div>

      {/* Player Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      >
        {playersToDisplay.length === 0 ? (
          <p className="col-span-full text-center text-gray-500 mt-6">
            No players found.
          </p>
        ) : (
          playersToDisplay.map((player, idx) => (
            <motion.div
              key={player.id}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-50 hover:bg-gray-100 transition rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center text-center cursor-pointer"
              onClick={() => setExpandedPlayerId(player.id)}
            >
              <img
                src={getProfileImageUrl(player.profilePicture)}
                alt={player.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-blue-200 mb-3"
              />
              <h3 className="font-semibold text-gray-800">{player.name}</h3>
              <p className="text-xs text-gray-500">{player.position}</p>
              <p className="text-xs text-gray-400 mt-1">Code: {player.playerCode}</p>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-8">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          className="px-3 py-1 text-sm border rounded-md disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-xs sm:text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          className="px-3 py-1 text-sm border rounded-md disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {/* Player Detail Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <Dialog open={!!expandedPlayerId} onOpenChange={() => setExpandedPlayerId(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" /> Player Profile
                  </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left */}
                  <div className="flex flex-col items-center lg:w-1/3 text-center">
                    <img
                      src={getProfileImageUrl(selectedPlayer.profilePicture)}
                      alt="Profile"
                      className="w-32 h-32 object-cover rounded-2xl border-4 border-blue-100"
                    />
                    <h2 className="mt-3 font-semibold text-gray-800">{selectedPlayer.name}</h2>
                    <p className="text-xs text-gray-500 uppercase">{selectedPlayer.position}</p>
                    <p className="text-xs text-gray-400">Code: {selectedPlayer.playerCode}</p>
                  </div>

                  {/* Right */}
                  <div className="flex-1 space-y-4 text-sm">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-1 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" /> Playing Style
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-xl p-3">
                          <img src={BatIcon} className="h-5 w-5 inline-block mr-2" />
                          Batting: {selectedPlayer.battingStyle}
                        </div>
                        <div className="bg-purple-50 rounded-xl p-3">
                          <img src={BallIcon} className="h-5 w-5 inline-block mr-2" />
                          Bowling: {selectedPlayer.bowlingStyle}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-1 flex items-center gap-2">
                        <Info className="h-4 w-4 text-green-600" /> Player Info
                      </h3>
                      <p>Date of Birth: {selectedPlayer.dateOfBirth || "N/A"}</p>
                      <p>Age: {calculateAge(selectedPlayer.dateOfBirth)}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-1 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" /> Contact
                      </h3>
                      <p>{selectedPlayer.email}</p>
                      <p>{selectedPlayer.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setExpandedPlayerId(null)}
                    className="px-4 py-1 border rounded-md flex items-center gap-2 text-sm"
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
