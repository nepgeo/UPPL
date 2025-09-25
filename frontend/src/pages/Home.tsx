import React, { useEffect, useState , useRef} from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Trophy, Users, TrendingUp, Play, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("pplt20_token");
        const config: any = {};
        if (token) {
          config.headers = { Authorization: `Bearer ${token}` };
        }

        // ✅ News
        if (token) {
          const newsRes = await api.get("/news", config);
          const sortedNews = Array.isArray(newsRes.data)
            ? newsRes.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            : [];
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
      const matchesUrl = `/matches?seasonId=${seasonId}`;
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




  return (
    <div className="min-h-screen">
      {/* Tournament Season 5 Card */}
      <section className="py-4 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="container mx-auto px-4">
          <Card className="w-full relative overflow-hidden bg-gradient-to-l from-[#fb7185] via-[#a21caf] to-[#6366f1] text-white border-none shadow-2xl">
            {/* Removed hover/scale/rotate animations from card */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/30"></div>
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/15 rounded-full blur-xl"></div>
            <div className="absolute -bottom-3 -left-3 w-16 h-16 bg-black/15 rounded-full blur-lg"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-300/10 rounded-full blur-2xl"></div>

            <CardContent className="p-6 md:p-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <Star className="h-7 w-7 text-yellow-200 drop-shadow-lg animate-pulse" />
                    <h3 className="font-bold text-2xl md:text-3xl drop-shadow-md">
                      {activeSeason
                        ? `Tournament Season ${activeSeason.seasonNumber}`
                        : "Loading Season..."}
                    </h3>
                  </div>
                  <p className="text-base md:text-lg opacity-90 drop-shadow-sm">
                    Register your team now and join the ultimate cricket experience!
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  {isEntryClosed ? (
                    <Button
                      onClick={() => setShowEntryDialog(true)}
                      size="lg"
                      className="bg-gray-300 text-gray-600 cursor-not-allowed px-8 py-4 font-bold text-lg shadow-lg"
                    >
                      ENTRY CLOSED
                    </Button>
                  ) : (
                    <Link to="/tournament-registration" className="group/button">
                      <Button
                        size="lg"
                        className="bg-white/95 text-orange-600 hover:bg-white hover:text-orange-700 transition-all duration-300 font-bold text-lg px-8 py-4 shadow-xl hover:shadow-2xl transform hover:scale-110 hover:-rotate-2 border-3 border-white/60 hover:border-white group-hover/button:animate-bounce backdrop-blur-sm"
                      >
                        <span className="tracking-wider">ENTRY</span>
                        <ArrowRight className="ml-2 h-5 w-5 group-hover/button:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                  )}

                  {activeSeason && (
                    <p className="text-white text-sm opacity-90 mt-1 drop-shadow-sm">
                      ⏳ <span className="text-yellow-400 text-lg font-semibold">Entry Ends In:</span>{" "}
                      <span className="font-semibold">{countdown}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>





      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to <span className="text-yellow-300">UPPL</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Udaydev Patan Premiere League T20 - Where cricket meets entertainment in the most electrifying tournament of the year.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* <Link to="/live-scores">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Live
                </Button>
              </Link> */}
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Live
              </Button>
              <Link to="/schedule">
                <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20">
                  View Fixtures
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-stretch">
            {stats.map((stat, index) => {
              const shadows = [
                "0 4px 8px -2px rgba(255, 80, 122, 0.5), 0 8px 16px -4px rgba(0, 123, 255, 0.3)",
                "0 4px 12px -3px rgba(0, 200, 83, 0.5), 0 8px 20px -6px rgba(255, 235, 59, 0.3)",
                "0 4px 10px -2px rgba(155, 89, 182, 0.5), 0 8px 18px -5px rgba(255, 255, 255, 0.2)",
                "0 5px 15px -4px rgba(255, 152, 0, 0.5), 0 10px 25px -8px rgba(103, 58, 183, 0.3)"
              ];
              const boxShadowValue = shadows[index % shadows.length];

              return (
                <div key={index} className="relative group h-full">
                  <Card
                    style={{ boxShadow: boxShadowValue }}
                    className="h-full flex flex-col justify-center text-center transition-transform cursor-pointer rounded-lg hover:flip-scale-down-hor-normal"
                  >
                    <Link
                      to={
                        index === 0
                          ? "/teams"
                          : index === 1
                          ? "/schedule"
                          : "/tournament-stats"
                      }
                    >
                      <CardContent className="flex flex-col justify-center pt-6 h-full">
                        <stat.icon className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                        <div className="text-3xl font-bold text-gray-900">
                          {stat.value}
                        </div>
                        <p className="text-gray-600">{stat.label}</p>
                      </CardContent>
                    </Link>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>




      {/* Upcoming Matches */}
      {/* <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Upcoming Matches</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Don't miss the action! Here are the next exciting matches in the PPLT20 tournament.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {upcomingMatches.map((match) => (
              <Card key={match.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link to={`/match/${match.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="text-blue-600">
                        {match.date} at {match.time}
                      </Badge>
                      <Badge variant="secondary">Upcoming</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-lg font-semibold">{match.teamA}</div>
                        <div className="text-2xl font-bold text-gray-400">VS</div>
                        <div className="text-lg font-semibold">{match.teamB}</div>
                      </div>
                      <p className="text-gray-600">{match.venue}</p>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Link to="/schedule">
              <Button variant="outline">
                View All Fixtures
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section> */}

      {/* Featured News */}
      {/* Latest News Section (Updated) */}
      <WeeklyTopNews featuredNews={featuredNews} />
      

      <GalleryPreview />
      <Sponsor />

       



      {/* Quick Actions */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              
              {/* Left: Join the Community */}
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold mb-4">Join the UPPL T20 Community</h2>
                <p className="text-lg mb-8 opacity-90">
                  Get exclusive updates, player insights, and behind-the-scenes content.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 md:justify-start justify-center">
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
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center">
                <h3 className="text-2xl font-semibold mb-2">Become a Sponsor</h3>
                <p className="mb-6 text-white/90 text-sm">
                  Join our amazing community of sponsors and help us continue building incredible experiences.
                  Your support makes all the difference.
                </p>
                <button className="bg-white text-blue-600 px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors duration-300 shadow-md hover:shadow-lg text-sm">
                  Contact Us
                </button>
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
    </div>
  );
};

export default Home;
