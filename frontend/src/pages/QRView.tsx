import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'

export default function QRView() {
  const { clientId } = useParams<{ clientId: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string>('tu negocio')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!clientId) return
      try {
        setLoading(true)
        setError(null)

        // 1) Intento principal: QR endpoint
        // Idealmente devuelve algo como { ok:true, qr:"data:image/png;base64,...", business:{ name } }
        const qrRes = await api(`/api/qr/${clientId}`)
        if (mounted && qrRes) {
          if (qrRes.qr) setQrUrl(qrRes.qr)
          // distintos backends posibles: business.name | businessName | business?.business_name
          const bname =
            qrRes.business?.name ??
            qrRes.businessName ??
            qrRes.business?.business_name ??
            null
          if (bname) setBusinessName(bname)
        }

        // 2) Fallback: si no pudimos sacar el nombre del negocio, probamos client endpoint
        if (mounted && (!qrRes || !qrRes.business?.name) && businessName === 'tu negocio') {
          try {
            // Muchos proyectos exponen /api/client/:id → { client, business? }
            const cliRes = await api(`/api/client/${clientId}`)
            const bname2 =
              cliRes?.business?.name ??
              cliRes?.client?.business?.name ??
              cliRes?.businessName ??
              null
            if (bname2) setBusinessName(bname2)
          } catch {
            /* ignoramos: es un fallback opcional */
          }
        }

        if (!qrRes?.qr) {
          // Si el endpoint no devolvió QR, lo marcamos como “pendiente”
          setError('No hemos podido cargar el QR del cliente.')
        }
      } catch (e) {
        console.error(e)
        setError('Ha ocurrido un error cargando el QR.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [clientId])

  const handleAppleWallet = () => {
    // Placeholder: más adelante conectamos a la generación/descarga del .pkpass
    alert('Próximamente: añadir a Apple Wallet')
  }

  const handleGoogleWallet = () => {
    // Placeholder: más adelante conectamos al enlace JWT Save to Google Wallet
    alert('Próximamente: añadir a Google Wallet')
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">
        Bienvenido al club VIP de <span className="text-brand">{businessName}</span>
      </h1>

      <div className="rounded-2xl border bg-white p-6 max-w-xl">
        {loading ? (
          <div className="text-gray-500">Cargando QR…</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="QR"
                  className="w-72 h-72 object-contain rounded-lg border"
                />
              ) : (
                <div className="w-72 h-72 rounded-lg border flex items-center justify-center text-gray-400">
                  QR no disponible
                </div>
              )}
            </div>

            <p className="text-center text-gray-600 mb-4">
              Muestra este código para sumar sellos y canjear recompensas.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={handleAppleWallet}
                className="px-4 py-2 rounded-lg bg-black text-white w-full"
              >
                Añadir a Apple Wallet
              </button>
              <button
                onClick={handleGoogleWallet}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 w-full"
              >
                Añadir a Google Wallet
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
