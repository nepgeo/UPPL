const cron = require('node-cron');
const { fetchAndStoreCricketNews, deleteExpiredExternalNews } = require('../services/externalNewsService');

const TIMEZONE = 'Asia/Kathmandu';

const startNewsScheduler = () => {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.log('⏸️  News scheduler disabled — set NEWS_API_KEY in .env to enable');
    return;
  }

  console.log('⏰ News scheduler started — 5 top cricket news at 6 AM & 6 PM Nepal time');

  cron.schedule('0 6 * * *', async () => {
    console.log(`[${new Date().toISOString()}] 🌅 Morning news fetch...`);
    try {
      await deleteExpiredExternalNews();
      await fetchAndStoreCricketNews();
    } catch (error) {
      console.error('❌ Morning news fetch error:', error.message);
    }
  }, { timezone: TIMEZONE });

  cron.schedule('0 18 * * *', async () => {
    console.log(`[${new Date().toISOString()}] 🌆 Evening news fetch...`);
    try {
      await deleteExpiredExternalNews();
      await fetchAndStoreCricketNews();
    } catch (error) {
      console.error('❌ Evening news fetch error:', error.message);
    }
  }, { timezone: TIMEZONE });
};

module.exports = { startNewsScheduler };
