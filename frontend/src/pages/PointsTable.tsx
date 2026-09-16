import { useState, useEffect, useMemo } from "react";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProfileImageUrl } from "@/utils/getProfileImageUrl";

const GROUP_COLORS = [
  { accent: "from-blue-500 to-blue-600", light: "bg-blue-50", ring: "ring-blue-200", text: "text-blue-700" },
  { accent: "from-emerald-500 to-emerald-600", light: "bg-emerald-50", ring: "ring-emerald-200", text: "text-emerald-700" },
  { accent: "from-amber-500 to-amber-600", light: "bg-amber-50", ring: "ring-amber-200", text: "text-amber-700" },
  { accent: "from-rose-500 to-rose-600", light: "bg-rose-50", ring: "ring-rose-200", text: "text-rose-700" },
  { accent: "from-violet-500 to-violet-600", light: "bg-violet-50", ring: "ring-violet-200", text: "text-violet-700" },
  { accent: "from-cyan-500 to-cyan-600", light: "bg-cyan-50", ring: "ring-cyan-200", text: "text-cyan-700" },
];

const TEAM_COLORS = [
  "#2563eb", "#7c3aed", "#059669", "#d97706",
  "#dc2626", "#0891b2", "#ca8a04", "#9333ea",
  "#16a34a", "#e11d48", "#0d9488", "#f97316",
];

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return TEAM_COLORS[Math.abs(hash) % TEAM_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatNrr(nrr: number): string {
  if (nrr === 0) return "0.00";
  const sign = nrr > 0 ? "+" : "";
  return `${sign}${nrr.toFixed(3)}`;
}

function formatNrrMobile(nrr: number): string {
  if (nrr === 0) return "0.00";
  const sign = nrr > 0 ? "+" : "";
  return `${sign}${nrr.toFixed(2)}`;
}

function safeArray<T>(arr: T[] | undefined | null): T[] {
  return Array.isArray(arr) ? arr : [];
}

interface TeamRow {
  teamId?: string;
  team: string;
  teamCode?: string;
  teamLogo?: string;
  matches: number;
  won: number;
  lost: number;
  tied: number;
  nrr: number;
  points: number;
  form: string[];
  groupName?: string;
  position: number;
  qualified?: string | null;
}

interface PointsData {
  groups: Record<string, TeamRow[]>;
  all: TeamRow[];
}

function normalizeTeamRow(row: any, idx: number): TeamRow {
  const teamName = row.team || row.teamName || row.name || (row.teamObj && (row.teamObj.teamName || row.teamObj.name)) || "";
  const nrrVal = (() => {
    let v = row.nrr ?? row.nrrSum ?? row.netRunRate;
    if (v === undefined || v === null) {
      const s = row.nrrString || row.netRunRateString;
      if (typeof s === "string") { const p = parseFloat(s); if (!isNaN(p)) v = p; }
      v = v ?? 0;
    }
    return typeof v === "number" ? v : parseFloat(v) || 0;
  })();
  let form: string[] = [];
  if (Array.isArray(row.form)) form = row.form;
  else if (typeof row.form === "string") form = row.form.includes(",") ? row.form.split(",").map((s: string) => s.trim()).filter(Boolean) : row.form.split("").map((s: string) => s.trim()).filter(Boolean);
  else if (Array.isArray(row.lastResults)) form = row.lastResults;
  const position = row.groupPosition ?? row.group_pos ?? row.position ?? row.pos ?? idx + 1;
  const qualified = row.qualified ?? row.status ?? row.qualification ?? null;
  const groupName = row.groupName ?? row.group ?? row.group_label ?? row.groupLabel ?? "Group";
  return {
    teamId: row.teamId || row._id || (row.teamObj && row.teamObj._id) || row.id || null,
    team: teamName,
    teamCode: row.teamCode || row.code || (row.teamObj && row.teamObj.teamCode) || "",
    teamLogo: row.teamLogo || row.logo || (row.teamObj && row.teamObj.teamLogo) || null,
    matches: row.matches ?? row.played ?? row.playedMatches ?? 0,
    won: row.won ?? row.wins ?? 0,
    lost: row.lost ?? row.losses ?? 0,
    tied: row.tied ?? row.ties ?? 0,
    nrr: nrrVal,
    points: typeof row.points === "number" ? row.points : parseInt(row.points, 10) || 0,
    form,
    groupName,
    position: typeof position === "number" ? position : parseInt(position, 10) || idx + 1,
    qualified,
  };
}

const Skeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-12">
    <div className="bg-gradient-to-r from-blue-700 via-purple-800 to-indigo-900 text-white py-16 mb-8" />
    <div className="container mx-auto px-4">
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden animate-pulse">
        <div className="h-14 bg-gray-100/60" />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-white/20">
            <div className="w-8 h-8 rounded-full bg-gray-100" />
            <div className="h-4 bg-gray-100 rounded w-48" />
            <div className="flex-1" />
            <div className="h-4 bg-gray-100 rounded w-12" />
            <div className="h-4 bg-gray-100 rounded w-12" />
            <div className="h-4 bg-gray-100 rounded w-12" />
            <div className="h-4 bg-gray-100 rounded w-12" />
            <div className="h-4 bg-gray-100 rounded w-16" />
            <div className="h-4 bg-gray-100 rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PointsTable = () => {
  const [viewType, setViewType] = useState<"current" | "form">("current");
  const [loading, setLoading] = useState(true);
  const [pointsTable, setPointsTable] = useState<PointsData>({ groups: {}, all: [] });
  const [seasonLabel, setSeasonLabel] = useState("");
  const [allSeasons, setAllSeasons] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");

  const fetchPointsTable = async (seasonId: string, headers: Record<string, string>) => {
    if (!seasonId) {
      setPointsTable({ groups: {}, all: [] });
      return;
    }
    const ptRes = await fetch(`/api/points-table/${encodeURIComponent(seasonId)}`, { headers });
    let raw: any = {};
    try { raw = await ptRes.json(); } catch { raw = {}; }

    const normalized: PointsData = { groups: {}, all: [] };
    const src = raw?.groups || raw?.all ? raw : Array.isArray(raw) ? { all: raw } : raw?.teams ? { all: raw.teams } : normalized;
    if (src.groups) normalized.groups = src.groups;
    if (src.all) normalized.all = Array.isArray(src.all) ? src.all : [];

    const finalGroups: Record<string, TeamRow[]> = {};
    const finalAll: TeamRow[] = [];

    if (Object.keys(normalized.groups).length) {
      Object.entries(normalized.groups).forEach(([gName, arr]) => {
        if (!Array.isArray(arr)) return;
        const norm = arr.map((r: any, i: number) => normalizeTeamRow(r, i));
        norm.sort((a, b) => {
          if (a.position !== b.position) return a.position - b.position;
          if (b.points !== a.points) return b.points - a.points;
          return b.nrr - a.nrr;
        });
        norm.forEach((t, i) => (t.position = i + 1));
        finalGroups[gName] = norm;
        finalAll.push(...norm);
      });
    }

    if (!finalAll.length && Array.isArray(normalized.all) && normalized.all.length) {
      const allNorm = normalized.all.map((r: any, i: number) => normalizeTeamRow(r, i));
      const grouped: Record<string, TeamRow[]> = {};
      allNorm.forEach((t) => {
        const g = t.groupName?.trim() || "Ungrouped";
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push(t);
      });
      Object.values(grouped).forEach((arr) => {
        arr.sort((a, b) => { if (a.position !== b.position) return a.position - b.position; if (b.points !== a.points) return b.points - a.points; return b.nrr - a.nrr; });
        arr.forEach((t, i) => (t.position = i + 1));
      });
      Object.assign(finalGroups, grouped);
      finalAll.push(...allNorm);
    }

    setPointsTable({ groups: finalGroups, all: finalAll });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("pplt20_token") || "";
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [seasonRes, allSeasonsRes] = await Promise.all([
          fetch("/api/seasons/current", { headers }),
          fetch("/api/seasons", { headers }),
        ]);

        const currentSeason = await seasonRes.json();
        let allSeasonsData: any[] = [];
        try { allSeasonsData = await allSeasonsRes.json(); } catch { allSeasonsData = []; }
        if (!Array.isArray(allSeasonsData)) allSeasonsData = [];
        setAllSeasons(allSeasonsData);

        const currentSeasonId = currentSeason?._id || currentSeason?.id || currentSeason?.seasonNumber;
        setSelectedSeasonId(currentSeasonId || "");
        setSeasonLabel(currentSeason?.seasonLabel || currentSeason?.name || `Season ${currentSeason?.seasonNumber || ""}` || "");

        await fetchPointsTable(currentSeasonId, headers);
      } catch (err) {
        console.error("Error fetching points table:", err);
        setPointsTable({ groups: {}, all: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSeasonChange = async (season: any) => {
    const seasonId = season?._id || season?.id || season?.seasonNumber;
    if (!seasonId || seasonId === selectedSeasonId) return;
    setLoading(true);
    setSelectedSeasonId(seasonId);
    setSeasonLabel(season?.seasonLabel || season?.name || `Season ${season?.seasonNumber || ""}` || "");
    try {
      const token = localStorage.getItem("pplt20_token") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await fetchPointsTable(seasonId, headers);
    } catch (err) {
      console.error("Error fetching points table:", err);
      setPointsTable({ groups: {}, all: [] });
    } finally {
      setLoading(false);
    }
  };

  const groupEntries = useMemo(() => Object.entries(pointsTable.groups || {}), [pointsTable]);

  const getFormBadge = (result: string) => {
    const r = result.toUpperCase();
    const styles =
      r === "W" ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200" :
      r === "L" ? "bg-red-500 text-white shadow-sm shadow-red-200" :
      "bg-gray-300 text-white";
    return (
      <span className={`inline-flex items-center justify-center w-4 h-4 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded sm:rounded-md md:rounded-lg text-[7px] sm:text-xs md:text-base font-bold ${styles}`}>
        {r}
      </span>
    );
  };

  if (loading) return <Skeleton />;

  const hasData = groupEntries.length > 0 && groupEntries.some(([, t]) => safeArray(t).length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 pb-12">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-blue-700 via-purple-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzRtMCA0djJIMnYtMmgzNG0wIDRoMlYySDJ2MmgzNG0wIDRoMlY2SDJ2MmgzNCIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="container mx-auto px-3 py-6 sm:py-16 relative">
          <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white/15 rounded-2xl backdrop-blur-sm ring-1 ring-white/20">
              <Trophy className="w-6 h-6 sm:w-10 sm:h-10 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight uppercase">Points Table</h1>
              <p className="text-white/80 mt-1.5 sm:mt-2 text-xs sm:text-lg md:text-xl max-w-md mx-auto uppercase">
                {seasonLabel ? `${seasonLabel} standings` : "Current standings by group"}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      <div className="container mx-auto px-3 sm:px-4 -mt-5 sm:-mt-6 relative z-10">
        {/* Controls Bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-white/40 p-1 sm:p-2 mb-5 sm:mb-8 flex items-center justify-between"
        >
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewType("current")}
              className={`px-2.5 sm:px-5 py-1 sm:py-2.5 rounded-md text-[10px] sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                viewType === "current"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Standings
            </button>
            <button
              onClick={() => setViewType("form")}
              className={`px-2.5 sm:px-5 py-1 sm:py-2.5 rounded-md text-[10px] sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                viewType === "form"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Form Guide
            </button>
          </div>
          {allSeasons.length > 1 && (
            <Select
              value={selectedSeasonId}
              onValueChange={(val) => {
                const season = allSeasons.find(
                  (s) => (s?._id || s?.id || s?.seasonNumber) === val
                );
                if (season) handleSeasonChange(season);
              }}
            >
              <SelectTrigger className="w-[100px] sm:w-[180px] h-7 sm:h-10 text-[10px] sm:text-sm font-bold uppercase bg-gray-50/80 backdrop-blur border-gray-200/60 rounded-lg">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent>
                {allSeasons.map((s) => {
                  const sid = s?._id || s?.id || s?.seasonNumber;
                  const label = s?.seasonLabel || s?.name || `Season ${s?.seasonNumber || ""}`;
                  return (
                    <SelectItem key={sid} value={sid} className="text-sm uppercase font-semibold">
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </motion.div>

        {!hasData ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border border-white/40 shadow-sm rounded-2xl overflow-hidden bg-white/60 backdrop-blur-xl">
              <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mb-3 sm:mb-4 ring-4 ring-blue-100/50">
                  <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-gray-300" />
                </div>
                <h3 className="text-base sm:text-xl font-bold text-gray-700 mb-1 uppercase">No Standings Yet</h3>
                <p className="text-xs sm:text-base text-gray-400 text-center max-w-xs uppercase">
                  Standings will appear once matches are played in the current season.
                </p>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            {groupEntries.map(([groupName, groupTeams], gi) => {
              const teams = safeArray(groupTeams);
              if (!teams.length) return null;
              const label = groupName === "Ungrouped" ? "Overall Standings" : `Group ${groupName}`;
              const color = GROUP_COLORS[gi % GROUP_COLORS.length];

              return (
                <motion.div
                  key={groupName}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.08 }}
                >
                  <Card className="border border-white/40 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-xl">
                    {/* Group header */}
                    <div className={`px-3 sm:px-5 py-2.5 sm:py-4 border-b border-white/30 bg-gradient-to-r ${color.light}/50 flex items-center gap-2 sm:gap-2.5`}>
                      <div className={`w-1 sm:w-1.5 h-5 sm:h-7 rounded-full bg-gradient-to-b ${color.accent}`} />
                      <Medal className={`w-4 h-4 sm:w-5 sm:h-5 ${color.text}`} />
                      <span className={`text-base sm:text-xl md:text-2xl font-extrabold ${color.text} uppercase tracking-wider`}>{label}</span>
                    </div>

                    <CardContent className="p-0">
                      <div className="">
                        <table className="w-full text-xs sm:text-lg md:text-xl">
                          <thead>
                            <tr className="border-b border-white/30 bg-white/40">
                              <th className="text-left py-2 sm:py-4 px-1 sm:px-4 text-[8px] sm:text-sm md:text-base font-bold text-gray-400 uppercase tracking-widest w-6 sm:w-12">#</th>
                              <th className="text-left py-2 sm:py-4 px-1 sm:px-2 text-[8px] sm:text-sm md:text-base font-bold text-gray-400 uppercase tracking-widest">Team</th>
                              <th className="text-center py-2 sm:py-4 px-0.5 sm:px-2 text-[8px] sm:text-sm md:text-base font-bold text-gray-400 uppercase tracking-widest w-6 sm:w-12">M</th>
                              <th className="text-center py-2 sm:py-4 px-0.5 sm:px-2 text-[8px] sm:text-sm md:text-base font-bold text-gray-400 uppercase tracking-widest w-6 sm:w-12">W</th>
                              <th className="text-center py-2 sm:py-4 px-0.5 sm:px-2 text-[8px] sm:text-sm md:text-base font-bold text-gray-400 uppercase tracking-widest w-6 sm:w-12">L</th>
                              <th className="text-center py-2 sm:py-4 px-0.5 sm:px-2 text-[8px] sm:text-sm md:text-base font-bold text-gray-400 uppercase tracking-widest w-6 sm:w-12">T</th>
                              <th className="text-center py-2 sm:py-4 px-0.5 sm:px-2 text-[8px] sm:text-sm md:text-base font-bold text-gray-400 uppercase tracking-widest w-12 sm:w-24">NRR</th>
                              <th className="text-center py-2 sm:py-4 px-0.5 sm:px-3 text-[8px] sm:text-sm md:text-base font-bold text-gray-400 uppercase tracking-widest w-8 sm:w-16">Pts</th>
                              {viewType === "form" && (
                                <th className="text-center py-2 sm:py-4 px-0.5 sm:px-2 text-[8px] sm:text-sm md:text-base font-bold text-gray-400 uppercase tracking-widest w-20 sm:w-36">Form</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {teams.map((team, i) => {
                              const isQualified = team.qualified && String(team.qualified).toLowerCase().includes("playoff");
                              const isEliminated = team.qualified && String(team.qualified).toLowerCase().includes("elim");
                              const isFirst = i === 0;

                              return (
                                <motion.tr
                                  key={team.teamId || team.team || i}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.03 }}
                                  className={`group border-b border-white/20 transition-all duration-200 ${
                                    isQualified ? "bg-emerald-50/40 hover:bg-emerald-50/80" :
                                    isEliminated ? "bg-red-50/30 hover:bg-red-50/60" :
                                    isFirst ? "bg-gradient-to-r from-blue-50/50 to-indigo-50/30 hover:from-blue-50/80 hover:to-indigo-50/50" :
                                    "hover:bg-white/60"
                                  }`}
                                >
                                  <td className="py-1.5 sm:py-4 px-1 sm:px-4">
                                    <span className={`text-xs sm:text-lg md:text-xl font-bold ${isFirst ? "text-blue-600" : "text-gray-400"}`}>
                                      {team.position}
                                    </span>
                                  </td>
                                  <td className="py-1.5 sm:py-4 px-1 sm:px-2">
                                    <div className="flex items-center gap-1 sm:gap-3">
                                      <div className="relative flex-shrink-0">
                                        {team.teamLogo ? (
                                          <img
                                            src={getProfileImageUrl(team.teamLogo)}
                                            alt={team.team}
                                            className="w-5 h-5 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded sm:rounded-xl object-cover ring-1 sm:ring-2 ring-white/60 shadow-sm"
                                            onError={(e) => { e.currentTarget.style.display = "none"; (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden"); }}
                                          />
                                        ) : null}
                                        <div className={`w-5 h-5 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded sm:rounded-xl flex items-center justify-center text-[7px] sm:text-sm md:text-lg font-bold text-white shadow-sm ${team.teamLogo ? "hidden" : ""}`}
                                          style={{ backgroundColor: hashColor(team.team) }}>
                                          {getInitials(team.team)}
                                        </div>
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] sm:text-base md:text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors leading-tight uppercase whitespace-nowrap">{team.team}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="text-center py-1.5 sm:py-4 px-0.5 sm:px-2 font-semibold text-gray-600 text-xs sm:text-lg md:text-xl">{team.matches}</td>
                                  <td className="text-center py-1.5 sm:py-4 px-0.5 sm:px-2 font-bold text-emerald-600 text-xs sm:text-lg md:text-xl">{team.won}</td>
                                  <td className="text-center py-1.5 sm:py-4 px-0.5 sm:px-2 font-bold text-red-500 text-xs sm:text-lg md:text-xl">{team.lost}</td>
                                  <td className="text-center py-1.5 sm:py-4 px-0.5 sm:px-2 text-gray-400 text-xs sm:text-lg md:text-xl">{team.tied}</td>
                                  <td className="text-center py-1.5 sm:py-4 px-0.5 sm:px-2">
                                    <span className={`inline-block px-0.5 sm:px-3 py-0 sm:py-1.5 rounded sm:rounded-lg text-[10px] sm:text-base md:text-lg font-bold ${
                                      team.nrr > 0 ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50" :
                                      team.nrr < 0 ? "bg-red-50 text-red-600 ring-1 ring-red-200/50" :
                                      "bg-gray-50 text-gray-400 ring-1 ring-gray-200/50"
                                    }`}>
                                      <span className="sm:hidden">{formatNrrMobile(team.nrr)}</span>
                                      <span className="hidden sm:inline">{formatNrr(team.nrr)}</span>
                                    </span>
                                  </td>
                                  <td className="text-center py-1.5 sm:py-4 px-0.5 sm:px-3">
                                    <span className={`text-sm sm:text-xl md:text-2xl font-extrabold ${isFirst ? "text-blue-600" : "text-gray-800"}`}>
                                      {team.points}
                                    </span>
                                  </td>
                                  {viewType === "form" && (
                                    <td className="text-center py-1.5 sm:py-4 px-0.5 sm:px-2">
                                      <div className="flex items-center justify-center gap-px sm:gap-1.5">
                                        {safeArray(team.form).length > 0 ? (
                                          safeArray(team.form).slice(0, 5).map((r, fi) => (
                                            <span key={fi}>{getFormBadge(r)}</span>
                                          ))
                                        ) : (
                                          <span className="text-[8px] sm:text-sm text-gray-300">—</span>
                                        )}
                                      </div>
                                    </td>
                                  )}
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Qualification legend */}
                  {gi === groupEntries.length - 1 && (
                    <div className="flex items-center gap-3 sm:gap-5 mt-3 sm:mt-4 px-2 justify-center">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded bg-emerald-500/20 border border-emerald-500/40" />
                        <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase">Playoff / Qualified</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded bg-red-500/20 border border-red-500/40" />
                        <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase">Eliminated</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PointsTable;
