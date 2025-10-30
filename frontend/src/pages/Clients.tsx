import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../state/store'
import { Link } from 'react-router-dom'

function toCSV(rows: any[]): string {
  const headers = ['id','name','email','phone','stamps','rewards_pending','last_scan_at']
  const csv = [headers.join(',')].concat(
    rows.map(r => headers.map(h => (r[h] ?? '')).join(','))
  )
  return csv.join('\n')
}

export default function Clients() {
  const { token } = useAuth()
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      const res = await api<{clients:any[]}>('/api/business/clients', {}, token || undefined)
      setClients(res.clients)
    })().catch(console.error)
  }, [token])

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
          {/* PDF lo hacemos en el siguiente hito */}
        </div>
      </div>
      <div className="grid gap-3">
        {clients.map(c => (
          <div key={c.id} className="p-4 rounded-2xl border bg-white flex items-center justify-between">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-gray-600">{c.email || '—'}</div>
              <div className="text-sm text-gray-600">Sellos: <b>{c.stamps}</b> · Recompensas pendientes: <b>{c.rewards_pending}</b></div>
            </div>
            <div className="flex gap-2">
              <Link to={`/qr/${c.id}`} className="px-3 py-1.5 rounded-lg bg-brand text-white text-sm">Ver QR</Link>
            </div>
          </div>
        ))}
        {clients.length === 0 && <div className="text-sm text-gray-600">Aún no hay clientes.</div>}
      </div>
    </div>
  )
}
