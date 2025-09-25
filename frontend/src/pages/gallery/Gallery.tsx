import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Calendar, Grid3X3, List, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom'; 
import api from '@/lib/api';
import { BASE_URL } from '@/config';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'timeline', 'masonry'

  useEffect(() => {
    api.get('/gallery/images')
      .then(res => setImages(res.data))
      .catch(err => console.error('Failed to fetch gallery images:', err));
  }, []);

  const categories = ['all', 'Match Highlights', 'Behind the Scenes', 'Fan Zone', 'Events', 'Venues'];

  const filteredItems = images.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.album?.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Match Highlights': 'bg-blue-100 text-blue-800',
      'Behind the Scenes': 'bg-green-100 text-green-800',
      'Fan Zone': 'bg-purple-100 text-purple-800',
      'Events': 'bg-orange-100 text-orange-800',
      'Venues': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const renderGridView = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredItems.map((item) => (
        <Card key={item._id} className="group hover:shadow-lg transition-shadow cursor-pointer">
          <div className="aspect-square bg-gray-200 overflow-hidden">
            <Link to={`/gallery/view/${item._id}`}>
              <img 
                src={`${BASE_URL}/${item.url}`} 
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </Link>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge className={`text-xs ${getCategoryColor(item.album?.category || 'Other')}`}>
                {item.album?.category || 'Gallery'}
              </Badge>
              <span className="text-xs text-gray-500">{new Date(item.uploadDate).toLocaleDateString()}</span>
            </div>
            <h3 className="font-semibold text-sm mb-2 group-hover:text-blue-600 transition-colors">
              {item.title}
            </h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {item.tags?.slice(0, 3).map((tag: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500">📸 {item.album?.name || 'Photographer'}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderTimelineView = () => (
    <div className="space-y-8">
      {filteredItems.map((item, index) => (
        <div key={item._id} className={`flex ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} items-center space-x-6`}>
          <div className="flex-1">
            <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
              <div className="aspect-video bg-gray-200 overflow-hidden">
                <img 
                  src={`${BASE_URL}/${item.url}`} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </Card>
          </div>
          <div className="w-4">
            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            {index < filteredItems.length - 1 && (
              <div className="w-0.5 h-20 bg-blue-200 mx-auto mt-2"></div>
            )}
          </div>
          <div className="flex-1">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getCategoryColor(item.album?.category || '')}>
                    {item.album?.category || 'Gallery'}
                  </Badge>
                  <span className="text-sm text-gray-500">{new Date(item.uploadDate).toLocaleDateString()}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.tags?.map((tag: string, tagIndex: number) => (
                    <Badge key={tagIndex} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500">📸 {item.album?.name || 'Photographer'}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMasonryView = () => (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
      {filteredItems.map((item) => (
        <Card key={item._id} className="group hover:shadow-lg transition-shadow cursor-pointer break-inside-avoid">
          <div className="aspect-square bg-gray-200 overflow-hidden">
            <img 
              src={`${BASE_URL}/${item.url}`} 
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge className={`text-xs ${getCategoryColor(item.album?.category || 'Other')}`}>
                {item.album?.category || 'Gallery'}
              </Badge>
              <span className="text-xs text-gray-500">{new Date(item.uploadDate).toLocaleDateString()}</span>
            </div>
            <h3 className="font-semibold text-sm mb-2 group-hover:text-blue-600 transition-colors">
              {item.title}
            </h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {item.tags?.slice(0, 2).map((tag: string, tagIndex: number) => (
                <Badge key={tagIndex} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500">📸 {item.album?.name || 'Photographer'}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">UPPL T20 Gallery</h1>
          <p className="text-xl opacity-90">
            Capturing the moments that make UPPL T20 unforgettable
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search gallery..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Buttons */}
            <div className="flex items-center space-x-1 bg-white rounded-lg p-1 border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'masonry' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('masonry')}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Gallery Content */}
        <div>
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'timeline' && renderTimelineView()}
          {viewMode === 'masonry' && renderMasonryView()}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No images found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
