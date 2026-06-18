import React, { useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  UserPlus, Trophy, Upload, FileText, Plus, X, Zap,
  Users, Check, Eye, EyeOff, Mail, UserCircle, Phone, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, ShieldCheck, Loader2, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Calendar } from "@/components/ui/calendar";
import { motion } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getGoogleAuthToken, getFacebookAuthToken } from "@/services/firebase";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const hasLower = new RegExp('[a-z]'), hasUpper = new RegExp('[A-Z]'), hasDigit = new RegExp('\\d'), hasSpecial = new RegExp('[^a-zA-Z0-9]');

function getPasswordStrength(password: string): { score: number; label: string; color: string; bg: string } {
  if (!password) return { score: 0, label: '', color: '', bg: '' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (hasLower.test(password) && hasUpper.test(password)) score += 1;
  if (hasDigit.test(password)) score += 1;
  if (hasSpecial.test(password)) score += 1;
  if (score <= 1) return { score, label: 'Weak', color: 'text-red-500', bg: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'text-orange-500', bg: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-500' };
  if (score <= 4) return { score, label: 'Strong', color: 'text-green-500', bg: 'bg-green-500' };
  return { score, label: 'Very Strong', color: 'text-green-600', bg: 'bg-green-600' };
}

const Register = () => {
  const [searchParams] = useSearchParams();
  const registrationType = searchParams.get('type') || 'user';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: registrationType,
    phone: '',
    bio: '',
    position: '',
    battingStyle: '',
    bowlingStyle: '',
    dob: '',
    profileImage: null as File | null,
    documents: [] as File[],
  });

  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const { register, loading, socialLogin } = useAuth();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<Date>(
    formData.dob ? new Date(formData.dob) : new Date()
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const dateRegex = new RegExp('^\\d{0,4}-?\\d{0,2}-?\\d{0,2}$');

  const strength = getPasswordStrength(formData.password);

  const handleChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFileChange = (field: string, files: FileList | null) => {
    if (!files) return;
    if (field === 'documents') {
      setFormData(prev => ({ ...prev, documents: [...prev.documents, ...Array.from(files)] }));
    } else if (field === 'profileImage') {
      const file = files[0];
      setFormData(prev => ({ ...prev, profileImage: file }));
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const removeDocument = (index: number) => {
    setFormData((prev) => {
      const updatedDocs = [...prev.documents];
      updatedDocs.splice(index, 1);
      return { ...prev, documents: updatedDocs };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (formData.role === 'player') {
      if (!formData.position || !formData.dob || formData.documents.length === 0) {
        setError('Players must provide position, date of birth, and upload required documents');
        return;
      }
    }

    const fd = new FormData();
    fd.append('name', formData.name);
    fd.append('email', formData.email);
    fd.append('password', formData.password);
    fd.append('role', formData.role);
    if (formData.phone) fd.append('phone', formData.phone);

    if (formData.role === 'player') {
      if (formData.bio) fd.append('bio', formData.bio);
      if (formData.position) fd.append('position', formData.position);
      if (formData.battingStyle) fd.append('battingStyle', formData.battingStyle);
      if (formData.bowlingStyle) fd.append('bowlingStyle', formData.bowlingStyle);
      if (formData.dob) fd.append('dateOfBirth', formData.dob);
      if (formData.profileImage) fd.append('profileImage', formData.profileImage);
      formData.documents.forEach((doc) => fd.append('documents', doc));
    }

    try {
      const success = await register(fd);
      if (success) {
        toast({ title: 'Registration successful!', description: 'Welcome to the platform.' });
        navigate('/');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      setEmailError('');
      setPhoneError('');
      if (message.includes('Email')) setEmailError(message);
      if (message.includes('Phone')) setPhoneError(message);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    try {
      let email = "";
      let name = "";

      if (provider === "google") {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
          toast({
            title: "Google sign-in not configured",
            description: "Set VITE_GOOGLE_CLIENT_ID in .env or use email/password.",
            variant: "destructive",
          });
          return;
        }
        const accessToken = await getGoogleAuthToken();
        const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const userInfo = await res.json();
        email = userInfo.email;
        name = userInfo.name || email.split("@")[0];
      } else {
        const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
        if (!appId) {
          toast({
            title: "Facebook sign-in not configured",
            description: "Set VITE_FACEBOOK_APP_ID in .env or use email/password.",
            variant: "destructive",
          });
          return;
        }
        const fbUser = await getFacebookAuthToken();
        email = fbUser.email;
        name = fbUser.name;
      }

      if (!email) throw new Error("Could not get email from provider");
      const { success } = await socialLogin(email, name, provider);
      if (!success) throw new Error("Backend authentication failed");
      toast({ title: "Welcome!", description: `Signed in with ${provider}` });
      navigate("/");
    } catch (err: any) {
      if (err?.error === "popup_closed_by_user" || err?.message?.includes("user closed")) return;
      toast({
        title: `${provider} sign-in failed`,
        description: err?.message || "Please try again or use email/password.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 overflow-hidden px-4 py-8">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-2xl mx-auto"
      >
        <Card className="rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl border-0 overflow-hidden">
          {/* Brand header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 px-6 pt-8 pb-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative z-10"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/15 backdrop-blur-sm rounded-xl mb-4 ring-1 ring-white/20">
                <Trophy className="w-7 h-7 text-yellow-300" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {formData.role === 'player' ? 'Player Registration' : 'Create Account'}
              </CardTitle>
              <p className="text-blue-100 text-sm mt-1.5 max-w-md mx-auto">
                {formData.role === 'player'
                  ? 'Join the league as a professional cricket player'
                  : 'Become part of the UPPL T20 community'
                }
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-blue-200/70">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>UPPL T20 — Udaydev Patan Premier League</span>
              </div>
            </motion.div>
          </div>

          <CardContent className="p-6 md:p-8">
            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-6"
              >
                <Alert className="border-red-200 bg-red-50 py-2.5 rounded-xl">
                  <AlertDescription className="text-red-700 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    {error}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {/* Role Toggle */}
                <motion.div variants={itemVariants}>
                  <Label className="text-sm font-medium text-gray-700 block mb-3">
                    I want to register as
                  </Label>
                  <div className="flex rounded-xl bg-gray-100 p-1.5 gap-1">
                    <button
                      type="button"
                      onClick={() => handleChange('role', 'user')}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2.5 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                        formData.role === 'user'
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <Users className="w-4 h-4 shrink-0" />
                      <div className="text-left">
                        <div>User</div>
                        <div className={cn(
                          "text-[11px] font-normal leading-tight",
                          formData.role === 'user' ? "text-indigo-400" : "text-gray-400"
                        )}>
                          Fan / Supporter
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('role', 'player')}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2.5 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 relative",
                        formData.role === 'player'
                          ? "bg-white text-rose-600 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <Zap className="w-4 h-4 shrink-0" />
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span>Player</span>
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">PRO</span>
                        </div>
                        <div className={cn(
                          "text-[11px] font-normal leading-tight",
                          formData.role === 'player' ? "text-rose-400" : "text-gray-400"
                        )}>
                          Cricket Player
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Feature highlights */}
                  <motion.div
                    key={formData.role}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-500"
                  >
                    {formData.role === 'user' ? (
                      <>
                        <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Match Updates</span>
                        <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Team Support</span>
                        <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Live Scores</span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Tournament Entry</span>
                        <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Player Profile</span>
                        <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Statistics</span>
                      </>
                    )}
                  </motion.div>
                </motion.div>

                <div className="border-t border-gray-100" />

                {/* Personal Information */}
                <motion.div variants={itemVariants}>
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-gray-400" />
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">Full Name <span className="text-red-400">*</span></Label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <Input
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          className="pl-9 h-11 text-sm bg-gray-50 border-gray-200 focus:bg-white transition-colors rounded-xl"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">Email <span className="text-red-400">*</span></Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          className="pl-9 h-11 text-sm bg-gray-50 border-gray-200 focus:bg-white transition-colors rounded-xl"
                          placeholder="you@example.com"
                        />
                      </div>
                      {emailError && (
                        <p className="text-xs text-red-600 mt-1">{emailError}</p>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Password & Confirm */}
                <motion.div variants={itemVariants}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">Password <span className="text-red-400">*</span></Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => handleChange("password", e.target.value)}
                          className="pl-9 pr-10 h-11 text-sm bg-gray-50 border-gray-200 focus:bg-white transition-colors rounded-xl"
                          placeholder="Create a strong password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {/* Password hint */}
                      <p className="text-xs text-gray-400 mt-1">Min 6 characters with at least one number & uppercase letter</p>
                      {/* Strength meter */}
                      {formData.password && (
                        <div className="mt-2 space-y-1">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className={cn(
                                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                                  i <= strength.score ? strength.bg : "bg-gray-200"
                                )}
                              />
                            ))}
                          </div>
                          <p className={cn("text-xs font-medium", strength.color)}>{strength.label}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">Confirm Password <span className="text-red-400">*</span></Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => handleChange("confirmPassword", e.target.value)}
                          className="pl-9 pr-10 h-11 text-sm bg-gray-50 border-gray-200 focus:bg-white transition-colors rounded-xl"
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                      )}
                      {formData.confirmPassword && formData.password === formData.confirmPassword && (
                        <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Passwords match
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Phone */}
                <motion.div variants={itemVariants}>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="pl-9 h-11 text-sm bg-gray-50 border-gray-200 focus:bg-white transition-colors rounded-xl"
                        placeholder="Your contact number"
                        maxLength={15}
                      />
                    </div>
                    <div className="flex justify-between">
                      {phoneError && <p className="text-xs text-red-600">{phoneError}</p>}
                      <p className="text-xs text-gray-400 ml-auto">{formData.phone.length}{'/15'}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Player-Specific Fields */}
                {formData.role === 'player' && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="space-y-6 pt-2"
                  >
                    <div className="border-t border-gray-100" />
                      <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-rose-500" />
                        Player Details
                      </h3>

                      {/* Bio */}
                      <div className="space-y-1.5 mb-4">
                        <Label className="text-sm font-medium text-gray-700">Bio</Label>
                        <Textarea
                          value={formData.bio}
                          onChange={(e) => handleChange('bio', e.target.value)}
                          className="rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-rose-300 focus:ring-2 focus:ring-rose-200/50 transition-all min-h-[88px] text-sm resize-none"
                          placeholder="Tell us about yourself and your cricket journey..."
                          maxLength={500}
                        />
                        <p className="text-xs text-gray-400 text-right">{formData.bio.length}{'/500'}</p>
                      </div>

                      {/* DOB */}
                      <div className="space-y-1.5 mb-4">
                        <Label className="text-sm font-medium text-gray-700">
                          Date of Birth <span className="text-red-400">*</span>
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <Input
                                type="text"
                                value={formData.dob || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (dateRegex.test(value)) {
                                    handleChange("dob", value);
                                  }
                                }}
                                placeholder="YYYY-MM-DD"
                                className="w-full h-11 px-4 pr-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-rose-300 focus:ring-2 focus:ring-rose-200/50 transition-all text-sm"
                              />
                              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                            <div className="p-3 space-y-3">
                              <div className="flex gap-2">
                                <Select
                                  value={selectedDate.getFullYear().toString()}
                                  onValueChange={(year) => {
                                    const newDate = new Date(selectedDate);
                                    newDate.setFullYear(parseInt(year));
                                    setSelectedDate(newDate);
                                  }}
                                >
                                  <SelectTrigger className="flex-1 h-9 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[200px]">
                                    {Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - 100 + i).map((year) => (
                                      <SelectItem key={year} value={year.toString()}>
                                        {year}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={selectedDate.getMonth().toString()}
                                  onValueChange={(month) => {
                                    const newDate = new Date(selectedDate);
                                    newDate.setMonth(parseInt(month));
                                    setSelectedDate(newDate);
                                  }}
                                >
                                  <SelectTrigger className="flex-1 h-9 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {["January", "February", "March", "April", "May", "June",
                                      "July", "August", "September", "October", "November", "December"
                                    ].map((month, index) => (
                                      <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                  if (date) {
                                    setSelectedDate(date);
                                    handleChange("dob", format(date, "yyyy-MM-dd"));
                                  }
                                }}
                                month={selectedDate}
                                onMonthChange={setSelectedDate}
                                disabled={(date) => date > new Date() || date < new Date(1900, 0, 1)}
                                className="rounded-lg border-0"
                                classNames={{
                                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                  month: "space-y-4",
                                  caption: "flex justify-center pt-1 relative items-center",
                                  caption_label: "hidden",
                                  nav: "space-x-1 flex items-center",
                                  nav_button: cn("h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-gray-100 rounded-md transition-colors"),
                                  nav_button_previous: "absolute left-1",
                                  nav_button_next: "absolute right-1",
                                  table: "w-full border-collapse space-y-1",
                                  head_row: "flex",
                                  head_cell: "text-gray-500 rounded-md w-8 font-normal text-[0.8rem]",
                                  row: "flex w-full mt-2",
                                  cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                                  day: cn("h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"),
                                  day_selected: "bg-rose-600 text-white hover:bg-rose-700",
                                  day_today: "bg-gray-100 text-gray-900 font-semibold",
                                  day_outside: "text-gray-400 opacity-50",
                                  day_disabled: "text-gray-400 opacity-50 cursor-not-allowed",
                                }}
                                components={{
                                  IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                                  IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                                }}
                              />
                              <div className="flex gap-2 pt-2 border-t">
                                <Button type="button" variant="ghost" size="sm" className="flex-1 h-8 text-xs"
                                  onClick={() => {
                                    const today = new Date();
                                    setSelectedDate(today);
                                    handleChange("dob", format(today, "yyyy-MM-dd"));
                                  }}
                                >
                                  Today
                                </Button>
                                <Button type="button" variant="ghost" size="sm" className="flex-1 h-8 text-xs"
                                  onClick={() => {
                                    handleChange("dob", "");
                                    setSelectedDate(new Date());
                                  }}
                                >
                                  Clear
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        {formData.dob && (
                          <p className="text-xs text-gray-400 mt-1">
                            Selected: {format(new Date(formData.dob), "MMMM d, yyyy")}
                          </p>
                        )}
                      </div>

                      {/* Position & Styles */}
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700">Position <span className="text-red-400">*</span></Label>
                          <Select value={formData.position} onValueChange={(v) => handleChange('position', v)}>
                            <SelectTrigger className="h-11 text-sm rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-rose-300 focus:ring-2 focus:ring-rose-200/50">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="batsman">Batsman</SelectItem>
                              <SelectItem value="bowler">Bowler</SelectItem>
                              <SelectItem value="all-rounder">All-Rounder</SelectItem>
                              <SelectItem value="wicket-keeper">Wicket Keeper</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700">Batting Style</Label>
                          <Select value={formData.battingStyle} onValueChange={(v) => handleChange('battingStyle', v)}>
                            <SelectTrigger className="h-11 text-sm rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-rose-300 focus:ring-2 focus:ring-rose-200/50">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="right-handed">Right-handed</SelectItem>
                              <SelectItem value="left-handed">Left-handed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700">Bowling Style</Label>
                          <Select value={formData.bowlingStyle} onValueChange={(v) => handleChange('bowlingStyle', v)}>
                            <SelectTrigger className="h-11 text-sm rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-rose-300 focus:ring-2 focus:ring-rose-200/50">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="right-arm-fast">Right-arm Fast</SelectItem>
                              <SelectItem value="left-arm-fast">Left-arm Fast</SelectItem>
                              <SelectItem value="right-arm-spin">Right-arm Spin</SelectItem>
                              <SelectItem value="left-arm-spin">Left-arm Spin</SelectItem>
                              <SelectItem value="none">Don't Bowl</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* File Uploads */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700">Profile Photo</Label>
                          <div
                            onClick={() => document.getElementById('profileImage')?.click()}
                            className="relative flex items-center justify-center h-28 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-rose-300 hover:bg-rose-50/30 transition-all duration-200 cursor-pointer group overflow-hidden"
                          >
                            {profilePreview ? (
                              <img
                                src={profilePreview}
                                alt="Profile preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-1.5">
                                <Upload className="w-5 h-5 text-gray-400 group-hover:text-rose-400 transition-colors" />
                                <span className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">Upload photo</span>
                              </div>
                            )}
                          </div>
                          <Input
                            id="profileImage"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange('profileImage', e.target.files)}
                          />
                          {profilePreview && (
                            <button
                              type="button"
                              onClick={() => { setProfilePreview(null); handleChange('profileImage', null); }}
                              className="text-xs text-red-500 hover:text-red-600 transition-colors"
                            >
                              Remove photo
                            </button>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700">
                            Documents <span className="text-red-400">*</span>
                          </Label>
                          <div
                            onClick={() => document.getElementById('documents')?.click()}
                            className="relative flex items-center justify-center h-28 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-rose-300 hover:bg-rose-50/30 transition-all duration-200 cursor-pointer group"
                          >
                            <div className="flex flex-col items-center gap-1.5">
                              <Plus className="w-5 h-5 text-gray-400 group-hover:text-rose-400 transition-colors" />
                              <span className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">Add ID / birth certificate</span>
                            </div>
                          </div>
                          <input
                            id="documents"
                            type="file"
                            accept="image/*,.pdf"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFileChange('documents', e.target.files)}
                          />

                          {formData.documents.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {formData.documents.map((file, index) => (
                                <div
                                  key={index}
                                  className="relative flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs animate-in fade-in duration-200 group"
                                >
                                  <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span className="text-gray-600 truncate max-w-[100px]">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeDocument(index)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                )}

                {/* Submit Button */}
                <motion.div variants={itemVariants} className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 rounded-xl"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Account...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        {formData.role === 'player' ? 'Submit Player Application' : 'Create Account'}
                      </span>
                    )}
                  </Button>
                </motion.div>

                {/* Social login divider */}
                <motion.div variants={itemVariants}>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-gray-400">or sign up with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 text-sm font-medium border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all rounded-xl"
                      onClick={() => handleSocialLogin("google")}
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      <span className="hidden sm:inline">Google</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 text-sm font-medium border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all rounded-xl"
                      onClick={() => handleSocialLogin("facebook")}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span className="hidden sm:inline">Facebook</span>
                    </Button>
                  </div>
                </motion.div>

                {/* Login Link */}
                <motion.div variants={itemVariants}>
                  <p className="text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                    >
                      Sign in
                    </Link>
                  </p>
                </motion.div>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
