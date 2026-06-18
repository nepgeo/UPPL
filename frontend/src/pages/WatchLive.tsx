import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Film, X, Youtube, ExternalLink, Clock, Tv } from 'lucide-react';
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
  youtube: { label: 'YouTube', color: 'bg-red-600', icon: Youtube },
  vimeo: { label: 'Vimeo', color: 'bg-blue-600', icon: Film },
  facebook: { label: 'Facebook', color: 'bg-blue-800', icon: Film },
  direct: { label: 'Video', color: 'bg-green-600', icon: Tv },
  unknown: { label: 'Link', color: 'bg-gray-600', icon: ExternalLink },
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-900 via-red-800 to-purple-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-red-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-10 md:py-14 relative">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Button onClick={() => navigate('/live-scores')} variant="ghost" className="text-white/70 hover:text-white mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Live Scores
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <Play className="h-6 w-6 text-red-400" />
              <span className="text-red-400 font-semibold text-sm uppercase tracking-widest">Watch Live</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">Live & Videos</h1>
            <p className="text-gray-300 text-lg max-w-xl">Watch matches live and catch up with highlights and interviews.</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="w-full aspect-video bg-white/5 rounded-xl" />
                <Skeleton className="h-5 w-3/4 bg-white/5 rounded" />
                <Skeleton className="h-4 w-1/2 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Film className="h-10 w-10 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Videos Available</h2>
            <p className="text-gray-400 mb-6">There are no live streams or videos added yet. Check back later.</p>
            <Button onClick={() => navigate('/live-scores')} variant="outline" className="border-gray-700 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Live Scores
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    className="group cursor-pointer bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 overflow-hidden hover:border-red-500/50 hover:shadow-lg hover:shadow-red-600/10 transition-all duration-300"
                  >
                    <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                          <Icon className="h-14 w-14 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg shadow-red-600/30 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                          <Play className="h-8 w-8 text-white ml-1" />
                        </div>
                      </div>
                      <Badge className={`absolute top-3 left-3 ${meta.color} text-white border-0 text-xs font-semibold`}>
                        <Icon className="h-3 w-3 mr-1" /> {meta.label}
                      </Badge>
                      {video.createdAt && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-white/70 bg-black/60 px-2 py-1 rounded-full">
                          <Clock className="h-3 w-3" />
                          {new Date(video.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white truncate group-hover:text-red-400 transition-colors">{video.title}</h3>
                      {video.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{video.description}</p>
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
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-5xl bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700/50"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-gray-800/80 border-b border-gray-700/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg ${(platformMeta[getVideoType(selectedVideo.url)] || platformMeta.unknown).color} flex items-center justify-center flex-shrink-0`}>
                    {(() => {
                      const Icon = (platformMeta[getVideoType(selectedVideo.url)] || platformMeta.unknown).icon;
                      return <Icon className="h-4 w-4 text-white" />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold truncate text-sm">{selectedVideo.title}</h3>
                    <p className="text-gray-400 text-xs">{(platformMeta[getVideoType(selectedVideo.url)] || platformMeta.unknown).label}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedVideo(null)} className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors flex-shrink-0">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Player */}
              <div className="aspect-video bg-black relative">
                {getVideoType(selectedVideo.url) === 'direct' ? (
                  <video src={selectedVideo.url} className="w-full h-full" controls autoPlay playsInline />
                ) : getVideoType(selectedVideo.url) === 'unknown' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-400 p-8">
                    <ExternalLink className="h-12 w-12" />
                    <p className="text-sm text-center">This video type can't be played in the browser.</p>
                    <a href={selectedVideo.url} target="_blank" rel="noopener noreferrer"
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors inline-flex items-center gap-2">
                      Open Video <ExternalLink className="h-4 w-4" />
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
                  className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full hover:bg-black/90 transition-colors z-10 inline-flex items-center gap-1">
                  Open in new tab <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Description */}
              {selectedVideo.description && (
                <div className="px-5 py-4 bg-gray-800/50 border-t border-gray-700/50">
                  <p className="text-sm text-gray-400">{selectedVideo.description}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
