import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Eye, EyeOff,Mail,Lock, Key,Shield} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import axios from "axios";
import { motion } from "framer-motion";
import api from "@/lib/api";

import Mandir from "@/assets/images/Mandir.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, loading, forgotPassword } = useAuth();
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

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-purple-100 to-pink-50 px-4">
      <Card className="flex w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl bg-white/90 backdrop-blur-md -mt-20">

        {/* Left side */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-10">
          <h2
              className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-500 bg-clip-text text-transparent drop-shadow-sm animate-gradient"
            >
              Welcome Back,
            </h2>
          <img
            src={Mandir}
            alt="Login Illustration"
            className="rounded-xl shadow-lg mb-6"
          />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            
            <p className="text-base md:text-lg text-white/90 leading-relaxed max-w-md mx-auto text-center">
              Sign in to continue your journey with the{" "}
              <span className="font-semibold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                Udaydev Patan Premier League T20
              </span>{" "}
              portal.
            </p>

          </motion.div>
        </div>

        {/* Right side - login form */}
        <div className="flex flex-col justify-center w-full md:w-1/2 p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 inline-block relative">
              Sign In
              <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></span>
            </h2>
            <p className="text-sm text-gray-500 mt-4">Welcome back! Please enter your details.</p>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50 mb-4">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {/* {error && <p className="mt-1 text-sm text-red-600">{error}</p>} */}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Signing In…
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </>
              )}
            </Button>

            <button
              type="button"
              className="text-blue-500 hover:underline text-sm"
              onClick={() => setIsForgotPasswordOpen(true)}
            >
              Forgot Password?
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </Card>

      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <DialogTitle className="text-2xl font-bold">
              Forgot Password
            </DialogTitle>
            <DialogDescription className="text-sm mt-1 text-white/90">
              Enter your registered email to receive a password reset OTP
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div>
              <Label
                htmlFor="forgot-email"
                className="text-sm font-medium text-gray-700"
              >
                Registered Email
              </Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="mt-1"
              />
              {forgotEmailError && (
                <p className="mt-1 text-sm text-red-600">{forgotEmailError}</p>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setIsForgotPasswordOpen(false)}
              className="hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleForgotPassword}
              disabled={forgotLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {forgotLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                "Send OTP"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      


      {/* OTP Dialog */}
      <Dialog open={isOtpOpen} onOpenChange={setIsOtpOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
          <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <h2 className="text-2xl font-bold">Verify OTP</h2>
            <p className="text-sm mt-1">Enter the OTP sent to your registered email</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                OTP
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Didn't receive OTP?</span>
              <button
                onClick={handleResendOtp}
                className="text-blue-500 hover:text-blue-600 font-medium"
              >
                Resend OTP
              </button>
            </div>
          </div>
          <DialogFooter className="p-6 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsOtpOpen(false)} className="hover:bg-gray-100">
              Cancel
            </Button>
            <Button onClick={handleVerifyOtp} disabled={otpLoading} className="bg-blue-500 hover:bg-blue-600 text-white">
              {otpLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <Input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-2"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={resetLoading}>
              {resetLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Login Failed</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700">
            The email or password you entered is incorrect. Please try again.
          </p>
          <DialogFooter>
            <Button onClick={() => setIsErrorDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
