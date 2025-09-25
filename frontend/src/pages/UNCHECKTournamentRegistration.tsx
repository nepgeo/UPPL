import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Trophy, Users, Upload, CreditCard, ArrowLeft, Calendar, MapPin, 
  Clock, Shield, Star, CheckCircle2, AlertCircle, Camera,
  Phone, Mail, User, Award, Target, Timer
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Player {
  name: string;
  role: string;
  jerseyNumber: string;
}

interface TeamRegistrationForm {
  teamName: string;
  captainName: string;
  contactNumber: string;
  email: string;
  teamLogo: FileList;
  players: Player[];
}

const TournamentRegistration = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<TeamRegistrationForm>();
  const [players, setPlayers] = useState<Player[]>(
    Array.from({ length: 15 }, () => ({ name: '', role: '', jerseyNumber: '' }))
  );
  const [registrationFee] = useState(50000);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);

  const roles = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];
  const filledPlayers = players.filter(player => player.name.trim() !== '').length;
  const progressPercentage = Math.round((filledPlayers / 15) * 100);

  const [showConfirmation, setShowConfirmation] = useState(false);


  const updatePlayer = (index: number, field: keyof Player, value: string) => {
    const updatedPlayers = [...players];
    updatedPlayers[index] = { ...updatedPlayers[index], [field]: value };
    setPlayers(updatedPlayers);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setUploadedLogo(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: TeamRegistrationForm) => {
    // Save the data to preview before redirecting
    const pid = `UPPLT20-REG-${Date.now()}`;

    const formDataToSave = {
      ...data,
      players,
      pid,
      uploadedLogo,
    };

    localStorage.setItem('pplt_team_entry', JSON.stringify(formDataToSave));
    setShowConfirmation(true); // 👉 Show confirmation dialog
  };


  const handleEsewaPayment = () => {
    const pid = `UPPLT20-REG-${Date.now()}`;

    const formDataToSave = {
      ...watch(),           // form fields: teamName, captainName, contactNumber etc.
      players,              // ✅ include players
      pid,                  // ✅ unique transaction id
      uploadedLogo          // ✅ base64 string or file URL
    };

    localStorage.setItem('pplt_team_entry', JSON.stringify(formDataToSave)); // ✅ Save to localStorage

    const esewaConfig = {
      amt: registrationFee,
      psc: 0,
      pdc: 0,
      txAmt: 0,
      tAmt: registrationFee,
      pid,
      scd: 'EPAYTEST',
      su: `${window.location.origin}/payment-success`,
      fu: `${window.location.origin}/payment-failed`
    };

    const form = document.createElement('form');
    form.method = 'POST';
    // form.action = 'https://uat.esewa.com.np/epay/main';
    form.action = `${window.location.origin}/payment-success?refId=MOCK_REF123&pid=MOCK_PID123`;

    Object.entries(esewaConfig).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value.toString();
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit(); // ✅ Redirects to eSewa
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30"></div>
        <div className="relative container mx-auto px-4 py-12">
          <Link to="/" className="inline-flex items-center text-blue-200 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="h-8 w-8 text-yellow-400" />
                <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
                  Registration Open
                </Badge>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Tournament Season 5
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                Join the ultimate cricket experience with PPLT20's most exciting season yet
              </p>
              
              {/* Tournament Details */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-2 text-blue-200">
                  <Calendar className="h-5 w-5" />
                  <span>March 15 - April 30</span>
                </div>
                <div className="flex items-center gap-2 text-blue-200">
                  <MapPin className="h-5 w-5" />
                  <span>Kathmandu, Nepal</span>
                </div>
                <div className="flex items-center gap-2 text-blue-200">
                  <Users className="h-5 w-5" />
                  <span>32 Teams Max</span>
                </div>
                <div className="flex items-center gap-2 text-blue-200">
                  <Award className="h-5 w-5" />
                  <span>NPR 10L Prize Pool</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="text-center mb-4">
                  <Timer className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">Registration Deadline</h3>
                </div>
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-200">March 10, 2025</div>
                  <div className="text-red-300">Only 5 days left!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Tracker */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Registration Progress</h2>
              <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                Step {currentStep} of 3
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={(currentStep / 3) * 100} className="h-2" />
              </div>
              <div className="text-sm font-medium text-slate-600">
                {Math.round((currentStep / 3) * 100)}% Complete
              </div>
            </div>
            <div className="flex justify-between mt-4 text-sm">
              <span className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
                <CheckCircle2 className="h-4 w-4" />
                Team Details
              </span>
              <span className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
                <Users className="h-4 w-4" />
                Squad Info
              </span>
              <span className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
                <CreditCard className="h-4 w-4" />
                Payment
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="max-w-6xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Team Information */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Team Information</h3>
                    <p className="text-indigo-100 text-sm">Basic details about your team</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Team Logo Upload */}
                  <div className="lg:col-span-1">
                    <Label className="text-base font-semibold text-slate-700 mb-4 block">Team Logo</Label>
                    <div className="relative">
                      <div className="w-48 h-48 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                        {uploadedLogo ? (
                          <img src={uploadedLogo} alt="Team Logo" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <Camera className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Upload Logo</p>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        {...register('teamLogo', { required: 'Team logo is required' })}
                        onChange={handleLogoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    {errors.teamLogo && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.teamLogo.message}
                      </p>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="teamName" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Team Name *
                        </Label>
                        <Input
                          id="teamName"
                          {...register('teamName', { required: 'Team name is required' })}
                          placeholder="Enter your team name"
                          className="h-12 text-lg border-2 focus:border-indigo-500"
                        />
                        {errors.teamName && (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.teamName.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="captainName" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Captain Name *
                        </Label>
                        <Input
                          id="captainName"
                          {...register('captainName', { required: 'Captain name is required' })}
                          placeholder="Enter captain name"
                          className="h-12 text-lg border-2 focus:border-indigo-500"
                        />
                        {errors.captainName && (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.captainName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="contactNumber" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Contact Number *
                        </Label>
                        <Input
                          id="contactNumber"
                          {...register('contactNumber', { required: 'Contact number is required' })}
                          placeholder="+977 98xxxxxxxx"
                          className="h-12 text-lg border-2 focus:border-indigo-500"
                        />
                        {errors.contactNumber && (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.contactNumber.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          {...register('email', { required: 'Email is required' })}
                          placeholder="team@example.com"
                          className="h-12 text-lg border-2 focus:border-indigo-500"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Squad Information */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Squad Information</h3>
                      <p className="text-green-100 text-sm">Add your 15 team members</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{filledPlayers}/15</div>
                    <div className="text-green-100 text-sm">Players Added</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {/* Progress Bar for Squad */}
                <div className="mb-8 bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Squad Completion</span>
                    <span className="text-sm text-slate-600">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                  <p className="text-xs text-slate-500 mt-2">
                    {15 - filledPlayers} more players needed to complete your squad
                  </p>
                </div>

                <div className="grid gap-4">
                  {players.map((player, index) => (
                    <Card key={index} className={`transition-all duration-200 ${
                      player.name ? 'border-green-200 bg-green-50/50' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold">
                              {index + 1}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800">Player {index + 1}</h4>
                            <p className="text-sm text-slate-500">
                              {index === 0 ? 'Captain' : `Squad Member ${index + 1}`}
                            </p>
                          </div>
                          <Badge variant={player.name ? "default" : "secondary"} className="flex items-center gap-1">
                            {player.name ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {player.name ? "Complete" : "Pending"}
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Full Name</Label>
                            <Input
                              placeholder="Enter player name"
                              value={player.name}
                              onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                              className="border-2 focus:border-indigo-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Playing Role</Label>
                            <select
                              className="w-full p-3 border-2 rounded-md focus:border-indigo-500 focus:outline-none"
                              value={player.role}
                              onChange={(e) => updatePlayer(index, 'role', e.target.value)}
                            >
                              <option value="">Select role</option>
                              {roles.map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Jersey Number</Label>
                            <Input
                              type="number"
                              min="1"
                              max="99"
                              placeholder="Jersey #"
                              value={player.jerseyNumber}
                              onChange={(e) => updatePlayer(index, 'jerseyNumber', e.target.value)}
                              className="border-2 focus:border-indigo-500"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Player Code</Label>
                            <Input
                              type="number"
                              placeholder="4 Digit Number #"
                              value={player.playerCode || ''}
                              onChange={(e) => updatePlayer(index, 'playerCode', e.target.value)}
                              className="border-2 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Registration Fee & Payment */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Registration Fee & Payment</h3>
                    <p className="text-orange-100 text-sm">Complete your team registration</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {/* Fee Breakdown */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl mb-8 border border-blue-200">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">Registration Fee</h3>
                      <p className="text-slate-600 mb-4">One-time payment for tournament entry</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Base Registration Fee</span>
                          <span>NPR {registrationFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Processing Fee</span>
                          <span>NPR 0</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Amount</span>
                          <span className="text-blue-600">NPR {registrationFee.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full text-white mb-4">
                        <div>
                          <div className="text-2xl font-bold">NPR</div>
                          <div className="text-xl">{(registrationFee/1000)}K</div>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm">Per Team Registration</p>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4 mb-8">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Terms & Conditions
                  </h4>
                  <div className="space-y-3 bg-slate-50 p-6 rounded-lg">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input type="checkbox" required className="mt-1 rounded border-slate-300" />
                      <span className="text-sm text-slate-700">
                        I agree to the tournament rules, regulations, and code of conduct
                      </span>
                    </label>
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input type="checkbox" required className="mt-1 rounded border-slate-300" />
                      <span className="text-sm text-slate-700">
                        I understand that registration fees are non-refundable once payment is confirmed
                      </span>
                    </label>
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input type="checkbox" required className="mt-1 rounded border-slate-300" />
                      <span className="text-sm text-slate-700">
                        All players must provide valid identification documents before match participation
                      </span>
                    </label>
                  </div>
                </div>

                {/* Payment Button */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    type="submit" 
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-14 text-lg font-semibold shadow-lg"
                  >
                    <CreditCard className="h-5 w-5 mr-3" />
                    Pay NPR {registrationFee.toLocaleString()} with eSewa
                  </Button>
                  <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-4 min-w-[120px]">
                    <img src="/esewa-logo.png" alt="eSewa" className="h-8 mb-1" />
                    <span className="text-xs text-slate-500">Secure Payment</span>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="mt-6 flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <strong>Secure Payment:</strong> Your payment is processed securely through eSewa's encrypted payment gateway.
                  </div>
                </div>
              </CardContent>
            </Card>
            {showConfirmation && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                  <h2 className="text-xl font-bold mb-4 text-slate-800">Confirm Registration</h2>
                  <p className="text-slate-600 mb-6">
                    You're about to pay <strong>NPR {registrationFee.toLocaleString()}</strong> via eSewa for your team registration.
                    Do you want to continue?
                  </p>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEsewaPayment}>
                      Proceed to eSewa
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
};

export default TournamentRegistration;