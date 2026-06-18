import { Card, CardContent } from '@/components/ui/card';

interface TeamInfo {
  _id: string;
  teamName: string;
  teamLogo?: string | { url?: string };
  runs?: number;
  wickets?: number;
}

interface InningsScore {
  runs: number;
  wickets: number;
  balls: number;
  extras: number;
  runRate: number;
}

interface BattingStat {
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  out: boolean;
}

interface BowlingStat {
  playerName: string;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  economy: number;
}

interface Props {
  match: {
    _id: string;
    result: string;
    battingFirst?: string;
    currentInnings?: number;
    currentOverNumber?: number;
    legalBallsInOver?: number;
    teamA: TeamInfo;
    teamB: TeamInfo;
    score?: { teamA: InningsScore; teamB: InningsScore };
    playerStats?: { batting: BattingStat[]; bowling: BowlingStat[] };
    striker?: string;
    nonStriker?: string;
    currentBowler?: string;
    events?: any[];
  };
}

export default function ScoreHeader({ match }: Props) {
  const isLive = match.result === 'live';
  const firstInnings = match.currentInnings === 1 || !match.currentInnings;
  const battingTeam = firstInnings
    ? (match.battingFirst || 'teamA')
    : (match.battingFirst === 'teamA' ? 'teamB' : 'teamA');
  const bowlingTeam = battingTeam === 'teamA' ? 'teamB' : 'teamA';
  const isTeamA = battingTeam === 'teamA';
  const battingTeamName = isTeamA ? match.teamA?.teamName : match.teamB?.teamName;
  const bowlingTeamName = isTeamA ? match.teamB?.teamName : match.teamA?.teamName;
  const battingLogo = isTeamA
    ? (typeof match.teamA?.teamLogo === 'string' ? match.teamA?.teamLogo : match.teamA?.teamLogo?.url)
    : (typeof match.teamB?.teamLogo === 'string' ? match.teamB?.teamLogo : match.teamB?.teamLogo?.url);
  const bowlingLogo = isTeamA
    ? (typeof match.teamB?.teamLogo === 'string' ? match.teamB?.teamLogo : match.teamB?.teamLogo?.url)
    : (typeof match.teamA?.teamLogo === 'string' ? match.teamA?.teamLogo : match.teamA?.teamLogo?.url);

  const score = match.score?.[battingTeam] || { runs: 0, wickets: 0, balls: 0, extras: 0, runRate: 0 };
  const otherScore = match.score?.[bowlingTeam] || { runs: 0, wickets: 0, balls: 0, extras: 0, runRate: 0 };
  const totalBalls = 20 * 6;
  const target = otherScore.runs + 1;
  const ballsLeft = Math.max(totalBalls - score.balls, 0);
  const runsNeeded = Math.max(target - score.runs, 0);
  const reqRunRate = !firstInnings
    ? ((runsNeeded) / (Math.max(ballsLeft, 1) / 6)).toFixed(2)
    : '—';
  const projectedScore = score.balls > 0
    ? Math.floor((score.runs / score.balls) * totalBalls)
    : null;

  const battingSide = match.playerStats?.batting?.filter(b => b.team === battingTeam) || [];
  const bowlingSide = match.playerStats?.bowling?.filter(b => b.team === bowlingTeam) || [];
  const strikerStats = battingSide.find(b => b.playerName === match.striker);
  const nonStrikerStats = battingSide.find(b => b.playerName === match.nonStriker);
  const currentBowlerStats = bowlingSide.find(b => b.playerName === match.currentBowler);

  const over = match.currentOverNumber ?? 0;
  const ball = match.legalBallsInOver ?? 0;

  return (
    <Card className="rounded-2xl shadow-xl overflow-hidden border border-slate-200 bg-white">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500" />
      <CardContent className="p-3 sm:p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {/* Score */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {battingLogo && (
                <img src={battingLogo} alt="" className="w-5 h-5 rounded-full object-cover" />
              )}
              <span className="text-base font-bold uppercase tracking-wider truncate text-slate-700">
                {battingTeamName}
              </span>
              {isLive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />}
            </div>
            <div className="flex items-baseline gap-2 sm:gap-3">
              <span className="text-4xl sm:text-6xl font-black tracking-tight font-mono text-slate-900">
                {score.runs}
              </span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-400">/{score.wickets}</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="text-sm sm:text-base font-semibold text-slate-600">
                Overs: <strong className="text-base sm:text-lg text-slate-900">{Math.floor(score.balls / 6)}.{score.balls % 6}</strong>
              </div>
              <div className="text-sm sm:text-base font-semibold text-slate-600">
                Extras: <strong className="text-base sm:text-lg text-slate-900">{score.extras}</strong>
              </div>
            </div>
          </div>

          {/* Batsmen Card */}
          <div className="rounded-xl border overflow-hidden bg-white border-slate-200">
            <div className="text-center text-[10px] uppercase tracking-wider font-semibold px-3 pt-2 pb-1 text-slate-500">Batsmen</div>
            <div className="flex flex-col gap-1.5 px-4 py-2">
              <div className="flex items-center justify-center gap-3 px-3 py-1.5 rounded-lg font-medium bg-emerald-50">
                <span className="text-lg">🏏</span>
                <span className="text-base font-bold truncate text-slate-800">{match.striker || '—'}</span>
                <span className="text-base font-bold text-slate-900">
                  {strikerStats?.runs ?? 0}<span className="text-sm font-normal ml-0.5 text-slate-400">({strikerStats?.balls ?? 0})</span>
                </span>
              </div>
              <div className="flex items-center justify-center gap-3 px-3 py-1.5 rounded-lg font-medium bg-slate-100">
                <span className="w-6 text-center text-base font-bold text-slate-400">②</span>
                <span className="text-base font-bold truncate text-slate-800">{match.nonStriker || '—'}</span>
                <span className="text-base font-bold text-slate-900">
                  {nonStrikerStats?.runs ?? 0}<span className="text-sm font-normal ml-0.5 text-slate-400">({nonStrikerStats?.balls ?? 0})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Projected / Target */}
          {firstInnings ? (
            <div className="rounded-xl border overflow-hidden bg-white border-slate-200">
              <div className="text-center text-[10px] uppercase tracking-wider font-semibold px-2 sm:px-3 pt-2 pb-1 text-slate-500">Projected</div>
              <div className="flex flex-col items-center px-2 sm:px-4 py-1 sm:py-2 gap-0 sm:gap-1">
                <span className="text-2xl sm:text-4xl font-black tracking-tight font-mono text-slate-900">
                  {projectedScore ?? '—'}
                </span>
                <div className="text-[10px] sm:text-xs font-semibold text-cyan-600">
                  CRR: <span className="text-sm sm:text-lg font-bold">{score.runRate?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden bg-white border-slate-200">
              <div className="text-center text-[10px] uppercase tracking-wider font-semibold px-2 sm:px-3 pt-2 pb-1 text-slate-500">Target</div>
              <div className="flex flex-col items-center px-2 sm:px-4 py-1 sm:py-2 gap-0 sm:gap-1">
                <span className="text-2xl sm:text-4xl font-black tracking-tight font-mono text-slate-900">
                  {target}
                </span>
                <div className="text-[10px] sm:text-xs font-semibold text-orange-600">
                  RRR: <span className="text-sm sm:text-lg font-bold">{reqRunRate}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bowler Card */}
          <div className="rounded-xl border overflow-hidden bg-white border-slate-200">
            <div className="flex items-center justify-center gap-2 sm:gap-3 w-full px-2 sm:px-3 pt-2 pb-1">
              {[
                { label: 'Runs', value: currentBowlerStats?.runs ?? 0, cls: 'text-slate-900' },
                { label: 'Wkts', value: currentBowlerStats?.wickets ?? 0, cls: 'text-blue-600' },
                { label: 'Overs', value: currentBowlerStats ? `${Math.floor(currentBowlerStats.balls / 6)}.${currentBowlerStats.balls % 6}` : '0.0', cls: 'text-xs sm:text-sm text-slate-900' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center">
                  <span className="text-[8px] sm:text-[10px] uppercase tracking-wider font-semibold text-slate-400">{s.label}</span>
                  <span className={`text-base sm:text-xl font-black leading-none ${s.cls}`}>{s.value}</span>
                </div>
              ))}
            </div>
            <div className="w-full px-2 py-1 border-t text-center bg-slate-50 border-slate-200">
              <span className="font-bold text-lg text-slate-800"> {match.currentBowler || '—'}</span>
            </div>
          </div>
        </div>

        {/* Need X runs in X balls */}
        {!firstInnings && (
          <div className="mt-3 text-center text-sm font-semibold text-orange-700 bg-orange-50 rounded-lg py-2 px-4 border border-orange-200">
            Need <span className="text-lg font-bold">{runsNeeded}</span> runs in <span className="text-lg font-bold">{ballsLeft}</span> balls
          </div>
        )}
      </CardContent>
    </Card>
  );
}
