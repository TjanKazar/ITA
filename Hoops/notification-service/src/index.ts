import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { rabbitmqClient } from './config/rabbitmq';
import { initializeFirebase } from './config/firebase';
import { handleEvent } from './consumers/eventConsumer';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 8003;

async function start() {
  // Initialize Firebase (optional)
  initializeFirebase();

  // Try to connect to RabbitMQ (optional - don't crash if unavailable)
  try {
    await rabbitmqClient.connect();
    await rabbitmqClient.consume(handleEvent);
    logger.info('RabbitMQ consumer started');
  } catch (error) {
    logger.warn('RabbitMQ not available - running without event consumption');
    logger.warn('Events will not be processed until RabbitMQ is connected');
  }

  // Start HTTP server
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
  });
}

process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  try {
    await rabbitmqClient.disconnect();
  } catch (e) {
    // Ignore
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  try {
    await rabbitmqClient.disconnect();
  } catch (e) {
    // Ignore
  }
  process.exit(0);
});

start().catch((error) => {
  logger.error('Failed to start:', error);
  process.exit(1);
});