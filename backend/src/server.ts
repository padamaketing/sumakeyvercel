import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { query } from './db'

// Routers existentes
import { authRouter } from './routes/auth'
import { businessRouter } from './routes/business'
import { clientRouter } from './routes/client'
import { publicRouter } from './routes/public'
import { qrRouter } from './routes/qr'
import { scanRouter } from './routes/scan'

// NUEVOS routers
import restaurantLandingRouter from './routes/landing'
import publicLandingRouter from './routes/public/landing'
import historyRouter from './routes/history'
import publicRegisterRouter from './routes/public/register'

// ⚠️ Carga DEFENSIVA del router de diseño (soporta default/commonjs)
const designMod = require('./routes/restaurant/design')
const designRouter = designMod?.default ?? designMod

// Middleware auth para proteger /api/restaurant/*
import { requireAuth } from './utils/auth'

export function createServer() {
  const app = express()

  app.use(helmet())

  // ───────────────── CORS robusto + preflight
  const allowList = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const corsOptions: cors.CorsOptions = {
    origin(origin, cb) {
      // Permite peticiones sin Origin (curl, health checks)
      if (!origin) return cb(null, true)
      if (allowList.length === 0 || allowList.includes(origin)) return cb(null, true)
      return cb(new Error(`CORS blocked: ${origin}`), false)
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }

  app.use(cors(corsOptions))
  app.options('*', cors(corsOptions))

  // ───────────────── Body parsers (antes de las rutas)
  app.use(express.json({ limit: '15mb' }))
  app.use(express.urlencoded({ limit: '15mb', extended: true }))

  // ───────────────── Endpoint de diagnóstico CORS (temporal)
  app.get('/api/debug/cors', (req, res) => {
    res.json({
      originReceived: req.headers.origin || null,
      corsAllowedFrom: allowList,
      message: 'Debug CORS OK (GET)'
    })
  })

  // ───────────────── Health
  app.get('/api/health', (_req, res) => res.json({ ok: true }))

  app.get('/api/health/db', async (_req, res) => {
    try {
      const { rows } = await query('SELECT 1 as ok')
      res.json({ ok: rows[0]?.ok === 1 })
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || 'db error' })
    }
  })

  app.get('/api/health/full', async (_req, res) => {
    try {
      const { rows } = await query(`
        SELECT
          to_regclass('public.businesses')           AS businesses,
          to_regclass('public.clients')              AS clients,
          to_regclass('public.memberships')          AS memberships,
          to_regclass('public.scans')                AS scans,
          to_regclass('public.restaurant_landing')   AS restaurant_landing
      `)
      res.json({ ok: true, tables: rows[0] })
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || 'db error' })
    }
  })

  // ───────────────── Routers estándar
  type Pair = [string, any, string]
  const routers: Pair[] = [
    ['/api/auth', authRouter, 'authRouter'],
    ['/api',      businessRouter, 'businessRouter'],
    ['/api',      clientRouter,   'clientRouter'],
    ['/api',      publicRouter,   'publicRouter'],
    ['/api',      qrRouter,       'qrRouter'],
    ['/api',      scanRouter,     'scanRouter'],
  ]
  routers.forEach(([path, router, name]) => {
    const ok = router && (typeof router === 'function' || typeof (router as any).use === 'function')
    if (ok) {
      app.use(path, router)
      console.log(`[boot] Mounted ${name} at ${path}`)
    } else {
      console.error(`[boot] SKIPPED mounting ${name} at ${path} because it is ${typeof router}`)
    }
  })

  // ───────────────── Landing (privada y pública)
  app.use('/api/restaurant/landing', requireAuth as any, restaurantLandingRouter) // privada
  app.use('/api/public/landing', publicLandingRouter)                              // pública

  // ───────────────── Diseño (simulado)
  if (typeof designRouter === 'function' || typeof (designRouter as any)?.use === 'function') {
    app.use('/api/restaurant/design', designRouter)
  } else {
    console.error('[boot] designRouter NO es un middleware válido. Tipo:', typeof designRouter)
    app.get('/api/restaurant/design', (_req, res) =>
      res.status(500).json({ error: 'design router not loaded' })
    )
  }

  // ───────────────── REGISTRO PÚBLICO
  app.use('/api/public', publicRegisterRouter)

  // ───────────────── Historial (privado)
  app.use('/api', historyRouter)

  // ───────────────── Restaurant INLINE (Settings / Expiration / Program)
  app.get('/api/restaurant/settings', requireAuth as any, async (req: any, res) => {
    const businessId = req.user.businessId
    const { rows } = await query(
      `
      select id, name, slug, reward_name, reward_threshold,
             card_expiration_mode, card_expiration_date, card_expiration_days
        from businesses where id = $1
      `,
      [businessId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Business not found' })
    res.json({ business: rows[0] })
  })

  app.post('/api/restaurant/expiration', requireAuth as any, async (req: any, res) => {
    const businessId = req.user.businessId
    const { mode, date, days } = req.body as {
      mode: 'none' | 'fixed_date' | 'days_from_signup';
      date?: string;
      days?: number;
    }

    if (!mode || !['none','fixed_date','days_from_signup'].includes(mode)) {
      return res.status(400).json({ error: 'Modo inválido' })
    }
    if (mode === 'fixed_date' && !date) {
      return res.status(400).json({ error: 'Falta fecha para fixed_date' })
    }
    if (mode === 'days_from_signup' && (!days || days <= 0)) {
      return res.status(400).json({ error: 'Faltan días (>0) para days_from_signup' })
    }

    const { rows } = await query(
      `
      update businesses
         set card_expiration_mode = $2,
             card_expiration_date = $3,
             card_expiration_days = $4
       where id = $1
       returning id, name, slug, card_expiration_mode, card_expiration_date, card_expiration_days
      `,
      [businessId, mode, mode === 'fixed_date' ? date : null, mode === 'days_from_signup' ? days : null]
    )

    res.json({ ok: true, business: rows[0] })
  })

  // GET /api/restaurant/program
  app.get('/api/restaurant/program', requireAuth as any, async (req: any, res) => {
    const businessId = req.user.businessId
    const { rows } = await query(
      `
      select id, name,
             reward_threshold, reward_name, reward_product_code, reward_description,
             msg_stamp_one, msg_stamp_many,
             msg_reward_earned_one, msg_reward_earned_many,
             msg_reward_redeem_one, msg_reward_redeem_many
        from businesses where id = $1
      `,
      [businessId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Business not found' })
    res.json({ program: rows[0] })
  })

  // POST /api/restaurant/program
  app.post('/api/restaurant/program', requireAuth as any, async (req: any, res) => {
    const businessId = req.user.businessId
    const {
      reward_threshold, reward_name, reward_product_code, reward_description,
      msg_stamp_one, msg_stamp_many,
      msg_reward_earned_one, msg_reward_earned_many,
      msg_reward_redeem_one, msg_reward_redeem_many
    } = req.body || {}

    if (reward_threshold != null && (isNaN(reward_threshold) || reward_threshold <= 0)) {
      return res.status(400).json({ error: 'reward_threshold debe ser > 0' })
    }

    const { rows } = await query(
      `
      update businesses
         set reward_threshold = coalesce($2, reward_threshold),
             reward_name = coalesce($3, reward_name),
             reward_product_code = coalesce($4, reward_product_code),
             reward_description = coalesce($5, reward_description),
             msg_stamp_one = coalesce($6, msg_stamp_one),
             msg_stamp_many = coalesce($7, msg_stamp_many),
             msg_reward_earned_one = coalesce($8, msg_reward_earned_one),
             msg_reward_earned_many = coalesce($9, msg_reward_earned_many),
             msg_reward_redeem_one = coalesce($10, msg_reward_redeem_one),
             msg_reward_redeem_many = coalesce($11, msg_reward_redeem_many)
       where id = $1
       returning id, name,
                 reward_threshold, reward_name, reward_product_code, reward_description,
                 msg_stamp_one, msg_stamp_many,
                 msg_reward_earned_one, msg_reward_earned_many,
                 msg_reward_redeem_one, msg_reward_redeem_many
      `,
      [
        businessId,
        reward_threshold, reward_name, reward_product_code, reward_description,
        msg_stamp_one, msg_stamp_many,
        msg_reward_earned_one, msg_reward_earned_many,
        msg_reward_redeem_one, msg_reward_redeem_many
      ]
    )

    res.json({ ok: true, program: rows[0] })
  })

  // ───────────────── 404
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

  return app
}
