import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../state/store'

type Program = {
  reward_threshold?: number | null
  reward_name?: string | null
  reward_product_code?: string | null
  reward_description?: string | null
}

export default function Program() {
  // Usa selectores para evitar re-renders innecesarios y tipos claros
  const token = useAuth(s => s.token)
  const refreshMe = useAuth(s => s.refreshMe)

  const [program, setProgram] = useState<Program>({
    reward_threshold: 5,
    reward_name: 'Café gratis',
    reward_product_code: '',
    reward_description: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await api<{ program: Program }>(
          '/api/restaurant/program',
          { method: 'GET' },
          token || undefined
        )
        if (!mounted) return
        if (res?.program) setProgram(res.program)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'No se pudo cargar el programa')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [token])

  async function refreshBusinessCache() {
    if (!token) return
    try {
      const me = await api<{ business: any }>(
        '/api/auth/me',
        { method: 'GET' },
        token || undefined
      )
      if (me?.business) {
        localStorage.setItem('sumakey:business', JSON.stringify(me.business))
      }
      // Esto actualiza el store (y el Dashboard re-renderiza con el nuevo threshold)
      await refreshMe()
    } catch {
      // silencioso
    }
  }

  const save = async () => {
    if (!token) return
    setSaving(true)
    setMsg(null)
    try {
      const r = await api<{ ok: boolean; program: Program }>(
        '/api/restaurant/program',
        { method: 'POST', body: program },
        token || undefined
      )
      if (r?.program) setProgram(r.program)
      await refreshBusinessCache()
      setMsg('Programa guardado')
    } catch (e: any) {
      setMsg(e?.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(null), 2500)
    }
  }

  // Helpers para evitar pasar null/undefined a los inputs (TS rojo)
  const rewardName = program.reward_name ?? ''
  const rewardThreshold =
    Number.isFinite(program.reward_threshold ?? 1) ? (program.reward_threshold as number) : 1
  const rewardCode = program.reward_product_code ?? ''
  const rewardDesc = program.reward_description ?? ''

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-semibold mb-4">Programa</h1>

      {loading ? (
        <div className="text-sm text-gray-500">Cargando…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <div className="bg-white border rounded-xl p-4 grid gap-4">
          <div>
            <label className="text-sm font-medium">Nombre de la recompensa</label>
            <input
              className="border rounded-lg px-3 py-2 w-full"
              value={rewardName}
              onChange={(e) => setProgram((p) => ({ ...p, reward_name: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Sellos necesarios</label>
            <input
              type="number"
              min={1}
              className="border rounded-lg px-3 py-2 w-full"
              value={rewardThreshold}
              onChange={(e) =>
                setProgram((p) => ({
                  ...p,
                  reward_threshold: Math.max(1, Number(e.target.value) || 1),
                }))
              }
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Código producto (opcional)</label>
              <input
                className="border rounded-lg px-3 py-2 w-full"
                value={rewardCode}
                onChange={(e) => setProgram((p) => ({ ...p, reward_product_code: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción (opcional)</label>
              <input
                className="border rounded-lg px-3 py-2 w-full"
                value={rewardDesc}
                onChange={(e) => setProgram((p) => ({ ...p, reward_description: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-brand text-white">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            {msg && <span className="text-sm text-gray-600">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
