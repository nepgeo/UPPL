import React, { useEffect, useState } from 'react';
import { API_BASE, BASE_URL } from '@/config';
import {
  Users, UserCheck, Calendar, Trophy, FileText, Settings, Activity,
  Clock, CheckCircle, XCircle, AlertCircle, Images, Film,
  ArrowRight, Plus, LayoutDashboard, PanelLeftClose, PanelLeftOpen,
  BarChart3, UserPlus, List, Video, Image
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { getAdminDashboard } from '@/services/adminService';
import { approvePlayer, rejectPlayer } from '@/services/playerVerificationService';

import NewsManagement from '@/pages/admin/NewsManagement';
import GalleryManagement from '@/pages/admin/GalleryManagement';
import SponsorManagement from '@/pages/admin/SponsorManagement';
import TeamManagement from '@/pages/admin/TeamManagement';
import PlayerVerification from './playerVerification';
import ScheduleMatch from '@/pages/admin/ScheduleMatch';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TabsContent as InnerTabsContent } from "@/components/ui/tabs";
import BatIcon from "@/assets/icons/bat.png";
import BallIcon from "@/assets/icons/ball.png";
import AllRounderIcon from "@/assets/icons/all.png";
import GlovesIcon from "@/assets/icons/gloves.png";
import CapIcon from "@/assets/icons/cap.png"; 
import { useLocation } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import getProfileImageUrl  from "@/utils/getProfileImageUrl";
import VideoManagement from "@/pages/admin/VideoManagement";
import UsersManagement from "@/pages/admin/UsersManagement";


const roleIcon = (roleRaw?: string) => {
  const role = (roleRaw || "").toLowerCase();
  switch (role) {
    case "batsman":
      return <img src={BatIcon} alt="Batsman" className="w-5 h-5 inline-block" />;
    case "bowler":
      return <img src={BallIcon} alt="Bowler" className="w-5 h-5 inline-block" />;
    case "all-rounder":
      return <img src={AllRounderIcon} alt="All Rounder" className="w-5 h-5 inline-block" />;
    case "wicketkeeper":
    case "wicket-keeper":
    case "wk":
      return <img src={GlovesIcon} alt="Wicket Keeper" className="w-5 h-5 inline-block" />;
    case "captain": // 🆕 Added captain
      return <img src={CapIcon} alt="Captain" className="w-5 h-5 inline-block" />;
    default:
      return "❓";
  }
};


const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const tabFromUrl = query.get("tab") || "overview";


  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  

useEffect(() => {
  getAdminDashboard()
    .then((res) => {
      const normalizedPlayers = (res.pendingPlayersList ?? []).map((p: any) => ({
        id: p._id || p.id || (p.userId?._id ?? p.userId),
        name: p.name ?? "Unknown",
        email: p.email ?? "No Email",
        phone: p.phone ?? "N/A",
        position: p.position ?? "Unknown",
        battingStyle: p.battingStyle ?? "N/A",
        bowlingStyle: p.bowlingStyle ?? "N/A",
        profilePicture: getProfileImageUrl(p.profileImage),
        submittedAt: p.submittedAt ?? "N/A",
        documents: (p.documents ?? []).map((doc: any) => ({
          url: getProfileImageUrl(doc),
          public_id: doc.public_id ?? null,
        })),
        role: p.role ?? "player",
      }));
      setDashboardData({ ...res, pendingPlayersList: normalizedPlayers });
    })
    .catch((err) => {
      console.error("Failed to fetch dashboard data", err);
    });
}, []);


  const pendingPlayers = dashboardData?.pendingPlayersList ?? [];

  const handleApprovePlayer = async (playerId: string) => {
    try {
      await approvePlayer(playerId);
      toast({
        title: 'Player Approved',
        description: 'Player has been successfully verified.',
      });

      // Refresh dashboard data
      const res = await getAdminDashboard();
      const normalizedPlayers = (res.pendingPlayersList ?? []).map((p: any) => ({
        id: p.id || p._id || (p.userId?._id ?? p.userId),
        name: p.name ?? 'Unknown',
        email: p.email ?? 'No Email',
        phone: p.phone ?? 'N/A',
        position: p.position ?? 'Unknown',
        battingStyle: p.battingStyle ?? 'N/A',
        bowlingStyle: p.bowlingStyle ?? 'N/A',
        profilePicture: p.profileImage ?? '',
        citizenshipFront: p.citizenshipFront ?? '',
        citizenshipBack: p.citizenshipBack ?? '',
        submittedAt: p.submittedAt ?? 'N/A',
        documents: p.documents ?? [],
        role: p.role ?? 'player'
      }));
      setDashboardData({
        ...res,
        pendingPlayersList: normalizedPlayers,
        pendingPlayers: normalizedPlayers.length, // <- update count
      });

    } catch (err) {
      console.error('Error approving player', err);
      toast({
        title: 'Error',
        description: 'Failed to approve player',
        variant: 'destructive',
      });
    }
  };

  const handleRejectPlayer = async (playerId: string) => {
    try {
      await rejectPlayer(playerId);
      toast({
        title: 'Player Rejected',
        description: 'Player has been rejected and downgraded.',
      });

      // ✅ Optimistically remove the rejected user
      setDashboardData((prev: any) => {
        const filteredPlayers = (prev.pendingPlayersList ?? []).filter(
          (player: any) =>
            player.id !== playerId && player._id !== playerId && player.userId !== playerId
        );
        return {
          ...prev,
          pendingPlayersList: filteredPlayers,
          pendingPlayers: filteredPlayers.length,
        };
      });

      // Optionally refetch to confirm backend state
      const res = await getAdminDashboard();
      const normalizedPlayers = (res.pendingPlayersList ?? []).map((p: any) => ({
        id: p.id || p._id || p.userId,
        name: p.name ?? 'Unknown',
        email: p.email ?? 'No Email',
        phone: p.phone ?? 'N/A',
        position: p.position ?? 'Unknown',
        battingStyle: p.battingStyle ?? 'N/A',
        bowlingStyle: p.bowlingStyle ?? 'N/A',
        profilePicture: p.profileImage ?? '',
        citizenshipFront: p.citizenshipFront ?? '',
        citizenshipBack: p.citizenshipBack ?? '',
        submittedAt: p.submittedAt ?? 'N/A',
        documents: p.documents ?? [],
        role: p.role ?? 'player'
      }));
      
      setDashboardData({
        ...res,
        pendingPlayersList: normalizedPlayers,
        pendingPlayers: normalizedPlayers.length,
      });

    } catch (err) {
      console.error('Error rejecting player', err);
      toast({
        title: 'Error',
        description: 'Failed to reject player',
        variant: 'destructive',
      });
    }
  };




  const handleStatsCardClick = (routeOrFn: string | undefined | (() => void)) => {
    if (typeof routeOrFn === 'function') {
      routeOrFn(); // 🔁 call tab switch
    } else if (typeof routeOrFn === 'string') {
      navigate(routeOrFn);
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'super-admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg animate-fade-in">
            {/* Left: Animated Title + Welcome */}
            <div>
              <h1
                className="hidden md:block text-3xl font-extrabold text-white tracking-tight font-mono whitespace-nowrap overflow-hidden border-r-4 border-white pr-2 animate-typing-loop"
              >
                <span className="uppercase">Admin Dashboard</span>
              </h1>

              <p className="mt-1 text-blue-100 text-sm animate-slide-up">
                Welcome back, <span className="font-semibold text-white">{user?.name}</span>
              </p>
            </div>

            {/* Right: Status */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex gap-6">

            {/* Desktop Sidebar */}
            <aside className={`hidden lg:flex flex-col ${sidebarCollapsed ? 'w-16' : 'w-56'} shrink-0 transition-all duration-300`}>
              <nav className="bg-white rounded-xl shadow-md overflow-hidden sticky top-24">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-3.5 flex items-center justify-between">
                  {!sidebarCollapsed && (
                    <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Navigation</p>
                  )}
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={`text-gray-300 hover:text-white transition-colors ${sidebarCollapsed ? 'mx-auto' : ''}`}
                    title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                  </button>
                </div>
                <div className="p-2 space-y-0.5">
                  {[
                    { value: "overview", label: "Overview", icon: LayoutDashboard },
                    { value: "users", label: "Total Users", icon: Users },
                    { value: "players", label: "Verifications", icon: UserCheck, badge: dashboardData?.pendingPlayers },
                    { value: "teams", label: "Season", icon: Trophy },
                    { value: "matches", label: "Schedule", icon: Calendar },
                    { value: "gallery", label: "Gallery", icon: Images, badge: dashboardData?.contentStats?.totalGalleryImages },
                    { value: "news", label: "News", icon: FileText, badge: dashboardData?.contentStats?.draftNews },
                    { value: "sponsor", label: "Sponsor", icon: Settings },
                    { value: "videos", label: "Videos", icon: Film, badge: dashboardData?.contentStats?.totalVideos },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.value;
                    const showBadge = item.badge !== undefined && item.badge > 0;
                    return (
                      <button
                        key={item.value}
                        onClick={() => setActiveTab(item.value)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                          ${isActive
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }
                          ${sidebarCollapsed ? 'justify-center px-0' : ''}
                        `}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <Icon className="w-4.5 h-4.5 shrink-0" />
                        {!sidebarCollapsed && <span className="truncate uppercase">{item.label}</span>}
                        {!sidebarCollapsed && showBadge && (
                          <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight ${isActive ? 'bg-white text-blue-600' : 'bg-red-100 text-red-600'}`}>
                            {item.badge}
                          </span>
                        )}
                        {isActive && !sidebarCollapsed && !showBadge && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className={`border-t border-gray-100 py-3 mt-1 ${sidebarCollapsed ? 'px-0 flex justify-center' : 'px-5'}`}>
                  <Badge className={`flex items-center gap-2 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-medium ${sidebarCollapsed ? 'w-fit px-2 py-1 justify-center' : 'px-3 py-1 w-fit'}`}>
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0"></span>
                    {!sidebarCollapsed && <span>Online</span>}
                  </Badge>
                </div>
              </nav>
            </aside>

            {/* Content Area */}
            <main className="flex-1 min-w-0">

              {/* Mobile Dropdown */}
              <div className="lg:hidden mb-6">
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger
                    className="
                      w-full text-white font-medium shadow-md rounded-lg px-4 py-2
                      bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
                      bg-[length:200%_200%] animate-gradient-flow
                      focus:ring-2 focus:ring-offset-2 focus:ring-blue-400
                      flex items-center gap-2
                    "
                  >
                    {[
                      { value: "overview", label: "Overview", icon: LayoutDashboard },
                      { value: "users", label: "Total Users", icon: Users },
                      { value: "players", label: "Verifications", icon: UserCheck },
                      { value: "teams", label: "Season", icon: Trophy },
                      { value: "matches", label: "Schedule", icon: Calendar },
                      { value: "gallery", label: "Gallery", icon: Images },
                      { value: "news", label: "News", icon: FileText },
                      { value: "sponsor", label: "Sponsor", icon: Settings },
                      { value: "videos", label: "Videos", icon: Film },
                    ].map((tab) => {
                      if (tab.value === activeTab) {
                        const Icon = tab.icon;
                        return (
                          <div key={tab.value} className="flex items-center gap-2 truncate">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="truncate uppercase">{tab.label}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </SelectTrigger>
                  <SelectContent
                    className="
                      rounded-lg shadow-lg bg-white max-h-64 overflow-y-auto
                      scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
                    "
                  >
                    {[
                    { value: "overview", label: "Overview", icon: LayoutDashboard },
                    { value: "users", label: "Total Users", icon: Users },
                    { value: "players", label: "Verifications", icon: UserCheck },
                    { value: "teams", label: "Season", icon: Trophy },
                    { value: "matches", label: "Schedule", icon: Calendar },
                    { value: "gallery", label: "Gallery", icon: Images },
                    { value: "news", label: "News", icon: FileText },
                    { value: "sponsor", label: "Sponsor", icon: Settings },
                    { value: "videos", label: "Videos", icon: Film },
                  ].map((tab) => {
                    const Icon = tab.icon;
                      return (
                        <SelectItem
                          key={tab.value}
                          value={tab.value}
                          className={`
                            flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300
                            whitespace-nowrap
                            hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 hover:text-white
                            ${activeTab === tab.value
                              ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold"
                              : "text-gray-700"}
                          `}
                        >
                          <div className="flex items-center gap-2 truncate w-full">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="truncate uppercase">{tab.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>              {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">

            {/* Row 1: Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { title: 'Total Users', value: dashboardData?.totalUsers ?? 0, icon: Users, gradient: 'from-blue-500 to-blue-600', route: '/admin/users' },
                { title: 'Verified Players', value: dashboardData?.verifiedPlayers ?? 0, icon: UserCheck, gradient: 'from-green-500 to-emerald-600', route: '/admin/users' },
                { title: 'Pending', value: dashboardData?.pendingPlayers ?? 0, icon: Clock, gradient: 'from-orange-500 to-amber-600', onClick: () => setActiveTab('players') },
                { title: 'Active Matches', value: dashboardData?.activeMatches ?? 0, icon: Activity, gradient: 'from-purple-500 to-violet-600', onClick: () => setActiveTab('matches') },
                { title: 'Teams', value: dashboardData?.totalTeams ?? 0, icon: Trophy, gradient: 'from-indigo-500 to-indigo-600', onClick: () => setActiveTab('teams') },
                { title: 'Total Matches', value: dashboardData?.totalMatches ?? 0, icon: Calendar, gradient: 'from-teal-500 to-cyan-600', onClick: () => setActiveTab('matches') },
              ].map((stat, i) => (
                <Card
                  key={i}
                  className="cursor-pointer border-0 rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:scale-[1.03] hover:shadow-xl group"
                  onClick={() => handleStatsCardClick((stat as any).onClick || (stat as any).route)}
                >
                  <div className={`bg-gradient-to-br ${stat.gradient} p-4 text-white`}>
                    <stat.icon className="w-6 h-6 mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs font-medium opacity-80 mt-0.5 uppercase">{stat.title}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Row 2: Content Stats + Player Roles + Match Viz */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Content Stats Card */}
              <Card className="border-0 rounded-xl shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Image className="w-4 h-4" /> <span className="uppercase">Content Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {[
                    { label: 'News Articles', value: dashboardData?.contentStats?.totalNews ?? 0, sub: `${dashboardData?.contentStats?.publishedNews ?? 0} published · ${dashboardData?.contentStats?.draftNews ?? 0} draft`, icon: FileText, color: 'text-blue-600' },
                    { label: 'Gallery Images', value: dashboardData?.contentStats?.totalGalleryImages ?? 0, icon: Images, color: 'text-purple-600' },
                    { label: 'Sponsors', value: dashboardData?.contentStats?.totalSponsors ?? 0, icon: Settings, color: 'text-emerald-600' },
                    { label: 'Videos', value: dashboardData?.contentStats?.totalVideos ?? 0, icon: Film, color: 'text-rose-600' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-700">{item.label}</p>
                          {item.sub && <p className="text-[10px] text-gray-400">{item.sub}</p>}
                        </div>
                      </div>
                      <span className="text-lg font-bold text-gray-800">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Player Roles Card */}
              <Card className="border-0 rounded-xl shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> <span className="uppercase">Player Roles</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {(() => {
                    const rolesData = [
                      { name: 'Batsmen', value: dashboardData?.playerRoles?.batsmen ?? 0, fill: '#3B82F6' },
                      { name: 'Bowlers', value: dashboardData?.playerRoles?.bowlers ?? 0, fill: '#F97316' },
                      { name: 'All-Rounders', value: dashboardData?.playerRoles?.allRounders ?? 0, fill: '#A855F7' },
                      { name: 'Wicket Keepers', value: dashboardData?.playerRoles?.wicketKeepers ?? 0, fill: '#10B981' },
                    ];
                    const total = rolesData.reduce((s, r) => s + r.value, 0);
                    return (
                      <div>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={rolesData} barSize={32}>
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip formatter={(val: number) => [`${val} (${total > 0 ? Math.round(val / total * 100) : 0}%)`, 'Count']} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs text-gray-500">
                          {rolesData.map(r => (
                            <span key={r.name} className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.fill }} />
                              {r.value} {r.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Match Status Viz Card */}
              <Card className="border-0 rounded-xl shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-3 px-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4" /> <span className="uppercase">Match Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {(() => {
                    const COLORS = ['#22C55E', '#F97316', '#3B82F6'];
                    const matchData = [
                      { name: 'Completed', value: dashboardData?.completedMatches ?? 0 },
                      { name: 'Live', value: dashboardData?.activeMatches ?? 0 },
                      { name: 'Upcoming', value: dashboardData?.upcomingMatches ?? 0 },
                    ];
                    const total = matchData.reduce((s, m) => s + m.value, 0);
                    return (
                      <div className="flex items-center gap-4">
                        <ResponsiveContainer width="60%" height={160}>
                          <PieChart>
                            <Pie data={matchData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                              {matchData.map((_, i) => (
                                <Cell key={i} fill={COLORS[i]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(val: number) => [`${val} (${total > 0 ? Math.round(val / total * 100) : 0}%)`, 'Matches']} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 text-sm">
                          {matchData.map((item, i) => (
                            <div key={i} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                <span className="text-gray-600">{item.name}</span>
                              </div>
                              <span className="font-semibold text-gray-800">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Row 3: Recent Registrations + Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Recent Registrations */}
              <Card className="border-0 rounded-xl shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 px-5 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> <span className="uppercase">Recent Registrations</span>
                  </CardTitle>
                  <button onClick={() => setActiveTab('users')} className="text-xs text-blue-200 hover:text-white flex items-center gap-1 transition-colors">
                    View All <ArrowRight className="w-3 h-3" />
                  </button>
                </CardHeader>
                <CardContent className="p-0">
                  {dashboardData?.recentUsers?.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {dashboardData.recentUsers.map((u: any, i: number) => (
                        <div key={u._id || i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-sm text-gray-400">No recent registrations</div>
                  )}
                </CardContent>
              </Card>

              {/* Activity Feed */}
              <Card className="border-0 rounded-xl shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 px-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <List className="w-4 h-4" /> <span className="uppercase">Activity Feed</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {dashboardData?.activityFeed?.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {dashboardData.activityFeed.slice(0, 6).map((a: any, i: number) => {
                        const typeStyles: Record<string, string> = {
                          success: 'bg-green-100 text-green-600',
                          info: 'bg-blue-100 text-blue-600',
                          user: 'bg-purple-100 text-purple-600',
                          verification: 'bg-emerald-100 text-emerald-600',
                        };
                        const typeIcons: Record<string, any> = {
                          success: CheckCircle,
                          info: Activity,
                          user: UserPlus,
                          verification: UserCheck,
                        };
                        const Icon = typeIcons[a.type] || Activity;
                        return (
                          <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                            <div className={`p-1.5 rounded-full ${typeStyles[a.type] || 'bg-gray-100 text-gray-500'} shrink-0 mt-0.5`}>
                              <Icon className="w-3 h-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">{a.action}</p>
                              <p className="text-xs text-gray-500 truncate">{a.details}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">
                              {typeof a.time === 'string' && a.time === 'Just now' ? 'Just now' : new Date(a.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-sm text-gray-400">No recent activity</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Row 4: Quick Actions + Recent Matches */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Quick Actions */}
              <Card className="lg:col-span-1 border-0 rounded-xl shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Plus className="w-4 h-4" /><span className="uppercase"> Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {[
                    { label: 'Manage Teams', icon: Trophy, tab: 'teams' },
                    { label: 'Schedule Match', icon: Calendar, tab: 'matches' },
                    { label: 'Verifications', icon: UserCheck, tab: 'players', badge: dashboardData?.pendingPlayers ?? 0 },
                    { label: 'Gallery', icon: Images, tab: 'gallery' },
                    { label: 'News', icon: FileText, tab: 'news' },
                    { label: 'Sponsors', icon: Settings, tab: 'sponsor' },
                    { label: 'Videos', icon: Film, tab: 'videos' },
                  ].map((action, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTab(action.tab)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 transition-all duration-200 group"
                    >
                      <span className="flex items-center gap-3 uppercase">
                        <action.icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                        {action.label}
                      </span>
                      <span className="flex items-center gap-2">
                        {action.badge != null && action.badge > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {action.badge}
                          </span>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
                      </span>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Matches */}
              <Card className="lg:col-span-2 border-0 rounded-xl shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-5 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4" /> <span className="uppercase">Recent Matches</span>
                  </CardTitle>
                  <button
                    onClick={() => setActiveTab('matches')}
                    className="text-xs text-blue-300 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </button>
                </CardHeader>
                <CardContent className="p-0">
                  {dashboardData?.recentMatches?.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {dashboardData.recentMatches.map((m: any, i: number) => {
                        const statusColor = m.result === 'live' ? 'bg-green-500'
                          : m.result === 'completed' ? 'bg-blue-500'
                          : 'bg-gray-400';
                        const statusLabel = m.result === 'live' ? 'LIVE'
                          : m.result === 'completed' ? 'Done'
                          : 'Upcoming';
                        return (
                          <div key={m._id || i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`w-2 h-2 rounded-full ${statusColor} shrink-0`} />
                              <div className="truncate">
                                <span className="text-sm font-medium text-gray-800">
                                  {m.teamA?.teamName || 'Team A'} vs {m.teamB?.teamName || 'Team B'}
                                </span>
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {m.matchTime ? new Date(m.matchTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                                </div>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white ${statusColor} shrink-0`}>
                              {statusLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-sm text-gray-400">
                      No matches yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pending Players Mini Section */}
            {pendingPlayers.length > 0 && (
              <Card className="border-0 rounded-xl shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-600 text-white py-3 px-5 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <UserCheck className="w-4 h-4" /> Pending Verifications ({pendingPlayers.length})
                  </CardTitle>
                  <button
                    onClick={() => setActiveTab('players')}
                    className="text-xs text-orange-100 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    Manage <ArrowRight className="w-3 h-3" />
                  </button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {pendingPlayers.slice(0, 4).map((player: any) => (
                      <div key={player.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {player.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="truncate">
                            <span className="text-sm font-medium text-gray-800">{player.name}</span>
                            <div className="text-xs text-gray-400 truncate">{player.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleApprovePlayer(player.id)}
                            className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-500 hover:text-white transition-all"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectPlayer(player.id)}
                            className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition-all"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {pendingPlayers.length > 4 && (
                    <div className="px-5 py-2.5 text-center border-t border-gray-100">
                      <button
                        onClick={() => setActiveTab('players')}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        +{pendingPlayers.length - 4} more pending
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="players">
            <PlayerVerification />
          </TabsContent>

          <TabsContent value="teams">
            <TeamManagement />
          </TabsContent>

          <TabsContent value="matches">
            <ScheduleMatch />
          </TabsContent>

          <TabsContent value="gallery">
            <GalleryManagement />
          </TabsContent>

          <TabsContent value="news"> {/* Match the value here */}
            <NewsManagement />
          </TabsContent>

          <TabsContent value="sponsor">
            <SponsorManagement />
          </TabsContent>
          <TabsContent value="videos">
            <VideoManagement />
          </TabsContent>
            </main>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
