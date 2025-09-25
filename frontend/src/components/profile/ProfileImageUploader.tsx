import React, { useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import getCroppedImg from '@/utils/cropImage'; // helper function we'll add

interface Props {
  onUpload: (file: File) => void;
  initialImage?: string;
}

const ProfileImageUploader: React.FC<Props> = ({ onUpload, initialImage }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage || null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const imageDataUrl = await readFile(file);
    setImageSrc(imageDataUrl);
  };

  const readFile = (file: File) => {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result as string));
      reader.readAsDataURL(file);
    });
  };

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropDone = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 'circle');
    const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
    onUpload(file);
  };

  return (
    <div className="space-y-4">
      {!imageSrc && (
        <Button onClick={() => inputRef.current?.click()}>Upload Photo</Button>
      )}

      {imageSrc && (
        <div className="relative w-full h-64 bg-gray-100">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
          <Slider min={1} max={3} step={0.1} value={[zoom]} onValueChange={(v) => setZoom(v[0])} />
          <div className="flex space-x-4 mt-4">
            <Button onClick={handleCropDone}>Save</Button>
            <Button variant="outline" onClick={() => setImageSrc(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
        ref={inputRef}
      />
    </div>
  );
};

export default ProfileImageUploader;
