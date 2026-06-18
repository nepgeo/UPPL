import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import LiveScoreDisplay from '@/components/LiveScore/LiveScoreDisplay';
import ScoreHeader from '@/components/LiveScore/ScoreHeader';

interface MatchData {
  _id: string;
  result: string;
  score: any;
  events: any[];
  currentOver: any[];
  currentOverNumber: number;
  legalBallsInOver?: number;
  currentInnings?: number;
  battingFirst: string;
  striker?: string;
  nonStriker?: string;
  currentBowler?: string;
  tossWinner?: string;
  tossDecision?: string;
  teamA: { _id: string; teamName: string; teamLogo?: any; runs?: number; wickets?: number };
  teamB: { _id: string; teamName: string; teamLogo?: any; runs?: number; wickets?: number };
  teamAResult?: { runs: number; wickets: number; overs: string };
  teamBResult?: { runs: number; wickets: number; overs: string };
  winner?: string;
  margin?: string;
  matchTime: string;
  matchNumber?: number;
  stage?: string;
  playerStats: any;
}

export default function MatchDetails() {
  const { matchId } = useParams();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInnings, setSelectedInnings] = useState(1);

  useEffect(() => {
    if (!matchId) return;
    const fetchMatch = async () => {
      try {
        const res = await api.get(`/matches/${matchId}/live-score`);
        setMatch(res.data.match);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load match');
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [matchId]);

  useEffect(() => {
    if (match && (match.currentInnings || 1) > 1) {
      setSelectedInnings(match.currentInnings!);
    }
  }, [match]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || 'Match not found'}</p>
        <Button asChild><Link to="/live-scores">Back to Live Scores</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/live-scores"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Live Scores</Link>
        </Button>

        {/* Match Title — Toss & Innings Info */}
        <div className="flex flex-col items-center gap-1 mb-4">
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="text-xl font-bold text-blue-600">{match.teamA?.teamName}</span>
            <span className="text-base font-semibold text-muted-foreground">vs</span>
            <span className="text-xl font-bold text-blue-600">{match.teamB?.teamName}</span>
            <span className="flex items-center gap-2">
              {match.result === 'live' && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300">LIVE</span>
              )}
              {match.currentInnings === 2 && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-300">2nd Innings</span>
              )}
            </span>
          </div>
          {(() => {
            const ci = match.currentInnings;
            if (match.tossWinner) {
              const winnerName = match.tossWinner === 'teamA' ? match.teamA?.teamName : match.teamB?.teamName;
              return (
                <>
                  <span className="text-sm font-medium text-muted-foreground">
                    {winnerName} won the toss & chose to {match.tossDecision}
                  </span>
                  {ci ? <span className="text-lg font-bold text-muted-foreground">Innings {ci}</span> : null}
                </>
              );
            }
            return ci ? (
              <span className="text-lg font-bold text-muted-foreground">Innings {ci}</span>
            ) : null;
          })()}
        </div>

        {/* Innings Toggle */}
        <div className="flex items-center gap-2 mb-4 justify-center">
          {[1, 2].map(inn => {
            const isActive = selectedInnings === inn;
            const isOngoing = match.result === 'live' && inn === (match.currentInnings || 1);
            const isStarted = inn === 1 || (match.currentInnings || 1) >= 2 || match.result === 'completed';
            return (
              <button
                key={inn}
                onClick={() => setSelectedInnings(inn)}
                className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${
                  isActive
                    ? isOngoing
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                {inn === 1 ? '1st Innings' : '2nd Innings'}
                {isOngoing && <span className="ml-2 w-2 h-2 rounded-full bg-white inline-block animate-pulse" />}
              </button>
            );
          })}
        </div>

        {/* Score Header — filtered by selected innings */}
        {(() => {
          const isStarted = selectedInnings === 1 || (match.currentInnings || 1) >= 2 || match.result === 'completed';
          if (!isStarted) {
            return (
              <Card className="mb-4">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500 text-base">2nd innings hasn't started yet</p>
                </CardContent>
              </Card>
            );
          }
          const isActive = selectedInnings === (match.currentInnings || 1);
          const scoreHeaderMatch = {
            ...match,
            currentInnings: selectedInnings as 1 | 2,
            striker: isActive ? match.striker : undefined,
            nonStriker: isActive ? match.nonStriker : undefined,
            currentBowler: isActive ? match.currentBowler : undefined,
          };
          return <ScoreHeader match={scoreHeaderMatch} />;
        })()}

        {/* Winner Banner */}
        {match.result === 'completed' && match.winner && (
          <div className="mb-6 p-3 bg-green-50 rounded-lg border border-green-200 text-center">
            <Trophy className="h-5 w-5 text-amber-500 inline mr-2" />
            <span className="font-bold text-green-800">
              {match.winner === 'teamA' ? match.teamA?.teamName : match.winner === 'teamB' ? match.teamB?.teamName : match.winner} won
              {match.margin ? ` by ${match.margin}` : ''}
            </span>
          </div>
        )}

        {/* Live Score Display */}
        {(match.result === 'live' || match.result === 'completed') && (
          <LiveScoreDisplay matchId={match._id} initialData={match} />
        )}

        {match.result === 'upcoming' && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg">This match hasn't started yet. Check back on match day for live updates!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
