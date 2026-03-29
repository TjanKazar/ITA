import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const limitStr = req.query.limit;
  const offsetStr = req.query.offset;
  const unreadOnlyStr = req.query.unread_only;

  const limit = typeof limitStr === 'string' ? parseInt(limitStr) : 50;
  const offset = typeof offsetStr === 'string' ? parseInt(offsetStr) : 0;
  const unreadOnly = unreadOnlyStr === 'true';
  const userId = req.userId!;

  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly && { read: false }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, read: false },
  });

  res.json({
    notifications,
    unreadCount,
  });
});

router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  const idParam = req.params.id as string;
  const id = parseInt(idParam);
  const userId = req.userId!;

  const notification = await prisma.notification.updateMany({
    where: {
      id,
      userId,
    },
    data: { read: true },
  });

  if (notification.count === 0) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  res.json({ status: 'ok' });
});

router.post('/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  res.json({ status: 'ok', markedCount: result.count });
});

export default router;