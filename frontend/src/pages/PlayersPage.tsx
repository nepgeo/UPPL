import React, { useEffect, useState, useMemo } from "react";
import { Search, X, Phone, Mail, CalendarDays, User, Trophy, Target, ShieldCheck, Cpu, Eye, BadgeCheck, ChevronRight, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getProfileImageUrl } from "@/utils/getProfileImageUrl";
import api from "@/lib/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
  <div className={`bg-gradient-to-br ${accent} rounded-xl p-3 text-white`}>
    <div className="text-2xl font-bold">{value ?? "-"}</div>
    <div className="text-[11px] opacity-80 font-medium uppercase tracking-wider">{label}</div>
  </div>
);

const PlayersPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
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
      const matchesPosition =
        positionFilter === "all" ||
        p.position.toLowerCase() === positionFilter.toLowerCase();
      return matchesSearch && matchesPosition;
    });
  }, [players, searchTerm, positionFilter]);

  const positions = useMemo(() => {
    const set = new Set(players.map((p) => p.position.toLowerCase()));
    return ["all", ...Array.from(set)];
  }, [players]);

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
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Player Directory</h1>
          </div>
          <p className="text-blue-200 max-w-xl text-sm sm:text-base">
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
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              {positions.map((pos) => {
                const isActive = positionFilter === pos;
                const gradient = pos !== "all" ? roleGradient[pos] || "from-gray-500 to-gray-600" : "";
                return (
                  <button
                    key={pos}
                    onClick={() => setPositionFilter(pos)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                      isActive
                        ? pos === "all"
                          ? "bg-gray-900 text-white border-gray-900 shadow-md"
                          : `bg-gradient-to-r ${gradient} text-white border-transparent shadow-md`
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800"
                    }`}
                  >
                    {pos === "all" ? (
                      "All"
                    ) : (
                      <span className="flex items-center gap-1.5">
                        {positionIcons[pos] || "🏏"}
                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between mb-5 text-sm text-gray-500">
          <span>
            <span className="font-semibold text-gray-800">{filteredPlayers.length}</span> player{filteredPlayers.length !== 1 && "s"} found
          </span>
          {loading && <span className="text-blue-500 animate-pulse text-xs font-semibold">Loading...</span>}
        </div>

        {/* Player Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            <h3 className="text-lg font-semibold text-gray-600 mb-1">No players found</h3>
            <p className="text-sm text-gray-400">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredPlayers.map((player) => (
              <motion.div
                key={player.id}
                variants={cardVariants}
                layout
                onClick={() => setSelectedPlayer(player)}
                className="bg-white rounded-2xl border border-gray-100 hover:border-blue-200 p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 ring-2 ring-gray-100 group-hover:ring-blue-300 transition-all">
                      {player.profilePicture ? (
                        <img
                          src={getProfileImageUrl(player.profilePicture)}
                          alt={player.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">
                          {getInitials(player.name)}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <span className="text-xs">{positionIcons[player.position.toLowerCase()] || "🏏"}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                      {player.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Code: {player.playerCode}</p>
                    <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${roleBadgeColor[player.position.toLowerCase()] || "bg-gray-100 text-gray-600"}`}>
                      {player.position}
                    </span>
                  </div>

                  <Eye className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
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
            <DialogContent hideClose className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                {/* Hero Banner */}
                <div className={`relative bg-gradient-to-r ${roleGradient[selectedPlayer.position.toLowerCase()] || "from-gray-700 to-gray-900"} px-6 sm:px-8 py-8 sm:py-10 overflow-hidden`}>
                  {/* Background decoration */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />

                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 relative z-[1]">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-white/30 shadow-xl flex-shrink-0">
                      {selectedPlayer.profilePicture ? (
                        <img
                          src={getProfileImageUrl(selectedPlayer.profilePicture)}
                          alt={selectedPlayer.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white">
                          {getInitials(selectedPlayer.name)}
                        </div>
                      )}
                    </div>
                    <div className="text-center sm:text-left text-white flex-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h2 className="text-2xl sm:text-3xl font-bold">{selectedPlayer.name}</h2>
                        <BadgeCheck className="w-5 h-5 text-blue-300 shrink-0" />
                      </div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                        <span className="text-sm text-white/80 font-mono">#{selectedPlayer.playerCode}</span>
                        <span className="w-1 h-1 rounded-full bg-white/40" />
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/15 text-white/90`}>
                          <Award className="w-3 h-3" />
                          {selectedPlayer.position}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-white/70">
                        {selectedPlayer.dateOfBirth && (
                          <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {calculateAge(selectedPlayer.dateOfBirth)}</span>
                        )}
                        {selectedPlayer.phone && (
                          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {selectedPlayer.phone}</span>
                        )}
                        <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {selectedPlayer.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {statCard("Matches", selectedPlayer.careerStats?.matches ?? 0, "from-blue-600 to-blue-700")}
                    {statCard("Runs", selectedPlayer.careerStats?.runs ?? 0, "from-emerald-600 to-emerald-700")}
                    {statCard("Wickets", selectedPlayer.careerStats?.wickets ?? 0, "from-purple-600 to-purple-700")}
                    {statCard("Catches", selectedPlayer.careerStats?.catches ?? 0, "from-amber-600 to-amber-700")}
                  </div>

                  {/* Playing Style */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Target className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">Batting</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{selectedPlayer.battingStyle}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <Cpu className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">Bowling</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{selectedPlayer.bowlingStyle}</p>
                    </div>
                  </div>

                  {/* Batting Stats */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
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
                        <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                          <div className="text-lg font-bold text-gray-900">{s.value ?? "-"}</div>
                          <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{s.label}</div>
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
                        <div key={s.label} className="bg-white rounded-xl p-3 text-center border border-gray-100">
                          <div className={`text-lg font-bold ${s.color}`}>{s.value ?? "-"}</div>
                          <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bowling Stats */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
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
                        <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                          <div className="text-lg font-bold text-gray-900">{s.value ?? "-"}</div>
                          <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 p-4 flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Best Bowling</div>
                          <div className="text-lg font-bold text-gray-900">
                            {selectedPlayer.careerStats?.bestBowlingWickets || "-"}/{selectedPlayer.careerStats?.bestBowlingRuns || "-"}
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-100 p-4 flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-amber-600" />
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Fielding</div>
                          <div className="text-lg font-bold text-gray-900">
                            {selectedPlayer.careerStats?.catches || 0} ct / {selectedPlayer.careerStats?.stumpings || 0} st
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {selectedPlayer.bio && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-gray-500" />
                        About
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
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
