import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock, Share2, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import api from '@/lib/api';
import { BASE_URL } from "@/config";

const NewsArticle = () => {
  const { articleId } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
  const handleEsc = (e) => {
    if (e.key === "Escape") setZoomedImage(null);
  };
  window.addEventListener("keydown", handleEsc);
  return () => window.removeEventListener("keydown", handleEsc);
}, []);



  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await api.get(`/news/${articleId}`);
        setArticle(res.data);
      } catch (err) {
        console.error('Failed to fetch article:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  if (loading) {
    return <div className="text-center py-16">Loading...</div>;
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <Link to="/news">
            <Button>Back to News</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getCategoryColor = (category) => {
    const colors = {
      'Match Report': 'bg-blue-100 text-blue-800',
      'Transfer News': 'bg-green-100 text-green-800',
      'Analysis': 'bg-purple-100 text-purple-800',
      'Player Focus': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/news" className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to News
          </Link>
        </div>
      </div>

      {/* Article */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <article>
          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Badge className={getCategoryColor(article.category)}>
                {article.category}
              </Badge>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(article.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {article.readTime || '5 min read'}
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {article.author?.name || 'Unknown'}
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {article.title}
            </h1>

            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {article.excerpt}
            </p>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Published on {new Date(article.createdAt).toLocaleDateString()} at {new Date(article.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share Article
              </Button>
            </div>
          </div>

          {/* Featured Image */}
          {/* Image Carousel */}
          {/* Image Carousel with Zoom on Click */}
<div className="mb-8 relative">
  {article.images && article.images.length > 0 ? (
    <>
      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={10}
        slidesPerView={1}
        className="rounded-lg overflow-hidden"
      >
        {article.images.map((img, index) => (
          <SwiperSlide key={index}>
            <img
              src={typeof img === "string" ? img : img.url}
              alt={`Slide ${index + 1}`}
              className="w-full h-96 object-cover cursor-zoom-in"
              onClick={() => setZoomedImage(typeof img === "string" ? img : img.url)}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setZoomedImage(null)}
        >
          <button
            className="absolute top-5 right-5 text-white text-3xl font-bold z-50"
            onClick={() => setZoomedImage(null)}
          >
            ✕
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="w-auto h-auto max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-lg"
            style={{ objectPosition: "center" }}
            onClick={(e) => e.stopPropagation()}
          />

        </div>
      )}
    </>
  ) : (
    <img
      src="/placeholder.svg"
      alt="No image"
      className="w-full h-96 object-cover rounded-lg"
    />
  )}
</div>



          {/* Article Content */}
          <Card>
            <CardContent className="p-8">
              <div
                className="prose prose-lg max-w-none text-justify"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Author Info */}
          {article.author && (
            <Card className="mt-8">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <img
                    src={article.author?.avatar?.url || article.author?.avatar || '/default-avatar.png'}
                    alt={article.author.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{article.author.name}</h3>
                    <p className="text-gray-600">{article.author.role || 'Sports Journalist'}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {article.author.bio || 'Covering PPLT20 since 2020, specializing in match analysis and player insights.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </article>
      </div>
    </div>
  );
};

export default NewsArticle;
