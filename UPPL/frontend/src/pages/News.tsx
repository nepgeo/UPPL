import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, Clock, User, ChevronRight, Newspaper } from "lucide-react";
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
    <div className="p-5 space-y-3">
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
      <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 py-14 sm:py-18 relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <Newspaper className="w-6 h-6 text-blue-300" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">UPPL T20 News</h1>
          </div>
          <p className="text-blue-200/80 max-w-xl text-sm sm:text-base">
            Stay updated with the latest news, analysis, and insights from UPPL T20
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-7 relative z-10">
        {/* Search & Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/80 p-4 sm:p-5 mb-8">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 bg-gray-50 focus:bg-white rounded-xl"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
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
        <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
          <span>
            <span className="font-semibold text-gray-800">{filteredArticles.length}</span> article{filteredArticles.length !== 1 && "s"}
          </span>
          {loading && <span className="text-blue-500 animate-pulse text-xs font-semibold">Loading...</span>}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
              <Newspaper className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No articles found</h3>
            <p className="text-sm text-gray-400">Try adjusting your search or filter</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featuredArticles.length > 0 && (
              <div className="mb-12">
                <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-blue-500" />
                  Featured Stories
                </h2>
                <div className="grid md:grid-cols-2 gap-5">
                  {featuredArticles.map((article, i) => (
                    <motion.div
                      key={article._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <Link to={`/news/${article._id}`} className="block group">
                        <Card className="overflow-hidden border border-gray-100/80 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
                          <div className="aspect-[16/9] bg-gray-100 overflow-hidden relative">
                            <img
                              src={getArticleImageUrl(article.images?.[0])}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                            <div className="absolute top-3 left-3">
                              <Badge className={`${CATEGORY_COLORS[article.category] || "bg-gray-500"} text-white border-0 text-[10px] px-2.5 py-0.5`}>
                                {article.category}
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="p-5">
                            <h3 className="font-bold text-base text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                              {article.title}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4">{article.summary}</p>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <div className="flex items-center gap-2">
                                {article.author?.profileImage ? (
                                  <img src={getProfileImageUrl(article.author.profileImage)} alt="" className="w-5 h-5 rounded-full object-cover" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="w-3 h-3 text-gray-400" />
                                  </div>
                                )}
                                <span>{article.author?.name || "Unknown"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{getTimeAgo(article.createdAt)}</span>
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
              <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-emerald-500" />
                Latest News
              </h2>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {regularArticles.map((article) => (
                  <motion.div key={article._id} variants={itemVariants}>
                    <Link to={`/news/${article._id}`} className="block group">
                      <Card className="overflow-hidden border border-gray-100/80 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl h-full">
                        <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
                          <img
                            src={getArticleImageUrl(article.images?.[0])}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={`${CATEGORY_COLORS[article.category] || "bg-gray-500"} text-white border-0 text-[10px] px-2 py-0.5`}>
                              {article.category}
                            </Badge>
                            <span className="text-[10px] text-gray-400">{getTimeAgo(article.createdAt)}</span>
                          </div>
                          <h3 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1.5">
                            {article.title}
                          </h3>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{article.summary}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {article.author?.profileImage ? (
                              <img src={getProfileImageUrl(article.author.profileImage)} alt="" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-3 h-3 text-gray-400" />
                              </div>
                            )}
                            <span>{article.author?.name || "Unknown"}</span>
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
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => fetchNews(page + 1, true)}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
