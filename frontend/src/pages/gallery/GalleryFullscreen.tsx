import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPublicImages } from '@/services/galleryService';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { X } from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { BASE_URL } from"@/config";

interface Image {
  _id: string;
  title: string;
  url: string;
  uploadDate: string;
  tags: string[];
  album?: {
    name: string;
    category: string;
  };
}

const GalleryFullscreen = () => {
  const { imageId } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState<Image[]>([]);
  const [initialIndex, setInitialIndex] = useState<number>(0);

  // ✅ Lock scroll on fullscreen
  useScrollLock(true);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const res = await fetchPublicImages();
        const allImages = res.data as Image[];

        const index = allImages.findIndex((img) => img._id === imageId);
        setImages(allImages);
        setInitialIndex(index !== -1 ? index : 0);
      } catch (err) {
        console.error('Failed to load images:', err);
      }
    };

    loadImages();
  }, [imageId]);

  if (images.length === 0) {
    return <div className="text-center py-20 text-white">Loading...</div>;
  }

  return (
    <div className="w-full h-screen bg-black text-white relative overflow-hidden">
      {/* ❌ Close Button */}
      <button
        onClick={() => navigate('/gallery')}
        className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 p-2 rounded-full"
        aria-label="Close"
      >
        <X className="text-white w-5 h-5" />
      </button>

      {/* 🖼 Swiper */}
      <Swiper
        modules={[Navigation, Pagination, Keyboard]}
        navigation
        pagination={{ clickable: true }}
        keyboard={{ enabled: true }}
        initialSlide={initialIndex}
        spaceBetween={50}
        slidesPerView={1}
        className="h-full w-full"
      >
        {images.map((image) => (
          <SwiperSlide key={image._id}>
            <div className="w-full h-full flex flex-col justify-center items-center px-4">
              <img
                src={`${BASE_URL}/${image.url}`}
                alt={image.title}
                className="max-h-[80vh] object-contain rounded shadow-xl"
              />
              <div className="mt-4 text-center max-w-3xl">
                <h2 className="text-xl font-semibold">{image.title}</h2>
                <p className="text-sm text-gray-300">
                  {new Date(image.uploadDate).toLocaleDateString()} • {image.album?.name}
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {image.tags?.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-700 rounded px-2 py-1"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default GalleryFullscreen;
