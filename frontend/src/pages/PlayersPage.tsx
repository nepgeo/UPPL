import React, { useEffect, useState, useMemo } from "react";
import { Search, X, Phone, Mail, CalendarDays, User, Trophy, Target, ShieldCheck, Cpu, Eye, ChevronRight, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getProfileImageUrl } from "@/utils/getProfileImageUrl";
import api from "@/lib/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSearchParams } from "react-router-dom";

interface CareerStats {
  matches: number;
  innings: number;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  highestScore: number;
  notOuts: number;
  wickets: number;
  ballsBowled: number;
  runsConceded: number;
  bestBowlingWickets: number;
  bestBowlingRuns: number;
  economy: number;
  strikeRate: number;
  average: number;
  catches: number;
  stumpings: number;
}

interface Player {
  id: string;
  playerCode: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  position: string;
  battingStyle: string;
  bowlingStyle: string;
  dateOfBirth: string | null;
  profilePicture: any;
  submittedAt: string;
  careerStats: CareerStats;
}

const positionIcons: Record<string, string> = {
  batsman: "🏏",
  bowler: "🏏",
  "all-rounder": "⭐",
  "wicket-keeper": "🧤",
};

const roleGradient: Record<string, string> = {
  batsman: "from-blue-500 to-cyan-500",
  bowler: "from-purple-500 to-pink-500",
  "all-rounder": "from-amber-500 to-orange-500",
  "wicket-keeper": "from-emerald-500 to-teal-500",
};

const roleBadgeColor: Record<string, string> = {
  batsman: "bg-blue-100 text-blue-700",
  bowler: "bg-purple-100 text-purple-700",
  "all-rounder": "bg-amber-100 text-amber-700",
  "wicket-keeper": "bg-emerald-100 text-emerald-700",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const statCard = (label: string, value: string | number, accent: string) => (
  <div className={`bg-gradient-to-br ${accent} rounded-xl p-4 sm:p-5 text-center text-white`}>
    <div className="text-2xl sm:text-4xl font-bold">{value ?? "-"}</div>
    <div className="text-xs sm:text-sm opacity-80 font-semibold uppercase tracking-wider mt-1">{label}</div>
  </div>
);

const PlayersPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/player/public");
      setPlayers(res.data.players || []);
    } catch (err) {
      console.error("❌ Failed to fetch players", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.playerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.position.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [players, searchTerm]);

  const calculateAge = (dob: string | null) => {
    if (!dob) return "N/A";
    const d = new Date(dob);
    if (isNaN(d.getTime())) return "N/A";
    const age = Math.floor((Date.now() - d.getTime()) / 31557600000);
    return `${age} yrs`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-purple-800 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-10 sm:py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase">Player Directory</h1>
          </div>
          <p className="text-white/80 max-w-xl text-sm sm:text-base md:text-lg uppercase mx-auto">
            Explore verified cricket players, their career stats, and performance records.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-7 relative z-10">
        {/* Filters Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50 uppercase"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between mb-5 text-sm sm:text-base text-gray-500 uppercase">
          <span>
            <span className="font-semibold text-gray-800">{filteredPlayers.length}</span> player{filteredPlayers.length !== 1 && "s"} found
          </span>
          {loading && <span className="text-blue-500 animate-pulse text-xs font-bold">Loading...</span>}
        </div>

        {/* Player Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-20">
            <User className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-1 uppercase">No players found</h3>
            <p className="text-sm sm:text-base text-gray-400 uppercase">
              {searchTerm ? `No player found matching "${searchTerm}"` : 'Try adjusting your search or filter.'}
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
          >
            {filteredPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                variants={cardVariants}
                layout
                onClick={() => setSelectedPlayer(player)}
                className="relative bg-white rounded-2xl border-2 border-gray-100 hover:border-purple-200 p-5 sm:p-6 pl-8 sm:pl-10 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
              >
                {/* Player Number */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg z-10">
                  <span className="text-white font-extrabold text-xs sm:text-sm">{index + 1}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 ring-2 ring-gray-100 group-hover:ring-purple-300 transition-all">
                      {player.profilePicture ? (
                        <img
                          src={getProfileImageUrl(player.profilePicture)}
                          alt={player.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm sm:text-base font-bold text-gray-500">
                          {getInitials(player.name)}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <span className="text-xs sm:text-sm">{positionIcons[player.position.toLowerCase()] || "🏏"}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate group-hover:text-purple-600 transition-colors uppercase">
                      {player.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-purple-600 font-bold mt-0.5 uppercase">#{player.playerCode}</p>
                    <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${roleBadgeColor[player.position.toLowerCase()] || "bg-gray-100 text-gray-600"}`}>
                      {player.position}
                    </span>
                  </div>

                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-purple-500 transition-colors flex-shrink-0" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Player Detail Dialog */}
      <AnimatePresence>
        {selectedPlayer && (
          <Dialog open={!!selectedPlayer} onOpenChange={(v) => { if (!v) setSelectedPlayer(null); }}>
            <DialogContent hideClose className="max-w-full max-h-full w-full h-full m-0 p-0 rounded-none overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                {/* Hero Banner */}
                <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 px-6 sm:px-10 py-10 sm:py-14 overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />

                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 relative z-[1]">
                    <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-2xl overflow-hidden ring-4 ring-white/30 shadow-xl flex-shrink-0">
                      {selectedPlayer.profilePicture ? (
                        <img
                          src={getProfileImageUrl(selectedPlayer.profilePicture)}
                          alt={selectedPlayer.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-white/20 flex items-center justify-center text-4xl sm:text-5xl font-bold text-white">
                          {getInitials(selectedPlayer.name)}
                        </div>
                      )}
                    </div>
                    <div className="text-center sm:text-left text-white flex-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase">{selectedPlayer.name}</h2>
                      </div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                        <span className="text-base sm:text-lg text-white/80 font-mono uppercase">#{selectedPlayer.playerCode}</span>
                        <span className="w-1 h-1 rounded-full bg-white/40" />
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm sm:text-base font-bold uppercase tracking-wider bg-white/15 text-white/90`}>
                          <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                          {selectedPlayer.position}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-sm sm:text-base text-white/70">
                        {selectedPlayer.dateOfBirth && (
                          <span className="flex items-center gap-1.5 uppercase"><CalendarDays className="w-4 h-4" /> {calculateAge(selectedPlayer.dateOfBirth)}</span>
                        )}
                        {selectedPlayer.phone && (
                          <span className="flex items-center gap-1.5 uppercase"><Phone className="w-4 h-4" /> {selectedPlayer.phone}</span>
                        )}
                        <span className="flex items-center gap-1.5 lowercase"><Mail className="w-4 h-4" /> {selectedPlayer.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-10 space-y-6 sm:space-y-8">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {statCard("Matches", selectedPlayer.careerStats?.matches ?? 0, "from-blue-600 to-blue-700")}
                    {statCard("Runs", selectedPlayer.careerStats?.runs ?? 0, "from-emerald-600 to-emerald-700")}
                    {statCard("Wickets", selectedPlayer.careerStats?.wickets ?? 0, "from-purple-600 to-purple-700")}
                    {statCard("Catches", selectedPlayer.careerStats?.catches ?? 0, "from-amber-600 to-amber-700")}
                  </div>

                  {/* Playing Style */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-4 sm:p-6 text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <span className="text-base sm:text-xl font-bold text-gray-700 uppercase">Batting</span>
                      </div>
                      <p className="text-sm sm:text-lg font-medium text-gray-900 uppercase">{selectedPlayer.battingStyle}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 p-4 sm:p-6 text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                        </div>
                        <span className="text-base sm:text-xl font-bold text-gray-700 uppercase">Bowling</span>
                      </div>
                      <p className="text-sm sm:text-lg font-medium text-gray-900 uppercase">{selectedPlayer.bowlingStyle}</p>
                    </div>
                  </div>

                  {/* Batting Stats */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-1 h-5 rounded-full bg-emerald-500" />
                      Batting Career
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {[
                        { label: "Innings", value: selectedPlayer.careerStats?.innings },
                        { label: "Runs", value: selectedPlayer.careerStats?.runs },
                        { label: "HS", value: selectedPlayer.careerStats?.highestScore },
                        { label: "Avg", value: selectedPlayer.careerStats?.average?.toFixed(1) },
                        { label: "SR", value: selectedPlayer.careerStats?.strikeRate?.toFixed(1) },
                        { label: "Not Outs", value: selectedPlayer.careerStats?.notOuts },
                      ].map((s) => (
                        <div key={s.label} className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center border border-gray-100">
                          <div className="text-xl sm:text-2xl font-bold text-gray-900">{s.value ?? "-"}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      {[
                        { label: "Fours", value: selectedPlayer.careerStats?.fours, color: "text-blue-600" },
                        { label: "Sixes", value: selectedPlayer.careerStats?.sixes, color: "text-purple-600" },
                        { label: "Balls Faced", value: selectedPlayer.careerStats?.ballsFaced, color: "text-gray-600" },
                        { label: "50s/100s", value: `${Math.floor((selectedPlayer.careerStats?.runs || 0) / 100)}/${Math.floor((selectedPlayer.careerStats?.runs || 0) / 50)}`, color: "text-amber-600" },
                      ].map((s) => (
                        <div key={s.label} className="bg-white rounded-xl p-3 sm:p-4 text-center border border-gray-100">
                          <div className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value ?? "-"}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bowling Stats */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-1 h-5 rounded-full bg-purple-500" />
                      Bowling Career
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Wickets", value: selectedPlayer.careerStats?.wickets },
                        { label: "Balls Bowled", value: selectedPlayer.careerStats?.ballsBowled },
                        { label: "Runs Conceded", value: selectedPlayer.careerStats?.runsConceded },
                        { label: "Economy", value: selectedPlayer.careerStats?.economy?.toFixed(1) },
                      ].map((s) => (
                        <div key={s.label} className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center border border-gray-100">
                          <div className="text-xl sm:text-2xl font-bold text-gray-900">{s.value ?? "-"}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 p-4 sm:p-6 flex items-center gap-3">
                        <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
                        <div>
                          <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider font-semibold">Best Bowling</div>
                          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                            {selectedPlayer.careerStats?.bestBowlingWickets || "-"}/{selectedPlayer.careerStats?.bestBowlingRuns || "-"}
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-100 p-4 sm:p-6 flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" />
                        <div>
                          <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider font-semibold">Fielding</div>
                          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                            {selectedPlayer.careerStats?.catches || 0} ct / {selectedPlayer.careerStats?.stumpings || 0} st
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {selectedPlayer.bio && (
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-gray-500" />
                        About
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100 uppercase">
                        {selectedPlayer.bio}
                      </p>
                    </div>
                  )}
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
