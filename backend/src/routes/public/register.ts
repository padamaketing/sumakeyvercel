import { Router } from 'express'
import { query } from '../../db'

const router = Router()

/**
 * POST /api/public/register
 * body: { slug, name?, lastname?, email?, phone?, birthday? | birthdate? }
 */
router.post('/register', async (req, res) => {
  try {
    const {
      slug,
      name,
      lastname,
      email,
      phone,
      birthday: bodyBirthday,    // puede venir como birthday…
      birthdate: bodyBirthdate,  // …o como birthdate
    } = req.body || {}

    if (!slug) return res.status(400).json({ ok: false, error: 'SLUG_REQUIRED' })

    // normalizamos nombre del campo de fecha
    const birthday = bodyBirthday ?? bodyBirthdate ?? null

    // 1) negocio por slug
    const biz = await query(
      `select id, name, slug from public.businesses where slug = $1 limit 1`,
      [slug]
    )
    if (biz.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'BUSINESS_NOT_FOUND' })
    }
    const businessId = biz.rows[0].id

    // 2) columnas reales de clients
    const colsClientsRes = await query(
      `select column_name
         from information_schema.columns
        where table_schema = 'public'
          and table_name   = 'clients'`
    )
    const Cset = new Set<string>(colsClientsRes.rows.map((r: any) => r.column_name))

    const COL = {
      id: 'id',
      name: Cset.has('name') ? 'name' : null,
      lastname: Cset.has('lastname') ? 'lastname'
               : Cset.has('last_name') ? 'last_name'
               : Cset.has('surname') ? 'surname'
               : null,
      email: Cset.has('email') ? 'email' : null,
      phone: Cset.has('phone') ? 'phone'
           : Cset.has('telephone') ? 'telephone'
           : null,
      birthday: Cset.has('birthday') ? 'birthday'
              : Cset.has('birthdate') ? 'birthdate'
              : Cset.has('date_of_birth') ? 'date_of_birth'
              : Cset.has('dob') ? 'dob'
              : null,
    }

    // 3) buscar cliente existente por email/phone dentro del negocio
    let clientId: string | null = null
    const whereConds: string[] = []
    const whereParams: any[] = [businessId]
    let p = 2

    if (COL.email && email) {
      whereConds.push(`(c.${COL.email} = $${p}::text)`)
      whereParams.push(email); p++
    }
    if (COL.phone && phone) {
      whereConds.push(`(c.${COL.phone} = $${p}::text)`)
      whereParams.push(phone); p++
    }

    if (whereConds.length > 0) {
      const sql = `
        select c.${COL.id} as id
          from public.clients c
          join public.memberships m on m.client_id = c.${COL.id}
         where m.business_id = $1
           and (${whereConds.join(' or ')})
         limit 1
      `
      const found = await query(sql, whereParams)
      if (found.rows.length) clientId = found.rows[0].id
    }

    // 4) crear/actualizar cliente
    if (!clientId) {
      const insertCols: string[] = []
      const values: any[] = []
      const placeholders: string[] = []
      let i = 1

      if (COL.name && name != null)       { insertCols.push(COL.name);     values.push(name);     placeholders.push(`$${i++}`) }
      if (COL.lastname && lastname != null){ insertCols.push(COL.lastname); values.push(lastname); placeholders.push(`$${i++}`) }
      if (COL.email && email != null)     { insertCols.push(COL.email);    values.push(email);    placeholders.push(`$${i++}`) }
      if (COL.phone && phone != null)     { insertCols.push(COL.phone);    values.push(phone);    placeholders.push(`$${i++}`) }
      if (COL.birthday && birthday != null){insertCols.push(COL.birthday); values.push(birthday); placeholders.push(`$${i++}`) }

      let insertSql: string
      if (insertCols.length === 0) {
        insertSql = `insert into public.clients default values returning ${COL.id}`
      } else {
        insertSql = `
          insert into public.clients (${insertCols.join(', ')})
          values (${placeholders.join(', ')})
          returning ${COL.id}
        `
      }
      const created = await query(insertSql, values)
      clientId = created.rows[0].id
    } else {
      const sets: string[] = []
      const params: any[] = []
      let j = 1

      if (COL.name && name != null)        { sets.push(`${COL.name} = coalesce($${j++}, ${COL.name})`);           params.push(name) }
      if (COL.lastname && lastname != null){ sets.push(`${COL.lastname} = coalesce($${j++}, ${COL.lastname})`);   params.push(lastname) }
      if (COL.email && email != null)      { sets.push(`${COL.email} = coalesce($${j++}, ${COL.email})`);         params.push(email) }
      if (COL.phone && phone != null)      { sets.push(`${COL.phone} = coalesce($${j++}, ${COL.phone})`);         params.push(phone) }
      if (COL.birthday && birthday != null){ sets.push(`${COL.birthday} = coalesce($${j++}, ${COL.birthday})`);   params.push(birthday) }

      if (sets.length > 0) {
        const updSql = `
          update public.clients
             set ${sets.join(', ')}
           where ${COL.id} = $${j}
        `
        params.push(clientId)
        await query(updSql, params)
      }
    }

    // 5) asegurar membership
    const colsMembershipsRes = await query(
      `select column_name
         from information_schema.columns
        where table_schema = 'public'
          and table_name   = 'memberships'`
    )
    const Mset = new Set<string>(colsMembershipsRes.rows.map((r: any) => r.column_name))

    const ms = await query(
      `select id from public.memberships where business_id = $1 and client_id = $2 limit 1`,
      [businessId, clientId]
    )

    let membershipId: string
    if (ms.rows.length) {
      membershipId = ms.rows[0].id
    } else {
      const mCols: string[] = ['business_id', 'client_id']
      const mVals: any[] = [businessId, clientId]
      const mPh: string[] = ['$1', '$2']
      let k = 3

      if (Mset.has('stamps'))  { mCols.push('stamps');  mVals.push(0); mPh.push(`$${k++}`) }
      if (Mset.has('rewards')) { mCols.push('rewards'); mVals.push(0); mPh.push(`$${k++}`) }

      const ins = await query(
        `insert into public.memberships (${mCols.join(', ')})
         values (${mPh.join(', ')})
         returning id`,
        mVals
      )
      membershipId = ins.rows[0].id
    }

    return res.json({ ok: true, clientId, membershipId })
  } catch (e: any) {
    console.error('POST /api/public/register error:', e)
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' })
  }
})

export default router
