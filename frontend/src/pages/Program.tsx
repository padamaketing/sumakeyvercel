import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../state/store'

export default function Program() {
  const { token } = useAuth()
  const [rewardName, setRewardName] = useState('Café gratis')
  const [rewardThreshold, setRewardThreshold] = useState(10)
  const [saved, setSaved] = useState<string | null>(null) // ✅ tipado

  useEffect(() => {
    (async () => {
      const res = await api('/api/auth/me', {}, token || undefined)
      // añadimos ? por si faltara algo y evitar crasheos en build
      setRewardName(res?.business?.reward_name ?? 'Café gratis')
      setRewardThreshold(res?.business?.reward_threshold ?? 10)
    })().catch(console.error)
  }, [token])

  async function save() {
    const res = await api(
      '/api/program',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // ✅ por si acaso
        body: JSON.stringify({ rewardName, rewardThreshold })
      },
      token || undefined
    )
    setRewardName(res?.business?.reward_name ?? rewardName)
    setRewardThreshold(res?.business?.reward_threshold ?? rewardThreshold)
    setSaved('Guardado ✅')
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Programa de sellos</h1>
      <div className="space-y-3">
        <input
          className="w-full border rounded-lg px-3 py-2"
          value={rewardName}
          onChange={(e) => setRewardName(e.target.value)}
        />
        <input
          type="number"
          className="w-full border rounded-lg px-3 py-2"
          value={rewardThreshold}
          onChange={(e) =>
            setRewardThreshold(Number.parseInt(e.target.value || '1', 10))
          }
        />
        <button
          onClick={save}
          className="w-full bg-brand text-white px-4 py-2 rounded-lg"
        >
          Guardar
        </button>
        {saved && <div className="text-green-600 text-sm">{saved}</div>}
      </div>
    </div>
  )
}
