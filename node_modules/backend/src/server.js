require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const seedDemoData = require('./data/seed');

const PORT = process.env.PORT || 5000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectWithRetry = async (retries = 5) => {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await connectDB();
      return;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      console.error(`Mongo connect attempt ${attempt}/${retries} failed: ${error.message}`);

      if (isLastAttempt) {
        throw error;
      }

      await wait(2000 * attempt);
    }
  }
};

const startServer = async () => {
  await connectWithRetry();
  await seedDemoData();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Server startup failed:', error.message);
  process.exit(1);
});
