import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../state/store'

type Tab = 'general' | 'vencimiento'

export default function RestaurantGeneral() {
  const { token } = useAuth()

  // tabs
  const [tab, setTab] = useState<Tab>('general')

  // ------- Estado VENCIMIENTO (conectado a backend) -------
  type Mode = 'none' | 'fixed_date' | 'days_from_signup'
  const [mode, setMode] = useState<Mode>('none')
  const [fixedDate, setFixedDate] = useState<string>('')     // YYYY-MM-DD
  const [daysFromSignup, setDaysFromSignup] = useState<number>(30)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Cargar ajustes actuales (incluye caducidad)
  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ business: any }>(
          '/api/restaurant/settings',
          {},
          token || undefined
        )
        const b = res.business
        setMode((b.card_expiration_mode || 'none') as Mode)
        setFixedDate(b.card_expiration_date || '')
        setDaysFromSignup(b.card_expiration_days || 30)
      } catch (e: any) {
        console.error(e)
        setErrorMsg(e.message || 'No se pudo cargar la configuración')
      }
    })()
  }, [token])

  async function saveVencimiento() {
    setSaving(true); setSavedMsg(null); setErrorMsg(null)
    try {
      const body: any = { mode }
      if (mode === 'fixed_date') body.date = fixedDate
      if (mode === 'days_from_signup') body.days = daysFromSignup

      // ⬇️ Enviamos OBJETO (el helper ya hace JSON.stringify)
      const res = await api<{ ok: boolean; business: any }>(
        '/api/restaurant/expiration',
        { method: 'POST', body },
        token || undefined
      )

      // Sincroniza estado con lo que devuelve el backend
      const b = res.business
      if (b) {
        setMode((b.card_expiration_mode || 'none') as Mode)
        setFixedDate(b.card_expiration_date || '')
        setDaysFromSignup(b.card_expiration_days || 30)
      }

      setSavedMsg('Guardado correctamente ✅')
    } catch (e: any) {
      setErrorMsg(e.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
      setTimeout(() => setSavedMsg(null), 2000)
    }
  }

  function resetVencimiento() {
    // recarga de servidor
    setSavedMsg(null); setErrorMsg(null)
    ;(async () => {
      try {
        const res = await api<{ business: any }>(
          '/api/restaurant/settings',
          {},
          token || undefined
        )
        const b = res.business
        setMode((b.card_expiration_mode || 'none') as Mode)
        setFixedDate(b.card_expiration_date || '')
        setDaysFromSignup(b.card_expiration_days || 30)
      } catch (e: any) {
        setErrorMsg(e.message || 'No se pudo recargar la configuración')
      }
    })()
  }

  // ------- UI: General (placeholder) -------
  const GeneralForm = () => (
    <div className="grid md:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre de la tarjeta (uso interno)</label>
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Restaurante" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Título de la tarjeta</label>
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Tu tarjeta de fidelidad" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Nombre comercial del emisor</label>
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Ej. Mas Que Bocados" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Tipo tarjeta</label>
        <select className="w-full border rounded-lg px-3 py-2">
          <option>Stamp Card</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Estado tarjeta</label>
        <select className="w-full border rounded-lg px-3 py-2">
          <option>Publicada</option>
          <option>Borrador</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Descripción de la tarjeta</label>
        <textarea className="w-full border rounded-lg px-3 py-2" rows={4} placeholder="• Por cada menú consumido, recibirás un sello."></textarea>
      </div>

      <div className="mt-2 flex gap-2">
        <button className="px-4 py-2 rounded-lg bg-gray-200">Cancelar</button>
        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Cerrar</button>
        <button className="px-4 py-2 rounded-lg bg-brand text-white">Guardar</button>
      </div>
    </div>
  )

  // —— Helpers visuales de vencimiento
  const isFixedDateExpired = (): boolean => {
    if (mode !== 'fixed_date' || !fixedDate) return false
    const now = new Date()
    const end = new Date(`${fixedDate}T00:00:00`)
    return now >= end
  }

  const VencimientoForm = () => (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden border">
        <div className="bg-blue-700 text-white px-4 py-2 font-semibold">Vencimiento (Opcional)</div>
        <div className="p-4 text-sm text-gray-700">
          Puedes configurar tu tarjeta para que caduque en una fecha específica o pasado un plazo desde el alta.
          La caducidad se aplica a las 00:00:00 de la fecha indicada.
        </div>
      </div>

      {/* Avisos visuales */}
      {mode === 'fixed_date' && fixedDate && isFixedDateExpired() && (
        <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm px-3 py-2">
          🔴 Las tarjetas están <b>CADUCADAS</b> desde el {fixedDate}. No se podrán añadir sellos al escanear.
        </div>
      )}
      {mode === 'days_from_signup' && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm px-3 py-2">
          🛈 Caducidad <b>{daysFromSignup} días</b> desde el alta del cliente. Algunos clientes ya dados de alta podrían estar caducados.
        </div>
      )}

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode"
            checked={mode === 'none'}
            onChange={() => setMode('none')}
          />
          <span>Sin fecha de vencimiento</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode"
            checked={mode === 'fixed_date'}
            onChange={() => setMode('fixed_date')}
          />
          <span>A una fecha determinada</span>
        </label>
        <div className="pl-6">
          <input
            type="date"
            className="border rounded-lg px-3 py-2"
            disabled={mode !== 'fixed_date'}
            value={fixedDate || ''}
            onChange={(e)=>setFixedDate(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode"
            checked={mode === 'days_from_signup'}
            onChange={() => setMode('days_from_signup')}
          />
          <span>Plazo fijo desde el alta</span>
        </label>
        <div className="pl-6 flex items-center gap-2">
          <input
            type="number"
            min={1}
            className="border rounded-lg px-3 py-2 w-32"
            disabled={mode !== 'days_from_signup'}
            value={daysFromSignup}
            onChange={(e)=>setDaysFromSignup(Math.max(1, parseInt(e.target.value || '1')))}
          />
          <span>días</span>
        </div>
      </div>

      {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}
      {savedMsg && <div className="text-sm text-green-600">{savedMsg}</div>}

      <div className="flex gap-2">
        <button onClick={resetVencimiento} className="px-4 py-2 rounded-lg bg-gray-200">Cancelar</button>
        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Cerrar</button>
        <button
          onClick={saveVencimiento}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-brand text-white disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-semibold mb-4">Información general</h1>

      {/* Subtabs (sin Opciones) */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={()=>setTab('general')}
          className={'px-3 py-2 rounded-lg text-sm ' + (tab==='general' ? 'bg-blue-600 text-white' : 'bg-gray-100')}
        >
          General
        </button>
        <button
          onClick={()=>setTab('vencimiento')}
          className={'px-3 py-2 rounded-lg text-sm ' + (tab==='vencimiento' ? 'bg-blue-600 text-white' : 'bg-gray-100')}
        >
          Vencimiento
        </button>
      </div>

      {/* Contenido de la pestaña */}
      <div className="rounded-2xl border bg-white p-4">
        {tab === 'general' && <GeneralForm />}
        {tab === 'vencimiento' && <VencimientoForm />}
      </div>
    </div>
  )
}
