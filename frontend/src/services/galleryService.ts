import api from '@/lib/api';

// Albums
export const fetchAlbums = () => api.get('/gallery/albums');
export const createAlbum = (data) => api.post('/gallery/albums', data);
export const updateAlbum = (id, data) => api.put(`/gallery/albums/${id}`, data);
export const deleteAlbum = (id) => api.delete(`/gallery/albums/${id}`);

// Images
export const fetchImages = () => api.get('/gallery/images');
export const uploadImages = (formData) =>
  api.post('/gallery/images', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
export const deleteImage = (id) => api.delete(`/gallery/images/${id}`);

export const fetchPublicImages = () => api.get('/gallery/images?public=true&limit=6');
