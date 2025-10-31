import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../state/store'

type Client = {
  id: string
  stamps?: number | null
  rewards_pending?: number | null
}

export default function Dashboard() {
  // 👉 fuente de verdad: store (sin estado 'biz' duplicado)
  const token = useAuth(s => s.token)
  const business = useAuth(s => s.business)
  const refreshMe = useAuth(s => s.refreshMe)

  const [stats, setStats] = useState({ clients: 0, stamps: 0, rewards: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // Estado del acordeón “Restaurante” persistente
  const [restaurantOpen, setRestaurantOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('sumakey:menu:restaurantOpen')
    return saved ? saved === '1' : true
  })
  const toggleRestaurant = () => {
    const next = !restaurantOpen
    setRestaurantOpen(next)
    localStorage.setItem('sumakey:menu:restaurantOpen', next ? '1' : '0')
  }

  // 🔄 Siempre que haya token, trae el negocio fresco al montar
  useEffect(() => {
    if (!token) return
    refreshMe()
  }, [token, refreshMe])

  // 🔔 Si Program guarda cambios, este listener refresca
  useEffect(() => {
    const onUpdated = () => { token && refreshMe() }
    window.addEventListener('sumakey:business-updated', onUpdated)
    return () => window.removeEventListener('sumakey:business-updated', onUpdated)
  }, [token, refreshMe])

  // 🔄 También refresca al volver a la pestaña
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && token) refreshMe()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [token, refreshMe])

  // KPIs
  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!token) return
      setLoading(true)
      setError('')
      try {
        let list: Client[] = []
        try {
          const r1 = await api<{ clients: Client[] }>('/api/business/clients', { method: 'GET' }, token)
          list = r1?.clients || []
        } catch {
          try {
            const r2 = await api<{ clients: Client[] }>('/api/clients', { method: 'GET' }, token)
            list = r2?.clients || []
          } catch {}
        }
        if (!mounted) return
        const clients = list.length
        const stamps = list.reduce((a, c) => a + (c.stamps ?? 0), 0)
        const rewards = list.reduce((a, c) => a + (c.rewards_pending ?? 0), 0)
        setStats({ clients, stamps, rewards })
      } catch (e: any) {
        if (mounted) setError(e?.message || 'No se pudieron cargar los datos')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [token, business?.id]) // si cambias de negocio, recalcula

  const slug = useMemo(() => business?.slug || '', [business?.slug])
  const rewardName = business?.reward_name ?? 'Recompensa'
  const rewardThreshold = business?.reward_threshold ?? 5

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 grid md:grid-cols-[240px_1fr] gap-6">
      {/* Sidebar */}
      <aside className="rounded-2xl border bg-white p-4">
        <div className="font-semibold mb-3">Panel</div>
        <nav className="grid gap-1 text-sm">
          <Link className="px-3 py-2 rounded-lg hover:bg-gray-100" to="/tarjetas">Tarjetas</Link>

          {/* Acordeón Restaurante */}
          <button
            onClick={toggleRestaurant}
            className="px-3 py-2 rounded-lg hover:bg-gray-100 text-left flex items-center justify-between"
            aria-expanded={restaurantOpen}
          >
            <span className="text-gray-500 font-semibold">Restaurante</span>
            <svg className={'h-4 w-4 transition-transform ' + (restaurantOpen ? 'rotate-90' : '')}
                 viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 6l6 4-6 4V6z" clipRule="evenodd" />
            </svg>
          </button>
          {restaurantOpen && (
            <div className="grid gap-1">
              <Link className="px-4 py-2 rounded-lg hover:bg-gray-100" to="/restaurante/general">General</Link>
              <Link className="px-4 py-2 rounded-lg hover:bg-gray-100" to="/restaurante/programas">Programa</Link>
              <Link className="px-4 py-2 rounded-lg hover:bg-gray-100" to="/restaurante/landing">Landing de alta</Link>
              <Link className="px-4 py-2 rounded-lg hover:bg-gray-100" to="/restaurante/diseno">Diseño</Link>
              <Link className="px-4 py-2 rounded-lg hover:bg-gray-100" to="/restaurante/qr-alta">QR de alta</Link>
              <Link className="px-4 py-2 rounded-lg hover:bg-gray-100" to="/restaurante/historial">Histórico</Link>
            </div>
          )}

          <div className="px-3 py-2 text-gray-500 font-semibold mt-2">Clientes</div>
          <Link className="px-4 py-2 rounded-lg hover:bg-gray-100" to="/clientes">Ver clientes</Link>
          <Link className="px-4 py-2 rounded-lg hover:bg-gray-100" to="/scan">Escanear</Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="grid gap-6">
        {/* Encabezado */}
        <div className="p-4 rounded-2xl border bg-white">
          <h2 className="text-xl font-semibold">
            {loading ? 'Cargando negocio…' : (business ? `Hola, ${business.name}` : 'Negocio no disponible')}
          </h2>
          {slug && (
            <div className="text-sm text-gray-600 mt-1">
              Página pública:{' '}
              <Link className="text-brand underline" to={`/public/${slug}`} target="_blank">
                /public/{slug}
              </Link>
            </div>
          )}
          {error && <div className="text-red-600 mt-2 text-sm break-all">{error}</div>}
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border bg-white">
            <div className="text-sm text-gray-500">Clientes</div>
            <div className="text-3xl font-extrabold">{stats.clients}</div>
          </div>
          <div className="p-4 rounded-2xl border bg-white">
            <div className="text-sm text-gray-500">Sellos</div>
            <div className="text-3xl font-extrabold">{stats.stamps}</div>
          </div>
          <div className="p-4 rounded-2xl border bg-white">
            <div className="text-sm text-gray-500">Recompensas</div>
            <div className="text-3xl font-extrabold">{stats.rewards}</div>
          </div>
        </div>

        {/* Accesos rápidos */}
        {business && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border bg-white">
              <h2 className="font-semibold mb-2">Gestionar tarjeta</h2>
              <p className="text-sm text-gray-600">
                {business.reward_name ?? 'Recompensa'} cada {rewardThreshold} sellos.
              </p>
              <div className="mt-3 flex gap-2">
                <Link to="/tarjetas" className="px-3 py-1.5 rounded-lg bg-brand text-white text-sm">Tarjetas</Link>
                <Link to={`/public/${slug}`} target="_blank" className="px-3 py-1.5 rounded-lg border text-sm">Landing pública</Link>
              </div>
            </div>
            <div className="p-4 rounded-2xl border bg-white">
              <h2 className="font-semibold mb-2">Accesos</h2>
              <div className="flex flex-wrap gap-2">
                <Link to="/clientes" className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm">Clientes</Link>
                <Link to="/scan" className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm">Escanear</Link>
                <Link to="/restaurante/diseno" className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm">Diseño Wallet</Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
