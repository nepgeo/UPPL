import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  playerOfTheMatch?: {
    playerName: string;
    team: string;
    reason: string;
    battingRuns: number;
    battingBalls: number;
    bowlingWickets: number;
    bowlingRuns: number;
    bowlingOvers: string;
    points: number;
  };
}

function getTeamLogo(logo: any): string {
  if (!logo) return '';
  if (typeof logo === 'string') return logo;
  return logo.url || logo.secure_url || '';
}

export default function MatchDetails() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInnings, setSelectedInnings] = useState<1 | 2>(1);
  const [userSelectedInnings, setUserSelectedInnings] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    const fetchMatch = async () => {
      try {
        const res = await api.get(`/matches/${matchId}/live-score`);
        const computed = res.data.computed;
        const matchData = { ...res.data.match };
        // Merge computed state for accurate live data
        if (computed) {
          matchData.score = computed.score;
          matchData.playerStats = computed.playerStats;
          matchData.currentOver = computed.currentOver;
          matchData.currentOverNumber = computed.currentOverNumber;
          matchData.fallOfWickets = computed.fallOfWickets;
          matchData.partnerships = computed.partnerships;
          matchData.last6Balls = computed.last6Balls;
          matchData.commentary = computed.commentary;
        }
        setMatch(matchData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load match');
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [matchId]);

  useEffect(() => {
    if (match && !userSelectedInnings && (match.currentInnings || 1) > 1) {
      setSelectedInnings(match.currentInnings!);
    }
  }, [match, userSelectedInnings]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <p className="text-red-400 text-lg">{error || 'Match not found'}</p>
        <Button onClick={() => navigate('/live-scores')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 rounded-xl font-bold uppercase tracking-wider">
          Back to Live Scores
        </Button>
      </div>
    );
  }

  const teamAName = match.teamA?.teamName || 'Team A';
  const teamBName = match.teamB?.teamName || 'Team B';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Card */}
      <div className="container mx-auto px-4 pt-6 pb-4">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-5 sm:p-6 shadow-xl shadow-blue-600/20">
          {/* Team VS Team */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-3">
            <span className="text-lg sm:text-2xl font-extrabold uppercase tracking-wider text-white text-right">{teamAName}</span>
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-xl font-black uppercase tracking-widest text-white/60">VS</span>
            </div>
            <span className="text-lg sm:text-2xl font-extrabold uppercase tracking-wider text-white text-left">{teamBName}</span>
          </div>

          {/* Badges row */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {match.result === 'completed' && (
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                Completed
              </span>
            )}
            {match.currentInnings === 2 && (
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                2nd Innings
              </span>
            )}
            {match.tossWinner && (
              <span className="text-sm sm:text-base font-medium text-white/90 mt-1 uppercase">
                {match.tossWinner === 'teamA' ? teamAName : teamBName} won toss & chose to {match.tossDecision}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-6">
        {/* Innings Toggle */}
        <div className="flex items-center gap-2 mb-5 justify-center">
          {[1, 2].map(inn => {
            const isActive = selectedInnings === inn;
            const isOngoing = match.result === 'live' && inn === (match.currentInnings || 1);
            return (
              <button
                key={inn}
                onClick={() => { setSelectedInnings(inn); setUserSelectedInnings(true); }}
                className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? isOngoing
                      ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
                }`}
              >
                {inn === 1 ? '1st Innings' : '2nd Innings'}
                {isOngoing && <span className="ml-2 w-2 h-2 rounded-full bg-white inline-block animate-pulse" />}
              </button>
            );
          })}
        </div>

        {/* Score Header */}
        {(() => {
          const isStarted = selectedInnings === 1 || (match.currentInnings || 1) >= 2 || match.result === 'completed';
          if (!isStarted) {
            return (
              <Card className="mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <CardContent className="p-8 sm:p-12 text-center">
                  <p className="text-slate-500 text-lg sm:text-xl font-medium">2nd innings hasn't started yet</p>
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

        {/* Winner Banner + Player of the Match */}
        {match.result === 'completed' && (
          <div className="space-y-4 mb-6">
            {/* Winner */}
            {match.winner && (
              <div className="p-5 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 rounded-2xl border border-amber-200 text-center shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Trophy className="h-6 w-6 text-amber-500" />
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-600">Result</span>
                  <Trophy className="h-6 w-6 text-amber-500" />
                </div>
                <p className="font-black text-xl sm:text-2xl uppercase tracking-wider text-amber-700">
                  {match.winner === 'teamA' ? teamAName : match.winner === 'teamB' ? teamBName : match.winner} won
                </p>
                {match.margin && (
                  <p className="text-sm sm:text-base font-bold text-amber-600 mt-1">{match.margin}</p>
                )}
                {match.teamAResult && match.teamBResult && (
                  <div className="flex items-center justify-center gap-4 mt-3 text-sm font-bold text-slate-600">
                    <span>{teamAName}: {match.teamAResult.runs}/{match.teamAResult.wickets} ({match.teamAResult.overs} ov)</span>
                    <span className="text-slate-300">|</span>
                    <span>{teamBName}: {match.teamBResult.runs}/{match.teamBResult.wickets} ({match.teamBResult.overs} ov)</span>
                  </div>
                )}
              </div>
            )}

            {/* Player of the Match */}
            {match.playerOfTheMatch && match.playerOfTheMatch.playerName && (
              <div className="p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 rounded-2xl border border-purple-200 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Medal className="h-5 w-5 text-purple-500" />
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-purple-600">Player of the Match</span>
                  <Medal className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <p className="font-black text-lg sm:text-xl uppercase tracking-wider text-slate-800">
                      {match.playerOfTheMatch.playerName}
                    </p>
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  </div>
                  {match.playerOfTheMatch.team && (
                    <p className="text-xs sm:text-sm font-bold text-purple-500 uppercase tracking-wider mb-2">
                      {match.playerOfTheMatch.team === 'teamA' ? teamAName : teamBName}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-3 flex-wrap text-xs sm:text-sm font-semibold text-slate-600">
                    {match.playerOfTheMatch.battingRuns > 0 && (
                      <span className="bg-white border border-slate-200 rounded-lg px-3 py-1">
                        Bat: <strong className="text-slate-800">{match.playerOfTheMatch.battingRuns}</strong> ({match.playerOfTheMatch.battingBalls} ball{match.playerOfTheMatch.battingBalls !== 1 ? 's' : ''})
                      </span>
                    )}
                    {match.playerOfTheMatch.bowlingWickets > 0 && (
                      <span className="bg-white border border-slate-200 rounded-lg px-3 py-1">
                        Bowl: <strong className="text-blue-600">{match.playerOfTheMatch.bowlingWickets}</strong>/{match.playerOfTheMatch.bowlingRuns} ({match.playerOfTheMatch.bowlingOvers} ov)
                      </span>
                    )}
                    {match.playerOfTheMatch.points > 0 && (
                      <span className="bg-purple-100 border border-purple-200 rounded-lg px-3 py-1 text-purple-700">
                        Points: <strong>{match.playerOfTheMatch.points}</strong>
                      </span>
                    )}
                  </div>
                  {match.playerOfTheMatch.reason && (
                    <p className="text-xs sm:text-sm text-slate-500 mt-2 italic">"{match.playerOfTheMatch.reason}"</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Score Display */}
        {(match.result === 'live' || match.result === 'completed') && (
          <LiveScoreDisplay
            matchId={match._id}
            initialData={match}
            viewInnings={selectedInnings as 1 | 2}
            onMatchUpdate={(rawMatch, computed) => {
              const merged = { ...rawMatch };
              if (computed) {
                merged.score = computed.score;
                merged.playerStats = computed.playerStats;
                merged.currentOver = computed.currentOver;
                merged.currentOverNumber = computed.currentOverNumber;
                merged.fallOfWickets = computed.fallOfWickets;
                merged.partnerships = computed.partnerships;
                merged.last6Balls = computed.last6Balls;
                merged.commentary = computed.commentary;
              }
              setMatch(merged);
            }}
          />
        )}

        {match.result === 'upcoming' && (
          <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <CardContent className="p-12 sm:p-16 text-center">
              <p className="text-slate-500 text-lg sm:text-xl font-medium">This match hasn't started yet. Check back on match day for live updates!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
