import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { fetchPublicImages } from "@/services/galleryService";
import { FiChevronLeft, FiChevronRight, FiMaximize2, FiX } from "react-icons/fi";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { BASE_URL } from "@/lib/api";

interface Album {
  _id: string;
  name: string;
}

interface Image {
  _id: string;
  title: string;
  url: string;
  album: Album;
  description?: string;
  likes?: number;
}

const GalleryPreview = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [activeIndex, setActiveIndex] = useState(2);
  const [previewImage, setPreviewImage] = useState<Image | null>(null);
  const { ref: scrollRef, inView } = useInView({ triggerOnce: true });
  const mainRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: mainRef });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const res = await fetchPublicImages();
        const sorted = res.data
          .sort((a: Image, b: Image) => b._id.localeCompare(a._id))
          .slice(0, 7);
        setImages(sorted);
      } catch (err) {
        console.error("Error fetching images", err);
      }
    };
    loadImages();
  }, []);

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

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
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
              Explore our curated collection of tournament highlights and behind-the-scenes moments
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
                          src={`${BASE_URL}/${image.url}`}
                          alt={image.title}
                          className="w-full h-[350px] sm:h-[450px] md:h-[500px] object-cover"
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

            {images.length === 0 && (
              <div className="text-center text-gray-500">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-gray-300 h-10 w-10 sm:h-12 sm:w-12" />
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4" />
                    <div className="h-4 bg-gray-300 rounded w-5/6" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 sm:-top-40 sm:-left-40 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-r from-purple-200 to-indigo-200 rounded-full blur-2xl sm:blur-3xl opacity-40 sm:opacity-50" />
          <div className="absolute -bottom-20 -right-20 sm:-bottom-40 sm:-right-40 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-r from-purple-200 to-indigo-200 rounded-full blur-2xl sm:blur-3xl opacity-40 sm:opacity-50" />
        </div>
      </div>

      {/* Preview Modal */}
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
                src={`${BASE_URL}/${previewImage.url}`}
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
