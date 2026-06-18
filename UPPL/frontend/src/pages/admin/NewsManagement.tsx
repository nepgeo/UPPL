import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Popover, PopoverTrigger, PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Loader2, Plus, Pencil, Trash2, Search, Eye, Copy,
  ChevronUp, ChevronDown, CalendarIcon, GripVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import NewsEditor from '@/components/admin/NewsEditor';

const CATEGORIES = [
  'General', 'Match Report', 'Transfer News', 'Analysis',
  'Player Focus', 'Technology', 'Fan Zone', 'International',
];

interface NewsImage {
  url: string;
  public_id?: string;
  id?: string;
}

interface NewsItem {
  _id?: string;
  title: string;
  slug?: string;
  summary?: string;
  metaDescription?: string;
  content: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  status?: string;
  publishAt?: string;
  views?: number;
  images?: NewsImage[];
  createdAt?: string;
  author?: { name?: string; avatar?: any };
  formattedDate?: string;
}

interface NewsForm {
  title: string;
  slug: string;
  summary: string;
  metaDescription: string;
  content: string;
  category: string;
  tags: string;
  featured: boolean;
  status: string;
  publishAt: Date | undefined;
}

const slugify = (text: string) =>
  text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');

const readingTime = (content: string) =>
  Math.max(1, Math.ceil(content.replace(/<[^>]+>/g, '').split(/\s+/).length / 200));

// Sortable image item
function SortableImage({ image, onRemove, index }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id || index });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div {...attributes} {...listeners} className="absolute top-1 left-1 z-10 bg-black/40 rounded p-0.5 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3.5 h-3.5 text-white" />
      </div>
      <img src={image.url} className="h-20 w-20 object-cover rounded-lg border" alt="" />
      <button type="button" onClick={() => onRemove(index)}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition-opacity">
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

const NewsManagement: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [page, setPage] = useState(1);
  const perPage = 12;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [editItem, setEditItem] = useState<NewsItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle'|'saving'|'saved'>('idle');
  const autoSaveRef = useRef(null);
  const formChangedRef = useRef(false);
  const [duplicateLoading, setDuplicateLoading] = useState<string | null>(null);

  const defaultForm: NewsForm = {
    title: '', slug: '', summary: '', metaDescription: '', content: '',
    category: 'General', tags: '', featured: false, status: 'published', publishAt: undefined,
  };
  const [formData, setFormData] = useState<NewsForm>(defaultForm);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<NewsImage[]>([]);
  const [removedPublicIds, setRemovedPublicIds] = useState<string[]>([]);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchNews = async () => {
    try { setLoading(true); const res = await api.get('/news'); setNews(Array.isArray(res.data) ? res.data : res.data?.news ?? []); }
    catch { toast({ title: 'Failed to load news', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNews(); }, []);

  // Auto-save
  useEffect(() => {
    if (!editItem || !formOpen) return;
    autoSaveRef.current = setInterval(async () => {
      if (!formChangedRef.current) return;
      formChangedRef.current = false;
      setAutoSaveStatus('saving');
      try {
        const fd = new FormData();
        fd.append('title', formData.title);
        fd.append('content', formData.content);
        fd.append('status', 'draft');
        await api.put(`/news/${editItem._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch { setAutoSaveStatus('idle'); }
    }, 30000);
    return () => clearInterval(autoSaveRef.current);
  }, [editItem, formOpen, formData.title, formData.content]);

  // Sorting
  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  // Filter + sort + paginate
  const filtered = useMemo(() => {
    let result = [...news];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(n => n.title.toLowerCase().includes(q) || n.summary?.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') result = result.filter(n => (n.status || 'published') === statusFilter);
    if (categoryFilter !== 'all') result = result.filter(n => (n.category || 'General') === categoryFilter);
    result.sort((a, b) => {
      let va, vb;
      if (sortField === 'title') { va = a.title.toLowerCase(); vb = b.title.toLowerCase(); }
      else if (sortField === 'status') { va = a.status || ''; vb = b.status || ''; }
      else if (sortField === 'views') { va = a.views || 0; vb = b.views || 0; }
      else { va = new Date(a.createdAt || 0).getTime(); vb = new Date(b.createdAt || 0).getTime(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [news, search, statusFilter, categoryFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter]);

  const toggleAll = () => {
    if (selectedIds.length === paginated.length) setSelectedIds([]);
    else setSelectedIds(paginated.map(n => n._id).filter(Boolean));
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openForm = (item?: NewsItem) => {
    setFiles([]); setPreviews([]); setRemovedPublicIds([]); formChangedRef.current = false;
    if (item) {
      setEditItem(item);
      setFormData({
        title: item.title, slug: item.slug || slugify(item.title), summary: item.summary || '',
        metaDescription: item.metaDescription || '', content: item.content,
        category: item.category || 'General', tags: (item.tags || []).join(', '),
        featured: item.featured || false, status: item.status || 'published',
        publishAt: item.publishAt ? new Date(item.publishAt) : undefined,
      });
      setPreviews(item.images?.map(i => ({ url: i.url, public_id: i.public_id, id: i.public_id || i.url })) || []);
    } else {
      setEditItem(null); setFormData(defaultForm);
    }
    setFormOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
    const newPreviews = selected.map((f, i) => ({ url: URL.createObjectURL(f), id: `new-${Date.now()}-${i}` }));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const img = previews[index];
    if (img.public_id) setRemovedPublicIds(prev => [...prev, img.public_id!]);
    const updated = [...previews]; updated.splice(index, 1); setPreviews(updated);
    const upFiles = [...files]; upFiles.splice(index, 1); setFiles(upFiles);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = previews.findIndex(p => (p.id || p.url) === active.id);
      const newIndex = previews.findIndex(p => (p.id || p.url) === over.id);
      setPreviews(arrayMove(previews, oldIndex, newIndex));
      setFiles(arrayMove(files, oldIndex, newIndex));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      return toast({ title: 'Title and content are required', variant: 'destructive' });
    }
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('summary', formData.summary);
      fd.append('metaDescription', formData.metaDescription);
      fd.append('content', formData.content);
      fd.append('category', formData.category);
      fd.append('tags', JSON.stringify(formData.tags.split(',').map(t => t.trim()).filter(Boolean)));
      fd.append('featured', String(formData.featured));
      fd.append('status', formData.status);
      if (formData.publishAt) fd.append('publishAt', formData.publishAt.toISOString());
      files.forEach(f => fd.append('images', f));
      if (removedPublicIds.length) fd.append('removedPublicIds', JSON.stringify(removedPublicIds));

      if (editItem) {
        await api.put(`/news/${editItem._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast({ title: 'News updated' });
      } else {
        await api.post('/news', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast({ title: 'News created' });
      }
      setFormOpen(false); fetchNews();
    } catch { toast({ title: 'Error saving news', variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this news article?')) return;
    try { await api.delete(`/news/${id}`); toast({ title: 'News deleted' }); fetchNews(); }
    catch { toast({ title: 'Delete failed', variant: 'destructive' }); }
  };

  const handleDuplicate = async (item: NewsItem) => {
    setDuplicateLoading(item._id);
    try {
      await api.post('/news', {
        title: `${item.title} (Copy)`,
        summary: item.summary,
        content: item.content,
        category: item.category,
        tags: JSON.stringify(item.tags || []),
        status: 'draft',
      }, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast({ title: 'Article duplicated' });
      fetchNews();
    } catch { toast({ title: 'Duplicate failed', variant: 'destructive' }); }
    finally { setDuplicateLoading(null); }
  };

  const bulkAction = async (action: 'publish' | 'draft' | 'delete') => {
    if (!selectedIds.length) return;
    if (action === 'delete' && !window.confirm(`Delete ${selectedIds.length} articles?`)) return;
    try {
      if (action === 'delete') {
        await api.post('/news/bulk/delete', { ids: selectedIds });
      } else {
        await api.patch('/news/bulk/status', { ids: selectedIds, status: action });
      }
      toast({ title: `Bulk ${action} completed` });
      setSelectedIds([]); fetchNews();
    } catch { toast({ title: 'Bulk action failed', variant: 'destructive' }); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 ml-1 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  const stats = useMemo(() => {
    const total = news.length;
    const published = news.filter(n => n.status === 'published').length;
    const drafts = news.filter(n => n.status === 'draft').length;
    const scheduled = news.filter(n => n.status === 'scheduled').length;
    return { total, published, drafts, scheduled };
  }, [news]);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">News Management</h1>
          <p className="text-blue-100 text-sm mt-1">{stats.total} articles &middot; {stats.published} published, {stats.drafts} drafts, {stats.scheduled} scheduled</p>
        </div>
        <Button onClick={() => openForm()} className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> Add News
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-blue-600' },
          { label: 'Published', value: stats.published, color: 'text-green-600' },
          { label: 'Drafts', value: stats.drafts, color: 'text-yellow-600' },
          { label: 'Scheduled', value: stats.scheduled, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border p-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">{s.label}</span>
            <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search news..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
          </div>
          <div className="flex items-center gap-1 bg-white rounded-lg border p-0.5">
            {['all', 'published', 'draft', 'scheduled'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${statusFilter === s ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
          <span className="text-sm font-medium text-blue-700">{selectedIds.length} selected</span>
          <div className="flex gap-1 ml-2">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => bulkAction('publish')}>Publish</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => bulkAction('draft')}>Draft</Button>
            <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => bulkAction('delete')}>Delete</Button>
          </div>
          <Button size="sm" variant="ghost" className="h-8 text-xs ml-auto" onClick={() => setSelectedIds([])}>Clear</Button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-16 text-gray-500">{search || statusFilter !== 'all' || categoryFilter !== 'all' ? 'No matching news found' : 'No news articles yet.'}</div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80 text-left">
                  <th className="py-3 px-3 w-10">
                    <Checkbox checked={selectedIds.length === paginated.length && paginated.length > 0}
                      onCheckedChange={toggleAll} />
                  </th>
                  <th className="py-3 px-2 w-8 text-gray-400 font-medium text-xs">#</th>
                  <th className="py-3 px-4 font-medium text-gray-600">
                    <button onClick={() => toggleSort('title')} className="flex items-center">Title <SortIcon field="title" /></button>
                  </th>
                  <th className="py-3 px-4 font-medium text-gray-600 hidden lg:table-cell">Category</th>
                  <th className="py-3 px-4 font-medium text-gray-600 hidden xl:table-cell">
                    <button onClick={() => toggleSort('status')} className="flex items-center">Status <SortIcon field="status" /></button>
                  </th>
                  <th className="py-3 px-4 font-medium text-gray-600 hidden xl:table-cell">Reading</th>
                  <th className="py-3 px-4 font-medium text-gray-600 hidden 2xl:table-cell">
                    <button onClick={() => toggleSort('views')} className="flex items-center">Views <SortIcon field="views" /></button>
                  </th>
                  <th className="py-3 px-4 font-medium text-gray-600 hidden md:table-cell">
                    <button onClick={() => toggleSort('createdAt')} className="flex items-center">Date <SortIcon field="createdAt" /></button>
                  </th>
                  <th className="py-3 px-4 font-medium text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item, i) => (
                  <motion.tr key={item._id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`border-b last:border-0 hover:bg-gray-50/60 transition-colors ${selectedIds.includes(item._id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="py-3 px-3">
                      <Checkbox checked={selectedIds.includes(item._id)} onCheckedChange={() => toggleOne(item._id)} />
                    </td>
                    <td className="py-3 px-2 text-gray-400 text-xs">{(page - 1) * perPage + i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {item.images?.[0] ? (
                            <img src={item.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No img</div>
                          )}
                          {item.images && item.images.length > 1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
                              {item.images.length}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">{item.title}</p>
                          {item.slug && <p className="text-[11px] text-gray-400 truncate max-w-[200px]">/{item.slug}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <Badge variant="outline" className="text-xs font-normal">{item.category || 'General'}</Badge>
                    </td>
                    <td className="py-3 px-4 hidden xl:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Badge className={`text-xs ${item.status === 'published' ? 'bg-green-100 text-green-700' : item.status === 'scheduled' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {item.status || 'published'}
                        </Badge>
                        {item.featured && <Badge className="text-xs bg-orange-100 text-orange-700">Featured</Badge>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs hidden xl:table-cell">{readingTime(item.content)} min</td>
                    <td className="py-3 px-4 hidden 2xl:table-cell">
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Eye className="w-3 h-3" /> {item.views || 0}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs hidden md:table-cell">{item.formattedDate || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setPreviewHtml(item.content); setPreviewOpen(true); }}><Eye className="w-3.5 h-3.5 text-gray-500" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleDuplicate(item)} disabled={duplicateLoading === item._id}>
                          {duplicateLoading === item._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openForm(item)}><Pencil className="w-3.5 h-3.5 text-blue-600" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleDelete(item._id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
              <span className="text-xs text-gray-500">{(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronUp className="w-3.5 h-3.5 rotate-90" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" className="h-8 w-8 p-0 text-xs" onClick={() => setPage(p)}>
                    {p}
                  </Button>
                ))}
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronDown className="w-3.5 h-3.5 rotate-90" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>{editItem ? 'Edit News Article' : 'Create News Article'}</DialogTitle>
            {autoSaveStatus !== 'idle' && (
              <span className={`text-xs ${autoSaveStatus === 'saving' ? 'text-yellow-600' : 'text-green-600'}`}>
                {autoSaveStatus === 'saving' ? 'Saving...' : 'Draft saved'}
              </span>
            )}
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <Label>Title *</Label>
                <Input value={formData.title} onChange={e => {
                  setFormData(f => ({ ...f, title: e.target.value }));
                  formChangedRef.current = true;
                  if (!editItem) setFormData(f => ({ ...f, slug: slugify(e.target.value) }));
                }} placeholder="Article title" />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input value={formData.slug} onChange={e => setFormData(f => ({ ...f, slug: slugify(e.target.value) }))} placeholder="article-slug" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={v => { setFormData(f => ({ ...f, category: v })); formChangedRef.current = true; }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => { setFormData(f => ({ ...f, status: v })); formChangedRef.current = true; }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.status === 'scheduled' && (
              <div className="space-y-1.5">
                <Label>Publish Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {formData.publishAt ? format(formData.publishAt, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={formData.publishAt} onSelect={d => { setFormData(f => ({ ...f, publishAt: d })); formChangedRef.current = true; }} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Summary</Label>
              <Textarea value={formData.summary} onChange={e => { setFormData(f => ({ ...f, summary: e.target.value })); formChangedRef.current = true; }} rows={2} placeholder="Short preview text" />
            </div>

            <div className="space-y-1.5">
              <Label>Meta Description</Label>
              <Textarea value={formData.metaDescription} onChange={e => setFormData(f => ({ ...f, metaDescription: e.target.value }))} rows={2} placeholder="SEO meta description" />
            </div>

            <div className="space-y-1.5">
              <Label>Content *</Label>
              <NewsEditor content={formData.content} onChange={html => { setFormData(f => ({ ...f, content: html })); formChangedRef.current = true; }} />
            </div>

            <div className="space-y-1.5">
              <Label>Tags (comma separated)</Label>
              <Input value={formData.tags} onChange={e => setFormData(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. match, t20, final" />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="featured" checked={formData.featured}
                onChange={e => setFormData(f => ({ ...f, featured: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <Label htmlFor="featured" className="cursor-pointer text-sm">Featured article</Label>
            </div>

            <div className="space-y-1.5">
              <Label>Images — drag to reorder</Label>
              <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={previews.map(p => p.id || p.url)} strategy={verticalListSortingStrategy}>
                  <div className="flex gap-2 flex-wrap">
                    {previews.map((img, i) => (
                      <SortableImage key={img.id || i} image={img} index={i} onRemove={removeImage} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              {previews.length === 0 && <p className="text-xs text-gray-400">No images added yet.</p>}
              <label className="inline-flex items-center gap-1.5 mt-2 text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                <Plus className="w-4 h-4" /> Add images
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              {formData.content && (
                <Button variant="outline" onClick={() => { setPreviewHtml(formData.content); setPreviewOpen(true); }}>
                  <Eye className="w-4 h-4 mr-1.5" /> Preview
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editItem ? 'Update' : formData.status === 'scheduled' ? 'Schedule' : 'Publish'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Preview</DialogTitle></DialogHeader>
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsManagement;
