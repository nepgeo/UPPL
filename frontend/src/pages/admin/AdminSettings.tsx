
import React, { useState } from 'react';
import { Settings, User, Shield, Bell, Database, Mail, Globe, Palette, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    site: {
      name: 'Patan Premiere League T20',
      description: 'Premier cricket tournament in Patan',
      logo: '/placeholder.svg',
      favicon: '/favicon.ico',
      timezone: 'Asia/Kolkata'
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      matchAlerts: true,
      newsAlerts: false
    },
    security: {
      twoFactorAuth: false,
      loginAttempts: 5,
      sessionTimeout: 60,
      passwordComplexity: true
    },
    email: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@pplt20.com'
    },
    social: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: ''
    }
  });

  const handleSave = (section) => {
    toast({
      title: "Settings Saved",
      description: `${section} settings have been successfully updated.`,
    });
  };

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
            <nav className="space-y-2">
              <a href="#general" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                <Globe className="h-4 w-4 mr-3" />
                General
              </a>
              <a href="#notifications" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                <Bell className="h-4 w-4 mr-3" />
                Notifications
              </a>
              <a href="#security" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                <Shield className="h-4 w-4 mr-3" />
                Security
              </a>
              <a href="#email" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                <Mail className="h-4 w-4 mr-3" />
                Email
              </a>
              <a href="#social" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                <User className="h-4 w-4 mr-3" />
                Social Media
              </a>
              <a href="#api" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                <Key className="h-4 w-4 mr-3" />
                API Keys
              </a>
              <a href="#database" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                <Database className="h-4 w-4 mr-3" />
                Database
              </a>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Settings</h1>

            <Tabs defaultValue="general" className="space-y-6">
              <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input
                        id="siteName"
                        value={settings.site.name}
                        onChange={(e) => handleSettingChange('site', 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="siteDescription">Site Description</Label>
                      <Textarea
                        id="siteDescription"
                        value={settings.site.description}
                        onChange={(e) => handleSettingChange('site', 'description', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={settings.site.timezone} onValueChange={(value) => handleSettingChange('site', 'timezone', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => handleSave('General')}>Save Changes</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="emailNotif">Email Notifications</Label>
                      <Switch
                        id="emailNotif"
                        checked={settings.notifications.emailNotifications}
                        onCheckedChange={(checked) => handleSettingChange('notifications', 'emailNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pushNotif">Push Notifications</Label>
                      <Switch
                        id="pushNotif"
                        checked={settings.notifications.pushNotifications}
                        onCheckedChange={(checked) => handleSettingChange('notifications', 'pushNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="matchAlerts">Match Alerts</Label>
                      <Switch
                        id="matchAlerts"
                        checked={settings.notifications.matchAlerts}
                        onCheckedChange={(checked) => handleSettingChange('notifications', 'matchAlerts', checked)}
                      />
                    </div>
                    <Button onClick={() => handleSave('Notifications')}>Save Changes</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                      <Switch
                        id="twoFactor"
                        checked={settings.security.twoFactorAuth}
                        onCheckedChange={(checked) => handleSettingChange('security', 'twoFactorAuth', checked)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                      <Input
                        id="loginAttempts"
                        type="number"
                        value={settings.security.loginAttempts}
                        onChange={(e) => handleSettingChange('security', 'loginAttempts', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                      />
                    </div>
                    <Button onClick={() => handleSave('Security')}>Save Changes</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtpHost">SMTP Host</Label>
                        <Input
                          id="smtpHost"
                          value={settings.email.smtpHost}
                          onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpPort">SMTP Port</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          value={settings.email.smtpPort}
                          onChange={(e) => handleSettingChange('email', 'smtpPort', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="smtpUser">SMTP Username</Label>
                      <Input
                        id="smtpUser"
                        value={settings.email.smtpUser}
                        onChange={(e) => handleSettingChange('email', 'smtpUser', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={settings.email.smtpPassword}
                        onChange={(e) => handleSettingChange('email', 'smtpPassword', e.target.value)}
                      />
                    </div>
                    <Button onClick={() => handleSave('Email')}>Save Changes</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="social">
                <Card>
                  <CardHeader>
                    <CardTitle>Social Media Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="facebook">Facebook URL</Label>
                      <Input
                        id="facebook"
                        value={settings.social.facebook}
                        onChange={(e) => handleSettingChange('social', 'facebook', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="twitter">Twitter URL</Label>
                      <Input
                        id="twitter"
                        value={settings.social.twitter}
                        onChange={(e) => handleSettingChange('social', 'twitter', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="instagram">Instagram URL</Label>
                      <Input
                        id="instagram"
                        value={settings.social.instagram}
                        onChange={(e) => handleSettingChange('social', 'instagram', e.target.value)}
                      />
                    </div>
                    <Button onClick={() => handleSave('Social Media')}>Save Changes</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
