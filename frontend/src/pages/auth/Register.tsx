import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, Trophy, Upload, FileText, LogIn, Plus, X, User, Zap ,Users,Check,Eye, EyeOff} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle,} from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { NepaliDatePicker } from 'nepali-datepicker-reactjs';
import 'nepali-datepicker-reactjs/dist/index.css';
import { Calendar } from "@/components/ui/calendar";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    dobCalendar: 'AD',
    profileImage: null as File | null,
    documents: [] as File[],
  });

  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [adDate, setAdDate] = useState<Date | undefined>(
    formData.dob ? new Date(formData.dob) : undefined
  );

  const [selectedDate, setSelectedDate] = useState<Date>(
  formData.dob ? new Date(formData.dob) : new Date()
);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, files: FileList | null) => {
    if (!files) return;
    if (field === 'documents') {
      setFormData(prev => ({ ...prev, documents: [...prev.documents, ...Array.from(files)] }));
    } else if (field === 'profileImage') {
      setFormData(prev => ({ ...prev, profileImage: files[0] }));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Animated Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="relative">
              <Trophy className="h-14 w-14 text-amber-500 drop-shadow-lg animate-pulse" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-ping"></div>
            </div>
            <span className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-amber-500 bg-clip-text text-transparent">
              UPPLT20
            </span>
          </div>
          <p className="text-gray-600 text-xl font-medium mb-2">Join the Premier Cricket League</p>
          <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0 rounded-3xl backdrop-blur-sm bg-white/90 overflow-hidden animate-in fade-in slide-in-from-bottom duration-700">
          
          {/* Card Header with Gradient */}
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pb-8 pt-8">
            <CardTitle className="text-3xl text-center font-bold flex items-center justify-center gap-3">
              {formData.role === 'player' ? (
                <>
                  <Zap className="h-8 w-8 animate-bounce" />
                  Player Registration
                </>
              ) : (
                <>
                  <User className="h-8 w-8" />
                  Create Your Account
                </>
              )}
            </CardTitle>
            <p className="text-center text-blue-100 mt-2">
              {formData.role === 'player' 
                ? 'Join as a professional cricket player' 
                : 'Become part of the cricket community'
              }
            </p>
          </CardHeader>

          <CardContent className="p-8">

            {/* Error Alert */}
            {error && (
              <Alert className="mb-8 border-red-200 bg-red-50 rounded-xl animate-in fade-in slide-in-from-top duration-300">
                <AlertDescription className="text-red-700 font-medium flex items-center gap-2">
                  <X className="h-4 w-4" />
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Modern Role Slider Toggle */}
              <div className="flex flex-col items-center space-y-4">
                <Label className="text-lg font-semibold text-gray-700">Choose Registration Type</Label>
                <div className="relative bg-gray-100 rounded-2xl p-2 shadow-inner">
                  <div className="w-full max-w-lg mx-auto">
                    {/* Label */}
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Choose Your Registration Type</h3>
                      <p className="text-sm text-gray-500">Select how you want to join UPPLT20</p>
                    </div>

                    {/* Toggle Container */}
                    <div className="relative">
                      {/* Background Track */}
                      <div className="relative h-20 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 rounded-full p-2 shadow-inner overflow-hidden">
                        {/* Animated Gradient Background */}
                        <motion.div
                          className="absolute inset-0 opacity-10"
                          animate={{
                            background: [
                              'radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%)',
                              'radial-gradient(circle at 80% 50%, #ec4899 0%, transparent 50%)',
                              'radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%)',
                            ]
                          }}
                          transition={{ duration: 5, repeat: Infinity }}
                        />
                        
                        {/* Sliding Pill */}
                        <motion.div
                          className="absolute top-2 bottom-2 w-[48%] rounded-full shadow-2xl"
                          initial={false}
                          animate={{
                            x: formData.role === 'user' ? '2%' : '102%',
                          }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 700, 
                            damping: 35,
                          }}
                          style={{
                            background: formData.role === 'user'
                              ? 'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #8b5cf6 100%)'
                              : 'linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #ef4444 100%)',
                            boxShadow: formData.role === 'user'
                              ? '0 20px 40px -10px rgba(99, 102, 241, 0.5), inset 0 -2px 10px rgba(255,255,255,0.3)'
                              : '0 20px 40px -10px rgba(236, 72, 153, 0.5), inset 0 -2px 10px rgba(255,255,255,0.3)'
                          }}
                        >
                          {/* Shine effect */}
                          <motion.div
                            className="absolute inset-0 rounded-full opacity-50"
                            style={{
                              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.7) 50%, transparent 60%)',
                            }}
                            animate={{
                              x: ['-100%', '200%'],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3,
                              ease: "easeInOut"
                            }}
                          />
                        </motion.div>
                        
                        {/* Buttons */}
                        <div className="relative h-full grid grid-cols-2">
                          <button
                            type="button"
                            onClick={() => handleChange('role', 'user')}
                            className="relative group flex items-center justify-center px-8 transition-all duration-300"
                          >
                            <div className={`flex items-center gap-3 ${
                              formData.role === 'user' 
                                ? 'text-white drop-shadow-lg' 
                                : 'text-gray-700 group-hover:text-gray-900'
                            }`}>
                              <motion.div
                                animate={{ 
                                  scale: formData.role === 'user' ? [1, 1.2, 1] : 1,
                                }}
                                transition={{ duration: 0.3 }}
                                className="relative"
                              >
                                <Users className="h-6 w-6" />
                                {formData.role === 'user' && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -inset-2 bg-white/20 rounded-full blur-md"
                                  />
                                )}
                              </motion.div>
                              <div className="text-left">
                                <div className="font-bold text-sm">USER</div>
                                {formData.role === 'user' && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs opacity-90"
                                  >
                                    Support & Follow
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleChange('role', 'player')}
                            className="relative group flex items-center justify-center px-8 transition-all duration-300"
                          >
                            <div className={`flex items-center gap-3 ${
                              formData.role === 'player' 
                                ? 'text-white drop-shadow-lg' 
                                : 'text-gray-700 group-hover:text-gray-900'
                            }`}>
                              <motion.div
                                animate={{ 
                                  rotate: formData.role === 'player' ? [0, 360] : 0,
                                  scale: formData.role === 'player' ? [1, 1.2, 1] : 1,
                                }}
                                transition={{ 
                                  rotate: { duration: 0.6 },
                                  scale: { duration: 0.3 }
                                }}
                                className="relative"
                              >
                                <Trophy className="h-6 w-6" />
                                {formData.role === 'player' && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -inset-2 bg-white/20 rounded-full blur-md"
                                  />
                                )}
                              </motion.div>
                              <div className="text-left">
                                <div className="font-bold text-sm">PLAYER</div>
                                {formData.role === 'player' && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs opacity-90"
                                  >
                                    Compete & Win
                                  </motion.div>
                                )}
                              </div>
                            </div>
                            
                            {/* Star decoration for player */}
                            {formData.role === 'player' && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.3, type: "spring" }}
                                className="absolute -top-3 right-4"
                              >
                                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                                  ⭐ PRO
                                </div>
                              </motion.div>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Feature highlights */}
                    <motion.div 
                      key={formData.role}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="mt-6 text-center"
                    >
                      <div className="inline-flex items-center gap-6 text-sm text-gray-600">
                        {formData.role === 'user' ? (
                          <>
                            <span className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              Match Updates
                            </span>
                            <span className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              Team Support
                            </span>
                            <span className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              Live Scores
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              Tournament Entry
                            </span>
                            <span className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              Player Profile
                            </span>
                            <span className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              Statistics
                            </span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Animated Background Slider */}
                  <div
                  />
                </div>
              </div>

              {/* Basic Information with Modern Styling */}
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Full Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 h-12"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Email Address *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 h-12"
                      placeholder="your.email@example.com"
                    />
                    {emailError && (
                      <p className="text-sm text-red-600 mt-1 animate-in fade-in slide-in-from-left duration-300">
                        {emailError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                {/* Password */}
                <div className="space-y-2 relative">
                  <Label className="text-sm font-semibold text-gray-700">Password *</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 h-12 pr-10"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2 relative">
                  <Label className="text-sm font-semibold text-gray-700">Confirm Password *</Label>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 h-12 pr-10"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>

                  {/* Password mismatch error */}
                  {formData.confirmPassword &&
                    formData.password !== formData.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">
                        Passwords do not match
                      </p>
                    )}
                </div>
              </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Phone Number</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 h-12"
                    placeholder="Your contact number"
                  />
                  {phoneError && (
                    <p className="text-sm text-red-600 mt-1 animate-in fade-in slide-in-from-left duration-300">
                      {phoneError}
                    </p>
                  )}
                </div>
              </div>

              {/* Player Specific Fields with Animation */}
              {formData.role === 'player' && (
                <div className="space-y-8 pt-6 border-t border-gray-200 animate-in fade-in slide-in-from-bottom duration-500">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      Player Information
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Bio */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Bio</Label>
                        <Textarea
                          value={formData.bio}
                          onChange={(e) => handleChange('bio', e.target.value)}
                          className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 min-h-[100px]"
                          placeholder="Tell us about yourself and your cricket journey..."
                        />
                      </div>
                      
                      {/* Calendar and DOB */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Date of Birth <span className="text-red-500">*</span>
                        </Label>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <Input
                                type="text"
                                value={formData.dob || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Allow typing and format as YYYY-MM-DD
                                  if (/^\d{0,4}-?\d{0,2}-?\d{0,2}$/.test(value)) {
                                    handleChange("dob", value);
                                  }
                                }}
                                placeholder="YYYY-MM-DD"
                                className="w-full h-11 px-4 pr-10 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                              />
                              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-3 space-y-3">
                              {/* Year and Month Selection */}
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
                                    {Array.from({ length: 1101 }, (_, i) => 1900 + i).map((year) => (
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
                                    {[
                                      "January", "February", "March", "April", "May", "June",
                                      "July", "August", "September", "October", "November", "December"
                                    ].map((month, index) => (
                                      <SelectItem key={index} value={index.toString()}>
                                        {month}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {/* Calendar */}
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
                                disabled={(date) => 
                                  date.getFullYear() < 1900 || date.getFullYear() > 3000
                                }
                                className="rounded-lg border-0"
                                classNames={{
                                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                  month: "space-y-4",
                                  caption: "flex justify-center pt-1 relative items-center",
                                  caption_label: "hidden",
                                  nav: "space-x-1 flex items-center",
                                  nav_button: cn(
                                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                                    "hover:bg-gray-100 rounded-md transition-colors"
                                  ),
                                  nav_button_previous: "absolute left-1",
                                  nav_button_next: "absolute right-1",
                                  table: "w-full border-collapse space-y-1",
                                  head_row: "flex",
                                  head_cell: "text-gray-500 rounded-md w-8 font-normal text-[0.8rem]",
                                  row: "flex w-full mt-2",
                                  cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                                  day: cn(
                                    "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                                    "hover:bg-gray-100 rounded-md transition-colors",
                                    "focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  ),
                                  day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                                  day_today: "bg-gray-100 text-gray-900 font-semibold",
                                  day_outside: "text-gray-400 opacity-50",
                                  day_disabled: "text-gray-400 opacity-50 cursor-not-allowed",
                                }}
                                components={{
                                  IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                                  IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                                }}
                              />
                              
                              {/* Quick Actions */}
                              <div className="flex gap-2 pt-2 border-t">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 h-8 text-xs"
                                  onClick={() => {
                                    const today = new Date();
                                    setSelectedDate(today);
                                    handleChange("dob", format(today, "yyyy-MM-dd"));
                                  }}
                                >
                                  Today
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 h-8 text-xs"
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
                        
                        {/* Optional: Display formatted date */}
                        {formData.dob && (
                          <p className="text-xs text-gray-500">
                            Selected: {format(new Date(formData.dob), "MMMM d, yyyy")}
                          </p>
                        )}
                      </div>

                      {/* Position and Styles */}
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Position *</Label>
                          <Select value={formData.position} onValueChange={(v) => handleChange('position', v)}>
                            <SelectTrigger className="rounded-xl border-gray-200 focus:border-purple-500 h-12">
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="batsman">Batsman</SelectItem>
                              <SelectItem value="bowler">Bowler</SelectItem>
                              <SelectItem value="all-rounder">All-Rounder</SelectItem>
                              <SelectItem value="wicket-keeper">Wicket Keeper</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Batting Style</Label>
                          <Select value={formData.battingStyle} onValueChange={(v) => handleChange('battingStyle', v)}>
                            <SelectTrigger className="rounded-xl border-gray-200 focus:border-purple-500 h-12">
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="right-handed">Right-handed</SelectItem>
                              <SelectItem value="left-handed">Left-handed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Bowling Style</Label>
                          <Select value={formData.bowlingStyle} onValueChange={(v) => handleChange('bowlingStyle', v)}>
                            <SelectTrigger className="rounded-xl border-gray-200 focus:border-purple-500 h-12">
                              <SelectValue placeholder="Select style" />
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
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700">Profile Photo</Label>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('profileImage')?.click()}
                            className="w-full h-12 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-400 transition-all duration-300"
                          >
                            <Upload className="mr-2 h-5 w-5" />
                            {formData.profileImage ? formData.profileImage.name : 'Upload Photo'}
                          </Button>
                          <Input
                            id="profileImage"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange('profileImage', e.target.files)}
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700">Documents (ID/Birth Certificate) *</Label>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('documents')?.click()}
                            className="w-full h-12 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-400 transition-all duration-300"
                          >
                            <Plus className="mr-2 h-5 w-5" />
                            Add Documents
                          </Button>
                          <input
                            id="documents"
                            type="file"
                            accept="image/*,.pdf"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFileChange('documents', e.target.files)}
                          />
                          
                          {/* Document List */}
                          {formData.documents.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-4">
                              {formData.documents.map((file, index) => (
                                <div
                                  key={index}
                                  className="relative p-3 border-2 border-gray-200 rounded-xl shadow-sm bg-white max-w-[140px] text-center text-sm animate-in fade-in scale-in duration-300"
                                >
                                  <button
                                    type="button"
                                    onClick={() => removeDocument(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors duration-200"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                  <FileText className="mx-auto mb-2 text-gray-500 h-6 w-6" />
                                  <p className="truncate font-medium">{file.name}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full mr-3"></div>
                    Creating Account...
                  </div>
                ) : (
                  <span className="flex items-center justify-center">
                    <UserPlus className="mr-3 h-6 w-6" />
                    {formData.role === 'player' ? 'Submit Player Application' : 'Create Account'}
                  </span>
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all duration-300"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;