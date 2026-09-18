import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { io as socketIO, Socket } from 'socket.io-client';
import { API_BASE, BASE_URL } from '@/config';
import { Loader2 } from 'lucide-react';
import GraphsView from './GraphsView';
import { getProfileImageUrl } from '@/utils/getProfileImageUrl';
import api from '@/lib/api';

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

interface Props { matchId: string; initialData?: MatchData; onMatchUpdate?: (match: MatchData, computed: any) => void; viewInnings?: 1 | 2; }

const socketBase = API_BASE.replace('/api', '');

export default function LiveScoreDisplay({ matchId, initialData, onMatchUpdate, viewInnings: viewInningsProp }: Props) {
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchData | undefined>(initialData);
  const [computed, setComputed] = useState<ComputedState | null>(null);
  const [loading, setLoading] = useState(!initialData);
  const [tab, setTab] = useState<'overview' | 'scorecard' | 'commentary' | 'graphs'>('overview');
  const [viewInningsLocal, setViewInningsLocal] = useState<1 | 2>(match?.currentInnings === 2 ? 2 : 1);
  const viewInnings = viewInningsProp ?? viewInningsLocal;
  const setViewInnings = viewInningsProp ? () => {} : setViewInningsLocal;
  const [showAllOvers, setShowAllOvers] = useState(false);
  const [oversDialogOpen, setOversDialogOpen] = useState(false);
  const [playerImages, setPlayerImages] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/player/public').then(res => {
      const map: Record<string, string> = {};
      (res.data.players || []).forEach((p: any) => {
        if (p.profilePicture) map[p.name] = getProfileImageUrl(p.profilePicture);
      });
      setPlayerImages(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!matchId) return;
    if (!initialData) fetchMatch();

    const socket = socketIO(socketBase, { transports: ['websocket', 'polling'] });
    socket.emit('join-match', { matchId });

    socket.on('ball-event', (data: { event: BallEvent; match: MatchData }) => {
      if (data.match) {
        setMatch(data.match);
        fetch(`${API_BASE}/matches/${matchId}/live-score`)
          .then(r => r.json())
          .then(d => { if (d.computed) { setComputed(d.computed); onMatchUpdate?.(data.match, d.computed); } })
          .catch(() => {});
      }
    });
    socket.on('score-updated', (data: { match: MatchData }) => {
      if (data.match) {
        setMatch(data.match);
        fetch(`${API_BASE}/matches/${matchId}/live-score`)
          .then(r => r.json())
          .then(d => { if (d.computed) { setComputed(d.computed); onMatchUpdate?.(data.match, d.computed); } })
          .catch(() => {});
      }
    });

    // Polling fallback — refetch every 2s for mobile stability
    const pollInterval = setInterval(() => {
      fetch(`${API_BASE}/matches/${matchId}/live-score`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.match) {
            setMatch(d.match);
            if (d.computed) {
              setComputed(d.computed);
              onMatchUpdate?.(d.match, d.computed);
            }
          }
        })
        .catch(() => {});
    }, 2000);

    return () => {
      socket.emit('leave-match', { matchId });
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const res = await fetch(`${API_BASE}/matches/${matchId}/live-score`);
      const data = await res.json();
      if (data.success) {
        setMatch(data.match);
        if (data.computed) {
          setComputed(data.computed);
          onMatchUpdate?.(data.match, data.computed);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  if (!match) return null;

  const battingFirst = match.battingFirst || 'teamA';
  const isLive = match.result === 'live';
  const cs = computed;

  const batters = (team: string) => {
    const fromStats = cs?.playerStats?.batting?.filter(b => b.team === team) || match.playerStats?.batting?.filter(b => b.team === team) || [];
    const names = new Set(fromStats.map(b => b.playerName));
    const extra: { playerName: string; runs: number; balls: number; fours: number; sixes: number; strikeRate: number; out: boolean; dismissalType: string; bowledBy: string; team: string }[] = [];
    const makeEntry = (name: string) => {
      const evts = (match.events || []).filter(e => e.batsman === name && e.battingTeam === team);
      const runs = evts.reduce((s, e) => s + (e.runs || 0) + (e.extras?.runs || 0), 0);
      const balls = evts.length;
      const fours = evts.filter(e => e.isFour).length;
      const sixes = evts.filter(e => e.isSix).length;
      const sr = balls > 0 ? (runs / balls) * 100 : 0;
      return { playerName: name, runs, balls, fours, sixes, strikeRate: sr, out: false, dismissalType: '', bowledBy: '', team };
    };
    if (match.striker && !names.has(match.striker)) { extra.push(makeEntry(match.striker)); }
    if (match.nonStriker && !names.has(match.nonStriker)) { extra.push(makeEntry(match.nonStriker)); }
    return [...fromStats, ...extra];
  };
  const bowlers = (team: string) => cs?.playerStats?.bowling?.filter(b => b.team === team) || match.playerStats?.bowling?.filter(b => b.team === team) || [];

  const firstTeam = battingFirst;
  const secondTeam = battingFirst === 'teamA' ? 'teamB' : 'teamA';
  const firstTeamName = firstTeam === 'teamA' ? match.teamA?.teamName : match.teamB?.teamName;
  const secondTeamName = secondTeam === 'teamA' ? match.teamA?.teamName : match.teamB?.teamName;
  const currentBattingTeam = viewInnings === 1 ? firstTeam : secondTeam;

  const notOutBatsmen = (() => {
    const fromStats = (batters(currentBattingTeam) || []).filter(b => !b.out);
    const names = new Set(fromStats.map(b => b.playerName));
    const extra: { playerName: string; runs: number; balls: number; fours: number; sixes: number; strikeRate: number; out: boolean; team: string }[] = [];
    const makeEntry = (name: string) => {
      const evts = (match.events || []).filter(e => e.batsman === name && e.battingTeam === currentBattingTeam);
      const runs = evts.reduce((s, e) => s + (e.runs || 0) + (e.extras?.runs || 0), 0);
      const balls = evts.length;
      const fours = evts.filter(e => e.isFour).length;
      const sixes = evts.filter(e => e.isSix).length;
      const sr = balls > 0 ? (runs / balls) * 100 : 0;
      return { playerName: name, runs, balls, fours, sixes, strikeRate: sr, out: false, team: currentBattingTeam };
    };
    if (match.striker && !names.has(match.striker)) { extra.push(makeEntry(match.striker)); }
    if (match.nonStriker && !names.has(match.nonStriker)) { extra.push(makeEntry(match.nonStriker)); }
    return [...fromStats, ...extra];
  })();

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
      <div className="flex gap-2 mb-6 mt-2 p-1.5">
        {([
          { key: 'overview' as const, label: 'Overview', icon: '📊' },
          { key: 'scorecard' as const, label: 'Scorecard', icon: '📋' },
          { key: 'commentary' as const, label: 'Commentary', icon: '💬' },
          { key: 'graphs' as const, label: 'Graphs', icon: '📈' },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 sm:py-2.5 rounded-lg text-[10px] sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 border-2 ${
              tab === t.key
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-lg shadow-blue-600/30'
                : 'text-slate-500 border-slate-200 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="hidden sm:inline">{t.icon} </span>{t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-6">

          {/* Section 1: Live Match Summary Cards */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {[
              { label: 'Boundaries', value: `${boundaryPercent}%`, sub: `${totalBoundaries} total`, color: 'text-emerald-600' },
              { label: 'Dot Balls', value: `${dotPercent}%`, sub: `${dotBalls} total`, color: 'text-sky-600' },
              { label: 'Extras', value: score.extras, sub: '', color: 'text-amber-600' },
              { label: '4s', value: fours, sub: '', color: 'text-indigo-600' },
              { label: '6s', value: sixes, sub: '', color: 'text-rose-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 px-3 py-4 sm:px-4 sm:py-5 text-center shadow-sm">
                <div className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">{s.label}</div>
                <div className={`text-3xl sm:text-4xl font-black font-mono ${s.color}`}>{s.value}</div>
                {s.sub && <div className="text-xs sm:text-sm text-slate-400 mt-1 font-semibold">{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Section 2: Current Batters */}
          {notOutBatsmen.length > 0 && (
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-700 mb-3">Current Batters</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notOutBatsmen.slice(0, 2).map(b => (
                  <div key={b.playerName} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden">
                      {playerImages[b.playerName] ? (
                        <img src={playerImages[b.playerName]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        b.playerName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate uppercase">{b.playerName}</div>
                      <div className="text-2xl font-black text-slate-900 font-mono">{b.runs}<span className="text-base font-normal text-slate-400">({b.balls})</span></div>
                      <div className="flex gap-3 mt-1.5 text-sm text-slate-500">
                        <span>4s: <strong className="text-slate-700">{b.fours}</strong></span>
                        <span>6s: <strong className="text-slate-700">{b.sixes}</strong></span>
                        <span>SR: <strong className="text-slate-700">{b.strikeRate?.toFixed(1)}</strong></span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/players?search=${encodeURIComponent(b.playerName)}`)}
                      className="text-[10px] sm:text-xs font-medium text-indigo-700 border border-indigo-300 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Current Bowler */}
          {(() => {
            if (!match.currentBowler) return null;
            const bowlerEvents = (match.events || []).filter(e => e.battingTeam === currentBattingTeam && e.bowler === match.currentBowler);
            if (bowlerEvents.length === 0) return null;

            // Group by over
            const overs: Record<number, any[]> = {};
            bowlerEvents.forEach(ev => {
              const ov = ev.over ?? 0;
              if (!overs[ov]) overs[ov] = [];
              overs[ov].push(ev);
            });
            const oversSorted = Object.entries(overs).sort((a, b) => Number(a[0]) - Number(b[0]));
            const stats = bowlers(firstTeam).concat(bowlers(secondTeam)).find(b => b.playerName === match.currentBowler);

            return (
              <div>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-700 mb-3">Current Bowler</h3>
                <div className="bg-white rounded-xl border border-emerald-300 shadow-md shadow-emerald-100 p-4">
                  {/* Bowler header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                      {playerImages[match.currentBowler] ? (
                        <img src={playerImages[match.currentBowler]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        match.currentBowler!.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-slate-800 truncate uppercase">{match.currentBowler}</span>
                      <div className="text-sm font-mono font-bold text-slate-700">
                        {stats ? `${Math.floor(stats.balls / 6)}-${stats.balls % 6}-${stats.runs}-${stats.wickets}` : '0-0-0-0'}
                      </div>
                    </div>
                  </div>
                  {/* Overs */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {oversSorted.map(([overNum, events], oi) => (
                      <div key={oi} className="border-2 border-dashed border-slate-200 rounded-xl p-2 sm:p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Over {Number(overNum) + 1}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs sm:text-sm font-bold text-slate-600">{events.reduce((s, e) => s + (e.runs || 0) + (e.extras?.runs || 0), 0)} runs</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {events.map((ev: any, i: number) => (
                            <span key={i} className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-sm ${ballColor(ev)}`}>
                              {ballLabel(ev)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Section 4: Partnership Analysis */}
          {(() => {
            const teamEvents = (match.events || []).filter(e => e.battingTeam === currentBattingTeam);

            // Build all partnerships from events
            const allPartnerships: { p1: string; p2: string; runs: number; balls: number; fours: number; sixes: number; p1Runs: number; p2Runs: number }[] = [];
            let currentP1 = '';
            let currentP2 = '';
            let pRuns = 0;
            let pBalls = 0;
            let pFours = 0;
            let pSixes = 0;
            let p1R = 0;
            let p2R = 0;

            for (const ev of teamEvents) {
              if (!currentP1) currentP1 = ev.batsman;
              if (!currentP2 && ev.batsman !== currentP1) currentP2 = ev.batsman;
              if (ev.batsman !== currentP1 && ev.batsman !== currentP2) {
                if (currentP1 && currentP2) {
                  allPartnerships.push({ p1: currentP1, p2: currentP2, runs: pRuns, balls: pBalls, fours: pFours, sixes: pSixes, p1Runs: p1R, p2Runs: p2R });
                }
                currentP1 = currentP2;
                currentP2 = ev.batsman;
                pRuns = 0; pBalls = 0; pFours = 0; pSixes = 0; p1R = 0; p2R = 0;
              }
              const evRuns = (ev.runs || 0) + (ev.extras?.runs || 0);
              pRuns += evRuns;
              pBalls += 1;
              if (ev.isFour) pFours += 1;
              if (ev.isSix) pSixes += 1;
              if (ev.batsman === currentP1) p1R += evRuns;
              else p2R += evRuns;
            }
            if (currentP1 && currentP2) {
              allPartnerships.push({ p1: currentP1, p2: currentP2, runs: pRuns, balls: pBalls, fours: pFours, sixes: pSixes, p1Runs: p1R, p2Runs: p2R });
            }

            // If no partnerships from events but striker/non-striker exist, add a live partnership
            if (allPartnerships.length === 0 && match.striker && match.nonStriker && currentBattingTeam === (viewInnings === 1 ? firstTeam : secondTeam)) {
              const strikerEvts = (match.events || []).filter(e => e.batsman === match.striker && e.battingTeam === currentBattingTeam);
              const nonStrikerEvts = (match.events || []).filter(e => e.batsman === match.nonStriker && e.battingTeam === currentBattingTeam);
              const sRuns = strikerEvts.reduce((s, e) => s + (e.runs || 0) + (e.extras?.runs || 0), 0);
              const nsRuns = nonStrikerEvts.reduce((s, e) => s + (e.runs || 0) + (e.extras?.runs || 0), 0);
              const sBalls = strikerEvts.length;
              const nsBalls = nonStrikerEvts.length;
              const sFours = strikerEvts.filter(e => e.isFour).length;
              const sSixes = strikerEvts.filter(e => e.isSix).length;
              const nsFours = nonStrikerEvts.filter(e => e.isFour).length;
              const nsSixes = nonStrikerEvts.filter(e => e.isSix).length;
              allPartnerships.push({
                p1: match.striker, p2: match.nonStriker,
                runs: sRuns + nsRuns, balls: sBalls + nsBalls,
                fours: sFours + nsFours, sixes: sSixes + nsSixes,
                p1Runs: sRuns, p2Runs: nsRuns,
              });
            }

            if (allPartnerships.length === 0) return null;

            const maxRuns = Math.max(...allPartnerships.map(p => p.runs), 1);
            // Reverse so current partnership shows first
            const reversed = [...allPartnerships].reverse();

            return (
              <div>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-700 mb-3">Partnerships</h3>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                  <div className="space-y-3">
                    {reversed.map((p, i) => {
                      const pct = maxRuns > 0 ? (p.runs / maxRuns) * 100 : 0;
                      const origIdx = allPartnerships.length - 1 - i;
                      const isCurrent = origIdx === allPartnerships.length - 1;
                      return (
                        <div key={i}>
                          {i > 0 && <div className="border-t border-dashed border-slate-200 my-3" />}
                          <div className="flex items-center gap-3 mb-2">
                            {isCurrent && <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Current</span>}
                          </div>
                          {/* Names left/right, Runs | Balls center */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs sm:text-sm font-bold text-slate-700 truncate uppercase min-w-0 flex-1 text-left">{p.p1}</span>
                            <div className="flex items-center gap-2 flex-shrink-0 px-2">
                              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{p.runs} <span className="text-xs sm:text-sm font-bold text-slate-500">Runs</span></span>
                              <span className="text-lg text-slate-300 font-bold">|</span>
                              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{p.balls} <span className="text-xs sm:text-sm font-bold text-slate-500">Balls</span></span>
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-slate-700 truncate uppercase min-w-0 flex-1 text-right">{p.p2}</span>
                          </div>
                          {/* Number + Split progress bar */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs sm:text-sm font-black text-slate-400 flex-shrink-0">#{allPartnerships.length - i}</span>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 flex overflow-hidden">
                              <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-2.5 transition-all" style={{ width: `${p.runs > 0 ? (p.p1Runs / p.runs) * pct : 0}%` }} />
                              <div className="bg-gradient-to-r from-purple-500 to-purple-400 h-2.5 transition-all" style={{ width: `${p.runs > 0 ? (p.p2Runs / p.runs) * pct : 0}%` }} />
                            </div>
                          </div>
                          {/* Individual runs below progress bar */}
                          <div className="flex items-center justify-between mb-1 px-1">
                            <span className="text-[10px] sm:text-xs font-bold text-indigo-600">{p.p1Runs} runs</span>
                            <span className="text-[10px] sm:text-xs font-bold text-purple-600">{p.p2Runs} runs</span>
                          </div>
                          <div className="text-center text-sm sm:text-base font-bold text-slate-600">
                            {p.fours} Fours, {p.sixes} Sixes
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Section 5: Last Overs */}
          {(() => {
            const teamEvents = (match.events || []).filter(e => e.battingTeam === currentBattingTeam);
            if (teamEvents.length === 0) return null;

            // Group by over, track bowler
            const overs: Record<number, { events: any[]; bowler: string }> = {};
            teamEvents.forEach(ev => {
              const ov = ev.over ?? 0;
              if (!overs[ov]) overs[ov] = { events: [], bowler: ev.bowler || '' };
              overs[ov].events.push(ev);
              if (ev.bowler) overs[ov].bowler = ev.bowler;
            });
            const oversSorted = Object.entries(overs).sort((a, b) => Number(b[0]) - Number(a[0]));
            if (oversSorted.length === 0) return null;

            const last3 = oversSorted.slice(0, 3);

            const renderOver = (overNum: string, data: { events: any[]; bowler: string }, idx: number) => (
              <div key={idx} className="border-2 border-dashed border-slate-200 rounded-xl p-3 sm:p-4 lg:p-5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Over {Number(overNum) + 1}</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-600 mb-2 truncate">
                  {data.bowler} : {data.events.reduce((s, e) => s + (e.runs || 0) + (e.extras?.runs || 0), 0)} runs
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.events.map((ev: any, i: number) => (
                    <span key={i} className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-sm ${ballColor(ev)}`}>
                      {ballLabel(ev)}
                    </span>
                  ))}
                </div>
              </div>
            );

            return (
              <div>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-700 mb-3">Last 3 Overs</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {last3.map(([overNum, data], oi) => renderOver(overNum, data, oi))}
                </div>
                {oversSorted.length > 1 && (
                  <button
                    onClick={() => setOversDialogOpen(true)}
                    className="mt-3 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all mx-auto block"
                  >
                    View All Overs
                  </button>
                )}

                {/* All Overs Dialog */}
                <Dialog open={oversDialogOpen} onOpenChange={setOversDialogOpen}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-sm font-bold uppercase tracking-wider">All Overs</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                      {oversSorted.map(([overNum, data], oi) => (
                        <div key={oi} className="border-2 border-dashed border-slate-200 rounded-xl p-3 sm:p-4">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Over {Number(overNum) + 1}</span>
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-600 mb-2 truncate">
                            {data.bowler} : {data.events.reduce((s, e) => s + (e.runs || 0) + (e.extras?.runs || 0), 0)} runs
                          </div>
                          <div className="flex gap-1.5">
                            {data.events.map((ev: any, i: number) => (
                              <span key={i} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm ${ballColor(ev)}`}>
                                {ballLabel(ev)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            );
          })()}

          {/* Section 7: Fall Of Wickets */}
          {fowData.length > 0 && (
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-700 mb-3">Fall Of Wickets</h3>
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-200 p-3 sm:p-5">
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
                  {fowData.map((w, i) => {
                    const colors = [
                      'from-red-500 to-rose-500',
                      'from-orange-500 to-amber-500',
                      'from-amber-500 to-yellow-500',
                      'from-emerald-500 to-teal-500',
                      'from-blue-500 to-cyan-500',
                      'from-indigo-500 to-violet-500',
                      'from-purple-500 to-fuchsia-500',
                      'from-pink-500 to-rose-500',
                      'from-teal-500 to-emerald-500',
                      'from-sky-500 to-blue-500',
                    ];
                    const gradient = colors[i % colors.length];
                    return (
                      <div key={i} className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-2 sm:p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-[10px] sm:text-xs mx-auto mb-1 sm:mb-2`}>
                          {w.num}
                        </div>
                        <div className="font-bold text-slate-800 text-[10px] sm:text-sm truncate">{w.batsman}</div>
                        <div className="text-[10px] sm:text-sm font-semibold text-slate-600 mt-0.5">at {w.score}/{w.num}</div>
                        <div className="text-[10px] sm:text-sm font-semibold text-slate-500 mt-0.5">Over {w.over}.{w.ball}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Scorecard Tab */}
      {tab === 'scorecard' && (
        <div className="space-y-8">
          {/* 1st Innings */}
          {viewInnings === 1 ? (
            <>
              <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-4 sm:px-6 py-2.5 sm:py-3">
                  <div className="text-xs sm:text-sm md:text-base font-black text-white uppercase tracking-wider">BATTING — {firstTeamName}</div>
                </div>
                <div className="bg-white overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100 text-left font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                        <th className="px-2 py-2 text-[11px] sm:text-sm md:text-base">Batter</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">R</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">B</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">4s</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">6s</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">SR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batters(firstTeam).map((p, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-amber-50/50 transition-colors">
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-0.5">
                              <span className="font-bold text-[11px] sm:text-sm md:text-base text-slate-800 uppercase truncate max-w-[70px] sm:max-w-none">{p.playerName}</span>
                              {p.out ? (
                                <span className="text-red-500 text-[10px] sm:text-[10px] md:text-xs font-bold bg-red-50 px-1 py-0.5 rounded whitespace-nowrap">{p.dismissalType}</span>
                              ) : (
                                <span className="text-amber-500 text-[10px] sm:text-xs font-bold">*</span>
                              )}
                            </div>
                            {p.out && <div className="text-[10px] sm:text-[10px] md:text-xs text-slate-400 mt-0.5">b {p.bowledBy}</div>}
                          </td>
                          <td className="px-1.5 py-2.5 text-center text-lg sm:text-2xl md:text-3xl font-black text-slate-900 font-mono">{p.runs}</td>
                          <td className="px-1.5 py-2.5 text-center text-sm sm:text-lg md:text-xl font-bold text-slate-600">{p.balls}</td>
                          <td className="px-1.5 py-2.5 text-center text-sm sm:text-lg md:text-xl font-bold text-emerald-600">{p.fours}</td>
                          <td className="px-1.5 py-2.5 text-center text-sm sm:text-lg md:text-xl font-bold text-purple-600">{p.sixes}</td>
                          <td className="px-1.5 py-2.5 text-center text-[11px] sm:text-sm md:text-base font-bold text-slate-700">{p.strikeRate?.toFixed(1)}</td>
                        </tr>
                      ))}
                      {batters(firstTeam).length === 0 && (
                        <tr><td colSpan={6} className="px-2 py-4 text-center text-slate-400 text-[10px] sm:text-sm">No batting data yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 sm:px-6 py-2.5 sm:py-3">
                  <div className="text-xs sm:text-sm md:text-base font-black text-white uppercase tracking-wider">BOWLING — {secondTeamName}</div>
                </div>
                <div className="bg-white overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100 text-left font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                        <th className="px-2 py-2 text-[11px] sm:text-sm md:text-base">Bowler</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">O</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">M</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">R</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">W</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">Econ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bowlers(secondTeam).map((p, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-blue-50/50 transition-colors">
                          <td className="px-2 py-2.5 font-bold text-[11px] sm:text-sm md:text-base text-slate-800 uppercase truncate max-w-[70px] sm:max-w-none">{p.playerName}</td>
                          <td className="px-1.5 py-2.5 text-center text-sm sm:text-lg md:text-xl font-bold text-slate-900">{Math.floor(p.balls / 6)}.{p.balls % 6}</td>
                          <td className="px-1.5 py-2.5 text-center text-sm sm:text-lg md:text-xl font-bold text-slate-600">0</td>
                          <td className="px-1.5 py-2.5 text-center text-lg sm:text-2xl md:text-3xl font-black text-slate-900 font-mono">{p.runs}</td>
                          <td className="px-1.5 py-2.5 text-center text-lg sm:text-2xl md:text-3xl font-black text-blue-600 font-mono">{p.wickets}</td>
                          <td className="px-1.5 py-2.5 text-center text-[11px] sm:text-sm md:text-base font-bold text-slate-700">{p.economy?.toFixed(2)}</td>
                        </tr>
                      ))}
                      {bowlers(secondTeam).length === 0 && (
                        <tr><td colSpan={6} className="px-2 py-4 text-center text-slate-400 text-[10px] sm:text-sm">No bowling data yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-300">
                <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-4 sm:px-6 py-2.5 sm:py-3">
                  <div className="text-xs sm:text-sm md:text-base font-black text-white uppercase tracking-wider">BATTING — {secondTeamName}</div>
                </div>
                <div className="bg-white overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-emerald-50 text-left font-bold uppercase tracking-wider text-emerald-700 border-b border-emerald-100">
                        <th className="px-2 py-2 text-[11px] sm:text-sm md:text-base">Batter</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">R</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">B</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">4s</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">6s</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">SR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batters(secondTeam).map((p, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/50 transition-colors">
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-0.5">
                              <span className="font-bold text-[11px] sm:text-sm md:text-base text-slate-800 uppercase truncate max-w-[70px] sm:max-w-none">{p.playerName}</span>
                              {p.out ? (
                                <span className="text-red-500 text-[10px] sm:text-[10px] md:text-xs font-bold bg-red-50 px-1 py-0.5 rounded whitespace-nowrap">{p.dismissalType}</span>
                              ) : (
                                <span className="text-emerald-500 text-[10px] sm:text-xs font-bold">*</span>
                              )}
                            </div>
                            {p.out && <div className="text-[10px] sm:text-[10px] md:text-xs text-slate-400 mt-0.5">b {p.bowledBy}</div>}
                          </td>
                          <td className="px-1.5 py-2.5 text-center text-lg sm:text-2xl md:text-3xl font-black text-slate-900 font-mono">{p.runs}</td>
                          <td className="px-1.5 py-2.5 text-center text-sm sm:text-lg md:text-xl font-bold text-slate-600">{p.balls}</td>
                          <td className="px-1.5 py-2.5 text-center text-sm sm:text-lg md:text-xl font-bold text-emerald-600">{p.fours}</td>
                          <td className="px-1.5 py-2.5 text-center text-sm sm:text-lg md:text-xl font-bold text-purple-600">{p.sixes}</td>
                          <td className="px-1.5 py-2.5 text-center text-[11px] sm:text-sm md:text-base font-bold text-slate-700">{p.strikeRate?.toFixed(1)}</td>
                        </tr>
                      ))}
                      {batters(secondTeam).length === 0 && (
                        <tr><td colSpan={6} className="px-2 py-4 text-center text-slate-400 text-[10px] sm:text-sm">No batting data yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 sm:px-6 py-2.5 sm:py-3">
                  <div className="text-xs sm:text-sm md:text-base font-black text-white uppercase tracking-wider">BOWLING — {firstTeamName}</div>
                </div>
                <div className="bg-white overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100 text-left font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                        <th className="px-2 py-2 text-[11px] sm:text-sm md:text-base">Bowler</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">O</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">M</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">R</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">W</th>
                        <th className="px-1.5 py-2 text-[11px] sm:text-sm md:text-base text-center">Econ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bowlers(firstTeam).map((p, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-blue-50/50 transition-colors">
                          <td className="px-2 py-2.5 font-bold text-[11px] sm:text-sm md:text-base text-slate-800 uppercase truncate max-w-[70px] sm:max-w-none">{p.playerName}</td>
                          <td className="px-1.5 py-2.5 text-center text-sm sm:text-lg md:text-xl font-bold text-slate-900">{Math.floor(p.balls / 6)}.{p.balls % 6}</td>
                          <td className="px-1.5 py-2.5 text-center text-sm sm:text-lg md:text-xl font-bold text-slate-600">0</td>
                          <td className="px-1.5 py-2.5 text-center text-lg sm:text-2xl md:text-3xl font-black text-slate-900 font-mono">{p.runs}</td>
                          <td className="px-1.5 py-2.5 text-center text-lg sm:text-2xl md:text-3xl font-black text-blue-600 font-mono">{p.wickets}</td>
                          <td className="px-1.5 py-2.5 text-center text-[11px] sm:text-sm md:text-base font-bold text-slate-700">{p.economy?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
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
          currentInnings={match.currentInnings}
        />
      )}

      {/* Commentary Tab */}
      {tab === 'commentary' && (
        <Card>
          <CardHeader className="pb-1 border-b">
            <CardTitle className="text-sm font-semibold">Live Commentary</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto">
            {(match.events || []).filter((ev: any) => ev.battingTeam === currentBattingTeam).slice().reverse().map((ev: any, i: number) => (
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
                    {ev.wicket && <span className="text-red-600">WICKET! </span>}
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
            {(match.events || []).filter((ev: any) => ev.battingTeam === currentBattingTeam).length === 0 && (
              <div className="p-6 text-center text-gray-400">No commentary yet</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
