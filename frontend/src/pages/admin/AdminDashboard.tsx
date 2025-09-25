import React, { useEffect, useState } from 'react';
import { API_BASE, BASE_URL } from '@/config';
import {
  Users, UserCheck, Calendar, Trophy, FileText, Settings, Activity,
  Clock, CheckCircle, XCircle, AlertCircle, Images
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TabsContent as InnerTabsContent } from "@/components/ui/tabs";
import BatIcon from "@/assets/icons/bat.png";
import BallIcon from "@/assets/icons/ball.png";
import AllRounderIcon from "@/assets/icons/all.png";
import GlovesIcon from "@/assets/icons/gloves.png";
import CapIcon from "@/assets/icons/cap.png"; 
import { Phone, CalendarDays } from "lucide-react"; 
import { useLocation } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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
        console.log("Fetched players", normalizedPlayers);
        setDashboardData({ ...res, pendingPlayersList: normalizedPlayers });
      })
      .catch((err) => {
        console.error('Failed to fetch dashboard data', err);
      });
  }, []);

  const dashboardStats = [
    {
      title: 'Total Users',
      value: dashboardData?.totalUsers ?? 0,
      icon: Users,
      change: '+12%',
      color: 'blue',
      route: '/admin/users'
    },
    {
      title: 'Verified Players',
      value: dashboardData?.verifiedPlayers ?? 0,
      icon: UserCheck,
      change: '+5%',
      color: 'green',
      route: '/admin/users'
    },
    {
      title: 'Pending Verifications',
      value: dashboardData?.pendingPlayers ?? 0,
      icon: Clock,
      change: '+2',
      color: 'orange',
      onClick: () => setActiveTab('players'),
    },
    {
      title: 'Active Matches',
      value: dashboardData?.activeMatches ?? 0,
      icon: Activity,
      change: '0',
      color: 'purple'
    }
  ];

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
                Admin Dashboard
              </h1>

              <p className="mt-1 text-blue-100 text-sm animate-slide-up">
                Welcome back, <span className="font-semibold text-white">{user?.name}</span>
              </p>
            </div>

            {/* Right: Status + Settings */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <Badge className="flex items-center gap-2 px-3 py-1 bg-green-100/20 text-white border border-green-300 rounded-full text-sm font-medium shadow-sm backdrop-blur-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Online
              </Badge>
              {/* <Button
                onClick={() => navigate("/admin/settings")}
                className="
                  flex items-center gap-2 px-5 py-2.5 rounded-xl
                  text-white font-semibold tracking-wide shadow-lg transition-all duration-300 ease-in-out
                  bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500
                  bg-[length:200%_200%] animate-gradient-flow
                  hover:scale-105 hover:shadow-xl
                  focus:ring-2 focus:ring-offset-2 focus:ring-blue-400
                "
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Settings</span>
              </Button> */}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Desktop Tabs */}
          <TabsList className="hidden md:grid w-full grid-cols-7 mb-8 bg-white shadow-sm rounded-xl p-1">
            {[
              { value: "overview", label: "Overview" },
              { value: "players", label: "Verifications" },
              { value: "teams", label: "Season" },
              { value: "matches", label: "Schedule" },
              { value: "gallery", label: "Gallery" },
              { value: "news", label: "News" },
              { value: "sponsor", label: "Sponsor" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="
                  relative px-4 py-2 font-medium text-gray-600 rounded-lg
                  transition-all duration-300 ease-in-out
                  hover:text-blue-600 hover:bg-blue-50
                  after:absolute after:left-1/2 after:bottom-0 after:-translate-x-1/2
                  after:h-[3px] after:w-0 after:bg-gradient-to-r after:from-blue-500 after:to-purple-500
                  after:rounded-full after:transition-all after:duration-300
                  hover:after:w-3/4
                  data-[state=active]:text-white
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500
                  data-[state=active]:shadow-md data-[state=active]:after:w-3/4
                "
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Mobile Dropdown */}
          <div className="md:hidden mb-6">
            <Select value={activeTab} onValueChange={setActiveTab}>
              {/* Closed Trigger */}
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
                  { value: "overview", label: "Overview", icon: Users },
                  { value: "players", label: "Verifications", icon: UserCheck },
                  { value: "teams", label: "Season", icon: Trophy },
                  { value: "matches", label: "Schedule", icon: Calendar },
                  { value: "gallery", label: "Gallery", icon: Images },
                  { value: "news", label: "News", icon: FileText },
                  { value: "sponsor", label: "Sponsor", icon: Settings },
                ].map((tab) => {
                  if (tab.value === activeTab) {
                    const Icon = tab.icon;
                    return (
                      <div key={tab.value} className="flex items-center gap-2 truncate">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{tab.label}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </SelectTrigger>

              {/* Open Dropdown */}
              <SelectContent
                className="
                  rounded-lg shadow-lg bg-white max-h-64 overflow-y-auto
                  scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
                "
              >
                {[
                  { value: "overview", label: "Overview", icon: Users },
                  { value: "players", label: "Verifications", icon: UserCheck },
                  { value: "teams", label: "Season", icon: Trophy },
                  { value: "matches", label: "Schedule", icon: Calendar },
                  { value: "gallery", label: "Gallery", icon: Images },
                  { value: "news", label: "News", icon: FileText },
                  { value: "sponsor", label: "Sponsor", icon: Settings },
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
                        <span className="truncate">{tab.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>


          {/* Overview Tab */}
          <TabsContent
            value="overview"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {dashboardStats.map((stat, index) => {
              const borderColor =
                stat.color === "blue"
                  ? "border-blue-500"
                  : stat.color === "green"
                  ? "border-green-500"
                  : stat.color === "orange"
                  ? "border-orange-500"
                  : "border-purple-500";

              const hoverBg =
                stat.color === "blue"
                  ? "hover:bg-blue-500"
                  : stat.color === "green"
                  ? "hover:bg-green-500"
                  : stat.color === "orange"
                  ? "hover:bg-orange-500"
                  : "hover:bg-purple-500";

              return (
                <Card
                  key={index}
                  className={`cursor-pointer border-l-4 ${borderColor} rounded-xl shadow-md transform transition-all duration-300 ${hoverBg} hover:scale-[1.03] hover:shadow-xl group`}
                  onClick={() => handleStatsCardClick(stat.onClick || stat.route)}
                >
                  <CardContent className="p-6 flex items-center gap-4 transition-all duration-300">
                    <stat.icon
                      className={`w-8 h-8 text-gray-700 transition-colors duration-300 group-hover:text-white`}
                    />
                    <div>
                      <h3
                        className={`text-lg font-semibold text-gray-800 transition-colors duration-300 group-hover:text-white`}
                      >
                        {stat.title}
                      </h3>
                      <p
                        className={`text-2xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-white`}
                      >
                        {stat.value}
                      </p>
                      <p
                        className={`text-sm text-gray-500 transition-colors duration-300 group-hover:text-gray-100`}
                      >
                        Change: {stat.change}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
