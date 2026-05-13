import { prisma } from '../config/database';
import { NotificationType } from '../models/types';
import { PushService } from './pushService';
import { logger } from '../utils/logger';

export class NotificationService {
  async notifyUser(
    userId: number,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    // Check preferences
    const pref = await this.getOrCreatePreference(userId);

    if (!this.shouldNotify(pref, type)) {
      logger.info(`User ${userId} has disabled ${type}`);
      return false;
    }

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data || {},
      },
    });

    // Send push if enabled
    if (pref.pushEnabled) {
      const tokens = await prisma.pushToken.findMany({
        where: { userId },
      });

      for (const tokenRecord of tokens) {
        const success = await PushService.sendPush(
          tokenRecord.token,
          title,
          body,
          {
            notification_id: String(notification.id),
            ...this.stringifyData(data || {}),
          }
        );

        if (success) {
          await prisma.notification.update({
            where: { id: notification.id },
            data: {
              pushed: true,
              pushSentAt: new Date(),
            },
          });
        } else {
          // Token might be invalid, delete it
          await prisma.pushToken.delete({
            where: { id: tokenRecord.id },
          });
        }
      }
    }

    return true;
  }

  async notifyUsers(
    userIds: number[],
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<number> {
    let sent = 0;
    for (const userId of userIds) {
      if (await this.notifyUser(userId, type, title, body, data)) {
        sent++;
      }
    }
    return sent;
  }

  private async getOrCreatePreference(userId: number) {
    let pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      pref = await prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return pref;
  }

  private shouldNotify(
    pref: any,
    type: NotificationType
  ): boolean {
    const typeToPreference: Record<NotificationType, boolean> = {
      [NotificationType.GAME_INVITE]: pref.gameInvites,
      [NotificationType.GAME_STARTING]: pref.gameStarting,
      [NotificationType.GAME_FINISHED]: pref.gameResults,
      [NotificationType.PLAYER_JOINED]: pref.playerJoined,
      [NotificationType.RANK_CHANGE]: pref.rankChanges,
      [NotificationType.CHALLENGE_RECEIVED]: true,
      [NotificationType.SYSTEM]: true,
    };

    return typeToPreference[type] ?? true;
  }

  private stringifyData(data: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = String(value);
    }
    return result;
  }
}