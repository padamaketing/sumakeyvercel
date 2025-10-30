import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../state/store'

type Program = {
  reward_threshold: number
  reward_name: string
  reward_product_code?: string
  reward_description?: string
  msg_stamp_one: string
  msg_stamp_many: string
  msg_reward_earned_one: string
  msg_reward_earned_many: string
  msg_reward_redeem_one: string
  msg_reward_redeem_many: string
}

export default function RestaurantProgram() {
  const { token } = useAuth()
  const [form, setForm] = useState<Program>({
    reward_threshold: 10,
    reward_name: 'Premio',
    reward_product_code: '',
    reward_description: '',
    msg_stamp_one: '{nombre} ha conseguido 1 sello',
    msg_stamp_many: '{nombre} ha conseguido {#} sellos',
    msg_reward_earned_one: '{nombre} ha conseguido 1 {premio}',
    msg_reward_earned_many: '{nombre} ha conseguido {#} {premio}',
    msg_reward_redeem_one: '{nombre} ha canjeado 1 {premio}',
    msg_reward_redeem_many: '{nombre} ha canjeado {#} {premio}',
  })
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await api<{program: Program}>('/api/restaurant/program', {}, token || undefined)
        setForm(res.program)
      } catch (e:any) {
        setErrorMsg(e.message || 'No se pudo cargar Programa')
      }
    })()
  }, [token])

  function set<K extends keyof Program>(k: K, v: Program[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function save() {
    setSaving(true); setSavedMsg(null); setErrorMsg(null)
    try {
      await api('/api/restaurant/program', {
        method: 'POST',
        body: JSON.stringify(form)
      }, token || undefined)
      setSavedMsg('Guardado correctamente ✅')
    } catch (e:any) {
      setErrorMsg(e.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
      setTimeout(()=>setSavedMsg(null), 2000)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
      <h1 className="text-2xl font-semibold">Programa</h1>

      <div className="rounded-xl border overflow-hidden">
        <div className="bg-blue-700 text-white px-4 py-2 font-semibold">Programa activo</div>
        <div className="p-4 text-sm text-gray-700">Configura tu programa de sellos.</div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="bg-blue-700 text-white px-4 py-2 font-semibold">Configuración del programa</div>
        <div className="p-4 grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Número de sellos en la tarjeta</label>
            <input type="number" min={1}
              className="w-full border rounded-lg px-3 py-2"
              value={form.reward_threshold || 1}
              onChange={e => set('reward_threshold', Math.max(1, parseInt(e.target.value || '1')))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Mensaje tras conseguir un sello (singular)</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.msg_stamp_one}
              onChange={e => set('msg_stamp_one', e.target.value)}
              placeholder="{nombre} ha conseguido 1 sello"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Mensaje tras conseguir sellos (plural)</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.msg_stamp_many}
              onChange={e => set('msg_stamp_many', e.target.value)}
              placeholder="{nombre} ha conseguido {#} sellos"
            />
            <p className="text-xs text-gray-500 mt-1">Puedes incluir <code>{'{#}'}</code> para indicar la cantidad.</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="bg-blue-700 text-white px-4 py-2 font-semibold">Premio</div>
        <div className="p-4 grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del premio</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.reward_name}
              onChange={e => set('reward_name', e.target.value)}
              placeholder="Menú Gratis"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Código producto / artículo</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.reward_product_code || ''}
              onChange={e => set('reward_product_code', e.target.value)}
              placeholder="PREM1"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Descripción del premio / vale</label>
            <textarea rows={3} className="w-full border rounded-lg px-3 py-2"
              value={form.reward_description || ''}
              onChange={e => set('reward_description', e.target.value)}
              placeholder="• Por cada 10 sellos conseguidos, recibirás un Menú Gratis !!"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Mensaje al conseguir premio (singular)</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.msg_reward_earned_one}
              onChange={e => set('msg_reward_earned_one', e.target.value)}
              placeholder="{nombre} ha conseguido 1 {premio}"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Mensaje al conseguir premio (plural)</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.msg_reward_earned_many}
              onChange={e => set('msg_reward_earned_many', e.target.value)}
              placeholder="{nombre} ha conseguido {#} {premio}"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Mensaje al canjear premio (singular)</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.msg_reward_redeem_one}
              onChange={e => set('msg_reward_redeem_one', e.target.value)}
              placeholder="{nombre} ha canjeado 1 {premio}"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Mensaje al canjear premio (plural)</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.msg_reward_redeem_many}
              onChange={e => set('msg_reward_redeem_many', e.target.value)}
              placeholder="{nombre} ha canjeado {#} {premio}"
            />
          </div>
        </div>
      </div>

      {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}
      {savedMsg && <div className="text-sm text-green-600">{savedMsg}</div>}

      <div className="flex gap-2">
        <button className="px-4 py-2 rounded-lg bg-gray-200">Cancelar</button>
        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Cerrar</button>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-brand text-white disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
