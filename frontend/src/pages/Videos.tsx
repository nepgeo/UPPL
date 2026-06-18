import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Film, ExternalLink } from 'lucide-react';
import api from '@/lib/api';

interface Video {
  _id: string;
  title: string;
  description: string;
  url: string;
  embedUrl: string;
  thumbnail: string;
  type: string;
  order: number;
  createdAt: string;
}

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(url);
}

function getVideoType(url: string): 'direct' | 'youtube' | 'vimeo' | 'facebook' | 'unknown' {
  if (isDirectVideoUrl(url)) return 'direct';
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') || u.hostname === 'youtu.be') return 'youtube';
    if (u.hostname.includes('vimeo.com')) return 'vimeo';
    if (u.hostname.includes('facebook.com') || u.hostname === 'fb.watch') return 'facebook';
  } catch {}
  return 'unknown';
}

function getEmbedUrl(video: Video): string {
  if (video.embedUrl) return video.embedUrl;
  const url = video.url;
  const type = getVideoType(url);
  if (type === 'youtube') {
    try {
      const u = new URL(url);
      let vid: string | null = null;
      if (u.hostname.includes('youtube.com')) {
        if (u.pathname === '/watch') vid = u.searchParams.get('v');
        else {
          const m = u.pathname.match(/^\/(embed|live|shorts)\/([a-zA-Z0-9_-]{11})/);
          if (m) vid = m[2];
        }
      } else if (u.hostname === 'youtu.be') {
        vid = u.pathname.slice(1).split('/')[0] || null;
      }
      if (vid) return `https://www.youtube-nocookie.com/embed/${vid}`;
    } catch {}
  }
  if (type === 'vimeo') {
    const m = url.match(/vimeo\.com\/(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
  }
  if (type === 'facebook') {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
  }
  return url;
}

export default function Videos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    api.get('/videos')
      .then(res => setVideos(res.data.videos || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = videos.filter(v =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Film className="h-8 w-8 text-blue-600" /> Videos
          </h1>
          <p className="text-gray-600">Match highlights, interviews, and更多内容</p>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search videos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Film className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium">No videos yet</h3>
              <p className="text-gray-500">Check back later for new content.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(video => (
              <Card key={video._id}
                className={`cursor-pointer hover:shadow-lg transition-all overflow-hidden ${selectedVideo?._id === video._id ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setSelectedVideo(video)}
              >
                <div className="aspect-video bg-black relative group">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <Film className="h-12 w-12 text-gray-500" />
                    </div>
                  )}
                  {selectedVideo?._id !== video._id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                        <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-blue-600 ml-1" />
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold truncate">{video.title}</h3>
                  {video.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{video.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Video Player Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedVideo(null)}>
            <div className="w-full max-w-4xl bg-black rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="aspect-video">
                <iframe
                  src={getEmbedUrl(selectedVideo)}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4 bg-white">
                <h2 className="text-lg font-bold">{selectedVideo.title}</h2>
                {selectedVideo.description && (
                  <p className="text-sm text-gray-600 mt-1">{selectedVideo.description}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
