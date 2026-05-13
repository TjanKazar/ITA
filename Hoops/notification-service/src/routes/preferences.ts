import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { PreferenceUpdateSchema } from '../models/types';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  let pref = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (!pref) {
    pref = await prisma.notificationPreference.create({
      data: { userId },
    });
  }

  res.json(pref);
});

router.put(
  '/',
  authMiddleware,
  validate(PreferenceUpdateSchema),
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const pref = await prisma.notificationPreference.upsert({
      where: { userId },
      update: req.body,
      create: {
        userId,
        ...req.body,
      },
    });

    res.json(pref);
  }
);

export default router;