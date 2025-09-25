import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DownloadIcon, RefreshCcw, Clock, Filter, Calendar, MapPin,Plus, Settings, Trophy,ArrowRight  } from 'lucide-react';
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

import {useToast} from "@/components/ui/use-toast";
import api from '@/lib/api';



interface Team {
  team: string;
  teamName: string;
  teamCode: string;
  teamLogo?: string; // Optional logo field
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
    runs?: number;
    wickets?: number;
    overs?: string;
  };

  teamB: {
    _id: string;
    teamName: string;
    teamLogo: string;
    teamCode: string;
    runs?: number;
    wickets?: number;
    overs?: string;
  };

  winner?: "teamA" | "teamB" | "tie" | "draw" | "no_result" | null;

  /** ✅ add this */
  margin?: string | null;
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

const MatchManagement: React.FC = () => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const scheduleRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const [newMatch, setNewMatch] = useState({
    seasonNumber: '',
    groupName: '',
    stage: '',
    teamA: '',
    teamB: '',
    date: today,
    time: '',
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

const user = JSON.parse(localStorage.getItem('pplt20_user') || '{}'); // example


const handleOpenCompleteDialog = (match: Match) => {
  setSelectedMatch(match);
  setCompleteDialogOpen(true);
};



useEffect(() => {
  if (schedule?.groups) {
    const allTeams = schedule.groups.flatMap(g => g.teams);
    setAvailableTeams(allTeams);
  }
}, [schedule]);



  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pplt20_token');
      const res = await api.get('/groups/schedule', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchedule(res.data.schedule);
    } catch (err) {
      console.error('❌ Failed to fetch schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Change fetchMatches to exclude playoff/final matches at the source
  const fetchMatches = async () => {
  try {
    const token = localStorage.getItem("pplt20_token");
    const res = await api.get("/matches", {
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
      if (!schedule?.seasonNumber?._id) return;

      // ✅ Generate Groups
      await api.post(
        `/groups/generate/${schedule.seasonNumber._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Generate League Matches
      await api.post(
        `/groups/generate/league/${schedule.seasonNumber._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        title: "Success",
        description: "Groups and League Matches generated successfully!",
      });
      fetchSchedule();
      fetchMatches();
    } catch (err) {
      console.error('❌ Failed to generate groups or league matches:', err);
      toast({
        title: "Error",
        description: "Failed to generate groups or league matches",
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
    fetchSchedule();
    fetchMatches();
  }, []);

  useEffect(() => {
    filterMatches();
  }, [selectedFilter, matches]);

  const groupColors = ['bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-red-100', 'bg-purple-100'];

  const handleAddMatch = async () => {
  try {
    if (!newMatch.date || !newMatch.time) {
      toast({
        title: "Missing Fields",
        description: "Please select both date and time.",
        variant: "destructive",
      });
      return;
    }

    // ✅ Proper ISO time
    const matchTime = new Date(`${newMatch.date}T${newMatch.time}`).toISOString();

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
      date: new Date().toISOString().split("T")[0],
      time: "",
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


  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        {/* Title & Subtitle */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-gray-800 flex items-center gap-2">
            📄 UPPL Season {schedule?.seasonNumber?.seasonNumber} –{" "}
            {new Date(schedule?.seasonNumber?.entryDeadline).getFullYear()}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-1">
            Entry Deadline:{" "}
            {new Date(schedule?.seasonNumber?.entryDeadline).toLocaleString()}
          </p>
        </div>


        {/* Actions */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-center">
          {user?.role === "super-admin" && (
            <Button
              variant="outline"
              className="flex items-center gap-2 w-full sm:w-auto"
              onClick={handleGenerateAll}
            >
              <RefreshCcw size={16} /> Generate Groups + League Matches
            </Button>
          )}

          {/* Download Dropdown */}
          <div className="relative group w-full sm:w-auto mt-2 sm:mt-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer transition mx-auto sm:mx-0">
              <DownloadIcon className="w-5 h-5 text-gray-700" />
            </div>
            <div className="absolute top-12 right-0 hidden group-hover:flex flex-col bg-white border rounded-lg shadow-lg text-sm min-w-[120px] z-10">
              <button
                className="px-4 py-2 hover:bg-gray-100 text-left"
                onClick={() => handleDownload("jpg")}
              >
                Download JPG
              </button>
              <button
                className="px-4 py-2 hover:bg-gray-100 text-left"
                onClick={() => handleDownload("pdf")}
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Groups */}
      <div ref={scheduleRef} className="space-y-4 sm:space-y-6 mb-6 sm:mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-6">
          {schedule?.groups.map((group, i) => (
            <div
              key={group.groupName}
              className={`rounded-md p-2 sm:p-4 shadow ${groupColors[i % groupColors.length]}`}
            >
              <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">
                Group {group.groupName}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-300 text-gray-700">
                      <th className="py-1 pr-2 sm:pr-4">#</th>
                      <th className="py-1">Team Name</th>
                      <th className="py-1 pr-2 sm:pr-4 font-bold">Team Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.teams.map((team, index) => (
                      <tr key={team.team} className="text-xs sm:text-sm">
                        <td className="py-1 pr-2 sm:pr-4">{index + 1}</td>
                        <td className="py-1">{team.teamName}</td>
                        <td className="py-1 pr-2 sm:pr-4 font-bold">{team.teamCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Match Schedule Title */}
      <div className="text-center px-4">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">Match Schedule</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-8 text-xs sm:text-sm">
        {/* Filter Section */}
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

        {/* Button Section */}
        <div className="w-full sm:w-auto sm:ml-auto">
          <Button
            variant="default"
            onClick={() => setOpen(true)}
            className="w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-4"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" /> Add Match
          </Button>
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
              className="relative hover:shadow-lg transition-shadow rounded-2xl border border-gray-200 overflow-hidden bg-gradient-to-br from-white to-gray-50"
            >
              {/* Action Buttons */}
              <div
                className="
                  mt-2 flex flex-row gap-2 justify-center
                  md:absolute md:top-2 md:right-2 md:flex-col md:gap-2 md:mt-0
                  lg:top-4 lg:right-4 lg:gap-3
                  z-10
                "
              >
                <Button
                  variant="default"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-2 py-1 rounded text-xs sm:text-xs w-full md:w-auto"
                  onClick={() => setEditMatch(match)}
                >
                  ✏️ Edit
                </Button>

                <Button
                  variant="default"
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold px-2 py-1 rounded text-xs sm:text-xs w-full md:w-auto"
                  onClick={() =>
                    setConfirmDelete({ open: true, matchId: match._id })
                  }
                >
                  🗑️ Delete
                </Button>

                {match.result === "upcoming" && (
                  <Button
                    variant="default"
                    className="bg-blue-600 text-white hover:bg-blue-700 px-2 py-1 rounded text-xs sm:text-xs w-full md:w-auto"
                    onClick={() => handleStartMatch(match._id)}
                  >
                    🚀 Start Match
                  </Button>
                )}

                {match.result === "live" && (
                  <Button
                    onClick={() => handleOpenCompleteDialog(match)}
                    className="px-2 py-1 bg-green-700 hover:bg-green-800 text-white text-xs sm:text-xs rounded w-full md:w-auto"
                  >
                    ✅ Complete
                  </Button>
                )}
              </div>

              {/* Match Content */}
              <CardContent className="p-4 sm:p-6 pb-10 sm:pb-16 flex flex-col h-full">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 sm:items-center sm:justify-between">
                  {/* Match Number + Type */}
                  <div className="flex flex-col items-center justify-center px-2 sm:px-4 border-b sm:border-b-0 sm:border-r border-gray-200">
                    <p className="text-xs sm:text-sm md:text-base font-bold text-gray-800">
                      Match #{index + 1}
                    </p>
                    <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-500">
                      {match.stage
                        ? match.stage.charAt(0).toUpperCase() + match.stage.slice(1)
                        : "League"}
                    </p>
                  </div>

                  {/* Teams Section */}
                  <div className="flex-1">
                    <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6">
                      {/* Team A */}
                      <div className="flex flex-col items-center group">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 md:border-4 border-white shadow-lg transition-transform duration-300 group-hover:scale-105">
                          {match.teamA.teamLogo ? (
                            <img
                              src={match.teamA.teamLogo}
                              alt="Team A Logo"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-white font-bold text-[10px] sm:text-sm md:text-lg"
                              style={{ backgroundColor: match.teamA.color }}
                            >
                              {match.teamA.short}
                            </div>
                          )}
                        </div>
                        <span className="mt-1 text-[10px] sm:text-xs md:text-sm font-semibold text-gray-800 truncate max-w-[60px] sm:max-w-[80px] md:max-w-[120px]">
                          {match.teamA.teamName}
                        </span>
                      </div>

                      {/* VS */}
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center shadow-inner">
                          <span className="text-xs sm:text-sm md:text-lg font-bold text-blue-600">
                            VS
                          </span>
                        </div>
                        <div
                          className={`mt-1 text-[9px] sm:text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full
                            ${
                              match.result === "live"
                                ? "bg-red-600 text-white animate-pulse shadow-md"
                              : match.result === "upcoming"
                                ? "bg-blue-100 text-blue-600"
                              : match.result === "completed"
                                ? "bg-green-100 text-green-600"
                              : match.result === "canceled"
                                ? "bg-gray-300 text-gray-700 line-through"
                              : "bg-gray-100 text-gray-500"
                            }
                          `}
                        >
                          {match.result === "live" ? "LIVE" : getStatusText(match.result)}
                        </div>
                      </div>

                      {/* Team B */}
                      <div className="flex flex-col items-center group">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 md:border-4 border-white shadow-lg transition-transform duration-300 group-hover:scale-105">
                          {match.teamB.teamLogo ? (
                            <img
                              src={match.teamB.teamLogo}
                              alt="Team B Logo"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-white font-bold text-[10px] sm:text-sm md:text-lg"
                              style={{ backgroundColor: match.teamB.color }}
                            >
                              {match.teamB.short}
                            </div>
                          )}
                        </div>
                        <span className="mt-1 text-[10px] sm:text-xs md:text-sm font-semibold text-gray-800 truncate max-w-[60px] sm:max-w-[80px] md:max-w-[120px]">
                          {match.teamB.teamName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="flex-1 mt-4 sm:mt-0 sm:pl-4 md:pl-8 sm:border-l border-gray-200">
                    <div className="space-y-3 md:space-y-4">
                      {/* Date & Time */}
                      <div className="flex flex-wrap gap-2 text-gray-700">
                        <div className="flex items-center gap-1.5 md:gap-2 bg-blue-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                          <span className="font-medium">
                            {formatDate(match.matchTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2 bg-purple-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                          <span className="font-medium">
                            {formatTime(match.matchTime)}
                          </span>
                        </div>
                      </div>

                      {/* Venue */}
                      {/* <div className="flex items-center gap-1.5 md:gap-2 text-gray-700 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                        <span className="font-medium truncate">
                          {match.venue?.trim() !== "" ? match.venue : "TBD"}
                        </span>
                      </div> */}

                      {/* Winner */}
                      {match.result === "completed" && (
                        <div className="mt-3 md:mt-4 p-2 md:p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-green-800">
                              {match.winner === "teamA" && match.teamA?.teamName
                                ? `${match.teamA.teamName} won by ${match.margin}`
                                : match.winner === "teamB" && match.teamB?.teamName
                                ? `${match.teamB.teamName} won by ${match.margin}`
                                : match.winner === "tie"
                                ? "Match Tied"
                                : match.winner === "draw"
                                ? "Match Drawn"
                                : "No Result"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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

              {/* Date */}
              <div>
                <label className="text-xs sm:text-sm font-medium mb-1 block">Date</label>
                <input
                  type="date"
                  value={
                    editMatch.matchTime
                      ? new Date(editMatch.matchTime).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const current = editMatch.matchTime
                      ? new Date(editMatch.matchTime)
                      : new Date();
                    const timePart =
                      current.toISOString().split("T")[1]?.slice(0, 5) || "12:00";
                    const combined = new Date(`${e.target.value}T${timePart}`);
                    setEditMatch({ ...editMatch, matchTime: combined.toISOString() });
                  }}
                  className="w-full border px-2 py-1 sm:px-3 sm:py-2 rounded text-sm"
                />
              </div>

              {/* Time */}
              <div>
                <label className="text-xs sm:text-sm font-medium mb-1 block">Time</label>
                <input
                  type="time"
                  value={
                    editMatch.matchTime
                      ? new Date(editMatch.matchTime).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""
                  }
                  onChange={(e) => {
                    const datePart = editMatch.matchTime
                      ? new Date(editMatch.matchTime)
                      : new Date();

                    // Preserve the date part, update only hours/minutes
                    const [hours, minutes] = e.target.value.split(":").map(Number);

                    const updated = new Date(datePart);
                    updated.setHours(hours, minutes, 0, 0);

                    setEditMatch({ ...editMatch, matchTime: updated.toISOString() });
                  }}
                  className="w-full border px-2 py-1 sm:px-3 sm:py-2 rounded text-sm"
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

            <Button
              onClick={handleSubmitMatchResult}
              className="w-full bg-green-700 hover:bg-green-800 text-white"
            >
              ✅ Confirm & Complete
            </Button>
          </DialogContent>
      </Dialog>


     <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="
          sm:max-w-md w-[95%] max-w-[500px] rounded-2xl shadow-xl 
          p-6 sm:p-8 space-y-5 bg-white dark:bg-neutral-900
          transition-all duration-300 ease-out
        "
      >
        <DialogHeader className="space-y-1 text-center">
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            Add New Match
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Fill out the match details and assign stage.
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <div className="grid gap-4 sm:gap-5">
          {/* Stage */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-medium">Stage</label>
            <Select
              value={newMatch.stage}
              onValueChange={(val) => setNewMatch({ ...newMatch, stage: val })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="league">League</SelectItem>
                <SelectItem value="playoff">Playoff</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Group Name (only for league) */}
          {newMatch.stage === "league" && (
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-medium">Group</label>
              <Select
                value={newMatch.groupName}
                onValueChange={(val) =>
                  setNewMatch({ ...newMatch, groupName: val })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {schedule?.groups.map((g) => (
                    <SelectItem key={g.groupName} value={g.groupName}>
                      {g.groupName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Team A */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-medium">Team A</label>
            <Select
              value={newMatch.teamA}
              onValueChange={(val) => setNewMatch({ ...newMatch, teamA: val })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select team A" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((team) => (
                  <SelectItem key={team.team} value={team.team}>
                    {team.teamName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team B */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-medium">Team B</label>
            <Select
              value={newMatch.teamB}
              onValueChange={(val) => setNewMatch({ ...newMatch, teamB: val })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select team B" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((team) => (
                  <SelectItem key={team.team} value={team.team}>
                    {team.teamName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-medium">Date</label>
              <input
                type="date"
                value={newMatch.date}
                onChange={(e) =>
                  setNewMatch({ ...newMatch, date: e.target.value })
                }
                className="w-full border rounded-lg px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-medium">Time</label>
              <input
                type="time"
                value={newMatch.time}
                onChange={(e) =>
                  setNewMatch({ ...newMatch, time: e.target.value })
                }
                className="w-full border rounded-lg px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button size="sm" className="rounded-xl" onClick={handleAddMatch}>
            Save Match
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
};

export default MatchManagement;
