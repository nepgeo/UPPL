import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'live');
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

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
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
            <div className="flex items-center gap-2 sm:gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-3 sm:px-4 py-2">
              <TabsList className="flex items-center gap-1 bg-transparent h-auto p-0">
                <TabsTrigger value="live"
                  className="relative px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400 data-[state=active]:text-red-400 transition-colors
                    after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-red-500
                    data-[state=active]:after:w-full after:transition-all inline-flex items-center justify-center whitespace-nowrap rounded-none bg-transparent data-[state=active]:bg-transparent ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block mr-1 sm:mr-1.5" />
                  Live<span className="hidden sm:inline">{liveMatches.length > 0 && ` (${liveMatches.length})`}</span>
                </TabsTrigger>
                <TabsTrigger value="upcoming"
                  className="relative px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400 data-[state=active]:text-blue-400 transition-colors
                    after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-blue-500
                    data-[state=active]:after:w-full after:transition-all inline-flex items-center justify-center whitespace-nowrap rounded-none bg-transparent data-[state=active]:bg-transparent ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block mr-1 sm:mr-1.5" />
                  Upcoming<span className="hidden sm:inline">{upcomingMatches.length > 0 && ` (${upcomingMatches.length})`}</span>
                </TabsTrigger>
                <TabsTrigger value="recent"
                  className="relative px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400 data-[state=active]:text-green-400 transition-colors
                    after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-green-500
                    data-[state=active]:after:w-full after:transition-all inline-flex items-center justify-center whitespace-nowrap rounded-none bg-transparent data-[state=active]:bg-transparent ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block mr-1 sm:mr-1.5" />
                  Recent
                </TabsTrigger>
              </TabsList>
              <div className="w-px h-6 bg-white/10" />
              <Button
                onClick={() => navigate('/watch-live')}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 rounded-lg px-3 sm:px-4 h-8 text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/20"
              >
                <Play className="h-3.5 w-3.5 mr-1" /> <span className="hidden sm:inline">Watch </span>Live
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
                    <Button onClick={() => setActiveTab('upcoming')} variant="outline" className="border-white/20 text-white uppercase tracking-wider text-xs font-semibold">
                      View Upcoming <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
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
                      <Card className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:border-white/20 hover:shadow-[0_8px_40px_rgba(59,130,246,0.15)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300">
                        <CardContent className="p-4 sm:p-5">
                          {/* Centered header */}
                          <div className="flex flex-col items-center mb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                              <span className="text-sm font-bold uppercase tracking-widest text-red-400">Live</span>
                            </div>
                            <span className="text-xs text-gray-400 uppercase tracking-wider">{match.stage || 'League'} Match{match.matchNumber ? ` #${match.matchNumber}` : ''}</span>
                          </div>

                          {/* Team A row */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/[0.06] border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamA?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamA?.teamLogo)} alt="" className="w-full h-full object-contain p-1" />
                                ) : (
                                  <span className="text-sm font-bold text-gray-400">
                                    {match.teamA?.teamName?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm sm:text-base truncate">{match.teamA?.teamName || 'Team A'}</p>
                                <p className="text-xs text-gray-500">{formatOvers(teamAScore.balls)} ov</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                {teamAScore.runs}<span className="text-gray-500">/{teamAScore.wickets}</span>
                              </span>
                            </div>
                          </div>

                          {/* Team B row */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/[0.06] border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamB?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamB?.teamLogo)} alt="" className="w-full h-full object-contain p-1" />
                                ) : (
                                  <span className="text-sm font-bold text-gray-400">
                                    {match.teamB?.teamName?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm sm:text-base truncate">{match.teamB?.teamName || 'Team B'}</p>
                                <p className="text-xs text-gray-500">{formatOvers(teamBScore.balls)} ov</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                {teamBScore.runs}<span className="text-gray-500">/{teamBScore.wickets}</span>
                              </span>
                            </div>
                          </div>

                          {/* Current Over */}
                          {match.currentOver && match.currentOver.length > 0 && (
                            <div className="mb-4 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                              <p className="text-xs text-gray-500 mb-2 font-medium">Over {match.currentOverNumber}</p>
                              <div className="flex gap-1.5 flex-wrap">
                                {match.currentOver.map((ev: BallEvent, i: number) => (
                                  <span
                                    key={i}
                                    className={`w-8 h-8 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold
                                      ${ev.wicket ? 'bg-red-500/80 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                                        ev.isSix ? 'bg-purple-500/80 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]' :
                                        ev.isFour ? 'bg-emerald-500/80 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                                        ev.runs === 0 ? 'bg-white/[0.06] text-gray-400 border border-white/5' :
                                        'bg-blue-500/80 text-white shadow-[0_0_8px_rgba(59,130,246,0.3)]'}`}
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
                            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 rounded-xl h-11 text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/20 transition-all duration-300"
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
              <div className="grid md:grid-cols-2 gap-5">
                {upcomingMatches.map((match, idx) => {
                  const dt = formatDateTime(match.matchTime);
                  return (
                    <motion.div
                      key={match._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:border-white/20 hover:shadow-[0_8px_40px_rgba(59,130,246,0.15)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 h-full">
                        <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                          {/* Top row: stage badge + status */}
                          <div className="flex items-center justify-between mb-5">
                            <span className="text-xs sm:text-sm text-gray-400 font-medium uppercase tracking-wider">
                              {match.stage || 'League'} Match{match.matchNumber ? ` #${match.matchNumber}` : ''}
                            </span>
                            <span className="text-xs uppercase tracking-wider text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-0.5 font-bold">
                              Upcoming
                            </span>
                          </div>

                          {/* Teams */}
                          <div className="flex items-center justify-between gap-3 sm:gap-4 mb-5">
                            <div className="text-center flex-1 min-w-0">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.06] border border-white/10 mx-auto mb-2 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamA?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamA?.teamLogo)} alt="" className="w-full h-full object-contain p-1.5" />
                                ) : (
                                  <span className="text-xl font-bold text-gray-500">
                                    {match.teamA?.teamName?.charAt(0) || 'A'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm sm:text-base font-semibold truncate">{match.teamA?.teamName || 'TBD'}</p>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">VS</span>
                            </div>
                            <div className="text-center flex-1 min-w-0">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.06] border border-white/10 mx-auto mb-2 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamB?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamB?.teamLogo)} alt="" className="w-full h-full object-contain p-1.5" />
                                ) : (
                                  <span className="text-xl font-bold text-gray-500">
                                    {match.teamB?.teamName?.charAt(0) || 'B'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm sm:text-base font-semibold truncate">{match.teamB?.teamName || 'TBD'}</p>
                            </div>
                          </div>

                          {/* Date/Time */}
                          <div className="text-center mb-5 text-sm sm:text-base text-gray-300 space-y-1.5 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                            <div className="flex items-center justify-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">{dt.day}, {dt.date}</span>
                            </div>
                            <div className="flex items-center justify-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">{dt.time}</span>
                            </div>
                          </div>

                          {/* Spacer + Button */}
                          <div className="flex-1" />
                          <Button
                            onClick={() => navigate(`/match/${match._id}`)}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-xl h-11 text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all duration-300"
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
              <div className="grid md:grid-cols-2 gap-5">
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
                      <Card className={`bg-white/[0.03] backdrop-blur-xl border rounded-2xl text-white hover:border-white/20 hover:shadow-[0_8px_40px_rgba(59,130,246,0.15)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 ${winnerName && winnerName !== 'Match Tied' ? 'border-green-500/20' : 'border-white/10'}`}>
                        <CardContent className="p-4 sm:p-5">
                          {/* Top row: date + status */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-yellow-500" />
                              <span className="text-xs sm:text-sm text-gray-400 font-medium">{dt.date}</span>
                            </div>
                            <span className="text-xs uppercase tracking-wider text-green-300 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-0.5 font-bold">
                              Completed
                            </span>
                          </div>

                          {/* Team A */}
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/[0.06] border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamA?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamA?.teamLogo)} alt="" className="w-full h-full object-contain p-1" />
                                ) : <span className="text-xs text-gray-500">A</span>}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm sm:text-base truncate">{match.teamA?.teamName}</p>
                                <p className="text-xs text-gray-500">{match.teamA?.overs ? `${match.teamA.overs} ov` : ''}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <span className="text-xl sm:text-2xl font-extrabold">
                                {match.teamA?.runs ?? 0}<span className="text-gray-500">/{match.teamA?.wickets ?? 0}</span>
                              </span>
                            </div>
                          </div>

                          {/* Team B */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/[0.06] border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {getTeamLogo(match.teamB?.teamLogo) ? (
                                  <img src={getTeamLogo(match.teamB?.teamLogo)} alt="" className="w-full h-full object-contain p-1" />
                                ) : <span className="text-xs text-gray-500">B</span>}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm sm:text-base truncate">{match.teamB?.teamName}</p>
                                <p className="text-xs text-gray-500">{match.teamB?.overs ? `${match.teamB.overs} ov` : ''}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <span className="text-xl sm:text-2xl font-extrabold">
                                {match.teamB?.runs ?? 0}<span className="text-gray-500">/{match.teamB?.wickets ?? 0}</span>
                              </span>
                            </div>
                          </div>

                          {/* Result + Button row */}
                          <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                              {winnerName ? (
                                <span className="text-sm sm:text-base font-semibold text-green-400 truncate">
                                  {winnerName} won{ match.margin ? ` by ${match.margin}` : '' }
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">No result</span>
                              )}
                            </div>
                            <Button
                              onClick={() => navigate(`/match/${match._id}`)}
                              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0 text-xs sm:text-xs flex-shrink-0 ml-3 rounded-xl h-9 font-bold uppercase tracking-wider shadow-lg shadow-green-600/20 transition-all duration-300"
                              size="sm"
                            >
                              Scorecard <ArrowRight className="h-3 w-3 ml-1" />
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
