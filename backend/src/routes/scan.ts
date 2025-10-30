// backend/src/routes/scan.ts
import { Router } from 'express'
import { query } from '../db'

export const scanRouter = Router()

async function tableHasColumn(table: string, column: string) {
  const { rows } = await query(
    `select 1
       from information_schema.columns
      where table_schema='public'
        and table_name=$1
        and column_name=$2
      limit 1`,
    [table, column]
  )
  return rows.length > 0
}

function replacePlaceholders(
  text: string | null,
  data: { nombre?: string; count?: number; premio?: string }
) {
  if (!text) return text
  return text
    .replace(/\{nombre\}/g, data.nombre ?? '')
    .replace(/\{#\}/g, (data.count ?? '').toString())
    .replace(/\{premio\}/g, data.premio ?? '')
}

/* ───────── Preview ───────── */
scanRouter.get('/scan/preview', async (req, res) => {
  try {
    const clientId = (req.query.client as string) || (req.query.clientId as string)
    if (!clientId) return res.status(400).json({ ok: false, error: 'MISSING_CLIENT_ID' })

    const sql = `
      select m.id as membership_id, m.stamps, m.client_id, m.business_id,
             c.name as client_name,
             b.name as business_name,
             b.reward_threshold, b.reward_name,
             b.msg_stamp_one, b.msg_stamp_many,
             b.msg_reward_earned_one, b.msg_reward_earned_many,
             b.msg_reward_redeem_one, b.msg_reward_redeem_many,
             b.card_expiration_mode, b.card_expiration_date, b.card_expiration_days
        from public.memberships m
        join public.clients c on c.id = m.client_id
        join public.businesses b on b.id = m.business_id
       where m.client_id = $1
       limit 1
    `
    const { rows } = await query(sql, [clientId])
    if (!rows.length) return res.status(404).json({ ok: false, error: 'MEMBERSHIP_NOT_FOUND' })
    const r = rows[0]

    let expired = false
    if (r.card_expiration_mode === 'fixed_date' && r.card_expiration_date) {
      expired = new Date(r.card_expiration_date) < new Date()
    }

    const hasRewards = await tableHasColumn('memberships', 'rewards')
    let rewards: number | null = null
    if (hasRewards) {
      const cur = await query(`select rewards from public.memberships where id = $1`, [r.membership_id])
      rewards = Number(cur.rows?.[0]?.rewards ?? 0)
    }

    res.json({
      ok: true,
      client: { id: clientId, name: r.client_name },
      business: { id: r.business_id, name: r.business_name },
      membership: { id: r.membership_id, stamps: Number(r.stamps || 0), rewards },
      program: {
        reward_threshold: r.reward_threshold ? Number(r.reward_threshold) : null,
        reward_name: r.reward_name || '',
        messages: {
          stamp_one: r.msg_stamp_one || null,
          stamp_many: r.msg_stamp_many || null,
          reward_earned_one: r.msg_reward_earned_one || null,
          reward_earned_many: r.msg_reward_earned_many || null,
          reward_redeem_one: r.msg_reward_redeem_one || null,
          reward_redeem_many: r.msg_reward_redeem_many || null,
        }
      },
      canRedeem: hasRewards && (Number(rewards ?? 0) > 0),
      expired,
    })
  } catch (e: any) {
    console.error('GET /api/scan/preview error:', e)
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' })
  }
})

/* ───────── Add stamp(s) ───────── */
scanRouter.post('/scan/add-stamp', async (req, res) => {
  try {
    const clientId = req.body?.client || req.body?.clientId
    const count = Math.max(1, Number(req.body?.count ?? 1))
    if (!clientId) return res.status(400).json({ ok: false, error: 'MISSING_CLIENT_ID' })

    const infoSql = `
      select m.id as membership_id, m.stamps, m.business_id,
             c.name as client_name,
             b.name as business_name,
             b.reward_threshold, b.reward_name,
             b.msg_stamp_one, b.msg_stamp_many,
             b.msg_reward_earned_one, b.msg_reward_earned_many,
             b.msg_reward_redeem_one, b.msg_reward_redeem_many,
             b.card_expiration_mode, b.card_expiration_date, b.card_expiration_days
        from public.memberships m
        join public.clients c on c.id = m.client_id
        join public.businesses b on b.id = m.business_id
       where m.client_id = $1
       limit 1
    `
    const info = await query(infoSql, [clientId])
    if (!info.rows.length) return res.status(404).json({ ok: false, error: 'MEMBERSHIP_NOT_FOUND' })
    const r = info.rows[0]

    // caducidad
    if (r.card_expiration_mode === 'fixed_date' && r.card_expiration_date) {
      if (new Date(r.card_expiration_date) < new Date()) {
        return res.status(400).json({ ok: false, error: 'Tarjeta caducada' })
      }
    }

    const hasStamps = await tableHasColumn('memberships', 'stamps')
    const hasRewards = await tableHasColumn('memberships', 'rewards')

    // leer rewards actuales
    let currentRewards = 0
    if (hasRewards) {
      const cur = await query('select rewards from public.memberships where id = $1', [r.membership_id])
      currentRewards = Number(cur.rows?.[0]?.rewards ?? 0)
    }

    let stampsBefore = Number(r.stamps || 0)
    let stampsAfter = stampsBefore
    let rewardsEarned = 0
    const rewardThreshold: number | null = r.reward_threshold != null ? Number(r.reward_threshold) : null
    const rewardName = r.reward_name || ''

    if (hasStamps) {
      if (rewardThreshold && rewardThreshold > 0) {
        const total = stampsBefore + count
        rewardsEarned = Math.floor(total / rewardThreshold)
        stampsAfter = total % rewardThreshold

        if (hasRewards) {
          await query(
            `update public.memberships
                set stamps = $2,
                    rewards = coalesce(rewards,0) + $3
              where id = $1`,
            [r.membership_id, stampsAfter, rewardsEarned]
          )
        } else {
          await query(`update public.memberships set stamps = $2 where id = $1`, [r.membership_id, stampsAfter])
        }
      } else {
        stampsAfter = stampsBefore + count
        await query(`update public.memberships set stamps = $2 where id = $1`, [r.membership_id, stampsAfter])
      }
    }

    // ───── Log en scans: acción + detalle (JSON)
    const scansCols = await query(
      `select column_name
         from information_schema.columns
        where table_schema='public' and table_name='scans'`
    )
    const sset = new Set<string>(scansCols.rows.map((x: any) => x.column_name))
    if (sset.size) {
      const cols: string[] = []
      const vals: any[] = []
      const ph: string[] = []
      let i = 1
      if (sset.has('membership_id')) { cols.push('membership_id'); vals.push(r.membership_id); ph.push(`$${i++}`) }
      if (sset.has('client_id'))     { cols.push('client_id');     vals.push(clientId);       ph.push(`$${i++}`) }
      if (sset.has('business_id'))   { cols.push('business_id');   vals.push(r.business_id);  ph.push(`$${i++}`) }
      if (sset.has('stamps_added'))  { cols.push('stamps_added');  vals.push(count);          ph.push(`$${i++}`) }
      if (sset.has('payload')) {
        cols.push('payload')
        vals.push(JSON.stringify({ type: 'add-stamp', count }))
        ph.push(`$${i++}`)
      }
      try {
        if (cols.length) await query(`insert into public.scans (${cols.join(',')}) values (${ph.join(',')})`, vals)
        else await query(`insert into public.scans default values`)
      } catch (e) {
        console.warn('log add-stamp skipped:', (e as any)?.message)
      }
    }

    const dataReplace = { nombre: r.client_name || '', count, premio: rewardName }
    const msgStamp =
      count === 1
        ? replacePlaceholders(r.msg_stamp_one || 'Has ganado {#} sello.', dataReplace)
        : replacePlaceholders(r.msg_stamp_many || 'Has ganado {#} sellos.', dataReplace)

    let rewardMessage: string | null = null
    if (rewardsEarned > 0) {
      rewardMessage =
        rewardsEarned === 1
          ? replacePlaceholders(r.msg_reward_earned_one || '¡Has obtenido 1 {premio}!', { ...dataReplace, count: 1 })
          : replacePlaceholders(r.msg_reward_earned_many || '¡Has obtenido {#} {premio}!', { ...dataReplace, count: rewardsEarned })
    }

    const rewardsAfter = hasRewards ? currentRewards + rewardsEarned : null

    res.json({
      ok: true,
      membership: {
        id: r.membership_id,
        stamps_before: stampsBefore,
        stamps_after: stampsAfter,
        rewards_earned_now: rewardsEarned,
        rewards_after: rewardsAfter,
        reward_threshold: rewardThreshold,
        reward_name: rewardName
      },
      messages: {
        stamp: msgStamp,
        rewardEarned: rewardsEarned > 0,
        rewardMessage
      }
    })
  } catch (e: any) {
    console.error('POST /api/scan/add-stamp error:', e)
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' })
  }
})

/* ───────── Redeem ───────── */
scanRouter.post('/scan/redeem', async (req, res) => {
  try {
    const clientId = req.body?.client || req.body?.clientId
    const count = Math.max(1, Number(req.body?.count ?? 1))
    if (!clientId) return res.status(400).json({ ok: false, error: 'MISSING_CLIENT_ID' })

    const infoSql = `
      select m.id as membership_id, m.rewards, m.business_id,
             c.name as client_name,
             b.reward_name,
             b.msg_reward_redeem_one, b.msg_reward_redeem_many
        from public.memberships m
        join public.clients c on c.id = m.client_id
        join public.businesses b on b.id = m.business_id
       where m.client_id = $1
       limit 1
    `
    const info = await query(infoSql, [clientId])
    if (!info.rows.length) return res.status(404).json({ ok: false, error: 'MEMBERSHIP_NOT_FOUND' })
    const r = info.rows[0]

    const hasRewards = await tableHasColumn('memberships', 'rewards')
    if (!hasRewards) return res.status(400).json({ ok: false, error: 'REWARDS_NOT_SUPPORTED' })

    const current = Number(r.rewards || 0)
    if (current < count) return res.status(400).json({ ok: false, error: 'NOT_ENOUGH_REWARDS' })

    // descontar
    await query(`update public.memberships set rewards = rewards - $2 where id = $1`, [r.membership_id, count])

    // ───── Log en scans: acción + detalle (JSON)
    const scansCols = await query(
      `select column_name
         from information_schema.columns
        where table_schema='public' and table_name='scans'`
    )
    const sset = new Set<string>(scansCols.rows.map((x: any) => x.column_name))
    if (sset.size) {
      const cols: string[] = []
      const vals: any[] = []
      const ph: string[] = []
      let i = 1
      if (sset.has('membership_id')) { cols.push('membership_id'); vals.push(r.membership_id); ph.push(`$${i++}`) }
      if (sset.has('client_id'))     { cols.push('client_id');     vals.push(clientId);       ph.push(`$${i++}`) }
      if (sset.has('business_id'))   { cols.push('business_id');   vals.push(r.business_id);  ph.push(`$${i++}`) }
      if (sset.has('rewards_used'))  { cols.push('rewards_used');  vals.push(count);          ph.push(`$${i++}`) }
      if (sset.has('payload')) {
        cols.push('payload')
        vals.push(JSON.stringify({ type: 'redeem', count }))
        ph.push(`$${i++}`)
      }
      try {
        if (cols.length) await query(`insert into public.scans (${cols.join(',')}) values (${ph.join(',')})`, vals)
        else await query(`insert into public.scans default values`)
      } catch (e) {
        console.warn('log redeem skipped:', (e as any)?.message)
      }
    }

    const dataReplace = { nombre: r.client_name || '', count, premio: r.reward_name || 'premio' }
    const redeemMsg =
      count === 1
        ? replacePlaceholders(r.msg_reward_redeem_one || 'Has canjeado 1 {premio}.', dataReplace)
        : replacePlaceholders(r.msg_reward_redeem_many || 'Has canjeado {#} {premio}.', dataReplace)

    res.json({
      ok: true,
      membership: { id: r.membership_id, rewards_before: current, rewards_after: current - count },
      messages: { redeem: redeemMsg }
    })
  } catch (e: any) {
    console.error('POST /api/scan/redeem error:', e)
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' })
  }
})
