import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Clock, User, Newspaper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { getProfileImageUrl } from "@/utils/getProfileImageUrl";

function getArticleImageUrl(image: any): string {
  if (!image) return "/placeholder.svg";
  if (typeof image === "object" && image.url) return image.url;
  if (typeof image === "string" && image.startsWith("http")) return image;
  return "/placeholder.svg";
}

const CATEGORIES = [
  "all", "Match Report", "Transfer News", "Analysis",
  "Player Focus", "Technology", "Fan Zone", "International", "Health & Fitness",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Match Report": "bg-blue-500",
  "Transfer News": "bg-emerald-500",
  Analysis: "bg-purple-500",
  "Player Focus": "bg-orange-500",
  Technology: "bg-gray-500",
  "Fan Zone": "bg-pink-500",
  International: "bg-amber-500",
  "Health & Fitness": "bg-red-500",
};

function getTimeAgo(dateString: string) {
  const now = Date.now();
  const created = new Date(dateString).getTime();
  const diff = Math.floor((now - created) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="aspect-[16/10] bg-gray-100" />
    <div className="p-4 sm:p-5 space-y-3">
      <div className="h-4 bg-gray-100 rounded w-24" />
      <div className="h-5 bg-gray-100 rounded w-full" />
      <div className="h-5 bg-gray-100 rounded w-3/4" />
      <div className="h-4 bg-gray-100 rounded w-full" />
      <div className="flex items-center gap-3 mt-3">
        <div className="w-6 h-6 rounded-full bg-gray-100" />
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
    </div>
  </div>
);

const News = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchNews = async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const res = await api.get(`/news?status=published&page=${pageNum}&limit=12`);
      const { articles, hasMore: hm } = res.data;
      setNewsArticles((prev) => append ? [...prev, ...articles] : articles);
      setHasMore(hm);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch news", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchNews(1, false); }, []);

  const filteredArticles = useMemo(() => {
    return newsArticles.filter((article) => {
      const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
      const matchesSearch = searchTerm === "" ||
        article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.summary?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [newsArticles, selectedCategory, searchTerm]);

  const featuredArticles = useMemo(() => filteredArticles.filter((a) => a.featured), [filteredArticles]);
  const regularArticles = useMemo(() => filteredArticles.filter((a) => !a.featured), [filteredArticles]);

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
              <Newspaper className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight uppercase mb-2 sm:mb-3">UPPL T20 News</h1>
          <p className="text-white/70 max-w-xl text-xs sm:text-sm md:text-lg mx-auto uppercase">
            Stay updated with the latest news, analysis, and insights from UPPL T20
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
                placeholder="SEARCH ARTICLES..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 border-gray-200 bg-gray-50 focus:bg-white rounded-xl text-xs sm:text-sm"
              />
            </div>
          </div>
          <div className="flex gap-1.5 sm:gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase transition-all border ${
                  selectedCategory === cat
                    ? cat === "all"
                      ? "bg-gray-900 text-white border-gray-900 shadow-md"
                      : `${CATEGORY_COLORS[cat]} text-white border-transparent shadow-md`
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800"
                }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-5 sm:mb-6 text-xs sm:text-sm text-gray-500">
          <span className="uppercase">
            <span className="font-semibold text-gray-800">{filteredArticles.length}</span> article{filteredArticles.length !== 1 && "s"}
          </span>
          {loading && <span className="text-[#b15cff] animate-pulse text-[10px] sm:text-xs font-semibold uppercase">Loading...</span>}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
              <Newspaper className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-1 uppercase">No articles found</h3>
            <p className="text-xs sm:text-sm text-gray-400 uppercase">Try adjusting your search or filter</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featuredArticles.length > 0 && (
              <div className="mb-8 sm:mb-12">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-5 flex items-center gap-2 uppercase">
                  <span className="w-1 h-5 rounded-full bg-[#b15cff]" />
                  Featured Stories
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  {featuredArticles.map((article, i) => (
                    <motion.div
                      key={article._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <Link to={`/news/${article._id}`} className="block group">
                        <Card className="overflow-hidden border border-white/40 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white/60 backdrop-blur-xl">
                          <div className="aspect-[16/9] bg-gray-100 overflow-hidden relative">
                            <img
                              src={getArticleImageUrl(article.images?.[0])}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                            <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                              <Badge className={`${CATEGORY_COLORS[article.category] || "bg-gray-500"} text-white border-0 text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 uppercase font-bold`}>
                                {article.category}
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="p-3 sm:p-5">
                            <h3 className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-[#b15cff] transition-colors mb-1.5 sm:mb-2 line-clamp-2 uppercase">
                              {article.title}
                            </h3>
                            <p className="text-[10px] sm:text-sm text-gray-500 line-clamp-2 mb-3 sm:mb-4 uppercase">{article.summary}</p>
                            <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-400">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                {article.author?.profileImage ? (
                                  <img src={getProfileImageUrl(article.author.profileImage)} alt="" className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover" />
                                ) : (
                                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" />
                                  </div>
                                )}
                                <span className="uppercase">{article.author?.name || "Unknown"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span className="uppercase">{getTimeAgo(article.createdAt)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Latest */}
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-5 flex items-center gap-2 uppercase">
                <span className="w-1 h-5 rounded-full bg-emerald-500" />
                Latest News
              </h2>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
              >
                {regularArticles.map((article) => (
                  <motion.div key={article._id} variants={itemVariants}>
                    <Link to={`/news/${article._id}`} className="block group">
                      <Card className="overflow-hidden border border-white/40 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl h-full bg-white/60 backdrop-blur-xl">
                        <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
                          <img
                            src={getArticleImageUrl(article.images?.[0])}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <Badge className={`${CATEGORY_COLORS[article.category] || "bg-gray-500"} text-white border-0 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 uppercase font-bold`}>
                              {article.category}
                            </Badge>
                            <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase">{getTimeAgo(article.createdAt)}</span>
                          </div>
                          <h3 className="font-semibold text-xs sm:text-sm text-gray-900 group-hover:text-[#b15cff] transition-colors line-clamp-2 mb-1 sm:mb-1.5 uppercase">
                            {article.title}
                          </h3>
                          <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2 mb-2 sm:mb-3 uppercase">{article.summary}</p>
                          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-400">
                            {article.author?.profileImage ? (
                              <img src={getProfileImageUrl(article.author.profileImage)} alt="" className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover" />
                            ) : (
                              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" />
                              </div>
                            )}
                            <span className="uppercase">{article.author?.name || "Unknown"}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-6 sm:mt-8">
                <button
                  onClick={() => fetchNews(page + 1, true)}
                  disabled={loadingMore}
                  className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white/80 backdrop-blur border border-white/40 text-gray-600 hover:text-gray-900 hover:border-[#b15cff]/50 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                >
                  {loadingMore ? "Loading..." : "Load More Articles"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default News;
