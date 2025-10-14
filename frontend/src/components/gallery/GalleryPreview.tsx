import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { fetchPublicImages } from "@/services/galleryService";
import { FiChevronLeft, FiChevronRight, FiMaximize2, FiX } from "react-icons/fi";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { BASE_URL } from "@/config";

interface Album {
  _id: string;
  name: string;
}

interface Image {
  _id: string;
  title: string;
  image: {
    url: string;
    public_id: string;
  };
  album: string;
  tags?: string[];
}

// ✅ Safe universal image resolver
const getImageUrl = (img: any): string => {
  if (!img) return "";
  if (typeof img === "string") {
    if (img.startsWith("data:")) return img;
    if (img.startsWith("http")) return img;
    return `${BASE_URL}/${img.replace(/\\/g, "/")}`;
  }
  if (typeof img === "object") {
    return img.secure_url || img.url || "";
  }
  return "";
};

const GalleryPreview = () => {
  const [allImages, setAllImages] = useState<Image[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [activeIndex, setActiveIndex] = useState(2);
  const [previewImage, setPreviewImage] = useState<Image | null>(null);
  const { ref: scrollRef, inView } = useInView({ triggerOnce: true });
  const mainRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: mainRef });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);

  // 🧩 Fetch images initially
  useEffect(() => {
    const loadImages = async () => {
      try {
        const res = await fetchPublicImages();
        const all = res.data || [];
        setAllImages(all);

        // pick first album as default
        const grouped = groupByAlbum(all);
        const firstAlbum = Object.keys(grouped)[0];
        if (firstAlbum) setImages(grouped[firstAlbum].slice(0, 7));
      } catch (err) {
        console.error("Error fetching images", err);
      }
    };
    loadImages();
  }, []);

  // 🧩 Group images by album
  const groupByAlbum = (images: Image[]) => {
    return images.reduce((acc: any, img: Image) => {
      if (!acc[img.album]) acc[img.album] = [];
      acc[img.album].push(img);
      return acc;
    }, {});
  };

  // 🧠 Shuffle albums every 5 seconds
  useEffect(() => {
    if (allImages.length === 0) return;

    const grouped = groupByAlbum(allImages);
    const albumKeys = Object.keys(grouped);
    if (albumKeys.length === 0) return;

    const interval = setInterval(() => {
      const randomAlbum = albumKeys[Math.floor(Math.random() * albumKeys.length)];
      const albumImages = grouped[randomAlbum] || [];
      if (albumImages.length > 0) {
        const shuffled = [...albumImages].sort(() => 0.5 - Math.random());
        setImages(shuffled.slice(0, 7));
        setActiveIndex(2);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [allImages]);

  // 🧭 Navigation
  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const getCardStyle = (index: number) => {
    const position = index - activeIndex;
    const absPos = Math.abs(position);
    const scale = 1 - absPos * 0.2;
    const translateX = position * 220;
    const zIndex = 5 - absPos;
    const rotateY = position * 15;
    const opacity = absPos > 3 ? 0 : 0.7 + (1 - absPos * 0.15);
    return {
      transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
      zIndex,
      opacity,
      filter: `brightness(${1 - absPos * 0.15})`,
    };
  };

  return (
    <section
      ref={scrollRef}
      className="w-full py-8 bg-gradient-to-b from-purple-50 to-indigo-50 text-black relative overflow-hidden"
    >
      <div className="container mx-auto px-4 sm:px-6 relative">
        <motion.div ref={mainRef} style={{ scale }} className="relative z-10">
          <div className="text-center mb-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Memorable Moments
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-base sm:text-lg mt-2">
              Shuffling highlights from our various albums every few seconds — enjoy the memories!
            </p>
          </div>

          <div className="relative h-[350px] sm:h-[450px] md:h-[500px] flex items-center justify-center">
            {inView && images.length > 0 && (
              <>
                {/* Prev button */}
                <button
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-6 z-20 p-2 sm:p-3 rounded-full bg-white/80 shadow-md hover:bg-white transition-colors backdrop-blur-sm border border-white/30"
                >
                  <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </button>

                {/* Cards */}
                {images.map((image, index) => {
                  const style = getCardStyle(index);
                  return (
                    <motion.div
                      key={image._id}
                      className="absolute w-[240px] sm:w-[320px] md:w-[400px] rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-lg sm:shadow-xl md:shadow-2xl bg-white cursor-pointer"
                      style={{
                        ...style,
                        transition: "transform 0.3s ease, opacity 0.3s ease, z-index 0s",
                      }}
                      onClick={() => setPreviewImage(image)}
                    >
                      <div className="relative group">
                        <img
                          src={getImageUrl(image.image)}
                          alt={image.title}
                          className="w-full h-[350px] sm:h-[450px] md:h-[500px] object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.jpg";
                          }}
                        />
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <FiMaximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Next button */}
                <button
                  onClick={handleNext}
                  className="absolute right-2 sm:right-6 z-20 p-2 sm:p-3 rounded-full bg-white/80 shadow-md hover:bg-white transition-colors backdrop-blur-sm border border-white/30"
                >
                  <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Decorative gradients */}
        <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 sm:-top-40 sm:-left-40 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-r from-purple-200 to-indigo-200 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-20 -right-20 sm:-bottom-40 sm:-right-40 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-r from-purple-200 to-indigo-200 rounded-full blur-3xl opacity-40" />
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
              className="relative max-w-6xl w-full max-h-[90vh] rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={getImageUrl(previewImage?.image)}
                alt={previewImage.title}
                className="w-full h-full object-contain bg-black"
              />
              <button
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-3 bg-white/80 rounded-full text-gray-800 hover:bg-white transition-colors"
                onClick={() => setPreviewImage(null)}
              >
                <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 mb-8 flex items-center justify-center">
        <Link
          to="/gallery"
          className="px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 transition-opacity shadow-lg"
        >
          Browse Full Gallery
        </Link>
      </div>
    </section>
  );
};

export default GalleryPreview;
