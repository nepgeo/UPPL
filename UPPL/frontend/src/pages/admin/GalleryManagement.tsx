import React, { useEffect, useState } from 'react';
import { ImagePlus, FolderPlus, Edit, Trash2, Filter, X, Images, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import * as galleryService from '@/services/galleryService';
import { BASE_URL } from "@/config";

const getImageUrl = (img: any): string => {
  if (!img) return "";
  if (typeof img === "string") {
    if (img.startsWith("data:")) return img;
    if (img.startsWith("http")) return img;
    return `${BASE_URL}/${img.replace(/\\/g, "/")}`;
  }
  if (typeof img === "object") {
    return img.secure_url || img.url || "";
  }
  return "";
};

const GalleryManagement = () => {
  const [albums, setAlbums] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [view, setView] = useState<'albums' | 'images'>('albums');
  const [filterAlbum, setFilterAlbum] = useState('all');
  const [filterSeason, setFilterSeason] = useState('all');
  const [seasons, setSeasons] = useState<number[]>([]);
  const [editingAlbum, setEditingAlbum] = useState<any>(null);
  const [editingImage, setEditingImage] = useState<any>(null);
  const [isAlbumDialogOpen, setIsAlbumDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const loadGalleryData = async () => {
    try {
      const [albumsRes, imagesRes] = await Promise.all([
        galleryService.fetchAlbums(),
        galleryService.fetchImages(),
      ]);
      setAlbums(albumsRes.data);
      setImages(imagesRes.data);
      const uniqueSeasons = Array.from(new Set(albumsRes.data.map((a: any) => a.season))).sort((a: any, b: any) => +b - +a);
      setSeasons(uniqueSeasons);
    } catch (err) {
      console.error('Gallery fetch failed', err);
    }
  };

  useEffect(() => { loadGalleryData() }, []);

  const handleSaveAlbum = async () => {
    if (!editingAlbum?.name || !editingAlbum?.season) {
      toast({ title: "Error", description: "Album name and season are required.", variant: "destructive" }); return;
    }
    try {
      if (editingAlbum._id) {
        await galleryService.updateAlbum(editingAlbum._id, editingAlbum);
        toast({ title: "Success", description: "Album updated successfully." });
      } else {
        await galleryService.createAlbum(editingAlbum);
        toast({ title: "Success", description: "Album created successfully." });
      }
      setIsAlbumDialogOpen(false);
      setEditingAlbum(null);
      loadGalleryData();
    } catch { toast({ title: "Error", description: "Failed to save album.", variant: "destructive" }) }
  };

  const handleSaveImage = async () => {
    if (!editingImage?.title || !editingImage?.albumId) {
      toast({ title: "Error", description: "Image title and album are required.", variant: "destructive" }); return;
    }
    try {
      if (editingImage._id) {
        await galleryService.updateImage(editingImage._id, { title: editingImage.title, albumId: editingImage.albumId, tags: editingImage.tags, isPublic: editingImage.isPublic });
        toast({ title: "Success", description: "Image updated successfully." });
      } else {
        if (!editingImage.files || editingImage.files.length === 0) {
          toast({ title: "Error", description: "Please select at least one file.", variant: "destructive" }); return;
        }
        const formData = new FormData();
        formData.append("title", editingImage.title);
        formData.append("albumId", editingImage.albumId);
        formData.append("tags", editingImage.tags.join(","));
        editingImage.files.forEach((file: File) => formData.append("files", file));
        await galleryService.uploadImages(formData);
        toast({ title: "Success", description: "Image(s) uploaded successfully." });
      }
      setIsImageDialogOpen(false);
      setEditingImage(null);
      loadGalleryData();
    } catch { toast({ title: "Error", description: "Failed to save image.", variant: "destructive" }) }
  };

  const handleDeleteAlbum = async (id: string) => {
    try {
      await galleryService.deleteAlbum(id);
      toast({ title: "Deleted", description: "Album and its images deleted." });
      loadGalleryData();
    } catch { toast({ title: "Error", description: "Failed to delete album.", variant: "destructive" }) }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      await galleryService.deleteImage(id);
      toast({ title: "Deleted", description: "Image deleted successfully." });
      loadGalleryData();
    } catch { toast({ title: "Error", description: "Failed to delete image.", variant: "destructive" }) }
  };

  const togglePublic = async (id: string, val: boolean) => {
    try {
      await galleryService.toggleImagePublic(id, val);
      loadGalleryData();
    } catch { toast({ title: "Error", description: "Failed to update visibility.", variant: "destructive" }) }
  };

  const filteredAlbums = albums.filter(a => filterSeason === 'all' || a.season === filterSeason);
  const filteredImages = images.filter(img =>
    (filterAlbum === 'all' || img.album?._id === filterAlbum) &&
    (filterSeason === 'all' || img.album?.season === filterSeason)
  );

  return (
    <div className="space-y-5">
      {/* Gallery Control Card */}
      <Card className="border-0 shadow-md rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 px-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex bg-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setView('albums')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'albums' ? 'bg-white text-blue-700 shadow-sm' : 'text-white/80 hover:text-white'}`}
                >
                  Albums
                </button>
                <button
                  onClick={() => setView('images')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'images' ? 'bg-white text-blue-700 shadow-sm' : 'text-white/80 hover:text-white'}`}
                >
                  Images
                </button>
              </div>
              <div className="text-white/40 text-sm font-thin">|</div>
              <span className="text-xs text-white/70">
                {view === 'albums' ? `${filteredAlbums.length} albums` : `${filteredImages.length} images`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-white/80 hover:text-white hover:bg-white/10 px-2">
                    <Filter className="w-3.5 h-3.5 mr-1" /> Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Season</Label>
                      <Select value={filterSeason} onValueChange={setFilterSeason}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Seasons</SelectItem>
                          {seasons.map(s => <SelectItem key={s} value={s.toString()}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Album</Label>
                      <Select value={filterAlbum} onValueChange={setFilterAlbum}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Albums</SelectItem>
                          {albums.map(a => <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button size="sm" onClick={() => { setEditingAlbum({ name: '', description: '', season: '' }); setIsAlbumDialogOpen(true) }} className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0">
                <FolderPlus className="w-3.5 h-3.5 mr-1" /> Album
              </Button>
              <Button size="sm" onClick={() => { if (!albums.length) { toast({ title: "No albums", description: "Create an album first." }); return } setEditingImage({ title: '', albumId: albums[0]._id, tags: [], files: [], isPublic: true }); setIsImageDialogOpen(true) }} className="h-7 text-xs bg-white text-blue-700 hover:bg-gray-100">
                <ImagePlus className="w-3.5 h-3.5 mr-1" /> Upload
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {/* Albums Grid */}
          {view === 'albums' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAlbums.length === 0 ? (
                <div className="col-span-full text-center py-12 text-sm text-gray-400">No albums found.</div>
              ) : (
                filteredAlbums.map((album) => {
                  const thumb = images.find(img => img.album?._id === album._id);
                  return (
                    <div key={album._id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                      <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                        {thumb ? (
                          <img src={getImageUrl(thumb.image || thumb.url)} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Images className="w-10 h-10 text-gray-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setEditingAlbum(album); setIsAlbumDialogOpen(true) }} className="w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-gray-700 shadow-sm">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album._id) }} className="w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-red-500 shadow-sm">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 text-sm truncate">{album.name}</h3>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-gray-400">Season {album.season}</span>
                          {album.description && <span className="text-[10px] text-gray-400 truncate ml-2">{album.description}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Images Grid */}
          {view === 'images' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredImages.length === 0 ? (
                <div className="col-span-full text-center py-12 text-sm text-gray-400">No images found.</div>
              ) : (
                filteredImages.map((img, idx) => (
                  <div key={img._id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200">
                    <div className="relative overflow-hidden cursor-pointer" onClick={() => setLightboxIndex(idx)}>
                      <img
                        src={getImageUrl(img.image || img.url)}
                        alt={img.title}
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${img.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                          {img.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <h3 className="font-medium text-gray-800 text-sm truncate">{img.title}</h3>
                      <p className="text-[10px] text-gray-400 truncate">{img.album?.name} {img.tags?.length ? `· ${img.tags.join(', ')}` : ''}</p>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <span>Public</span>
                          <Switch
                            checked={img.isPublic}
                            onCheckedChange={(val) => togglePublic(img._id, val)}
                            className="scale-75 origin-left"
                          />
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingImage(img); setIsImageDialogOpen(true) }} className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteImage(img._id)} className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Album Dialog */}
      <Dialog open={isAlbumDialogOpen} onOpenChange={(open) => { if (!open) { setIsAlbumDialogOpen(false); setEditingAlbum(null) } }}>
        <DialogContent className="max-w-md bg-white rounded-xl shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-4">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                <FolderPlus className="w-4 h-4" /> {editingAlbum?._id ? 'Edit Album' : 'Create Album'}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <Label className="text-xs">Album Name</Label>
              <Input value={editingAlbum?.name || ''} onChange={(e) => setEditingAlbum({ ...editingAlbum, name: e.target.value })} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={editingAlbum?.description || ''} onChange={(e) => setEditingAlbum({ ...editingAlbum, description: e.target.value })} className="text-sm resize-none h-20" />
            </div>
            <div>
              <Label className="text-xs">Season (Year)</Label>
              <Input type="number" min="2020" max="2099" placeholder="e.g. 2025" value={editingAlbum?.season || ''} onChange={(e) => setEditingAlbum({ ...editingAlbum, season: e.target.value })} className="h-9 text-sm" />
            </div>
            <Button onClick={handleSaveAlbum} className="w-full h-9 text-sm">
              {editingAlbum?._id ? 'Update Album' : 'Create Album'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={(open) => { if (!open) { setIsImageDialogOpen(false); setEditingImage(null) } }}>
        <DialogContent className="max-w-md bg-white rounded-xl shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-4">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                <ImagePlus className="w-4 h-4" /> {editingImage?._id ? 'Edit Image' : 'Upload Image'}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={editingImage?.title || ''} onChange={(e) => setEditingImage({ ...editingImage, title: e.target.value })} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Album</Label>
              <Select value={editingImage?.albumId} onValueChange={(val) => setEditingImage({ ...editingImage, albumId: val })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select album" /></SelectTrigger>
                <SelectContent>
                  {albums.map(album => <SelectItem key={album._id} value={album._id}>{album.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tags (comma separated)</Label>
              <Input value={editingImage?.tags?.join(', ') || ''} onChange={(e) => setEditingImage({ ...editingImage, tags: e.target.value.split(',').map(t => t.trim()) })} className="h-9 text-sm" />
            </div>
            {!editingImage?._id && (
              <div>
                <Label className="text-xs">Images</Label>
                <Input type="file" multiple accept="image/*" onChange={(e) => setEditingImage({ ...editingImage, files: Array.from(e.target.files || []) })} className="h-9 text-sm" />
              </div>
            )}
            <Button onClick={handleSaveImage} className="w-full h-9 text-sm">
              {editingImage?._id ? 'Update' : 'Upload'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxIndex !== null && filteredImages[lightboxIndex] && (
        <div className="fixed inset-0 z-[1000]" onClick={() => setLightboxIndex(null)}>
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
          <div className="relative h-full flex flex-col items-center justify-center p-4" onClick={e => e.stopPropagation()}>
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 bg-gradient-to-b from-black/50 to-transparent">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {lightboxIndex + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{filteredImages[lightboxIndex]?.title}</p>
                  <p className="text-[11px] text-white/60">
                    {filteredImages[lightboxIndex]?.album?.name} &middot; {lightboxIndex + 1} of {filteredImages.length}
                  </p>
                </div>
              </div>
              <button onClick={() => setLightboxIndex(null)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image */}
            <div className="relative flex items-center justify-center flex-1 w-full max-w-5xl">
              {lightboxIndex > 0 && (
                <button
                  onClick={() => setLightboxIndex(i => i! - 1)}
                  className="absolute left-2 md:-left-4 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white backdrop-blur-sm transition-all hover:scale-110 shadow-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <img
                src={getImageUrl(filteredImages[lightboxIndex]?.image || filteredImages[lightboxIndex]?.url)}
                alt={filteredImages[lightboxIndex]?.title || ''}
                className="max-h-[75vh] max-w-full w-auto rounded-lg shadow-2xl object-contain select-none"
                draggable={false}
              />
              {lightboxIndex < filteredImages.length - 1 && (
                <button
                  onClick={() => setLightboxIndex(i => i! + 1)}
                  className="absolute right-2 md:-right-4 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white backdrop-blur-sm transition-all hover:scale-110 shadow-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Bottom thumbnails */}
            <div className="w-full max-w-2xl mt-4 overflow-x-auto">
              <div className="flex items-center gap-2 justify-center pb-1">
                {filteredImages.map((img, i) => (
                  <button
                    key={img._id}
                    onClick={() => setLightboxIndex(i)}
                    className={`w-12 h-10 rounded-md overflow-hidden shrink-0 border-2 transition-all ${i === lightboxIndex ? 'border-white opacity-100 scale-110' : 'border-transparent opacity-50 hover:opacity-80'}`}
                  >
                    <img src={getImageUrl(img.image || img.url)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryManagement;