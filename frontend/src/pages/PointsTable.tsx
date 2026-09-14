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
  if (nrr === 0) return "0.000";
  const sign = nrr > 0 ? "+" : "";
  return `${sign}${nrr.toFixed(3)}`;
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
    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white py-16 mb-8" />
    <div className="container mx-auto px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
        <div className="h-14 bg-gray-100" />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
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
      <span className={`inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-lg text-xs md:text-sm font-bold ${styles}`}>
        {r}
      </span>
    );
  };

  if (loading) return <Skeleton />;

  const hasData = groupEntries.length > 0 && groupEntries.some(([, t]) => safeArray(t).length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 pb-12">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzRtMCA0djJIMnYtMmgzNG0wIDRoMlYySDJ2MmgzNG0wIDRoMlY2SDJ2MmgzNCIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="container mx-auto px-4 py-12 sm:py-16 relative">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-sm ring-1 ring-white/20">
              <Trophy className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Points Table</h1>
              <p className="text-blue-100/80 mt-2 text-sm sm:text-base max-w-md mx-auto">
                {seasonLabel ? `${seasonLabel} standings` : "Current standings by group"}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-6 relative z-10">
        {/* Controls Bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-2 mb-8 flex items-center justify-between"
        >
          <div className="flex bg-gray-100 rounded-xl p-0.5">
            <button
              onClick={() => setViewType("current")}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                viewType === "current"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Standings
            </button>
            <button
              onClick={() => setViewType("form")}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
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
              <SelectTrigger className="w-[180px] h-9 text-xs font-semibold bg-gray-50 border-gray-200 rounded-xl">
                <SelectValue placeholder="Select season" />
              </SelectTrigger>
              <SelectContent>
                {allSeasons.map((s) => {
                  const sid = s?._id || s?.id || s?.seasonNumber;
                  const label = s?.seasonLabel || s?.name || `Season ${s?.seasonNumber || ""}`;
                  return (
                    <SelectItem key={sid} value={sid} className="text-sm">
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
            <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mb-4 ring-4 ring-blue-100/50">
                  <Trophy className="w-7 h-7 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-1">No Standings Yet</h3>
                <p className="text-sm text-gray-400 text-center max-w-xs">
                  Standings will appear once matches are played in the current season.
                </p>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
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
                  <Card className="border border-gray-100/80 shadow-lg shadow-gray-100/50 rounded-2xl overflow-hidden">
                    {/* Group header */}
                    <div className={`px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r ${color.light} flex items-center gap-2.5`}>
                      <div className={`w-1.5 h-6 rounded-full bg-gradient-to-b ${color.accent}`} />
                      <Medal className={`w-4 h-4 ${color.text}`} />
                      <span className={`text-base md:text-lg font-extrabold ${color.text} uppercase tracking-wider`}>{label}</span>
                      <Badge variant="secondary" className={`ml-auto ${color.light} ${color.text} border-0 text-[10px] font-bold`}>
                        {teams.length} {teams.length === 1 ? "team" : "teams"}
                      </Badge>
                    </div>

                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm md:text-base">
                          <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                              <th className="text-left py-3.5 px-4 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest w-12">#</th>
                              <th className="text-left py-3.5 px-2 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Team</th>
                              <th className="text-center py-3.5 px-2 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest w-12">M</th>
                              <th className="text-center py-3.5 px-2 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest w-12">W</th>
                              <th className="text-center py-3.5 px-2 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest w-12">L</th>
                              <th className="text-center py-3.5 px-2 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest w-12">T</th>
                              <th className="text-center py-3.5 px-2 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest w-24">NRR</th>
                              <th className="text-center py-3.5 px-3 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest w-16">Pts</th>
                              {viewType === "form" && (
                                <th className="text-center py-3.5 px-2 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest w-36">Form</th>
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
                                  className={`group border-b border-gray-50/80 transition-all duration-200 ${
                                    isQualified ? "bg-emerald-50/40 hover:bg-emerald-50/80" :
                                    isEliminated ? "bg-red-50/30 hover:bg-red-50/60" :
                                    isFirst ? "bg-gradient-to-r from-blue-50/50 to-indigo-50/30 hover:from-blue-50/80 hover:to-indigo-50/50" :
                                    "hover:bg-gray-50/80"
                                  }`}
                                >
                                  <td className="py-4 px-4">
                                    <span className={`text-sm md:text-base font-bold ${isFirst ? "text-blue-600" : "text-gray-400"}`}>
                                      {team.position}
                                    </span>
                                  </td>
                                  <td className="py-4 px-2">
                                    <div className="flex items-center gap-3">
                                      <div className="relative flex-shrink-0">
                                        {team.teamLogo ? (
                                          <img
                                            src={getProfileImageUrl(team.teamLogo)}
                                            alt={team.team}
                                            className="w-10 h-10 md:w-11 md:h-11 rounded-xl object-cover ring-2 ring-gray-100 shadow-sm"
                                            onError={(e) => { e.currentTarget.style.display = "none"; (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden"); }}
                                          />
                                        ) : null}
                                        <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-sm md:text-base font-bold text-white shadow-sm ${team.teamLogo ? "hidden" : ""}`}
                                          style={{ backgroundColor: hashColor(team.team) }}>
                                          {getInitials(team.team)}
                                        </div>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm md:text-base font-bold text-gray-800 group-hover:text-blue-600 transition-colors leading-tight">{team.team}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="text-center py-4 px-2 font-semibold text-gray-600 text-sm md:text-base">{team.matches}</td>
                                  <td className="text-center py-4 px-2 font-bold text-emerald-600 text-sm md:text-base">{team.won}</td>
                                  <td className="text-center py-4 px-2 font-bold text-red-500 text-sm md:text-base">{team.lost}</td>
                                  <td className="text-center py-4 px-2 text-gray-400 text-sm md:text-base">{team.tied}</td>
                                  <td className="text-center py-4 px-2">
                                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs md:text-sm font-bold ${
                                      team.nrr > 0 ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50" :
                                      team.nrr < 0 ? "bg-red-50 text-red-600 ring-1 ring-red-200/50" :
                                      "bg-gray-50 text-gray-400 ring-1 ring-gray-200/50"
                                    }`}>
                                      {formatNrr(team.nrr)}
                                    </span>
                                  </td>
                                  <td className="text-center py-4 px-3">
                                    <span className={`text-base md:text-lg font-extrabold ${isFirst ? "text-blue-600" : "text-gray-800"}`}>
                                      {team.points}
                                    </span>
                                  </td>
                                  {viewType === "form" && (
                                    <td className="text-center py-3.5 px-2">
                                      <div className="flex items-center justify-center gap-1">
                                        {safeArray(team.form).length > 0 ? (
                                          safeArray(team.form).slice(0, 5).map((r, fi) => (
                                            <span key={fi}>{getFormBadge(r)}</span>
                                          ))
                                        ) : (
                                          <span className="text-sm text-gray-300">—</span>
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
                    <div className="flex items-center gap-5 mt-3 px-2 justify-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
                        <span className="text-[11px] font-medium text-gray-400">Playoff / Qualified</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-red-500/20 border border-red-500/40" />
                        <span className="text-[11px] font-medium text-gray-400">Eliminated</span>
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
