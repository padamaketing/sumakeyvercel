// backend/src/routes/business.ts
import { Router } from 'express'
import { query } from '../db'
import { z } from 'zod'
import { requireAuth } from '../utils/auth' // ⬅️ usar el MISMO middleware del server

export const businessRouter = Router()

type AuthedRequest = {
  user?: { businessId: string }
} & import('express').Request

// GET /api/auth/me (vía businessRouter si lo usas aquí; si ya lo expones en server.ts, puedes omitir)
businessRouter.get('/auth/me', requireAuth as any, async (req: AuthedRequest, res) => {
  const { rows } = await query(
    `SELECT id, name, email, slug, reward_name, reward_threshold, theme_color
       FROM businesses
      WHERE id = $1`,
    [req.user!.businessId]
  )
  res.json({ business: rows[0] })
})

const programSchema = z.object({
  rewardName: z.string().min(2),
  rewardThreshold: z.number().int().min(1).max(100),
})

// POST /api/program (si lo llamas así desde el front antiguo)
businessRouter.post('/program', requireAuth as any, async (req: AuthedRequest, res) => {
  const parse = programSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() })

  const { rewardName, rewardThreshold } = parse.data
  const { rows } = await query(
    `UPDATE businesses
        SET reward_name=$1, reward_threshold=$2
      WHERE id=$3
   RETURNING id, name, email, slug, reward_name, reward_threshold, theme_color`,
    [rewardName, rewardThreshold, req.user!.businessId]
  )
  res.json({ business: rows[0] })
})

// GET /api/business/clients
businessRouter.get('/business/clients', requireAuth as any, async (req: AuthedRequest, res) => {
  const { rows } = await query(
    `
    SELECT c.id, c.name, c.email, c.phone,
           m.stamps, m.rewards_pending, m.last_scan_at
      FROM memberships m
      JOIN clients c ON c.id = m.client_id
     WHERE m.business_id = $1
     ORDER BY c.name ASC
    `,
    [req.user!.businessId]
  )
  res.json({ clients: rows })
})

export default businessRouter
