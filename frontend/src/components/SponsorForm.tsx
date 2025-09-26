import React, { useState } from 'react';
import axios from 'axios';
import api from "@/lib/api";


interface SponsorFormProps {
  type: 'organization' | 'individual';
  initialData?: any;
  onSuccess: () => void;
}

const SponsorForm: React.FC<SponsorFormProps> = ({ type, initialData, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    bio: initialData?.bio || '',
    donation: initialData?.donationAmount || 0,
    title: initialData?.title || '',
    isActive: initialData?.isActive ?? true,
    image: null as File | null,
  });

  const isEditing = Boolean(initialData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'donation' ? Number(value) : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFormData(prev => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = new FormData();

    payload.append('name', formData.name);
    payload.append('bio', formData.bio);
    payload.append('donationAmount', String(formData.donation)); // ✅ Corrected key

    if (type === 'individual') {
      payload.append('title', formData.title);
    }

    if (formData.image) {
      payload.append(type === 'organization' ? 'logo' : 'avatar', formData.image);
    }

    const token = localStorage.getItem('pplt20_token');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    };

    const endpoint = `/api/sponsors/${type === 'organization' ? 'organizations' : 'individuals'}`;

    try {
      if (isEditing) {
        await api.put(`${endpoint}/${initialData._id}`, payload, config);
      } else {
        await api.post(endpoint, payload, config);
      }
      onSuccess();
    } catch (err) {
      console.error('Sponsor submission failed', err);
      alert('Submission failed. Check logs and server response.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <input
        type="text"
        name="name"
        placeholder="Name"
        value={formData.name}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded"
      />

      {type === 'individual' && (
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      )}

      <textarea
        name="bio"
        placeholder="Bio"
        value={formData.bio}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <input
        type="number"
        name="donation"
        placeholder="Donation Amount"
        value={formData.donation}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="w-full p-2"
      />

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        {isEditing ? 'Update' : 'Create'}
      </button>
    </form>
  );
};

export default SponsorForm;
