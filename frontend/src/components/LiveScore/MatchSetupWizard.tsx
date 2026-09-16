import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Users, Coins, Check, X, Search, Play, ShieldCheck, ArrowLeft, Trophy } from 'lucide-react';
import api from '@/lib/api';

interface TeamInfo { _id: string; teamName: string; teamCode: string; teamLogo?: { url?: string } | string; captainName?: string; }
export interface Player { playerId: string; playerName: string; role: string; isCaptain: boolean; isKeeper: boolean; battingOrder: number; }
interface PlayingXI { _id: string; matchId: string; team: string; players: Player[]; }

interface Props {
  matchId: string;
  match: any;
  onComplete: () => void;
}

export default function MatchSetupWizard({ matchId, match, onComplete }: Props) {
  const [step, setStep] = useState<'xi' | 'toss'>('xi');
  const [loading, setLoading] = useState(false);

  const [rosterA, setRosterA] = useState<Player[]>([]);
  const [rosterB, setRosterB] = useState<Player[]>([]);
  const [xiA, setXiA] = useState<Player[]>([]);
  const [xiB, setXiB] = useState<Player[]>([]);

  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');

  const [tossWinner, setTossWinner] = useState<'teamA' | 'teamB' | ''>('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl' | ''>('');

  const teamA = (match?.teamA || {}) as TeamInfo;
  const teamB = (match?.teamB || {}) as TeamInfo;

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        const [xiRes, teamARes, teamBRes] = await Promise.all([
          api.get(`/matches/${matchId}/playingXI`),
          api.get(`/teams/${teamA._id}`),
          api.get(`/teams/${teamB._id}`),
        ]);

        const existingA = (xiRes.data?.playingXI || []).find((x: PlayingXI) => x.team === 'teamA');
        const existingB = (xiRes.data?.playingXI || []).find((x: PlayingXI) => x.team === 'teamB');

        const captainA = teamARes.data?.captainName || teamARes.data?.data?.captainName || '';
        const captainB = teamBRes.data?.captainName || teamBRes.data?.data?.captainName || '';

        const normalizeRole = (raw: string): 'batsman' | 'bowler' | 'all-rounder' | 'wk' => {
          const r = (raw || '').toLowerCase();
          if (r.includes('wk') || r.includes('keeper') || r.includes('wicket')) return 'wk';
          if (r.includes('all')) return 'all-rounder';
          if (r.includes('bowl')) return 'bowler';
          return 'batsman';
        };

        const extractPlayers = (teamData: any, teamCaptain: string): Player[] => {
          const raw = teamData?.players || teamData?.data?.players || [];
          if (!Array.isArray(raw)) return [];
          return raw.map((p: any) => {
            const name = p.name || p.user?.name || p.playerName || '';
            return {
              playerId: p.user?._id || p._id || '',
              playerName: name,
              role: normalizeRole(p.position || p.role || ''),
              isCaptain: name === teamCaptain,
              isKeeper: false,
              battingOrder: 0,
            };
          }).filter((p: Player) => p.playerName);
        };

        const fullA = extractPlayers(teamARes.data, captainA);
        const fullB = extractPlayers(teamBRes.data, captainB);

        setRosterA(fullA);
        setRosterB(fullB);

        if (existingA?.players?.length >= 11) {
          setXiA(existingA.players);
        } else {
          setXiA(fullA.filter(p => p.isCaptain));
        }
        if (existingB?.players?.length >= 11) {
          setXiB(existingB.players);
        } else {
          setXiB(fullB.filter(p => p.isCaptain));
        }
      } catch (err) {
        console.error('Failed to load players:', err);
      } finally { setLoading(false); }
    };
    if (matchId && teamA._id && teamB._id) fetchPlayers();
  }, [matchId, teamA._id, teamB._id]);

  const toggleXiPlayer = (team: 'teamA' | 'teamB', player: Player) => {
    if (team === 'teamA') {
      setXiA(prev => {
        const found = prev.find(p => p.playerName === player.playerName);
        if (found) return prev.filter(p => p.playerName !== player.playerName);
        return [...prev, { ...player, battingOrder: prev.length + 1 }];
      });
    } else {
      setXiB(prev => {
        const found = prev.find(p => p.playerName === player.playerName);
        if (found) return prev.filter(p => p.playerName !== player.playerName);
        return [...prev, { ...player, battingOrder: prev.length + 1 }];
      });
    }
  };

  const isSelected = (team: 'teamA' | 'teamB', name: string) => {
    return (team === 'teamA' ? xiA : xiB).some(p => p.playerName === name);
  };

  const setCaptain = (team: 'teamA' | 'teamB', name: string) => {
    const setter = team === 'teamA' ? setXiA : setXiB;
    setter(prev => prev.map(p => ({ ...p, isCaptain: p.playerName === name })));
  };

  const setKeeper = (team: 'teamA' | 'teamB', name: string) => {
    const setter = team === 'teamA' ? setXiA : setXiB;
    setter(prev => prev.map(p => ({ ...p, isKeeper: p.playerName === name })));
  };

  const savePlayingXI = async () => {
    if (xiA.length !== 11 || xiB.length !== 11) {
      toast({ title: 'Select exactly 11 players per team', variant: 'destructive' });
      return;
    }
    if (!xiA.some(p => p.isCaptain) || !xiB.some(p => p.isCaptain)) {
      toast({ title: 'Each team needs a captain', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await Promise.all([
        api.post(`/matches/${matchId}/playingXI`, { team: 'teamA', players: xiA }),
        api.post(`/matches/${matchId}/playingXI`, { team: 'teamB', players: xiB }),
      ]);
      toast({ title: 'Playing XI saved' });
      setStep('toss');
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const doToss = async () => {
    if (!tossWinner || !tossDecision) {
      toast({ title: 'Select both toss winner and decision', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.post(`/matches/${matchId}/toss`, { tossWinner, tossDecision });
      await api.patch(`/matches/${matchId}`, { result: 'live' });
      toast({ title: 'Match Started!', description: 'Toss done, scoring ready' });
      onComplete();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const xiCountA = xiA.length;
  const xiCountB = xiB.length;
  const readyA = xiCountA === 11 && xiA.some(p => p.isCaptain);
  const readyB = xiCountB === 11 && xiB.some(p => p.isCaptain);

  if (step === 'xi') {
    return (
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Playing XI Selection</h3>
              <p className="text-sm text-gray-500">Tap players to add/remove. Captain auto-selected from team data.</p>
            </div>
            <Badge className="ml-auto bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1">Step 1/2</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TeamPanel
            teamKey="teamA"
            label={teamA.teamName || 'Team A'}
            roster={rosterA}
            xi={xiA}
            search={searchA}
            onSearch={setSearchA}
            onToggle={toggleXiPlayer}
            onSetCaptain={setCaptain}
            onSetKeeper={setKeeper}
            isSelected={isSelected}
            color="indigo"
          />
          <TeamPanel
            teamKey="teamB"
            label={teamB.teamName || 'Team B'}
            roster={rosterB}
            xi={xiB}
            search={searchB}
            onSearch={setSearchB}
            onToggle={toggleXiPlayer}
            onSetCaptain={setCaptain}
            onSetKeeper={setKeeper}
            isSelected={isSelected}
            color="emerald"
          />
        </div>

        <Button
          onClick={savePlayingXI}
          disabled={loading || !readyA || !readyB}
          className="w-full h-13 text-base font-bold rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none transition-all"
        >
          {loading ? 'Saving...' : `Save XI & Continue to Toss`}
        </Button>
      </div>
    );
  }

  if (step === 'toss') {
    const winnerName = tossWinner === 'teamA' ? teamA.teamName : teamB.teamName;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
            <Coins className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Match Toss</h3>
            <p className="text-sm text-gray-500">Who won the toss and what did they choose?</p>
          </div>
          <Badge className="ml-auto bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1">Step 2/2</Badge>
        </div>

        <p className="text-sm font-semibold text-gray-600">Toss Winner</p>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setTossWinner('teamA')}
            className={`p-5 rounded-2xl border-2 text-center transition-all duration-200 ${tossWinner === 'teamA'
              ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg shadow-indigo-100 scale-[1.02]'
              : 'border-gray-200 bg-white hover:border-indigo-200 hover:shadow-md'}`}>
            <div className="text-3xl mb-2">🏏</div>
            <h4 className="font-bold text-base">{teamA.teamName}</h4>
            <p className="text-xs text-gray-500 mt-0.5">Toss Winner</p>
            {tossWinner === 'teamA' && <Badge className="mt-2 bg-indigo-600 text-white">Selected</Badge>}
          </button>

          <button type="button" onClick={() => setTossWinner('teamB')}
            className={`p-5 rounded-2xl border-2 text-center transition-all duration-200 ${tossWinner === 'teamB'
              ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg shadow-emerald-100 scale-[1.02]'
              : 'border-gray-200 bg-white hover:border-emerald-200 hover:shadow-md'}`}>
            <div className="text-3xl mb-2">🏏</div>
            <h4 className="font-bold text-base">{teamB.teamName}</h4>
            <p className="text-xs text-gray-500 mt-0.5">Toss Winner</p>
            {tossWinner === 'teamB' && <Badge className="mt-2 bg-emerald-600 text-white">Selected</Badge>}
          </button>
        </div>

        {tossWinner && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-600">{winnerName} chose to:</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setTossDecision('bat')}
                className={`p-5 rounded-2xl border-2 text-center transition-all duration-200 ${tossDecision === 'bat'
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-100 scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-green-200 hover:shadow-md'}`}>
                <div className="text-3xl mb-1">🏏</div>
                <span className="font-bold text-base text-green-800">Bat First</span>
              </button>
              <button type="button" onClick={() => setTossDecision('bowl')}
                className={`p-5 rounded-2xl border-2 text-center transition-all duration-200 ${tossDecision === 'bowl'
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-sky-50 shadow-lg shadow-blue-100 scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-md'}`}>
                <div className="text-3xl mb-1">⚾</div>
                <span className="font-bold text-base text-blue-800">Bowl First</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('xi')}
            className="flex-1 h-12 text-base font-bold rounded-xl border-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button onClick={doToss} disabled={loading || !tossWinner || !tossDecision}
            className="flex-[2] h-12 text-base font-bold rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-200 disabled:opacity-50 disabled:shadow-none transition-all">
            <Play className="h-4 w-4 mr-2" />
            {loading ? 'Starting...' : 'Start Match'}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

export function TeamPanel({
  teamKey, label, roster, xi, search, onSearch, onToggle, onSetCaptain, onSetKeeper, isSelected, color
}: {
  teamKey: 'teamA' | 'teamB';
  label: string;
  roster: Player[];
  xi: Player[];
  search: string;
  onSearch: (s: string) => void;
  onToggle: (team: 'teamA' | 'teamB', player: Player) => void;
  onSetCaptain: (team: 'teamA' | 'teamB', name: string) => void;
  onSetKeeper: (team: 'teamA' | 'teamB', name: string) => void;
  isSelected: (team: 'teamA' | 'teamB', name: string) => boolean;
  color: 'indigo' | 'emerald';
}) {
  const captain = xi.find(p => p.isCaptain);
  const keeper = xi.find(p => p.isKeeper);
  const count = xi.length;

  const filtered = useMemo(() => {
    if (!search) return roster;
    return roster.filter(p => p.playerName.toLowerCase().includes(search.toLowerCase()));
  }, [roster, search]);

  const border = color === 'indigo'
    ? 'border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50'
    : 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/50';

  const accentBg = color === 'indigo' ? 'bg-indigo-600' : 'bg-emerald-600';
  const accentText = color === 'indigo' ? 'text-indigo-600' : 'text-emerald-600';
  const selectedBg = color === 'indigo'
    ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
    : 'bg-emerald-50 border-emerald-400 text-emerald-900';
  const hoverBg = color === 'indigo'
    ? 'hover:bg-indigo-50/60 hover:border-indigo-300'
    : 'hover:bg-emerald-50/60 hover:border-emerald-300';

  return (
    <Card className={`${border} border-2 shadow-sm`}>
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className={`font-bold text-base ${accentText}`}>{label}</h4>
          <div className="flex items-center gap-2">
            <Badge
              className={`text-xs font-bold px-2.5 py-1 ${count === 11
                ? 'bg-green-100 text-green-700'
                : count > 11
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {count}/11
            </Badge>
          </div>
        </div>

        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-indigo-400 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <select value={captain?.playerName || ''} onChange={e => onSetCaptain(teamKey, e.target.value)}
            className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-yellow-400 focus:outline-none bg-white">
            <option value="">Select Captain</option>
            {xi.map(p => <option key={p.playerName} value={p.playerName}>{p.playerName}</option>)}
          </select>
          <select value={keeper?.playerName || ''} onChange={e => onSetKeeper(teamKey, e.target.value)}
            className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-blue-400 focus:outline-none bg-white">
            <option value="">Select WK</option>
            {xi.map(p => <option key={p.playerName} value={p.playerName}>{p.playerName}</option>)}
          </select>
        </div>

        <div className="max-h-64 overflow-y-auto rounded-xl border-2 border-gray-100 divide-y divide-gray-100">
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No players found</p>
          )}
          {filtered.map(p => {
            const inXi = isSelected(teamKey, p.playerName);
            const isC = xi.find(x => x.playerName === p.playerName)?.isCaptain;
            const isK = xi.find(x => x.playerName === p.playerName)?.isKeeper;
            return (
              <button
                key={p.playerName}
                type="button"
                onClick={() => onToggle(teamKey, p)}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-all duration-150
                  ${inXi ? selectedBg : `bg-white border-transparent ${hoverBg} border`}
                  ${inXi ? 'border-2' : 'border-2'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                  ${inXi ? accentBg + ' text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {inXi ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.playerName}</p>
                  <p className="text-xs text-gray-500 capitalize">{p.role}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {isC && <Badge className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 font-bold">C</Badge>}
                  {isK && <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 font-bold">WK</Badge>}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
