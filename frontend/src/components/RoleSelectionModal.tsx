import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Users,
  Zap,
  Check,
  Loader2,
  Phone,
  Calendar as CalendarIcon,
  Camera,
  FileText,
  X,
  Upload,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RoleSelectionModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userEmail?: string;
  userImage?: string;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  open,
  onClose,
  userName,
  userEmail,
  userImage,
}) => {
  const [step, setStep] = useState<"role" | "player">("role");
  const [loading, setLoading] = useState(false);
  const { completePlayerProfile } = useAuth();

  const profileInputRef = useRef<HTMLInputElement>(null);
  const documentsInputRef = useRef<HTMLInputElement>(null);

  const [playerData, setPlayerData] = useState({
    phone: "",
    dateOfBirth: "",
    position: "",
    battingStyle: "",
    bowlingStyle: "",
    bio: "",
  });

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);

  // Auto-set Google profile image when modal opens
  useEffect(() => {
    if (open && userImage) {
      setProfileImagePreview(userImage);
    } else if (open) {
      setProfileImagePreview(null);
    }
    // Reset form when modal opens
    if (open) {
      setPlayerData({
        phone: "",
        dateOfBirth: "",
        position: "",
        battingStyle: "",
        bowlingStyle: "",
        bio: "",
      });
      setProfileImageFile(null);
      setDocuments([]);
      setStep("role");
    }
  }, [open, userImage]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleRoleSelect = (role: "user" | "player") => {
    if (role === "user") {
      onClose();
      toast({
        title: "Welcome!",
        description: "You're all set as a fan/supporter.",
      });
    } else {
      setStep("player");
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDocuments((prev) => [...prev, ...files]);
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePlayerSubmit = async () => {
    if (!playerData.phone || !playerData.dateOfBirth || !playerData.position) {
      toast({
        title: "Missing fields",
        description: "Please fill in phone, date of birth, and position.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("phone", playerData.phone);
      formData.append("dateOfBirth", playerData.dateOfBirth);
      formData.append("position", playerData.position);
      formData.append("battingStyle", playerData.battingStyle);
      formData.append("bowlingStyle", playerData.bowlingStyle);
      formData.append("bio", playerData.bio);

      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      if (documents.length > 0) {
        documents.forEach((doc) => {
          formData.append("documents", doc);
        });
      }

      const result = await completePlayerProfile(formData);
      if (result.success) {
        toast({
          title: "Player profile completed!",
          description: "Welcome to UPPL as a player.",
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description: "Failed to complete player profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setPlayerData((prev) => ({ ...prev, [field]: value }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={cn(
          "sm:max-w-md",
          step === "player" && "sm:max-w-lg max-h-[90vh] p-0"
        )}
        hideClose={step === "player"}
      >
        {step === "role" ? (
          <>
            <DialogHeader className="text-center px-6 pt-6">
              <DialogTitle className="text-xl">
                Welcome, {userName}!
              </DialogTitle>
              <DialogDescription>
                Tell us how you'd like to use UPPL
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4 px-6">
              <button
                onClick={() => handleRoleSelect("user")}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-800">User</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Fan / Supporter
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect("player")}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-rose-400 hover:bg-rose-50 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                  <Zap className="w-6 h-6 text-rose-600" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-800 flex items-center justify-center gap-1.5">
                    Player
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                      PRO
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Cricket Player
                  </div>
                </div>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-gray-500 pt-2 pb-6 px-6 border-t">
              <span className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-green-500" /> Match Updates
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-green-500" /> Team Support
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-green-500" /> Live Scores
              </span>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="text-xl flex items-center gap-2">
                <Zap className="w-5 h-5 text-rose-500" />
                Player Details
              </DialogTitle>
              <DialogDescription>
                Complete your player profile to join the league
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 pb-6">
              <div className="space-y-5">
                {/* Profile Image */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    <div
                      className={cn(
                        "w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg",
                        !profileImagePreview && "bg-gray-100 flex items-center justify-center"
                      )}
                    >
                      {profileImagePreview ? (
                        <img
                          src={profileImagePreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => profileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-rose-600 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      ref={profileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {userImage ? "Google photo auto-imported" : "Upload profile photo"}
                  </p>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      value={playerData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="pl-9 h-11 text-sm rounded-xl"
                      placeholder="Your contact number"
                      maxLength={15}
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Date of Birth <span className="text-red-400">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "w-full h-11 px-4 rounded-xl border bg-gray-50 text-left text-sm flex items-center justify-between hover:bg-white hover:border-rose-300 transition-all",
                          !playerData.dateOfBirth && "text-gray-400"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          {playerData.dateOfBirth
                            ? format(new Date(playerData.dateOfBirth), "PPP")
                            : "Select date of birth"}
                        </span>
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          if (date) {
                            handleChange("dateOfBirth", format(date, "yyyy-MM-dd"));
                          }
                        }}
                        disabled={(date) => date > new Date() || date < new Date(1900, 0, 1)}
                        initialFocus
                        classNames={{
                          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          month: "space-y-4",
                          caption: "flex justify-center pt-1 relative items-center",
                          caption_label: "text-sm font-medium",
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
                      />
                    </PopoverContent>
                  </Popover>
                  {playerData.dateOfBirth && (
                    <p className="text-xs text-gray-400">
                      Selected: {format(new Date(playerData.dateOfBirth), "MMMM d, yyyy")}
                    </p>
                  )}
                </div>

                {/* Position */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Position <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={playerData.position}
                    onValueChange={(v) => handleChange("position", v)}
                  >
                    <SelectTrigger className="h-11 text-sm rounded-xl">
                      <SelectValue placeholder="Select your position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="batsman">Batsman</SelectItem>
                      <SelectItem value="bowler">Bowler</SelectItem>
                      <SelectItem value="all-rounder">All-Rounder</SelectItem>
                      <SelectItem value="wicket-keeper">Wicket Keeper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Batting & Bowling Style */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">
                      Batting Style
                    </Label>
                    <Select
                      value={playerData.battingStyle}
                      onValueChange={(v) => handleChange("battingStyle", v)}
                    >
                      <SelectTrigger className="h-11 text-sm rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right-handed">Right-handed</SelectItem>
                        <SelectItem value="left-handed">Left-handed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">
                      Bowling Style
                    </Label>
                    <Select
                      value={playerData.bowlingStyle}
                      onValueChange={(v) => handleChange("bowlingStyle", v)}
                    >
                      <SelectTrigger className="h-11 text-sm rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right-arm-fast">Right Arm Fast</SelectItem>
                        <SelectItem value="left-arm-fast">Left Arm Fast</SelectItem>
                        <SelectItem value="right-arm-spin">Right Arm Spin</SelectItem>
                        <SelectItem value="left-arm-spin">Left Arm Spin</SelectItem>
                        <SelectItem value="spin">Spin</SelectItem>
                        <SelectItem value="none">Doesn't Bowl</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Bio
                  </Label>
                  <Textarea
                    value={playerData.bio}
                    onChange={(e) => handleChange("bio", e.target.value)}
                    className="rounded-xl text-sm resize-none min-h-[80px]"
                    placeholder="Tell us about your cricket journey..."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-400 text-right">
                    {playerData.bio.length}/500
                  </p>
                </div>

                {/* Documents Upload */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Documents
                  </Label>
                  <div
                    onClick={() => documentsInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-rose-300 hover:bg-rose-50/50 transition-all cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">
                      Click to upload documents
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ID proof, certificates, etc. (any file type)
                    </p>
                  </div>
                  <input
                    ref={documentsInputRef}
                    type="file"
                    multiple
                    onChange={handleDocumentsChange}
                    className="hidden"
                  />

                  {/* Document List */}
                  {documents.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {documents.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg"
                        >
                          <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {doc.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatFileSize(doc.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-red-100 transition-colors"
                          >
                            <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 px-6 pb-6 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("role")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handlePlayerSubmit}
                disabled={loading}
                className="flex-1 bg-rose-600 hover:bg-rose-700"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Complete Profile
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectionModal;
