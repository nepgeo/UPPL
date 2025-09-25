import axios from 'axios';

// Albums
export const fetchAlbums = () => axios.get('/api/gallery/albums');
export const createAlbum = (data: { name: string; description: string; season: string }) =>
  axios.post('/api/gallery/albums', data);
export const updateAlbum = (id: string, data: { name: string; description: string; season: string }) =>
  axios.put(`/api/gallery/albums/${id}`, data);
export const deleteAlbum = (id: string) => axios.delete(`/api/gallery/albums/${id}`);

// Images
export const fetchImages = () => axios.get('/api/gallery/images');
export const uploadImages = (formData: FormData) =>
  axios.post('/api/gallery/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteImage = (id: string) => axios.delete(`/api/gallery/images/${id}`);


export const fetchPublicImages = () => axios.get('/api/gallery/images?public=true&limit=6');

