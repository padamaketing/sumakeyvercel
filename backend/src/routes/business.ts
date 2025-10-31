import { Router } from 'express'
import { query } from '../db'
import { z } from 'zod'
import { requireAuth } from '../utils/auth'

export const businessRouter = Router()

// 🔒 proteger TODO el router de negocio
businessRouter.use(requireAuth as any)

/** GET /api/auth/me (alias dentro de este router) */
businessRouter.get('/auth/me', async (req: any, res) => {
  const { rows } = await query(
    `SELECT id, name, email, slug, reward_name, reward_threshold, theme_color
       FROM public.businesses
      WHERE id=$1`,
    [req.user!.businessId]
  )
  res.json({ business: rows[0] })
})

/** POST /api/program (compat) */
const programSchema = z.object({
  rewardName: z.string().min(1),
  rewardThreshold: z.number().int().min(1).max(100),
})
businessRouter.post('/program', async (req: any, res) => {
  const parsed = programSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { rewardName, rewardThreshold } = parsed.data

  const { rows } = await query(
    `UPDATE public.businesses
        SET reward_name=$1, reward_threshold=$2
      WHERE id=$3
  RETURNING id, name, email, slug, reward_name, reward_threshold, theme_color`,
    [rewardName, rewardThreshold, req.user!.businessId]
  )
  res.json({ business: rows[0] })
})

/** SELECT base para clientes (evita repetir SQL) */
const CLIENTS_SQL = `
  SELECT c.id, c.name, c.email, c.phone,
         m.stamps,
         COALESCE(m.rewards, m.rewards_pending, 0) AS rewards_pending,
         m.last_scan_at
    FROM public.memberships m
    JOIN public.clients c ON c.id = m.client_id
   WHERE m.business_id = $1
   ORDER BY c.name ASC NULLS LAST
`

/** GET /api/business/clients  ← usa tu frontend */
businessRouter.get('/business/clients', async (req: any, res) => {
  const { rows } = await query(CLIENTS_SQL, [req.user!.businessId])
  res.json({ clients: rows })
})

/** GET /api/clients  ← alias para compatibilidad y para tu fallback del dashboard */
businessRouter.get('/clients', async (req: any, res) => {
  const { rows } = await query(CLIENTS_SQL, [req.user!.businessId])
  res.json({ clients: rows })
})

/** (Opcional) KPIs directos para el dashboard */
businessRouter.get('/business/overview', async (req: any, res) => {
  const bizId = req.user!.businessId
  const [{ rows: c }, { rows: s }, { rows: r }] = await Promise.all([
    query(`SELECT COUNT(*)::int AS n FROM public.memberships WHERE business_id=$1`, [bizId]),
    query(`SELECT COALESCE(SUM(stamps),0)::int AS s FROM public.memberships WHERE business_id=$1`, [bizId]),
    query(
      `SELECT COALESCE(SUM(COALESCE(rewards, rewards_pending, 0)),0)::int AS r
         FROM public.memberships WHERE business_id=$1`,
      [bizId]
    ),
  ])
  res.json({ clients: c[0]?.n ?? 0, stamps: s[0]?.s ?? 0, rewards: r[0]?.r ?? 0 })
})
