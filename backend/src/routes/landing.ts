import { Router } from 'express'
import { query } from '../db'

const router = Router()

const DEFAULT_CONFIG = {
  formTitle: 'Únete a nuestro club',
  headerText: 'Regístrate y recoge sellos con cada visita.',
  buttonText: 'Registrarme',
  logoUrl: '',
  fields: { name: true, lastname: true, email: true, phone: true, birthday: false },
  legal: {
    businessName: 'Nombre del negocio',
    email: 'contacto@tunegocio.com',
    phone: '+34 600 000 000',
    terms: 'Texto legal completo…',
    privacy: 'Describe tu política de privacidad…'
  }
}

// GET /api/restaurant/landing
router.get('/', async (req: any, res) => {
  try {
    const businessId = req.user?.businessId
    if (!businessId) return res.status(400).json({ ok: false, error: 'BUSINESS_ID_MISSING' })

    const { rows } = await query(
      `select config from public.restaurant_landing where business_id = $1 limit 1`,
      [businessId]
    )

    if (rows.length === 0) {
      return res.json({ ok: true, config: DEFAULT_CONFIG, source: 'default' })
    }

    const out = rows[0].config || {}
    const merged = {
      ...DEFAULT_CONFIG,
      ...out,
      fields: { ...DEFAULT_CONFIG.fields, ...(out.fields || {}) },
      legal: { ...DEFAULT_CONFIG.legal, ...(out.legal || {}) }
    }

    res.json({ ok: true, config: merged, source: 'db' })
  } catch (e: any) {
    console.error('GET /restaurant/landing', e)
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' })
  }
})

// POST /api/restaurant/landing
router.post('/', async (req: any, res) => {
  try {
    const businessId = req.user?.businessId
    if (!businessId) return res.status(400).json({ ok: false, error: 'BUSINESS_ID_MISSING' })

    const config = req.body?.config
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ ok: false, error: 'INVALID_CONFIG' })
    }

    await query(
      `insert into public.restaurant_landing (business_id, config, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (business_id) do update set config = excluded.config, updated_at = now()`,
      [businessId, JSON.stringify(config)]
    )

    res.json({ ok: true })
  } catch (e: any) {
    console.error('POST /restaurant/landing', e)
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' })
  }
})

export default router
