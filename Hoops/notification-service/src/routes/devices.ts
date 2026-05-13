import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { RegisterTokenSchema } from '../models/types';

const router = Router();

router.post(
  '/',
  authMiddleware,
  validate(RegisterTokenSchema),
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { token, platform, deviceName } = req.body;

    const pushToken = await prisma.pushToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
        deviceName,
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform,
        deviceName,
      },
    });

    res.json({ status: 'ok', tokenId: pushToken.id });
  }
);

router.delete('/:token', authMiddleware, async (req: AuthRequest, res: Response) => {
  const tokenParam = req.params.token as string;

  const result = await prisma.pushToken.deleteMany({
    where: { token: tokenParam },
  });

  if (result.count === 0) {
    res.json({ status: 'not_found' });
    return;
  }

  res.json({ status: 'ok' });
});

export default router;