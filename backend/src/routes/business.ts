import { Router } from 'express';
import { authRequired, AuthedRequest } from '../middleware/auth';
import { query } from '../db';
import { z } from 'zod';

export const businessRouter = Router();

businessRouter.get('/auth/me', authRequired, async (req: AuthedRequest, res) => {
  const { rows } = await query(
    `SELECT id, name, email, slug, reward_name, reward_threshold, theme_color
       FROM businesses
      WHERE id = $1`,
    [req.user!.businessId]
  );
  res.json({ business: rows[0] });
});

const programSchema = z.object({
  rewardName: z.string().min(2),
  rewardThreshold: z.number().int().min(1).max(100),
});

businessRouter.post('/program', authRequired, async (req: AuthedRequest, res) => {
  const parse = programSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  const { rewardName, rewardThreshold } = parse.data;
  const { rows } = await query(
    `UPDATE businesses
        SET reward_name = $1,
            reward_threshold = $2
      WHERE id = $3
  RETURNING id, name, email, slug, reward_name, reward_threshold, theme_color`,
    [rewardName, rewardThreshold, req.user!.businessId]
  );
  res.json({ business: rows[0] });
});

/** 🔧 FIX: usar memberships.rewards (y lo exponemos como rewards_pending para no tocar el frontend) */
businessRouter.get('/business/clients', authRequired, async (req: AuthedRequest, res) => {
  const { rows } = await query(
    `
    SELECT
      c.id,
      c.name,
      c.email,
      c.phone,
      m.stamps,
      COALESCE(m.rewards, 0) AS rewards_pending,
      m.last_scan_at
    FROM memberships m
    JOIN clients c ON c.id = m.client_id
    WHERE m.business_id = $1
    ORDER BY c.name ASC
    `,
    [req.user!.businessId]
  );
  res.json({ clients: rows });
});

export default businessRouter;
