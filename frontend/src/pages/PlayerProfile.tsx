import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Trophy,
  Shield,
  ShieldCheck,
  FileText,
  Download,
  Loader2,
  Zap,
  Target,
  Award,
  TrendingUp,
  Activity,
  Clock,
  Heart,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { format } from "date-fns";

interface PlayerProfile {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    bio: string;
    dateOfBirth: string;
    position: string;
    battingStyle: string;
    bowlingStyle: string;
    profileImage: { url: string; public_id: string } | null;
    documents: { url: string; public_id: string }[];
    playerCode: string | null;
    role: string;
    verified: boolean;
    team: string | null;
  };
  team: { teamName: string; logo: string } | null;
  careerStats: {
    matches: number;
    innings: number;
    runs: number;
    ballsFaced: number;
    fours: number;
    sixes: number;
    highestScore: number;
    notOuts: number;
    wickets: number;
    ballsBowled: number;
    runsConceded: number;
    bestBowlingWickets: number;
    bestBowlingRuns: number;
    economy: number;
    strikeRate: number;
    average: number;
    catches: number;
    stumpings: number;
  };
}

const statCard = (
  icon: React.ReactNode,
  label: string,
  value: number | string,
  color: string
) => (
  <div className="bg-white rounded-2xl p-4 lg:p-5 xl:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 lg:gap-4">
      <div className={`w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900">{value}</p>
        <p className="text-xs lg:text-sm text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  </div>
);

const PlayerProfile = () => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user: authUser } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/player/my-profile");
        setProfile(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 lg:w-12 lg:h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500 text-lg lg:text-xl">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Card className="max-w-md lg:max-w-lg w-full mx-4">
          <CardContent className="p-8 lg:p-12 text-center">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 lg:w-10 lg:h-10 text-red-500" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-500 lg:text-lg">{error || "Unable to load your profile."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, team, careerStats } = profile;
  const age = user.dateOfBirth
    ? Math.floor(
        (Date.now() - new Date(user.dateOfBirth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y/3 -translate-x-1/4" />
        </div>

        <div className="relative max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-8">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 xl:w-44 xl:h-44 rounded-full overflow-hidden border-4 border-white/30 shadow-xl bg-white/10">
                {user.profileImage?.url ? (
                  <img
                    src={user.profileImage.url}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-14 h-14 lg:w-18 lg:h-18 xl:w-20 xl:h-20 text-white/60" />
                  </div>
                )}
              </div>
              {user.verified && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 lg:w-10 lg:h-10 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <ShieldCheck className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
              )}
            </div>

            {/* Name & Info */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white tracking-tight">
                {user.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2 lg:mt-3">
                {user.position && (
                  <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 text-xs lg:text-sm px-2.5 lg:px-3 py-1 lg:py-1.5">
                    <Zap className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                    {user.position}
                  </Badge>
                )}
                {user.playerCode && (
                  <Badge className="bg-yellow-400/20 text-yellow-200 border-0 text-xs lg:text-sm px-2.5 lg:px-3 py-1 lg:py-1.5">
                    <Award className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                    {user.playerCode}
                  </Badge>
                )}
                <Badge
                  className={
                    user.verified
                      ? "bg-green-400/20 text-green-200 border-0 text-xs lg:text-sm px-2.5 lg:px-3 py-1 lg:py-1.5"
                      : "bg-orange-400/20 text-orange-200 border-0 text-xs lg:text-sm px-2.5 lg:px-3 py-1 lg:py-1.5"
                  }
                >
                  {user.verified ? (
                    <>
                      <ShieldCheck className="w-3 h-3 lg:w-4 lg:h-4 mr-1" /> Verified
                    </>
                  ) : (
                    <>
                      <Shield className="w-3 h-3 lg:w-4 lg:h-4 mr-1" /> Pending Verification
                    </>
                  )}
                </Badge>
              </div>
              {team && (
                <p className="text-white/70 text-sm lg:text-base mt-2">
                  🏏 {team.teamName}
                </p>
              )}
              {!user.verified && (
                <p className="text-yellow-200/80 text-xs lg:text-sm mt-2 bg-white/10 rounded-lg px-3 py-1.5 lg:px-4 lg:py-2 inline-block">
                  Your profile is under review. You'll receive your player code once verified by admin.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 lg:px-8 py-6 sm:py-8 lg:py-10 -mt-4">
        {/* Career Stats */}
        <Card className="mb-6 lg:mb-8 shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white pb-4 lg:pb-5">
            <CardTitle className="text-lg lg:text-xl xl:text-2xl flex items-center gap-2">
              <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" />
              Career Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 lg:p-8">
            {/* Batting Stats */}
            <h3 className="text-sm lg:text-base font-semibold text-gray-500 uppercase tracking-wider mb-3 lg:mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 lg:w-5 lg:h-5" /> Batting
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
              {statCard(
                <Target className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />,
                "Matches",
                careerStats.matches,
                "bg-blue-50"
              )}
              {statCard(
                <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />,
                "Runs",
                careerStats.runs,
                "bg-green-50"
              )}
              {statCard(
                <Star className="w-5 h-5 lg:w-6 lg:h-6 text-amber-600" />,
                "Highest",
                careerStats.highestScore,
                "bg-amber-50"
              )}
              {statCard(
                <Activity className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />,
                "Strike Rate",
                careerStats.strikeRate.toFixed(1),
                "bg-purple-50"
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 lg:gap-4 mb-6 lg:mb-8">
              {[
                { label: "Innings", value: careerStats.innings },
                { label: "Not Outs", value: careerStats.notOuts },
                { label: "Fours", value: careerStats.fours },
                { label: "Sixes", value: careerStats.sixes },
                { label: "Balls Faced", value: careerStats.ballsFaced },
                { label: "Average", value: careerStats.average.toFixed(1) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-2 lg:p-3 bg-gray-50 rounded-xl"
                >
                  <p className="text-lg lg:text-xl xl:text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-[10px] lg:text-xs text-gray-500 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            <Separator className="my-4 lg:my-6" />

            {/* Bowling Stats */}
            <h3 className="text-sm lg:text-base font-semibold text-gray-500 uppercase tracking-wider mb-3 lg:mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 lg:w-5 lg:h-5" /> Bowling
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
              {statCard(
                <Target className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />,
                "Wickets",
                careerStats.wickets,
                "bg-red-50"
              )}
              {statCard(
                <Heart className="w-5 h-5 lg:w-6 lg:h-6 text-pink-600" />,
                "Economy",
                careerStats.economy.toFixed(2),
                "bg-pink-50"
              )}
              {statCard(
                <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-600" />,
                "Runs Conceded",
                careerStats.runsConceded,
                "bg-indigo-50"
              )}
              {statCard(
                <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />,
                "Balls Bowled",
                careerStats.ballsBowled,
                "bg-orange-50"
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
              {[
                { label: "Best Wickets", value: careerStats.bestBowlingWickets },
                { label: "Best Runs", value: careerStats.bestBowlingRuns },
                { label: "Catches", value: careerStats.catches },
                { label: "Stumpings", value: careerStats.stumpings },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-2 lg:p-3 bg-gray-50 rounded-xl"
                >
                  <p className="text-lg lg:text-xl xl:text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-[10px] lg:text-xs text-gray-500 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card className="mb-6 lg:mb-8 shadow-lg border-0">
          <CardHeader className="pb-3 lg:pb-4">
            <CardTitle className="text-lg lg:text-xl xl:text-2xl flex items-center gap-2">
              <User className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 lg:p-8 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
              {[
                { icon: <Mail className="w-4 h-4 lg:w-5 lg:h-5" />, label: "Email", value: user.email },
                { icon: <Phone className="w-4 h-4 lg:w-5 lg:h-5" />, label: "Phone", value: user.phone || "Not provided" },
                {
                  icon: <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />,
                  label: "Date of Birth",
                  value: user.dateOfBirth
                    ? format(new Date(user.dateOfBirth), "MMMM d, yyyy") + (age ? ` (${age} yrs)` : "")
                    : "Not provided",
                },
                {
                  icon: <Zap className="w-4 h-4 lg:w-5 lg:h-5" />,
                  label: "Position",
                  value: user.position || "Not set",
                },
                {
                  icon: <Activity className="w-4 h-4 lg:w-5 lg:h-5" />,
                  label: "Batting Style",
                  value: user.battingStyle || "Not set",
                },
                {
                  icon: <Target className="w-4 h-4 lg:w-5 lg:h-5" />,
                  label: "Bowling Style",
                  value: user.bowlingStyle || "Not set",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 p-3 lg:p-4 bg-gray-50 rounded-xl"
                >
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-500 font-medium">{item.label}</p>
                    <p className="text-sm lg:text-base font-semibold text-gray-900 capitalize">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {user.bio && (
              <div className="mt-4 lg:mt-6 p-4 lg:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <p className="text-xs lg:text-sm text-gray-500 font-medium mb-1">Bio</p>
                <p className="text-sm lg:text-base text-gray-700 leading-relaxed">{user.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        {user.documents.length > 0 && (
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-3 lg:pb-4">
              <CardTitle className="text-lg lg:text-xl xl:text-2xl flex items-center gap-2">
                <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                Documents ({user.documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 lg:p-8 pt-0">
              <div className="space-y-2 lg:space-y-3">
                {user.documents.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 lg:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                  >
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm lg:text-base font-medium text-gray-700 truncate">
                        Document {i + 1}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-400">Click to view</p>
                    </div>
                    <Download className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PlayerProfile;
