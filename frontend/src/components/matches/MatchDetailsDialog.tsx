import React from "react";
import { Calendar, Clock, MapPin, Trophy, Target, User, ShieldCheck } from "lucide-react";
import { getProfileImageUrl } from "@/utils/getProfileImageUrl";

interface TeamInfo {
  _id: string;
  teamName: string;
  teamLogo?: string;
  teamCode?: string;
  runs?: number;
  wickets?: number;
  overs?: string;
}

interface Innings {
  runs: number;
  wickets: number;
  balls: number;
  extras: number;
  fours: number;
  sixes: number;
  runRate: number;
}

interface PlayerStat {
  playerId?: string;
  playerName: string;
  runs?: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  strikeRate?: number;
  out?: boolean;
  dismissalType?: string;
  bowledBy?: string;
  overs?: number;
  wickets?: number;
  economy?: number;
}

interface Match {
  _id: string;
  matchNumber?: number;
  matchLabel?: string;
  stage: string;
  result: string;
  matchTime: string;
  venue?: string;
  teamA: TeamInfo;
  teamB: TeamInfo;
  teamAResult?: { runs: number; wickets: number; overs: string };
  teamBResult?: { runs: number; wickets: number; overs: string };
  score?: { teamA?: Innings; teamB?: Innings };
  tossWinner?: string;
  tossDecision?: string;
  winner?: string;
  margin?: string;
  battingFirst?: string;
  playerStats?: { batting: PlayerStat[]; bowling: PlayerStat[] };
}

interface Props {
  match: Match;
  matchIndex: number;
}

const teamLogo = (logo: any) => getProfileImageUrl(logo);

const statusBadge = (result: string) => {
  switch (result) {
    case "live":
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 text-red-600 text-xs font-semibold"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE</span>;
    case "completed":
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/15 text-green-600 text-xs font-semibold"><ShieldCheck className="w-3.5 h-3.5" /> Completed</span>;
    default:
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-600 text-xs font-semibold"><Calendar className="w-3.5 h-3.5" /> Upcoming</span>;
  }
};

const MatchDetailsDialog: React.FC<Props> = ({ match, matchIndex }) => {
  const renderTeamCard = (team: TeamInfo, teamResult: any, side: "left" | "right") => (
    <div className={`flex ${side === "right" ? "flex-row-reverse" : "flex-row"} items-center gap-3 sm:gap-5`}>
      <div className="flex-shrink-0">
        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
          <img
            src={teamLogo(team.teamLogo)}
            alt={team.teamName}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
          />
        </div>
      </div>
      <div className={`flex flex-col ${side === "right" ? "items-end" : "items-start"} min-w-0`}>
        <span className="font-bold text-sm sm:text-base text-gray-900 truncate max-w-[120px] sm:max-w-[180px]">
          {team.teamName}
        </span>
        <span className="text-xs text-gray-500">{team.teamCode || "UPPL"}</span>
      </div>
    </div>
  );

  const renderScoreBlock = (teamResult: any, innings?: Innings) => {
    if (!teamResult && !innings) return null;
    const r = teamResult?.runs ?? innings?.runs ?? 0;
    const w = teamResult?.wickets ?? innings?.wickets ?? 0;
    const o = teamResult?.overs ?? (innings?.balls ? Math.floor(innings.balls / 6) + "." + (innings.balls % 6) : "-");
    return (
      <div className="text-center">
        <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {r}/{w}
        </div>
        <div className="text-xs sm:text-sm text-gray-500 font-medium">
          Overs: {o}
        </div>
        {innings && (
          <div className="text-xs text-gray-400 mt-1 space-x-2">
            <span>{innings.fours}×4</span>
            <span>{innings.sixes}×6</span>
            <span>RR: {innings.runRate?.toFixed(1)}</span>
          </div>
        )}
      </div>
    );
  };

  const stageLabel = (() => {
    const s = match.stage?.toLowerCase() || "";
    if (s.includes("final")) return "Final";
    if (s.includes("semi")) return "Semi Final";
    if (s === "league") return "League Match";
    return match.stage;
  })();

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {stageLabel}
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          {match.matchLabel || `Match ${match.matchNumber || matchIndex + 1}`}
        </h2>
        <div className="mt-2">{statusBadge(match.result)}</div>
      </div>

      {/* Teams Scoreboard */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-5 sm:p-7 mb-5">
        <div className="grid grid-cols-3 items-center gap-3">
          {/* Team A */}
          <div className="col-span-1">
            {renderTeamCard(match.teamA, match.teamAResult, "left")}
          </div>

          {/* Score */}
          <div className="col-span-1">
            {renderScoreBlock(match.teamAResult, match.score?.teamA)}
            <div className="my-1 text-center">
              <div className="text-sm font-bold text-gray-300">VS</div>
            </div>
            {renderScoreBlock(match.teamBResult, match.score?.teamB)}
          </div>

          {/* Team B */}
          <div className="col-span-1">
            {renderTeamCard(match.teamB, match.teamBResult, "right")}
          </div>
        </div>

        {/* Winner */}
        {match.winner && (
          <div className="mt-5 pt-4 border-t border-gray-200 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
              <Trophy className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-semibold text-gray-800">
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

      {/* Match Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
          <Calendar className="w-4 h-4 mx-auto mb-1 text-gray-400" />
          <div className="text-xs text-gray-500">Date</div>
          <div className="text-sm font-semibold text-gray-800">
            {new Date(match.matchTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
          <Clock className="w-4 h-4 mx-auto mb-1 text-gray-400" />
          <div className="text-xs text-gray-500">Time</div>
          <div className="text-sm font-semibold text-gray-800">
            {new Date(match.matchTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
          <MapPin className="w-4 h-4 mx-auto mb-1 text-gray-400" />
          <div className="text-xs text-gray-500">Venue</div>
          <div className="text-sm font-semibold text-gray-800 truncate">
            {match.venue || "TBD"}
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
          <Target className="w-4 h-4 mx-auto mb-1 text-gray-400" />
          <div className="text-xs text-gray-500">Toss</div>
          <div className="text-sm font-semibold text-gray-800">
            {match.tossWinner
              ? `${match.tossWinner === "teamA" ? match.teamA?.teamName : match.teamB?.teamName} elected to ${match.tossDecision}`
              : "Yet to be held"}
          </div>
        </div>
      </div>

      {/* Innings Details */}
      {match.score?.teamA && match.score?.teamB && (
        <div className="mb-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-blue-500" />
            Innings Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: match.teamA?.teamName || "Team A", innings: match.score.teamA },
              { label: match.teamB?.teamName || "Team B", innings: match.score.teamB },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{item.label}</div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div><span className="block text-lg font-bold text-gray-900">{item.innings.runs}/{item.innings.wickets}</span><span className="text-xs text-gray-400">Runs/Wkts</span></div>
                  <div><span className="block text-lg font-bold text-gray-900">{item.innings.balls}</span><span className="text-xs text-gray-400">Balls</span></div>
                  <div><span className="block text-lg font-bold text-gray-900">{item.innings.runRate?.toFixed(1)}</span><span className="text-xs text-gray-400">Run Rate</span></div>
                  <div><span className="block font-semibold text-gray-700">{item.innings.fours}</span><span className="text-xs text-gray-400">Fours</span></div>
                  <div><span className="block font-semibold text-gray-700">{item.innings.sixes}</span><span className="text-xs text-gray-400">Sixes</span></div>
                  <div><span className="block font-semibold text-gray-700">{item.innings.extras}</span><span className="text-xs text-gray-400">Extras</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batting Stats */}
      {match.playerStats?.batting && match.playerStats.batting.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-green-500" />
            Batting
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Batsman</th>
                  <th className="px-4 py-3 text-center">R</th>
                  <th className="px-4 py-3 text-center">B</th>
                  <th className="px-4 py-3 text-center">4s</th>
                  <th className="px-4 py-3 text-center">6s</th>
                  <th className="px-4 py-3 text-center">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {match.playerStats.batting.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-gray-900">
                      {p.playerName}
                      {p.out && <span className="ml-2 text-xs text-red-500">({p.dismissalType || "out"})</span>}
                      {!p.out && p.runs !== undefined && <span className="ml-2 text-xs text-green-600 font-semibold">*</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center font-semibold">{p.runs ?? 0}</td>
                    <td className="px-4 py-2.5 text-center text-gray-600">{p.balls ?? 0}</td>
                    <td className="px-4 py-2.5 text-center text-gray-600">{p.fours ?? 0}</td>
                    <td className="px-4 py-2.5 text-center text-gray-600">{p.sixes ?? 0}</td>
                    <td className="px-4 py-2.5 text-center text-gray-600">{p.strikeRate?.toFixed(1) ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bowling Stats */}
      {match.playerStats?.bowling && match.playerStats.bowling.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-purple-500" />
            Bowling
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Bowler</th>
                  <th className="px-4 py-3 text-center">O</th>
                  <th className="px-4 py-3 text-center">M</th>
                  <th className="px-4 py-3 text-center">R</th>
                  <th className="px-4 py-3 text-center">W</th>
                  <th className="px-4 py-3 text-center">Econ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {match.playerStats.bowling.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{p.playerName}</td>
                    <td className="px-4 py-2.5 text-center font-semibold">{p.overs ?? 0}</td>
                    <td className="px-4 py-2.5 text-center text-gray-600">0</td>
                    <td className="px-4 py-2.5 text-center text-gray-600">{p.runs ?? 0}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">{p.wickets ?? 0}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-gray-600">{p.economy?.toFixed(1) ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchDetailsDialog;
