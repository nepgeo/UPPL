import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogIn, Eye, EyeOff, Camera, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE, BASE_URL } from '@/config';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

import Logo from "@/assets/images/lg-removebg-preview.png";

import api from "@/lib/api"; 

interface FormDataType {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  profileImage: File | null;
  documents: File[];
  playerCode?: string; // Optional player code field
}





const Navbar = () => {
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const { user, logout, setUser, token } = useAuth() || {};
  const [imageZoomOpen, setImageZoomOpen] = useState(false); // For image zoom modal
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  // ✅ Normalize role to lowercase
  const role = user?.role?.toLowerCase();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    profileImage: null as File | null,
    documents: [],
    playerCode: user?.playerCode || "", // Initialize player code
  });

  useEffect(() => {
  // Auto-close menu when route changes
  setIsOpen(false);
}, [location.pathname]);

// Prevent background scroll when menu is open
useEffect(() => {
  if (isOpen) document.body.style.overflow = "hidden";
  else document.body.style.overflow = "";
}, [isOpen]);


  useEffect(() => {
    if (user) {
      console.log("User data updated:", user);
      setFormData({
        name: user.name || "",
        email: user.email || "",
        profileImage: null,
        documents: [],
        playerCode: user.playerCode || "", // Update player code if available
      });
    }
  }, [user]);

  

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const profileStrength = (() => {
    let score = 0;
    if (user?.name) score += 25;
    if (user?.email) score += 15;
    if (user?.profileImage) score += 30;
    const docs = (user as any)?.documents;
    if (docs && Array.isArray(docs) && docs.length > 0) score += 15;
    if ((user as any)?.playerCode) score += 15;
    return Math.min(score, 100);
  })();

  // 🚀 Auto-open profile dialog if user has no profile image
  // useEffect(() => {
  //   if (user && !user.profileImage) {
  //     console.log("No profile image, opening profile dialog:", user);
  //     setIsProfileOpen(true);
  //     setEditMode(true);
      
  //   }
  // }, [user]);

  const publicLinks = [
    { name: "Home", path: "/" },
    { name: "Schedule", path: "/schedule" },
    { name: "Teams", path: "/teams" },
    { name: "Players", path: "/players" },
    { name: "Live Scores", path: "/live-scores" },
    { name: "Points Table", path: "/points-table" },
    { name: "Watch Live", path: "/watch-live" },
    { name: "News", path: "/news" },
    { name: "Gallery", path: "/gallery" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSave = async () => {
  if (!user) return;
  if (!formData.name.trim()) {
    toast({ title: "Validation Error", description: "Name is required", variant: "destructive" });
    return;
  }

  setLoading(true);
  try {
    const fd = new FormData();
    fd.append("name", formData.name);
    fd.append("email", formData.email);

    if (formData.profileImage) {
      fd.append("profileImage", formData.profileImage);
    }

    if (role === "player" && formData.documents.length > 0) {
      formData.documents.forEach((doc) => fd.append("documents", doc));
    }

    const token = localStorage.getItem("pplt20_token");

    const userId = user.id || (user as any)._id;
    if (!userId) { toast({ title: "Error", description: "User ID missing", variant: "destructive" }); setLoading(false); return; }

    let endpoint = `/user/users/${userId}`;
    if (role === "admin" || role === "super-admin") {
      endpoint = `/admin/users/${userId}`;
    }

    const res = await api.patch(endpoint, fd, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });

    if (typeof setUser === "function") setUser(res.data.user);
    localStorage.setItem("pplt20_user", JSON.stringify(res.data.user));

    setIsProfileOpen(false);
    setEditMode(false);
    setPreviewUrl(null);
    toast({ title: "Profile updated successfully" });
  } catch (err: any) {
    console.error("Error updating profile:", err);
    toast({
      title: "Error updating profile",
      description: err.response?.data?.message || err.message || "Something went wrong",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};






  const handleChangePassword = async () => {
    if (!passwordData.oldPassword.trim()) {
      toast({ title: "Validation Error", description: "Old password is required", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: "Validation Error", description: "New password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Validation Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }

    const userId = user?.id || (user as any)?._id;
    if (!userId) {
      toast({ title: "Error", description: "User not found", variant: "destructive" });
      return;
    }

    try {
      await api.patch(`/user/${userId}/change-password`, {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });

      toast({ title: "Password updated successfully" });
      setChangePasswordOpen(false);
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast({
        title: "Error updating password",
        description: err.response?.data?.message || err.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };





  const getProfileImageUrl = (profileImage: any) => {
  if (!profileImage) {
    return `${BASE_URL}/favicon.png`; // fallback
  }

  // If Cloudinary object
  if (typeof profileImage === "object" && profileImage.url) {
    return profileImage.url;
  }

  // If already a string (old uploads)
  if (typeof profileImage === "string") {
    if (profileImage.startsWith("http")) {
      return profileImage;
    }

    let cleanPath = profileImage
      .replace(/\\/g, "/")
      .replace(/\/+/g, "/")
      .replace(/^\/uploads\/uploads\//, "/uploads/")
      .replace(/^uploads\//, "/uploads/");

    if (!cleanPath.startsWith("/")) {
      cleanPath = "/" + cleanPath;
    }

    return `${BASE_URL}${cleanPath}`;
  }

  return `${BASE_URL}/favicon.png`;
};






  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* First Line */}
        <div className="flex justify-between items-center h-16 border-b border-gray-100">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src={Logo}
              alt="UPPL Logo"
              className="h-14 sm:h-16 md:h-20 w-auto object-contain"
            />
          </Link>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* ✅ Admin link */}
                {(role === "admin" || role === "super-admin") && (
                  <Link
                    to="/admin"
                    className="hidden md:inline text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    <span className="uppercase">Admin Dashboard</span>
                  </Link>
                )}

                {/* ✅ Player Profile link */}
                {role === "player" && user?.verified && (
                  <Link
                    to="/player-profile"
                    className="text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    <span className="uppercase">My Profile</span>
                  </Link>
                )}

                {/* ✅ Always show profile + logout if logged in */}
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => setIsProfileOpen(true)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getProfileImageUrl(user?.profileImage)} alt={user?.name} />
                    <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {user?.name || "Unnamed"}
                  </span>
                </div>

                <Button                 
                className="
                  hidden md:inline-flex
                  transition-all duration-300 ease-in-out 
                  hover:scale-105 hover:text-white
                  hover:bg-gradient-to-r hover:from-[#A23CCF] hover:to-[#D4429D]
                  hover:shadow-[0_0_15px_#D4429D]
                "
                onClick={logout} variant="outline" size="sm">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button
                  size="sm"
                  className="
                    px-2 py-1 text-xs
                    md:px-4 md:py-2 md:text-sm
                    transition-all duration-300 ease-in-out
                    hover:scale-105 hover:text-white
                    hover:bg-gradient-to-r hover:from-[#A23CCF] hover:to-[#D4429D]
                    hover:shadow-[0_0_10px_#D4429D]
                    flex items-center
                  "
                  variant="outline"
                >
                  <LogIn className="h-3 w-3 mr-1 md:h-4 md:w-4" />
                  <span className="uppercase">Login</span>
                </Button>
              </Link>

              <Link to="/register">
                <Button
                  size="sm"
                  className="
                    px-2 py-1 text-xs
                    md:px-4 md:py-2 md:text-sm
                  "
                >
                  <span className="uppercase">Register</span>
                </Button>
              </Link>
            </div>

            )}
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Second Line */}
        <div className="hidden md:flex items-center justify-center h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800">
          {publicLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`mx-5 text-sm font-medium transition-colors hover:text-blue-200 ${
                isActive(link.path)
                  ? "text-white font-semibold"
                  : "text-blue-100"
              }`}
            >
               <span className="uppercase">{link.name}</span>
             </Link>
           ))}
         </div>

         {/* Mobile Navigation */}
        <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Sidebar Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="fixed inset-y-0 right-0 z-50 w-[85%] sm:w-80 md:w-96 
                        bg-gradient-to-br from-blue-700 via-purple-700 to-pink-600 
                        text-white shadow-2xl flex flex-col rounded-l-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/20 sticky top-0 bg-gradient-to-br from-blue-700 via-purple-700 to-pink-600 z-50">
                <h2 className="text-lg font-bold tracking-wide">Menu</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:scale-110 transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Links */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
                <nav className="space-y-2">
                  {publicLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 uppercase ${
                        isActive(link.path)
                          ? "bg-white text-blue-700 shadow-md"
                          : "hover:bg-white/20 hover:translate-x-2"
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </nav>

                {(role === "admin" || role === "super-admin") && (
                  <div className="bg-white/10 rounded-xl p-4 shadow-inner">
                    <p className="text-xs font-semibold uppercase text-yellow-300 mb-3 tracking-wider">
                      Admin Panel
                    </p>
                    <div className="flex flex-col space-y-2">
                      {[
                        { label: "Overview", tab: "overview" },
                        { label: "Verifications", tab: "players" },
                        { label: "Season", tab: "season" },
                        { label: "Schedule", tab: "schedule" },
                        { label: "Gallery", tab: "gallery" },
                        { label: "News", tab: "news" },
                        { label: "Sponsor", tab: "sponsor" },
                      ].map((item) => (
                        <Link
                          key={item.tab}
                          to={`/admin?tab=${item.tab}`}
                          onClick={() => setIsOpen(false)}
                          className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition uppercase"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with user/logout */}
              {user && (
                <div className="border-t border-white/20 p-4 space-y-3">
                  <p className="text-sm font-medium">
                    Logged in as <span className="font-bold">{user?.name}</span>
                  </p>
                  <Button
                    onClick={logout}
                    variant="outline"
                    size="sm"
                    className="w-full bg-white text-red-600 font-semibold rounded-lg hover:bg-red-500 hover:text-white transition"
                  >
                    Logout
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      </div>

      {/* Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={(open) => { setIsProfileOpen(open); if (!open) setPreviewUrl(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center uppercase">
              My Profile
            </DialogTitle>
          </DialogHeader>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <Avatar
                className="w-28 h-28 ring-4 ring-primary/20 cursor-pointer"
                onClick={() => setImageZoomOpen(true)}
              >
                <AvatarImage src={previewUrl || getProfileImageUrl(user?.profileImage)} alt={user?.name} />
                <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {editMode && (
                <label
                  htmlFor="profile-upload"
                  className="
                    absolute inset-0 rounded-full bg-black/50
                    flex items-center justify-center
                    opacity-0 group-hover:opacity-100
                    transition-opacity cursor-pointer
                  "
                >
                  <Camera className="text-white" size={24} />
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData({ ...formData, profileImage: file });
                        setPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              )}
            </div>
            {!editMode && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant={user?.verified ? "default" : "secondary"}>
                  {user?.verified ? "Verified" : "Unverified"}
                </Badge>
                <Badge variant={
                  role === "super-admin" ? "destructive" :
                  role === "admin" ? "default" :
                  "secondary"
                }>
                  {role === "super-admin" ? "Super Admin" :
                   role === "admin" ? "Admin" :
                   role === "player" ? "Player" : role}
                </Badge>
              </div>
            )}
          </div>

          {/* Zoom Modal */}
          <AnimatePresence>
            {imageZoomOpen && (
              <motion.div
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setImageZoomOpen(false)}
              >
                <motion.img
                  src={getProfileImageUrl(user?.profileImage)}
                  alt={user?.name}
                  className="max-w-[90%] max-h-[90%] rounded-2xl shadow-2xl"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Strength (view mode) */}
          {!editMode && (
            <div className="mb-5 px-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Profile Strength</span>
                <span>{profileStrength}%</span>
              </div>
              <Progress
                value={profileStrength}
                className={profileStrength === 100 ? "bg-green-100" : ""}
              />
            </div>
          )}

          {editMode ? (
            <div className="space-y-4">
              {/* Info Card */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Basic Information
                  </h4>
                  {role === "player" && (
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Player Code</label>
                      <Input value={user?.playerCode || ""} readOnly />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                    />
                    {!formData.name.trim() && (
                      <p className="text-xs text-destructive mt-1">Name is required</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Email</label>
                    <Input value={formData.email} readOnly />
                  </div>
                </CardContent>
              </Card>

              {/* Documents Card */}
              {role === "player" && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Documents
                    </h4>
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      multiple
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          documents: e.target.files ? Array.from(e.target.files) : [],
                        })
                      }
                    />
                    {(user as any)?.documents?.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Existing documents will be replaced on save.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode(false);
                    setPreviewUrl(null);
                    setFormData({
                      name: user?.name || "",
                      email: user?.email || "",
                      profileImage: null,
                      documents: [],
                      playerCode: (user as any)?.playerCode || "",
                    });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info Card */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="font-medium text-right">{user?.name}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="font-medium text-right truncate max-w-[200px]">{user?.email}</span>
                  </div>
                  {role === "player" && (user as any)?.playerCode && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Player Code</span>
                        <span className="font-mono font-bold text-lg tracking-wider">{(user as any).playerCode}</span>
                      </div>
                    </>
                  )}
                  {(user as any)?.team && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Team</span>
                        <Badge variant="outline">{(user as any).team}</Badge>
                      </div>
                    </>
                  )}
                  {(user as any)?.createdAt && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Member Since</span>
                        <span className="font-medium text-sm">
                          {new Date((user as any).createdAt).toLocaleDateString("en-US", {
                            year: "numeric", month: "long", day: "numeric",
                          })}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Documents Card */}
              {(user as any)?.documents?.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                      Documents ({Array.isArray((user as any).documents) ? (user as any).documents.length : 0})
                    </h4>
                    <div className="space-y-2">
                      {(user as any).documents.map((doc: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted transition-colors"
                        >
                          <span className="text-sm truncate flex-1">
                            {doc.name || `Document ${i + 1}`}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0"
                            onClick={() => window.open(doc.url, "_blank")}
                          >
                            <ExternalLink size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button onClick={() => { setEditMode(true); setPreviewUrl(null); }} className="flex-1">
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setChangePasswordOpen(true)}
                  className="flex-1"
                >
                  Change Password
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


        {/* Change Password Dialog */}
        <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-center">Change Password</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Old Password</label>
                <Input
                  type={showOldPassword ? "text" : "password"}
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, oldPassword: e.target.value })
                  }
                  placeholder="Enter old password"
                  className="pr-10"
                  onKeyDown={(e) => { if (e.key === "Enter") handleChangePassword(); }}
                />
                <span
                  className="absolute top-9 right-3 cursor-pointer"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-1">New Password</label>
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  className="pr-10"
                  onKeyDown={(e) => { if (e.key === "Enter") handleChangePassword(); }}
                />
                <span
                  className="absolute top-9 right-3 cursor-pointer"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
                {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                  <p className="text-xs text-destructive mt-1">Minimum 6 characters</p>
                )}
                {passwordData.newPassword && passwordData.newPassword.length >= 6 && (
                  <Progress
                    value={Math.min((passwordData.newPassword.length / 12) * 100, 100)}
                    className="mt-1.5 h-1.5"
                  />
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="pr-10"
                  onKeyDown={(e) => { if (e.key === "Enter") handleChangePassword(); }}
                />
                <span
                  className="absolute top-9 right-3 cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                )}
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button onClick={handleChangePassword} className="w-full">Save Password</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

    </nav>
  );
};

export default Navbar;
