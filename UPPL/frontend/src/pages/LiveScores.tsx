import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Activity, ArrowRight, Trophy, ChevronRight, Eye, Calendar, Play } from 'lucide-react';
import api from '@/lib/api';

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
  const seasonIdRef = useRef<string>('');

  const fetchSeason = async (): Promise<string> => {
    try {
      const res = await api.get('/seasons/current');
      const season = res.data;
      if (season?._id) {
        seasonIdRef.current = season._id;
        return season._id;
      }
    } catch {
      // fallback: fetch all seasons and use the first
    }
    try {
      const res = await api.get('/seasons');
      const seasons = res.data || [];
      const current = seasons.find((s: any) => s.isCurrent) || seasons[0];
      if (current?._id) {
        seasonIdRef.current = current._id;
        return current._id;
      }
    } catch {}
    return '';
  };

  const fetchAll = async (seasonId?: string) => {
    try {
      const params = seasonId ? { seasonNumber: seasonId } : {};
      const [matchesRes, liveRes, recentRes] = await Promise.all([
        api.get('/matches', { params }),
        api.get('/matches/live/now', { params }).catch(() => ({ data: { matches: [] } })),
        api.get('/matches/recent/completed', { params }).catch(() => ({ data: { matches: [] } })),
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
    (async () => {
      const sid = await fetchSeason();
      await fetchAll(sid);
    })();
    const interval = setInterval(async () => {
      const sid = seasonIdRef.current || await fetchSeason();
      await fetchAll(sid);
    }, 20000);
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
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-purple-800 to-indigo-900">
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="w-[600px] h-[600px] bg-blue-500 rounded-full blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 py-8 md:py-12 relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Live count pill badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
              {liveMatches.length > 0 ? (
                <>
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-white">
                    {liveMatches.length} Match{liveMatches.length > 1 ? 'es' : ''} Live
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-gray-300">Cricket Action</span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
              {liveMatches.length > 0 ? 'Live Scores' : 'UPPL Scores'}
            </h1>
            <p className="text-gray-300 text-lg max-w-xl mx-auto">
              {liveMatches.length > 0
                ? 'Real-time ball-by-ball updates from the ongoing matches'
                : 'Follow all the action from the Udaydev Patan Premier League'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2">
              <TabsList className="flex items-center gap-1 bg-transparent h-auto p-0">
                <TabsTrigger value="live"
                  className="relative px-4 py-2 text-sm font-medium text-gray-400 data-[state=active]:text-red-400 transition-colors
                    after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-red-500
                    data-[state=active]:after:w-full after:transition-all inline-flex items-center justify-center whitespace-nowrap rounded-none bg-transparent data-[state=active]:bg-transparent ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block mr-1.5" />
                  Live {liveMatches.length > 0 && `(${liveMatches.length})`}
                </TabsTrigger>
                <TabsTrigger value="upcoming"
                  className="relative px-4 py-2 text-sm font-medium text-gray-400 data-[state=active]:text-blue-400 transition-colors
                    after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-blue-500
                    data-[state=active]:after:w-full after:transition-all inline-flex items-center justify-center whitespace-nowrap rounded-none bg-transparent data-[state=active]:bg-transparent ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block mr-1.5" />
                  Upcoming ({upcomingMatches.length})
                </TabsTrigger>
                <TabsTrigger value="recent"
                  className="relative px-4 py-2 text-sm font-medium text-gray-400 data-[state=active]:text-green-400 transition-colors
                    after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-green-500
                    data-[state=active]:after:w-full after:transition-all inline-flex items-center justify-center whitespace-nowrap rounded-none bg-transparent data-[state=active]:bg-transparent ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block mr-1.5" />
                  Recent
                </TabsTrigger>
              </TabsList>
              <div className="w-px h-6 bg-white/10" />
              <Button
                onClick={() => navigate('/watch-live')}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 rounded-lg px-4 h-8 text-xs font-semibold shadow-lg shadow-red-600/20"
              >
                <Play className="h-3.5 w-3.5 mr-1" /> Watch Live
              </Button>
            </div>
          </div>

          {/* ===== LIVE TAB ===== */}
          <TabsContent value="live">
            {liveMatches.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="bg-white/5 backdrop-blur-md border-white/10 rounded-xl">
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
              <div className="grid gap-4">
                {liveMatches.map((match, idx) => {
                  const teamAScore = match.score?.teamA || { runs: 0, wickets: 0, balls: 0, overs: 0, runRate: 0 };
                  const teamBScore = match.score?.teamB || { runs: 0, wickets: 0, balls: 0, overs: 0, runRate: 0 };
                  return (
                    <motion.div
                      key={match._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white hover:border-white/20 transition-all">
                        <CardContent className="p-4 sm:p-5">
                          {/* Top bar: stage + status + RR */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                              <span className="text-xs font-bold uppercase tracking-wider text-red-400">Live</span>
                              <span className="text-xs text-gray-400">| {match.stage || 'League'} Match</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              RR: {match.battingFirst === 'teamA'
                                ? teamAScore.runRate?.toFixed(2)
                                : teamBScore.runRate?.toFixed(2)}
                            </span>
                          </div>

                          {/* Team A row */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamA?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamA?.teamLogo)} alt="" className="w-full h-full object-contain p-0.5" />
                                ) : (
                                  <span className="text-xs font-bold text-gray-400">
                                    {match.teamA?.teamName?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-sm truncate">{match.teamA?.teamName || 'Team A'}</span>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <span className="text-2xl font-extrabold tracking-tight">
                                {teamAScore.runs}<span className="text-gray-500">/{teamAScore.wickets}</span>
                              </span>
                              <div className="text-xs text-gray-400">
                                {formatOvers(teamAScore.balls)} ov | RR: {teamAScore.runRate?.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Team B row */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamB?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamB?.teamLogo)} alt="" className="w-full h-full object-contain p-0.5" />
                                ) : (
                                  <span className="text-xs font-bold text-gray-400">
                                    {match.teamB?.teamName?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-sm truncate">{match.teamB?.teamName || 'Team B'}</span>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <span className="text-2xl font-extrabold tracking-tight">
                                {teamBScore.runs}<span className="text-gray-500">/{teamBScore.wickets}</span>
                              </span>
                              <div className="text-xs text-gray-400">
                                {formatOvers(teamBScore.balls)} ov | RR: {teamBScore.runRate?.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Current Over */}
                          {match.currentOver && match.currentOver.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs text-gray-500 mb-1.5">Over {match.currentOverNumber}:</p>
                              <div className="flex gap-1.5">
                                {match.currentOver.map((ev: BallEvent, i: number) => (
                                  <span
                                    key={i}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
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

                          {/* Button */}
                          <Button
                            onClick={() => navigate(`/match/${match._id}`)}
                            className="w-full bg-white/5 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 border border-white/20 text-white hover:text-white hover:border-transparent transition-all"
                          >
                            <Eye className="h-4 w-4 mr-2" /> View Live Score
                          </Button>
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
                <Card className="bg-white/5 backdrop-blur-md border-white/10 rounded-xl">
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
                    <motion.div
                      key={match._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white h-full hover:border-white/20 transition-all">
                        <CardContent className="p-5 flex flex-col h-full">
                          {/* Top row: stage badge + status */}
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs text-gray-400 font-medium">
                              {match.stage || 'League'} Match{match.matchNumber ? ` #${match.matchNumber}` : ''}
                            </span>
                            <span className="text-xs text-blue-300 bg-blue-600/20 border border-blue-500/30 rounded-full px-2.5 py-0.5 font-medium">
                              Upcoming
                            </span>
                          </div>

                          {/* Teams */}
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="text-center flex-1 min-w-0">
                              <div className="w-12 h-12 rounded-full bg-white/10 mx-auto mb-2 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamA?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamA?.teamLogo)} alt="" className="w-full h-full object-contain p-1" />
                                ) : (
                                  <span className="text-lg font-bold text-gray-500">
                                    {match.teamA?.teamName?.charAt(0) || 'A'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold truncate">{match.teamA?.teamName || 'TBD'}</p>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="text-lg font-extrabold text-yellow-400">VS</span>
                            </div>
                            <div className="text-center flex-1 min-w-0">
                              <div className="w-12 h-12 rounded-full bg-white/10 mx-auto mb-2 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamB?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamB?.teamLogo)} alt="" className="w-full h-full object-contain p-1" />
                                ) : (
                                  <span className="text-lg font-bold text-gray-500">
                                    {match.teamB?.teamName?.charAt(0) || 'B'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold truncate">{match.teamB?.teamName || 'TBD'}</p>
                            </div>
                          </div>

                          {/* Date/Time */}
                          <div className="text-center mb-4 text-sm text-gray-400 space-y-1">
                            <div className="flex items-center justify-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{dt.day}, {dt.date}</span>
                            </div>
                            <div className="flex items-center justify-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{dt.time}</span>
                            </div>
                          </div>

                          {/* Spacer + Button */}
                          <div className="flex-1" />
                          <Button
                            onClick={() => navigate(`/match/${match._id}`)}
                            className="w-full bg-white/10 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 border border-white/20 text-white hover:text-white hover:border-transparent transition-all"
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
                <Card className="bg-white/5 backdrop-blur-md border-white/10 rounded-xl">
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
                    <motion.div
                      key={match._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white hover:border-white/20 transition-all">
                        <CardContent className="p-4 sm:p-5">
                          {/* Top row: date + status */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-yellow-500" />
                              <span className="text-xs text-gray-400">{dt.date}</span>
                            </div>
                            <span className="text-xs text-green-300 bg-green-600/20 border border-green-500/30 rounded-full px-2.5 py-0.5 font-medium">
                              Completed
                            </span>
                          </div>

                          {/* Team A */}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamA?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamA?.teamLogo)} alt="" className="w-full h-full object-contain p-0.5" />
                                ) : <span className="text-xs text-gray-500">A</span>}
                              </div>
                              <span className="font-semibold text-sm truncate">{match.teamA?.teamName}</span>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <span className="text-lg font-extrabold">
                                {match.teamA?.runs ?? 0}<span className="text-gray-500">/{match.teamA?.wickets ?? 0}</span>
                              </span>
                              <div className="text-xs text-gray-400">
                                {match.teamA?.overs ? `${match.teamA.overs} ov` : ''}
                              </div>
                            </div>
                          </div>

                          {/* Team B */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamB?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamB?.teamLogo)} alt="" className="w-full h-full object-contain p-0.5" />
                                ) : <span className="text-xs text-gray-500">B</span>}
                              </div>
                              <span className="font-semibold text-sm truncate">{match.teamB?.teamName}</span>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <span className="text-lg font-extrabold">
                                {match.teamB?.runs ?? 0}<span className="text-gray-500">/{match.teamB?.wickets ?? 0}</span>
                              </span>
                              <div className="text-xs text-gray-400">
                                {match.teamB?.overs ? `${match.teamB.overs} ov` : ''}
                              </div>
                            </div>
                          </div>

                          {/* Result + Button row */}
                          <div className="flex items-center justify-between pt-3 border-t border-white/10">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                              {winnerName ? (
                                <span className="text-sm font-semibold text-green-400 truncate">
                                  {winnerName} won{ match.margin ? ` by ${match.margin}` : '' }
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">No result</span>
                              )}
                            </div>
                            <Button
                              onClick={() => navigate(`/match/${match._id}`)}
                              className="bg-white/10 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 border border-white/20 text-white hover:text-white hover:border-transparent transition-all text-xs flex-shrink-0 ml-3"
                              size="sm"
                            >
                              View Scorecard <ArrowRight className="h-3 w-3 ml-1" />
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
        </Tabs>
      </div>
    </div>
  );
}
