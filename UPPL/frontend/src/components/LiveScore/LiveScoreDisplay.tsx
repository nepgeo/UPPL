import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { io as socketIO, Socket } from 'socket.io-client';
import { API_BASE, BASE_URL } from '@/config';
import { Loader2 } from 'lucide-react';
import GraphsView from './GraphsView';

interface BallEvent {
  over: number; ball: number; runs: number;
  extras?: { type: string | null; runs: number };
  wicket: boolean; wicketType?: string;
  batsman: string; bowler: string; battingTeam: 'teamA' | 'teamB';
  description?: string; isFour?: boolean; isSix?: boolean;
}

interface InningsScore {
  runs: number; wickets: number; balls: number; overs: number;
  extras: number; fours: number; sixes: number; runRate: number;
}

interface BattingStat {
  playerName: string; runs: number; balls: number; fours: number;
  sixes: number; strikeRate: number; out: boolean;
  dismissalType: string; bowledBy: string; team: string;
}

interface BowlingStat {
  playerName: string; overs: number; balls: number; runs: number;
  wickets: number; economy: number; team: string;
}

interface TeamInfo { _id: string; teamName: string; teamLogo?: string; teamCode?: string; }

interface FOWEntry { wicketNumber: number; playerName: string; runs: number; over: number; ball: number; dismissedBy: string; dismissedType: string; }

interface ComputedState {
  score: { teamA: InningsScore; teamB: InningsScore };
  playerStats: { batting: BattingStat[]; bowling: BowlingStat[] };
  fallOfWickets: { teamA: FOWEntry[]; teamB: FOWEntry[] };
  partnerships: { teamA: any; teamB: any };
  last6Balls: any[];
  currentOver: BallEvent[];
  currentOverNumber: number;
  target: number;
  requiredRunRate: number;
  commentary: BallEvent[];
}

interface MatchData {
  _id: string; result: string;
  score: { teamA: InningsScore; teamB: InningsScore };
  events: BallEvent[]; currentOver: BallEvent[]; currentOverNumber: number;
  battingFirst: string; currentInnings?: number;
  teamA: TeamInfo; teamB: TeamInfo;
  playerStats: { batting: BattingStat[]; bowling: BowlingStat[] };
  teamAResult?: { runs: number; wickets: number; overs: string };
  teamBResult?: { runs: number; wickets: number; overs: string };
}

interface Props { matchId: string; initialData?: MatchData; }

const socketBase = API_BASE.replace('/api', '');

export default function LiveScoreDisplay({ matchId, initialData }: Props) {
  const [match, setMatch] = useState<MatchData | undefined>(initialData);
  const [computed, setComputed] = useState<ComputedState | null>(null);
  const [loading, setLoading] = useState(!initialData);
  const [tab, setTab] = useState<'scorecard' | 'commentary' | 'overview' | 'graphs'>('overview');

  useEffect(() => {
    if (!matchId) return;
    if (!initialData) fetchMatch();

    const socket = socketIO(socketBase, { transports: ['websocket', 'polling'] });
    socket.emit('join-match', { matchId });

    socket.on('ball-event', (data: { event: BallEvent; match: MatchData }) => {
      if (data.match) { setMatch(data.match); fetchComputed(); }
    });
    socket.on('score-updated', (data: { match: MatchData }) => {
      if (data.match) setMatch(data.match);
    });

    return () => {
      socket.emit('leave-match', { matchId });
      socket.disconnect();
    };
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const res = await fetch(`${API_BASE}/matches/${matchId}/live-score`);
      const data = await res.json();
      if (data.success) {
        setMatch(data.match);
        if (data.computed) setComputed(data.computed);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchComputed = async () => {
    try {
      const res = await fetch(`${API_BASE}/matches/${matchId}/live-score`);
      const data = await res.json();
      if (data.computed) setComputed(data.computed);
    } catch (e) { /* ignore */ }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  if (!match) return null;

  const battingFirst = match.battingFirst || 'teamA';
  const isLive = match.result === 'live';
  const cs = computed;

  const batters = (team: string) => cs?.playerStats?.batting?.filter(b => b.team === team) || match.playerStats?.batting?.filter(b => b.team === team) || [];
  const bowlers = (team: string) => cs?.playerStats?.bowling?.filter(b => b.team === team) || match.playerStats?.bowling?.filter(b => b.team === team) || [];

  const firstTeam = battingFirst;
  const secondTeam = battingFirst === 'teamA' ? 'teamB' : 'teamA';
  const currentBattingTeam = !match.currentInnings || match.currentInnings === 1 ? firstTeam : secondTeam;

  const notOutBatsmen = (batters(currentBattingTeam) || []).filter(b => !b.out);

  const computePartnership = () => {
    if (notOutBatsmen.length < 2) return null;
    const teamEvents = (match.events || []).filter(e => e.battingTeam === currentBattingTeam);
    let partnershipRuns = 0;
    let partnershipBalls = 0;
    for (let i = teamEvents.length - 1; i >= 0; i--) {
      const e = teamEvents[i];
      partnershipRuns += e.runs + (e.extras?.runs || 0);
      partnershipBalls += 1;
      if (e.wicket) {
        partnershipRuns = 0;
        partnershipBalls = 0;
      }
    }
    const p1 = notOutBatsmen[0];
    const p2 = notOutBatsmen[1];
    return {
      runs: partnershipRuns,
      balls: partnershipBalls,
      runRate: partnershipBalls > 0 ? ((partnershipRuns / partnershipBalls) * 6).toFixed(2) : '0.00',
      p1, p2,
    };
  };

  const partnership = computePartnership();

  const totalBalls = (match.events || []).filter(e => e.battingTeam === currentBattingTeam).length;
  const totalRuns = (match.events || []).filter(e => e.battingTeam === currentBattingTeam).reduce((s, e) => s + (e.runs || 0) + (e.extras?.runs || 0), 0);
  const dotBalls = (match.events || []).filter(e => e.battingTeam === currentBattingTeam && !e.wicket && (e.runs || 0) === 0 && !e.extras?.type).length;
  const boundaryRuns = (match.events || []).filter(e => e.battingTeam === currentBattingTeam).reduce((s, e) => s + ((e.isFour || e.isSix) ? (e.runs || 0) : 0), 0);
  const fours = (match.events || []).filter(e => e.battingTeam === currentBattingTeam && e.isFour).length;
  const sixes = (match.events || []).filter(e => e.battingTeam === currentBattingTeam && e.isSix).length;
  const totalBoundaries = fours + sixes;
  const score = match.score?.[currentBattingTeam] || { runs: 0, wickets: 0, balls: 0, extras: 0, runRate: 0 };
  const crr = score.balls > 0 ? ((score.runs / score.balls) * 6).toFixed(2) : '0.00';
  const projected = score.balls > 0 ? Math.floor((score.runs / score.balls) * 120) : null;
  const boundaryPercent = totalRuns > 0 ? ((boundaryRuns / totalRuns) * 100).toFixed(1) : '0.0';
  const dotPercent = totalBalls > 0 ? ((dotBalls / totalBalls) * 100).toFixed(1) : '0.0';
  const wicketsRemaining = 10 - (match.score?.[currentBattingTeam]?.wickets || 0);
  const currentBowlerStats = bowlers(firstTeam).concat(bowlers(secondTeam)).find(b => b.balls > 0 && b.playerName === match.currentBowler);
  const last18 = (match.events || []).filter(e => e.battingTeam === currentBattingTeam).slice(-18);
  const overSummaries: { over: number; runs: number; wickets: number }[] = [];
  const oversMap: Record<number, { runs: number; wickets: number }> = {};
  (match.events || []).filter(e => e.battingTeam === currentBattingTeam).forEach(e => {
    const ov = e.over ?? 0;
    if (!oversMap[ov]) oversMap[ov] = { runs: 0, wickets: 0 };
    oversMap[ov].runs += (e.runs || 0) + (e.extras?.runs || 0);
    if (e.wicket) oversMap[ov].wickets += 1;
  });
  Object.entries(oversMap).sort((a, b) => Number(a[0]) - Number(b[0])).forEach(([o, v]) => overSummaries.push({ over: Number(o), ...v }));
  const fowData: { num: number; score: number; over: number; ball: number; batsman: string }[] = [];
  let cumScore = 0;
  (match.events || []).filter(e => e.battingTeam === currentBattingTeam).forEach(e => {
    cumScore += (e.runs || 0) + (e.extras?.runs || 0);
    if (e.wicket) fowData.push({ num: fowData.length + 1, score: cumScore, over: e.over ?? 0, ball: e.ball ?? 0, batsman: e.batsman });
  });

  const ballColor = (ev: any) => {
    if (ev.wicket) return 'bg-red-600 text-white';
    if (ev.isSix || ev.isFour) return 'bg-green-600 text-white';
    if ((ev.runs || 0) === 0 && !ev.extras?.type) return 'bg-sky-600 text-white';
    if ((ev.runs || 0) === 1) return 'bg-amber-400 text-black';
    return 'bg-indigo-500 text-white';
  };
  const ballLabel = (ev: any) => {
    if (ev.wicket) return 'W';
    if (ev.isSix) return '6';
    if (ev.isFour) return '4';
    if (ev.extras?.type === 'wide') return 'Wd';
    if (ev.extras?.type === 'no_ball') return 'Nb';
    return String(ev.runs + (ev.extras?.runs || 0));
  };

  return (
    <div className="w-full">

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        {(['overview', 'scorecard', 'commentary', 'graphs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'overview' ? 'Overview' : t === 'scorecard' ? 'Scorecard' : t === 'commentary' ? 'Commentary' : 'Graphs'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-5">

          {/* Section 1: Live Match Summary Cards */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Boundaries', value: `${boundaryPercent}%`, sub: `${totalBoundaries} total`, color: 'text-emerald-600' },
              { label: 'Dot Balls', value: `${dotPercent}%`, sub: `${dotBalls} total`, color: 'text-sky-600' },
              { label: 'Extras', value: score.extras, sub: '', color: 'text-amber-600' },
              { label: '4s', value: fours, sub: '', color: 'text-indigo-600' },
              { label: '6s', value: sixes, sub: '', color: 'text-rose-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-center min-w-[80px] flex-1">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-0.5">{s.label}</div>
                <div className={`text-xl sm:text-2xl font-black font-mono ${s.color}`}>{s.value}</div>
                {s.sub && <div className="text-[10px] text-slate-400 mt-0.5">{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Section 2: Current Batters */}
          {notOutBatsmen.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Current Batters</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notOutBatsmen.slice(0, 2).map(b => (
                  <div key={b.playerName} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {b.playerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate">{b.playerName}</div>
                      <div className="text-2xl font-black text-slate-900 font-mono">{b.runs}<span className="text-base font-normal text-slate-400">({b.balls})</span></div>
                      <div className="flex gap-3 mt-1 text-xs text-slate-500">
                        <span>4s: <strong className="text-slate-700">{b.fours}</strong></span>
                        <span>6s: <strong className="text-slate-700">{b.sixes}</strong></span>
                        <span>SR: <strong className="text-slate-700">{b.strikeRate?.toFixed(1)}</strong></span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button className="text-[10px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded-lg transition-colors">Wagon</button>
                      <button className="text-[10px] font-medium text-indigo-700 border border-indigo-300 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors">Profile</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Current Bowler */}
          {currentBowlerStats && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Current Bowler</h3>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shrink-0">
                    {currentBowlerStats.playerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{currentBowlerStats.playerName}</div>
                    <div className="text-sm font-mono font-bold text-slate-700">{Math.floor(currentBowlerStats.balls / 6)}-{currentBowlerStats.balls % 6}-{currentBowlerStats.runs}-{currentBowlerStats.wickets}</div>
                  </div>
                </div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">Last Over</div>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    const bowlerEvents = (match.events || []).filter(e => e.bowler === currentBowlerStats.playerName);
                    const lastOverEvents = bowlerEvents.length > 0
                      ? bowlerEvents.filter(e => e.over === bowlerEvents[bowlerEvents.length - 1].over)
                      : [];
                    return lastOverEvents.length > 0 ? lastOverEvents.map((ev, i) => (
                      <span key={i} className={`w-8 h-8 border-2 border-dashed rounded-lg flex items-center justify-center text-xs font-bold ${ballColor(ev)}`}>
                        {ballLabel(ev)}
                      </span>
                    )) : <span className="text-xs text-slate-400 italic">No overs yet</span>;
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Partnership Analysis */}
          {partnership && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Partnership Analysis</h3>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-3xl font-black text-slate-900 font-mono">{partnership.runs}</span>
                    <span className="text-sm text-slate-500 ml-2">runs</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-700">{partnership.balls}</span>
                    <span className="text-xs text-slate-500 ml-1">balls</span>
                    <div className="text-xs font-semibold text-cyan-600">RR: {partnership.runRate}</div>
                  </div>
                </div>
                <div className="flex gap-4 mb-3">
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 mb-1">{partnership.p1.playerName}</div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                      {(() => {
                        const pct = partnership.runs > 0 ? Math.round((partnership.p1.runs / partnership.runs) * 100) : 0;
                        return <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${pct}%` }} />;
                      })()}
                    </div>
                    <div className="text-xs font-semibold text-slate-700 mt-0.5">{partnership.p1.runs} ({partnership.runs > 0 ? Math.round((partnership.p1.runs / partnership.runs) * 100) : 0}%)</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 mb-1">{partnership.p2.playerName}</div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                      {(() => {
                        const pct = partnership.runs > 0 ? Math.round((partnership.p2.runs / partnership.runs) * 100) : 0;
                        return <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${pct}%` }} />;
                      })()}
                    </div>
                    <div className="text-xs font-semibold text-slate-700 mt-0.5">{partnership.p2.runs} ({partnership.runs > 0 ? Math.round((partnership.p2.runs / partnership.runs) * 100) : 0}%)</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                  Boundaries in partnership: <strong className="text-slate-700">
                    {fours + sixes}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Last 18 Balls */}
          {last18.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Last 18 Balls</h3>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                {[0, 6, 12].map(rowStart => (
                  <div key={rowStart} className="flex gap-1.5 mb-1.5 last:mb-0">
                    {last18.slice(rowStart, rowStart + 6).map((ev, i) => (
                      <span key={i} className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm ${ballColor(ev)}`}>
                        {ballLabel(ev)}
                      </span>
                    ))}
                    {last18.slice(rowStart, rowStart + 6).length < 6 && (
                      <span className="text-[10px] text-slate-400 italic self-center ml-1">inning start</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 6: Over By Over Summary */}
          {overSummaries.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Over By Over Summary</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {overSummaries.map(o => (
                  <div key={o.over} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Over {o.over}</div>
                    <div className="text-lg font-black text-slate-900 font-mono">{o.runs}</div>
                    {o.wickets > 0 && <div className="text-[10px] font-semibold text-red-600">Wkt {o.wickets}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 7: Fall Of Wickets Timeline */}
          {fowData.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Fall Of Wickets</h3>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start gap-0 overflow-x-auto pb-2">
                  {fowData.map((w, i) => (
                    <div key={i} className="flex items-center min-w-0">
                      <div className="flex flex-col items-center min-w-[80px]">
                        <div className="text-xs font-bold text-red-600 bg-red-50 rounded-full px-2 py-0.5 border border-red-200">
                          {w.num}-{w.score}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 whitespace-nowrap">{w.batsman}</div>
                        <div className="text-[10px] text-slate-400">{w.over}.{w.ball}</div>
                      </div>
                      {i < fowData.length - 1 && (
                        <div className="w-6 sm:w-10 h-px bg-red-200 mt-2 mb-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Scorecard Tab — Broadcaster Style */}
      {tab === 'scorecard' && (
        <div className="space-y-4">
          {/* First Innings batting */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1 bg-yellow-500" />
            <CardHeader className="pb-1 border-b border-yellow-100 bg-black">
              <CardTitle className="text-sm font-bold text-yellow-400 uppercase tracking-wider">{match.teamA?.teamName} — Batting</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="bg-yellow-500 text-left text-xs text-black font-bold uppercase">
                  <th className="p-3">Batter</th><th className="p-3 text-center">R</th>
                  <th className="p-3 text-center">B</th><th className="p-3 text-center">4s</th>
                  <th className="p-3 text-center">6s</th><th className="p-3 text-center">SR</th>
                </tr></thead>
                <tbody>
                  {batters('teamA').map((p, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-yellow-50/50 transition-colors">
                      <td className="p-3 font-medium">
                        {p.playerName}
                        {p.out
                          ? <span className="text-red-500 text-xs ml-1">† {p.dismissalType} b {p.bowledBy}</span>
                          : <span className="text-yellow-600 ml-1 text-xs font-bold">*</span>}
                      </td>
                      <td className="p-3 text-center font-bold text-lg">{p.runs}</td>
                      <td className="p-3 text-center">{p.balls}</td>
                      <td className="p-3 text-center">{p.fours}</td>
                      <td className="p-3 text-center">{p.sixes}</td>
                      <td className="p-3 text-center font-semibold">{p.strikeRate?.toFixed(1)}</td>
                    </tr>
                  ))}
                  {batters('teamA').length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-400">No data</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1 bg-yellow-500" />
            <CardHeader className="pb-1 border-b border-yellow-100 bg-black">
              <CardTitle className="text-sm font-bold text-yellow-400 uppercase tracking-wider">{match.teamB?.teamName} — Batting</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="bg-yellow-500 text-left text-xs text-black font-bold uppercase">
                  <th className="p-3">Batter</th><th className="p-3 text-center">R</th>
                  <th className="p-3 text-center">B</th><th className="p-3 text-center">4s</th>
                  <th className="p-3 text-center">6s</th><th className="p-3 text-center">SR</th>
                </tr></thead>
                <tbody>
                  {batters('teamB').map((p, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-yellow-50/50 transition-colors">
                      <td className="p-3 font-medium">
                        {p.playerName}
                        {p.out
                          ? <span className="text-red-500 text-xs ml-1">† {p.dismissalType} b {p.bowledBy}</span>
                          : <span className="text-yellow-600 ml-1 text-xs font-bold">*</span>}
                      </td>
                      <td className="p-3 text-center font-bold text-lg">{p.runs}</td>
                      <td className="p-3 text-center">{p.balls}</td>
                      <td className="p-3 text-center">{p.fours}</td>
                      <td className="p-3 text-center">{p.sixes}</td>
                      <td className="p-3 text-center font-semibold">{p.strikeRate?.toFixed(1)}</td>
                    </tr>
                  ))}
                  {batters('teamB').length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-400">No data</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Bowling */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1 bg-yellow-500" />
            <CardHeader className="pb-1 border-b border-yellow-100 bg-black">
              <CardTitle className="text-sm font-bold text-yellow-400 uppercase tracking-wider">Bowling</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="bg-yellow-500 text-left text-xs text-black font-bold uppercase">
                  <th className="p-3">Bowler</th><th className="p-3 text-center">O</th>
                  <th className="p-3 text-center">M</th><th className="p-3 text-center">R</th>
                  <th className="p-3 text-center">W</th><th className="p-3 text-center">Econ</th>
                </tr></thead>
                <tbody>
                  {[...bowlers('teamA'), ...bowlers('teamB')].map((p, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-yellow-50/50 transition-colors">
                      <td className="p-3 font-medium">{p.playerName}</td>
                       <td className="p-3 text-center">{Math.floor(p.balls / 6)}.{p.balls % 6}</td>
                      <td className="p-3 text-center">0</td>
                      <td className="p-3 text-center font-bold text-lg">{p.runs}</td>
                      <td className="p-3 text-center font-bold text-lg">{p.wickets}</td>
                      <td className="p-3 text-center font-semibold">{p.economy?.toFixed(2)}</td>
                    </tr>
                  ))}
                  {bowlers('teamA').length === 0 && bowlers('teamB').length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-400">No data</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Graphs Tab */}
      {tab === 'graphs' && (
        <GraphsView
          events={match.events || []}
          playerStats={match.playerStats}
          score={match.score}
          battingFirst={match.battingFirst}
          teamA={match.teamA}
          teamB={match.teamB}
          teamAResult={match.teamAResult}
          teamBResult={match.teamBResult}
          result={match.result}
        />
      )}

      {/* Commentary Tab */}
      {tab === 'commentary' && (
        <Card>
          <CardHeader className="pb-1 border-b">
            <CardTitle className="text-sm font-semibold">Live Commentary</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto">
            {(match.events || []).slice().reverse().map((ev: any, i: number) => (
              <div key={i} className={`flex gap-3 p-3 border-b border-gray-100 ${ev.wicket ? 'bg-red-50' : ev.isFour ? 'bg-emerald-50' : ev.isSix ? 'bg-purple-50' : ''}`}>
                <div className="min-w-[60px]">
                  <span className="font-mono text-sm font-bold text-gray-500 bg-gray-100 rounded px-2 py-1">
                    {ev.over}.{ev.ball}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{ev.bowler}</span> to <span className="font-medium">{ev.batsman}</span>
                  </p>
                  <p className="text-sm font-semibold mt-0.5">
                    {ev.wicket && <span className="text-red-600">☝️ WICKET! </span>}
                    {ev.isSix && <span className="text-purple-600">SIX! </span>}
                    {ev.isFour && <span className="text-emerald-600">FOUR! </span>}
                    {ev.description || `${ev.runs} run${ev.runs !== 1 ? 's' : ''}`}
                    {ev.extras?.type && <span className="text-amber-600 ml-1">({ev.extras.type.replace('_', ' ')})</span>}
                  </p>
                </div>
                <div className="text-right min-w-[40px]">
                  <span className={`text-lg font-bold ${ev.wicket ? 'text-red-600' : ev.isSix ? 'text-purple-600' : ev.isFour ? 'text-emerald-600' : ev.runs === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                    {ev.wicket ? 'W' : ev.isSix ? '6' : ev.isFour ? '4' : ev.runs}
                  </span>
                </div>
              </div>
            ))}
            {(!match.events || match.events.length === 0) && (
              <div className="p-6 text-center text-gray-400">No commentary yet</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
