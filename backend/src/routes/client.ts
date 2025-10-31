import { Router } from 'express'
import { query } from '../db'
import { z } from 'zod'
import { requireAuth } from '../utils/auth' // ← unificamos middleware

export const clientRouter = Router()

const registerClientSchema = z.object({
  businessSlug: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  birthday: z.string().optional(), // por si lo envías desde la landing
})

// Público: alta desde landing
clientRouter.post('/client/register', async (req, res) => {
  const parsed = registerClientSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { businessSlug, name, email, phone } = parsed.data

  const bizRes = await query(`SELECT id FROM public.businesses WHERE slug=$1`, [businessSlug])
  const biz = bizRes.rows[0]
  if (!biz) return res.status(404).json({ error: 'Negocio no encontrado' })

  // Deduplicate por email si viene
  let clientId: string | null = null
  if (email) {
    const found = await query(`SELECT id FROM public.clients WHERE email=$1 LIMIT 1`, [email])
    if (found.rows[0]) clientId = found.rows[0].id
  }
  if (!clientId) {
    const ins = await query(
      `INSERT INTO public.clients (name, email, phone) VALUES ($1,$2,$3) RETURNING id`,
      [name, email || null, phone || null]
    )
    clientId = ins.rows[0].id
  }

  await query(
    `
    INSERT INTO public.memberships (business_id, client_id)
    VALUES ($1,$2)
    ON CONFLICT (business_id, client_id) DO NOTHING
    `,
    [biz.id, clientId]
  )

  res.json({ ok: true, clientId, businessId: biz.id })
})

// Privado: detalle de cliente
clientRouter.get('/client/:id', requireAuth as any, async (req: any, res) => {
  const { id } = req.params
  const { rows } = await query(
    `
    SELECT c.id, c.name, c.email, c.phone,
           m.stamps,
           COALESCE(m.rewards, m.rewards_pending, 0) AS rewards_pending,
           m.last_scan_at
      FROM public.memberships m
      JOIN public.clients c ON c.id = m.client_id
     WHERE m.business_id = $1
       AND c.id = $2
     LIMIT 1
    `,
    [req.user!.businessId, id]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' })
  res.json({ client: rows[0] })
})
