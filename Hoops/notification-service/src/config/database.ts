import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

prisma.$connect()
  .then(() => logger.info('Database connected'))
  .catch((err: Error) => logger.error('Database connection failed:', err));

export { prisma };