import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogIn, Eye, EyeOff } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";

import Logo from "@/images/lg-removebg-preview.png"; 

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

  const location = useLocation();

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });


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
    // { name: "Live Scores", path: "/live-scores" },
    { name: "Points Table", path: "/points-table" },
    { name: "News", path: "/news" },
    { name: "Gallery", path: "/gallery" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSave = async () => {
  if (!user) return;

  try {
    const fd = new FormData();
    fd.append("name", formData.name);
    fd.append("email", formData.email);

    // ✅ Only append profile image if selected
    if (formData.profileImage) {
      fd.append("profileImage", formData.profileImage);
    }

    // ✅ Append documents only for player
    if ((role === "player") && formData.documents && formData.documents.length > 0) {
      formData.documents.forEach((doc) => fd.append("documents", doc));
    }

    const API_BASE = "http://localhost:8080/api";
    let apiUrl = `${API_BASE}/user/users/${user.id }`; // normal user

    if (role === "admin" || role === "super-admin") {
      apiUrl = `${API_BASE}/admin/users/${user.id}`; // admin user
    }

    // ❌ Do NOT set Content-Type for FormData
    const res = await fetch(apiUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token || localStorage.getItem("pplt20_token")}`,
      },
      body: fd,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update profile");
    }

    const data = await res.json();

    // ✅ Update user in context
    if (typeof setUser === "function") setUser(data.user);

    // ✅ Persist in localStorage
    localStorage.setItem("pplt20_user", JSON.stringify(data.user));

    setIsProfileOpen(false);
    setEditMode(false);

    console.log("Profile updated successfully");
  } catch (err: any) {
    console.error("Error updating profile:", err.message || err);
    alert("Error updating profile: " + (err.message || err));
  }
};




  const handleChangePassword = async () => {
  // Make sure new + confirm match
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    alert("New passwords do not match");
    return;
  }

  if (!user?.id) {
    alert("User not found");
    return;
  }

  try {
    const API_BASE = "http://localhost:8080/api"; // match backend base
    const url = `${API_BASE}/user/${user.id}/change-password`;

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || localStorage.getItem("pplt20_token")}`,
      },
      body: JSON.stringify({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to change password");
    }

    alert("Password updated successfully ✅");
    setChangePasswordOpen(false);
    setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
  } catch (err: any) {
    alert("Error updating password: " + (err.message || err));
  }
};




  const getProfileImageUrl = (path: string | null) => {
    if (!path) {
      return `${BASE_URL}/favicon.png`;
    }

    // Allow cloud URLs
    if (path.startsWith('http')) {
      return path;
    }

    // Normalize paths
    let cleanPath = path
      .replace(/\\/g, '/')                     // Windows → forward slashes
      .replace(/\/+/g, '/')                    // collapse multiple slashes
      .replace(/^\/uploads\/uploads\//, '/uploads/') // remove duplicate prefix
      .replace(/^uploads\//, '/uploads/');     // ensure leading slash

    // Ensure single leading slash
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }

    const finalUrl = `${BASE_URL}${cleanPath}`;
    console.log("🖼 Final image URL:", finalUrl);
    return finalUrl;
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
                    Admin Dashboard
                  </Link>
                )}

                {/* ✅ Player Profile link */}
                {role === "player" && user?.verified && (
                  <Link
                    to="/player-profile"
                    className="text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    My Profile
                  </Link>
                )}

                {/* ✅ Always show profile + logout if logged in */}
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => setIsProfileOpen(true)}
                >
                  <img
                    src={getProfileImageUrl(user?.profileImage)}
                    // src={user?.profileImage ? `BASE_URL${user.profileImage}` : "/default-avatar.png"}
                    alt={user?.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
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
      Login
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
      Register
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
              {link.name}
            </Link>
          ))}
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* 🔹 Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black z-40"
                onClick={() => setIsOpen(false)} // close when clicking outside
              />

              {/* 🔹 Sidebar Drawer (Right Side) */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="fixed inset-y-0 right-0 z-50 w-72 md:w-96 
                          bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 
                          text-white shadow-2xl flex flex-col"
              >
                {/* Header with Close Button (sticky) */}
                <div className="flex items-center justify-between p-4 border-b border-white/20 sticky top-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 z-50">
                  <h2 className="text-lg font-bold">Menu</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="hover:scale-110 transition"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
                  {/* Public Links */}
                  <nav className="space-y-2">
                    {publicLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsOpen(false)}
                        className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          isActive(link.path)
                            ? "bg-white text-blue-700 shadow-md"
                            : "hover:bg-white/20 hover:translate-x-2"
                        }`}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </nav>

                  {/* Admin Dashboard Section */}
                  {(role === "admin" || role === "super-admin") && (
                    <div className="bg-white/10 rounded-xl p-4 shadow-inner">
                      <p className="text-xs font-semibold uppercase text-yellow-300 mb-3 tracking-wider">
                        Admin Dashboard
                      </p>
                      <div className="flex flex-col space-y-2">
                        <Link
                          to="/admin?tab=overview"
                          onClick={() => setIsOpen(false)}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold hover:scale-105 transition"
                        >
                          Overview
                        </Link>
                        <Link to="/admin?tab=players" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition">
                          Verifications
                        </Link>
                        <Link to="/admin?tab=season" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition">
                          Season
                        </Link>
                        <Link to="/admin?tab=schedule" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition">
                          Schedule
                        </Link>
                        <Link to="/admin?tab=gallery" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition">
                          Gallery
                        </Link>
                        <Link to="/admin?tab=news" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition">
                          News
                        </Link>
                        <Link to="/admin?tab=sponsor" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition">
                          Sponsor
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Info + Logout */}
                {user && (
                  <div className="border-t border-white/20 p-4">
                    <p className="text-sm font-medium mb-2">
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
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center">
              My Profile
            </DialogTitle>
          </DialogHeader>


      {/* Profile Image */}
          <div className="flex justify-center mb-4">
            <div
              className="
                relative
                w-36 h-24
                rounded-xl
                overflow-hidden
                shadow-lg
                cursor-pointer
                transition-transform duration-300 ease-in-out
                hover:scale-105
                hover:shadow-[0_0_25px_rgba(164,0,255,0.5)]
              "
              onClick={() => setImageZoomOpen(true)}
            >
              <img
                src={getProfileImageUrl(user?.profileImage)}
                alt={user?.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Fullscreen Zoom Modal */}
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


          {editMode ? (
            <>
              {/* Player Code (read-only in edit mode for players) */}
              {role === "player" && (
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Player Code</label>
                  <Input value={user?.playerCode} readOnly />
                </div>
              )}

              {/* Name */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Name"
                />
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input value={formData.email} readOnly placeholder="Email" />
              </div>

              {/* Upload Image */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">
                  Profile Image
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      profileImage: e.target.files ? e.target.files[0] : null,
                    })
                  }
                />
              </div>

              {/* Documents */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Documents</label>
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
              </div>
            </>
          ) : (
            <>
              {/* Player Code in view mode */}
              {role === "player" && (
                <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">Player Code</p>
                <p className="text-2xl font-bold text-gray-900">
                  <span
                    className="
                      inline-block 
                      transition-all duration-300 ease-in-out
                      hover:scale-110 hover:text-purple-600
                      hover:shadow-[4px_0_20px_rgba(164,0,255,0.6)]
                      px-1 rounded
                    "
                  >
                    {user?.playerCode}
                  </span>
                </p>
              </div>
              )}

              <div className="mb-2">
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-gray-900">{user?.name}</p>
              </div>

              <div className="mb-2">
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-gray-900">{user?.email}</p>
              </div>
            </>
          )}

          <DialogFooter className="flex justify-between mt-4">
            {editMode ? (
              <Button
                onClick={handleSave}
                className="
                  bg-black text-white 
                  hover:bg-gray-800 
                  transition-all duration-300 ease-in-out 
                  w-40 py-2 
                  rounded-xl shadow-md
                "
              >
                Save
              </Button>
            ) : (
              <Button
                onClick={() => setEditMode(true)}
                className="
                  bg-black text-white 
                  hover:bg-gray-800 
                  transition-all duration-300 ease-in-out 
                  w-40 py-2 
                  rounded-xl shadow-md
                "
              >
                Edit
              </Button>
            )}

            {/* Change Password Button */}
            <Button
              variant="outline"
              className="
                transition-all duration-300 ease-in-out 
                hover:scale-105 hover:text-white
                hover:bg-gradient-to-r hover:from-[#A23CCF] hover:to-[#D4429D]
                hover:shadow-[0_0_15px_#D4429D]
              "
              onClick={() => setChangePasswordOpen(true)}
            >
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


        {/* Change Password Dialog */}
        <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-center">Change Password</DialogTitle>
            </DialogHeader>

            <div className="mb-3 relative">
              <label className="block text-sm font-medium mb-1">Old Password</label>
              <Input
                type={showOldPassword ? "text" : "password"}
                value={passwordData.oldPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, oldPassword: e.target.value })
                }
                placeholder="Enter old password"
                className="pr-10"
              />
              <span
                className="absolute top-9 right-3 cursor-pointer"
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>



            <div className="mb-3 relative">
              <label className="block text-sm font-medium mb-1">New Password</label>
              <Input
                type={showNewPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password"
                className="pr-10"
              />
              <span
                className="absolute top-9 right-3 cursor-pointer"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>

            <div className="mb-3 relative">
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="pr-10"
              />
              <span
                className="absolute top-9 right-3 cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>


            <DialogFooter>
              <Button onClick={handleChangePassword}>Save Password</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

    </nav>
  );
};

export default Navbar;
