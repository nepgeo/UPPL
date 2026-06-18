import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { createTeam } from "@/services/teamService";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, ImageIcon, ZoomIn, ChevronRight, Check, Trophy, User, Shield, ShieldCheck, CreditCard, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { API_BASE } from "@/config";
import { motion } from "framer-motion";

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
const REGISTRATION_FEE = 100;
const PAYMENT_METHODS = [
  { value: "esewa", label: "eSewa", icon: Wallet, color: "bg-green-600" },
  { value: "khalti", label: "Khalti", icon: CreditCard, color: "bg-purple-600" },
  { value: "bank", label: "Bank Transfer", icon: CreditCard, color: "bg-blue-600" },
];

const STEPS = [
  { label: "Team Info", icon: Trophy },
  { label: "Squad", icon: Shield },
  { label: "Payment", icon: CreditCard },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const TournamentRegistration = () => {
  const { toast } = useToast();
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
  const [paymentMethod, setPaymentMethod] = useState("esewa");

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
              ? `❌ Already in team: ${res.data.teamName}`
              : `✅ Verified: ${res.data.name}`,
          }));
        } else {
          setCodeErrors((prev) => ({ ...prev, [index]: "⚠️ No player found with this code" }));
        }
      } catch {
        setCodeErrors((prev) => ({ ...prev, [index]: "⚠️ Could not verify code" }));
      }
    }
  };

  const redirectToEsewa = (teamId: string) => {
    const pid = `UPPL-${teamId}-${Date.now()}`;
    const amt = REGISTRATION_FEE;

    localStorage.setItem("pplt_esewa_pending", JSON.stringify({ teamId, pid, amt }));

    const successUrl = `${window.location.origin}/payment-success?pid=${pid}`;
    const failureUrl = `${window.location.origin}/payment-failed`;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://uat.esewa.com.np/epay/main";

    const fields: Record<string, string | number> = {
      amt,
      psc: 0,
      pdc: 0,
      txAmt: 0,
      tAmt: amt,
      pid,
      scd: "EPAYTEST",
      su: successUrl,
      fu: failureUrl,
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
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
      errors.forEach((msg) => toast({ title: "Error", description: msg, variant: "destructive" }));
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
    formData.append("paymentMethod", paymentMethod);
    if (seasonId) formData.append("seasonNumber", seasonId);
    if (data.teamLogo?.[0]) formData.append("teamLogo", data.teamLogo[0]);
    if (paymentMethod !== "esewa" && data.paymentReceipt?.[0]) {
      formData.append("paymentReceipt", data.paymentReceipt[0]);
    }
    formData.append("players", JSON.stringify(preparedPlayers));

    const token = localStorage.getItem("pplt20_token");
    if (!token) {
      toast({ title: "Error", description: "You must be logged in to register.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await createTeam(formData);

      if (paymentMethod === "esewa") {
        const teamId = result.team?._id;
        if (!teamId) {
          toast({ title: "Error", description: "Team created but ID not returned. Please contact support.", variant: "destructive" });
          return;
        }
        redirectToEsewa(teamId);
      } else {
        toast({ title: "Success", description: "✅ Team registered! Awaiting verification." });
        reset();
        setPlayers(Array.from({ length: 15 }, () => ({ name: "", position: "", jerseyNumber: "", code: "" })));
        setStep(0);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Submission failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 2));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-12">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 py-12 sm:py-16 relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Team Registration</h1>
          </div>
          <p className="text-blue-200/80 max-w-xl text-sm sm:text-base">
            Register your team for UPPL T20{seasonNumber ? ` Season ${seasonNumber}` : ""}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-7 relative z-10">
        {/* Steps */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/80 p-3 mb-8">
          <div className="flex items-center justify-center gap-1 sm:gap-4">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-1 sm:gap-2">
                <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all ${
                  i === step ? "bg-blue-600 text-white shadow-md" : i < step ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                }`}>
                  <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-[11px] sm:text-xs font-semibold hidden sm:inline">{s.label}</span>
                  {i < step && <Check className="w-3 h-3" />}
                </div>
                {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 0: Team Info */}
          {step === 0 && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <Card className="border border-gray-100/80 shadow-sm rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-white flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-blue-500 to-cyan-500" />
                  <span className="text-sm font-bold text-gray-800">Team Information</span>
                </div>
                <CardContent className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <motion.div variants={itemVariants} className="lg:col-span-1">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Team Logo</Label>
                      <div className="mt-2 relative">
                        <Input id="teamLogo" type="file" accept="image/*" {...register("teamLogo", { required: true })} className="peer pr-10 h-10 text-sm rounded-xl" />
                        <Upload className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.teamLogo && <p className="text-red-500 text-xs mt-1">Logo is required</p>}
                    </motion.div>

                    {[
                      { id: "teamName", label: "Team Name", placeholder: "E.g., Desert Hawks", required: true },
                      { id: "captainName", label: "Captain Name", placeholder: "Full name", required: true },
                      { id: "coachName", label: "Coach Name", placeholder: "Full name", required: false },
                      { id: "managerName", label: "Manager Name", placeholder: "Full name", required: false },
                      { id: "contactNumber", label: "Contact Number", placeholder: "+977 9812345678", required: true },
                      { id: "email", label: "Email", placeholder: "team@example.com", required: false, type: "email" },
                    ].map((f) => (
                      <motion.div key={f.id} variants={itemVariants}>
                        <Label htmlFor={f.id} className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{f.label}</Label>
                        <Input
                          id={f.id}
                          type={(f as any).type || "text"}
                          {...register(f.id as any, { required: f.required })}
                          placeholder={f.placeholder}
                          className="mt-1.5 h-10 text-sm rounded-xl"
                        />
                        {f.required && errors[f.id as keyof TeamForm] && <p className="text-red-500 text-xs mt-1">Required</p>}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end mt-6">
                <Button type="button" onClick={nextStep} className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                  Next: Squad Details
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Squad */}
          {step === 1 && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <Card className="border border-gray-100/80 shadow-sm rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
                    <span className="text-sm font-bold text-gray-800">Squad Details</span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {players.filter((p) => p.name.trim()).length}/15 filled
                  </span>
                </div>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/80">
                          <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                          <th className="text-left py-3 px-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Player Name</th>
                          <th className="text-left py-3 px-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">Role</th>
                          <th className="text-center py-3 px-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-20">Jersey</th>
                          <th className="text-left py-3 px-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-40">Player Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.map((player, i) => {
                          const isRequired = i < 11;
                          const hasError = isRequired && (!player.name.trim() || !player.position.trim() || !player.jerseyNumber.trim());
                          const codeStatus = codeErrors[i];
                          const isVerified = codeStatus?.startsWith("✅");
                          const isError = codeStatus?.startsWith("❌") || codeStatus?.startsWith("⚠️");

                          return (
                            <tr key={i} className={`border-b border-gray-50 transition-colors ${hasError ? "bg-red-50/40" : isVerified ? "bg-emerald-50/30" : "hover:bg-blue-50/30"}`}>
                              <td className="py-2.5 px-4">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                                    i < 11 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
                                  }`}>{i + 1}</span>
                                  {i < 11 && <span className="text-[8px] font-semibold text-blue-500 uppercase">REQ</span>}
                                </div>
                              </td>
                              <td className="py-2.5 px-2">
                                <Input
                                  placeholder="Full name"
                                  value={player.name}
                                  onChange={(e) => updatePlayer(i, "name", e.target.value)}
                                  className={`h-9 text-xs rounded-lg ${isRequired && !player.name ? "border-red-300 focus:border-red-500" : ""}`}
                                />
                              </td>
                              <td className="py-2.5 px-2">
                                <select
                                  value={player.position}
                                  onChange={(e) => updatePlayer(i, "position", e.target.value)}
                                  className={`w-full h-9 text-xs rounded-lg border px-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                                    isRequired && !player.position ? "border-red-300" : "border-gray-200"
                                  }`}
                                >
                                  <option value="">Select role</option>
                                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
                              </td>
                              <td className="py-2.5 px-2">
                                <Input
                                  placeholder="No."
                                  value={player.jerseyNumber}
                                  onChange={(e) => updatePlayer(i, "jerseyNumber", e.target.value)}
                                  className={`h-9 text-xs rounded-lg text-center ${isRequired && !player.jerseyNumber ? "border-red-300" : ""}`}
                                />
                              </td>
                              <td className="py-2.5 px-2">
                                <div className="relative">
                                  <Input
                                    placeholder="Code (if registered)"
                                    value={player.code}
                                    onChange={(e) => updatePlayer(i, "code", e.target.value)}
                                    className={`h-9 text-xs rounded-lg ${codeStatus ? (isVerified ? "border-emerald-300" : "border-red-300") : ""}`}
                                  />
                                  {codeStatus && (
                                    <p className={`text-[10px] mt-0.5 ${isVerified ? "text-emerald-600" : "text-red-500"}`}>
                                      {codeStatus}
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-4">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-200" /> Required (first 11)</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> Verified code</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between mt-6">
                <Button type="button" variant="outline" onClick={prevStep} className="text-sm rounded-xl">Back</Button>
                <Button type="button" onClick={nextStep} className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                  Next: Payment
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <Card className="border border-gray-100/80 shadow-sm rounded-2xl overflow-hidden mb-6">
                <div className="px-5 py-4 border-b border-gray-100 bg-white flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
                  <span className="text-sm font-bold text-gray-800">Payment Method</span>
                </div>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setPaymentMethod(m.value)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          paymentMethod === m.value
                            ? `${m.color} border-transparent text-white shadow-md`
                            : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <m.icon className="w-5 h-5" />
                        <span className="text-sm font-semibold">{m.label}</span>
                        {paymentMethod === m.value && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div>
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Scan to Pay</Label>
                      <p className="text-xs text-gray-400 mt-1 mb-3">Scan the QR code using your {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label} app</p>
                      {qrImages.length > 0 ? (
                        <div className="flex gap-3 flex-wrap">
                          {qrImages.map((url, i) => (
                            <div
                              key={i}
                              className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-blue-300 transition-colors group"
                              onClick={() => setZoomImage(url)}
                            >
                              <img src={url} alt={`QR ${i + 1}`} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                          <ImageIcon className="w-6 h-6 mb-1" />
                          <span className="text-[10px]">No QR codes</span>
                        </div>
                      )}
                    </div>

                    {paymentMethod !== "esewa" && (
                      <div>
                        <Label htmlFor="paymentReceipt" className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Upload Payment Receipt</Label>
                        <div className="mt-2 relative">
                          <Input
                            id="paymentReceipt"
                            type="file"
                            accept="image/*,application/pdf"
                            {...register("paymentReceipt", {
                              validate: (value) => {
                                if (paymentMethod !== "esewa" && (!value || value.length === 0)) {
                                  return "Receipt is required";
                                }
                                return true;
                              },
                            })}
                            className="peer pr-10 h-10 text-sm rounded-xl"
                          />
                          <Upload className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        {errors.paymentReceipt && <p className="text-red-500 text-xs mt-1">{errors.paymentReceipt.message as string}</p>}
                        <p className="text-xs text-gray-400 mt-2">Upload screenshot or PDF of your transaction</p>
                      </div>
                    )}

                    {paymentMethod === "esewa" && (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                          <Wallet className="w-7 h-7 text-green-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-800">Pay with eSewa</p>
                        <p className="text-xs text-gray-400 mt-1">You'll be redirected to eSewa to complete the payment after submitting.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className="border border-gray-100/80 shadow-sm rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-white flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                  <span className="text-sm font-bold text-gray-800">Registration Summary</span>
                </div>
                <CardContent className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    {[
                      { label: "Players", value: `${players.filter((p) => p.name.trim()).length}/15` },
                      { label: "Payment Method", value: PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label || "" },
                      { label: "Season", value: seasonNumber ? `Season ${seasonNumber}` : "—" },
                      { label: "Status", value: "Pending verification" },
                    ].map((s) => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                        <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{s.label}</div>
                        <div className="text-sm font-bold text-gray-800 mt-0.5">{s.value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between mt-6">
                <Button type="button" variant="outline" onClick={prevStep} className="text-sm rounded-xl">Back</Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    paymentMethod === "esewa" ? "Pay with eSewa" : "Submit Registration"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </form>
      </div>

      {/* Zoom modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setZoomImage(null)}>
          <img src={zoomImage} alt="Zoomed QR" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default TournamentRegistration;
