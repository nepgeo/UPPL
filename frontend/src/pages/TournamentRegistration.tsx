import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createTeam } from '@/services/teamService';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Upload, Image as ImageIcon, ZoomIn } from 'lucide-react';
import {useToast} from "@/components/ui/use-toast";
import api from '@/lib/api';
import { API_BASE, BASE_URL } from '@/config';

interface Player {
  name: string;
  position: string;
  jerseyNumber: string;
  code: string;
}

export interface TeamForm {
  teamName: string;
  captainName: string;
  contactNumber: string;
  email: string;
  teamLogo: FileList;
  paymentReceipt: FileList;
}

const TournamentRegistration: React.FC = () => {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<TeamForm>();
  const [players, setPlayers] = useState<Player[]>(
    Array.from({ length: 15 }, () => ({
      name: '',
      position: '',
      jerseyNumber: '',
      code: '',
    }))
  );
  const [loading, setLoading] = useState(false);
  const [qrImages, setQrImages] = useState<string[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [seasonId, setSeasonId] = useState<string>('');
  const [seasonNumber, setSeasonNumber] = useState<string>('');

  const roles = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];
  const [codeErrors, setCodeErrors] = useState<{ [index: number]: string }>({});


  // Fetch QR codes
  useEffect(() => {
    const fetchQRImages = async () => {
      try {
        const res = await api.get("/payment-qr");
        setQrImages(res.data.filter((url: string) => url)); // Ensure no empty URLs
      } catch (error) {
        console.error("Error fetching QR images", error);
      }
    };

    fetchQRImages();
  }, []);

  // Fetch current season
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('pplt20_token');
        if (!token) return;

        const API_URL = import.meta.env.VITE_API_URL || BASE_URL;
        const response = await axios.get(`${API_URL}/seasons/current`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSeasonId(response.data._id);
        setSeasonNumber(response.data.seasonNumber);

      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };

    fetchInitialData();
  }, []);

  const updatePlayer = async (index: number, field: keyof Player, value: string) => {
  const updated = [...players];
  updated[index][field] = value;
  setPlayers(updated);

  // If editing player code, validate it
  if (field === "code" && value.trim()) {
    try {
      const API_URL = import.meta.env.VITE_API_URL || BASE_URL;
      const token = localStorage.getItem("pplt20_token");

      const res = await axios.post(
        `${API_URL}/player/check-code`,
        { code: value.trim(),seasonNumber: seasonId},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ API Response:", res.data);

      if (res.data?.exists) {
        if (res.data.alreadyInTeam) {
          // case 1: player found AND already in team
          setCodeErrors((prev) => ({
            ...prev,
            [index]: `❌ Already registered with team: ${res.data.teamName || "Unknown Team"}`,
          }));
        } else {
          // case 2: player found and not in team
          setCodeErrors((prev) => ({
            ...prev,
            [index]: `✅ Player verified: ${res.data.name}`,
          }));
        }
      } else {
        // case 3: no player exists
        setCodeErrors((prev) => ({
          ...prev,
          [index]: "⚠️ No player found with this code",
        }));
      }
    } catch (err) {
      console.error("Error checking player code:", err);
      setCodeErrors((prev) => ({
        ...prev,
        [index]: "⚠️ Could not verify code",
      }));
    }
  }
};




  const onSubmit = async (data: TeamForm) => {
    const errors: string[] = [];

    // 1. Validate required fields for first 11 players
    const requiredPlayers = players.slice(0, 11);
    requiredPlayers.forEach((p, i) => {
      if (!p.name.trim() || !p.position.trim() || !p.jerseyNumber.trim()) {
        errors.push(`⚠️ Player ${i + 1}: Missing required fields (name, role, jersey number)`);
      }
    });

    // 2. Validate player codes with backend
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p.code.trim()) {
        try {
          const res = await axios.post("/api/player/check-code", {
            code: p.code.trim(),
            seasonNumber: seasonId,
          });

          if (res.data.exists && res.data.alreadyInTeam) {
            errors.push(
              `❌ Player ${p.name || p.code} is already registered in team: ${res.data.teamName}`
            );
          }
        } catch (err) {
          console.error("Error checking player:", err);
          errors.push(`❌ Error validating player code for Player ${i + 1}`);
        }
      }
    }

    // ⛔ If any errors, show them and stop submission
    if (errors.length > 0) {
      errors.forEach((msg) => toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      }));
      return;
    }

    // 3. Prepare players for backend
    const preparedPlayers = players.map((p) => ({
      name: p.name.trim(),
      position: p.position.trim(),
      jerseyNumber: p.jerseyNumber.trim(),
      playerCode: p.code.trim() || null,
    }));

    // 4. Build FormData
    const formData = new FormData();
    formData.append("teamName", data.teamName);
    formData.append("captainName", data.captainName);
    formData.append("contactNumber", data.contactNumber);
    formData.append("email", data.email);

    if (seasonId) formData.append("seasonNumber", seasonId);
    if (data.teamLogo?.[0]) formData.append("teamLogo", data.teamLogo[0]);
    if (data.paymentReceipt?.[0]) formData.append("paymentReceipt", data.paymentReceipt[0]);

    formData.append("players", JSON.stringify(preparedPlayers));

    // 5. Validate auth
    const token = localStorage.getItem("pplt20_token");
    if (!token) {
      toast({
        title: "Error",
        description: "You must be logged in to register a team.",
        variant: "destructive",
      });
      return;
    }

    // 6. Submit
    setLoading(true);
    try {
      console.log("Submitting with seasonId:", seasonId);
      await createTeam(formData);
      toast({
        title: "Success",
        description: "✅ Team registration submitted! Awaiting admin verification.",
      });
      reset();
      setPlayers(
        Array.from({ length: 15 }, () => ({
          name: "",
          position: "",
          jerseyNumber: "",
          code: "",
        }))
      );
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Failed to submit registration. Please try again.";

      toast({
        title: "Error",
        description: `${message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-2">
          Tournament Registration
        </h1>
        <p className="text-lg text-slate-600">Register your team for UPPL T20 Season {seasonNumber ?? '—'}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        {/* Team Info */}
        <Card className="shadow-lg rounded-xl overflow-hidden border-none">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <CardTitle className="text-2xl flex items-center gap-3">
              🏏 Team Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Label htmlFor="teamLogo" className="font-medium text-slate-700">Team Logo</Label>
                <div className="mt-2 relative">
                  <Input
                    id="teamLogo"
                    type="file"
                    accept="image/*"
                    {...register('teamLogo', { required: true })}
                    className="peer"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <Upload className="h-5 w-5" />
                  </div>
                </div>
                {errors.teamLogo && (
                  <span className="text-red-500 text-xs mt-1 block">Logo is required</span>
                )}
              </div>

              <div>
                <Label htmlFor="teamName" className="font-medium text-slate-700">Team Name</Label>
                <Input id="teamName" {...register('teamName', { required: true })} placeholder="E.g., Desert Hawks" />
                {errors.teamName && <span className="text-red-500 text-xs">Required</span>}
              </div>

              <div>
                <Label htmlFor="captainName" className="font-medium text-slate-700">Captain Name</Label>
                <Input id="captainName" {...register('captainName', { required: true })} placeholder="Full name" />
                {errors.captainName && <span className="text-red-500 text-xs">Required</span>}
              </div>

              <div>
                <Label htmlFor="contactNumber" className="font-medium text-slate-700">Contact Number</Label>
                <Input id="contactNumber" type="tel" {...register('contactNumber', { required: true })} placeholder="+977 9812345678" />
                {errors.contactNumber && <span className="text-red-500 text-xs">Required</span>}
              </div>

              <div>
                <Label htmlFor="email" className="font-medium text-slate-700">Email</Label>
                <Input id="email" type="email" {...register('email', { required: true })} placeholder="team@example.com" />
                {errors.email && <span className="text-red-500 text-xs">Required</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Squad Details */}
        <Card className="shadow-lg rounded-xl overflow-hidden border-none">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
            <CardTitle className="text-2xl flex items-center gap-3">
              👥 Squad Details (15 Players Max)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="space-y-4">
              {players.map((player, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-lg border transition-all duration-150 ${
                    index < 11
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div>
                    <Input
                      placeholder={`Player Full Name${index + 1}`}
                      value={player.name}
                      onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                      className={index < 11 && !player.name ? 'border-red-400 ring-1 ring-red-200' : ''}
                    />
                  </div>

                  <select
                    className="border rounded-md p-2 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                    value={player.position}
                    onChange={(e) => updatePlayer(index, 'position', e.target.value)}
                  >
                    <option value="">Role</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>

                  <Input
                    placeholder="Jersey No."
                    value={player.jerseyNumber}
                    onChange={(e) => updatePlayer(index, 'jerseyNumber', e.target.value)}
                    className={index < 11 && !player.jerseyNumber ? 'border-red-400 ring-1 ring-red-200' : ''}
                  />

                  <Input
                    placeholder="Player Code if registered"
                    value={player.code}
                    onChange={(e) => updatePlayer(index, 'code', e.target.value)}
                  />
                  {codeErrors[index] && (
                    <p className="text-red-500 text-xs mt-1">{codeErrors[index]}</p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-4 italic">
              * First 11 players are required. Player Code is optional.
            </p>
          </CardContent>
        </Card>

        {/* Payment Section */}
        <Card className="shadow-lg rounded-xl overflow-hidden border-none">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-700 text-white">
            <CardTitle className="text-2xl flex items-center gap-3">
              💳 Payment Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* QR Code Gallery */}
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Scan to Pay</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Make payment by scanning any of the QR codes below.
                </p>

                {qrImages.length > 0 ? (
                  <div
                    className="relative w-48 h-48 border-2 border-dashed border-slate-300 rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => setOpenModal(true)}
                  >
                    <img
                      src={qrImages[0]}
                      alt="Payment QR"
                      className="w-full h-full object-contain p-2 transition-transform group-hover:scale-105"
                    />
                    {qrImages.length > 1 && (
                      <span className="absolute bottom-2 right-2 bg-black text-white text-xs font-bold px-2 py-1 rounded-full bg-opacity-80">
                        +{qrImages.length - 1}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                      <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 text-sm">
                    <ImageIcon size={24} />
                    No QR codes available
                  </div>
                )}

                {/* Modal */}
                {openModal && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
                    onClick={() => setOpenModal(false)}
                  >
                    <div
                      className="bg-white p-6 rounded-xl max-w-4xl max-h-[90vh] overflow-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-xl font-bold mb-4 text-slate-800">Payment QR Codes</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {qrImages.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative group cursor-zoom-in"
                            onClick={() => setZoomImage(url)}
                          >
                            <img
                              src={url}
                              alt={`QR ${idx + 1}`}
                              className="w-full h-40 object-contain border rounded-lg transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg flex items-center justify-center transition-all">
                              <ZoomIn className="text-white opacity-0 group-hover:opacity-100" size={20} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Zoomed View */}
                {zoomImage && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 animate-fade-in"
                    onClick={() => setZoomImage(null)}
                  >
                    <img
                      src={zoomImage}
                      alt="Zoomed QR"
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                  </div>
                )}
              </div>

              {/* Upload Receipt */}
              <div>
                <Label htmlFor="paymentReceipt" className="font-medium text-slate-700">Upload Payment Receipt</Label>
                <div className="mt-2 relative">
                  <Input
                    id="paymentReceipt"
                    type="file"
                    accept="image/*,application/pdf"
                    {...register('paymentReceipt', { required: true })}
                    className="peer"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <Upload className="h-5 w-5" />
                  </div>
                </div>
                {errors.paymentReceipt && (
                  <span className="text-red-500 text-xs mt-1 block">Receipt is required</span>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  Upload screenshot or PDF of your transaction.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="text-center">
          <Button
            type="submit"
            disabled={loading}
            className="px-10 py-6 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Registration'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TournamentRegistration;
