import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Undo2, SkipForward, Send, RefreshCw, Play, Square, MoreVertical,
  Sun, Moon, RotateCcw, X,
} from 'lucide-react';
import api from '@/lib/api';

interface PlayerStat {
  playerName: string; team: string; runs: number; balls: number; fours: number;
  sixes: number; strikeRate: number; out: boolean; dismissalType: string; bowledBy: string;
}
interface BowlingStat {
  playerName: string; team: string; overs: number; balls: number; runs: number;
  wickets: number; economy: number; wides: number; noBalls: number;
}
interface InningsScore { runs: number; wickets: number; balls: number; extras: number; fours: number; sixes: number; runRate: number; }

interface MatchData {
  _id: string; result: string;
  score: { teamA: InningsScore; teamB: InningsScore };
  events: any[]; currentOver: any[]; currentOverNumber: number;
  battingFirst: string; currentInnings: number;
  inningsStarted: boolean; firstInningsCompleted: boolean;
  striker: string; nonStriker: string; currentBowler: string;
  legalBallsInOver: number; overCompleted: boolean;
  battingOrderA: string[]; battingOrderB: string[]; nextBatAIndex: number; nextBatBIndex: number;
  dismissedPlayers: string[];
  tossWinner: string; tossDecision: string;
  teamA: { _id: string; teamName: string; teamLogo?: { url?: string } };
  teamB: { _id: string; teamName: string; teamLogo?: { url?: string } };
  playerStats: { batting: PlayerStat[]; bowling: BowlingStat[] };
  teamAResult?: { runs: number; wickets: number; overs: string };
  teamBResult?: { runs: number; wickets: number; overs: string };
}

interface PlayingXIPlayer {
  playerId: string; playerName: string; role: string;
  isCaptain: boolean; isKeeper: boolean; battingOrder: number;
}

interface PlayingXI { _id: string; matchId: string; team: string; players: PlayingXIPlayer[]; }

interface Props { matchId: string; match: MatchData; onUpdate: () => void; }

const QUICK_RUNS = [0, 1, 2, 3, 4, 5, 6];
const WICKET_TYPES = [
  { value: 'bowled', label: 'Bowled', icon: '🏏' },
  { value: 'caught', label: 'Caught', icon: '🧤' },
  { value: 'lbw', label: 'LBW', icon: '📏' },
  { value: 'run_out', label: 'Run Out', icon: '🏃' },
  { value: 'stumped', label: 'Stumped', icon: '🧤' },
  { value: 'hit_wicket', label: 'Hit Wicket', icon: '💥' },
  { value: 'retired_out', label: 'Retired', icon: '🚶' },
  { value: 'timed_out', label: 'Timed Out', icon: '⏱️' },
  { value: 'handled_ball', label: 'Handled Ball', icon: '✋' },
];

const KEY_TO_RUN: Record<string, number> = { '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6 };

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

const KEYFRAME_FLASH = `@keyframes flashScore {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}`;

export default function BallScoring({ matchId, match, onUpdate }: Props) {
  const [playingXI, setPlayingXI] = useState<PlayingXI[]>([]);
  const [over, setOver] = useState((match.events || []).length > 0 ? (match.currentOverNumber ?? 0) : 0);
  const [ball, setBall] = useState((match.events || []).length > 0 ? (match.legalBallsInOver ?? 0) : 0);
  const [runs, setRuns] = useState(0);
  const [extrasType, setExtrasType] = useState<string | null>(null);
  const [extrasRuns, setExtrasRuns] = useState(0);
  const [isWicket, setIsWicket] = useState(false);
  const [wicketType, setWicketType] = useState('');
  const [fielder, setFielder] = useState('');
  const [commentary, setCommentary] = useState('');
  const [newBatsman, setNewBatsman] = useState('');
  const [battingTeam, setBattingTeam] = useState<'teamA' | 'teamB'>(match.battingFirst || 'teamA');
  const [submitting, setSubmitting] = useState(false);
  const [showWicketDrawer, setShowWicketDrawer] = useState(false);
  const [showOverModal, setShowOverModal] = useState(false);
  const [showKebab, setShowKebab] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [lastBalls, setLastBalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [localPlayerStats, setLocalPlayerStats] = useState<{ batting: PlayerStat[]; bowling: BowlingStat[] } | null>(null);
  const [localScore, setLocalScore] = useState<{ teamA: InningsScore; teamB: InningsScore } | null>(null);
  const [flashRun, setFlashRun] = useState<string | null>(null);
  const [commentaryLog, setCommentaryLog] = useState<string[]>([]);
  const [undoToastId, setUndoToastId] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const formKey = `bsc_form_${matchId}`;

  const activePlayerStats = localPlayerStats || match.playerStats;
  const activeScore = localScore || match.score;

  const safeBattingTeam = battingTeam || (match.currentInnings === 1 ? (match.battingFirst || 'teamA') : (match.battingFirst === 'teamA' ? 'teamB' : 'teamA'));
  const isFirstInnings = safeBattingTeam === match.battingFirst;
  const isTeamA = safeBattingTeam === 'teamA';
  const bowlingTeam = isTeamA ? 'teamB' : 'teamA';
  const score = activeScore?.[safeBattingTeam] || { runs: 0, wickets: 0, balls: 0, extras: 0, runRate: 0 };
  const otherScore = activeScore?.[bowlingTeam] || { runs: 0, wickets: 0, balls: 0, extras: 0, runRate: 0 };
  const battingSide = activePlayerStats?.batting?.filter(b => b.team === safeBattingTeam) || [];
  const bowlingSide = activePlayerStats?.bowling?.filter(b => b.team === bowlingTeam) || [];
  const strikerStats = battingSide.find(b => b.playerName === match.striker);
  const nonStrikerStats = battingSide.find(b => b.playerName === match.nonStriker);
  const currentBowlerStats = bowlingSide.find(b => b.playerName === match.currentBowler);
  const notOutBatsmen = battingSide.filter(b => !b.out);
  const currentPartnership = notOutBatsmen.length >= 2
    ? { runs: notOutBatsmen[0].runs + notOutBatsmen[1].runs, balls: notOutBatsmen[0].balls + notOutBatsmen[1].balls }
    : null;
  const target = otherScore.runs + 1;
  const totalBalls = 20 * 6;
  const ballsLeft = Math.max(totalBalls - score.balls, 0);
  const runsNeeded = Math.max(target - score.runs, 0);
  const reqRunRate = !isFirstInnings
    ? ((runsNeeded) / (Math.max(ballsLeft, 1) / 6)).toFixed(2)
    : '—';
  const projectedScore = score.balls > 0
    ? Math.floor((score.runs / score.balls) * totalBalls)
    : null;
  const battingTeamName = isTeamA ? match.teamA?.teamName : match.teamB?.teamName;
  const bowlingTeamName = isTeamA ? match.teamB?.teamName : match.teamA?.teamName;
  const battingLogo = isTeamA ? match.teamA?.teamLogo?.url : match.teamB?.teamLogo?.url;
  const bowlingLogo = isTeamA ? match.teamB?.teamLogo?.url : match.teamA?.teamLogo?.url;

  const currentXI = playingXI.find(p => p.team === safeBattingTeam);
  const batsmenList = (currentXI?.players || []).slice(0, 11);
  const dismissedFromEvents = (match.events || [])
    .filter((e: any) => e.wicket && e.batsman)
    .map((e: any) => e.batsman);
  const outBatterNames = new Set([
    ...(match.dismissedPlayers || []),
    ...battingSide.filter(b => b.out).map(b => b.playerName),
    ...dismissedFromEvents,
  ]);
  const availableBat = batsmenList.filter(p => !outBatterNames.has(p.playerName));

  const bowlingXI = playingXI.find(p => p.team === bowlingTeam);
  const bowlerList = (bowlingXI?.players || []).slice(0, 11);

  const d = (light: string, _dark: string) => light;

  const fetchPlayingXI = useCallback(async () => {
    try {
      const res = await api.get(`/matches/${matchId}/playingXI`);
      setPlayingXI(res.data.playingXI || []);
    } catch { /* ignore */ }
  }, [matchId]);

  useEffect(() => { fetchPlayingXI(); }, [fetchPlayingXI]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/matches/${matchId}/scoring-state`);
        if (res.data?.match) onUpdate();
      } catch {}
      setLoading(false);
    };
    load();
  }, [matchId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore form state from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(formKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setRuns(parsed.runs ?? 0);
        setExtrasType(parsed.extrasType ?? null);
        setExtrasRuns(parsed.extrasRuns ?? 0);
        setIsWicket(parsed.isWicket ?? false);
        setWicketType(parsed.wicketType ?? '');
        setFielder(parsed.fielder ?? '');
        setCommentary(parsed.commentary ?? '');
        setNewBatsman(parsed.newBatsman ?? '');
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save form state to sessionStorage
  useEffect(() => {
    const state = { runs, extrasType, extrasRuns, isWicket, wicketType, fielder, commentary, newBatsman };
    sessionStorage.setItem(formKey, JSON.stringify(state));
  }, [runs, extrasType, extrasRuns, isWicket, wicketType, fielder, commentary, newBatsman, formKey]);

  const refreshMatch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/matches/${matchId}/scoring-state`);
      if (res.data?.match) {
        const m = res.data.match;
        setOver(m.currentOverNumber ?? 0);
        setBall(m.legalBallsInOver ?? 0);
        setBattingTeam(m.currentInnings === 1 ? m.battingFirst : (m.battingFirst === 'teamA' ? 'teamB' : 'teamA'));
        if (m.playerStats) setLocalPlayerStats(m.playerStats);
        if (m.score) setLocalScore(m.score);
      }
      onUpdate();
    } catch {}
    setLoading(false);
  }, [matchId, onUpdate]);

  useEffect(() => {
    const hasAnyBalls = (match.events || []).length > 0;
    setOver(hasAnyBalls ? (match.currentOverNumber ?? 0) : 0);
    setBall(hasAnyBalls ? (match.legalBallsInOver ?? 0) : 0);
    setBattingTeam(match.currentInnings === 1 ? match.battingFirst : (match.battingFirst === 'teamA' ? 'teamB' : 'teamA'));
    if (match.playerStats) setLocalPlayerStats(match.playerStats);
    if (match.score) setLocalScore(match.score);
    const legal = (match.events || []).filter((e: any) =>
      !e.extras || (e.extras.type !== 'wide' && e.extras.type !== 'no_ball')
    ).slice(-6);
    setLastBalls(legal);
  }, [match.currentOverNumber, match.currentOver?.length, match.events?.length, match.battingFirst, match.currentInnings, match.playerStats, match.score]);

  const resetForm = useCallback(() => {
    setRuns(0); setExtrasType(null); setExtrasRuns(0);
    setIsWicket(false); setWicketType(''); setFielder(''); setCommentary(''); setNewBatsman('');
    sessionStorage.removeItem(formKey);
  }, [formKey]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!match.inningsStarted) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'w' || e.key === 'W') { e.preventDefault(); setShowWicketDrawer(true); return; }
      if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); return; }
      if (e.key in KEY_TO_RUN) { e.preventDefault(); setRuns(KEY_TO_RUN[e.key]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [match.inningsStarted, match.striker, match.currentBowler, runs, isWicket, wicketType, extrasType, extrasRuns, fielder, commentary, newBatsman, matchId, over, ball]);

  const autoCommentary = (r: number, isW: boolean, wType: string, bman: string, bwer: string, fder: string, exType: string | null) => {
    if (isW) return `${bman} ${wType?.replace(/_/g, ' ')} b ${bwer}${fder ? ` (c ${fder})` : ''}`;
    if (exType) { const label = exType.replace(/_/g, ' '); return r > 0 ? `${label}, ${r} run${r > 1 ? 's' : ''}` : label; }
    if (r === 0) return `No run, ${bwer} to ${bman}`;
    if (r === 4) return `FOUR! ${bman} drives through covers`;
    if (r === 6) return `SIX! ${bman} sends it over the ropes`;
    return `${r} run${r > 1 ? 's' : ''} to ${bman}`;
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    if (!match.striker || !match.currentBowler) {
      toast({ title: 'Missing players', description: 'Set striker and bowler before scoring', variant: 'destructive' });
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const desc = commentary || autoCommentary(runs, isWicket, wicketType, match.striker, match.currentBowler, fielder, extrasType);
      const payload: any = {
        runs, extraType: extrasType, extraRuns: extrasRuns,
        isWicket, wicketType: isWicket ? wicketType : undefined,
        fielder: fielder || undefined,
      };
      const res = await api.post(`/matches/${matchId}/score-ball`, payload);

      setFlashRun(isWicket ? 'W' : extrasType ? `${extrasRuns + runs}${extrasType === 'wide' ? 'wd' : extrasType === 'no_ball' ? 'nb' : ''}` : String(runs));
      setTimeout(() => setFlashRun(null), 600);

      const logLine = `Over ${over}.${ball} — ${desc}`;
      setCommentaryLog(prev => [logLine, ...prev].slice(0, 20));

      toast({ title: '✅ Ball recorded', description: logLine });
      resetForm();

      if (undoToastId) {
        // Dismiss old undo toast
      }
      const tid = `undo_${Date.now()}`;
      setUndoToastId(tid);
      setTimeout(async () => {
        setUndoToastId(null);
      }, 5000);

      if (res.data.overCompleted) setShowOverModal(true);
      await refreshMatch();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to record ball', variant: 'destructive' });
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const quickUndo = async () => {
    setUndoToastId(null);
    setUndoing(true);
    try {
      await api.delete(`/matches/${matchId}/score-undo`);
      toast({ title: '↩️ Undone', description: 'Last ball removed.' });
      setCommentaryLog(prev => prev.slice(1));
      await refreshMatch();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Undo failed', variant: 'destructive' });
    } finally { setUndoing(false); }
  };

  const handleUndo = async () => {
    setUndoing(true);
    try {
      await api.delete(`/matches/${matchId}/score-undo`);
      toast({ title: '↩️ Undone', description: 'Last ball removed and state recalculated.' });
      await refreshMatch();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Undo failed', variant: 'destructive' });
    } finally { setUndoing(false); }
  };

  const handleStartInnings = async () => {
    const striker = match.striker;
    const nonStriker = match.nonStriker;
    const bowler = match.currentBowler;
    if (!striker || !nonStriker || !bowler) {
      toast({ title: 'Missing players', description: 'Select striker, non-striker, and bowler first', variant: 'destructive' });
      return;
    }
    try {
      await api.post(`/matches/${matchId}/start-innings`, { striker, nonStriker, bowler });
      toast({ title: '▶️ Innings started' });
      await refreshMatch();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' });
    }
  };

  const handleEndInnings = async () => {
    setShowKebab(false);
    try {
      await api.post(`/matches/${matchId}/end-innings`);
      toast({ title: match.currentInnings === 1 ? '🔄 First innings ended, switch sides' : '🏁 Match completed' });
      await refreshMatch();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' });
    }
  };

  const handleFinishOver = async () => {
    setShowKebab(false);
    if (!match.legalBallsInOver || match.legalBallsInOver === 0) {
      toast({ title: 'No balls bowled', description: 'No balls in this over to finish', variant: 'destructive' });
      return;
    }
    try {
      await api.post(`/matches/${matchId}/finish-over`);
      toast({ title: '✅ Over finished', description: 'Strike swapped, ready for next over' });
      await refreshMatch();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' });
    }
  };

  const handleSetBatsman = async (role: string, name: string) => {
    try {
      await api.post(`/matches/${matchId}/set-batsman`, { role, playerName: name });
      await refreshMatch();
    } catch { /* ignore */ }
  };

  const handleSetBowler = async (name: string) => {
    try {
      await api.post(`/matches/${matchId}/set-bowler`, { bowler: name });
      await refreshMatch();
    } catch { /* ignore */ }
  };

  const handleSelectBowler = (name: string) => {
    handleSetBowler(name);
    setShowOverModal(false);
    toast({ title: `Bowler set: ${name}` });
  };

  // Close kebab on outside click
  useEffect(() => {
    if (!showKebab) return;
    const handler = () => setShowKebab(false);
    setTimeout(() => window.addEventListener('click', handler), 0);
    return () => window.removeEventListener('click', handler);
  }, [showKebab]);

  return (
    <div className="space-y-5">
      <style>{KEYFRAME_FLASH}</style>

      {/* Score Header */}
      <div className={`rounded-2xl shadow-xl overflow-hidden border ${d('border-slate-200', 'border-blue-900/50')} ${d('bg-white', 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900')}`}>
        <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500" />
        <div className="p-3 sm:p-5">
          {/* Responsive grid: Score | Batsmen | Target/Proj | Bowler */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {battingLogo && (
                  <img src={battingLogo} alt="" className="w-5 h-5 rounded-full object-cover" />
                )}
                <span className={`text-base font-bold uppercase tracking-wider truncate ${d('text-slate-700', 'text-blue-300')}`}>
                  {battingTeamName}
                </span>
                {match.result === 'live' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />}
              </div>
              <div className="flex items-baseline gap-2 sm:gap-3">
                <span className={`text-4xl sm:text-6xl font-black tracking-tight font-mono ${flashRun ? 'animate-ping' : ''} ${d('text-slate-900', 'text-white')}`}>
                  {score.runs}
                </span>
                <span className={`text-2xl sm:text-3xl font-bold font-mono ${d('text-slate-400', 'text-slate-400')}`}>/{score.wickets}</span>

              </div>
              <div className="mt-2 space-y-1">
                <div className={`text-sm sm:text-base font-semibold ${d('text-slate-600', 'text-slate-300')}`}>
                  Overs: <strong className={`text-base sm:text-lg ${d('text-slate-900', 'text-white')}`}>{Math.floor(score.balls / 6)}.{score.balls % 6}</strong>
                </div>
                <div className={`text-sm sm:text-base font-semibold ${d('text-slate-600', 'text-slate-300')}`}>
                  Extras: <strong className={`text-base sm:text-lg ${d('text-slate-900', 'text-white')}`}>{score.extras}</strong>
                </div>
              </div>
            </div>

            {/* Batsmen Card — centered, click to swap strike */}
            <div className={`rounded-xl border overflow-hidden ${d('bg-white border-slate-200', 'bg-gradient-to-b from-blue-900/30 to-blue-950/30 border-blue-800/40')}`}>
              <div className={`text-center text-[10px] uppercase tracking-wider font-semibold px-3 pt-2 pb-1 ${d('text-slate-500', 'text-blue-400/70')}`}>Batsmen</div>
              <div className="flex flex-col gap-1.5 px-4 py-2">
                <div className={`flex items-center justify-center gap-3 px-3 py-1.5 rounded-lg font-medium ${d('bg-emerald-50', 'bg-emerald-900/30')}`}>
                  <span className="text-lg">🏏</span>
                  <span className={`text-base font-bold truncate ${d('text-slate-800', 'text-cyan-200')}`}>{match.striker || '—'}</span>
                  <span className={`text-base font-bold ${d('text-slate-900', 'text-white')}`}>
                    {strikerStats?.runs ?? 0}<span className={`text-sm font-normal ml-0.5 ${d('text-slate-400', 'text-slate-500')}`}>({strikerStats?.balls ?? 0})</span>
                  </span>
                </div>
                <div className={`flex items-center justify-center gap-3 px-3 py-1.5 rounded-lg font-medium ${d('bg-slate-100', 'bg-slate-800/50')}`}>
                  <span className={`w-6 text-center text-base font-bold ${d('text-slate-400', 'text-slate-500')}`}>②</span>
                  <span className={`text-base font-bold truncate ${d('text-slate-800', 'text-cyan-200')}`}>{match.nonStriker || '—'}</span>
                  <span className={`text-base font-bold ${d('text-slate-900', 'text-white')}`}>
                    {nonStrikerStats?.runs ?? 0}<span className={`text-sm font-normal ml-0.5 ${d('text-slate-400', 'text-slate-500')}`}>({nonStrikerStats?.balls ?? 0})</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Projected Score — 1st innings */}
            {isFirstInnings && (
              <div className={`rounded-xl border overflow-hidden ${d('bg-white border-slate-200', 'bg-gradient-to-b from-blue-900/30 to-blue-950/30 border-blue-800/40')}`}>
                <div className={`text-center text-[10px] uppercase tracking-wider font-semibold px-3 pt-2 pb-1 ${d('text-slate-500', 'text-blue-400/70')}`}>Projected</div>
                <div className="flex flex-col items-center px-2 sm:px-4 py-1 sm:py-2 gap-0 sm:gap-1">
                  <span className={`text-2xl sm:text-4xl font-black tracking-tight font-mono ${d('text-slate-900', 'text-white')}`}>
                    {projectedScore ?? '—'}
                  </span>
                  <div className={`text-[10px] sm:text-xs font-semibold ${d('text-cyan-600', 'text-cyan-400')}`}>
                    CRR: <span className="text-sm sm:text-lg font-bold">{score.runRate?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Target/RRR Card — 2nd innings */}
            {!isFirstInnings && (
              <div className={`rounded-xl border overflow-hidden ${d('bg-white border-slate-200', 'bg-gradient-to-b from-blue-900/30 to-blue-950/30 border-blue-800/40')}`}>
                <div className={`text-center text-[10px] uppercase tracking-wider font-semibold px-2 sm:px-3 pt-2 pb-1 ${d('text-slate-500', 'text-blue-400/70')}`}>Target</div>
                <div className="flex flex-col items-center px-2 sm:px-4 py-1 sm:py-2 gap-0 sm:gap-1">
                  <span className={`text-2xl sm:text-4xl font-black tracking-tight font-mono ${d('text-slate-900', 'text-white')}`}>
                    {target}
                  </span>
                  <div className={`text-[10px] sm:text-xs font-semibold ${d('text-orange-600', 'text-orange-400')}`}>
                    RRR: <span className="text-sm sm:text-lg font-bold">{reqRunRate}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bowler Card — right corner */}
            <div className={`rounded-xl border overflow-hidden ${d('bg-white border-slate-200', 'bg-gradient-to-b from-blue-900/30 to-blue-950/30 border-blue-800/40')}`}>
              <div className="flex items-center justify-center gap-2 sm:gap-3 w-full px-2 sm:px-3 pt-2 pb-1">
                {[
                  { label: 'Runs', value: currentBowlerStats?.runs ?? 0, cls: d('text-slate-900', 'text-white') },
                  { label: 'Wkts', value: currentBowlerStats?.wickets ?? 0, cls: d('text-blue-600', 'text-cyan-400') },
                  { label: 'Overs', value: currentBowlerStats ? `${Math.floor(currentBowlerStats.balls / 6)}.${currentBowlerStats.balls % 6}` : '0.0', cls: `text-xs sm:text-sm ${d('text-slate-900', 'text-white')}` },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-center">
                    <span className={`text-[8px] sm:text-[10px] uppercase tracking-wider font-semibold ${d('text-slate-400', 'text-blue-400/70')}`}>{s.label}</span>
                    <span className={`text-base sm:text-xl font-black leading-none ${s.cls}`}>{s.value}</span>
                  </div>
                ))}
              </div>
              <div className={`w-full px-2 py-1 border-t text-center ${d('bg-slate-50 border-slate-200', 'bg-blue-900/30 border-blue-800/30')}`}>
                <span className={`font-bold text-lg ${d('text-slate-800', 'text-cyan-200')}`}> {match.currentBowler || '—'}</span>
              </div>
              {match.result === 'live' && match.currentOver?.length > 0 && (
                <div className="flex items-center gap-1 px-2 pb-2 pt-1 justify-center">
                  {match.currentOver.map((ev: any, i: number) => {
                    let pc = 'border-green-500 text-green-600 dark:border-green-400 dark:text-green-400';
                    if (ev.wicket) pc = 'border-red-500 text-red-600 dark:border-red-400 dark:text-red-400';
                    else if (ev.isSix) pc = 'border-purple-500 text-purple-600 dark:border-purple-400 dark:text-purple-400';
                    else if (ev.isFour || ev.runs === 4) pc = 'border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-400';
                    else if (ev.extras?.type === 'wide') pc = 'border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400';
                    else if (ev.extras?.type === 'no_ball') pc = 'border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400';
                    else if (ev.extras?.type === 'bye' || ev.extras?.type === 'leg_bye') pc = 'border-rose-400 text-rose-500 dark:border-rose-300 dark:text-rose-300';
                    else if (ev.runs >= 3) pc = 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400';
                    else if (ev.runs === 2) pc = 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400';
                    else if (ev.runs === 1) pc = 'border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-400';
                    else if (ev.runs > 0) pc = 'border-sky-500 text-sky-600';
                    return (
                      <span key={i}
                        className={`w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold border-2 bg-white dark:bg-gray-900 shadow-sm ${pc}`}
                      >{formatBallNotation(ev)}</span>
                    );
                  })}
                </div>
              )}
              {/* Undo below bowler */}
              <Button onClick={handleUndo} disabled={undoing || match.events?.length === 0} variant="outline"
                className={`w-full rounded-none border-x-0 border-b-0 h-8 text-[11px] font-semibold rounded-b-xl ${d('border-red-300 text-red-600 hover:bg-red-50', 'border-red-800 text-red-400 hover:bg-red-900/30')}`}>
                <RotateCcw className="h-3 w-3 mr-1" />
                {undoing ? 'Undoing...' : 'Undo Last Ball'}
              </Button>
            </div>
          </div>

          {/* Chase status — 2nd innings only */}
          {!isFirstInnings && (
            <div className={`mt-3 text-center text-sm font-semibold ${d('text-orange-700 bg-orange-50', 'text-orange-300 bg-orange-900/20')} rounded-lg py-2 px-4 border ${d('border-orange-200', 'border-orange-800/50')}`}>
              Need <span className="text-lg font-bold">{runsNeeded}</span> runs in <span className="text-lg font-bold">{ballsLeft}</span> balls
            </div>
          )}

          {/* Divider + Controls Row */}
          <div className="border-t border-blue-900/50 mt-4 pt-3" />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button size="sm" variant="ghost" onClick={refreshMatch} disabled={loading}
              className={`text-xs h-7 px-2 ${d('text-slate-400 hover:text-slate-700', 'text-slate-400 hover:text-white hover:bg-blue-900/50')}`}>
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" variant="outline" onClick={handleFinishOver}
              className={`text-xs h-7 px-2 ${d('border-amber-300 text-amber-700 hover:bg-amber-50', 'border-amber-700 text-amber-400 hover:bg-amber-900/30')}`}>
              <SkipForward className="w-3 h-3 mr-1" /> Finish Over
            </Button>
            <Button size="sm" onClick={handleEndInnings}
              className={`text-xs h-7 px-2 ${d('bg-red-600 hover:bg-red-700 text-white', 'bg-red-700 hover:bg-red-800 text-white')}`}>
              <Square className="w-3 h-3 mr-1" /> {match.currentInnings === 1 ? 'End 1st Innings' : 'End Match'}
            </Button>
            <div className="relative">
              <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setShowKebab(!showKebab); }}
                className={`text-xs h-7 px-1 ${d('text-slate-400 hover:text-slate-700', 'text-slate-400 hover:text-white hover:bg-blue-900/50')}`}>
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
                </div>
              </div>
              <button disabled
                className="w-full mt-2 min-h-[36px] sm:min-h-[40px] rounded-lg font-bold text-sm sm:text-base bg-indigo-600 text-white shadow-sm">
                Over {over}.{ball}
              </button>
            </div>
      </div>

      {/* Undo Toast Bar */}
      {undoToastId && (
        <div className={`flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-lg border gap-2 ${d('bg-amber-50 border-amber-200', 'bg-amber-900/30 border-amber-700/50')}`}>
          <span className={`text-xs sm:text-sm ${d('text-amber-800', 'text-amber-200')}`}>✅ Ball recorded</span>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <span className={`text-[10px] sm:text-xs ${d('text-amber-600', 'text-amber-400')}`}>Undo: 5s</span>
            <Button size="sm" onClick={quickUndo} disabled={undoing}
              className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg">
              <Undo2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> Undo
            </Button>
          </div>
        </div>
      )}

      {/* Setup Card */}
      {!match.inningsStarted && (
        <Card className={`border shadow-sm rounded-xl overflow-hidden ${d('border-blue-200/60', 'border-blue-900/50')} ${d('bg-white', 'bg-slate-900')}`}>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
          <CardContent className={`p-5 ${d('', 'text-white')}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`font-bold ${d('text-blue-900', 'text-blue-300')}`}>Innings {match.currentInnings} Setup</h3>
                <p className={`text-xs mt-0.5 ${d('text-blue-600/70', 'text-blue-400/70')}`}>
                  {match.currentInnings === 1 ? 'Select openers and first bowler, then click Start' : 'Select new openers and first bowler for 2nd innings'}
                </p>
              </div>
              <Button onClick={handleStartInnings} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm">
                <Play className="h-4 w-4 mr-1.5" /> Start Innings
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Striker *', value: match.striker, onChange: (v: string) => handleSetBatsman('striker', v), filter: (p: PlayingXIPlayer) => p.playerName !== match.nonStriker },
                { label: 'Non-Striker *', value: match.nonStriker, onChange: (v: string) => handleSetBatsman('nonStriker', v), filter: (p: PlayingXIPlayer) => p.playerName !== match.striker },
                { label: 'Opening Bowler *', value: match.currentBowler, onChange: (v: string) => handleSetBowler(v), filter: () => true, bowlers: true },
              ].map(f => (
                <div key={f.label}>
                  <label className={`text-xs font-medium ${d('text-blue-700', 'text-blue-300')}`}>{f.label}</label>
                  <select value={f.value} onChange={e => f.onChange(e.target.value)}
                    className="w-full mt-1 h-9 rounded-lg border-2 px-2 text-sm outline-none border-indigo-200 bg-white text-slate-900 focus:border-indigo-400">
                    <option value="">Select</option>
                    {(f.bowlers ? bowlerList : availableBat).filter(f.filter).map((p, i) => (
                      <option key={p.playerName} value={p.playerName}>{i + 1}. {p.playerName}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Scoring Grid */}
      {match.inningsStarted && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {/* Batsman Strip */}
              <Card className={`border shadow-sm rounded-xl overflow-hidden ${d('border-slate-200/80', 'border-slate-700/50')}`}>
                <CardContent className="p-3 bg-white">
                  <div className="flex items-center gap-3 justify-center flex-wrap">
                    {[match.striker, match.nonStriker].filter(Boolean).map((raw) => {
                      const name = typeof raw === 'string' ? raw : raw?.playerName || String(raw);
                      const isStriker = name === (typeof match.striker === 'string' ? match.striker : match.striker?.playerName);
                      const stats = battingSide.find(b => b.playerName === name);
                      return (
                        <button key={"bs-" + name} type="button"
                          onClick={async () => {
                            if (!isStriker) {
                              await handleSetBatsman('striker', name);
                              await handleSetBatsman('nonStriker', match.striker);
                            }
                          }}
                          className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all border-2 font-medium min-w-0 sm:min-w-[160px] ${
                            isStriker
                              ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30'
                              : `${d('bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700', 'bg-slate-700 text-slate-300 border-slate-500 hover:bg-slate-600')}`
                          }`}
                        >
                          <span className={`text-sm sm:text-lg ${isStriker ? '' : 'opacity-50'}`}>🏏</span>
                          <div className="text-left min-w-0">
                            <div className={`text-xs sm:text-sm font-bold truncate ${isStriker ? 'text-white' : 'text-slate-300'}`}>{name}</div>
                            <div className={`text-[10px] sm:text-[11px] ${isStriker ? 'text-emerald-200' : 'text-slate-400'}`}>
                              {stats ? `${stats.runs} runs (${stats.balls} balls)` : '0 runs (0 balls)'}
                            </div>
                          </div>
                          {!isStriker && <span className="text-[10px] text-slate-500 ml-auto">tap to bat</span>}
                          {isStriker && <span className="text-[10px] text-emerald-200 ml-auto">STRIKER</span>}
                        </button>
                      );
                    })}
                    {(!match.striker || !match.nonStriker) && (
                      <span className="text-xs text-slate-400">Waiting for batsmen...</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Run Buttons + Extras — compact row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 sm:gap-3">
                {/* Run Buttons */}
                <div className={`rounded-xl border overflow-hidden flex-1 ${d('border-slate-200/80 bg-white', 'border-slate-700/50 bg-slate-800/80')}`}>
                  <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5">
                    <span className={`text-xs font-semibold ${d('text-slate-600', 'text-slate-300')}`}>Runs</span>
                    <span className={`text-[10px] ${d('text-slate-400', 'text-slate-500')}`}>O {over}.{ball}</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 px-2 pb-2">
                    {QUICK_RUNS.map(r => (
                      <button key={r} type="button" onClick={() => setRuns(r)}
                        className={`min-h-[40px] sm:min-h-[44px] rounded-lg font-bold text-sm sm:text-base transition-all duration-150 active:scale-95
                          ${runs === r
                            ? r === 0 ? 'bg-slate-600 text-white ring-2 ring-slate-400'
                            : r === 4 ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                            : r === 6 ? 'bg-violet-600 text-white ring-2 ring-violet-300'
                            : 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                            : 'bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border-2 border-indigo-200 hover:border-indigo-400 shadow-sm'
                          }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extras */}
                <div className={`rounded-xl border overflow-hidden ${d('border-slate-200/80 bg-white', 'border-slate-700/50 bg-slate-800/80')}`}>
                  <div className={`text-xs font-semibold px-2 pt-1.5 pb-0.5 ${d('text-slate-600', 'text-slate-300')}`}>Extras</div>
                  <div className="grid grid-cols-5 gap-1 px-2 pb-1">
                    {[
                      { key: 'wide', label: 'Wd' },
                      { key: 'no_ball', label: 'Nb' },
                      { key: 'bye', label: 'Bye' },
                      { key: 'leg_bye', label: 'LBye' },
                      { key: 'penalty', label: 'Pen' },
                    ].map(ex => (
                      <button key={ex.key} type="button"
                        onClick={() => setExtrasType(extrasType === ex.key ? null : ex.key)}
                        className={`min-h-[40px] sm:min-h-[44px] rounded-lg text-xs sm:text-sm font-semibold transition-all
                          ${extrasType === ex.key
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                            : 'bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border-2 border-indigo-200 hover:border-indigo-400 shadow-sm'
                          }`}
                      >
                        {ex.label}
                      </button>
                    ))}
                  </div>
                  {extrasType && (
                    <div className={`flex items-center gap-1.5 px-3 pb-3 pt-1 ${d('', '')}`}>
                      <span className={`text-xs font-medium ${d('text-blue-700', 'text-blue-300')}`}>+R:</span>
                      <div className="flex gap-1 flex-wrap">
                        {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                          <button key={n} type="button" onClick={() => setExtrasRuns(n)}
                            className={`min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] rounded text-xs sm:text-sm font-bold transition-all
                              ${extrasRuns === n ? 'bg-blue-600 text-white' : `${d('bg-white border border-slate-300 text-slate-700 hover:bg-blue-100', 'bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600')}`}`}
                          >{n}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Wicket Button + Submit */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button type="button" onClick={() => setShowWicketDrawer(true)}
                  className={`min-h-[44px] rounded-xl font-bold text-sm sm:text-base transition-all w-full
                    ${isWicket ? 'bg-red-600 text-white ring-2 ring-red-300 shadow-lg'
                      : `${d('bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700 border border-slate-200', 'bg-slate-700 text-slate-200 hover:bg-red-900/30 hover:text-red-300 border border-slate-600')}`
                    }`}
                >
                  {isWicket ? `☝️ ${wicketType?.replace(/_/g, ' ') || 'Wicket'} selected [W]` : '☝️ Wicket [W]'}
                </button>
                <Button onClick={handleSubmit} disabled={submitting || !match.inningsStarted}
                  className="w-full h-11 text-sm sm:text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg rounded-xl">
                  <Send className="h-4 w-4 mr-1.5" />
                  {submitting ? 'Recording...' : `Record ${over}.${ball + 1}`}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Player Selectors — Compact Chips */}
              <Card className={`border shadow-sm rounded-xl overflow-hidden ${d('border-slate-200/80', 'border-slate-700/50')}`}>
                <div className="h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400" />
                <CardHeader className={`pb-2 ${d('bg-gradient-to-r from-slate-900 to-blue-950', 'bg-gradient-to-r from-slate-800 to-slate-900')}`}>
                  <CardTitle className={`text-xs font-bold uppercase tracking-wider ${d('text-blue-300', 'text-blue-300')}`}>Players</CardTitle>
                </CardHeader>
                <CardContent className={`space-y-2 pt-3 ${d('', 'bg-slate-800/80')}`}>
                  {[
                    { label: 'Striker', value: match.striker, onChange: (v: string) => handleSetBatsman('striker', v), filter: (p: PlayingXIPlayer) => p.playerName !== match.nonStriker },
                    { label: 'Non-Striker', value: match.nonStriker, onChange: (v: string) => handleSetBatsman('nonStriker', v), filter: (p: PlayingXIPlayer) => p.playerName !== match.striker },
                    { label: 'Bowler', value: match.currentBowler, onChange: (v: string) => handleSetBowler(v), filter: () => true, bowlers: true },
                  ].map(f => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className={`text-xs font-medium w-20 flex-shrink-0 ${d('text-slate-500', 'text-slate-400')}`}>{f.label}</span>
                      <select value={f.value} onChange={e => f.onChange(e.target.value)}
                        className={`flex-1 h-9 rounded-lg border-2 px-2 text-xs outline-none border-indigo-200 bg-white text-slate-900 focus:border-indigo-400`}>
                        <option value="">Select</option>
                        {(f.bowlers ? bowlerList : availableBat).filter(f.filter).map((p, i) => (
                          <option key={p.playerName} value={p.playerName}>{i + 1}. {p.playerName}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium w-20 flex-shrink-0 ${d('text-slate-500', 'text-slate-400')}`}>Fielder</span>
                    <select value={fielder} onChange={e => setFielder(e.target.value)}
                      className="flex-1 h-9 rounded-lg border-2 px-2 text-xs outline-none border-indigo-200 bg-white text-slate-900 focus:border-indigo-400">
                      <option value="">—</option>
                      {bowlerList.map((p, i) => (
                        <option key={p.playerName} value={p.playerName}>{i + 1}. {p.playerName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium w-20 flex-shrink-0 ${d('text-slate-500', 'text-slate-400')}`}>Comment</span>
                    <select value={commentary} onChange={e => setCommentary(e.target.value)}
                      className="flex-1 h-9 rounded-lg border-2 px-2 text-xs outline-none border-indigo-200 bg-white text-slate-900 focus:border-indigo-400">
                      <option value="">Auto</option>
                      <optgroup label="No Run">
                        <option value="Defended, no run">Defended, no run</option>
                        <option value="Played and missed">Played and missed</option>
                        <option value="Beaten, no run">Beaten, no run</option>
                        <option value="Blocked back to the bowler">Blocked back to the bowler</option>
                        <option value="Left alone outside off">Left alone outside off</option>
                      </optgroup>
                      <optgroup label="1 Run">
                        <option value="Pushed for a single">Pushed for a single</option>
                        <option value="Tucked for a single">Tucked for a single</option>
                        <option value="Driven for a single">Driven for a single</option>
                        <option value="Flicked for a single">Flicked for a single</option>
                        <option value="Nudged for a single">Nudged for a single</option>
                        <option value="Dabbed to third man for a single">Dabbed to third man for a single</option>
                        <option value="Bunted to long-off for a single">Bunted to long-off for a single</option>
                      </optgroup>
                      <optgroup label="2 Runs">
                        <option value="Pushed into the gap for two">Pushed into the gap for two</option>
                        <option value="Worked through midwicket for two">Worked through midwicket for two</option>
                        <option value="Driven through the covers for two">Driven through the covers for two</option>
                        <option value="Turned behind square for two">Turned behind square for two</option>
                      </optgroup>
                      <optgroup label="3 Runs">
                        <option value="Driven through the gap for three">Driven through the gap for three</option>
                        <option value="Punched past the bowler for three">Punched past the bowler for three</option>
                      </optgroup>
                      <optgroup label="Boundary (4)">
                        <option value="Driven through covers for FOUR">Driven through covers for FOUR</option>
                        <option value="Cut through point for FOUR">Cut through point for FOUR</option>
                        <option value="Swept fine for FOUR">Swept fine for FOUR</option>
                        <option value="Pulled to midwicket for FOUR">Pulled to midwicket for FOUR</option>
                        <option value="Driven straight down the ground for FOUR">Driven straight down the ground for FOUR</option>
                        <option value="Slashed to third man for FOUR">Slashed to third man for FOUR</option>
                        <option value="Glanced fine down the leg side for FOUR">Glanced fine down the leg side for FOUR</option>
                      </optgroup>
                      <optgroup label="Six (6)">
                        <option value="Launched over long-on for SIX">Launched over long-on for SIX</option>
                        <option value="Smashed over deep midwicket for SIX">Smashed over deep midwicket for SIX</option>
                        <option value="Swung over the ropes for SIX">Swung over the ropes for SIX</option>
                        <option value="Deposited over the ropes for SIX">Deposited over the ropes for SIX</option>
                        <option value="Carted over long-on for SIX">Carted over long-on for SIX</option>
                        <option value="Hit straight back over the bowler for SIX">Hit straight back over the bowler for SIX</option>
                      </optgroup>
                    </select>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Wicket Drawer (centered modal) */}
          {showWicketDrawer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowWicketDrawer(false)}>
              <div className={`rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden ${d('bg-white', 'bg-slate-900')}`}
                onClick={e => e.stopPropagation()}>
                <div className={`flex items-center justify-between px-5 py-4 border-b ${d('border-slate-200', 'border-slate-700')}`}>
                  <h3 className={`text-lg font-bold ${d('text-slate-900', 'text-white')}`}>☝️ Select Dismissal</h3>
                  <button onClick={() => setShowWicketDrawer(false)}
                    className={`p-1.5 rounded-lg ${d('hover:bg-slate-100 text-slate-500', 'hover:bg-slate-800 text-slate-400')}`}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {WICKET_TYPES.map(w => (
                      <button key={w.value} type="button" onClick={() => { setWicketType(w.value); setIsWicket(true); }}
                        className={`min-h-[64px] rounded-xl text-sm font-semibold transition-all border
                          ${wicketType === w.value ? 'bg-red-600 text-white border-red-600 shadow-lg ring-2 ring-red-300' : `${d('bg-slate-50 text-slate-700 border-slate-200 hover:bg-red-50 hover:border-red-300', 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-red-900/30 hover:border-red-700')}`}`}
                      >
                        <span className="text-lg block mb-1">{w.icon}</span>
                        {w.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => { setShowWicketDrawer(false); setIsWicket(false); setWicketType(''); setNewBatsman(''); }}
                      className={`flex-1 rounded-xl ${d('', 'border-slate-600 text-slate-300')}`}>Cancel</Button>
                    <Button onClick={async () => {
                        if (!isWicket) return;
                        try { await handleSubmit(); } catch {}
                        setShowWicketDrawer(false);
                      }} disabled={!isWicket}
                      className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl">
                      {isWicket ? 'Submit Wicket' : 'Select Type'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Over Completed Modal */}
          {showOverModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowOverModal(false)}>
              <div className={`rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4 ${d('bg-white', 'bg-slate-900')}`} onClick={e => e.stopPropagation()}>
                <h3 className={`text-lg font-bold mb-2 ${d('text-slate-900', 'text-white')}`}>Over {over} Complete!</h3>
                <div className="flex gap-1.5 mb-4 justify-center">
                  {match.currentOver?.map((ev: any, i: number) => {
                    let pc = 'border-green-500 text-green-600 dark:border-green-400 dark:text-green-400';
                    if (ev.wicket) pc = 'border-red-500 text-red-600 dark:border-red-400 dark:text-red-400';
                    else if (ev.isSix) pc = 'border-purple-500 text-purple-600 dark:border-purple-400 dark:text-purple-400';
                    else if (ev.isFour || ev.runs === 4) pc = 'border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-400';
                    else if (ev.extras?.type === 'wide') pc = 'border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400';
                    else if (ev.extras?.type === 'no_ball') pc = 'border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400';
                    else if (ev.extras?.type === 'bye' || ev.extras?.type === 'leg_bye') pc = 'border-rose-400 text-rose-500 dark:border-rose-300 dark:text-rose-300';
                    else if (ev.runs >= 3) pc = 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400';
                    else if (ev.runs === 2) pc = 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400';
                    else if (ev.runs === 1) pc = 'border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-400';
                    return (
                      <span key={i}
                        className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold border-2 bg-white dark:bg-gray-900 shadow-sm ${pc}`}
                      >{formatBallNotation(ev)}</span>
                    );
                  })}
                </div>
                <p className={`text-sm mb-3 ${d('text-slate-600', 'text-slate-300')}`}>Select next bowler for over {over + 1}:</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {bowlerList.filter(p => p.playerName !== match.currentBowler).map((p, i) => (
                    <button key={p.playerName} onClick={() => handleSelectBowler(p.playerName)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${d('hover:bg-blue-50 border-slate-200', 'hover:bg-slate-800 border-slate-700 text-slate-200')}`}>
                      {i + 1}. {p.playerName}
                    </button>
                  ))}
                </div>
                <Button variant="outline" onClick={() => setShowOverModal(false)}
                  className={`mt-3 w-full rounded-xl ${d('', 'border-slate-600 text-slate-300')}`}>Close</Button>
              </div>
            </div>
          )}

          {/* Commentary Feed */}
          {commentaryLog.length > 0 && (
            <div className={`rounded-xl border shadow-sm overflow-hidden ${d('border-slate-200/80 bg-white', 'border-slate-700/50 bg-slate-800/80')}`}>
              <div className={`px-4 py-2 border-b text-xs font-bold uppercase tracking-wider ${d('bg-gradient-to-r from-slate-100 to-slate-50 border-slate-200 text-slate-500', 'bg-slate-800 border-slate-700 text-slate-400')}`}>
                Commentary Feed
              </div>
              <div className="max-h-24 overflow-y-auto p-2 space-y-0.5">
                {commentaryLog.map((line, i) => (
                  <div key={i} className={`text-[11px] py-0.5 px-2 rounded ${i === 0 ? `${d('bg-blue-50 text-blue-700 font-semibold', 'bg-blue-900/30 text-blue-300')}` : `${d('text-slate-500', 'text-slate-400')}`}`}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Innings Cards — Last 3 Overs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {((firstInnTeam: string, secondInnTeam: string) => {
              const allEv = match.events || [];
              const buildInnings = (team: string, label: string) => {
                const evs = allEv.filter(e => e.battingTeam === team);
                const overMap: Record<number, any[]> = {};
                evs.forEach(e => { const ov = e.over ?? 0; if (!overMap[ov]) overMap[ov] = []; overMap[ov].push(e); });
                const overNums = Object.keys(overMap).map(Number).sort((a, b) => a - b).slice(-3);
                const s = activeScore?.[team] || { runs: 0, wickets: 0, balls: 0 };
                const teamName = team === 'teamA' ? match.teamA?.teamName : match.teamB?.teamName;
                return { team, label, evs, overMap, overNums, score: s, teamName };
              };
              const inns1 = buildInnings(firstInnTeam, '1st Innings');
              const inns2 = allEv.some(e => e.battingTeam !== firstInnTeam) ? buildInnings(secondInnTeam, '2nd Innings') : null;
              return [inns1, inns2].filter(Boolean).map(inn => {
                if (!inn) return null;
                return (
                  <Card key={inn.label} className={`border shadow-sm rounded-xl overflow-hidden ${d('border-slate-200/80', 'border-slate-700/50')}`}>
                    <CardHeader className={`pb-1.5 ${d('bg-gradient-to-r from-slate-900 to-blue-950', 'bg-gradient-to-r from-slate-800 to-slate-900')}`}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-bold text-blue-300 uppercase tracking-wider">{inn.label}</CardTitle>
                        <span className="text-sm font-bold text-white">
                          {inn.score.runs}/{inn.score.wickets}
                          <span className="text-blue-300 text-[10px] ml-1.5 font-normal">
                            ({Math.floor(inn.score.balls / 6)}.{inn.score.balls % 6})
                          </span>
                        </span>
                      </div>
                      <div className="text-[9px] text-blue-400/70 mt-0.5">{inn.teamName}</div>
                    </CardHeader>
                    <CardContent className={`pb-3 pt-2.5 ${d('', 'bg-slate-800/80')}`}>
                      {inn.overNums.length === 0 ? (
                        <span className={`text-xs ${d('text-slate-400', 'text-slate-500')}`}>No overs yet</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {inn.overNums.map(ov => {
                            const balls = inn.overMap[ov];
                            const bowler = balls[0]?.bowler || '';
                            const runs = balls.reduce((s: number, e: any) => s + (e.runs || 0) + (e.extras?.runs || 0), 0);
                            return (
                              <div key={ov} className={`border rounded-lg p-2 min-w-[110px] flex-1 ${d('border-slate-200 bg-white', 'border-slate-600 bg-slate-800')}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-[10px] font-bold ${d('text-slate-600', 'text-slate-300')}`}>Over {ov}</span>
                                  <span className={`text-[10px] font-semibold ${d('text-blue-700', 'text-blue-400')}`}>{runs} runs</span>
                                </div>
                                <div className={`text-[8px] truncate mb-1.5 ${d('text-slate-400', 'text-slate-500')}`}>{bowler}</div>
                                <div className="flex gap-0.5 flex-wrap">
                                  {balls.map((ev: any, i: number) => {
                                    let pc = 'border-green-500 text-green-600';
                                    if (ev.wicket) pc = 'border-red-500 text-red-600';
                                    else if (ev.isSix) pc = 'border-purple-500 text-purple-600';
                                    else if (ev.isFour) pc = 'border-blue-600 text-blue-700';
                                    else if (ev.extras?.type === 'wide') pc = 'border-amber-500 text-amber-600';
                                    else if (ev.extras?.type === 'no_ball') pc = 'border-orange-500 text-orange-600';
                                    else if (ev.runs >= 2) pc = 'border-sky-500 text-sky-600';
                                    else if (ev.runs === 1) pc = 'border-sky-500 text-sky-600';
                                    return (
                                      <span key={i}
                                        className={`w-[18px] h-[18px] rounded-[2px] flex items-center justify-center text-[7px] font-bold border bg-white dark:bg-gray-900 ${pc}`}
                                        title={`${ev.bowler} to ${ev.batsman}: ${ev.runs} run${ev.runs !== 1 ? 's' : ''}${ev.wicket ? ' WICKET!' : ''}`}
                                      >{formatBallNotation(ev)}</span>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              });
            })(match.battingFirst === 'teamA' ? 'teamA' : 'teamB', match.battingFirst === 'teamA' ? 'teamB' : 'teamA')}
          </div>

          {/* Batting & Bowling Scorecards — side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className={`border shadow-md rounded-xl overflow-hidden ${d('border-slate-200/80', 'border-slate-700/50')}`}>
              <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
              <CardHeader className={`pb-1 border-b ${d('border-blue-100 bg-gradient-to-r from-slate-900 to-blue-950', 'border-blue-900 bg-gradient-to-r from-slate-800 to-slate-900')}`}>
                <div className="flex items-center gap-2">
                  {battingLogo && <img src={battingLogo} alt="" className="w-4 h-4 rounded-full object-cover" />}
                  <CardTitle className="text-sm font-bold text-blue-300 uppercase tracking-wider">
                    Batting — {battingTeamName}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-left text-xs text-white font-bold uppercase">
                        <th className="p-3">Batter</th><th className="p-3 text-center">R</th>
                        <th className="p-3 text-center">B</th><th className="p-3 text-center">4s</th>
                        <th className="p-3 text-center">6s</th><th className="p-3 text-center">SR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {battingSide.map((p, i) => (
                        <tr key={i} className={`border-b transition-colors ${d('border-slate-100 hover:bg-blue-50/50', 'border-slate-800 hover:bg-blue-900/20')}`}>
                          <td className={`p-3 font-medium whitespace-nowrap ${d('', 'text-slate-200')}`}>
                            {p.playerName}
                            {p.out
                              ? <span className="text-red-500 text-xs ml-1">† {p.dismissalType} b {p.bowledBy}</span>
                              : <span className="text-emerald-600 ml-1 text-xs font-bold">*</span>}
                          </td>
                          <td className={`p-3 text-center font-bold text-lg font-mono ${d('', 'text-white')}`}>{p.runs}</td>
                          <td className={`p-3 text-center ${d('', 'text-slate-300')}`}>{p.balls}</td>
                          <td className={`p-3 text-center ${d('', 'text-slate-300')}`}>{p.fours}</td>
                          <td className={`p-3 text-center ${d('', 'text-slate-300')}`}>{p.sixes}</td>
                          <td className={`p-3 text-center font-semibold ${d('', 'text-slate-300')}`}>{p.strikeRate?.toFixed(1)}</td>
                        </tr>
                      ))}
                      {battingSide.length === 0 && (
                        <tr><td colSpan={6} className={`p-6 text-center text-sm ${d('text-slate-400', 'text-slate-500')}`}>Waiting for batsmen...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className={`border shadow-md rounded-xl overflow-hidden ${d('border-slate-200/80', 'border-slate-700/50')}`}>
              <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
              <CardHeader className={`pb-1 border-b ${d('border-blue-100 bg-gradient-to-r from-slate-900 to-blue-950', 'border-blue-900 bg-gradient-to-r from-slate-800 to-slate-900')}`}>
                <div className="flex items-center gap-2">
                  {bowlingLogo && <img src={bowlingLogo} alt="" className="w-4 h-4 rounded-full object-cover" />}
                  <CardTitle className="text-sm font-bold text-blue-300 uppercase tracking-wider">
                    Bowling — {bowlingTeamName}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-left text-xs text-white font-bold uppercase">
                        <th className="p-3">Bowler</th><th className="p-3 text-center">O</th>
                        <th className="p-3 text-center">M</th><th className="p-3 text-center">R</th>
                        <th className="p-3 text-center">W</th><th className="p-3 text-center">Econ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bowlingSide.map((p, i) => (
                        <tr key={i} className={`border-b transition-colors ${d('border-slate-100 hover:bg-blue-50/50', 'border-slate-800 hover:bg-blue-900/20')}`}>
                          <td className={`p-3 font-medium whitespace-nowrap ${d('', 'text-slate-200')}`}>{p.playerName}</td>
                          <td className={`p-3 text-center ${d('', 'text-slate-300')}`}>{Math.floor(p.balls / 6)}.{p.balls % 6}</td>
                          <td className={`p-3 text-center ${d('', 'text-slate-300')}`}>0</td>
                          <td className={`p-3 text-center font-bold text-lg font-mono ${d('', 'text-white')}`}>{p.runs}</td>
                          <td className={`p-3 text-center font-bold text-lg font-mono ${d('', 'text-white')}`}>{p.wickets}</td>
                          <td className={`p-3 text-center font-semibold ${d('', 'text-slate-300')}`}>{p.economy?.toFixed(2)}</td>
                        </tr>
                      ))}
                      {bowlingSide.length === 0 && (
                        <tr><td colSpan={6} className={`p-6 text-center text-sm ${d('text-slate-400', 'text-slate-500')}`}>Waiting for bowlers...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Overs */}
          {(() => {
            const allEvents = match.events || [];
            const overMap: Record<number, any[]> = {};
            allEvents.forEach((ev: any) => {
              const ov = ev.over ?? 0;
              if (!overMap[ov]) overMap[ov] = [];
              overMap[ov].push(ev);
            });
            const overNumbers = Object.keys(overMap).map(Number).sort((a, b) => a - b);
            if (overNumbers.length === 0 && (!match.currentOver || match.currentOver.length === 0)) return null;
            return (
              <Card className={`border shadow-sm rounded-xl overflow-hidden ${d('border-slate-200/80', 'border-slate-700/50')}`}>
                <CardHeader className={`pb-1 ${d('bg-gradient-to-r from-slate-900 to-blue-950', 'bg-gradient-to-r from-slate-800 to-slate-900')}`}>
                  <CardTitle className="text-xs font-bold text-blue-300 uppercase tracking-wider">All Overs</CardTitle>
                </CardHeader>
                <CardContent className={`pb-3 pt-3 ${d('', 'bg-slate-800/80')}`}>
                  <div className="flex flex-wrap gap-3">
                    {overNumbers.map(ov => {
                      const evs = overMap[ov];
                      const isCurrent = ov === match.currentOverNumber;
                      return (
                        <div key={ov} className={`border rounded-xl p-2.5 min-w-[100px] flex-shrink-0 ${
                          isCurrent ? `${d('border-blue-400 bg-blue-50/80', 'border-blue-600 bg-blue-900/30')} shadow-md` : `${d('border-slate-200 bg-white', 'border-slate-600 bg-slate-800')}`
                        }`}>
                          <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 text-center ${isCurrent ? 'text-blue-600' : d('text-slate-500', 'text-slate-400')}`}>
                            Over {ov}
                            {isCurrent && <span className="ml-1 text-blue-500">◀</span>}
                          </div>
                          <div className="flex gap-1 justify-center flex-wrap max-w-[120px]">
                            {evs.map((ev: any, i: number) => (
                              <span key={i}
                                className={`w-5 h-5 rounded-[3px] flex items-center justify-center text-[7px] font-bold border
                                  ${ev.wicket ? 'border-red-500 text-red-600' : ev.isSix ? 'border-purple-500 text-purple-600' : ev.isFour ? 'border-blue-600 text-blue-700' : (ev.runs || 0) === 0 ? 'border-green-500 text-green-600' : 'border-sky-500 text-sky-600'} bg-white dark:bg-gray-900`}
                                title={`${ev.bowler} to ${ev.batsman}: ${ev.runs} run${ev.runs !== 1 ? 's' : ''}${ev.wicket ? ' WICKET!' : ''}`}
                              >{formatBallNotation(ev)}</span>
                            ))}
                          </div>
                          <div className={`text-[9px] text-center mt-1.5 ${d('text-slate-400', 'text-slate-500')}`}>
                            {evs.reduce((s: number, e: any) => s + (e.runs || 0) + (e.extras?.runs || 0), 0)} runs
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Fall of Wickets */}
          <Card className={`border shadow-sm rounded-xl overflow-hidden ${d('border-slate-200/80', 'border-slate-700/50')}`}>
            <CardHeader className={`pb-1 ${d('bg-gradient-to-r from-slate-900 to-blue-950', 'bg-gradient-to-r from-slate-800 to-slate-900')}`}>
              <CardTitle className="text-xs font-bold text-blue-300 uppercase tracking-wider">Fall of Wickets</CardTitle>
            </CardHeader>
            <CardContent className={`pb-3 pt-3 ${d('', 'bg-slate-800/80')}`}>
              {(() => {
                const fow = (match.events || []).filter((e: any) => e.wicket && e.battingTeam === battingTeam);
                if (fow.length === 0) return <span className={`text-xs ${d('text-slate-400', 'text-slate-500')}`}>No wickets yet</span>;
                return (
                  <div className="flex flex-wrap gap-2">
                    {fow.map((ev: any, i: number) => (
                      <Badge key={i} className={`text-xs font-semibold ${d('bg-red-50 text-red-700 border-red-200', 'bg-red-900/40 text-red-300 border-red-800')}`}>
                        {i + 1}-{(() => {
                          const runsAtWicket = match.events
                            .filter((e: any) => e.battingTeam === battingTeam && e.over <= ev.over)
                            .reduce((s: number, e: any) => s + e.runs + (e.extras?.runs || 0), 0);
                          return runsAtWicket;
                        })()} ({ev.batsman}) {ev.over}.{ev.ball}
                      </Badge>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
