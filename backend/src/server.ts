import 'dotenv/config';
import app from './app';
import { logger } from './config/logger';
import { connectDB } from './config/database';
import { startJobs } from './jobs';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  await connectDB();
  startJobs();

  app.listen(PORT, () => {
    logger.info(`AgricSec API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error', err);
  process.exit(1);
});
