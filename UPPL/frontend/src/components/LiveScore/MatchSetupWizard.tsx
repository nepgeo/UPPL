import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Users, Coins, Check, X, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

interface TeamInfo { _id: string; teamName: string; teamCode: string; teamLogo?: string; }
interface Player { playerId: string; playerName: string; role: string; isCaptain: boolean; isKeeper: boolean; battingOrder: number; }
interface PlayingXI { _id: string; matchId: string; team: string; players: Player[]; }

interface Props {
  matchId: string;
  match: any;
  onComplete: () => void;
}

export default function MatchSetupWizard({ matchId, match, onComplete }: Props) {
  const [step, setStep] = useState<'xi' | 'toss'>('xi');
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);
  const [existingXI, setExistingXI] = useState<PlayingXI[]>([]);
  const [loading, setLoading] = useState(false);

  // Toss state
  const [tossWinner, setTossWinner] = useState<'teamA' | 'teamB' | ''>('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl' | ''>('');

  const teamA = (match?.teamA || {}) as TeamInfo;
  const teamB = (match?.teamB || {}) as TeamInfo;

  // Fetch squad/team members for both teams
  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        const [xiRes, teamARes, teamBRes] = await Promise.all([
          api.get(`/matches/${matchId}/playingXI`),
          api.get(`/teams/${teamA._id}`),
          api.get(`/teams/${teamB._id}`),
        ]);

        setExistingXI(xiRes.data?.playingXI || []);

        const existingA = (xiRes.data?.playingXI || []).find((x: PlayingXI) => x.team === 'teamA');
        const existingB = (xiRes.data?.playingXI || []).find((x: PlayingXI) => x.team === 'teamB');

        // Helper to extract players from team response
        const extractPlayers = (teamData: any): Player[] => {
          if (!teamData) return [];
          const raw = teamData.players || teamData.data?.players || [];
          if (Array.isArray(raw)) {
            return raw.map((p: any) => ({
              playerId: p.user?._id || p._id || '',
              playerName: p.name || p.user?.name || p.playerName || '',
              role: p.position || p.role || 'batsman',
              isCaptain: false,
              isKeeper: false,
              battingOrder: 0,
            })).filter(p => p.playerName);
          }
          return [];
        };

        // If user already set XI, restore them
        if (existingA?.players?.length >= 11) {
          setTeamAPlayers(existingA.players);
        } else {
          setTeamAPlayers(extractPlayers(teamARes.data));
        }

        if (existingB?.players?.length >= 11) {
          setTeamBPlayers(existingB.players);
        } else {
          setTeamBPlayers(extractPlayers(teamBRes.data));
        }
      } catch (err) {
        console.error('Failed to load players:', err);
      } finally { setLoading(false); }
    };
    if (matchId && teamA._id && teamB._id) fetchPlayers();
  }, [matchId, teamA._id, teamB._id]);

  const togglePlayer = (team: 'teamA' | 'teamB', player: Player) => {
    const setter = team === 'teamA' ? setTeamAPlayers : setTeamBPlayers;
    const current = team === 'teamA' ? teamAPlayers : teamBPlayers;

    const idx = current.findIndex(p => p.playerName === player.playerName);
    if (idx >= 0) {
      // Remove from XI (but keep in list)
      const updated = current.filter(p => p.playerName !== player.playerName);
      setter(updated);
    } else {
      setter([...current, { ...player, battingOrder: current.length + 1 }]);
    }
  };

  const isInXI = (team: 'teamA' | 'teamB', name: string) => {
    return (team === 'teamA' ? teamAPlayers : teamBPlayers).some(p => p.playerName === name);
  };

  const toggleCaptain = (team: 'teamA' | 'teamB', name: string) => {
    const setter = team === 'teamA' ? setTeamAPlayers : setTeamBPlayers;
    const current = team === 'teamA' ? teamAPlayers : teamBPlayers;
    setter(current.map(p => ({ ...p, isCaptain: p.playerName === name })));
  };

  const toggleKeeper = (team: 'teamA' | 'teamB', name: string) => {
    const setter = team === 'teamA' ? setTeamAPlayers : setTeamBPlayers;
    const current = team === 'teamA' ? teamAPlayers : teamBPlayers;
    setter(current.map(p => ({ ...p, isKeeper: p.playerName === name })));
  };

  const savePlayingXI = async () => {
    if (teamAPlayers.length < 11 || teamBPlayers.length < 11) {
      toast({ title: 'Need 11 players per team', variant: 'destructive' });
      return;
    }
    if (!teamAPlayers.some(p => p.isCaptain) || !teamBPlayers.some(p => p.isCaptain)) {
      toast({ title: 'Each team needs a captain', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await Promise.all([
        api.post(`/matches/${matchId}/playingXI`, { team: 'teamA', players: teamAPlayers }),
        api.post(`/matches/${matchId}/playingXI`, { team: 'teamB', players: teamBPlayers }),
      ]);
      toast({ title: '✅ Playing XI saved' });
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
      toast({ title: '✅ Toss completed', description: 'Match is ready for play!' });
      onComplete();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const renderPlayerList = (team: 'teamA' | 'teamB', label: string, players: Player[]) => {
    const xi = team === 'teamA' ? teamAPlayers : teamBPlayers;
    const captain = xi.find(p => p.isCaptain);
    const keeper = xi.find(p => p.isKeeper);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm">{label} ({xi.length}/11)</h4>
          <Badge variant={xi.length >= 11 ? 'default' : 'secondary'} className="text-xs">
            {xi.length >= 11 ? '✅ Ready' : `Need ${11 - xi.length} more`}
          </Badge>
        </div>
        {/* Captain & Keeper Controls */}
        <div className="flex gap-2 text-xs mb-1">
          <select value={captain?.playerName || ''} onChange={e => toggleCaptain(team, e.target.value)}
            className="flex-1 border rounded px-2 py-1 text-xs">
            <option value="">Captain</option>
            {xi.map(p => <option key={p.playerName} value={p.playerName}>{p.playerName}</option>)}
          </select>
          <select value={keeper?.playerName || ''} onChange={e => toggleKeeper(team, e.target.value)}
            className="flex-1 border rounded px-2 py-1 text-xs">
            <option value="">WK</option>
            {xi.map(p => <option key={p.playerName} value={p.playerName}>{p.playerName}</option>)}
          </select>
        </div>
        {/* Player Grid */}
        <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
          {players.map(p => {
            const selected = isInXI(team, p.playerName);
            const isC = xi.find(x => x.playerName === p.playerName)?.isCaptain;
            const isK = xi.find(x => x.playerName === p.playerName)?.isKeeper;
            return (
              <button key={p.playerName} type="button" onClick={() => togglePlayer(team, p)}
                className={`text-left px-2 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1
                  ${selected ? 'bg-indigo-100 border-indigo-300 text-indigo-800' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
              >
                <span className="flex-1 truncate">{p.playerName}</span>
                {isC && <Badge className="text-[9px] px-1 py-0 h-4 bg-yellow-500">C</Badge>}
                {isK && <Badge className="text-[9px] px-1 py-0 h-4 bg-blue-500">WK</Badge>}
                {selected ? <Check className="h-3 w-3 text-indigo-500 shrink-0" /> : <X className="h-3 w-3 text-gray-300 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (step === 'xi') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" />
          <h3 className="font-bold text-lg">Playing XI Selection</h3>
          <Badge className="ml-auto">Step 1 of 2</Badge>
        </div>
        <p className="text-xs text-gray-500">Select 11 players per team, assign captain and wicket-keeper.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-3">
              {renderPlayerList('teamA', teamA.teamName || 'Team A', existingXI.find(x => x.team === 'teamA')?.players || teamAPlayers)}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              {renderPlayerList('teamB', teamB.teamName || 'Team B', existingXI.find(x => x.team === 'teamB')?.players || teamBPlayers)}
            </CardContent>
          </Card>
        </div>

        <Button onClick={savePlayingXI} disabled={loading || teamAPlayers.length < 11 || teamBPlayers.length < 11}
          className="w-full bg-indigo-600 hover:bg-indigo-700">
          <ArrowRight className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Playing XI & Proceed to Toss'}
        </Button>
      </div>
    );
  }

  if (step === 'toss') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-500" />
          <h3 className="font-bold text-lg">Toss</h3>
          <Badge className="ml-auto">Step 2 of 2</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button type="button" onClick={() => setTossWinner('teamA')}
            className={`p-6 rounded-2xl border-2 text-center transition-all ${tossWinner === 'teamA' ? 'border-indigo-500 bg-indigo-50 shadow-lg' : 'border-gray-200 bg-white hover:border-indigo-200'}`}>
            <div className="text-4xl mb-2">{teamA.teamLogo ? <img src={teamA.teamLogo} alt="" className="w-12 h-12 mx-auto rounded-full" /> : '🏏'}</div>
            <h4 className="font-bold">{teamA.teamName}</h4>
            <p className="text-xs text-gray-500 mt-1">Toss Winner</p>
            {tossWinner === 'teamA' && <Badge className="mt-2 bg-indigo-600">Selected</Badge>}
          </button>

          <button type="button" onClick={() => setTossWinner('teamB')}
            className={`p-6 rounded-2xl border-2 text-center transition-all ${tossWinner === 'teamB' ? 'border-indigo-500 bg-indigo-50 shadow-lg' : 'border-gray-200 bg-white hover:border-indigo-200'}`}>
            <div className="text-4xl mb-2">{teamB.teamLogo ? <img src={teamB.teamLogo} alt="" className="w-12 h-12 mx-auto rounded-full" /> : '🏏'}</div>
            <h4 className="font-bold">{teamB.teamName}</h4>
            <p className="text-xs text-gray-500 mt-1">Toss Winner</p>
            {tossWinner === 'teamB' && <Badge className="mt-2 bg-indigo-600">Selected</Badge>}
          </button>
        </div>

        {tossWinner && (
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">
                {tossWinner === 'teamA' ? teamA.teamName : teamB.teamName} won the toss — choose to:
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <button type="button" onClick={() => setTossDecision('bat')}
                  className={`flex-1 p-4 rounded-xl border-2 text-center font-bold transition-all
                    ${tossDecision === 'bat' ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 bg-white hover:border-green-200'}`}>
                  🏏 Bat First
                </button>
                <button type="button" onClick={() => setTossDecision('bowl')}
                  className={`flex-1 p-4 rounded-xl border-2 text-center font-bold transition-all
                    ${tossDecision === 'bowl' ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 bg-white hover:border-blue-200'}`}>
                  ⚾ Bowl First
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        <Button onClick={doToss} disabled={loading || !tossWinner || !tossDecision}
          className="w-full bg-green-600 hover:bg-green-700">
          {loading ? 'Saving...' : 'Confirm Toss & Start Setup'}
        </Button>
      </div>
    );
  }

  return null;
}
