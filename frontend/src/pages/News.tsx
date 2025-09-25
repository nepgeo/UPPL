import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, Calendar, User, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { API_BASE, BASE_URL } from '@/config';
console.log("DEBUG: API_BASE from config =", API_BASE);
console.log("DEBUG: BASE_URL from config =", BASE_URL);



function getProfileImageUrl(path?: string | null) {
  if (!path) return `${BASE_URL}/favicon.png`;
  if (path.startsWith("http")) return path;

  let cleanPath = path
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/uploads\/uploads\//, "/uploads/")
    .replace(/^uploads\//, "/uploads/");

  if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;
  return `${BASE_URL}${cleanPath}`;
}


const News = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newsArticles, setNewsArticles] = useState([]);

  useEffect(() => {
    api
      .get('/news')
      .then((res) => setNewsArticles(res.data))
      .catch((err) => console.error('Failed to fetch news', err));
  }, []);

  const categories = [
    'all',
    'Match Report',
    'Transfer News',
    'Analysis',
    'Player Focus',
    'Technology',
    'Fan Zone',
    'International',
    'Health & Fitness',
  ];

  const filteredArticles = newsArticles.filter((article) => {
    const matchesCategory =
      selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch =
      searchTerm === '' ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const featuredArticles = filteredArticles.filter((article) => article.featured);
  const regularArticles = filteredArticles.filter((article) => !article.featured);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Match Report': 'bg-blue-100 text-blue-800',
      'Transfer News': 'bg-green-100 text-green-800',
      Analysis: 'bg-purple-100 text-purple-800',
      'Player Focus': 'bg-orange-100 text-orange-800',
      Technology: 'bg-gray-100 text-gray-800',
      'Fan Zone': 'bg-pink-100 text-pink-800',
      International: 'bg-yellow-100 text-yellow-800',
      'Health & Fitness': 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Get time ago format
  const getTimeAgo = (dateString: string) => {
  const now = new Date();
  const created = new Date(dateString);
  const diff = Math.floor((now.getTime() - created.getTime()) / 1000); // in seconds

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) === 1 ? '' : 's'} ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) === 1 ? '' : 's'} ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} month${Math.floor(diff / 2592000) === 1 ? '' : 's'} ago`;

  return `${Math.floor(diff / 31536000)} year${Math.floor(diff / 31536000) === 1 ? '' : 's'} ago`;
};


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">UPPL T20 News</h1>
          <p className="text-xl opacity-90">
            Stay updated with the latest news, analysis, and insights from PPLT20
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}
        </div>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Stories</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredArticles.map((article) => (
                <Card
                  key={article._id}
                  className="group hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <Link to={`/news/${article._id}`}>
                    <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                      <img
                        src={article.images?.[0] || '/placeholder.svg'}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={getCategoryColor(article.category)}>
                          {article.category}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-500 space-x-3">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(article.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {getTimeAgo(article.createdAt)}
                          </div>
                        </div>
                      </div>
                      <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 space-x-2">
                        <img
                          src={getProfileImageUrl(article.author?.avatar)}
                          alt={article.author?.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span>{article.author?.name || 'Unknown Author'}</span>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Articles Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest News</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularArticles.map((article) => (
              <Card
                key={article._id}
                className="group hover:shadow-lg transition-shadow cursor-pointer"
              >
                <Link to={`/news/${article._id}`}>
                  <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                    <img
                      src={article.images?.[0] || '/placeholder.svg'}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`text-xs ${getCategoryColor(article.category)}`}>
                        {article.category}
                      </Badge>
                      {/* <span className="text-xs text-gray-500">
                        {article.readTime || '5 min'}
                      </span> */}
                    </div>
                    <h3 className="font-semibold text-sm mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <img
                          src={getProfileImageUrl(article.author?.avatar)}
                          alt={article.author?.name || 'Author'}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span>{article.author?.name || 'Unknown Author'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{getTimeAgo(article.createdAt)}</span>
                      </div>
                    </div>

                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No articles found
            </h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
