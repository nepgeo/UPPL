import React, { useEffect, useState } from 'react';
import {
  ImagePlus, FolderPlus, Edit, Trash2, Filter
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import * as galleryService from '@/services/galleryService';
import { BASE_URL } from "@/config";


// 🧩 Image Normalizer Function
const getImageUrl = (img: any): string => {
  if (!img) return "";

  // Case 1: String path
  if (typeof img === "string") {
    if (img.startsWith("data:")) return img;       // base64 preview
    if (img.startsWith("http")) return img;        // full URL (e.g., Cloudinary)
    return `${BASE_URL}/${img.replace(/\\/g, "/")}`; // relative local path
  }

  // Case 2: Object (Cloudinary format)
  if (typeof img === "object") {
    return img.secure_url || img.url || "";
  }

  return "";
};


const GalleryManagement = () => {
  const [albums, setAlbums] = useState([]);
  const [images, setImages] = useState([]);
  const [view, setView] = useState<'albums' | 'images'>('albums');
  const [filterAlbum, setFilterAlbum] = useState('all');
  const [filterSeason, setFilterSeason] = useState('all');
  const [seasons, setSeasons] = useState<number[]>([]);
  const [editingAlbum, setEditingAlbum] = useState<any>(null);
  const [editingImage, setEditingImage] = useState<any>(null);
  const [isAlbumDialogOpen, setIsAlbumDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  const loadGalleryData = async () => {
    try {
      const [albumsRes, imagesRes] = await Promise.all([
        galleryService.fetchAlbums(),
        galleryService.fetchImages(),
      ]);
      setAlbums(albumsRes.data);
      setImages(imagesRes.data);

      const uniqueSeasons = Array.from(new Set(albumsRes.data.map(a => a.season)))
        .sort((a, b) => +b - +a);
      setSeasons(uniqueSeasons);
    } catch (err) {
      console.error('Gallery fetch failed', err);
    }
  };

  useEffect(() => {
    loadGalleryData();
  }, []);

  // Save or create an album
const handleSaveAlbum = async () => {
  if (!editingAlbum?.name || !editingAlbum?.season) {
    toast({ title: "Error", description: "Album name and season are required.", variant: "destructive" });
    return;
  }

  try {
    if (editingAlbum._id) {
      // Update existing album
      await galleryService.updateAlbum(editingAlbum._id, editingAlbum);
      toast({ title: "Success", description: "Album updated successfully." });
    } else {
      // Create new album
      await galleryService.createAlbum(editingAlbum);
      toast({ title: "Success", description: "Album created successfully." });
    }
    setIsAlbumDialogOpen(false);
    setEditingAlbum(null);
    loadGalleryData();
  } catch (err) {
    console.error("❌ Save album failed", err);
    toast({ title: "Error", description: "Failed to save album.", variant: "destructive" });
  }
};

// Save or upload image
const handleSaveImage = async () => {
  if (!editingImage?.title || !editingImage?.albumId) {
    toast({ title: "Error", description: "Image title and album are required.", variant: "destructive" });
    return;
  }

  try {
    if (editingImage._id) {
      // Update existing image metadata
      await galleryService.updateImage(editingImage._id, {
        title: editingImage.title,
        albumId: editingImage.albumId,
        tags: editingImage.tags,
        isPublic: editingImage.isPublic,
      });
      toast({ title: "Success", description: "Image updated successfully." });
    } else {
      // Upload new images
      if (!editingImage.files || editingImage.files.length === 0) {
        toast({ title: "Error", description: "Please select at least one file.", variant: "destructive" });
        return;
      }

      const formData = new FormData();
      formData.append("title", editingImage.title);
      formData.append("albumId", editingImage.albumId);
      formData.append("tags", editingImage.tags.join(","));
      editingImage.files.forEach(file => formData.append("files", file));

      await galleryService.uploadImages(formData);
      toast({ title: "Success", description: "Image(s) uploaded successfully." });
    }

    setIsImageDialogOpen(false);
    setEditingImage(null);
    loadGalleryData();
  } catch (err) {
    console.error("❌ Save image failed", err);
    toast({ title: "Error", description: "Failed to save image.", variant: "destructive" });
  }
};

// Delete album (with confirmation)
const handleDeleteAlbum = async (id: string) => {
  if (!confirm("Are you sure you want to delete this album and all its images?")) return;

  try {
    await galleryService.deleteAlbum(id);
    toast({ title: "Deleted", description: "Album and its images deleted successfully." });
    loadGalleryData();
  } catch (err) {
    console.error("❌ Delete album failed", err);
    toast({ title: "Error", description: "Failed to delete album.", variant: "destructive" });
  }
};

// Delete single image (with confirmation)
const handleDeleteImage = async (id: string) => {
  if (!confirm("Are you sure you want to delete this image?")) return;

  try {
    await galleryService.deleteImage(id);
    toast({ title: "Deleted", description: "Image deleted successfully." });
    loadGalleryData();
  } catch (err) {
    console.error("❌ Delete image failed", err);
    toast({ title: "Error", description: "Failed to delete image.", variant: "destructive" });
  }
};


  const filteredAlbums = albums.filter(
    (a) => filterSeason === 'all' || a.season === filterSeason
  );

  const filteredImages = images.filter(
    (img) =>
      (filterAlbum === 'all' || img.album?._id === filterAlbum) &&
      (filterSeason === 'all' || img.album?.season === filterSeason)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header & Filters */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            onClick={() => setView('albums')}
            variant={view === 'albums' ? 'default' : 'outline'}
          >
            Albums
          </Button>
          <Button
            onClick={() => setView('images')}
            variant={view === 'images' ? 'default' : 'outline'}
          >
            Images
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" /> Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <div>
                  <Label>Season</Label>
                  <Select value={filterSeason} onValueChange={setFilterSeason}>
                    <SelectTrigger>
                      <SelectValue placeholder="All seasons" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {seasons.map((s) => (
                        <SelectItem key={s} value={s.toString()}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Album</Label>
                  <Select value={filterAlbum} onValueChange={setFilterAlbum}>
                    <SelectTrigger>
                      <SelectValue placeholder="All albums" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {albums.map((a) => (
                        <SelectItem key={a._id} value={a._id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Create Album Button */}
          <Button
            onClick={() => {
              setEditingAlbum({ name: '', description: '', season: '' });
              setIsAlbumDialogOpen(true);
            }}
          >
            <FolderPlus className="mr-2 h-4 w-4" /> Create Album
          </Button>

          {/* Upload Image Button */}
          <Button
            onClick={() => {
              if (!albums.length) {
                toast({
                  title: "No albums found",
                  description: "Please create an album first before uploading images.",
                });
                return;
              }
              setEditingImage({
                title: '',
                albumId: albums[0]._id,
                tags: [],
                files: [],
                isPublic: true,
              });
              setIsImageDialogOpen(true);
            }}
          >
            <ImagePlus className="mr-2 h-4 w-4" /> Upload Image
          </Button>
        </div>
      </div>

      {/* Albums */}
      {view === 'albums' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Albums</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAlbums.map((album) => {
              const thumb = images.find((img) => img.album?._id === album._id);
              return (
                <Card key={album._id} className="hover:shadow-md">
                  {thumb && (
                    <img
                      src={getImageUrl(thumb.image || thumb.url)}
                      alt={album.name}
                      className="h-40 w-full object-cover rounded-t"
                    />
                  )}
                  <CardHeader>
                    <CardTitle>{album.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Season: {album.season}
                    </p>
                    <div className="mt-2 flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setEditingAlbum(album)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDeleteAlbum(album._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Images */}
      {view === 'images' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Images</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredImages.map((img) => (
              <Card key={img._id} className="hover:shadow-md">
                <CardHeader>
                  <CardTitle>{img.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={getImageUrl(img.image || img.url)}
                    alt={img.title}
                    className="rounded w-full h-48 object-cover"
                  />
                  <div className="text-xs mt-2 text-muted-foreground">
                    Album: {img.album?.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tags: {img.tags?.join(', ')}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm">Public:</span>
                    <Switch
                      checked={img.isPublic}
                      onCheckedChange={(val) =>
                        galleryService
                          .toggleImagePublic(img._id, val)
                          .then(() => loadGalleryData())
                      }
                    />
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setEditingImage(img)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDeleteImage(img._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Album Dialog */}
      <Dialog open={isAlbumDialogOpen} onOpenChange={setIsAlbumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAlbum?._id ? 'Edit Album' : 'Create Album'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Album Name</Label>
            <Input
              value={editingAlbum?.name || ''}
              onChange={(e) =>
                setEditingAlbum({ ...editingAlbum, name: e.target.value })
              }
            />
            <Label>Description</Label>
            <Textarea
              value={editingAlbum?.description || ''}
              onChange={(e) =>
                setEditingAlbum({ ...editingAlbum, description: e.target.value })
              }
            />
            <Label>Season</Label>
            <Input
              type="number"
              min="2020"
              max="2099"
              placeholder="Enter year"
              value={editingAlbum?.season || ''}
              onChange={(e) =>
                setEditingAlbum({ ...editingAlbum, season: e.target.value })
              }
            />
            <Button onClick={handleSaveAlbum} className="w-full">
              {editingAlbum?._id ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingImage?._id ? 'Edit Image' : 'Upload Image'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Title</Label>
            <Input
              value={editingImage?.title || ''}
              onChange={(e) =>
                setEditingImage({ ...editingImage, title: e.target.value })
              }
            />
            <Label>Album</Label>
            <Select
              value={editingImage?.albumId}
              onValueChange={(val) =>
                setEditingImage({ ...editingImage, albumId: val })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select album" />
              </SelectTrigger>
              <SelectContent>
                {albums.map((album) => (
                  <SelectItem key={album._id} value={album._id}>
                    {album.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>Tags (comma separated)</Label>
            <Input
              value={editingImage?.tags?.join(', ') || ''}
              onChange={(e) =>
                setEditingImage({
                  ...editingImage,
                  tags: e.target.value.split(',').map((t) => t.trim()),
                })
              }
            />
            <Label>Images</Label>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) =>
                setEditingImage({
                  ...editingImage,
                  files: Array.from(e.target.files || []),
                })
              }
            />
            <Button onClick={handleSaveImage} className="w-full">
              {editingImage?._id ? 'Update' : 'Upload'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryManagement;
