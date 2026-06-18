import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProfileImageUploader from '@/components/profile/ProfileImageUploader';

const UserProfile: React.FC = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    // Display preview
    const previewUrl = URL.createObjectURL(file);
    setProfileImage(previewUrl);

    // Optionally: Upload `file` to backend here
    console.log('Received cropped image file:', file);
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <Avatar className="h-24 w-24 border">
            <AvatarImage src={profileImage ?? undefined} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>

        <ProfileImageUploader onUpload={handleImageUpload} />
      </CardContent>
    </Card>
  );
};

export default UserProfile;
