import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [{ level: 'query', emit: 'event' }, 'info', 'warn', 'error']
    : ['error'],
});

if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (prisma as any).$on('query', (e: { query: string; duration: number }) => {
    logger.debug(`Query: ${e.query} | ${e.duration}ms`);
  });
}

export async function connectDB(): Promise<void> {
  await prisma.$connect();
  logger.info('PostgreSQL connected via Prisma');
}

export default prisma;
