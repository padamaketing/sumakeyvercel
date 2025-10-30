import { Router } from 'express'
import { query } from '../db'
import QRCode from 'qrcode'

export const qrRouter = Router()

/**
 * GET /api/qr/:clientId
 * Devuelve el QR del cliente como dataURL PNG + nombre del negocio.
 */
qrRouter.get('/qr/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params
    if (!clientId) return res.status(400).json({ ok: false, error: 'CLIENT_ID_REQUIRED' })

    // 1) Nombre del negocio del cliente (vía memberships)
    const biz = await query(
      `
      select b.name as business_name
        from public.memberships m
        join public.businesses b on b.id = m.business_id
       where m.client_id = $1
       limit 1
      `,
      [clientId]
    )
    const businessName = biz.rows?.[0]?.business_name || 'tu negocio'

    // 2) Payload a codificar en el QR (URL del endpoint de escaneo)
    const host = req.get('host') || 'localhost:4000'
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http'
    const payload = `${proto}://${host}/api/scan/add-stamp?client=${encodeURIComponent(clientId)}`

    // 3) Generar QR como dataURL PNG
    const dataUrl = await QRCode.toDataURL(payload, { width: 512, margin: 1 })

    return res.json({
      ok: true,
      qr: dataUrl,               // <- lo que pinta el <img />
      payload,                   // <- útil para debug
      business: { name: businessName }
    })
  } catch (e: any) {
    console.error('GET /api/qr/:clientId error:', e)
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' })
  }
})
