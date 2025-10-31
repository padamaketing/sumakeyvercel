// backend/src/routes/client.ts
import { Router } from 'express'
import { query } from '../db'
import { z } from 'zod'
import { requireAuth } from '../utils/auth' // ⬅️ igual que arriba

export const clientRouter = Router()

type AuthedRequest = {
  user?: { businessId: string }
} & import('express').Request

const registerClientSchema = z.object({
  businessSlug: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
})

clientRouter.post('/client/register', async (req, res) => {
  const parse = registerClientSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() })
  const { businessSlug, name, email, phone } = parse.data

  const bizRes = await query(`SELECT id FROM businesses WHERE slug = $1`, [businessSlug])
  const biz = bizRes.rows[0]
  if (!biz) return res.status(404).json({ error: 'Negocio no encontrado' })

  let clientId: string | null = null
  if (email) {
    const found = await query(`SELECT id FROM clients WHERE email = $1`, [email])
    if (found.rows[0]) clientId = found.rows[0].id
  }
  if (!clientId) {
    const ins = await query(
      `INSERT INTO clients (name, email, phone) VALUES ($1,$2,$3) RETURNING id`,
      [name, email || null, phone || null]
    )
    clientId = ins.rows[0].id
  }

  await query(
    `INSERT INTO memberships (business_id, client_id)
     VALUES ($1,$2)
     ON CONFLICT (business_id, client_id) DO NOTHING`,
    [biz.id, clientId]
  )

  res.json({ ok: true, clientId, businessId: biz.id })
})

// Detalle de cliente (protegido)
clientRouter.get('/client/:id', requireAuth as any, async (req: AuthedRequest, res) => {
  const { id } = req.params
  const { rows } = await query(
    `
    SELECT c.id, c.name, c.email, c.phone,
           m.stamps, m.rewards_pending, m.last_scan_at
      FROM memberships m
      JOIN clients c ON c.id = m.client_id
     WHERE m.business_id = $1 AND c.id = $2
    `,
    [req.user!.businessId, id]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' })
  res.json({ client: rows[0] })
})

export default clientRouter
