import { Router } from 'express'
import { query } from '../db'
import { z } from 'zod'
import { requireAuth } from '../utils/auth' // ← unificamos middleware

export const businessRouter = Router()

// (opcional) /api/auth/me bajo este router — usa el MISMO middleware
businessRouter.get('/auth/me', requireAuth as any, async (req: any, res) => {
  const { rows } = await query(
    `SELECT id, name, email, slug, reward_name, reward_threshold, theme_color
       FROM public.businesses
      WHERE id = $1`,
    [req.user!.businessId]
  )
  res.json({ business: rows[0] })
})

const programSchema = z.object({
  rewardName: z.string().min(1),
  rewardThreshold: z.number().int().min(1).max(100),
})

// POST /api/program  (compat antiguo)
businessRouter.post('/program', requireAuth as any, async (req: any, res) => {
  const parsed = programSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }
  const { rewardName, rewardThreshold } = parsed.data

  const { rows } = await query(
    `UPDATE public.businesses
        SET reward_name = $1,
            reward_threshold = $2
      WHERE id = $3
  RETURNING id, name, email, slug, reward_name, reward_threshold, theme_color`,
    [rewardName, rewardThreshold, req.user!.businessId]
  )

  res.json({ business: rows[0] })
})

// GET /api/business/clients  ← la que usa tu frontend
businessRouter.get('/business/clients', requireAuth as any, async (req: any, res) => {
  const { rows } = await query(
    `
    SELECT c.id, c.name, c.email, c.phone,
           m.stamps,
           /* si la columna no existe, cae a 0 */
           COALESCE(m.rewards, m.rewards_pending, 0) AS rewards_pending,
           m.last_scan_at
      FROM public.memberships m
      JOIN public.clients c ON c.id = m.client_id
     WHERE m.business_id = $1
     ORDER BY c.name ASC NULLS LAST
    `,
    [req.user!.businessId]
  )
  res.json({ clients: rows })
})

// (opcional) pequeño resumen para KPIs del dashboard
businessRouter.get('/business/overview', requireAuth as any, async (req: any, res) => {
  const bizId = req.user!.businessId
  const clientsQ = await query(
    `SELECT COUNT(*)::int AS n FROM public.memberships WHERE business_id=$1`,
    [bizId]
  )

  const stampsQ = await query(
    `SELECT COALESCE(SUM(stamps),0)::int AS s FROM public.memberships WHERE business_id=$1`,
    [bizId]
  )

  // soporta tanto 'rewards' como 'rewards_pending'
  const rewardsQ = await query(
    `SELECT COALESCE(SUM(COALESCE(rewards, rewards_pending, 0)),0)::int AS r
       FROM public.memberships
      WHERE business_id=$1`,
    [bizId]
  )

  res.json({
    clients: clientsQ.rows[0]?.n ?? 0,
    stamps: stampsQ.rows[0]?.s ?? 0,
    rewards: rewardsQ.rows[0]?.r ?? 0,
  })
})
