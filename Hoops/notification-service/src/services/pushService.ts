import { getMessaging, isFirebaseInitialized } from '../config/firebase';
import { logger } from '../utils/logger';

export class PushService {
  static async sendPush(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    if (!isFirebaseInitialized) {
      logger.warn('Firebase not initialized, skipping push');
      return false;
    }

    try {
      const message = {
        notification: { title, body },
        data: data || {},
        token,
      };

      const response = await getMessaging().send(message);
      logger.info(`Push sent successfully: ${response}`);
      return true;
    } catch (error: any) {
      if (error.code === 'messaging/registration-token-not-registered') {
        logger.warn(`Token unregistered: ${token}`);
        return false;
      }
      logger.error('Push failed:', error);
      return false;
    }
  }

  static async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!isFirebaseInitialized) {
      logger.warn('Firebase not initialized, skipping push');
      return { successCount: 0, failureCount: tokens.length };
    }

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const message = {
        notification: { title, body },
        data: data || {},
        tokens,
      };

      const response = await getMessaging().sendEachForMulticast(message);
      logger.info(
        `Multicast sent: ${response.successCount} success, ${response.failureCount} failed`
      );
      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      logger.error('Multicast failed:', error);
      return { successCount: 0, failureCount: tokens.length };
    }
  }
}