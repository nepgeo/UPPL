import React, { useEffect, useState } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Filter,
  Trophy,
} from "lucide-react";
import axios from "axios";
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
  const [selectedMonth, setSelectedMonth] = useState("january-2024");
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const token = localStorage.getItem("pplt20_token");

  const [teamPlayers, setTeamPlayers] = useState<{ [teamId: string]: any[] }>({});
  const [loadingTeamId, setLoadingTeamId] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
    fetchGroups();
    fetchPlayers();
  }, []);

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

  const fetchMatches = async () => {
    try {
      const res = await api.get("/matches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatches(res.data.matches || []);
    } catch (err) {
      console.error("❌ Failed to fetch matches", err);
    }
  };

  const fetchGroups = async () => {
    try {
    
      const res = await api.get("/groups/schedule", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ Raw API response:", res);          // full Axios response
    console.log("✅ Response data:", res.data);        // just the response body
    console.log("✅ Groups received:", res.data.groups); 
      setGroups(res.data.schedule?.groups || []);
    } catch (err) {
      console.error("❌ Failed to fetch groups", err);
    }
  };

  const fetchPlayers = async () => {
  try {
    setLoadingTeamId("all"); 
    const token = localStorage.getItem("pplt20_token");

    const res = await fetch(`${BASE_URL}/api/teams/with-players`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch teams with players");
    }

    // Store per-team players
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

        <div className="flex flex-col md:flex-row gap-4 mb-8">          
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
                className="hover:shadow-2xl transition-transform transform hover:scale-[1.02] rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800"
              >
                <CardContent className="p-4 sm:p-6 text-white">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">

                    {/* LEFT: Match Info + Teams */}
                    <div className="flex flex-col space-y-4 w-full">
                      {/* Match number + stage */}
                      <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
                        <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-lg shadow">
                          Match {index + 1}
                        </span>
                        <span className="uppercase tracking-wide bg-black/30 px-2 sm:px-3 py-1 rounded-lg">
                          {match.stage}
                        </span>
                      </div>

                      {/* Teams row */}
                      <div className="flex items-center justify-center space-x-6 sm:space-x-10">
                        {/* Team A */}
                        <Dialog onOpenChange={(open) => open && fetchPlayers(match.teamA._id)}>
                          <DialogTrigger asChild>
                            <div className="text-center group cursor-pointer">
                              <img
                                src={match.teamA?.teamLogo}
                                alt={match.teamA?.teamName}
                                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full mx-auto shadow-lg"
                              />
                              <div className="mt-2 font-bold text-sm sm:text-lg">{match.teamA?.teamName}</div>
                            </div>
                          </DialogTrigger>
                          
                          <DialogContent className="max-w-lg bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white rounded-2xl shadow-xl">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold text-center">
                                {match.teamA?.teamName} - Players
                              </DialogTitle>
                            </DialogHeader>

                            {loadingTeamId === match.teamA._id ? (
                              <p className="text-center text-gray-200">Loading players...</p>
                            ) : (
                              <ul className="mt-4 space-y-2">
                                {teamPlayers[match.teamA._id]?.length > 0 ? (
                                  teamPlayers[match.teamA._id].map((player, i) => (
                                    <li
                                      key={i}
                                      className="bg-white/10 p-2 rounded-lg flex items-center gap-3"
                                    >
                                      <img
                                        src={getProfileImageUrl(player.profileImage)}
                                        alt={player.name}
                                        className="w-8 h-8 rounded-full"
                                      />
                                      <span className="font-medium">{player.name}</span>
                                      <span className="ml-auto text-xs text-gray-300">{player.position}</span>
                                    </li>
                                  ))
                                ) : (
                                  <li className="text-center text-gray-200">No players found</li>
                                )}
                              </ul>
                            )}
                          </DialogContent>
                        </Dialog>


                        <div className="text-lg sm:text-2xl font-extrabold text-gray-200">VS</div>

                        {/* Team B */}
                        <Dialog onOpenChange={(open) => open && fetchPlayers(match.teamB._id)}>
                          <DialogTrigger asChild>
                            <div className="text-center group cursor-pointer">
                              {match.teamB?.teamLogo && (
                                <img
                                  src={match.teamB.teamLogo}
                                  alt={match.teamB.teamName}
                                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full mx-auto shadow-lg"
                                />
                              )}
                              <div className="mt-2 font-bold text-sm sm:text-lg">
                                {match.teamB?.teamName || "TBD"}
                              </div>
                            </div>
                          </DialogTrigger>

                          <DialogContent className="max-w-lg bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white rounded-2xl shadow-xl">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold text-center">
                                {match.teamB?.teamName} - Players
                              </DialogTitle>
                            </DialogHeader>

                            {loadingTeamId === match.teamB._id ? (
                              <p className="text-center text-gray-200">Loading players...</p>
                            ) : (
                              <ul className="mt-4 space-y-2">
                                {teamPlayers[match.teamB._id]?.length > 0 ? (
                                  teamPlayers[match.teamB._id].map((player, i) => (
                                    <li
                                      key={i}
                                      className="bg-white/10 p-2 rounded-lg flex items-center gap-3"
                                    >

                                      <span className="font-semibold w-6 text-center">{i + 1}.</span>
                                      <img
                                        src={getProfileImageUrl(player.profileImage)}
                                        alt={player.name}
                                        className="w-8 h-8 rounded-full"
                                      />
                                      <span className="font-medium">{player.name}</span>
                                      <span className="ml-auto text-xs text-gray-300">{player.position}</span>
                                    </li>
                                  ))
                                ) : (
                                  <li className="text-center text-gray-200">No players found</li>
                                )}
                              </ul>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>

                      {/* Date, Time, Venue */}
                      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-200 mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(match.matchTime).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(match.matchTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        {/* <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {match.venue}
                        </div> */}
                      </div>

                      {/* Winner Info */}
                      {match.winner && match.margin && (
                        <div className="mt-3 sm:mt-4 bg-yellow-500 text-black px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow text-center">
                          {match.winner === "teamA" && match.teamA?.teamName
                            ? match.teamA.teamName
                            : match.winner === "teamB" && match.teamB?.teamName
                            ? match.teamB.teamName
                            : match.winner === "tie" || match.winner === "draw"
                            ? "Match tied"
                            : match.winner === "no_result"
                            ? "No result"
                            : ""
                          }
                          {(match.winner === "teamA" || match.winner === "teamB") && match.margin
                            ? ` won by ${match.margin}`
                            : ""
                          }
                        </div>
                      )}



                      {/* View Details Button (centered on small screens) */}
                      <div
                        className="
                          flex justify-center mt-3   /* 📱 Small: below winner */
                          lg:absolute lg:top-1/2 lg:right-4 lg:-translate-y-1/2 lg:mt-0 /* 💻 Large: middle right */
                        "
                      >
                        <Dialog>
                           <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedMatch(match)}
                              className="
                                relative 
                                overflow-hidden 
                                px-4 sm:px-5 py-2 
                                text-xs sm:text-sm font-semibold
                                text-black
                                border border-yellow-500 
                                rounded-xl
                                shadow-md
                                transition-all 
                                duration-300 
                                ease-in-out
                                hover:scale-105 
                                hover:shadow-lg 
                                hover:text-white 
                                hover:border-transparent
                                bg-yellow-400 
                                hover:bg-yellow-500
                              "
                            >
                              <span className="relative z-10">View Details</span>
                              <span
                                className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"
                              />
                            </Button>
                          </DialogTrigger>


                          <DialogContent className="w-full max-w-xs sm:max-w-md md:max-w-xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white rounded-2xl shadow-xl p-3 sm:p-6">
                            <DialogHeader>
                              <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-center">
                                Match {index + 1} - {match.stage}
                              </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-3 sm:space-y-4 md:space-y-6 mt-3 sm:mt-4">
                              {/* Match Info */}
                              <div className="text-center space-y-1 sm:space-y-2 text-xs sm:text-sm md:text-base">
                                <p className="flex items-center justify-center gap-1 sm:gap-2">
                                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                                  {new Date(match.matchTime).toLocaleDateString()}
                                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mx-1" />
                                  {new Date(match.matchTime).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>

                              {/* Teams Summary */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                                {["teamA", "teamB"].map((t) => {
                                  const team = match[t as "teamA" | "teamB"];
                                  return (
                                    <div
                                      key={team.teamName}
                                      className="bg-white/10 p-2 sm:p-3 md:p-4 rounded-xl shadow flex flex-col items-center"
                                    >
                                      {team.teamLogo && (
                                        <img
                                          src={team.teamLogo}
                                          alt={team.teamName}
                                          className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full mb-1 sm:mb-2"
                                        />
                                      )}
                                      <h3 className="font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2 text-center">
                                        {team.teamName}
                                      </h3>
                                      <div className="flex justify-between w-full text-gray-200 text-xs sm:text-sm md:text-sm">
                                        <span>Runs: {team.runs ?? "-"}</span>
                                        <span>Wickets: {team.wickets ?? "-"}</span>
                                        <span>Overs: {team.overs ?? "-"}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Winner Info */}
                              {match.winner && match.margin && (
                              <div className="mt-3 sm:mt-4 bg-yellow-500 text-black px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow text-center">
                                {match.winner === "teamA"
                                  ? match.teamA?.teamName
                                  : match.winner === "teamB"
                                  ? match.teamB?.teamName
                                  : match.winner === "tie" || match.winner === "draw"
                                  ? "Match tied"
                                  : match.winner === "no_result"
                                  ? "No result"
                                  : ""
                                } 
                                {(match.winner === "teamA" || match.winner === "teamB") && match.margin
                                  ? ` won by ${match.margin}`
                                  : ""}
                              </div>
                            )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
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
