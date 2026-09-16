import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Filter,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import api from '@/lib/api';
import { BASE_URL } from "@/config";
import { getProfileImageUrl } from "@/utils/getProfileImageUrl";

import { motion } from "framer-motion";
interface Team {
  _id: string;
  teamName: string;
  teamCode: string;
  teamLogo?: string;
  runs?: number;
  wickets?: number;
  overs?: string | number;
  winner?: "teamA" | "teamB"; // Add winner property
  margin?: string;
  
}
interface TeamRef {
  _id: string;
  teamName: string;
  teamLogo?: string;
  teamCode: string;
}

interface GroupTeam {
  _id: string;
  teamName: string;
  teamCode: string;
  team: TeamRef;
}



interface Group {
  groupName: string;
  teams: Team[];
}

interface Match {
  _id: string;
  matchNumber: number;
  stage: string;
  result: string;
  type: string;
  matchTime: string;
  venue: string;
  teamA: Team;
  teamB: Team;
  winner?: "teamA" | "teamB"; // optional winner
  margin?: string;   
}

const Schedule = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"groups" | "schedule">("schedule");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [currentSeason, setCurrentSeason] = useState<any>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("pplt20_token");

  const [teamPlayers, setTeamPlayers] = useState<{ [teamId: string]: any[] }>({});
  const [loadingTeamId, setLoadingTeamId] = useState<string | null>(null);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch current season + all seasons on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [seasonRes, allSeasonsRes] = await Promise.all([
          api.get("/seasons/current", { headers }),
          api.get("/seasons", { headers }).catch(() => ({ data: [] })),
        ]);
        const season = seasonRes.data;
        setCurrentSeason(season);
        setSeasons(allSeasonsRes.data || []);
        setSelectedSeasonId(season?._id || "");
      } catch (err) {
        console.error("❌ Failed to load season data", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Reload data whenever selected season changes
  useEffect(() => {
    if (!selectedSeasonId) return;
    const load = async () => {
      setLoading(true);
      await Promise.all([
        fetchMatches(selectedSeasonId),
        fetchGroups(selectedSeasonId),
        fetchPlayers(selectedSeasonId),
      ]);
      setLoading(false);
    };
    load();
  }, [selectedSeasonId]);

  const fetchMatches = async (seasonId: string) => {
    try {
      const res = await api.get("/matches", { params: { seasonNumber: seasonId }, headers });
      setMatches(res.data.matches || []);
    } catch (err) {
      console.error("❌ Failed to fetch matches", err);
    }
  };

  const fetchGroups = async (seasonId: string) => {
    try {
      const res = await api.get("/groups/schedule", { params: { seasonId }, headers });
      setGroups(res.data.schedule?.groups || []);
    } catch (err) {
      console.error("❌ Failed to fetch groups", err);
    }
  };

  const fetchPlayers = async (seasonId: string) => {
    try {
      setLoadingTeamId("all");
      const res = await fetch(`${BASE_URL}/api/teams/with-players`, {
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch teams with players");

      const playersByTeam: { [teamId: string]: any[] } = {};
      (data.teams || []).forEach((team: any) => {
        playersByTeam[team._id] = Array.isArray(team.players) ? team.players : [];
      });
      setTeamPlayers(playersByTeam);
    } catch (err) {
      console.error("❌ Failed to fetch teams with players", err);
      setTeamPlayers({});
    } finally {
      setLoadingTeamId(null);
    }
  };




  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string, type: string) => {
    if (type?.toLowerCase().includes("final")) {
      return <Badge className="bg-yellow-500 text-white">Playoff</Badge>;
    }

    switch (status) {
      case "upcoming":
        return <Badge variant="outline">Upcoming</Badge>;
      case "live":
        return (
          <Badge className="bg-red-500 text-white animate-pulse">Live</Badge>
        );
      case "completed":
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredMatches = matches.filter((match) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "playoffs")
      return match.stage.toLowerCase() !== "league";
    if (selectedFilter === "league")
      return match.stage.toLowerCase() === "league";
    return true;
  });

  // Extract playoff matches (semi-finals & final)
  const semiFinals = matches.filter((m) =>
    m.stage.toLowerCase().includes("semi")
  );
  const finalMatch = matches.find((m) =>
    m.stage.toLowerCase().includes("final")
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Match Schedule</h1>
          <p className="text-xl opacity-90">
            Don&apos;t miss any action! Complete fixture list for UPPL T20 {new Date().getFullYear()}
          </p>
        </div>
      </div> */}

      <div className="container mx-auto px-4 py-8">
        {/* Toggle Buttons */}
        {groups.length > 0 && (
          <div className="flex gap-2 mb-6 justify-center">
            <Button
              variant={activeView === "groups" ? "default" : "outline"}
              onClick={() => setActiveView("groups")}
              className={`px-4 py-2 md:px-8 md:py-3 text-xs md:text-sm font-semibold rounded-lg uppercase tracking-wider ${
                activeView === "groups"
                  ? "bg-gradient-to-r from-blue-700 via-purple-800 to-indigo-900 text-white shadow-md"
                  : "border-gray-300 text-gray-600 hover:bg-gray-100"
              }`}
            >
              Groups
            </Button>
            <Button
              variant={activeView === "schedule" ? "default" : "outline"}
              onClick={() => setActiveView("schedule")}
              className={`px-4 py-2 md:px-8 md:py-3 text-xs md:text-sm font-semibold rounded-lg uppercase tracking-wider ${
                activeView === "schedule"
                  ? "bg-gradient-to-r from-blue-700 via-purple-800 to-indigo-900 text-white shadow-md"
                  : "border-gray-300 text-gray-600 hover:bg-gray-100"
              }`}
            >
              Schedule
            </Button>
          </div>
        )}

        {/* Groups Section */}
        {groups.length > 0 && (
            <div className={`${activeView === "groups" ? "block" : "hidden"}`}>
            <div className="bg-gradient-to-r from-blue-700 via-purple-800 to-indigo-900 text-white py-8 sm:py-12 mb-6">
              <div className="container mx-auto px-4 text-center">
                <h2 className="text-xl sm:text-3xl font-bold mb-2 uppercase">Tournament Groups</h2>
                <p className="text-sm sm:text-lg opacity-90 uppercase">
                  Explore all the groups and their teams for UPPL T20 {new Date().getFullYear()}
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {groups.map((group, index) => {
                // gradient, glow, underline, and title text colors per group
                const colors = [
                  {
                    gradient: "from-blue-200 to-indigo-400",
                    glow: "hover:shadow-blue-400/60",
                    underline: "from-blue-500 to-indigo-500",
                    title: "from-blue-600 to-indigo-600",
                  },
                  {
                    gradient: "from-green-200 to-emerald-400",
                    glow: "hover:shadow-green-400/60",
                    underline: "from-green-500 to-emerald-500",
                    title: "from-green-600 to-emerald-600",
                  },
                  {
                    gradient: "from-purple-200 to-pink-400",
                    glow: "hover:shadow-pink-400/60",
                    underline: "from-purple-500 to-pink-500",
                    title: "from-purple-600 to-pink-600",
                  },
                  {
                    gradient: "from-orange-200 to-red-400",
                    glow: "hover:shadow-orange-400/60",
                    underline: "from-orange-500 to-red-500",
                    title: "from-orange-600 to-red-600",
                  },
                ];
                const color = colors[index % colors.length];

                return (
                  <motion.div
                    key={group.groupName}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                  >
                    <Card
                      className={`shadow-lg border overflow-hidden rounded-2xl bg-gradient-to-r ${color.gradient} text-gray-900`}
                    >
                      <CardHeader>
                        <CardTitle
                          className={`text-xl font-bold bg-gradient-to-r ${color.title} bg-clip-text text-transparent`}
                        >
                          Group {group.groupName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <ul className="space-y-3">
                          {group.teams.map((team, i) => (
                            <motion.li
                              key={team._id}
                              className="flex items-center space-x-3 p-2 rounded-md bg-white/70 hover:bg-white/90 transition shadow-sm"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              {/* Number before team */}
                              <span className="text-sm font-bold w-5 text-center text-gray-700">
                                {i + 1}.
                              </span>

                              {/* Team logo with group-based hover glow */}
                              {/* <img
                                src={
                                  team?.teamLogo
                                    ? `${BASE_URL}/${team.teamLogo.replace(/\\/g, "/")}`
                                    : "/default-logo.png"
                                }
                                alt={team?.teamName || team.teamName}
                                className="w-8 h-8 rounded-full object-cover bg-gray-200"
                              /> */}


                              {/* Team name with group-based underline */}
                              <span className="relative font-medium text-gray-800 group cursor-pointer">
                                {team.teamName}
                                <span
                                  className={`absolute left-0 bottom-0 w-0 h-0.5 bg-gradient-to-r ${color.underline} transition-all duration-300 group-hover:w-full`}
                                ></span>
                              </span>
                            </motion.li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Schedule Section */}
        <div className={`${activeView === "schedule" ? "block" : "hidden"}`}>
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-8 sm:py-12 mb-6 shadow-lg">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-xl sm:text-3xl font-extrabold mb-2 sm:mb-3 flex flex-col sm:flex-row items-center justify-center gap-2 uppercase">
              <svg xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth="1.5" 
                  stroke="currentColor" 
                  className="w-6 h-6 sm:w-8 sm:h-8">
                <path strokeLinecap="round" strokeLinejoin="round" 
                      d="M6.75 3v2.25M17.25 3v2.25M3 9h18M4.5 21h15a1.5 1.5 0 001.5-1.5V7.5a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 7.5v12A1.5 1.5 0 004.5 21z" />
              </svg>
              Matches Schedule
            </h2>
            <p className="text-sm sm:text-lg opacity-90 uppercase">
              Don&apos;t miss any action! Complete fixture list for UPPL T20 {new Date().getFullYear()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8 md:flex md:justify-between md:items-center">
          {/* Filter */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300" />
            <div className="relative flex items-center gap-2 bg-white border-2 border-gray-200 group-hover:border-purple-300 rounded-xl px-3 py-2.5 transition-all duration-300 shadow-sm group-hover:shadow-md">
              <Filter className="h-4 w-4 text-blue-500 shrink-0" />
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-full border-0 p-0 h-auto bg-transparent focus:ring-0 focus:ring-offset-0 uppercase">
                  <SelectValue placeholder="Filter" className="text-xs md:text-sm font-bold" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="uppercase">All Matches</SelectItem>
                  <SelectItem value="league" className="uppercase">League Matches</SelectItem>
                  <SelectItem value="playoffs" className="uppercase">Playoffs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Season Selector */}
          {seasons.length > 0 && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300" />
              <div className="relative flex items-center gap-2 bg-white border-2 border-gray-200 group-hover:border-pink-300 rounded-xl px-3 py-2.5 transition-all duration-300 shadow-sm group-hover:shadow-md">
                <Trophy className="h-4 w-4 text-purple-500 shrink-0" />
                <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                  <SelectTrigger className="w-full border-0 p-0 h-auto bg-transparent focus:ring-0 focus:ring-offset-0 uppercase">
                    <SelectValue placeholder="Season" className="text-xs md:text-sm font-bold" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((s: any) => (
                      <SelectItem key={s._id} value={s._id} className="uppercase">
                        Season {s.seasonNumber}{s.isCurrent ? " (Current)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Match Cards */}
        <div className="space-y-5 mb-12">
          {filteredMatches
            ?.sort(
              (a, b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime()
            )
            .map((match, index) => {
              const statusColor = match.result === 'live'
                ? 'from-red-500 to-red-600'
                : match.result === 'completed'
                ? 'from-green-500 to-emerald-600'
                : 'from-blue-500 to-indigo-600';
              const statusBg = match.result === 'live'
                ? 'bg-red-50 border-red-200'
                : match.result === 'completed'
                ? 'bg-green-50 border-green-200'
                : 'bg-blue-50 border-blue-200';

              return (
                <Card
                  key={match._id}
                  className={`relative overflow-hidden border-2 ${statusBg} hover:shadow-xl transition-all duration-300 rounded-2xl shadow-md`}
                >
                  {/* Match Number - Mobile: centered above, Desktop: left side */}
                  <div className="lg:hidden absolute -top-0 left-1/2 -translate-x-1/2 z-10">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-b-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-extrabold text-xs">{match.matchNumber || index + 1}</span>
                    </div>
                  </div>

                  <CardContent className="p-0">
                    {/* Top accent bar */}
                    <div className={`h-1.5 w-full bg-gradient-to-r ${statusColor}`} />

                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-6">

                        {/* Match Number - Desktop */}
                        <div className="hidden lg:flex flex-col items-center justify-center shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-extrabold text-sm">{match.matchNumber || index + 1}</span>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">Match</span>
                        </div>

                        {/* CENTER: Teams + Date/Time */}
                        <div className="flex-1 flex flex-col items-center gap-3">
                          <div className="flex items-center justify-center gap-8 sm:gap-16">
                          {/* Team A */}
                          <Dialog onOpenChange={(open) => open && fetchPlayers(match.teamA._id)}>
                            <DialogTrigger asChild>
                              <div className="flex flex-col items-center min-w-0 cursor-pointer group">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border-[3px] border-gray-200 group-hover:border-blue-400 flex items-center justify-center overflow-hidden shadow-md transition-all group-hover:scale-105">
                                  <img
                                    src={getProfileImageUrl(match.teamA?.teamLogo)}
                                    alt={match.teamA?.teamName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                                  />
                                </div>
                                <span className="mt-2 font-bold text-sm sm:text-base text-gray-800 uppercase text-center truncate max-w-[100px] sm:max-w-[140px]">
                                  {match.teamA?.teamName || "TBD"}
                                </span>
                                {(match.result === 'live' || match.result === 'completed') && (
                                  <span className="text-lg sm:text-xl font-extrabold text-gray-900 mt-1">
                                    {match.teamAResult?.runs ?? match.teamA?.runs ?? 0}
                                    <span className="text-gray-400">/</span>
                                    {match.teamAResult?.wickets ?? match.teamA?.wickets ?? 0}
                                  </span>
                                )}
                              </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-lg font-bold uppercase">{match.teamA?.teamName} - Players</DialogTitle>
                              </DialogHeader>
                              {loadingTeamId === match.teamA._id ? (
                                <p className="text-center text-gray-500 py-4">Loading players...</p>
                              ) : (
                                <ul className="space-y-2 max-h-80 overflow-y-auto">
                                  {(teamPlayers[match.teamA._id] || []).length > 0 ? (
                                    teamPlayers[match.teamA._id].map((player, i) => (
                                      <li key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                        <img src={getProfileImageUrl(player.profileImage)} alt={player.name} className="w-8 h-8 rounded-full object-cover" onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }} />
                                        <span className="font-medium text-sm text-gray-800 uppercase">{player.name}</span>
                                        <span className="ml-auto text-xs text-gray-400 uppercase">{player.position}</span>
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-center text-gray-400 py-4">No players found</li>
                                  )}
                                </ul>
                              )}
                            </DialogContent>
                          </Dialog>

                          {/* VS / LIVE / Status */}
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-xl sm:text-2xl font-extrabold text-gray-300 tracking-widest">VS</div>
                            {match.result === 'live' && (
                              <span className="text-xs bg-red-500 text-white px-3 py-1 rounded-full animate-pulse font-bold uppercase">Live</span>
                            )}
                            {match.result === 'completed' && (
                              <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full font-bold uppercase">Completed</span>
                            )}
                            {(!match.result || match.result === 'upcoming') && (
                              <span className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full font-bold uppercase">Upcoming</span>
                            )}
                          </div>

                          {/* Team B */}
                          <Dialog onOpenChange={(open) => open && fetchPlayers(match.teamB._id)}>
                            <DialogTrigger asChild>
                              <div className="flex flex-col items-center min-w-0 cursor-pointer group">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border-[3px] border-gray-200 group-hover:border-blue-400 flex items-center justify-center overflow-hidden shadow-md transition-all group-hover:scale-105">
                                  <img
                                    src={getProfileImageUrl(match.teamB?.teamLogo)}
                                    alt={match.teamB?.teamName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                                  />
                                </div>
                                <span className="mt-2 font-bold text-sm sm:text-base text-gray-800 uppercase text-center truncate max-w-[100px] sm:max-w-[140px]">
                                  {match.teamB?.teamName || "TBD"}
                                </span>
                                {(match.result === 'live' || match.result === 'completed') && (
                                  <span className="text-lg sm:text-xl font-extrabold text-gray-900 mt-1">
                                    {match.teamBResult?.runs ?? match.teamB?.runs ?? 0}
                                    <span className="text-gray-400">/</span>
                                    {match.teamBResult?.wickets ?? match.teamB?.wickets ?? 0}
                                  </span>
                                )}
                              </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-lg font-bold uppercase">{match.teamB?.teamName} - Players</DialogTitle>
                              </DialogHeader>
                              {loadingTeamId === match.teamB._id ? (
                                <p className="text-center text-gray-500 py-4">Loading players...</p>
                              ) : (
                                <ul className="space-y-2 max-h-80 overflow-y-auto">
                                  {(teamPlayers[match.teamB._id] || []).length > 0 ? (
                                    teamPlayers[match.teamB._id].map((player, i) => (
                                      <li key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                        <span className="text-xs font-semibold text-gray-400 w-5 text-center">{i + 1}.</span>
                                        <img src={getProfileImageUrl(player.profileImage)} alt={player.name} className="w-8 h-8 rounded-full object-cover" onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }} />
                                        <span className="font-medium text-sm text-gray-800 uppercase">{player.name}</span>
                                        <span className="ml-auto text-xs text-gray-400 uppercase">{player.position}</span>
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-center text-gray-400 py-4">No players found</li>
                                  )}
                                </ul>
                              )}
                            </DialogContent>
                          </Dialog>
                          </div>

                          {/* Date & Time */}
                          <div className="flex items-center gap-4 text-base text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-blue-500" />
                              <span className="font-bold uppercase">
                                {new Date(match.matchTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-purple-500" />
                              <span className="font-bold">
                                {new Date(match.matchTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT: Button */}
                        <div className="flex flex-col items-center gap-4 lg:ml-auto">
                          {/* Stage badge + Details button - vertical */}
                          <div className="flex flex-col items-center gap-3">
                            <span className="hidden sm:inline-block text-sm md:text-base font-bold uppercase tracking-wider text-white bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-2 md:px-6 md:py-3 rounded-xl shadow-md">
                              {match.stage === "league" ? "League" : match.stage}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => navigate(`/match/${match._id}`)}
                              className={`whitespace-nowrap text-sm md:text-base font-bold uppercase rounded-xl px-5 py-2.5 md:px-8 md:py-3 h-auto shadow-lg transition-all hover:scale-105 ${
                                match.result === 'live'
                                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white animate-pulse'
                                  : match.result === 'completed'
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                              }`}
                            >
                              {match.result === 'live' ? 'Live Score' : match.result === 'completed' ? 'Scoreboard' : 'Details'}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Winner banner */}
                      {match.winner && match.margin && (
                        <div className="mt-4 pt-4 border-t-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-3">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                              <Trophy className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-base text-gray-800 uppercase">
                              {match.winner === "teamA" ? match.teamA?.teamName
                                : match.winner === "teamB" ? match.teamB?.teamName
                                : match.winner === "tie" || match.winner === "draw" ? "Match Tied"
                                : "No Result"}
                              {match.margin ? ` won by ${match.margin}` : ""}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
