import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Key, Loader2, Trophy, ShieldCheck, ArrowRight, Chrome, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { getGoogleAuthToken, getFacebookAuthToken } from "@/services/firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, loading, forgotPassword, socialLogin } = useAuth();
  const navigate = useNavigate();

  // Forgot / OTP / Reset dialogs
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Forgot email
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // OTP states
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Reset password states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Error dialog
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
    // Add a new state for input error
const [forgotEmailError, setForgotEmailError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    const { success } = await login(email, password);

    if (success) {
      toast({ title: "Login Successful", description: "Welcome back!" });
      navigate("/");
    } else {
      setError("Email or password don't match"); // show under password
    }
  };






// Updated handleForgotPassword
 const handleForgotPassword = async () => {
  if (!forgotEmail) {
    setForgotEmailError('Please enter your email');
    return;
  }

  setForgotEmailError('');
  setForgotLoading(true);

  try {
    // Use directly so you can inspect status
    const res = await api.post("/api/auth/forgot-password", { email: forgotEmail });

    // Check backend response (example: { success: true/false, message })
    if (res.data?.success) {
      toast({
        title: "OTP Sent",
        description: "Check your email for the OTP."
      });
      setIsForgotPasswordOpen(false);
      setIsOtpOpen(true);
    } else {
      setForgotEmailError(res.data?.message || "Email not found");
    }

  } catch (err: any) {
    // Handle 404 or invalid email
    if (err.response?.status === 404) {
      setForgotEmailError('Email not found. Please check and try again.');
    } else {
      toast({
        title: "Error",
        description: err.response?.data?.message || err.message || 'Something went wrong',
        variant: "destructive",
      });
    }
  } finally {
    setForgotLoading(false);
  }
};


  const handleVerifyOtp = async () => {
  if (!otp) {
    toast({
      title: "Error",
      description: "Enter the OTP",
      variant: "destructive",
    });
    return;
  }

  setOtpLoading(true);

  try {
    console.log("📤 Sending OTP verify request:", { email: forgotEmail, otp });

    const response = await api.post("/api/auth/forgot-password/verify", {
      email: forgotEmail,
      otp,
    });

    console.log("✅ OTP verify response:", response.data);

    toast({
      title: "OTP Verified",
      description: "Proceed to reset password.",
    });

    setIsOtpOpen(false);
    setIsResetOpen(true);
  } catch (error: any) {
    console.error("❌ OTP verify error:", error?.response?.data || error.message);

    toast({
      title: "Invalid OTP",
      description: error?.response?.data?.message || "Please try again.",
      variant: "destructive",
    });
  } finally {
    setOtpLoading(false);
  }
};


  const handleResendOtp = async () => {
    try {
      await api.post("/api/auth/forgot-password/resend", { email: forgotEmail });
      toast({ title: "OTP Resent", description: "Check your email again." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || error.message,
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    setResetLoading(true);
    try {
      await api.post("/api/auth/reset-password", {
        email: forgotEmail,
        otp,
        newPassword,
      });
      toast({
        title: "Password Changed",
        description: "You can now login with your new password.",
      });
      setIsResetOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
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
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-4xl mx-auto"
      >
        <Card className="flex flex-col md:flex-row overflow-hidden rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl border-0">
          {/* Left side - Brand Panel (hidden on mobile) */}
          <div className="hidden md:flex relative flex-col justify-center items-center w-full md:w-5/12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white p-8 md:p-10 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/20">
                <Trophy className="w-8 h-8 text-yellow-300" />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">
                UPPL T20
              </h2>
              <div className="w-12 h-0.5 bg-gradient-to-r from-yellow-300 to-pink-400 rounded-full mb-4" />
              <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-xs">
                Udaydev Patan Premier League — Manage teams, track matches, and build the ultimate cricket community.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-white/60">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Secure admin portal</span>
              </div>
            </motion.div>
          </div>

          {/* Right side - Login Form */}
          <div className="flex flex-col justify-center w-full md:w-7/12 p-6 md:p-10">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full max-w-sm mx-auto"
            >
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  Welcome back
                </h1>
                <p className="text-sm text-gray-500 mt-1.5">
                  Sign in to your account to continue
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-5"
                >
                  <Alert className="border-red-200 bg-red-50 py-2.5">
                    <AlertDescription className="text-red-700 text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      {error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-11 text-sm bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-10 h-11 text-sm bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="remember" className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                  <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
                    Remember me
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-400">or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 text-sm font-medium border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
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
                    className="h-11 text-sm font-medium border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
                    onClick={() => handleSocialLogin("facebook")}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="hidden sm:inline">Facebook</span>
                  </Button>
                </div>
              </form>

              <p className="mt-8 text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  Create one
                </Link>
              </p>
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* Forgot Password Dialog */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-xl">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center mb-3 ring-1 ring-white/20">
              <Lock className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold">Forgot password?</DialogTitle>
            <DialogDescription className="text-sm mt-1 text-blue-100">
              Enter your email and we'll send you a reset OTP
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email" className="text-sm font-medium text-gray-700">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="pl-9 h-11 text-sm"
                />
              </div>
              {forgotEmailError && (
                <p className="text-sm text-red-600 flex items-center gap-1.5 mt-1">
                  <span className="w-1 h-1 rounded-full bg-red-600" />
                  {forgotEmailError}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 flex gap-2">
            <Button variant="outline" onClick={() => setIsForgotPasswordOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleForgotPassword} disabled={forgotLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OTP Dialog */}
      <Dialog open={isOtpOpen} onOpenChange={setIsOtpOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-xl">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center mb-3 ring-1 ring-white/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold">Verify OTP</DialogTitle>
            <DialogDescription className="text-sm mt-1 text-blue-100">
              Enter the code sent to {forgotEmail || "your email"}
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="otp" className="text-sm font-medium text-gray-700">One-time password</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="h-11 text-sm text-center tracking-[0.5em] font-mono"
                maxLength={6}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Didn't receive it?</span>
              <button onClick={handleResendOtp} className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Resend OTP
              </button>
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 flex gap-2">
            <Button variant="outline" onClick={() => setIsOtpOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleVerifyOtp} disabled={otpLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify OTP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-xl">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center mb-3 ring-1 ring-white/20">
              <Key className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold">Reset password</DialogTitle>
            <DialogDescription className="text-sm mt-1 text-blue-100">
              Choose a new password for your account
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">New password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9 h-11 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 h-11 text-sm"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 flex gap-2">
            <Button variant="outline" onClick={() => setIsResetOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleResetPassword} disabled={resetLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-xl">
          <DialogHeader>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-red-600 text-xl font-bold">!</span>
            </div>
            <DialogTitle className="text-lg text-center text-gray-900">Login Failed</DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-500">
              The email or password you entered is incorrect. Please try again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setIsErrorDialogOpen(false)} className="px-8 bg-blue-600 hover:bg-blue-700">
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
