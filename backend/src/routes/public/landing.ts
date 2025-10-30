import { Router } from 'express'
import { query } from '../../db'

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

// GET /api/public/landing/:slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params
    if (!slug) return res.status(400).json({ ok: false, error: 'SLUG_REQUIRED' })

    // negocio por slug
    const biz = await query(
      `select id, name, slug from public.businesses where slug = $1 limit 1`,
      [slug]
    )
    if (biz.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'BUSINESS_NOT_FOUND' })
    }
    const businessId = biz.rows[0].id

    // configuración de landing
    const conf = await query(
      `select config from public.restaurant_landing where business_id = $1 limit 1`,
      [businessId]
    )

    const out = conf.rows.length ? conf.rows[0].config : {}
    const merged = {
      ...DEFAULT_CONFIG,
      ...out,
      fields: { ...DEFAULT_CONFIG.fields, ...(out?.fields || {}) },
      legal: { ...DEFAULT_CONFIG.legal, ...(out?.legal || {}) }
    }

    res.json({ ok: true, business: biz.rows[0], config: merged })
  } catch (e: any) {
    console.error('GET /api/public/landing/:slug', e)
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' })
  }
})

export default router
