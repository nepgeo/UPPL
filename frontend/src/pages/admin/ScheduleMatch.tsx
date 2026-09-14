import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DownloadIcon, RefreshCcw, Clock, Filter, Calendar, MapPin,Plus, Settings, Trophy,ArrowRight, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"; // ✅ Adjust the path if you're using different folder structure

import { useToast } from "@/components/ui/use-toast";
import api from '@/lib/api';
import BallScoring from '@/components/LiveScore/BallScoring';
import GroupManagement from './GroupManagement';
import MatchSetupWizard from '@/components/LiveScore/MatchSetupWizard';
import { DateTimePicker } from '@/components/ui/date-time-picker';



interface Team {
  team: { _id: string; teamName: string; teamCode: string; teamLogo?: string };
  teamName: string;
  teamCode: string;
  teamLogo?: string;
}

interface Group {
  groupName: string;
  teams: Team[];
}

interface Schedule {
  _id: string;
  seasonNumber: {
    _id: string;
    seasonNumber: number;
    entryDeadline: string;
  };
  groups: Group[];
}

export interface Match {
  _id: string;
  seasonNumber: string;
  stage: string;
  matchTime: string;
  result: "upcoming" | "completed" | "live";
  status?: string | null;

  teamA: {
    _id: string;
    teamName: string;
    teamLogo: string;
    teamCode: string;
    short?: string;
    color?: string;
    runs?: number;
    wickets?: number;
    overs?: string;
  };

  teamB: {
    _id: string;
    teamName: string;
    teamLogo: string;
    teamCode: string;
    short?: string;
    color?: string;
    runs?: number;
    wickets?: number;
    overs?: string;
  };

  winner?: "teamA" | "teamB" | "tie" | "draw" | "no_result" | null;

  /** ✅ add this */
  margin?: string | null;

  score?: {
    teamA: { runs: number; wickets: number; balls: number; extras?: number };
    teamB: { runs: number; wickets: number; balls: number; extras?: number };
  };
  teamAResult?: { runs: number; wickets: number; overs: string };
  teamBResult?: { runs: number; wickets: number; overs: string };

  playerOfTheMatch?: {
    playerName?: string;
    team?: string;
    reason?: string;
    battingRuns?: number;
    battingBalls?: number;
    bowlingWickets?: number;
    bowlingRuns?: number;
    bowlingOvers?: string;
    points?: number;
  };
}


const getStatusText = (result) => {
  switch (result) {
    case 'completed':
      return 'Completed';
    case 'live':
      return 'Live';
    case 'upcoming':
      return 'Upcoming';
    case 'cancelled':
      return 'Cancelled';
    case 'postponed':
      return 'Postponed';
    default:
      return 'Scheduled';
  }
};

const MatchManagement: React.FC<{ subTab?: 'groups' | 'matches' }> = ({ subTab = 'groups' }) => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const scheduleRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [seasons, setSeasons] = useState<{ _id: string; seasonNumber: number; isCurrent: boolean }[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  const [newMatch, setNewMatch] = useState({
    seasonNumber: '',
    groupName: '',
    stage: '',
    teamA: '',
    teamB: '',
    matchTime: null as Date | null,
    venue: '',
  });
  const { toast } = useToast();
  

const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
const [editMatch, setEditMatch] = useState<Match | null>(null);
const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; matchId: string | null }>({
  open: false,
  matchId: null
});

const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
const [matchResult, setMatchResult] = useState({
  teamA: { runs: '', wickets: '', overs: '' },
  teamB: { runs: '', wickets: '', overs: '' },
  winner: '',
});

const [ballScoringDialog, setBallScoringDialog] = useState(false);
const [scoringMatch, setScoringMatch] = useState<Match | null>(null);
const [scoringMatchData, setScoringMatchData] = useState<any>(null);
const [setupDialog, setSetupDialog] = useState(false);
const [setupMatch, setSetupMatch] = useState<Match | null>(null);

const user = JSON.parse(localStorage.getItem('pplt20_user') || '{}'); // example


const handleOpenCompleteDialog = (match: Match) => {
  setSelectedMatch(match);

  const ballsToOvers = (balls: number) => {
    const overs = Math.floor(balls / 6);
    const rem = balls % 6;
    return `${overs}.${rem}`;
  };

  const score = match.score;
  setMatchResult({
    teamA: {
      runs: String(score?.teamA?.runs ?? match.teamAResult?.runs ?? ''),
      wickets: String(score?.teamA?.wickets ?? match.teamAResult?.wickets ?? ''),
      overs: score?.teamA?.balls != null ? ballsToOvers(score.teamA.balls) : (match.teamAResult?.overs ?? ''),
    },
    teamB: {
      runs: String(score?.teamB?.runs ?? match.teamBResult?.runs ?? ''),
      wickets: String(score?.teamB?.wickets ?? match.teamBResult?.wickets ?? ''),
      overs: score?.teamB?.balls != null ? ballsToOvers(score.teamB.balls) : (match.teamBResult?.overs ?? ''),
    },
    winner: match.winner ?? '',
  });

  setCompleteDialogOpen(true);
};



useEffect(() => {
  if (schedule?.groups) {
    const allTeams = schedule.groups.flatMap(g => g.teams);
    setAvailableTeams(allTeams);
  }
}, [schedule]);



  const fetchSeasons = async () => {
    try {
      const res = await api.get('/seasons');
      const allSeasons = (res.data?.seasons || []).map((s: any) => ({
        _id: s._id,
        seasonNumber: s.seasonNumber,
        isCurrent: s.isCurrent,
      }));
      allSeasons.sort((a: any, b: any) => b.seasonNumber - a.seasonNumber);
      setSeasons(allSeasons);
      return allSeasons;
    } catch (err) {
      console.error('Failed to fetch seasons:', err);
      return [];
    }
  };

  const fetchSchedule = async (seasonIdOverride?: string) => {
  console.log("📡 [fetchSchedule] Starting to fetch schedule...");
  try {
    setLoading(true);

    // --- Log what URL will actually be called
    console.log("🌐 [fetchSchedule] API Base:", api.defaults.baseURL);
    console.log("🌐 [fetchSchedule] Endpoint: /groups/schedule");

    const params: any = {};
    if (seasonIdOverride) params.seasonId = seasonIdOverride;
    const res = await api.get("/groups/schedule", { params });

    // --- Log full raw response for inspection
    console.log("✅ [fetchSchedule] Response received:", res);

    // --- Log key fields to verify structure
    if (res.data?.success) {
      console.log("📦 [fetchSchedule] Schedule data:", res.data.schedule);
    } else {
      console.warn(
        "⚠️ [fetchSchedule] Unexpected response structure:",
        res.data
      );
    }

    const sched = res.data.schedule;
    setSchedule(sched);
    return seasonIdOverride || sched?.seasonNumber?._id;
  } catch (err: any) {
    console.error("❌ [fetchSchedule] Failed to fetch schedule:", err);

    // --- Log deeper error details if available
    if (err.response) {
      console.error(
        "❌ [fetchSchedule] Server responded with:",
        err.response.status,
        err.response.data
      );
    } else if (err.request) {
      console.error("❌ [fetchSchedule] No response received from server:", err.request);
    }

    const serverMessage =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch schedule";

    toast({
      title: "Failed to load schedule",
      description: serverMessage,
      variant: "destructive",
    });
  } finally {
    setLoading(false);
    console.log("🟢 [fetchSchedule] Finished (loading state cleared).");
  }
};



  const fetchMatches = async (seasonIdOverride?: string) => {
  try {
    const token = localStorage.getItem("pplt20_token");
    const seasonId = seasonIdOverride || schedule?.seasonNumber?._id || selectedSeasonId;
    const params: any = {};
    if (seasonId) params.seasonNumber = seasonId;
    const res = await api.get("/matches", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("📦 Raw matches from API:", res.data.matches);

    // Enrich match data for frontend display
    const enriched = res.data.matches.map((match: Match) => {
      const teamAName = match.teamA?.teamName || "TBD";
      const teamBName = match.teamB?.teamName || "TBD";

      return {
        ...match,
        teamA: match.teamA
          ? {
              ...match.teamA,
              short: teamAName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 3),
              color: "#4f46e5",
            }
          : { teamName: "TBD", short: "TBD", color: "#4f46e5" },
        teamB: match.teamB
          ? {
              ...match.teamB,
              short: teamBName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 3),
              color: "#059669",
            }
          : { teamName: "TBD", short: "TBD", color: "#059669" },
      };
    });

    console.log("✅ Enriched matches:", enriched);

    setMatches(enriched);
    setFilteredMatches(enriched); // for any filter dropdown
  } catch (err) {
    console.error("❌ Failed to fetch matches:", err);
  }
};





  const handleGenerateAll = async () => {
  try {
    const token = localStorage.getItem('pplt20_token');
    if (!token) {
      toast({ title: "Auth required", description: "Please login as an admin", variant: "destructive" });
      return;
    }
    if (!schedule?.seasonNumber?._id) {
      toast({ title: "No season", description: "No season selected or schedule missing", variant: "destructive" });
      return;
    }

    console.log("⚙️ Generating for season:", schedule.seasonNumber._id);

    // Generate Groups
    const res1 = await api.post(
      `/groups/generate/${schedule.seasonNumber._id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("generate groups response:", res1.data);

    // Generate League Matches
    const res2 = await api.post(
      `/groups/generate/league/${schedule.seasonNumber._id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("generate league matches response:", res2.data);

    toast({
      title: "Success",
      description: "Groups and League Matches generated successfully!",
    });

    const schedId = await fetchSchedule();
    fetchMatches(schedId);
  } catch (err: any) {
    console.error('❌ Failed to generate groups or league matches:', err);
    const serverMessage = err?.response?.data?.message || err?.message || "Unknown error";
    toast({
      title: "Error",
      description: serverMessage,
      variant: "destructive",
    });
  }
};




  const handleDownload = async (type: 'pdf' | 'jpg') => {
    if (!scheduleRef.current) return;
    const canvas = await html2canvas(scheduleRef.current);
    const dataURL = canvas.toDataURL('image/png');

    if (type === 'pdf') {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(dataURL, 'PNG', 0, 0, width, height);
      pdf.save(`UPPL_Season_${schedule?.seasonNumber?.seasonNumber}_Groups.pdf`);
    } else {
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `UPPL_Season_${schedule?.seasonNumber?.seasonNumber}_Groups.jpg`;
      link.click();
    }
  };

  const filterMatches = () => {
    if (selectedFilter === 'all') {
      setFilteredMatches(matches);
    } else {
      setFilteredMatches(matches.filter(match => match.stage === selectedFilter));
    }
  };

  const formatDate = (dateStr: string) =>
  dateStr ? new Date(dateStr).toLocaleDateString('en-GB') : 'N/A';

  const formatTime = (dateStr: string) =>
    dateStr
      ? new Date(dateStr).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : 'N/A';

  const getStatusBadge = (status: string, stage: string) => {
    const base = 'text-xs px-2 py-1 rounded-full font-semibold';
    switch (status) {
      case 'upcoming': return <span className={`${base} bg-yellow-100 text-yellow-700`}>Upcoming</span>;
      case 'live': return <span className={`${base} bg-green-100 text-green-700`}>Live</span>;
      case 'completed': return <span className={`${base} bg-blue-100 text-blue-700`}>Completed</span>;
      default: return <span className={`${base} bg-gray-100 text-gray-700`}>{stage}</span>;
    }
  };

  useEffect(() => {
    (async () => {
      const allSeasons = await fetchSeasons();
      const current = allSeasons.find((s: any) => s.isCurrent) || allSeasons[0];
      if (current) setSelectedSeasonId(current._id);
      const seasonId = current?._id || await fetchSchedule();
      fetchMatches(seasonId);
    })();
  }, []);

  useEffect(() => {
    filterMatches();
  }, [selectedFilter, matches]);

  const groupColors = ['bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-red-100', 'bg-purple-100'];

  const groupTeams = newMatch.groupName
    ? (schedule?.groups.find(g => g.groupName === newMatch.groupName)?.teams || [])
    : availableTeams;
  const teamBOptions = groupTeams.filter(t => t.team._id !== newMatch.teamA);

  const handleAddMatch = async () => {
  try {
    if (!newMatch.matchTime) {
      toast({
        title: "Missing Fields",
        description: "Please select both date and time.",
        variant: "destructive",
      });
      return;
    }
    if (!newMatch.teamA || !newMatch.teamB) {
      toast({ title: "Select both teams", variant: "destructive" });
      return;
    }
    if (newMatch.teamA === newMatch.teamB) {
      toast({ title: "Same team selected", description: "Team A and Team B must be different", variant: "destructive" });
      return;
    }

    // ✅ Proper ISO time from Date object
    const matchTime = newMatch.matchTime.toISOString();

    const payload = {
      seasonNumber: newMatch.seasonNumber,
      groupName: newMatch.groupName || null,
      stage: newMatch.stage,
      teamA: newMatch.teamA,
      teamB: newMatch.teamB,
      venue: newMatch.venue,
      matchTime,
    };

    console.log("🟡 Add Match Payload:", payload);

    const token = localStorage.getItem("pplt20_token");
    const res = await api.post("/matches", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const created = res.data.match || payload;

    toast({
      title: "✅ Match Added",
      description: `${created.teamA?.teamName || created.teamA} vs ${created.teamB?.teamName || created.teamB} has been created.`,
    });

    setOpen(false);

    // Reset form
    setNewMatch({
      seasonNumber: schedule?.seasonNumber?._id || "",
      groupName: "",
      stage: "",
      teamA: "",
      teamB: "",
      matchTime: null,
      venue: "",
    });

    await fetchMatches(); // 🔄 Refresh list
  } catch (err: any) {
    console.error("❌ Failed to add match:", err);

    toast({
      title: "Error",
      description:
        err.response?.data?.message || "Failed to save match. Try again.",
      variant: "destructive",
    });
  }
};

  const handleUpdateMatch = async () => {
  if (!editMatch) return;
  try {
    const token = localStorage.getItem("pplt20_token");

    // ensure ISO time if edited
    const updatedPayload = {
      ...editMatch,
      matchTime: editMatch.matchTime
        ? new Date(editMatch.matchTime).toISOString()
        : undefined,
    };

    const res = await api.put(
      `/matches/${editMatch._id}`,
      updatedPayload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    toast({
      title: "✅ Match Updated",
      description: `${res.data.match?.teamA?.teamName || "Team A"} vs ${res.data.match?.teamB?.teamName || "Team B"} updated successfully.`,
    });

    setEditMatch(null);
    await fetchMatches();
  } catch (err) {
    console.error("❌ Failed to update match:", err);
    toast({
      title: "Error",
      description: "Failed to update match",
      variant: "destructive",
    });
  }
};

const handleDeleteMatch = async () => {
  if (!confirmDelete.matchId) return;
  try {
    const token = localStorage.getItem('pplt20_token');
    await api.delete(`/matches/${confirmDelete.matchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setConfirmDelete({ open: false, matchId: null });
    fetchMatches();
  } catch (err) {
    console.error('❌ Failed to delete match:', err);
  }
};

const handleSubmitMatchResult = async () => {
  if (!selectedMatch) return;

  try {
    // ✅ Helper to sanitize numbers
    const parseNumber = (val: string | number | undefined) => {
      if (val === null || val === undefined) return 0;
      const n = Number(String(val).trim());
      return isNaN(n) ? 0 : n;
    };

    // ✅ Build payload
    const payload = {
      teamAResult: {
        runs: parseNumber(matchResult?.teamA?.runs),
        wickets: parseNumber(matchResult?.teamA?.wickets),
        overs: matchResult?.teamA?.overs?.trim() || "0",
      },
      teamBResult: {
        runs: parseNumber(matchResult?.teamB?.runs),
        wickets: parseNumber(matchResult?.teamB?.wickets),
        overs: matchResult?.teamB?.overs?.trim() || "0",
      },
      // default to null if not explicitly chosen
      winner: matchResult?.winner || null,
    };

    console.log("📤 Sending match result to backend:", payload);

    const token = localStorage.getItem("pplt20_token");

    await api.patch(
      `/matches/${selectedMatch._id}/result`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("✅ Match result updated successfully");
    alert("✅ Match marked as completed");

    // Close dialog + refresh data
    setCompleteDialogOpen(false);
    fetchMatches();
  } catch (err) {
    console.error("❌ Failed to update result:", err);
    alert("Failed to complete match");
  }
};






  const handleStartMatch = async (matchId: string) => {
    try {
      const token = localStorage.getItem('pplt20_token'); // Assuming your auth token is saved in localStorage

      if (!token) {
        alert('⚠️ Not logged in');
        return;
      }

      await api.patch(
        `/matches/${matchId}`,
        { result: 'live' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchMatches(); // Refresh
    } catch (err) {
      console.error('❌ Failed to start match:', err);
      alert('Failed to update match status');
    }
  };

  useEffect(() => {
    if (schedule?.seasonNumber?._id) {
      setNewMatch(prev => ({
        ...prev,
        seasonNumber: schedule.seasonNumber._id,
      }));
    }
  }, [schedule]);

  // ✅ Helper to safely get image URL
const getImageUrl = (image: any): string => {
  if (!image) return "/default-logo.png";
  if (typeof image === "string") return image;
  return image.url || image.secure_url || "/default-logo.png";
};

// ✅ Cancel a live match (mark it as upcoming again)
const handleCancelLiveMatch = async () => {
  if (!selectedMatch) return;

  try {
    const token = localStorage.getItem("pplt20_token");
    await api.patch(
      `/matches/${selectedMatch._id}`,
      { result: "upcoming" },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast({
      title: "Match Cancelled",
      description: "This match has been moved back to Upcoming.",
      variant: "default",
    });

    setCompleteDialogOpen(false);
    fetchMatches();
  } catch (err) {
    console.error("❌ Failed to cancel live match:", err);
    toast({
      title: "Error",
      description: "Unable to cancel match.",
      variant: "destructive",
    });
  }
};




  return (
    <div className="p-6">
    {subTab === 'groups' ? (
      <GroupManagement />
    ) : (
      <>
      {/* ======= MATCH SCHEDULE HEADER ======= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 border-b border-gray-200 pb-4">
        <div className="space-y-1 sm:space-y-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
            <span className="text-indigo-600 text-3xl sm:text-4xl">📅</span>
            <span>
              Match Schedule{" "}
              {selectedSeasonId ? (
                <select
                  value={selectedSeasonId}
                  onChange={async (e) => {
                    const sid = e.target.value;
                    setSelectedSeasonId(sid);
                    const schedId = await fetchSchedule(sid);
                    fetchMatches(schedId || sid);
                  }}
                  className="ml-2 bg-white border border-gray-300 rounded-lg px-3 py-1 text-lg font-semibold text-gray-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {seasons.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.seasonNumber}{s.isCurrent ? ' (Current)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                schedule?.seasonNumber?.seasonNumber ?? (
                  <span className="text-gray-400">N/A</span>
                )
              )}
            </span>
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-center">
          <Button variant="default" onClick={() => setOpen(true)} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Schedule Match
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-8 text-xs sm:text-sm">
        <div className="flex items-center space-x-1 sm:space-x-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-full sm:w-48 h-8 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm">
              <SelectValue placeholder="Filter matches" />
            </SelectTrigger>
            <SelectContent className="text-xs sm:text-sm">
              <SelectItem value="all">All Matches</SelectItem>
              <SelectItem value="league">League</SelectItem>
              <SelectItem value="playoff">Playoff</SelectItem>
              <SelectItem value="final">Final</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Match Cards */}
      <div className="space-y-10">
        {filteredMatches
          .sort(
            (a, b) =>
              new Date(a.matchTime).getTime() -
              new Date(b.matchTime).getTime()
          ) // Sort by date/time
          .map((match, index) => (
            <Card
              key={match._id}
              className="relative hover:shadow-xl transition-all duration-300 rounded-2xl border border-gray-200 overflow-hidden bg-white"
            >
              {/* Top accent bar */}
              <div className={`h-1.5 w-full ${
                match.result === 'live' ? 'bg-gradient-to-r from-red-500 to-orange-400' :
                match.result === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                'bg-gradient-to-r from-blue-500 to-indigo-400'
              }`} />

              <CardContent className="p-0">
                {/* Main Content Row */}
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
                    {/* Match Number + Status */}
                    <div className="flex items-center sm:flex-col sm:items-center gap-3 sm:gap-1 sm:min-w-[90px]">
                      <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider sm:text-center">
                        Match
                      </span>
                      <span className="text-2xl sm:text-3xl font-bold text-gray-900 sm:text-center">{index + 1}</span>
                      <div className={`ml-auto sm:ml-0 text-xs font-semibold px-3 py-1 rounded-full
                        ${match.result === 'live' ? 'bg-red-100 text-red-700' :
                          match.result === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'}`}
                      >
                        {match.result === 'live' ? 'LIVE' : getStatusText(match.result)}
                      </div>
                    </div>

                    {/* Teams */}
                    <div className="flex-1 flex items-center justify-center gap-4 sm:gap-8">
                      <div className="flex flex-col items-center min-w-0 flex-1">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-gray-100 shadow-md flex-shrink-0">
                          {match.teamA.teamLogo ? (
                            <img src={getImageUrl(match.teamA.teamLogo)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-base" style={{ backgroundColor: match.teamA.color }}>
                              {match.teamA.short}
                            </div>
                          )}
                        </div>
                        <span className="mt-2 text-sm sm:text-base font-semibold text-gray-800 text-center truncate max-w-[120px]">
                          {match.teamA.teamName}
                        </span>
                        {match.result === 'completed' && (
                          <span className="text-xs sm:text-sm text-gray-500 font-mono font-semibold">{match.teamA.runs ?? 0}/{match.teamA.wickets ?? 0}</span>
                        )}
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-sm sm:text-base font-bold text-gray-400 px-2">VS</span>
                        <span className="text-xs text-gray-400">{match.stage || 'League'}</span>
                      </div>

                      <div className="flex flex-col items-center min-w-0 flex-1">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-gray-100 shadow-md flex-shrink-0">
                          {match.teamB.teamLogo ? (
                            <img src={getImageUrl(match.teamB.teamLogo)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-base" style={{ backgroundColor: match.teamB.color }}>
                              {match.teamB.short}
                            </div>
                          )}
                        </div>
                        <span className="mt-2 text-sm sm:text-base font-semibold text-gray-800 text-center truncate max-w-[120px]">
                          {match.teamB.teamName}
                        </span>
                        {match.result === 'completed' && (
                          <span className="text-xs sm:text-sm text-gray-500 font-mono font-semibold">{match.teamB.runs ?? 0}/{match.teamB.wickets ?? 0}</span>
                        )}
                      </div>
                    </div>

                    {/* Date/Time */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:min-w-[130px]">
                      <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">{formatDate(match.matchTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                        <Clock className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">{formatTime(match.matchTime)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Player of the Match */}
                  {match.result === 'completed' && match.playerOfTheMatch?.playerName && (
                    <div className="mt-4 p-5 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-xl border-2 border-amber-300 shadow-md text-center">
                      <div className="flex justify-center mb-2">
                        <span className="text-4xl">🌟</span>
                      </div>
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Player of the Match</p>
                      <p className="text-xl sm:text-2xl font-extrabold text-amber-900">{match.playerOfTheMatch.playerName}</p>
                      {match.playerOfTheMatch.points ? (
                        <span className="inline-block mt-2 bg-amber-200 text-amber-900 text-sm font-bold px-3 py-1 rounded-full">{match.playerOfTheMatch.points} pts</span>
                      ) : null}
                      {match.playerOfTheMatch.reason && (
                        <p className="text-sm text-amber-700 mt-2 font-medium">{match.playerOfTheMatch.reason}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Big Action Buttons — full width, left to right */}
                <div className="border-t border-gray-100 bg-gray-50/80 px-4 sm:px-6 py-4">
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3">

                    {match.result === 'upcoming' && (
                      <>
                        <Button
                          className="w-full sm:flex-1 sm:min-w-[120px] h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                          onClick={() => { setSetupMatch(match); setSetupDialog(true); }}
                        >
                          🚀 Start Match
                        </Button>
                      </>
                    )}

                    {match.result === 'live' && (
                      <>
                        <Button
                          className="w-full sm:flex-1 sm:min-w-[120px] h-12 text-base font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm"
                          onClick={() => { setScoringMatch(match); setBallScoringDialog(true); }}
                        >
                          🏏 Ball by Ball
                        </Button>
                        <Button
                          className="w-full sm:flex-1 sm:min-w-[120px] h-12 text-base font-bold bg-green-700 hover:bg-green-800 text-white rounded-xl shadow-sm"
                          onClick={() => handleOpenCompleteDialog(match)}
                        >
                          ✅ Complete
                        </Button>
                      </>
                    )}

                    {match.result === 'completed' && (
                      <Button
                        className="w-full sm:flex-1 sm:min-w-[120px] h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                        onClick={() => { setScoringMatch(match); setBallScoringDialog(true); }}
                      >
                        🏏 Ball by Ball
                      </Button>
                    )}

                    {/* Edit / Delete — always visible */}
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto h-12 px-6 text-base font-semibold border-gray-200 text-gray-600 hover:text-yellow-700 hover:border-yellow-300 rounded-xl"
                      onClick={() => setEditMatch(match)}
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto h-12 px-6 text-base font-semibold border-gray-200 text-gray-600 hover:text-red-700 hover:border-red-300 rounded-xl"
                      onClick={() => setConfirmDelete({ open: true, matchId: match._id })}
                    >
                      🗑️ Delete
                    </Button>
                  </div>
                </div>

                {/* Winner — below buttons */}
                {match.result === 'completed' && (
                  <div className="px-4 sm:px-6 pb-4">
                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        <span className="text-base font-extrabold text-green-800">
                          {match.winner && match.winner !== 'tie' && match.winner !== 'draw' && match.winner !== 'no_result' ? (
                            <>
                              {match.winner === 'teamA' ? match.teamA?.teamName : match.teamB?.teamName}
                              {match.margin ? ` won by ${match.margin}` : ' won'}
                            </>
                          ) : match.winner === 'tie' ? 'Match Tied' :
                            match.winner === 'draw' ? 'Match Drawn' : 'No Result'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
      
      
       {/* Edit Match Modal */}
       {editMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-auto">
          <div className="bg-white rounded-md shadow-lg p-4 sm:p-6 w-full max-w-md sm:max-w-xl max-h-[95vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">✏️ Edit Match</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Stage */}
              <div>
                <label className="text-xs sm:text-sm font-medium mb-1 block">Stage</label>
                <p className="w-full border px-2 py-1 sm:px-3 sm:py-2 rounded bg-gray-50 text-sm text-gray-700">
                  {editMatch.stage.charAt(0).toUpperCase() + editMatch.stage.slice(1)}
                </p>
              </div>

              {/* Group Name (only if League) */}
              {editMatch.stage === "league" && (
                <div>
                  <label className="text-xs sm:text-sm font-medium mb-1 block">Group Name</label>
                  <p className="w-full border px-2 py-1 sm:px-3 sm:py-2 rounded bg-gray-50 text-sm text-gray-700">
                    {editMatch.groupName || "—"}
                  </p>
                </div>
              )}

              {/* Team A (read-only) */}
              <div>
                <label className="text-xs sm:text-sm font-medium mb-1 block">Team A</label>
                <input
                  type="text"
                  value={editMatch.teamA?.teamName || ""}
                  disabled
                  className="w-full border px-2 py-1 sm:px-3 sm:py-2 rounded text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Team B (read-only) */}
              <div>
                <label className="text-xs sm:text-sm font-medium mb-1 block">Team B</label>
                <input
                  type="text"
                  value={editMatch.teamB?.teamName || ""}
                  disabled
                  className="w-full border px-2 py-1 sm:px-3 sm:py-2 rounded text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Date & Time */}
              <div className="col-span-1 sm:col-span-2">
                <label className="text-xs sm:text-sm font-medium mb-1 block">Date & Time</label>
                <DateTimePicker
                  value={editMatch.matchTime ? new Date(editMatch.matchTime) : null}
                  onChange={(date) => {
                    if (date) {
                      setEditMatch({ ...editMatch, matchTime: date.toISOString() });
                    }
                  }}
                  placeholder="Select match date & time"
                />
              </div>


              {/* Venue */}
              {/* <div className="col-span-1 sm:col-span-2">
                <label className="text-xs sm:text-sm font-medium mb-1 block">Venue</label>
                <input
                  type="text"
                  placeholder="Stadium Name"
                  value={editMatch.venue || ""}
                  onChange={(e) => setEditMatch({ ...editMatch, venue: e.target.value })}
                  className="w-full border px-2 py-1 sm:px-3 sm:py-2 rounded text-sm"
                />
              </div> */}
            </div>

            {/* Action Buttons */}
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <Button size="sm" variant="outline" onClick={() => setEditMatch(null)}>
                Cancel
              </Button>
              <Button size="sm" variant="default" onClick={handleUpdateMatch}>
                Update Match
              </Button>
            </div>
          </div>
        </div>
      )}


       {/* Confirm Delete Modal */}
       {confirmDelete.open && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-md shadow-lg p-6 w-full max-w-sm">
              <h2 className="text-lg font-semibold mb-4">🗑️ Confirm Delete</h2>
              <p className="text-sm mb-6">Are you sure you want to delete this match?</p>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDelete({ open: false, matchId: null })}
                >
                  No
                </Button>
                <Button variant="destructive" onClick={handleDeleteMatch}>
                  Yes, Delete
                </Button>
              </div>
            </div>
          </div>
       )}


      {/* Complete Match Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Set Final Result</DialogTitle>
              <DialogDescription>
                Enter runs, wickets, and overs for both teams.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 my-4">
              {/* Team A */}
              <div>
                <h4 className="font-semibold mb-2">
                  {selectedMatch?.teamA?.teamName || "Team A"}
                </h4>
                <input
                  type="number"
                  placeholder="Runs"
                  className="border p-2 mb-2 w-full"
                  value={matchResult.teamA.runs}
                  onChange={(e) =>
                    setMatchResult({
                      ...matchResult,
                      teamA: { ...matchResult.teamA, runs: e.target.value },
                    })
                  }
                />
                <input
                  type="number"
                  placeholder="Wickets"
                  className="border p-2 mb-2 w-full"
                  value={matchResult.teamA.wickets}
                  onChange={(e) =>
                    setMatchResult({
                      ...matchResult,
                      teamA: { ...matchResult.teamA, wickets: e.target.value },
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Overs (e.g. 19.5)"
                  className="border p-2 w-full"
                  value={matchResult.teamA.overs}
                  onChange={(e) =>
                    setMatchResult({
                      ...matchResult,
                      teamA: { ...matchResult.teamA, overs: e.target.value },
                    })
                  }
                />
              </div>
              {/* Team B */}
              <div>
                <h4 className="font-semibold mb-2">
                  {selectedMatch?.teamB?.teamName || "Team B"}
                </h4>
                <input
                  type="number"
                  placeholder="Runs"
                  className="border p-2 mb-2 w-full"
                  value={matchResult.teamB.runs}
                  onChange={(e) =>
                    setMatchResult({
                      ...matchResult,
                      teamB: { ...matchResult.teamB, runs: e.target.value },
                    })
                  }
                />
                <input
                  type="number"
                  placeholder="Wickets"
                  className="border p-2 mb-2 w-full"
                  value={matchResult.teamB.wickets}
                  onChange={(e) =>
                    setMatchResult({
                      ...matchResult,
                      teamB: { ...matchResult.teamB, wickets: e.target.value },
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Overs"
                  className="border p-2 w-full"
                  value={matchResult.teamB.overs}
                  onChange={(e) =>
                    setMatchResult({
                      ...matchResult,
                      teamB: { ...matchResult.teamB, overs: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            {/* Winner Selection */}
            <div className="mb-4">
              <label className="block mb-2 font-medium">Winner</label>
              <select
                className="w-full border p-2"
                value={matchResult.winner}
                onChange={(e) =>
                  setMatchResult({ ...matchResult, winner: e.target.value })
                }
              >
                <option value="">Select Winner</option>
                <option value="teamA">{selectedMatch?.teamA?.teamName}</option>
                <option value="teamB">{selectedMatch?.teamB?.teamName}</option>
                <option value="draw">Draw</option>
                <option value="tie">Tie</option>
                <option value="no_result">No Result</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button
                onClick={handleCancelLiveMatch}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              >
                ❌ Cancel Live
              </Button>

              <Button
                onClick={handleSubmitMatchResult}
                className="w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white"
              >
                ✅ Confirm & Complete
              </Button>
            </div>

          </DialogContent>
      </Dialog>


     <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg w-[95%] rounded-3xl shadow-2xl p-0 overflow-hidden border-0">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">Add New Match</DialogTitle>
              <DialogDescription className="text-sm text-blue-100 mt-0.5">
                Schedule a new match with teams and timing
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Form body */}
        <div className="px-6 py-5 space-y-4 bg-gray-50/50">
          {/* Stage + Group row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Stage</label>
              <Select
                value={newMatch.stage}
                onValueChange={(val) => setNewMatch({ ...newMatch, stage: val, groupName: '', teamA: '', teamB: '' })}
              >
                <SelectTrigger className="h-11 rounded-xl border-2 text-sm font-medium">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="league">League</SelectItem>
                  <SelectItem value="playoff">Playoff</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newMatch.stage === "league" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Group</label>
                <Select
                  value={newMatch.groupName}
                  onValueChange={(val) =>
                    setNewMatch({ ...newMatch, groupName: val, teamA: '', teamB: '' })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl border-2 text-sm font-medium">
                    <SelectValue placeholder="Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {schedule?.groups.map((g) => (
                      <SelectItem key={g.groupName} value={g.groupName}>
                        Group {g.groupName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Teams */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Teams</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Team A */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-indigo-600">Team A</label>
                <Select
                  value={newMatch.teamA}
                  onValueChange={(val) => setNewMatch({ ...newMatch, teamA: val, teamB: newMatch.teamB === val ? '' : newMatch.teamB })}
                >
                  <SelectTrigger className="h-11 rounded-xl border-2 border-indigo-200 text-sm font-medium bg-white focus:border-indigo-500">
                    <SelectValue placeholder="Select team A" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupTeams.map((team) => (
                      <SelectItem key={team.team._id} value={team.team._id}>
                        {team.teamName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Team B */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-600">Team B</label>
                <Select
                  value={newMatch.teamB}
                  onValueChange={(val) => setNewMatch({ ...newMatch, teamB: val })}
                >
                  <SelectTrigger className="h-11 rounded-xl border-2 border-emerald-200 text-sm font-medium bg-white focus:border-emerald-500">
                    <SelectValue placeholder={newMatch.teamA ? "Select team B" : "Select team A first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {teamBOptions.map((team) => (
                      <SelectItem key={team.team._id} value={team.team._id}>
                        {team.teamName}
                      </SelectItem>
                    ))}
                    {teamBOptions.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-400">No teams available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newMatch.teamA && newMatch.teamB && (
              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-200">
                <span className="text-sm font-bold text-indigo-700">
                  {groupTeams.find(t => t.team._id === newMatch.teamA)?.teamName || 'Team A'}
                </span>
                <span className="text-xs font-bold text-gray-400">VS</span>
                <span className="text-sm font-bold text-emerald-700">
                  {groupTeams.find(t => t.team._id === newMatch.teamB)?.teamName || 'Team B'}
                </span>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Date & Time</label>
            <DateTimePicker
              value={newMatch.matchTime}
              onChange={(date) => setNewMatch({ ...newMatch, matchTime: date })}
              placeholder="Select match date & time"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-white border-t border-gray-100">
          <Button
            variant="outline"
            className="h-11 px-6 rounded-xl font-semibold border-2"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="h-11 px-8 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-200"
            onClick={handleAddMatch}
          >
            Save Match
          </Button>
        </div>
      </DialogContent>
     </Dialog>

      {/* Ball-by-Ball Scoring Dialog */}
      <Dialog open={ballScoringDialog} onOpenChange={(open) => {
        setBallScoringDialog(open);
        if (!open) { setScoringMatch(null); setScoringMatchData(null); }
      }}>
        <DialogContent className="max-w-full h-dvh !rounded-none p-0 flex flex-col" hideClose>
          <DialogHeader className="px-4 pt-3 pb-0 flex-shrink-0">
            <DialogTitle className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <span className="text-xl font-bold text-blue-600">{scoringMatch?.teamA?.teamName}</span>
                <span className="text-base font-semibold text-muted-foreground">vs</span>
                <span className="text-xl font-bold text-blue-600">{scoringMatch?.teamB?.teamName}</span>
                <span className="flex items-center gap-2">
                  {(scoringMatch || scoringMatchData)?.result === 'live' && (
                    <span className="text-sm font-bold text-white bg-red-500 px-3 py-1 rounded-full animate-pulse shadow-lg shadow-red-500/50">LIVE</span>
                  )}
                  {(scoringMatch || scoringMatchData)?.currentInnings === 2 && (
                    <span className="text-sm font-bold text-white bg-amber-500 px-3 py-1 rounded-full shadow-lg shadow-amber-500/30">2nd Innings</span>
                  )}
                </span>
              </div>
              {(() => {
                const m = scoringMatchData || scoringMatch;
                const ci = scoringMatchData?.currentInnings ?? scoringMatch?.currentInnings;
                if (m?.tossWinner) {
                  const winnerName = m.tossWinner === 'teamA' ? m?.teamA?.teamName : m?.teamB?.teamName;
                  return (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-1.5 rounded-full shadow">
                        {winnerName} won the toss & chose to {m?.tossDecision}
                      </span>
                      {ci ? <span className="text-lg font-bold text-white bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-1 rounded-full shadow">Innings {ci}</span> : null}
                    </div>
                  );
                }
                return ci ? (
                  <span className="text-lg font-bold text-white bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-1 rounded-full shadow">Innings {ci}</span>
                ) : null;
              })()}
            </DialogTitle>
          </DialogHeader>
          {/* Custom close button */}
          <button onClick={() => { setBallScoringDialog(false); setScoringMatch(null); setScoringMatchData(null); }}
            className="absolute right-3 top-3 z-10 w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors">
            <X className="h-5 w-5 text-slate-700" />
          </button>
          <div className="flex-1 overflow-y-auto p-4">
            {scoringMatch && (
              <BallScoring
                matchId={scoringMatch._id}
                match={scoringMatchData || scoringMatch}
                onUpdate={async () => {
                  try {
                    const res = await api.get(`/matches/${scoringMatch._id}/scoring-state`);
                    setScoringMatchData(res.data.match);
                  } catch {}
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Playing XI + Toss Setup Dialog */}
      <Dialog open={setupDialog} onOpenChange={(open) => {
        setSetupDialog(open);
        if (!open) { setSetupMatch(null); }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Match Setup: {setupMatch?.teamA?.teamName} vs {setupMatch?.teamB?.teamName}
            </DialogTitle>
          </DialogHeader>
          {setupMatch && (
            <MatchSetupWizard
              matchId={setupMatch._id}
              match={setupMatch}
              onComplete={async () => {
                setSetupDialog(false);
                // Auto-open ball-by-ball scoring with correct innings
                setScoringMatch(setupMatch);
                setBallScoringDialog(true);
                try {
                  const res = await api.get(`/matches/${setupMatch._id}/scoring-state`);
                  setScoringMatchData(res.data.match);
                } catch {}
                fetchMatches();
                toast({
                  title: '✅ Toss done, scoring ready',
                  description: 'Ball-by-ball scoring opened',
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
    )}
    </div>
  );
};

export default MatchManagement;
