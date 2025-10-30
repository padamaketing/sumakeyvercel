import { Router } from 'express'
import { query } from '../../db'
import { requireAuth } from '../../utils/auth'

const router = Router()

// Asegura que exista la tabla (defensivo)
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS restaurant_design (
      business_id uuid PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
      design jsonb NOT NULL DEFAULT '{}'::jsonb,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `)
}

// Middleware: proteger todas las rutas bajo /api/restaurant/design
router.use(requireAuth as any)

// GET /api/restaurant/design  → devuelve el diseño guardado (o {} si no hay)
router.get('/', async (req: any, res) => {
  try {
    await ensureTable()
    const businessId = req.user.businessId
    const { rows } = await query(
      `SELECT design FROM restaurant_design WHERE business_id = $1`,
      [businessId]
    )
    const design = rows[0]?.design || {}
    return res.json({ ok: true, design })
  } catch (e: any) {
    console.error('GET /design error:', e)
    return res.status(500).json({ error: 'design_get_failed' })
  }
})

// POST /api/restaurant/design  → guarda (upsert) el diseño enviado
router.post('/', async (req: any, res) => {
  try {
    await ensureTable()
    const businessId = req.user.businessId
    const incoming = req.body?.design ?? {}

    await query(
      `
      INSERT INTO restaurant_design (business_id, design, updated_at)
      VALUES ($1, $2::jsonb, now())
      ON CONFLICT (business_id)
      DO UPDATE SET design = EXCLUDED.design, updated_at = now()
      `,
      [businessId, JSON.stringify(incoming)]
    )

    return res.json({ ok: true, saved: true })
  } catch (e: any) {
    console.error('POST /design error:', e)
    return res.status(500).json({ error: 'design_save_failed' })
  }
})

export default router
