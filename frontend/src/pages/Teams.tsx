import React, { useEffect, useState } from "react";
import axios from "axios";
import { Users, Crown ,User} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BatIcon from "@/assets/icons/bat.png";
import BallIcon from "@/assets/icons/ball.png";
import AllRounderIcon from "@/assets/icons/all.png";
import GlovesIcon from "@/assets/icons/gloves.png";
import CapIcon from "@/assets/icons/cap.png"; 
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { BASE_URL } from "@/config";
import api from "@/lib/api";

// Gradients: cycle per team
const gradients = [
  "bg-gradient-to-r from-blue-600 to-purple-600",
  "bg-gradient-to-r from-green-500 to-teal-500",
  "bg-gradient-to-r from-pink-500 to-yellow-500",
  "bg-gradient-to-r from-indigo-500 to-cyan-500",
  "bg-gradient-to-r from-orange-500 to-red-500",
  "bg-gradient-to-r from-violet-500 to-fuchsia-500",
];

// ...imports stay the same...

const roleColors: Record<string, string> = {
  batsman: "bg-gradient-to-r from-yellow-400 to-orange-500",
  bowler: "bg-gradient-to-r from-blue-400 to-indigo-500",
  "all-rounder": "bg-gradient-to-r from-green-400 to-emerald-500",
  "wicketkeeper": "bg-gradient-to-r from-pink-400 to-red-500",
  default: "bg-gradient-to-r from-gray-300 to-gray-400",
};

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


const getInitial = (name?: string) =>
  (name || "?").trim().charAt(0).toUpperCase();

const Teams = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasonNumber, setSeasonNumber] = useState<number | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const token = localStorage.getItem("pplt20_token");
        const seasonRes = await api.get("/api/seasons/current", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const currentSeason = seasonRes.data;
        setSeasonNumber(currentSeason.seasonNumber);

        const teamsRes = await api.get(
          `/api/teams?seasonId=${currentSeason._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        //  console.log("Fetched Teams:", teamsRes.data);
        // teamsRes.data?.forEach((team: any) => {
        //   console.log(`Players for team "${team.teamName}":`, team.players);
        // });
        setTeams(teamsRes.data || []);
      } catch (error) {
        console.error("Error fetching teams:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#8fa2ff] via-[#b15cff] to-[#ff8aa1] text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">UPPL T20 Teams</h1>
          {seasonNumber && (
            <p className="text-xl opacity-90">
              Explore registered teams for Season {seasonNumber}
            </p>
          )}
        </div>
      </div>

      {/* Teams Grid */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <p className="text-center text-gray-500">Loading teams...</p>
        ) : teams.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No teams registered for this season.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teams.map((team, index) => {
              const logoUrl = team.teamLogo
                ? `${BASE_URL}/${String(team.teamLogo).replace(/\\/g, "/")}`
                : "";

              return (
                <Card key={team._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader
                    className={`${gradients[index % gradients.length]} text-white rounded-t-lg space-y-0 p-5`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-lg">{team.teamName}</CardTitle>
                      <button
                        type="button"
                        className="w-24 h-20 bg-white/20 rounded-md flex items-center justify-center"
                        onClick={() => logoUrl && setZoomImage(logoUrl)}
                      >
                        {logoUrl ? (
                          <img src={logoUrl} alt={team.teamName} className="w-full h-full object-contain" />
                        ) : (
                          <div className="text-white/80">No Logo</div>
                        )}
                      </button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-2">
                    <p className="text-sm text-gray-700">
                      <strong>Captain:</strong> {team.captainName}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Contact:</strong> {team.contactNumber}
                    </p>
                    <Button
                      className="w-full mt-3 bg-black text-white"
                      size="sm"
                      onClick={() => setSelectedTeam(team)}
                    >
                      <Users className="h-4 w-4 mr-2" /> View Full Squad
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Zoom Image */}
      {zoomImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setZoomImage(null)}
        >
          <img src={zoomImage} alt="Zoomed" className="max-w-[90vw] max-h-[90vh] object-contain" />
        </div>
      )}

      {/* Squad Dialog */}
      <Dialog open={!!selectedTeam} onOpenChange={(o) => !o && setSelectedTeam(null)}>
        <DialogContent className="w-[90vw] h-[90vh] max-w-none p-0 max-h-screen flex flex-col">
          {selectedTeam && (
            <>
              {/* Hidden Accessible Title */}
              <VisuallyHidden>
                <DialogTitle>{selectedTeam.teamName}</DialogTitle>
              </VisuallyHidden>

              {/* Header Image */}
              <div className="relative w-full h-40 bg-gray-100 flex-shrink-0">
                {selectedTeam.teamLogo && (
                  <img
                    src={`${BASE_URL}/${String(selectedTeam.teamLogo).replace(/\\/g, "/")}`}
                    alt={selectedTeam.teamName}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Team Info */}
                <div className="py-4 bg-white px-6">
                  <h2 className="text-3xl font-bold text-center mb-4">
                    {selectedTeam.teamName}
                  </h2>

                  <div className="grid grid-cols-2 gap-6 text-lg text-gray-800 p-6 bg-gray-50 rounded-lg shadow-sm mt-4">
                    <div className="space-y-3">
                      <p className="flex items-center gap-2">
                        <strong className="text-gray-900">Captain:</strong> {selectedTeam.captainName || "N/A"}
                      </p>
                      <p className="flex items-center gap-2">
                        <strong className="text-gray-900">Contact:</strong> {selectedTeam.contactNumber || "N/A"}
                      </p>
                    </div>

                    <div className="text-right space-y-3">
                      <p className="flex items-center gap-2 justify-end">
                        <strong className="text-gray-900">Coach:</strong> {selectedTeam.coachName || "N/A"}
                      </p>
                      <p className="flex items-center gap-2 justify-end">
                        <strong className="text-gray-900">Manager:</strong> {selectedTeam.managerName || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Player List */}
                <div className="p-4 space-y-3">
                  {selectedTeam.players?.map((player: any, idx: number) => {
                    const normalizePath = (path: string) => path.replace(/^\/+/, "").replace(/\\/g, "/");

                    const pic =
                      (player?.user?.profileImage &&
                        `${BASE_URL}/${normalizePath(player.user.profileImage)}`) ||
                      (player?.profileImage &&
                        `${BASE_URL}/${normalizePath(player.profileImage)}`) ||
                      "";

                    const role = (player?.role || player?.position || "Unknown").toLowerCase();

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white"
                      >
                        {pic ? (
                          <img
                            src={pic}
                            alt={player?.name}
                            className="w-12 h-12 rounded-full object-cover border"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                            <User size={24} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate flex items-center gap-2">
                            {idx + 1}. {player?.name || "Unnamed Player"}
                            {player?.isCaptain && (
                              <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                                C
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600 capitalize flex items-center gap-1">
                            {roleIcon(role)} {role}
                          </p>
                        </div>

                        {player?.jerseyNumber && (
                          <span className="text-lg text-gray-800">
                            Jersey No <strong>#{player.jerseyNumber}</strong>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teams;
