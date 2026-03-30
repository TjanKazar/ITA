import { PushService } from '../pushService';

// Create a more flexible mock implementation
const mockSend = jest.fn();
const mockSendEachForMulticast = jest.fn();

jest.mock('../../config/firebase', () => ({
  get isFirebaseInitialized() {
    return (global as any).mockFirebaseInitialized ?? false;
  },
  getMessaging: jest.fn(() => ({
    send: mockSend,
    sendEachForMulticast: mockSendEachForMulticast,
  })),
  initializeFirebase: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

import { getMessaging } from '../../config/firebase';

describe('PushService', () => {
  const mockToken = 'test-token-123';
  const mockTitle = 'Test Notification';
  const mockBody = 'This is a test notification';
  const mockData = { key: 'value' };

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).mockFirebaseInitialized = false;
    mockSend.mockClear();
    mockSendEachForMulticast.mockClear();
  });

  describe('sendPush', () => {
    it('should return false if Firebase is not initialized', async () => {
      (global as any).mockFirebaseInitialized = false;

      const result = await PushService.sendPush(mockToken, mockTitle, mockBody);

      expect(result).toBe(false);
    });

    it('should send push notification with valid parameters', async () => {
      (global as any).mockFirebaseInitialized = true;
      mockSend.mockResolvedValue('message-id-123');

      const result = await PushService.sendPush(
        mockToken,
        mockTitle,
        mockBody,
        mockData
      );

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith({
        notification: { title: mockTitle, body: mockBody },
        data: mockData,
        token: mockToken,
      });
    });

    it('should handle unregistered token error gracefully', async () => {
      (global as any).mockFirebaseInitialized = true;
      mockSend.mockRejectedValue({
        code: 'messaging/registration-token-not-registered',
      });

      const result = await PushService.sendPush(mockToken, mockTitle, mockBody);

      expect(result).toBe(false);
    });

    it('should handle generic Firebase errors', async () => {
      (global as any).mockFirebaseInitialized = true;
      mockSend.mockRejectedValue(new Error('Firebase error'));

      const result = await PushService.sendPush(mockToken, mockTitle, mockBody);

      expect(result).toBe(false);
    });
  });

  describe('sendMulticast', () => {
    it('should return zero counts if Firebase is not initialized', async () => {
      (global as any).mockFirebaseInitialized = false;

      const result = await PushService.sendMulticast(
        ['token1', 'token2'],
        mockTitle,
        mockBody
      );

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(2);
    });

    it('should return zero counts for empty tokens array', async () => {
      const result = await PushService.sendMulticast([], mockTitle, mockBody);

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
    });

    it('should send multicast messages successfully', async () => {
      (global as any).mockFirebaseInitialized = true;
      mockSendEachForMulticast.mockResolvedValue({
        successCount: 2,
        failureCount: 0,
      });

      const tokens = ['token1', 'token2'];
      const result = await PushService.sendMulticast(
        tokens,
        mockTitle,
        mockBody,
        mockData
      );

      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(mockSendEachForMulticast).toHaveBeenCalled();
    });

    it('should handle partial failures in multicast', async () => {
      (global as any).mockFirebaseInitialized = true;
      mockSendEachForMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 1,
      });

      const tokens = ['valid-token', 'invalid-token'];
      const result = await PushService.sendMulticast(
        tokens,
        mockTitle,
        mockBody
      );

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
    });

    it('should handle multicast errors', async () => {
      (global as any).mockFirebaseInitialized = true;
      mockSendEachForMulticast.mockRejectedValue(new Error('Multicast failed'));

      const tokens = ['token1', 'token2'];
      const result = await PushService.sendMulticast(
        tokens,
        mockTitle,
        mockBody
      );

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(2);
    });
  });
});
