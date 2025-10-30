// frontend/src/pages/Dashboard.tsx
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../state/store'
import { Link } from 'react-router-dom'

type Client = {
  id: string
  stamps?: number
  rewards_pending?: number
}

export default function Dashboard() {
  const { token, business, refreshMe } = useAuth()
  const [biz, setBiz] = useState<any>(business)
  const [stats, setStats] = useState({ clients: 0, stamps: 0, rewards: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // ⬇️ Estado del acordeón "Restaurante" (persistente)
  const [restaurantOpen, setRestaurantOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('sumakey:menu:restaurantOpen')
    return saved ? saved === '1' : true
  })
  const toggleRestaurant = () => {
    const next = !restaurantOpen
    setRestaurantOpen(next)
    localStorage.setItem('sumakey:menu:restaurantOpen', next ? '1' : '0')
  }

  // Carga de negocio + stats
  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError('')

      try {
        // 1) Asegura negocio
        let currentBiz = business
        if (!currentBiz && token) {
          await refreshMe().catch(() => {})
          currentBiz = (await api<{ business: any }>('/api/auth/me', {}, token || undefined)).business
        } else if (!currentBiz && token) {
          // fallback a /api/auth/me si el store no lo populó aún
          currentBiz = (await api<{ business: any }>('/api/auth/me', {}, token || undefined)).business
        }

        if (mounted) setBiz(currentBiz)

        // 2) Stats de clientes con fallback de endpoint
        async function fetchStats() {
          let list: Client[] = []
          try {
            const r1 = await api<{ clients: Client[] }>('/api/business/clients', {}, token || undefined)
            list = r1.clients
          } catch {
            // fallback: algunos proyectos exponen /api/clients
            const r2 = await api<{ clients: Client[] }>('/api/clients', {}, token || undefined)
            list = r2.clients
          }

          const clients = list.length
          const stamps = list.reduce((a, c) => a + (c.stamps || 0), 0)
          const rewards = list.reduce((a, c) => a + (c.rewards_pending || 0), 0)
          return { clients, stamps, rewards }
        }

        const s = await fetchStats()
        if (mounted) setStats(s)
      } catch (e: any) {
        if (mounted) setError(e?.message || 'No se pudieron cargar los datos')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [token, business, refreshMe])

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 grid md:grid-cols-[240px_1fr] gap-6">
      {/* Sidebar */}
      <aside className="rounded-2xl border bg-white p-4">
        <div className="font-semibold mb-3">Panel</div>
        <nav className="grid gap-1 text-sm">
          <Link className="px-3 py-2 rounded-lg hover:bg-gray-100" to="/tarjetas">Tarjetas</Link>

          {/* --- Acordeón Restaurante --- */}
          <button
            onClick={toggleRestaurant}
            className="px-3 py-2 rounded-lg hover:bg-gray-100 text-left flex items-center justify-between"
            aria-expanded={restaurantOpen}
          >
            <span className="text-gray-500 font-semibold">Restaurante</span>
            <svg
              className={'h-4 w-4 transition-transform ' + (restaurantOpen ? 'rotate-90' : '')}
              viewBox="0 0 20 20" fill="currentColor"
            >
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
          {/* --- Fin acordeón --- */}

          <div className="px-3 py-2 text-gray-500 font-semibold">Clientes</div>
          <Link className="px-4 py-2 rounded-lg hover:bg-gray-100" to="/clientes">Ver clientes</Link>
          <Link className="px-4 py-2 rounded-lg hover:bg-gray-100" to="/scan">Escanear</Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="grid gap-6">
        {/* Encabezado negocio */}
        <div className="p-4 rounded-2xl border bg-white">
          <h2 className="text-xl font-semibold">
            {loading ? 'Cargando negocio…' : (biz ? `Hola, ${biz.name}` : 'Negocio no disponible')}
          </h2>
          {biz?.slug && (
            <div className="text-sm text-gray-500 mt-1">
              Página pública:{' '}
              <a
                href={`/public/${biz.slug}`}
                className="underline text-blue-600"
                target="_blank"
                rel="noreferrer"
              >
                /public/{biz.slug}
              </a>
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
        {biz && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border bg-white">
              <h2 className="font-semibold mb-2">Gestionar tarjeta</h2>
              <p className="text-sm text-gray-600">
                {biz.reward_name} cada {biz.reward_threshold} sellos.
              </p>
              <div className="mt-3 flex gap-2">
                <Link to="/tarjetas" className="px-3 py-1.5 rounded-lg bg-brand text-white text-sm">Tarjetas</Link>
                <Link to={`/public/${biz.slug}`} target="_blank" className="px-3 py-1.5 rounded-lg border text-sm">Landing pública</Link>
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
