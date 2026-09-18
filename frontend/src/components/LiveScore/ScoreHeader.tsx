import { Card, CardContent } from '@/components/ui/card';

function formatBallNotation(ev: any): string {
  if (ev.wicket) return 'W';
  const runs = ev.runs || 0;
  const extra = ev.extras;
  const hasExtra = extra && extra.type;
  const extraRuns = extra?.runs || 0;
  const total = runs + extraRuns;
  if (!hasExtra) {
    if (ev.isSix) return '6';
    if (ev.isFour) return '4';
    return String(runs);
  }
  switch (extra.type) {
    case 'wide': return total === 1 ? 'Wd' : `${total}Wd`;
    case 'no_ball': return runs === 0 ? 'Nb' : `${runs}+1Nb`;
    case 'bye': return `${total}B`;
    case 'leg_bye': return `${total}Lb`;
    case 'penalty': return `${total}Pen`;
    default: return String(total);
  }
}

function getBallColor(ev: any): string {
  if (ev.wicket) return 'border-red-500 text-red-600 bg-red-50';
  if (ev.isSix) return 'border-purple-500 text-purple-600 bg-purple-50';
  if (ev.isFour || ev.runs === 4) return 'border-blue-600 text-blue-700 bg-blue-50';
  if (ev.extras?.type === 'wide') return 'border-amber-500 text-amber-600 bg-amber-50';
  if (ev.extras?.type === 'no_ball') return 'border-orange-500 text-orange-600 bg-orange-50';
  if (ev.extras?.type === 'bye' || ev.extras?.type === 'leg_bye') return 'border-rose-400 text-rose-500 bg-rose-50';
  if (ev.runs >= 3) return 'border-indigo-500 text-indigo-600 bg-indigo-50';
  if (ev.runs === 2) return 'border-blue-500 text-blue-600 bg-blue-50';
  if (ev.runs === 1) return 'border-sky-500 text-sky-600 bg-sky-50';
  return 'border-slate-300 text-slate-600 bg-slate-50';
}

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
    currentOver?: any[];
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

  return (
    <Card className="rounded-2xl shadow-lg overflow-hidden border border-slate-200 bg-white">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      <CardContent className="p-3 sm:p-5">
        {/* Mobile: 3 cols for better width control, Desktop: 4 cols */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {/* Score — full width on mobile */}
          <div className="col-span-3 md:col-span-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider truncate text-slate-700">
                {battingTeamName}
              </span>
              {isLive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/60" />}
            </div>
            <div className="flex items-center justify-between gap-2 pr-2">
              {/* Logo + Runs / Wickets */}
              <div className="flex items-baseline gap-1.5 sm:gap-2 flex-shrink-0">
                {battingLogo && (
                  <img src={battingLogo} alt="" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover flex-shrink-0" />
                )}
                <span className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight font-mono text-slate-900">
                  {score.runs}
                </span>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-red-500">/{score.wickets}</span>
              </div>
              <div className="w-px h-8 bg-slate-200 flex-shrink-0" />
              {/* Overs & Extras — stacked vertically, right-aligned */}
              <div className="flex flex-col gap-0.5 text-right flex-shrink-0">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                  Overs: <strong className="text-base sm:text-lg text-slate-900">{Math.floor(score.balls / 6)}.{score.balls % 6}</strong>
                </span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                  Extras: <strong className="text-base sm:text-lg text-slate-900">{score.extras}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Batsmen Card — full width on mobile */}
          <div className="col-span-3 md:col-span-1 rounded-xl border overflow-hidden bg-white border-slate-200">
            <div className="text-center text-[10px] sm:text-xs uppercase tracking-wider font-bold px-3 pt-2 pb-1 text-slate-500">Batsmen</div>
            <div className="flex flex-col gap-1.5 px-3 sm:px-4 py-2">
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg font-medium bg-emerald-50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">🏏</span>
                  <span className="text-sm sm:text-base font-bold truncate text-slate-800 uppercase">{match.striker || '—'}</span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-slate-900 flex-shrink-0">
                  {strikerStats?.runs ?? 0}<span className="text-sm font-normal ml-0.5 text-slate-400">({strikerStats?.balls ?? 0})</span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg font-medium bg-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 text-center text-base font-bold text-slate-400">②</span>
                  <span className="text-sm sm:text-base font-bold truncate text-slate-800 uppercase">{match.nonStriker || '—'}</span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-slate-900 flex-shrink-0">
                  {nonStrikerStats?.runs ?? 0}<span className="text-sm font-normal ml-0.5 text-slate-400">({nonStrikerStats?.balls ?? 0})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Projected / Target — smaller on mobile */}
          {firstInnings ? (
            <div className="col-span-1 rounded-xl border overflow-hidden bg-white border-slate-200">
              <div className="text-center text-[10px] sm:text-xs uppercase tracking-wider font-bold px-2 sm:px-3 pt-2 pb-1 text-slate-500">Projected</div>
              <div className="flex flex-col items-center px-2 sm:px-4 py-2 sm:py-3 gap-0 sm:gap-1">
                <span className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight font-mono text-slate-900">
                  {projectedScore ?? '—'}
                </span>
                <div className="text-[10px] sm:text-xs font-semibold text-cyan-600">
                  CRR: <span className="text-base sm:text-xl font-bold">{score.runRate?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="col-span-1 rounded-xl border overflow-hidden bg-white border-slate-200">
              <div className="text-center text-[10px] sm:text-xs uppercase tracking-wider font-bold px-2 sm:px-3 pt-2 pb-1 text-slate-500">Target</div>
              <div className="flex flex-col items-center px-2 sm:px-4 py-2 sm:py-3 gap-0 sm:gap-1">
                <span className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight font-mono text-slate-900">
                  {target}
                </span>
                <div className="text-[10px] sm:text-xs font-semibold text-orange-600">
                  RRR: <span className="text-base sm:text-xl font-bold">{reqRunRate}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bowler Card — wider on mobile */}
          <div className="col-span-2 md:col-span-1 rounded-xl border overflow-hidden bg-white border-slate-200">
            <div className="text-center text-[10px] sm:text-xs uppercase tracking-wider font-bold px-2 sm:px-3 pt-2 pb-1 text-slate-500">Bowler</div>
            <div className="flex items-center justify-around w-full px-2 sm:px-3 py-2">
              {[
                { label: 'Runs', value: currentBowlerStats?.runs ?? 0, cls: 'text-slate-900' },
                { label: 'Wkts', value: currentBowlerStats?.wickets ?? 0, cls: 'text-blue-600' },
                { label: 'Overs', value: currentBowlerStats ? `${Math.floor(currentBowlerStats.balls / 6)}.${currentBowlerStats.balls % 6}` : '0.0', cls: 'text-sm sm:text-base text-slate-900' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center">
                  <span className="text-[10px] sm:text-[10px] uppercase tracking-wider font-bold text-slate-400">{s.label}</span>
                  <span className={`text-xl sm:text-2xl font-black leading-none ${s.cls}`}>{s.value}</span>
                </div>
              ))}
            </div>
            <div className="w-full px-2 py-1.5 border-t text-center bg-slate-50 border-slate-200">
              <span className="font-bold text-sm sm:text-base text-slate-800 uppercase"> {match.currentBowler || '—'}</span>
            </div>
            {/* Current over ball-by-ball */}
            {match.result === 'live' && (match.currentOver?.length ?? 0) > 0 && (
              <div className="flex items-center gap-1 px-2 pb-2 pt-1 justify-center flex-wrap">
                {match.currentOver!.map((ev: any, i: number) => {
                  const count = match.currentOver!.length;
                  const size = count > 4 ? 'w-5 h-5 text-[10px] sm:w-6 sm:h-6 sm:text-[10px]' : count > 2 ? 'w-6 h-6 text-[10px] sm:w-7 sm:h-7 sm:text-[10px]' : 'w-7 h-7 text-[10px] sm:w-8 sm:h-8 sm:text-[11px]';
                  return (
                    <span key={i}
                      className={`${size} rounded-md flex items-center justify-center font-bold border-2 shadow-sm ${getBallColor(ev)}`}
                    >{formatBallNotation(ev)}</span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Need X runs in X balls */}
        {!firstInnings && (
          <div className="mt-3 text-center text-xs sm:text-sm font-bold uppercase tracking-wider text-orange-700 bg-orange-50 rounded-xl py-2.5 px-4 border border-orange-200">
            Need <span className="text-lg sm:text-xl font-black text-slate-900">{runsNeeded}</span> runs in <span className="text-lg sm:text-xl font-black text-slate-900">{ballsLeft}</span> balls
          </div>
        )}
      </CardContent>
    </Card>
  );
}
