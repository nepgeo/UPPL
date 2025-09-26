import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X, Plus } from 'lucide-react';
import api from "@/lib/api";

interface NewsItem {
  _id?: string;
  title: string;
  content: string;
  images?: string[]; // URLs
  publishedAt?: string;
}

const NewsManagement: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<NewsItem | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/news');
      const newsArray = Array.isArray(res.data) ? res.data : res.data.news ?? [];
      setNews(newsArray);
    } catch (err) {
      toast.error('Failed to load news');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);

    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const updatedFiles = [...files];
    const updatedPreviews = [...previewUrls];
    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);
    setFiles(updatedFiles);
    setPreviewUrls(updatedPreviews);
  };
    const handleSubmit = async () => {
    try {
            setLoading(true);
            const form = new FormData();
            form.append('title', formData.title);
            form.append('content', formData.content);
            files.forEach((file) => form.append('images', file));

            // 🔐 Retrieve token (adjust this line as needed)
            const token = localStorage.getItem('pplt20_token'); // or use user.token if you have context

            const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`, // ✅ Include token here
            },
            };

            if (editItem) {
            await api.put(`/api/news/${editItem._id}`, form, config);
            toast.success('News updated');
            } else {
            await api.post('/api/news', form, config);
            toast.success('News created');
            }

            setFormOpen(false);
            setEditItem(null);
            setFormData({ title: '', content: '' });
            setFiles([]);
            setPreviewUrls([]);
            fetchNews();
            } catch (err) {
                toast.error('Error saving news');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };


  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("pplt20_token");
    if (!window.confirm('Are you sure you want to delete this news item?')) return;

    try {
      await api.delete(`/news/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('News deleted');
      fetchNews();
    } catch (err) {
      toast.error('Delete failed');
    }
  };


  const openForm = (item?: NewsItem) => {
    if (item) {
      setEditItem(item);
      setFormData({ title: item.title, content: item.content });
      // You might load existing images here if needed
    } else {
      setEditItem(null);
      setFormData({ title: '', content: '' });
    }
    setFiles([]);
    setPreviewUrls([]);
    setFormOpen(true);
  };

  return (
    <div className="p-6">
      <Toaster />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">News Management</h1>
        <Button onClick={() => openForm()} className="rounded-xl">Add News</Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.length > 0 ? (
            news.map((item) => (
              <motion.div
                key={item._id}
                whileHover={{ scale: 1.02 }}
                className="bg-white shadow-xl rounded-2xl p-4 border border-gray-100 hover:shadow-2xl transition-all"
              >
                <h2 className="font-semibold text-lg mb-1">{item.title}</h2>
                <p className="text-sm text-gray-600 line-clamp-3 mb-2">{item.content}</p>
                <p className="text-xs text-gray-400 mb-3">
                  {item.publishedAt
                    ? new Date(item.publishedAt).toLocaleDateString()
                    : '—'}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {item.images?.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="news"
                      className="h-16 w-16 object-cover rounded"
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-3">
                  <Button size="sm" variant="outline" onClick={() => openForm(item)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item._id!)}>Delete</Button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-10">
              No news articles found.
            </div>
          )}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit News' : 'Add News'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Textarea
              placeholder="Content"
              rows={5}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
            <div>
              <label className="text-sm font-medium">Images</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      className="h-20 w-20 object-cover rounded border"
                      alt="preview"
                    />
                    <button
                      className="absolute top-[-8px] right-[-8px] bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                      onClick={() => removeImage(index)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <label className="flex items-center justify-center h-20 w-20 bg-gray-100 rounded border cursor-pointer hover:bg-gray-200">
                  <Plus className="text-gray-500" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              {editItem ? 'Update News' : 'Create News'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsManagement;
