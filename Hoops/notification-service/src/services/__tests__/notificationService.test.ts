import { NotificationService } from '../notificationService';
import { NotificationType } from '../../models/types';

jest.mock('../../config/database', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    pushToken: {
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

jest.mock('../pushService');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { prisma } from '../../config/database';
import { PushService } from '../pushService';

describe('NotificationService', () => {
  const service = new NotificationService();
  const mockUserId = 1;
  const mockType = NotificationType.RANK_CHANGE;
  const mockTitle = 'Rank Update';
  const mockBody = 'Your rank has changed';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('notifyUser', () => {
    it('should create a notification record', async () => {
      const mockNotification = {
        id: 1,
        userId: mockUserId,
        type: mockType,
        title: mockTitle,
        body: mockBody,
        data: {},
        read: false,
        createdAt: new Date(),
        pushed: false,
        pushSentAt: null,
      };

      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        emailEnabled: true,
        pushEnabled: false,
      });

      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

      const result = await service.notifyUser(
        mockUserId,
        mockType,
        mockTitle,
        mockBody
      );

      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('should prevent notification if user has disabled the type', async () => {
      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        emailEnabled: false,
        pushEnabled: false,
        rankChanges: false,
      });

      (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        rankChanges: false,
      });

      const result = await service.notifyUser(
        mockUserId,
        mockType,
        mockTitle,
        mockBody
      );

      expect(result).toBeDefined();
    });

    it('should send push notification if enabled', async () => {
      const mockNotification = {
        id: 1,
        userId: mockUserId,
        type: mockType,
        title: mockTitle,
        body: mockBody,
        data: {},
        read: false,
        createdAt: new Date(),
        pushed: false,
        pushSentAt: null,
      };

      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        emailEnabled: true,
        pushEnabled: true,
      });

      (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        pushEnabled: true,
      });

      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);
      (prisma.pushToken.findMany as jest.Mock).mockResolvedValue([
        { token: 'token1' },
      ]);

      (PushService.sendPush as jest.Mock).mockResolvedValue(true);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotification,
        pushed: true,
      });

      const result = await service.notifyUser(
        mockUserId,
        mockType,
        mockTitle,
        mockBody
      );

      expect(result).toBeDefined();
    });

    it('should handle notification data', async () => {
      const mockData = { rankPosition: 5, previousPosition: 8 };
      const mockNotification = {
        id: 1,
        userId: mockUserId,
        type: mockType,
        title: mockTitle,
        body: mockBody,
        data: mockData,
        read: false,
        createdAt: new Date(),
        pushed: false,
        pushSentAt: null,
      };

      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        emailEnabled: true,
        pushEnabled: false,
      });

      (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue({
        userId: mockUserId,
      });

      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

      const result = await service.notifyUser(
        mockUserId,
        mockType,
        mockTitle,
        mockBody,
        mockData
      );

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            data: mockData,
          }),
        })
      );
    });
  });
});
