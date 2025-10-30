import { useEffect, useMemo } from 'react'
import { useAuth } from '../state/store'
import { Link } from 'react-router-dom'

function getStoredBusiness() {
  try {
    const raw = localStorage.getItem('sumakey:business')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function Dashboard() {
  const { business, refreshMe, token } = useAuth()

  useEffect(() => {
    if (token && !business) {
      refreshMe().catch(() => {})
    }
  }, [token, business, refreshMe])

  const b = useMemo(() => business || getStoredBusiness(), [business])
  const slug = b?.slug || ''

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="bg-white border rounded-xl p-4 mb-6">
        <h1 className="text-2xl font-semibold">Hola, {b?.name || '—'}</h1>
        <div className="text-sm mt-2">
          Página pública:{' '}
          {slug ? (
            <Link to={`/public/${slug}`} className="text-brand underline">/public/{slug}</Link>
          ) : (
            <span className="text-gray-500">—</span>
          )}
        </div>
      </div>

      {/* …tus tarjetas/kpis existentes… */}
    </div>
  )
}
