import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Film, X, Youtube, ExternalLink, Clock, Tv, Radio } from 'lucide-react';
import api from '@/lib/api';

function getVideoType(url: string): 'direct' | 'youtube' | 'vimeo' | 'facebook' | 'unknown' {
  if (/\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(url)) return 'direct';
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') || u.hostname === 'youtu.be') return 'youtube';
    if (u.hostname.includes('vimeo.com')) return 'vimeo';
    if (u.hostname.includes('facebook.com') || u.hostname === 'fb.watch') return 'facebook';
  } catch {}
  return 'unknown';
}

function getEmbedUrl(video: any): string {
  if (video.embedUrl) return video.embedUrl;
  const url = video.url;
  const type = getVideoType(url);
  if (type === 'youtube') {
    try {
      const u = new URL(url);
      let vid: string | null = null;
      if (u.hostname.includes('youtube.com')) {
        if (u.pathname === '/watch') vid = u.searchParams.get('v');
        else { const m = u.pathname.match(/^\/(embed|live|shorts)\/([a-zA-Z0-9_-]{11})/); if (m) vid = m[2]; }
      } else if (u.hostname === 'youtu.be') { vid = u.pathname.slice(1).split('/')[0] || null; }
      if (vid) return `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1`;
    } catch {}
  }
  if (type === 'vimeo') { const m = url.match(/vimeo\.com\/(\d+)/); if (m) return `https://player.vimeo.com/video/${m[1]}?autoplay=1`; }
  if (type === 'facebook') return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&autoplay=1`;
  return url;
}

const platformMeta: Record<string, { label: string; color: string; icon: any }> = {
  youtube: { label: 'YOUTUBE', color: 'bg-red-600', icon: Youtube },
  vimeo: { label: 'VIMEO', color: 'bg-blue-600', icon: Film },
  facebook: { label: 'FACEBOOK', color: 'bg-blue-800', icon: Film },
  direct: { label: 'VIDEO', color: 'bg-green-600', icon: Tv },
  unknown: { label: 'LINK', color: 'bg-gray-600', icon: ExternalLink },
};

export default function WatchLive() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  useEffect(() => {
    api.get('/videos')
      .then(res => setVideos(res.data.videos || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-purple-800 to-indigo-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10 md:py-14 relative">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
              <Radio className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white animate-pulse" />
              <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-widest animate-pulse">Watch Live</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white mb-2 sm:mb-3 tracking-tight uppercase">Live & Videos</h1>
            <p className="text-white/70 text-xs sm:text-sm md:text-lg max-w-xl mx-auto uppercase">Watch matches live and catch up with highlights and interviews.</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-5 sm:py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="w-full aspect-video bg-white/5 rounded-xl" />
                <Skeleton className="h-5 w-3/4 bg-white/5 rounded" />
                <Skeleton className="h-4 w-1/2 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-5 sm:mb-6">
              <Film className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 uppercase">No Videos Available</h2>
            <p className="text-gray-400 mb-5 sm:mb-6 text-xs sm:text-sm uppercase">There are no live streams or videos added yet. Check back later.</p>
            <Button onClick={() => navigate('/live-scores')} variant="outline" className="border-gray-700 text-white text-xs sm:text-sm">
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-2 uppercase" /> BACK TO LIVE SCORES
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {videos.map((video, idx) => {
              const type = getVideoType(video.url);
              const meta = platformMeta[type] || platformMeta.unknown;
              const Icon = meta.icon;
              return (
                <motion.div
                  key={video._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                >
                  <div
                    onClick={() => setSelectedVideo(video)}
                    className="group cursor-pointer bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden hover:border-[#b15cff]/50 hover:shadow-lg hover:shadow-[#b15cff]/10 transition-all duration-300"
                  >
                    <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                          <Icon className="h-12 w-12 sm:h-14 sm:w-14 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-[#8fa2ff] to-[#ff8aa1] flex items-center justify-center shadow-lg shadow-[#b15cff]/30 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                          <Play className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white ml-1" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="font-semibold text-white text-sm sm:text-base md:text-lg group-hover:text-[#ff8aa1] transition-colors uppercase">{video.title}</h3>
                      {video.description && (
                        <p className="text-xs sm:text-sm md:text-base text-gray-400 mt-1.5 line-clamp-2 uppercase">{video.description}</p>
                      )}
                      {video.createdAt && (
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 mt-2 uppercase">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {new Date(video.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-5xl bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 bg-gray-800/80 border-b border-white/10">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${(platformMeta[getVideoType(selectedVideo.url)] || platformMeta.unknown).color} flex items-center justify-center flex-shrink-0`}>
                    {(() => {
                      const Icon = (platformMeta[getVideoType(selectedVideo.url)] || platformMeta.unknown).icon;
                      return <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold truncate text-xs sm:text-sm uppercase">{selectedVideo.title}</h3>
                    <p className="text-gray-400 text-[10px] sm:text-xs uppercase">{(platformMeta[getVideoType(selectedVideo.url)] || platformMeta.unknown).label}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedVideo(null)} className="text-gray-400 hover:text-white hover:bg-white/10 p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0">
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>

              {/* Player */}
              <div className="aspect-video bg-black relative">
                {getVideoType(selectedVideo.url) === 'direct' ? (
                  <video src={selectedVideo.url} className="w-full h-full" controls autoPlay playsInline />
                ) : getVideoType(selectedVideo.url) === 'unknown' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 sm:gap-4 text-gray-400 p-6 sm:p-8">
                    <ExternalLink className="h-10 w-10 sm:h-12 sm:w-12" />
                    <p className="text-xs sm:text-sm text-center uppercase">This video type can't be played in the browser.</p>
                    <a href={selectedVideo.url} target="_blank" rel="noopener noreferrer"
                      className="bg-gradient-to-r from-[#8fa2ff] to-[#ff8aa1] hover:opacity-90 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-colors inline-flex items-center gap-2 uppercase">
                      OPEN VIDEO <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                    </a>
                  </div>
                ) : (
                  <iframe
                    src={getEmbedUrl(selectedVideo)}
                    title={selectedVideo.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
                  />
                )}
                <a href={selectedVideo.url} target="_blank" rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-black/70 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-black/90 transition-colors z-10 inline-flex items-center gap-1 uppercase">
                  OPEN IN NEW TAB <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </a>
              </div>

              {/* Description */}
              {selectedVideo.description && (
                <div className="px-3 sm:px-5 py-3 sm:py-4 bg-gray-800/50 border-t border-white/10">
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 uppercase">{selectedVideo.description}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
