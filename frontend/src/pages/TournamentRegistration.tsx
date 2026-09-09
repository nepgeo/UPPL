import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { createTeam } from "@/services/teamService";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Upload, ImageIcon, ChevronRight, ChevronLeft, Check, Trophy, Shield, CreditCard, Wallet, ExternalLink, Users, Mail, Phone, User, Info, AlertCircle, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { API_BASE } from "@/config";
import { motion, AnimatePresence } from "framer-motion";
import PaymentModal from "@/components/PaymentModal";

interface Player {
  name: string;
  position: string;
  jerseyNumber: string;
  code: string;
}

interface TeamForm {
  teamName: string;
  captainName: string;
  coachName: string;
  managerName: string;
  contactNumber: string;
  email: string;
  teamLogo: FileList;
  paymentReceipt: FileList;
}

const ROLES = ["Batsman", "Bowler", "All-rounder", "Wicket-keeper"];

const STEPS = [
  { label: "Team Info", icon: Trophy, description: "Basic team details" },
  { label: "Squad", icon: Users, description: "Add players" },
  { label: "Payment", icon: CreditCard, description: "Complete payment" },
];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

const TournamentRegistration = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<TeamForm>();
  const [players, setPlayers] = useState<Player[]>(
    Array.from({ length: 15 }, () => ({ name: "", position: "", jerseyNumber: "", code: "" }))
  );
  const [loading, setLoading] = useState(false);
  const [qrImages, setQrImages] = useState<string[]>([]);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [seasonId, setSeasonId] = useState("");
  const [seasonNumber, setSeasonNumber] = useState("");
  const [codeErrors, setCodeErrors] = useState<Record<number, string>>({});
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalMethod, setPaymentModalMethod] = useState<"esewa" | "khalti">("esewa");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"error" | "success">("error");
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  useEffect(() => {
    axios.get(`${API_BASE}/payment-qr`)
      .then((res) => {
        if (res.data && Array.isArray(res.data.qrs)) {
          setQrImages(res.data.qrs.map((q: any) => q?.url).filter(Boolean));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("pplt20_token");
    if (!token) return;
    api.get(`${API_BASE}/seasons/current`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { setSeasonId(res.data._id); setSeasonNumber(res.data.seasonNumber); })
      .catch(() => {});
  }, []);

  const updatePlayer = async (index: number, field: keyof Player, value: string) => {
    const updated = [...players];
    updated[index][field] = value;
    setPlayers(updated);

    if (field === "code" && value.trim()) {
      try {
        const token = localStorage.getItem("pplt20_token");
        const res = await api.post(
          `${API_BASE}/player/check-code`,
          { code: value.trim(), seasonNumber: seasonId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data?.exists) {
          setCodeErrors((prev) => ({
            ...prev,
            [index]: res.data.alreadyInTeam
              ? `Already in team: ${res.data.teamName}`
              : `Verified: ${res.data.name}`,
          }));
        } else {
          setCodeErrors((prev) => ({ ...prev, [index]: "No player found with this code" }));
        }
      } catch {
        setCodeErrors((prev) => ({ ...prev, [index]: "Could not verify code" }));
      }
    }
  };

  const showDialog = (type: "error" | "success", title: string, message: string) => {
    setDialogType(type);
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const onSubmit = async (data: TeamForm) => {
    const errors: string[] = [];
    const requiredPlayers = players.slice(0, 11);
    requiredPlayers.forEach((p, i) => {
      if (!p.name.trim() || !p.position.trim() || !p.jerseyNumber.trim()) {
        errors.push(`Player ${i + 1}: Missing required fields (name, role, jersey)`);
      }
    });

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p.code.trim()) {
        try {
          const res = await api.post("/api/player/check-code", { code: p.code.trim(), seasonNumber: seasonId });
          if (res.data.exists && res.data.alreadyInTeam) {
            errors.push(`Player ${p.name || p.code} is already in team: ${res.data.teamName}`);
          }
        } catch {
          errors.push(`Error validating player code for Player ${i + 1}`);
        }
      }
    }

    if (errors.length > 0) {
      showDialog("error", "Validation Errors", errors.join("\n"));
      return;
    }

    const preparedPlayers = players.map((p) => ({
      name: p.name.trim(),
      position: p.position.trim(),
      jerseyNumber: p.jerseyNumber.trim(),
      playerCode: p.code.trim() || null,
    }));

    const formData = new FormData();
    formData.append("teamName", data.teamName);
    formData.append("captainName", data.captainName);
    formData.append("coachName", data.coachName);
    formData.append("managerName", data.managerName);
    formData.append("contactNumber", data.contactNumber);
    formData.append("email", data.email);
    formData.append("paymentMethod", "qr");
    if (seasonId) formData.append("seasonNumber", seasonId);
    if (data.teamLogo?.[0]) formData.append("teamLogo", data.teamLogo[0]);
    if (data.paymentReceipt?.[0]) {
      formData.append("paymentReceipt", data.paymentReceipt[0]);
    }
    formData.append("players", JSON.stringify(preparedPlayers));

    const token = localStorage.getItem("pplt20_token");
    if (!token) {
      showDialog("error", "Authentication Required", "You must be logged in to register.");
      return;
    }

    setLoading(true);
    try {
      await createTeam(formData);
      showDialog("success", "Registration Successful", "Your team has been registered! Awaiting verification by our team.");
      reset();
      setPlayers(Array.from({ length: 15 }, () => ({ name: "", position: "", jerseyNumber: "", code: "" })));
      setStep(0);
    } catch (error: any) {
      showDialog("error", "Registration Failed", error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextStep = () => { setDirection(1); setStep((s) => Math.min(s + 1, 2)); setTimeout(scrollToTop, 50); };
  const prevStep = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); setTimeout(scrollToTop, 50); };

  const filledPlayers = players.filter((p) => p.name.trim()).length;

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-3 sm:p-4 md:p-6 lg:p-8 pt-8 sm:pt-12 md:pt-16">
      <div className="w-full max-w-5xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-full mb-4 sm:mb-5 shadow-lg shadow-purple-500/20">
            <Trophy className="w-4 h-4 text-amber-300" />
            <span className="text-sm sm:text-base font-semibold text-white">UPPL T20{seasonNumber ? ` Season ${seasonNumber}` : ""}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">Team Registration</h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-500 mt-2 sm:mt-3 max-w-xl mx-auto px-2">Register your team for the UPPL T20 League in a few simple steps</p>
        </motion.div>

        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-1 sm:gap-2 md:gap-4 mb-6 sm:mb-8"
        >
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (i < step) {
                    setDirection(-1);
                    setStep(i);
                  }
                }}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 py-2 sm:py-3 rounded-xl transition-all duration-300 ${
                  i === step
                    ? "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white shadow-lg shadow-purple-500/25"
                    : i < step
                    ? "bg-emerald-50 text-emerald-700 cursor-pointer hover:bg-emerald-100 border border-emerald-200"
                    : "bg-white text-slate-400 border border-slate-200"
                }`}
              >
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
                  i === step
                    ? "bg-white/20 text-white"
                    : i < step
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}>
                  {i < step ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs sm:text-sm font-semibold">{s.label}</div>
                  <div className="text-[10px] sm:text-xs opacity-60">{s.description}</div>
                </div>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-6 sm:w-10 md:w-16 h-0.5 mx-1 sm:mx-2 rounded-full transition-all duration-500 ${
                  i < step ? "bg-emerald-500" : "bg-slate-200"
                }`} />
              )}
            </div>
          ))}
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden"
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait" custom={direction}>
              {/* Step 0: Team Info */}
              {step === 0 && (
                <motion.div
                  key="step0"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="p-4 sm:p-6 md:p-8 lg:p-10"
                >
                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="p-2.5 sm:p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md shadow-purple-500/20">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">Team Information</h2>
                      <p className="text-xs sm:text-sm text-slate-500">Tell us about your team</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl mb-5 sm:mb-6">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-blue-800">Minimum Squad Requirement</p>
                      <p className="text-[11px] sm:text-xs text-blue-600 mt-0.5 sm:mt-1">A minimum of 11 players is required. You can add up to 15 players total.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    <div className="md:col-span-2">
                      <Label className="text-sm sm:text-base font-semibold text-slate-700">Team Logo</Label>
                      <p className="text-xs sm:text-sm text-slate-400 mt-0.5 mb-2">Upload your team logo (square image recommended)</p>
                      <div className="relative">
                        <Input
                          id="teamLogo"
                          type="file"
                          accept="image/*"
                          {...register("teamLogo", { required: true })}
                          className="peer pr-11 h-11 sm:h-12 text-sm sm:text-base rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-slate-900/10"
                        />
                        <Upload className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 pointer-events-none" />
                      </div>
                      {errors.teamLogo && <p className="text-red-500 text-xs sm:text-sm mt-1.5">Team logo is required</p>}
                    </div>

                    {[
                      { id: "teamName", label: "Team Name", placeholder: "E.g., Desert Hawks", required: true, icon: Shield, hint: "Choose a unique name for your team" },
                      { id: "captainName", label: "Captain Name", placeholder: "Full name of team captain", required: true, icon: User, hint: "The captain will be the primary contact" },
                      { id: "coachName", label: "Coach Name", placeholder: "Full name (optional)", required: false, icon: User, hint: "Team coach name" },
                      { id: "managerName", label: "Manager Name", placeholder: "Full name (optional)", required: false, icon: User, hint: "Team manager name" },
                      { id: "contactNumber", label: "Contact Number", placeholder: "+977 9812345678", required: true, icon: Phone, hint: "Primary contact number" },
                      { id: "email", label: "Email Address", placeholder: "team@example.com", required: false, icon: Mail, hint: "Team email for notifications" },
                    ].map((f) => (
                      <div key={f.id}>
                        <Label htmlFor={f.id} className="text-sm sm:text-base font-semibold text-slate-700 flex items-center gap-2">
                          <f.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                          {f.label}
                          {f.required && <span className="text-red-500 text-xs sm:text-sm">*</span>}
                        </Label>
                        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 mb-1.5 sm:mb-2">{f.hint}</p>
                        <Input
                          id={f.id}
                          type={(f as any).type || "text"}
                          {...register(f.id as any, { required: f.required })}
                          placeholder={f.placeholder}
                          className="h-11 sm:h-12 text-sm sm:text-base rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-slate-900/10 transition-all"
                        />
                        {f.required && errors[f.id as keyof TeamForm] && <p className="text-red-500 text-xs sm:text-sm mt-1.5">This field is required</p>}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end mt-8 sm:mt-10">
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white hover:opacity-90 shadow-lg shadow-purple-500/25 transition-all"
                    >
                      Next: Add Players
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Squad */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="p-4 sm:p-6 md:p-8 lg:p-10"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2.5 sm:p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md shadow-purple-500/20">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">Squad Details</h2>
                        <p className="text-xs sm:text-sm text-slate-500">Min 11 players required</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-purple-200 self-start sm:self-auto">
                      <span className="text-xs sm:text-sm text-slate-500">Added</span>
                      <span className="text-base sm:text-lg font-bold text-slate-900">{filledPlayers}</span>
                      <span className="text-xs sm:text-sm text-slate-400">/15</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-5 sm:mb-6">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-emerald-800">Player Verification Codes</p>
                      <p className="text-[11px] sm:text-xs text-emerald-600 mt-0.5 sm:mt-1">Enter a player's code from a previous season to auto-verify their details.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto -mx-2 px-2">
                    <div className="space-y-2.5 sm:space-y-3">
                      {players.map((player, i) => {
                        const isRequired = i < 11;
                        const codeStatus = codeErrors[i];
                        const isVerified = codeStatus?.startsWith("Verified");

                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className={`flex flex-col gap-2 p-3 sm:p-4 rounded-xl transition-all ${
                              isRequired && !player.name
                                ? "bg-red-50 border border-red-200"
                                : isVerified
                                ? "bg-emerald-50 border border-emerald-200"
                                : "bg-slate-50 border border-slate-100 hover:border-slate-200"
                            }`}
                          >
                            {/* Mobile: Number + Required badge on top */}
                            <div className="flex items-center gap-2 sm:hidden">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                isRequired ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                              }`}>
                                {i + 1}
                              </div>
                              {isRequired && (
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required</span>
                              )}
                              {codeStatus && (
                                <p className={`text-[11px] ml-auto truncate ${isVerified ? "text-emerald-600" : "text-red-500"}`}>
                                  {codeStatus}
                                </p>
                              )}
                            </div>

                            {/* Desktop row */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                              {/* Desktop: Number */}
                              <div className="hidden sm:flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                                  isRequired ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                                }`}>
                                  {i + 1}
                                </div>
                                {isRequired && (
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required</span>
                                )}
                              </div>

                              <Input
                                placeholder="Player full name"
                                value={player.name}
                                onChange={(e) => updatePlayer(i, "name", e.target.value)}
                                className={`h-10 sm:h-10 text-sm rounded-lg bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 w-full sm:w-44 ${
                                  isRequired && !player.name ? "border-red-300" : ""
                                }`}
                              />
                              <select
                                value={player.position}
                                onChange={(e) => updatePlayer(i, "position", e.target.value)}
                                className={`h-10 sm:h-10 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 px-3 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none w-full sm:w-36 transition-all ${
                                  isRequired && !player.position ? "border-red-300" : ""
                                }`}
                              >
                                <option value="" className="bg-white">Select role</option>
                                {ROLES.map((r) => <option key={r} value={r} className="bg-white">{r}</option>)}
                              </select>
                              <Input
                                placeholder="#"
                                value={player.jerseyNumber}
                                onChange={(e) => updatePlayer(i, "jerseyNumber", e.target.value)}
                                className={`h-10 sm:h-10 text-sm rounded-lg bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 w-full sm:w-16 text-center ${
                                  isRequired && !player.jerseyNumber ? "border-red-300" : ""
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <Input
                                  placeholder="Player code (optional)"
                                  value={player.code}
                                  onChange={(e) => updatePlayer(i, "code", e.target.value)}
                                  className={`h-10 sm:h-10 text-sm rounded-lg bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 ${
                                    codeStatus ? (isVerified ? "border-emerald-300" : "border-red-300") : ""
                                  }`}
                                />
                                {/* Desktop: Code status */}
                                {codeStatus && (
                                  <p className={`text-[11px] sm:text-xs mt-1 truncate hidden sm:block ${isVerified ? "text-emerald-600" : "text-red-500"}`}>
                                    {codeStatus}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-5 sm:mt-6 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                      <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-slate-900" />
                      Required (first 11)
                    </span>
                    <span className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                      <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-emerald-100 border border-emerald-300" />
                      Verified code
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-8 sm:mt-10">
                    <Button type="button" variant="outline" onClick={prevStep} className="text-sm sm:text-base rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 px-4 sm:px-6 py-2.5 sm:py-3">
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white hover:opacity-90 shadow-lg shadow-purple-500/25 transition-all"
                    >
                      Next: Payment
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="p-4 sm:p-6 md:p-8 lg:p-10"
                >
                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="p-2.5 sm:p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md shadow-purple-500/20">
                      <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">Payment</h2>
                      <p className="text-xs sm:text-sm text-slate-500">Scan QR and upload receipt</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 sm:p-4 bg-violet-50 border border-violet-200 rounded-xl mb-5 sm:mb-6">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-violet-800">How to Complete Payment</p>
                      <p className="text-[11px] sm:text-xs text-violet-600 mt-0.5 sm:mt-1">Scan the QR code using eSewa, Khalti, or any compatible payment app. Upload the screenshot below after payment.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                    {/* QR Code Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-purple-200">
                      <Label className="text-sm sm:text-base font-semibold text-slate-700 uppercase tracking-wider">Scan to Pay</Label>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-4 sm:mb-5">Use any payment app to scan the QR code</p>

                      {qrImages.length > 0 ? (
                        <div className="flex gap-3 sm:gap-4 flex-wrap">
                          {qrImages.map((url, i) => (
                            <div
                              key={i}
                              className="w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 bg-white rounded-xl overflow-hidden cursor-pointer hover:ring-4 hover:ring-slate-300 transition-all shadow-md"
                              onClick={() => setZoomImage(url)}
                            >
                              <img src={url} alt={`QR ${i + 1}`} className="w-full h-full object-contain p-2 sm:p-3" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400">
                          <ImageIcon className="w-7 h-7 sm:w-8 sm:h-8 mb-2" />
                          <span className="text-xs sm:text-sm">No QR codes available</span>
                        </div>
                      )}

                      <p className="text-[11px] sm:text-xs text-slate-400 mt-3 sm:mt-4">Click on QR code to zoom in</p>

                      <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-5">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => { setPaymentModalMethod("esewa"); setPaymentModalOpen(true); }}
                          className="flex items-center gap-1.5 sm:gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-xl px-3 sm:px-5 py-2 sm:py-2.5"
                        >
                          <Wallet className="w-4 h-4" />
                          <span className="text-xs sm:text-sm font-medium">Pay with eSewa</span>
                          <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-50" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => { setPaymentModalMethod("khalti"); setPaymentModalOpen(true); }}
                          className="flex items-center gap-1.5 sm:gap-2 border-violet-300 text-violet-700 hover:bg-violet-50 rounded-xl px-3 sm:px-5 py-2 sm:py-2.5"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span className="text-xs sm:text-sm font-medium">Pay with Khalti</span>
                          <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-50" />
                        </Button>
                      </div>
                    </div>

                    {/* Receipt Upload + Summary */}
                    <div className="space-y-5 sm:space-y-6">
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-purple-200">
                        <Label htmlFor="paymentReceipt" className="text-sm sm:text-base font-semibold text-purple-800 uppercase tracking-wider">Upload Receipt</Label>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-3 sm:mb-4">Upload a screenshot or PDF of your payment</p>

                        <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 sm:p-8 text-center hover:border-slate-400 transition-all hover:bg-white group">
                          <Upload className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-slate-300 mb-2 sm:mb-3 group-hover:text-slate-400 transition-colors" />
                          <Input
                            id="paymentReceipt"
                            type="file"
                            accept="image/*,application/pdf"
                            {...register("paymentReceipt", {
                              validate: (value) => {
                                if (!value || value.length === 0) return "Payment receipt is required";
                                return true;
                              },
                            })}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <p className="text-sm sm:text-base text-slate-600 font-medium">Click to upload or drag and drop</p>
                          <p className="text-xs sm:text-sm text-slate-400 mt-1">PNG, JPG or PDF (max 5MB)</p>
                        </div>
                        {errors.paymentReceipt && <p className="text-red-500 text-xs sm:text-sm mt-2">{errors.paymentReceipt.message as string}</p>}
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-purple-200">
                        <h3 className="text-sm sm:text-base font-semibold text-purple-800 uppercase tracking-wider mb-3 sm:mb-4">Registration Summary</h3>
                        <div className="space-y-2.5 sm:space-y-3">
                          <div className="flex justify-between items-center py-2 sm:py-2.5 border-b border-slate-200">
                            <span className="text-xs sm:text-sm text-slate-500">Players Added</span>
                            <span className="text-sm sm:text-base font-bold text-slate-900">{filledPlayers}/15</span>
                          </div>
                          <div className="flex justify-between items-center py-2 sm:py-2.5 border-b border-slate-200">
                            <span className="text-xs sm:text-sm text-slate-500">Season</span>
                            <span className="text-sm sm:text-base font-bold text-slate-900">{seasonNumber ? `Season ${seasonNumber}` : "—"}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 sm:py-2.5">
                            <span className="text-xs sm:text-sm text-slate-500">Status</span>
                            <span className="text-xs sm:text-sm px-2.5 sm:px-3 py-1 bg-amber-50 text-amber-700 rounded-full font-medium border border-amber-200">Pending Verification</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-8 sm:mt-10">
                    <Button type="button" variant="outline" onClick={prevStep} className="text-sm sm:text-base rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 px-4 sm:px-6 py-2.5 sm:py-3">
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="px-6 sm:px-10 py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white hover:opacity-90 shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" /> Submitting...</>
                      ) : (
                        "Submit Registration"
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs sm:text-sm text-slate-400 mt-6 sm:mt-8"
        >
          UPPL T20 League &middot; All rights reserved
        </motion.p>
      </div>

      {/* Zoom modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setZoomImage(null)}>
          <img src={zoomImage} alt="Zoomed QR" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        method={paymentModalMethod}
        qrImages={qrImages}
        onZoomImage={(url) => {
          setPaymentModalOpen(false);
          setZoomImage(url);
        }}
      />

      {/* Error/Success Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200 mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-base sm:text-lg font-bold">
              {dialogType === "error" ? (
                <div className="p-2 bg-red-100 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              ) : (
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              )}
              {dialogTitle}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-slate-500 mt-2 whitespace-pre-line">
              {dialogMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => setDialogOpen(false)}
              className={`px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold text-sm sm:text-base ${
                dialogType === "error"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {dialogType === "error" ? "Got it" : "Great"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentRegistration;
