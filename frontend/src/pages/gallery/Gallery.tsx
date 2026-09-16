import { useState, useEffect, useMemo } from "react";
import { Search, Camera, Image as ImageIcon, Play, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { BASE_URL } from "@/config";

function getImageUrl(img: any): string {
  if (!img) return "";
  if (typeof img === "string") {
    if (img.startsWith("data:") || img.startsWith("http")) return img;
    return `${BASE_URL}/${img.replace(/\\/g, "/")}`;
  }
  if (typeof img === "object") return img.secure_url || img.url || "";
  return "";
}

function isVideo(url: string): boolean {
  if (!url) return false;
  const v = url.toLowerCase();
  return v.includes("youtube.com") || v.includes("youtu.be") || v.includes("vimeo.com") || v.endsWith(".mp4") || v.endsWith(".webm");
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const CATEGORIES = ["all", "Match Highlights", "Behind the Scenes", "Fan Zone", "Events", "Venues"];

const CATEGORY_COLORS: Record<string, string> = {
  "Match Highlights": "bg-blue-500",
  "Behind the Scenes": "bg-emerald-500",
  "Fan Zone": "bg-purple-500",
  Events: "bg-orange-500",
  Venues: "bg-gray-500",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const SkeletonCard = () => (
  <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-100" />
    <div className="p-3 sm:p-4 space-y-2">
      <div className="h-3 bg-gray-100 rounded w-20" />
      <div className="h-4 bg-gray-100 rounded w-3/4" />
    </div>
  </div>
);

const Gallery = () => {
  const [images, setImages] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<any | null>(null);
  const [view, setView] = useState<"grid" | "albums">("grid");

  useEffect(() => {
    api.get("/gallery/images")
      .then((res) => setImages(res.data))
      .catch((err) => console.error("Failed to fetch gallery images:", err))
      .finally(() => setLoading(false));
  }, []);

  const albums = useMemo(() => {
    const map: Record<string, any[]> = {};
    images.forEach((img) => {
      const key = img.album?.name || img.album?.category || "Uncategorized";
      if (!map[key]) map[key] = [];
      map[key].push(img);
    });
    return Object.entries(map).map(([name, items]) => ({ name, items, category: items[0]?.album?.category || "" }));
  }, [images]);

  const filteredItems = useMemo(() => {
    if (view === "albums") return albums;
    return images.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.album?.category === selectedCategory;
      const matchesSearch = searchTerm === "" ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags?.some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [images, albums, selectedCategory, searchTerm, view]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero */}
      <div className="relative bg-gradient-to-r from-blue-700 via-purple-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-14 relative text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <div className="p-2 sm:p-2.5 bg-white/15 rounded-xl backdrop-blur-sm ring-1 ring-white/20">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight uppercase mb-2 sm:mb-3">UPPL T20 Gallery</h1>
          <p className="text-white/70 max-w-xl text-xs sm:text-sm md:text-lg mx-auto uppercase">
            Capturing the moments that make UPPL T20 unforgettable
          </p>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 -mt-6 sm:-mt-7 relative z-10">
        {/* Search & Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40 p-3 sm:p-5 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 mb-3 sm:mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
              <Input
                placeholder={view === "albums" ? "SEARCH ALBUMS..." : "SEARCH BY TITLE OR TAG..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 border-gray-200 bg-gray-50 focus:bg-white rounded-xl text-xs sm:text-sm"
              />
            </div>
            <div className="flex bg-gray-100 rounded-lg p-0.5 shrink-0">
              <button
                onClick={() => setView("grid")}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-semibold uppercase transition-all ${view === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                Photos
              </button>
              <button
                onClick={() => setView("albums")}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-semibold uppercase transition-all ${view === "albums" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                Albums
              </button>
            </div>
          </div>
          {view === "grid" && (
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase transition-all border ${
                    selectedCategory === cat
                      ? cat === "all" ? "bg-gray-900 text-white border-gray-900 shadow-md" : `${CATEGORY_COLORS[cat]} text-white border-transparent shadow-md`
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800"
                  }`}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Count */}
        <div className="flex items-center justify-between mb-5 sm:mb-6 text-xs sm:text-sm text-gray-500">
          <span className="font-semibold text-gray-800 uppercase">
            {view === "albums" ? `${albums.length} album${albums.length !== 1 ? "s" : ""}` : `${filteredItems.length} item${filteredItems.length !== 1 ? "s" : ""}`}
          </span>
          {loading && <span className="text-[#b15cff] animate-pulse text-[10px] sm:text-xs font-semibold uppercase">Loading...</span>}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-1 uppercase">Nothing here yet</h3>
            <p className="text-xs sm:text-sm text-gray-400 uppercase">Try adjusting your search or filter</p>
          </div>
        ) : view === "albums" ? (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {(filteredItems as any[]).map((album, i) => (
              <motion.div key={album.name} variants={itemVariants}>
                <Card className="overflow-hidden border border-white/40 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl cursor-pointer group bg-white/60 backdrop-blur-xl" onClick={() => { setSearchTerm(""); setView("grid"); setSelectedCategory(album.category || "all"); }}>
                  <div className="aspect-video bg-gray-100 overflow-hidden relative">
                    {album.items[0] && isVideo(getImageUrl(album.items[0].image)) ? (
                      <img src={`https://img.youtube.com/vi/${getYouTubeId(getImageUrl(album.items[0].image)) || ""}/hqdefault.jpg`} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }} />
                    ) : (
                      <img src={getImageUrl(album.items[0]?.image)} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 text-white">
                      <h3 className="font-bold text-xs sm:text-sm uppercase">{album.name}</h3>
                      <p className="text-[9px] sm:text-[10px] text-white/70 uppercase">{album.items.length} items</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredItems.map((item, i) => {
              const imgUrl = getImageUrl(item.image);
              const vid = isVideo(imgUrl);
              const vidId = vid ? getYouTubeId(imgUrl) : null;
              return (
                <motion.div key={item._id} variants={itemVariants}>
                  <Card className="overflow-hidden border border-white/40 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl cursor-pointer group bg-white/60 backdrop-blur-xl" onClick={() => !vid && setPreview(item)}>
                    <div className="aspect-square bg-gray-100 overflow-hidden relative">
                      {vid && vidId ? (
                        <div className="w-full h-full relative">
                          <img src={`https://img.youtube.com/vi/${vidId}/hqdefault.jpg`} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }} />
                          <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-600/90 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg">
                              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" />
                            </div>
                          </a>
                        </div>
                      ) : (
                        <>
                          <img src={imgUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }} />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                        </>
                      )}
                      <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2">
                        <span className={`inline-block px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-semibold text-white uppercase ${CATEGORY_COLORS[item.album?.category] || "bg-gray-500"}`}>
                          {item.album?.category || "Gallery"}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-2 sm:p-3">
                      <h3 className="font-semibold text-[10px] sm:text-xs text-gray-800 truncate group-hover:text-[#b15cff] transition-colors uppercase">{item.title}</h3>
                      <p className="text-[8px] sm:text-[10px] text-gray-400 mt-0.5 uppercase">{new Date(item.uploadDate).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {preview && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 sm:p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
          >
            <motion.div
              className="relative max-w-5xl w-full max-h-[90vh] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                onClick={() => setPreview(null)}
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <img src={getImageUrl(preview.image)} alt={preview.title} className="w-full max-h-[90vh] object-contain bg-black" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
