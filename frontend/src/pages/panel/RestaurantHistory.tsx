import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../state/store'

type Item = {
  id: string | null
  created_at: string
  client_id: string | null
  client_name: string | null
  stamps_added: number
  rewards_used: number
  payload: string | null
}

export default function RestaurantHistory() {
  const { token } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await api<{ ok: boolean; items: Item[]; total: number }>(
        '/api/restaurant/history?limit=100',
        {},
        token || undefined
      )
      if (!res || res.ok !== true || !Array.isArray(res.items)) {
        // si el backend devolviera algo raro
        setItems([])
      } else {
        setItems(res.items)
      }
    } catch (e: any) {
      console.error('history fetch error', e)
      setError(e?.message || 'fetch_failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  const filtered = useMemo(
    () =>
      items.filter(it =>
        (it.client_name || '').toLowerCase().includes(q.trim().toLowerCase())
      ),
    [items, q]
  )

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <h1 className="text-xl font-semibold mb-4">Histórico de escaneos</h1>

      <div className="flex gap-2 items-center mb-3">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          placeholder="Buscar por nombre de cliente..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <button
          onClick={load}
          className="px-4 py-2 rounded-lg bg-brand text-white text-sm"
        >
          Refrescar
        </button>
      </div>

      <div className="text-xs text-gray-500 mb-2">
        Mostrando {filtered.length} de {items.length} registros.
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2">Fecha</th>
              <th className="text-left px-4 py-2">Cliente</th>
              <th className="text-left px-4 py-2">Acción</th>
              <th className="text-left px-4 py-2">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="px-4 py-3 text-gray-500" colSpan={4}>Cargando…</td></tr>
            )}
            {!loading && error && (
              <tr><td className="px-4 py-3 text-red-600" colSpan={4}>Error cargando historial.</td></tr>
            )}
            {!loading && !error && filtered.length === 0 && (
              <tr><td className="px-4 py-3 text-gray-500" colSpan={4}>Sin datos.</td></tr>
            )}
            {!loading && !error && filtered.map((it, i) => {
              const when = it.created_at ? new Date(it.created_at).toLocaleString() : ''
              const action =
                it.stamps_added > 0 ? `+${it.stamps_added} sello(s)` :
                it.rewards_used > 0 ? `Canje x${it.rewards_used}` :
                '—'
              return (
                <tr key={it.id || `${i}-${it.created_at}`}>
                  <td className="px-4 py-2">{when}</td>
                  <td className="px-4 py-2">{it.client_name || '—'}</td>
                  <td className="px-4 py-2">{action}</td>
                  <td className="px-4 py-2">{it.payload || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
