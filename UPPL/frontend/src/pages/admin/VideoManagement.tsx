import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Film } from 'lucide-react';
import api from '@/lib/api';

interface Video {
  _id: string;
  title: string;
  description: string;
  url: string;
  embedUrl: string;
  thumbnail: string;
  type: string;
  active: boolean;
  order: number;
  createdAt: string;
}

export default function VideoManagement() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', url: '', embedUrl: '', thumbnail: '',
    type: 'youtube', active: true, order: 0
  });

  const fetchVideos = async () => {
    try {
      const res = await api.get('/videos?all=true');
      setVideos(res.data.videos || []);
    } catch (err) {
      console.error('Failed to fetch videos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVideos(); }, []);

  const resetForm = () => {
    setForm({ title: '', description: '', url: '', embedUrl: '', thumbnail: '', type: 'youtube', active: true, order: 0 });
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.title || !form.url) {
      toast({ title: 'Missing fields', description: 'Title and URL are required', variant: 'destructive' });
      return;
    }
    try {
      if (editing) {
        await api.put(`/videos/${editing._id}`, form);
        toast({ title: 'Video updated' });
      } else {
        await api.post('/videos', form);
        toast({ title: 'Video created' });
      }
      setDialogOpen(false);
      resetForm();
      fetchVideos();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to save', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    try {
      await api.delete(`/videos/${id}`);
      toast({ title: 'Video deleted' });
      fetchVideos();
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const openEdit = (video: Video) => {
    setEditing(video);
    setForm({
      title: video.title, description: video.description, url: video.url,
      embedUrl: video.embedUrl, thumbnail: video.thumbnail,
      type: video.type, active: video.active, order: video.order
    });
    setDialogOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Film className="h-6 w-6 text-blue-600" /> Video Management
          </h2>
          <p className="text-gray-500 text-sm">Add and manage videos for the public page</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" /> Add Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Video' : 'Add New Video'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Video Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="vimeo">Vimeo</SelectItem>
                    <SelectItem value="embed">Embed URL</SelectItem>
                    <SelectItem value="direct">Direct URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Video URL *</Label>
                <Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div>
                <Label>Embed URL (optional)</Label>
                <Input value={form.embedUrl} onChange={e => setForm({ ...form, embedUrl: e.target.value })} />
              </div>
              <div>
                <Label>Thumbnail URL</Label>
                <Input value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Order</Label>
                  <Input type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} />
                  <Label>Active</Label>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full">
                {editing ? 'Update Video' : 'Add Video'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : videos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">No videos added yet.</CardContent>
          </Card>
        ) : (
          videos.map(video => (
            <Card key={video._id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-32 h-20 bg-gray-800 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Film className="h-8 w-8 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{video.title}</h4>
                  <p className="text-sm text-gray-500 truncate">{video.url}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{video.type}</span>
                    {!video.active && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactive</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(video)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(video._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
