import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User, Share2, ChevronLeft, ChevronRight, X, Facebook, Twitter, Link as LinkIcon, Check, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { getProfileImageUrl } from "@/utils/getProfileImageUrl";

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

function getImageUrl(img: any): string {
  if (!img) return "/placeholder.svg";
  if (typeof img === "object" && img.url) return img.url;
  if (typeof img === "string" && img.startsWith("http")) return img;
  return "/placeholder.svg";
}

const Skeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-6 w-20 bg-gray-200 rounded-full" />
      <div className="h-10 w-3/4 bg-gray-200 rounded" />
      <div className="h-5 w-1/2 bg-gray-200 rounded" />
      <div className="h-[400px] bg-gray-200 rounded-2xl" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  </div>
);

const ShareModal = ({ url, title, onClose }: { url: string; title: string; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`, icon: Facebook, color: "bg-blue-600 hover:bg-blue-700" },
    { name: "X (Twitter)", href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encoded}`, icon: Twitter, color: "bg-gray-800 hover:bg-gray-900" },
    { name: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encoded}`, icon: ExternalLink, color: "bg-emerald-500 hover:bg-emerald-600" },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800">Share this article</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="flex gap-3 mb-4">
          {shareLinks.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 flex flex-col items-center gap-1.5 ${s.color} text-white rounded-xl py-3 transition-colors`}
            >
              <s.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{s.name}</span>
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1.5">
          <input
            readOnly
            value={url}
            className="flex-1 bg-transparent text-xs text-gray-500 px-2 outline-none truncate"
          />
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              copied ? "bg-emerald-500 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const NewsArticle = () => {
  const { articleId } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setZoomedIndex(null); setShowShare(false); }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await api.get(`/news/${articleId}`);
        const data = res.data;
        setArticle(data);
        api.patch(`/news/${articleId}/view`).catch(() => {});

        if (data.category) {
          api.get(`/news?status=published&category=${encodeURIComponent(data.category)}`)
            .then((relRes) => {
              const all = relRes.data || [];
              setRelated(all.filter((a: any) => a._id !== data._id).slice(0, 3));
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error("Failed to fetch article:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [articleId]);

  const readingTime = article?.content
    ? Math.max(1, Math.ceil(article.content.replace(/<[^>]+>/g, "").split(/\s+/).length / 200))
    : 1;

  const images = article?.images || [];

  if (loading) return <Skeleton />;

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <Link to="/news"><Button>Back to News</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/news" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to News
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-blue-600"
            onClick={() => setShowShare(true)}
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            <span className="text-xs">Share</span>
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Meta */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {article.category && (
                <Badge className={`${CATEGORY_COLORS[article.category] || "bg-gray-500"} text-white border-0 text-[11px] px-3 py-0.5`}>
                  {article.category}
                </Badge>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(article.createdAt || article.publishedAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {readingTime} min read
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {article.author?.name || "Unknown"}
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
              {article.title}
            </h1>

            {article.summary && (
              <p className="text-base sm:text-lg text-gray-500 leading-relaxed border-l-2 border-blue-200 pl-4">
                {article.summary}
              </p>
            )}
          </div>

          {/* Images */}
          {images.length > 0 ? (
            <div className="mb-8">
              {images.length === 1 ? (
                <div className="rounded-2xl overflow-hidden cursor-zoom-in shadow-sm" onClick={() => setZoomedIndex(0)}>
                  <img src={getImageUrl(images[0])} alt={article.title} className="w-full max-h-[450px] object-cover" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {images.slice(0, 4).map((img: any, i: number) => (
                    <div
                      key={i}
                      className={`rounded-2xl overflow-hidden cursor-zoom-in shadow-sm ${i === 0 ? "col-span-2 row-span-2" : ""}`}
                      onClick={() => setZoomedIndex(i)}
                    >
                      <img
                        src={getImageUrl(img)}
                        alt={`${article.title} ${i + 1}`}
                        className="w-full h-full object-cover"
                        style={{ maxHeight: i === 0 ? "400px" : "200px" }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mb-8 rounded-2xl overflow-hidden bg-gray-100">
              <img src="/placeholder.svg" alt="" className="w-full h-64 object-cover" />
            </div>
          )}

          {/* Content */}
          <Card className="border border-gray-100/80 shadow-sm rounded-2xl mb-8">
            <CardContent className="p-6 sm:p-8">
              <div
                className="prose prose-base sm:prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-blue-600 prose-img:rounded-xl prose-img:shadow-sm"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {article.tags && article.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider mr-1">Tags:</span>
                  {article.tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px] px-2.5 py-0.5 border-gray-200 text-gray-500">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Author */}
          {article.author && (
            <Card className="border border-gray-100/80 shadow-sm rounded-2xl mb-8">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  {article.author.profileImage?.url || article.author.profileImage ? (
                    <img
                      src={getImageUrl(article.author.profileImage)}
                      alt={article.author.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400">
                      {article.author.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">{article.author.name}</h3>
                  <p className="text-xs text-gray-400">{article.author.role || "Contributor"}</p>
                  {article.author.bio && (
                    <p className="text-xs text-gray-500 mt-1">{article.author.bio}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Articles */}
          {related.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-blue-500" />
                Related Articles
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map((item, i) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link to={`/news/${item._id}`} className="block group">
                      <Card className="overflow-hidden border border-gray-100/80 shadow-sm hover:shadow-md transition-all rounded-xl h-full">
                        <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                          <img
                            src={getImageUrl(item.images?.[0])}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <CardContent className="p-3">
                          <Badge className={`${CATEGORY_COLORS[item.category] || "bg-gray-500"} text-white border-0 text-[8px] px-2 py-0.5 mb-1.5`}>
                            {item.category}
                          </Badge>
                          <h3 className="font-semibold text-xs text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {item.title}
                          </h3>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.article>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShare && (
          <ShareModal
            url={window.location.href}
            title={article.title}
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomedIndex !== null && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedIndex(null)}
          >
            <button
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
              onClick={() => setZoomedIndex(null)}
            >
              <X className="w-5 h-5" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  className="absolute left-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                  onClick={(e) => { e.stopPropagation(); setZoomedIndex((zoomedIndex - 1 + images.length) % images.length); }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  className="absolute right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                  onClick={(e) => { e.stopPropagation(); setZoomedIndex((zoomedIndex + 1) % images.length); }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <motion.img
              key={zoomedIndex}
              src={getImageUrl(images[zoomedIndex])}
              alt=""
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewsArticle;
