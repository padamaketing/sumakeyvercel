import { useEffect, useState } from 'react'
import { useAuth } from '../../state/store'
import QRCode from 'qrcode'

export default function RestaurantQRSignup() {
  const { business } = useAuth()
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      if (!business) return
      const url = `${window.location.origin}/public/${business.slug}`
      const png = await QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 1, width: 320 })
      setDataUrl(png)
    })()
  }, [business])

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-semibold mb-3">QR de alta</h1>
      <p className="text-sm text-gray-600 mb-3">Imprime este QR y colócalo en mesas/mostrador para que los clientes se registren.</p>
      {dataUrl && (
        <div className="p-4 rounded-2xl border bg-white inline-block">
          <img src={dataUrl} alt="QR alta" className="w-[320px] h-[320px]" />
        </div>
      )}
    </div>
  )
}
