import { Router } from 'express'
import { query } from '../db'
import { requireAuth } from '../utils/auth'

const router = Router()

// Sanity check: /api/restaurant/history/ping
router.get('/restaurant/history/ping', requireAuth as any, (_req, res) => {
  console.log('[history] ping')
  res.json({ ok: true, pong: true })
})

router.get('/restaurant/history', requireAuth as any, async (req: any, res) => {
  const startedAt = Date.now()
  try {
    const businessId = req.user.businessId as string
    const limit = Math.max(1, Math.min(200, Number(req.query.limit ?? 50)))
    const offset = Math.max(0, Number(req.query.offset ?? 0))

    console.log(`[history] GET by business=${businessId} limit=${limit} offset=${offset}`)

    // ¿Existe la tabla?
    const { rows: existsRows } = await query(
      `SELECT to_regclass('public.scans') IS NOT NULL AS exists`
    )
    const exists = !!existsRows?.[0]?.exists
    console.log(`[history] scans exists=${exists}`)
    if (!exists) {
      return res.json({ ok: true, items: [], total: 0 })
    }

    // Columnas disponibles
    const { rows: trows } = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='scans'
    `)
    const cols = new Set<string>(trows.map((r: any) => r.column_name))
    const hasId           = cols.has('id')
    const hasCreatedAt    = cols.has('created_at')
    const hasBusinessId   = cols.has('business_id')
    const hasClientId     = cols.has('client_id')
    const hasStampsAdded  = cols.has('stamps_added')
    const hasRewardsUsed  = cols.has('rewards_used')
    const hasPayload      = cols.has('payload')

    // Construcción defensiva del SELECT
    const select = `
      SELECT
        ${hasId ? 's.id' : 'NULL'} AS id,
        ${hasCreatedAt ? 's.created_at' : 'now()'} AS created_at,
        ${hasClientId ? 's.client_id' : 'NULL'} AS client_id,
        ${hasStampsAdded ? 'COALESCE(s.stamps_added,0)' : '0'} AS stamps_added,
        ${hasRewardsUsed ? 'COALESCE(s.rewards_used,0)' : '0'} AS rewards_used,
        ${hasPayload ? 's.payload' : 'NULL'} AS payload,
        c.name AS client_name
      FROM public.scans s
      LEFT JOIN public.clients c ON ${hasClientId ? 'c.id = s.client_id' : 'FALSE'}
      ${hasBusinessId ? 'WHERE s.business_id = $1' : 'WHERE TRUE'}
      ORDER BY
        ${hasCreatedAt ? 's.created_at DESC NULLS LAST,' : ''}
        ${hasId ? 's.id DESC' : '1'}
      LIMIT $2 OFFSET $3
    `

    const countSql = hasBusinessId
      ? `SELECT COUNT(*)::int AS n FROM public.scans WHERE business_id = $1`
      : `SELECT COUNT(*)::int AS n FROM public.scans`

    const params = hasBusinessId ? [businessId, limit, offset] : [limit, offset]
    const { rows } = await query(select, params)
    const { rows: crows } = await query(countSql, hasBusinessId ? [businessId] : [])

    console.log(`[history] done in ${Date.now()-startedAt}ms, items=${rows.length}`)
    res.json({ ok: true, items: rows, total: crows?.[0]?.n ?? rows.length })
  } catch (e: any) {
    console.error('GET /api/restaurant/history error:', e?.message || e)
    // devolvemos vacío para que la UI no muestre "error"
    res.json({ ok: true, items: [], total: 0 })
  }
})

export default router
