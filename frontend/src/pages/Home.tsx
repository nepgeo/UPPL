import React, { useEffect, useState , useRef} from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Trophy, Users, TrendingUp, ArrowRight, Crown, Crosshair, ImageIcon, Download, X, Medal, Zap, Star, Phone, Mail, CalendarDays, Target, ShieldCheck, Cpu, BadgeCheck, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { getProfileImageUrl } from '@/utils/getProfileImageUrl';
import { BASE_URL } from '@/config';

import GalleryPreview from '@/components/gallery/GalleryPreview';
import Sponsor from '@/components/Sponsor';
import WeeklyTopNews, { Article } from "@/components/WeeklyTopNews";
import Hourglass from '@/assets/Hourglass';
import PlayersPage from './PlayersPage';
import TeamMembers from "../components/TeamMembers";
import api from '@/lib/api';


interface Props {
  featuredNews: Article[];
}


const Home = () => {
  const [featuredNews, setFeaturedNews] = useState<Article[]>([]);
  const [activeSeason, setActiveSeason] = useState<any>(null);
  const [countdown, setCountdown] = useState("");
  const [isEntryClosed, setIsEntryClosed] = useState(false);
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState([
    { label: "Teams", value: "0", icon: Users },
    { label: "Matches Played", value: "0", icon: Calendar },
    { label: "Total Runs", value: "0", icon: TrendingUp },
    { label: "Tournaments", value: "0", icon: Trophy }
  ]);


  const [topBatsmen, setTopBatsmen] = useState<any[]>([]);
  const [topBowlers, setTopBowlers] = useState<any[]>([]);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [latestResult, setLatestResult] = useState<any | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("pplt20_token");
        const config: any = {};
        if (token) {
          config.headers = { Authorization: `Bearer ${token}` };
        }

        // ✅ News (public endpoint, no auth needed)
        const newsRes = await api.get("/news?status=published", config);
        const articles = newsRes.data?.articles || [];
        if (articles.length) {
          const sortedNews = articles.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setFeaturedNews(sortedNews.slice(0, 3));
        }

        // ✅ Active Season
        const activeSeasonRes = await api.get("/seasons/current", config);
        setActiveSeason(activeSeasonRes.data);

        const deadline = new Date(activeSeasonRes.data.entryDeadline).getTime();
        const updateCountdown = () => {
          const now = new Date().getTime();
          const diff = deadline - now;
          if (diff <= 0) {
            setCountdown("⏰ Entry Closed");
            setIsEntryClosed(true);
            return;
          }
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((diff / (1000 * 60)) % 60);
          const seconds = Math.floor((diff / 1000) % 60);
          setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        };
        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
      } catch (error) {
        console.error("❌ Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await api.get("/matches/live/now");
        setLiveMatches(res.data?.matches || []);
      } catch {}
    };
    fetchLive();

    const fetchResult = async () => {
      try {
        const res = await api.get("/matches/recent/completed", { params: { limit: 1 } });
        const matches = res.data?.matches || [];
        if (matches.length > 0) setLatestResult(matches[0]);
      } catch {}
    };
    fetchResult();

  }, []);

  useEffect(() => {
    if (!activeSeason?._id) return;
    api.get(`/player/top-performers?seasonId=${activeSeason._id}`).then(r => {
      setTopBatsmen(r.data.topBatsmen || []);
      setTopBowlers(r.data.topBowlers || []);
    }).catch(() => {});
  }, [activeSeason]);

  useEffect(() => {
  if (!activeSeason?._id) return; // Wait for active season

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("pplt20_token");
      const config: any = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const seasonId = activeSeason._id;

      // ---- Teams
      const teamsUrl = `/teams?seasonId=${seasonId}`;
      const teamsRes = await api.get(teamsUrl, config);
      const teamsArr = Array.isArray(teamsRes.data) ? teamsRes.data : (teamsRes.data?.teams || []);
      const totalTeams = teamsArr.filter((t: any) => t.status === "approved").length;

      // ---- Matches
      const matchesUrl = `/matches?seasonNumber=${seasonId}`;
      const matchesRes = await api.get(matchesUrl, config);
      const matchesArr = Array.isArray(matchesRes.data) ? matchesRes.data : (matchesRes.data?.matches || []);

      const completedMatches = matchesArr.filter((m: any) => m.result === "completed");
      const totalMatches = completedMatches.length;

      const totalRuns = completedMatches.reduce((sum: number, m: any) => {
        const a = m?.teamA?.runs ?? 0;
        const b = m?.teamB?.runs ?? 0;
        return sum + a + b;
      }, 0);


      console.log("Matches array:", matchesArr);

      // ---- Seasons
      let totalSeasons = 0;
      try {
        const seasonsRes = await api.get("/seasons", config);
        const seasonsArr = Array.isArray(seasonsRes.data) ? seasonsRes.data : (seasonsRes.data?.seasons || []);
        totalSeasons = seasonsArr.length;
      } catch {
        totalSeasons = Number(activeSeason?.seasonNumber) || 1;
      }

      // ---- Update stats
      setStats([
        { label: "Teams", value: totalTeams, icon: Users },
        { label: "Matches Played", value: totalMatches, icon: Calendar },
        { label: "Total Runs", value: totalRuns, icon: TrendingUp },
        { label: "Tournaments", value: totalSeasons, icon: Trophy }
      ]);

    } catch (error) {
      console.error("❌ Failed to fetch stats:", error);
    }
  };

  fetchStats();
}, [activeSeason]);

const handlePlayerClick = async (playerId: string) => {
  try {
    const res = await api.get('/player/public');
    const players = res.data?.players || [];
    const player = players.find((p: any) => p.id === playerId);
    if (player) setSelectedPlayer(player);
  } catch {}
};

const roleGradient: Record<string, string> = {
  batsman: "from-blue-500 to-cyan-500",
  bowler: "from-purple-500 to-pink-500",
  "all-rounder": "from-amber-500 to-orange-500",
  "wicket-keeper": "from-emerald-500 to-teal-500",
};

const positionIcons: Record<string, string> = {
  batsman: "🏏",
  bowler: "🏏",
  "all-rounder": "⭐",
  "wicket-keeper": "🧤",
};

const statCard = (label: string, value: string | number, accent: string) => (
  <div className={`bg-gradient-to-br ${accent} rounded-xl p-3 text-white`}>
    <div className="text-2xl font-bold">{value ?? "-"}</div>
    <div className="text-[11px] opacity-80 font-medium uppercase tracking-wider">{label}</div>
  </div>
);

const calculateAge = (dob: string | null) => {
  if (!dob) return "N/A";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "N/A";
  return `${Math.floor((Date.now() - d.getTime()) / 31557600000)} yrs`;
};

const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);




  return (
    <div className="min-h-screen">
      {/* Merged Hero */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-900 text-white overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4 py-6 md:py-10">
          <div className="text-center max-w-3xl mx-auto">
            {activeSeason && (
              <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 mb-4 shadow-lg">
                <Trophy className="h-5 w-5 text-yellow-300 flex-shrink-0" />
                <span className="text-white/70 text-base font-semibold">Season {activeSeason.seasonNumber}</span>
                <span className="text-white/30 mx-1">|</span>
                <span className="text-yellow-200 text-base font-bold">{isEntryClosed ? 'Entry Closed' : 'Registrations Open'}</span>
              </div>
            )}

            <h1 className="text-4xl md:text-6xl font-black mb-3 leading-tight">
              UPPL <span className="text-yellow-300">T20</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-6 max-w-xl mx-auto leading-relaxed">
              Where Legends Are Made — the most electrifying cricket tournament of the year.
            </p>

            <div className="flex flex-col items-center gap-3 mb-6">
              {isEntryClosed ? (
                <Button onClick={() => setShowEntryDialog(true)} size="lg" className="bg-gray-400/50 text-white cursor-not-allowed px-8 py-3 font-bold text-lg rounded-xl">ENTRY CLOSED</Button>
              ) : (
                <Link to="/tournament-registration">
                  <Button size="lg" className="bg-yellow-300 text-purple-900 hover:bg-white transition-all duration-300 font-bold text-lg px-10 py-3 shadow-2xl rounded-xl animate-bounce hover:animate-none [animation-duration:2.5s]">
                    <ArrowRight className="mr-2 h-5 w-5" />
                    <span className="tracking-wider">ENTRY NOW</span>
                  </Button>
                </Link>
              )}
              {activeSeason && (
                <p className="text-white/70 text-sm">Entry ends in <span className="text-yellow-300 font-semibold">{countdown}</span></p>
              )}
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.map((stat, i) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 p-3 text-center hover:bg-white/15 transition-colors">
                  <stat.icon className="h-5 w-5 mx-auto mb-1 text-yellow-300" />
                  <div className="text-2xl md:text-3xl font-black">{stat.value}</div>
                  <p className="text-xs text-white/60 uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Top Performers */}
      {(topBatsmen.length > 0 || topBowlers.length > 0) && (
        <section className="py-12 sm:py-16 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-10"
            >
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
                <Zap className="h-3.5 w-3.5" />
                Leaderboard
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">TOP PERFORMERS</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-orange-400 to-purple-500 mx-auto mt-3 rounded-full" />
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {/* Orange Cap — Most Runs */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-lg border border-orange-100/50 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* Card Header */}
                  <div className="relative px-5 sm:px-6 py-4 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
                    <div className="relative flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                        <Crown className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Orange Cap</h3>
                        <p className="text-[11px] text-white/70 font-medium">Most Runs</p>
                      </div>
                      <div className="ml-auto bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="text-xs font-bold text-white">{topBatsmen.length} Players</span>
                      </div>
                    </div>
                  </div>

                  {/* #1 Hero — top batsman */}
                  {topBatsmen[0] && (
                    <div className="relative px-5 sm:px-6 py-6 flex flex-col items-center text-center bg-gradient-to-b from-orange-50/50 to-white border-b border-orange-100/50">
                      <div className="absolute top-3 right-4">
                        <div className="flex items-center gap-1 bg-orange-100 text-orange-600 rounded-full px-2.5 py-0.5">
                          <Medal className="h-3 w-3" />
                          <span className="text-[10px] font-bold">#1</span>
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-orange-200 to-amber-100 flex items-center justify-center overflow-hidden shadow-lg mb-3 ring-4 ring-orange-200/50 cursor-pointer"
                        onClick={() => handlePlayerClick(topBatsmen[0].id)}
                      >
                        {topBatsmen[0].profilePicture ? (
                          <img src={getProfileImageUrl(topBatsmen[0].profilePicture)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl sm:text-3xl font-black text-orange-600/60">{topBatsmen[0].name.charAt(0)}</span>
                        )}
                      </motion.div>
                      <p className="text-sm sm:text-base font-bold text-gray-900 mb-3 cursor-pointer hover:text-orange-600 transition-colors" onClick={() => handlePlayerClick(topBatsmen[0].id)}>{topBatsmen[0].name}</p>
                      <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full max-w-xs">
                        {[
                          { value: topBatsmen[0].careerStats.runs, label: 'Runs', color: 'text-orange-600' },
                          { value: topBatsmen[0].careerStats.average > 0 ? topBatsmen[0].careerStats.average.toFixed(1) : '-', label: 'Avg', color: 'text-gray-800' },
                          { value: topBatsmen[0].careerStats.strikeRate > 0 ? topBatsmen[0].careerStats.strikeRate.toFixed(1) : '-', label: 'SR', color: 'text-gray-800' },
                          { value: topBatsmen[0].careerStats.matches, label: 'Mat', color: 'text-gray-800' },
                        ].map((stat, si) => (
                          <div key={si} className="text-center">
                            <p className={`text-lg sm:text-2xl font-black ${stat.color}`}>{stat.value}</p>
                            <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider font-medium">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* #2-5 list */}
                  <div className="divide-y divide-gray-50">
                    {topBatsmen.slice(1, 5).map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.1 * (i + 1) }}
                        whileHover={{ backgroundColor: 'rgba(255, 247, 237, 0.5)' }}
                        className="flex items-center gap-3 px-5 sm:px-6 py-3 cursor-default"
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          i === 0 ? 'bg-gray-200 text-gray-600' :
                          i === 1 ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-50 text-gray-400'
                        }`}>{i + 2}</span>
                        <div className="w-9 h-9 rounded-xl bg-orange-50 flex-shrink-0 flex items-center justify-center overflow-hidden ring-2 ring-orange-100 cursor-pointer" onClick={() => handlePlayerClick(p.id)}>
                          {p.profilePicture ? (
                            <img src={getProfileImageUrl(p.profilePicture)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-orange-400">{p.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate cursor-pointer hover:text-orange-600 transition-colors" onClick={() => handlePlayerClick(p.id)}>{p.name}</p>
                          <p className="text-[10px] text-gray-400">{p.careerStats.matches} Mat &middot; Avg {p.careerStats.average > 0 ? p.careerStats.average.toFixed(1) : '-'}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-black text-orange-600">{p.careerStats.runs}</p>
                          <p className="text-[9px] text-gray-400 uppercase">runs</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Purple Cap — Most Wickets */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-lg border border-purple-100/50 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* Card Header */}
                  <div className="relative px-5 sm:px-6 py-4 bg-gradient-to-r from-purple-600 via-purple-500 to-violet-500">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
                    <div className="relative flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                        <Crosshair className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Purple Cap</h3>
                        <p className="text-[11px] text-white/70 font-medium">Most Wickets</p>
                      </div>
                      <div className="ml-auto bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="text-xs font-bold text-white">{topBowlers.length} Players</span>
                      </div>
                    </div>
                  </div>

                  {/* #1 Hero — top bowler */}
                  {topBowlers[0] && (
                    <div className="relative px-5 sm:px-6 py-6 flex flex-col items-center text-center bg-gradient-to-b from-purple-50/50 to-white border-b border-purple-100/50">
                      <div className="absolute top-3 right-4">
                        <div className="flex items-center gap-1 bg-purple-100 text-purple-600 rounded-full px-2.5 py-0.5">
                          <Medal className="h-3 w-3" />
                          <span className="text-[10px] font-bold">#1</span>
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-purple-200 to-violet-100 flex items-center justify-center overflow-hidden shadow-lg mb-3 ring-4 ring-purple-200/50 cursor-pointer"
                        onClick={() => handlePlayerClick(topBowlers[0].id)}
                      >
                        {topBowlers[0].profilePicture ? (
                          <img src={getProfileImageUrl(topBowlers[0].profilePicture)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl sm:text-3xl font-black text-purple-600/60">{topBowlers[0].name.charAt(0)}</span>
                        )}
                      </motion.div>
                      <p className="text-sm sm:text-base font-bold text-gray-900 mb-3 cursor-pointer hover:text-purple-600 transition-colors" onClick={() => handlePlayerClick(topBowlers[0].id)}>{topBowlers[0].name}</p>
                      <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full max-w-xs">
                        {[
                          { value: topBowlers[0].careerStats.wickets, label: 'Wkts', color: 'text-purple-600' },
                          { value: topBowlers[0].careerStats.economy > 0 ? topBowlers[0].careerStats.economy.toFixed(1) : '-', label: 'Econ', color: 'text-gray-800' },
                          { value: topBowlers[0].careerStats.average > 0 ? topBowlers[0].careerStats.average.toFixed(1) : '-', label: 'Avg', color: 'text-gray-800' },
                          { value: topBowlers[0].careerStats.matches, label: 'Mat', color: 'text-gray-800' },
                        ].map((stat, si) => (
                          <div key={si} className="text-center">
                            <p className={`text-lg sm:text-2xl font-black ${stat.color}`}>{stat.value}</p>
                            <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider font-medium">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* #2-5 list */}
                  <div className="divide-y divide-gray-50">
                    {topBowlers.slice(1, 5).map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.1 * (i + 1) }}
                        whileHover={{ backgroundColor: 'rgba(245, 243, 255, 0.5)' }}
                        className="flex items-center gap-3 px-5 sm:px-6 py-3 cursor-default"
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          i === 0 ? 'bg-gray-200 text-gray-600' :
                          i === 1 ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-50 text-gray-400'
                        }`}>{i + 2}</span>
                        <div className="w-9 h-9 rounded-xl bg-purple-50 flex-shrink-0 flex items-center justify-center overflow-hidden ring-2 ring-purple-100 cursor-pointer" onClick={() => handlePlayerClick(p.id)}>
                          {p.profilePicture ? (
                            <img src={getProfileImageUrl(p.profilePicture)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-purple-400">{p.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate cursor-pointer hover:text-purple-600 transition-colors" onClick={() => handlePlayerClick(p.id)}>{p.name}</p>
                          <p className="text-[10px] text-gray-400">{p.careerStats.matches} Mat &middot; Econ {p.careerStats.economy > 0 ? p.careerStats.economy.toFixed(1) : '-'}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-black text-purple-600">{p.careerStats.wickets}</p>
                          <p className="text-[9px] text-gray-400 uppercase">wkts</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-center mt-8"
            >
              <Link
                to="/tournament-stats"
                className="group inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-purple-700 transition-all duration-300 hover:scale-105"
              >
                <Star className="h-4 w-4" />
                View Full Leaderboard
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Latest Result */}
      {latestResult && (
        <section className="py-10">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center text-white shadow-sm">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-extrabold text-green-700 uppercase tracking-widest">Latest Result</h3>
              </div>

              {/* Body */}
              <div className="px-4 sm:px-6 py-4 sm:py-6">
                <div className="flex items-center justify-center gap-4 sm:gap-8">
                  {/* Team A */}
                  <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm ring-2 ring-offset-1 ring-gray-200">
                      {latestResult.teamA?.teamLogo ? <img src={getTeamLogoUrl(latestResult.teamA.teamLogo)} alt="" className="w-full h-full object-cover" /> : <span className="text-base sm:text-lg font-bold text-gray-500">{latestResult.teamA?.teamName?.charAt(0)}</span>}
                    </div>
                    <p className={`text-sm sm:text-base font-bold text-center truncate max-w-[100px] ${latestResult.winner === 'teamA' ? 'text-green-700' : 'text-gray-700'}`}>{latestResult.teamA?.teamName}</p>
                    <p className="text-2xl sm:text-3xl font-black text-gray-900">
                      {latestResult.score?.teamA?.runs ?? latestResult.teamAResult?.runs ?? 0}
                      <span className="text-base sm:text-lg font-bold text-gray-500">/{latestResult.score?.teamA?.wickets ?? latestResult.teamAResult?.wickets ?? 0}</span>
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-400">({latestResult.score?.teamA?.overs ?? latestResult.teamAResult?.overs ?? '0'} ov)</p>
                  </div>

                  {/* VS */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <span className="text-[11px] sm:text-[13px] font-bold text-gray-400 uppercase tracking-widest">vs</span>
                  </div>

                  {/* Team B */}
                  <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm ring-2 ring-offset-1 ring-gray-200">
                      {latestResult.teamB?.teamLogo ? <img src={getTeamLogoUrl(latestResult.teamB.teamLogo)} alt="" className="w-full h-full object-cover" /> : <span className="text-base sm:text-lg font-bold text-gray-500">{latestResult.teamB?.teamName?.charAt(0)}</span>}
                    </div>
                    <p className={`text-sm sm:text-base font-bold text-center truncate max-w-[100px] ${latestResult.winner === 'teamB' ? 'text-green-700' : 'text-gray-700'}`}>{latestResult.teamB?.teamName}</p>
                    <p className="text-2xl sm:text-3xl font-black text-gray-900">
                      {latestResult.score?.teamB?.runs ?? latestResult.teamBResult?.runs ?? 0}
                      <span className="text-base sm:text-lg font-bold text-gray-500">/{latestResult.score?.teamB?.wickets ?? latestResult.teamBResult?.wickets ?? 0}</span>
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-400">({latestResult.score?.teamB?.overs ?? latestResult.teamBResult?.overs ?? '0'} ov)</p>
                  </div>
                </div>

                {/* Winner line */}
                <div className="mt-6 pt-5 border-t border-dashed border-gray-200 text-center">
                  <p className="text-sm font-bold text-green-600">
                    {latestResult.winner === 'teamA' ? latestResult.teamA?.teamName : latestResult.teamB?.teamName} won
                    {latestResult.margin ? ` by ${latestResult.margin}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured News */}
      <WeeklyTopNews featuredNews={featuredNews} />

      {/* Gallery Card */}
      <GalleryPreview />
      <GalleryCard />
      <div className="pb-0 mb-0">
        <Sponsor />
      </div>

       



      {/* Quick Actions */}
      <section className="pt-4 md:pt-8 pb-8">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 sm:p-8 text-white">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-10 items-center">
              
              {/* Left: Join the Community */}
              <div className="text-center md:text-left">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">Join the UPPL T20 Community</h2>
                <p className="text-sm sm:text-base md:text-lg mb-6 opacity-90">
                  Get exclusive updates, player insights, and behind-the-scenes content.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 md:justify-start justify-center">
                  <Link to="/register">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                      Register as Fan
                    </Button>
                  </Link>
                  <Link to="/register?type=player">
                    <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-100">
                      Register as Player
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right: Become a Sponsor */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 text-center">
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2">Become a Sponsor</h3>
                <p className="mb-4 sm:mb-6 text-white/90 text-xs sm:text-sm">
                  Join our amazing community of sponsors and help us continue building incredible experiences.
                  Your support makes all the difference.
                </p>
                <Link to="/sponsors">
                  <button className="bg-white text-blue-600 px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors duration-300 shadow-md hover:shadow-lg text-sm">
                    Contact Us
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TeamMembers />


      {showEntryDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Entry Closed</h3>
            <p className="text-gray-600 mb-4">
              The tournament entry period has ended. Please contact administrators or UPPL team members for further information.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setShowEntryDialog(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Player Detail Dialog */}
      <AnimatePresence>
        {selectedPlayer && (
          <Dialog open={!!selectedPlayer} onOpenChange={(v) => { if (!v) setSelectedPlayer(null); }}>
            <DialogContent hideClose className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                {/* Hero Banner */}
                <div className={`relative bg-gradient-to-r ${roleGradient[selectedPlayer.position?.toLowerCase()] || "from-gray-700 to-gray-900"} px-6 sm:px-8 py-8 sm:py-10 overflow-hidden`}>
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 relative z-[1]">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-white/30 shadow-xl flex-shrink-0">
                      {selectedPlayer.profilePicture ? (
                        <img src={getProfileImageUrl(selectedPlayer.profilePicture)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white">{getInitials(selectedPlayer.name)}</div>
                      )}
                    </div>
                    <div className="text-center sm:text-left text-white flex-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h2 className="text-2xl sm:text-3xl font-bold">{selectedPlayer.name}</h2>
                        <BadgeCheck className="w-5 h-5 text-blue-300 shrink-0" />
                      </div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                        <span className="text-sm text-white/80 font-mono">#{selectedPlayer.playerCode}</span>
                        <span className="w-1 h-1 rounded-full bg-white/40" />
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/15 text-white/90">
                          <Award className="w-3 h-3" />
                          {selectedPlayer.position}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-white/70">
                        {selectedPlayer.dateOfBirth && <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {calculateAge(selectedPlayer.dateOfBirth)}</span>}
                        {selectedPlayer.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {selectedPlayer.phone}</span>}
                        <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {selectedPlayer.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {statCard("Matches", selectedPlayer.careerStats?.matches ?? 0, "from-blue-600 to-blue-700")}
                    {statCard("Runs", selectedPlayer.careerStats?.runs ?? 0, "from-emerald-600 to-emerald-700")}
                    {statCard("Wickets", selectedPlayer.careerStats?.wickets ?? 0, "from-purple-600 to-purple-700")}
                    {statCard("Catches", selectedPlayer.careerStats?.catches ?? 0, "from-amber-600 to-amber-700")}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-blue-100 rounded-lg"><Target className="w-4 h-4 text-blue-600" /></div>
                        <span className="text-sm font-semibold text-gray-700">Batting Style</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{selectedPlayer.battingStyle || "N/A"}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-purple-100 rounded-lg"><Cpu className="w-4 h-4 text-purple-600" /></div>
                        <span className="text-sm font-semibold text-gray-700">Bowling Style</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{selectedPlayer.bowlingStyle || "N/A"}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-1 h-5 rounded-full bg-emerald-500" /> Batting Career
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {[
                        { label: "Innings", value: selectedPlayer.careerStats?.innings },
                        { label: "Runs", value: selectedPlayer.careerStats?.runs },
                        { label: "HS", value: selectedPlayer.careerStats?.highestScore },
                        { label: "Avg", value: selectedPlayer.careerStats?.average?.toFixed(1) },
                        { label: "SR", value: selectedPlayer.careerStats?.strikeRate?.toFixed(1) },
                        { label: "Not Outs", value: selectedPlayer.careerStats?.notOuts },
                      ].map((s) => (
                        <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                          <div className="text-lg font-bold text-gray-900">{s.value ?? "-"}</div>
                          <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      {[
                        { label: "Fours", value: selectedPlayer.careerStats?.fours, color: "text-blue-600" },
                        { label: "Sixes", value: selectedPlayer.careerStats?.sixes, color: "text-purple-600" },
                        { label: "Balls Faced", value: selectedPlayer.careerStats?.ballsFaced, color: "text-gray-600" },
                        { label: "50s/100s", value: `${Math.floor((selectedPlayer.careerStats?.runs || 0) / 100)}/${Math.floor((selectedPlayer.careerStats?.runs || 0) / 50)}`, color: "text-amber-600" },
                      ].map((s) => (
                        <div key={s.label} className="bg-white rounded-xl p-3 text-center border border-gray-100">
                          <div className={`text-lg font-bold ${s.color}`}>{s.value ?? "-"}</div>
                          <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-1 h-5 rounded-full bg-purple-500" /> Bowling Career
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Wickets", value: selectedPlayer.careerStats?.wickets },
                        { label: "Balls Bowled", value: selectedPlayer.careerStats?.ballsBowled },
                        { label: "Runs Conceded", value: selectedPlayer.careerStats?.runsConceded },
                        { label: "Economy", value: selectedPlayer.careerStats?.economy?.toFixed(1) },
                      ].map((s) => (
                        <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                          <div className="text-lg font-bold text-gray-900">{s.value ?? "-"}</div>
                          <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 p-4 flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Best Bowling</div>
                          <div className="text-lg font-bold text-gray-900">{selectedPlayer.careerStats?.bestBowlingWickets || "-"}/{selectedPlayer.careerStats?.bestBowlingRuns || "-"}</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-100 p-4 flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-amber-600" />
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Fielding</div>
                          <div className="text-lg font-bold text-gray-900">{selectedPlayer.careerStats?.catches || 0} ct / {selectedPlayer.careerStats?.stumpings || 0} st</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedPlayer.bio && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-gray-500" /> About
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">{selectedPlayer.bio}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;

interface GalleryImage {
  _id: string;
  title: string;
  image: { url: string; public_id: string };
  album: string;
}

const getGalleryImageUrl = (img: any): string => {
  if (!img) return '';
  if (typeof img === 'string') {
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    return `${BASE_URL}/${img.replace(/\\/g, '/')}`;
  }
  return img.secure_url || img.url || '';
};

function getTeamLogoUrl(logo: any): string {
  if (!logo) return '';
  const BASE_URL = 'http://localhost:5000';
  if (typeof logo === 'string') {
    if (logo.startsWith('data:') || logo.startsWith('http')) return logo;
    return `${BASE_URL}/${logo.replace(/\\/g, '/')}`;
  }
  return logo.secure_url || logo.url || '';
}

function GalleryCard() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sideStart, setSideStart] = useState(1);
  const [preview, setPreview] = useState<GalleryImage | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/gallery/images?limit=10');
        setImages(res.data || []);
        if ((res.data || []).length === 0) {
          const fallback = await api.get('/gallery/images?limit=10&public=true');
          setImages(fallback.data || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  const total = images.length;
  const featured = images[0];
  const hasImages = !loading && total > 0;
  const sidePool = images.slice(1);
  const sideCount = sidePool.length;
  const sideSlots = 2;

  // Cycle side images every 5 seconds
  useEffect(() => {
    if (sideCount < 1) return;
    const interval = setInterval(() => {
      setSideStart(prev => (prev + 1) % sideCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [sideCount]);

  const sideDisplay: (GalleryImage | null)[] = [];
  for (let i = 0; i < sideSlots; i++) {
    const idx = (sideStart + i) % sideCount;
    sideDisplay.push(sidePool[idx] || null);
  }

  const downloadImage = async (img: GalleryImage) => {
    const url = getGalleryImageUrl(img.image);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = img.title || 'gallery-image';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <section className="py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            </div>
          ) : !hasImages ? (
            <Link to="/gallery" className="block p-10 text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 mb-4 group-hover:scale-110 transition-transform duration-300">
                <ImageIcon className="h-8 w-8 text-indigo-400" />
              </div>
              <p className="text-gray-500 font-medium text-sm">No gallery images yet</p>
              <p className="text-gray-400 text-xs mt-1">Be the first to add one</p>
            </Link>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-extrabold text-indigo-700 uppercase tracking-widest">Gallery</h3>
                <p className="text-[11px] text-indigo-400 font-medium flex-1">Memorable Moments</p>
                <Link
                  to="/gallery"
                  className="text-xs font-semibold text-indigo-600 hover:text-white bg-white/80 hover:bg-indigo-600 px-3.5 py-1.5 rounded-lg transition-all border border-indigo-200 hover:border-indigo-600 shadow-sm hover:shadow"
                >
                  View All
                </Link>
              </div>

              {/* 3 image cards */}
              <div className="grid grid-cols-3 gap-1 p-1">
                {/* Featured (first) */}
                <button
                  onClick={() => setPreview(featured)}
                  className="col-span-2 row-span-2 relative rounded-xl overflow-hidden bg-gray-100 group cursor-pointer text-left min-h-[180px] sm:min-h-[280px]"
                >
                  <img
                    src={getGalleryImageUrl(featured.image)}
                    alt={featured.title}
                    className="w-full h-full absolute inset-0 object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300 bg-black/40 px-2.5 py-1 rounded-full">Featured</span>
                    <p className="text-white text-base font-bold mt-2 drop-shadow-lg line-clamp-1">{featured.title}</p>
                  </div>
                </button>

                {/* Side images (next 2) */}
                {sideDisplay.slice(0, 2).map((img, i) => img && (
                  <button
                    key={`${img._id}-${sideStart}-${i}`}
                    onClick={() => setPreview(img)}
                    className="relative rounded-xl overflow-hidden bg-gray-100 group cursor-pointer text-left animate-fade-in"
                  >
                    <img
                      src={getGalleryImageUrl(img.image)}
                      alt={img.title}
                      className="w-full h-full absolute inset-0 object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                      onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-xs font-semibold drop-shadow-lg line-clamp-1">{img.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/60 to-transparent">
              <p className="text-white text-sm font-semibold truncate pr-4">{preview.title}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadImage(preview)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all backdrop-blur-sm border border-white/20"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Image */}
            <img
              src={getGalleryImageUrl(preview.image)}
              alt={preview.title}
              className="w-full h-full max-h-[85vh] object-contain"
            />

            {/* Bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 z-10 px-5 py-3 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white/60 text-[11px]">Click outside to close</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
