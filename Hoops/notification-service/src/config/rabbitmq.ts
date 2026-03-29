import amqp from 'amqplib';
import { logger } from '../utils/logger';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE_NAME = process.env.EXCHANGE_NAME || 'hoops.events';
const QUEUE_NAME = process.env.QUEUE_NAME || 'notification.events';

class RabbitMQClient {
  private connection: any = null;
  private channel: any = null;

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
      await this.channel.assertQueue(QUEUE_NAME, { durable: true });

      const routingKeys = [
        'session.created',
        'session.starting',
        'session.finished',
        'session.player_joined',
        'user.rank_changed',
      ];

      for (const key of routingKeys) {
        await this.channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, key);
        logger.info(`Bound to routing key: ${key}`);
      }

      logger.info('RabbitMQ connected');

      this.connection.on('error', (err: any) => {
        logger.error('RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
      });
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async consume(
    callback: (routingKey: string, content: any) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.consume(
      QUEUE_NAME,
      async (msg: any) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          const routingKey = msg.fields.routingKey;

          logger.info(`Received event: ${routingKey}`);
          await callback(routingKey, content);

          this.channel.ack(msg);
        } catch (error) {
          logger.error('Error processing message:', error);
          this.channel.nack(msg, false, false);
        }
      },
      { noAck: false }
    );
  }

  async publish(routingKey: string, message: any): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    this.channel.publish(
      EXCHANGE_NAME,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    logger.info('RabbitMQ disconnected');
  }
}

export const rabbitmqClient = new RabbitMQClient();