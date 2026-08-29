const axios = require('axios');
const News = require('../models/newsModel');

const NEWS_API_BASE = 'https://newsapi.org/v2';

const QUERIES = ['cricket', 'cricket match', 'cricket tournament', 'cricket series'];

function slugify(text) {
  return text
    .toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function truncateContent(text, maxLen = 500) {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

const fetchArticles = async (query) => {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];
  try {
    const response = await axios.get(`${NEWS_API_BASE}/everything`, {
      params: {
        q: query,
        language: 'en',
        pageSize: 10,
        sortBy: 'publishedAt',
        apiKey,
      },
      timeout: 10000,
    });
    return response.data?.articles || [];
  } catch (error) {
    if (error.response?.status === 426) {
      console.error('❌ NewsAPI upgrade required — need a paid plan for this endpoint');
    } else {
      console.error(`❌ NewsAPI fetch error for "${query}":`, error.message);
    }
    return [];
  }
};

const storeArticles = async (articles) => {
  const stored = [];
  for (const article of articles) {
    if (!article.title || article.title === '[Removed]') continue;

    const existing = await News.findOne({
      source: 'external',
      sourceUrl: article.url,
    });
    if (existing) continue;

    const slugBase = slugify(article.title);
    const slug = `${slugBase}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    try {
      const news = await News.create({
        title: article.title,
        slug,
        summary: article.description || '',
        content: truncateContent(article.content || article.description || ''),
        category: 'Cricket',
        tags: ['cricket', 'external'],
        status: 'published',
        images: article.urlToImage ? [{ url: article.urlToImage }] : [],
        source: 'external',
        sourceUrl: article.url,
        externalAuthor: article.author || article.source?.name || '',
      });
      stored.push(news);
    } catch (err) {
      if (err.code === 11000) continue;
      console.error('❌ Error storing article:', err.message);
    }
  }
  return stored;
};

const fetchAndStoreCricketNews = async () => {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ NEWS_API_KEY not set — skipping external news fetch');
    return [];
  }

  console.log('📡 Fetching cricket news from multiple queries...');
  let total = 0;
  const seenUrls = new Set();

  for (const query of QUERIES) {
    const articles = await fetchArticles(query);
    const newArticles = articles.filter(
      a => !seenUrls.has(a.url) && a.title && a.title !== '[Removed]'
    );
    for (const a of newArticles) seenUrls.add(a.url);

    const stored = await storeArticles(newArticles);
    total += stored.length;
    console.log(`  "${query}" → stored ${stored.length} new`);
  }

  if (total) {
    console.log(`✅ Stored ${total} new external cricket articles total`);
  } else {
    console.log('📭 No new external cricket articles found');
  }

  return [];
};

const deleteExpiredExternalNews = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 2);

  const result = await News.deleteMany({
    source: 'external',
    createdAt: { $lt: cutoff },
  });

  if (result.deletedCount > 0) {
    console.log(`🧹 Deleted ${result.deletedCount} external articles older than 2 days`);
  }

  return result.deletedCount;
};

module.exports = { fetchAndStoreCricketNews, deleteExpiredExternalNews };
