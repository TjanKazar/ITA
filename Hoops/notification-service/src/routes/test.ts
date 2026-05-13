import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

const router = Router();

router.post('/generate-token', async (req: Request, res: Response) => {
  const userId = req.body.userId || 1;

  const token = jwt.sign(
    { sub: String(userId) },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );

  res.json({ token, userId });
});

router.post('/create-notification', async (req: Request, res: Response) => {
  const notification = await prisma.notification.create({
    data: {
      userId: req.body.user_id || 1,
      type: req.body.type || 'system',
      title: req.body.title || 'Test Notification',
      body: req.body.body || 'This is a test',
      data: req.body.data || {},
    },
  });

  res.json(notification);
});

export default router;