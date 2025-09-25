// src/components/WeeklyTopNews.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export interface Article {
  _id: string;
  title?: string;
  images?: string[];
  excerpt?: string;
  createdAt?: string | Date;
  category?: string;
  author?: { avatar?: string };
  readTime?: string;
}

const formatDate = (d?: string | Date) =>
  d ? new Date(d).toLocaleDateString() : "";

export default function WeeklyTopNews() {
  const [featuredNews, setFeaturedNews] = useState<Article[]>([]);
  const [carouselItems, setCarouselItems] = useState<Article[]>([]);

  const placeholder: Article = {
    _id: "placeholder",
    title: "More news coming soon",
    images: ["/placeholder.svg"],
    excerpt: "",
    createdAt: new Date().toISOString(),
  };

  // Fetch & setup news on mount
  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then((data: Article[]) => {
        if (!data || data.length < 5) return;

        // Shuffle
        const shuffled = [...data].sort(() => Math.random() - 0.5);

        // Featured (first 4, newest first)
        const sortedByDate = [...data].sort(
          (a, b) =>
            new Date(b.createdAt!).getTime() -
            new Date(a.createdAt!).getTime()
        );
        setFeaturedNews(sortedByDate.slice(0, 4));

        // Weekly top news carousel
        setCarouselItems(shuffled);
      })
      .catch((err) => console.error("Error fetching news:", err));
  }, []);

  // Auto-slide carousel every 5s
  useEffect(() => {
    if (carouselItems.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselItems((prev) => {
        const first = prev[0];
        const rest = prev.slice(1);
        return [...rest, first];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  // Featured placeholders
  const items =
    featuredNews.length > 0
      ? [
          ...featuredNews,
          ...Array(Math.max(0, 4 - featuredNews.length)).fill(placeholder),
        ]
      : Array(4).fill(placeholder);

  const bigFeatured = items[0];
  const rightList = items.slice(1, 4);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Latest News Heading */}
        <div className="mb-3 text-center">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Latest News</h2>
          <p className="text-xl font-semibold mb-3 text-center text-muted-foreground">
            Stay informed with the latest headlines and updates.
          </p>
        </div>

        {/* Featured Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {/* Big Featured */}
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden shadow-md">
            <Link
              to={
                bigFeatured._id === "placeholder"
                  ? "#"
                  : `/news/${bigFeatured._id}`
              }
              className="block"
            >
              <div className="w-full h-[28rem] bg-gray-200">
                <img
                  src={bigFeatured.images?.[0] || "/placeholder.svg"}
                  alt={bigFeatured.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="absolute top-4 left-4 bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-semibold shadow">
                Featured Post
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  {bigFeatured.title || "Untitled"}
                </h2>
                <p className="text-white/90 text-sm max-w-xl line-clamp-3">
                  {bigFeatured.excerpt || ""}
                </p>
              </div>
            </Link>
          </div>

          {/* Right Side List */}
          <div className="flex flex-col gap-4">
            {rightList.map((article, i) => (
              <Link
                key={article._id + i}
                to={
                  article._id === "placeholder"
                    ? "#"
                    : `/news/${article._id}`
                }
                className="flex gap-4 border-b pb-4 hover:bg-gray-50 p-2 rounded-lg transition"
              >
                <img
                  src={article.images?.[0] || "/placeholder.svg"}
                  alt={article.title}
                  className="w-24 h-20 object-cover rounded-md"
                />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">
                    {formatDate(article.createdAt)} ·{" "}
                    {article.readTime || "5 min"} Read
                  </span>
                  <h3 className="font-semibold text-gray-900 line-clamp-2">
                    {article.title || "Untitled"}
                  </h3>
                </div>
              </Link>
            ))}
            <Link
              to="/news"
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center transition"
            >
              View All 
            </Link>
          </div>
        </div>

        {/* Section Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Weekly Top News</h2>
          <p className="text-gray-600 text-bold max-w-2xl mx-auto">
            Stay updated with our Weekly Top News, bringing you the latest
            trends, insights, and developments from around the world.
          </p>
        </div>

        {/* Horizontal Carousel */}
        <div className="overflow-hidden">
        <div className="flex gap-6 transition-transform duration-700 ease-in-out">
            {carouselItems.slice(0, 3).map((article, idx) => (
            <Link
                key={article._id + idx}
                to={
                article._id === "placeholder"
                    ? "#"
                    : `/news/${article._id}`
                }
                className="min-w-[320px] bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition"
            >
                <img
                src={article.images?.[0] || "/placeholder.svg"}
                alt={article.title}
                className="w-full h-72 object-cover" // taller image
                />
                <div className="p-5">
                <span className="text-xs text-gray-500 block mb-2">
                    {formatDate(article.createdAt)} · {article.readTime || "5 min"} Read
                </span>
                <h3 className="font-semibold text-gray-900 line-clamp-2 text-lg">
                    {article.title || "Untitled"}
                </h3>
                </div>
            </Link>
            ))}
        </div>
        </div>


      </div>
    </section>
  );
}
