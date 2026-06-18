import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, MapPin, Activity, ArrowRight, Zap, Trophy, ChevronRight, Eye, Calendar, Play } from 'lucide-react';
import api from '@/lib/api';
import { API_BASE, BASE_URL } from '@/config';

interface TeamInfo {
  _id: string;
  teamName: string;
  teamLogo?: string | { url?: string };
  short?: string;
}

interface MatchScore {
  runs: number;
  wickets: number;
  balls: number;
  overs: number;
  extras: number;
  runRate: number;
  fours: number;
  sixes: number;
}

interface BallEvent {
  over: number;
  ball: number;
  runs: number;
  wicket?: boolean;
  isFour?: boolean;
  isSix?: boolean;
  extras?: { type: string | null; runs: number };
}

interface UpcomingMatch {
  _id: string;
  result: string;
  stage: string;
  teamA: TeamInfo;
  teamB: TeamInfo;
  matchTime: string;
  matchNumber?: number;
  venue?: string;
}

interface CompletedMatch {
  _id: string;
  result: string;
  teamA: TeamInfo & { runs?: number; wickets?: number };
  teamB: TeamInfo & { runs?: number; wickets?: number };
  matchTime: string;
  winner?: string;
  margin?: string;
}

function getTeamLogo(logo: any): string {
  if (!logo) return '';
  if (typeof logo === 'string') return logo;
  return logo.url || logo.secure_url || '';
}

function formatOvers(balls: number) {
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

export default function LiveScores() {
  const navigate = useNavigate();
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [recentMatches, setRecentMatches] = useState<CompletedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');

  const fetchAll = async () => {
    try {
      const [matchesRes, liveRes, recentRes] = await Promise.all([
        api.get('/matches'),
        api.get('/matches/live/now').catch(() => ({ data: { matches: [] } })),
        api.get('/matches/recent/completed').catch(() => ({ data: { matches: [] } })),
      ]);

      const allMatches = matchesRes.data.matches || [];
      const live = liveRes.data.matches || [];
      const recent = recentRes.data.matches || [];

      setLiveMatches(live);

      // Upcoming: matches that are not live or completed
      const upcoming = allMatches.filter((m: any) =>
        m.result === 'upcoming' || (!m.result || m.result === 'pending')
      );
      setUpcomingMatches(upcoming);
      setRecentMatches(recent);

      // Auto-switch to live tab if there are live matches
      if (live.length > 0 && activeTab === 'live') {
        // keep on live
      } else if (live.length > 0) {
        setActiveTab('live');
      }
    } catch (err) {
      console.error('Failed to fetch scores', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 20000);
    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (d: string) => {
    const date = new Date(d);
    return {
      date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8 bg-white/10" />
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-10 md:py-16 relative">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-6 w-6 text-yellow-400" />
              <span className="text-yellow-400 font-semibold text-sm uppercase tracking-widest">
                {liveMatches.length > 0 ? `${liveMatches.length} Match${liveMatches.length > 1 ? 'es' : ''} Live` : 'Cricket Action'}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
              {liveMatches.length > 0 ? '🏏 Live Scores' : 'UPPL Scores'}
            </h1>
            <p className="text-gray-300 text-lg max-w-xl">
              {liveMatches.length > 0
                ? 'Real-time ball-by-ball updates from the ongoing matches'
                : 'Follow all the action from the Udaydev Patan Premier League'}
            </p>
          </motion.div>

          {liveMatches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 flex flex-wrap gap-3"
            >
              {liveMatches.map(m => (
                <Badge key={m._id} className="bg-white/10 text-white border border-white/20 px-4 py-2 text-sm cursor-pointer hover:bg-white/20"
                  onClick={() => navigate(`/match/${m._id}`)}
                >
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2 inline-block" />
                  {m.teamA?.teamName || 'TBD'} vs {m.teamB?.teamName || 'TBD'}
                </Badge>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-center mb-8">
            <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
              <TabsTrigger value="live" className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-lg px-6">
                🔴 Live {liveMatches.length > 0 && `(${liveMatches.length})`}
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-6">
                📅 Upcoming ({upcomingMatches.length})
              </TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-lg px-6">
                ✅ Recent
              </TabsTrigger>
              <Button
                onClick={() => navigate('/watch-live')}
                className="ml-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 rounded-lg px-4 h-9 text-sm font-semibold shadow-lg shadow-red-600/20"
              >
                <Play className="h-4 w-4 mr-1.5" /> Watch Live
              </Button>
            </TabsList>
          </div>

          {/* ===== LIVE TAB ===== */}
          <TabsContent value="live">
            {liveMatches.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="bg-white/5 border-white/10 backdrop-blur">
                  <CardContent className="p-16 text-center">
                    <Activity className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-2xl font-bold text-white mb-2">No Live Matches</h3>
                    <p className="text-gray-400 mb-6">There are no matches currently in progress. Check the upcoming matches.</p>
                    <Button onClick={() => setActiveTab('upcoming')} variant="outline" className="border-white/20 text-white">
                      View Upcoming Matches <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="grid gap-6">
                {liveMatches.map((match, idx) => {
                  const teamAScore = match.score?.teamA || { runs: 0, wickets: 0, balls: 0, overs: 0, runRate: 0 };
                  const teamBScore = match.score?.teamB || { runs: 0, wickets: 0, balls: 0, overs: 0, runRate: 0 };
                  return (
                    <motion.div key={match._id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 text-white overflow-hidden hover:border-blue-500/50 transition-all group">
                        <CardContent className="p-0">
                          {/* Live Banner */}
                          <div className="bg-gradient-to-r from-red-600 to-red-800 px-4 py-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                              <span className="text-xs font-bold uppercase tracking-widest">Live</span>
                              <span className="text-xs text-red-200">| {match.stage || 'League'} Match</span>
                            </div>
                            <span className="text-xs text-red-200">
                              RR: {match.battingFirst === 'teamA' ? teamAScore.runRate?.toFixed(2) : teamBScore.runRate?.toFixed(2)}
                            </span>
                          </div>

                          <div className="p-5">
                            {/* Team A */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                  {getTeamLogo(match.teamA?.teamLogo) ? (
                                    <img src={getTeamLogo(match.teamA?.teamLogo)} alt="" className="w-full h-full object-contain p-1" />
                                  ) : (
                                    <span className="text-xs font-bold text-gray-400">
                                      {match.teamA?.teamName?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-sm md:text-base">{match.teamA?.teamName || 'Team A'}</p>
                                  <p className="text-xs text-gray-400">
                                    {match.battingFirst === 'teamA' ? 'Batting' : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                  {teamAScore.runs}<span className="text-gray-400">/{teamAScore.wickets}</span>
                                </p>
                                <p className="text-xs text-gray-400">
                                  {formatOvers(teamAScore.balls)} Overs | RR: {teamAScore.runRate?.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-700/50 my-3" />

                            {/* Team B */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                  {getTeamLogo(match.teamB?.teamLogo) ? (
                                    <img src={getTeamLogo(match.teamB?.teamLogo)} alt="" className="w-full h-full object-contain p-1" />
                                  ) : (
                                    <span className="text-xs font-bold text-gray-400">
                                      {match.teamB?.teamName?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-sm md:text-base">{match.teamB?.teamName || 'Team B'}</p>
                                  <p className="text-xs text-gray-400">
                                    {match.battingFirst === 'teamB' ? 'Batting' : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                  {teamBScore.runs}<span className="text-gray-400">/{teamBScore.wickets}</span>
                                </p>
                                <p className="text-xs text-gray-400">
                                  {formatOvers(teamBScore.balls)} Overs | RR: {teamBScore.runRate?.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {/* Current Over Display */}
                            {match.currentOver && match.currentOver.length > 0 && (
                              <div className="mb-4">
                                <p className="text-xs text-gray-500 mb-1">Over {match.currentOverNumber}:</p>
                                <div className="flex gap-1.5">
                                  {match.currentOver.map((ev: BallEvent, i: number) => (
                                    <span key={i}
                                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold
                                        ${ev.wicket ? 'bg-red-600 text-white' :
                                          ev.isSix ? 'bg-purple-600 text-white' :
                                          ev.isFour ? 'bg-emerald-500 text-white' :
                                          ev.runs === 0 ? 'bg-gray-700 text-gray-300' :
                                          'bg-blue-600 text-white'}`}
                                    >
                                      {ev.wicket ? 'W' : ev.runs + (ev.extras?.runs || 0)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <Button
                              onClick={() => navigate(`/match/${match._id}`)}
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 mt-1"
                            >
                              <Eye className="h-4 w-4 mr-2" /> View Live Score
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ===== UPCOMING TAB ===== */}
          <TabsContent value="upcoming">
            {upcomingMatches.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="bg-white/5 border-white/10 backdrop-blur">
                  <CardContent className="p-16 text-center">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-2xl font-bold text-white mb-2">No Upcoming Matches</h3>
                    <p className="text-gray-400">No matches have been scheduled yet.</p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMatches.map((match, idx) => {
                  const dt = formatDateTime(match.matchTime);
                  return (
                    <motion.div key={match._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 text-white h-full hover:border-blue-500/30 transition-all group">
                        <CardContent className="p-5 flex flex-col h-full">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                              {match.stage || 'League'} Match{match.matchNumber ? ` #${match.matchNumber}` : ''}
                            </Badge>
                            <Badge className="bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs">
                              Upcoming
                            </Badge>
                          </div>

                          {/* Teams */}
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <div className="text-center flex-1">
                              <div className="w-12 h-12 rounded-full bg-white/10 mx-auto mb-2 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamA?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamA?.teamLogo)} alt="" className="w-full h-full object-contain p-1" />
                                ) : (
                                  <span className="text-lg font-bold text-gray-500">
                                    {match.teamA?.teamName?.charAt(0) || 'A'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold leading-tight">{match.teamA?.teamName || 'TBD'}</p>
                            </div>
                            <div className="text-center px-2">
                              <p className="text-lg font-extrabold text-yellow-400">VS</p>
                            </div>
                            <div className="text-center flex-1">
                              <div className="w-12 h-12 rounded-full bg-white/10 mx-auto mb-2 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamB?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamB?.teamLogo)} alt="" className="w-full h-full object-contain p-1" />
                                ) : (
                                  <span className="text-lg font-bold text-gray-500">
                                    {match.teamB?.teamName?.charAt(0) || 'B'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold leading-tight">{match.teamB?.teamName || 'TBD'}</p>
                            </div>
                          </div>

                          {/* Date/Time */}
                          <div className="text-center mb-4 text-sm text-gray-400 space-y-1">
                            <div className="flex items-center justify-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{dt.day}, {dt.date}</span>
                            </div>
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{dt.time}</span>
                            </div>
                          </div>

                          {/* Spacer */}
                          <div className="flex-1" />

                          {/* Button */}
                          <Button
                            onClick={() => navigate(`/match/${match._id}`)}
                            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                          >
                            <Eye className="h-4 w-4 mr-2" /> Match Details
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ===== RECENT TAB ===== */}
          <TabsContent value="recent">
            {recentMatches.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="bg-white/5 border-white/10 backdrop-blur">
                  <CardContent className="p-16 text-center">
                    <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-2xl font-bold text-white mb-2">No Completed Matches</h3>
                    <p className="text-gray-400">Completed match results will appear here.</p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="grid gap-4">
                {recentMatches.map((match, idx) => {
                  const dt = formatDateTime(match.matchTime);
                  const winnerName = match.winner === 'teamA'
                    ? match.teamA?.teamName
                    : match.winner === 'teamB'
                    ? match.teamB?.teamName
                    : match.winner === 'tie' ? 'Match Tied' : match.winner;
                  return (
                    <motion.div key={match._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 text-white hover:border-green-500/30 transition-all group">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            {/* Teams */}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Trophy className="h-4 w-4 text-yellow-500" />
                                  <span className="text-xs text-gray-400">{dt.date}</span>
                                </div>
                                <Badge className="bg-green-600/20 text-green-300 border-green-500/30 text-xs">Completed</Badge>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {getTeamLogo(match.teamA?.teamLogo) ? (
                                      <img src={getTeamLogo(match.teamA?.teamLogo)} alt="" className="w-full h-full object-contain" />
                                    ) : <span className="text-xs text-gray-500">A</span>}
                                  </div>
                                  <span className="font-semibold text-sm truncate">{match.teamA?.teamName}</span>
                                  <span className="font-mono font-bold text-lg ml-auto">
                                    {match.teamA?.runs ?? 0}/{match.teamA?.wickets ?? 0}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mt-1">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {getTeamLogo(match.teamB?.teamLogo) ? (
                                      <img src={getTeamLogo(match.teamB?.teamLogo)} alt="" className="w-full h-full object-contain" />
                                    ) : <span className="text-xs text-gray-500">B</span>}
                                  </div>
                                  <span className="font-semibold text-sm truncate">{match.teamB?.teamName}</span>
                                  <span className="font-mono font-bold text-lg ml-auto">
                                    {match.teamB?.runs ?? 0}/{match.teamB?.wickets ?? 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="md:text-right md:border-l md:border-gray-700/50 md:pl-4">
                              {winnerName && (
                                <p className="text-sm font-semibold text-green-400 mb-2">{winnerName} won{ match.margin ? ` by ${match.margin}` : '' }</p>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/match/${match._id}`)}
                                className="text-gray-400 hover:text-white w-full md:w-auto">
                                Recap <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
