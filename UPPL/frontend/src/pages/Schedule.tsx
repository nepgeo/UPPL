import React, { useEffect, useState } from "react";
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
import MatchDetailsDialog from "@/components/matches/MatchDetailsDialog";

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
            Don&apos;t miss any action! Complete fixture list for UPPL T20 2025
          </p>
        </div>
      </div> */}

      <div className="container mx-auto px-4 py-8">
        {/* Groups Section */}
        {groups.length > 0 && (
          <>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 mb-6">
              <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold mb-2">Tournament Groups</h2>
                <p className="text-lg opacity-90">
                  Explore all the groups and their teams for UPPL T20 2025
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
          </>
        )}

        {/* Filters */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-12 mb-6 shadow-lg">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-extrabold mb-3 flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth="1.5" 
                  stroke="currentColor" 
                  className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" 
                      d="M6.75 3v2.25M17.25 3v2.25M3 9h18M4.5 21h15a1.5 1.5 0 001.5-1.5V7.5a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 7.5v12A1.5 1.5 0 004.5 21z" />
              </svg>
              Matches Schedule
            </h2>
            <p className="text-lg opacity-90">
              Don&apos;t miss any action! Complete fixture list for UPPL T20 2025
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-start md:items-center">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter matches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Matches</SelectItem>
                <SelectItem value="league">League Matches</SelectItem>
                <SelectItem value="playoffs">Playoffs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Season Selector */}
          {seasons.length > 0 && (
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-gray-500" />
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((s: any) => (
                    <SelectItem key={s._id} value={s._id}>
                      Season {s.seasonNumber}{s.isCurrent ? " (Current)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Match Cards */}
        <div className="space-y-4 mb-12">
          {filteredMatches
            ?.sort(
              (a, b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime()
            )
            .map((match, index) => (
              <Card
                key={match._id}
                className="overflow-hidden border border-gray-200/80 hover:border-gray-300 transition-all duration-300 rounded-2xl shadow-sm hover:shadow-md"
              >
                <CardContent className="p-0">
                  {/* Top accent bar based on status */}
                  <div className={`h-1 w-full ${match.result === 'live' ? 'bg-red-500' : match.result === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`} />

                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">

                      {/* LEFT: Teams */}
                      <div className="flex-1 flex items-center justify-center lg:justify-start gap-4 sm:gap-8">
                        {/* Team A */}
                        <Dialog onOpenChange={(open) => open && fetchPlayers(match.teamA._id)}>
                          <DialogTrigger asChild>
                            <div className="flex flex-col items-center min-w-0 cursor-pointer group">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-50 border-2 border-gray-100 flex items-center justify-center overflow-hidden group-hover:border-blue-300 transition-colors">
                                <img
                                  src={getProfileImageUrl(match.teamA?.teamLogo)}
                                  alt={match.teamA?.teamName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                                />
                              </div>
                              <span className="mt-1.5 font-semibold text-xs sm:text-sm text-gray-800 text-center truncate max-w-[90px] sm:max-w-[120px]">
                                {match.teamA?.teamName || "TBD"}
                              </span>
                              {(match.result === 'live' || match.result === 'completed') && (
                                <span className="text-sm sm:text-base font-bold text-gray-900 mt-0.5">
                                  {match.teamAResult?.runs ?? match.teamA?.runs ?? 0}
                                  <span className="text-gray-400">/</span>
                                  {match.teamAResult?.wickets ?? match.teamA?.wickets ?? 0}
                                </span>
                              )}
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-lg font-bold">{match.teamA?.teamName} - Players</DialogTitle>
                            </DialogHeader>
                            {loadingTeamId === match.teamA._id ? (
                              <p className="text-center text-gray-500 py-4">Loading players...</p>
                            ) : (
                              <ul className="space-y-2 max-h-80 overflow-y-auto">
                                {(teamPlayers[match.teamA._id] || []).length > 0 ? (
                                  teamPlayers[match.teamA._id].map((player, i) => (
                                    <li key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                      <img src={getProfileImageUrl(player.profileImage)} alt={player.name} className="w-8 h-8 rounded-full object-cover" onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }} />
                                      <span className="font-medium text-sm text-gray-800">{player.name}</span>
                                      <span className="ml-auto text-xs text-gray-400">{player.position}</span>
                                    </li>
                                  ))
                                ) : (
                                  <li className="text-center text-gray-400 py-4">No players found</li>
                                )}
                              </ul>
                            )}
                          </DialogContent>
                        </Dialog>

                        {/* Score / VS */}
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-sm sm:text-base font-bold text-gray-300 tracking-widest">VS</div>
                          {match.result === 'live' && (
                            <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse font-bold">LIVE</span>
                          )}
                        </div>

                        {/* Team B */}
                        <Dialog onOpenChange={(open) => open && fetchPlayers(match.teamB._id)}>
                          <DialogTrigger asChild>
                            <div className="flex flex-col items-center min-w-0 cursor-pointer group">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-50 border-2 border-gray-100 flex items-center justify-center overflow-hidden group-hover:border-blue-300 transition-colors">
                                <img
                                  src={getProfileImageUrl(match.teamB?.teamLogo)}
                                  alt={match.teamB?.teamName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                                />
                              </div>
                              <span className="mt-1.5 font-semibold text-xs sm:text-sm text-gray-800 text-center truncate max-w-[90px] sm:max-w-[120px]">
                                {match.teamB?.teamName || "TBD"}
                              </span>
                              {(match.result === 'live' || match.result === 'completed') && (
                                <span className="text-sm sm:text-base font-bold text-gray-900 mt-0.5">
                                  {match.teamBResult?.runs ?? match.teamB?.runs ?? 0}
                                  <span className="text-gray-400">/</span>
                                  {match.teamBResult?.wickets ?? match.teamB?.wickets ?? 0}
                                </span>
                              )}
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-lg font-bold">{match.teamB?.teamName} - Players</DialogTitle>
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
                                      <span className="font-medium text-sm text-gray-800">{player.name}</span>
                                      <span className="ml-auto text-xs text-gray-400">{player.position}</span>
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

                      {/* RIGHT: Info + Button */}
                      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5 lg:ml-auto">
                        {/* Match meta */}
                        <div className="flex flex-col items-center sm:items-end gap-1 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(match.matchTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(match.matchTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${match.result === 'live' ? 'bg-red-500 animate-pulse' : match.result === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`} />
                            <span className="capitalize">{match.result || "upcoming"}</span>
                          </div>
                        </div>

                        {/* Stage badge + Details button */}
                        <div className="flex items-center gap-2">
                          <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md">
                            {match.stage === "league" ? "League" : match.stage}
                          </span>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => setSelectedMatch(match)}
                                className={`whitespace-nowrap text-xs font-semibold rounded-lg px-3.5 py-2 h-auto shadow-sm transition-all hover:scale-105 ${
                                  match.result === 'live'
                                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                                }`}
                              >
                                {match.result === 'live' ? 'Live Score' : 'Details'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="sr-only">Match Details</DialogTitle>
                              </DialogHeader>
                              <MatchDetailsDialog match={match} matchIndex={index} />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>

                    {/* Winner banner */}
                    {match.winner && match.margin && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          <span className="font-medium text-gray-700">
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
            ))}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
