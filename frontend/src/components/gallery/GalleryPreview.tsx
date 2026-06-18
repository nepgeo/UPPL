import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { fetchPublicImages } from "@/services/galleryService";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL } from "@/config";

interface Image {
  _id: string;
  title: string;
  image: { url: string; public_id: string };
  album: string;
  tags?: string[];
}

const getImageUrl = (img: any): string => {
  if (!img) return "";
  if (typeof img === "string") {
    if (img.startsWith("data:") || img.startsWith("http")) return img;
    return `${BASE_URL}/${img.replace(/\\/g, "/")}`;
  }
  if (typeof img === "object") return img.secure_url || img.url || "";
  return "";
};

const groupByAlbum = (images: Image[]) =>
  images.reduce((acc: Record<string, Image[]>, img) => {
    if (!acc[img.album]) acc[img.album] = [];
    acc[img.album].push(img);
    return acc;
  }, {});

const GalleryPreview = () => {
  const [allImages, setAllImages] = useState<Image[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState<Image | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchPublicImages();
        const all: Image[] = res.data || [];
        setAllImages(all);
        const grouped = groupByAlbum(all);
        const first = Object.keys(grouped)[0];
        if (first) setImages(grouped[first].slice(0, 7));
      } catch (err) {
        console.error("Error fetching images", err);
      }
    };
    load();
  }, []);

  // Auto-cycle albums
  useEffect(() => {
    if (allImages.length === 0) return;
    const grouped = groupByAlbum(allImages);
    const keys = Object.keys(grouped);
    if (keys.length === 0) return;

    intervalRef.current = setInterval(() => {
      const album = keys[Math.floor(Math.random() * keys.length)];
      const albumImages = grouped[album] || [];
      if (albumImages.length > 0) {
        setImages(albumImages.slice(0, 7));
        setActiveIndex(0);
      }
    }, 6000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [allImages]);

  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  const handleNext = () => setActiveIndex((prev) => (prev + 1) % images.length);

  const getCardStyle = (index: number) => {
    const pos = index - activeIndex;
    const absPos = Math.abs(pos);
    const scale = 1 - absPos * 0.18;
    const translateX = pos * 200;
    const zIndex = 10 - absPos;
    const opacity = absPos > 3 ? 0 : Math.max(0.3, 1 - absPos * 0.2);
    return {
      transform: `translateX(${translateX}px) scale(${scale})`,
      zIndex,
      opacity,
      filter: `brightness(${Math.max(0.4, 1 - absPos * 0.15)})`,
    };
  };

  if (allImages.length === 0) return null;

  return (
    <section className="w-full py-10 sm:py-14 bg-gradient-to-b from-purple-50 via-white to-indigo-50 text-black relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Memorable Moments
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base mt-2">
            Highlights from our albums — cycling every few seconds
          </p>
        </div>

        {/* Carousel */}
        <div className="relative h-[300px] sm:h-[400px] md:h-[480px] flex items-center justify-center">
          {images.length > 0 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-1 sm:left-4 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/80 shadow-md hover:bg-white transition-colors backdrop-blur-sm border border-white/30 flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5 text-purple-600" />
              </button>

              {images.map((image, index) => {
                const style = getCardStyle(index);
                return (
                  <motion.div
                    key={image._id}
                    className="absolute w-[200px] sm:w-[280px] md:w-[360px] rounded-xl sm:rounded-2xl overflow-hidden shadow-lg bg-white cursor-pointer select-none"
                    style={{
                      ...style,
                      transition: "transform 0.35s ease, opacity 0.35s ease",
                    }}
                    onClick={() => setPreviewImage(image)}
                    whileHover={index === activeIndex ? { scale: 1.02 } : {}}
                  >
                    <div className="relative group">
                      <img
                        src={getImageUrl(image.image)}
                        alt={image.title}
                        className="w-full h-[300px] sm:h-[400px] md:h-[480px] object-cover"
                        onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-sm font-semibold truncate">{image.title}</h3>
                      </div>
                      <div className="absolute top-3 right-3 p-1.5 bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              <button
                onClick={handleNext}
                className="absolute right-1 sm:right-4 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/80 shadow-md hover:bg-white transition-colors backdrop-blur-sm border border-white/30 flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5 text-purple-600" />
              </button>
            </>
          )}
        </div>

        {/* Decorative background */}
        <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none -z-0">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-200/40 to-indigo-200/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-200/40 to-indigo-200/40 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              className="relative max-w-6xl w-full max-h-[90vh] rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                onClick={() => setPreviewImage(null)}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <img
                src={getImageUrl(previewImage?.image)}
                alt={previewImage.title}
                className="w-full h-full object-contain bg-black"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-center">
        <Link
          to="/gallery"
          className="px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 transition-opacity shadow-lg"
        >
          Browse Full Gallery
        </Link>
      </div>
    </section>
  );
};

export default GalleryPreview;
