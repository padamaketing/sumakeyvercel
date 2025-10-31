import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Link } from 'react-router-dom'
import { useAuth } from '../state/store'

type Client = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  stamps?: number | null
  rewards_pending?: number | null
  last_scan_at?: string | null
}

function toCSV(rows: Client[]): string {
  const headers = ['id','name','email','phone','stamps','rewards_pending','last_scan_at']
  const csv = [headers.join(',')].concat(
    rows.map(r => headers.map(h => (r as any)[h] ?? '').join(','))
  )
  return csv.join('\n')
}

export default function Clients() {
  const { token } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return  // ⬅️ evita hacer la petición sin token
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        // ⬇️ token garantizado
        const res = await api<{clients: Client[]}>('/api/business/clients', { method: 'GET' }, token)
        if (!mounted) return
        setClients(res?.clients || [])
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'No se pudieron cargar los clientes')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [token]) // ⬅️ recarga al tener token

  function exportCSV() {
    const csv = toCSV(clients)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'clientes_sumakey.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-3 py-1.5 rounded-lg border text-sm">Exportar CSV</button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Cargando…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : clients.length === 0 ? (
        <div className="text-sm text-gray-600">Aún no hay clientes.</div>
      ) : (
        <div className="grid gap-3">
          {clients.map(c => (
            <div key={c.id} className="p-4 rounded-2xl border bg-white flex items-center justify-between">
              <div>
                <div className="font-medium">{c.name || '—'}</div>
                <div className="text-sm text-gray-600">{c.email || '—'}</div>
                <div className="text-sm text-gray-600">
                  Sellos: <b>{c.stamps ?? 0}</b> · Recompensas pendientes: <b>{c.rewards_pending ?? 0}</b>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/qr/${c.id}`} className="px-3 py-1.5 rounded-lg bg-brand text-white text-sm">Ver QR</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
