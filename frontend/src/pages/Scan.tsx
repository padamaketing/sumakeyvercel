import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode'

function useQuery() {
  const { search } = useLocation()
  return new URLSearchParams(search)
}

export default function Scan() {
  const q = useQuery()
  const [clientId, setClientId] = useState<string>('')
  const [input, setInput] = useState<string>('')
  const [preview, setPreview] = useState<any>(null)
  const [count, setCount] = useState<number>(1)
  const [countRedeem, setCountRedeem] = useState<number>(1)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [rewardMsg, setRewardMsg] = useState<string | null>(null)
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null)
  const [earnedNow, setEarnedNow] = useState<number>(0) // 👈 NUEVO
  const [error, setError] = useState<string | null>(null)

  // Cámara
  const [camOpen, setCamOpen] = useState(false)
  const [camError, setCamError] = useState<string | null>(null)
  const qrRef = useRef<Html5Qrcode | null>(null)
  const readerId = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`)

  // Detectar clientId por query
  useEffect(() => {
    const c = q.get('client') || q.get('clientId') || ''
    if (c) { setClientId(c); setInput(c) }
  }, [q])

  async function loadPreview(id: string) {
    try {
      setLoadingPreview(true)
      setError(null)
      const res = await api(`/api/scan/preview?client=${encodeURIComponent(id)}`)
      if (!res?.ok) { setPreview(null); setError(res?.error || 'No se pudo cargar la información del cliente.'); return }
      setPreview(res)
      // Ajustar por si el backend no manda canRedeem: lo inferimos
      const rewards = Number(res?.membership?.rewards ?? 0)
      setCountRedeem(rewards > 0 ? 1 : 1)
      setMessage(null); setRewardMsg(null); setRedeemMsg(null)
    } catch (e) {
      console.error(e); setError('Error cargando datos.')
    } finally {
      setLoadingPreview(false)
    }
  }

  useEffect(() => { if (clientId) loadPreview(clientId) }, [clientId])

  function parse(str: string) {
    try {
      const u = new URL(str)
      return u.searchParams.get('client') || u.searchParams.get('clientId') || str.trim()
    } catch { return str.trim() }
  }

  async function onSetClient() {
    const c = parse(input)
    if (!c) return setError('Introduce un ID de cliente o pega la URL del QR.')
    setClientId(c)
  }

  async function onAddStamps() {
    if (!clientId) return
    try {
      setSending(true)
      setError(null); setMessage(null); setRewardMsg(null); setRedeemMsg(null); setEarnedNow(0)
      const res = await api('/api/scan/add-stamp', { method: 'POST', body: JSON.stringify({ client: clientId, count }) })
      if (!res?.ok) { setError(res?.error || 'No se pudieron sumar los sellos.'); return }
      setMessage(res.messages?.stamp || 'Sellos sumados.')
      if (res.messages?.rewardMessage) setRewardMsg(res.messages.rewardMessage)
      // 👇 Si ha ganado recompensas en este escaneo, lo mostramos y preseleccionamos canje
      const earned = Number(res?.membership?.rewards_earned_now ?? 0)
      setEarnedNow(earned) // para mostrar una banda "¡Has ganado X recompensa(s)!"
      await loadPreview(clientId)
      // tras refrescar, usamos las recompensas actuales del preview para el input de canje
      const rewards = Number((res as any)?.membership?.rewards_after ?? (preview?.membership?.rewards ?? 0))
      setCountRedeem(Math.max(1, Number(rewards || 1)))
    } catch (e) {
      console.error(e); setError('Error al sumar sellos.')
    } finally {
      setSending(false)
    }
  }

  async function onRedeem() {
    if (!clientId) return
    try {
      setSending(true)
      setError(null); setMessage(null); setRewardMsg(null); setRedeemMsg(null)
      const res = await api('/api/scan/redeem', { method: 'POST', body: JSON.stringify({ client: clientId, count: countRedeem }) })
      if (!res?.ok) { setError(res?.error || 'No se pudo canjear el premio.'); return }
      setRedeemMsg(res.messages?.redeem || 'Premio canjeado.')
      await loadPreview(clientId)
    } catch (e) {
      console.error(e); setError('Error al canjear.')
    } finally { setSending(false) }
  }

  // Cámara (igual que la versión que ya te funciona)
  function openCamera() { setCamError(null); setMessage(null); setRewardMsg(null); setRedeemMsg(null); setCamOpen(true) }
  async function stopCamera() {
    try {
      if (qrRef.current) {
        const state = (qrRef.current as any).getState?.() as Html5QrcodeScannerState | undefined
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) await qrRef.current.stop()
        await qrRef.current.clear(); qrRef.current = null
      }
    } catch {} finally { setCamOpen(false) }
  }
  function onScanSuccess(text: string) { const c = parse(text); if (c) { setClientId(c); setInput(c); stopCamera() } }
  function onScanFailure(_e: any) {}
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!camOpen) return
      try {
        const el = document.getElementById(readerId.current) || (await new Promise(r => requestAnimationFrame(() => r(null))))
        if (!qrRef.current) {
          qrRef.current = new Html5Qrcode(readerId.current, { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false })
        }
        try {
          await qrRef.current.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, onScanSuccess, onScanFailure)
        } catch {
          const devices = await Html5Qrcode.getCameras()
          const camId = devices?.[0]?.id
          if (!camId) throw new Error('No cameras found')
          await qrRef.current.start(camId, { fps: 10, qrbox: 250 }, onScanSuccess, onScanFailure)
        }
      } catch (e) {
        if (!cancelled) { console.error('Cam init error', e); setCamError('No se pudo iniciar la cámara.'); stopCamera() }
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camOpen])

  useEffect(() => { return () => { stopCamera() } }, [])

  const availableRewards = Number(preview?.membership?.rewards ?? 0)
  const canRedeem = availableRewards > 0 // 👈 aseguramos botón si hay recompensas

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">Escanear / Sumar sellos</h1>

      {/* Entrada + cámara */}
      <div className="rounded-2xl border bg-white p-4 mb-4">
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-3">
          <input className="border rounded-lg px-3 py-2" placeholder="Pega aquí la URL del QR o el ID del cliente" value={input} onChange={e => setInput(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={onSetClient} className="px-4 py-2 rounded-lg bg-brand text-white">Cargar cliente</button>
            {!camOpen ? (
              <button onClick={openCamera} className="px-4 py-2 rounded-lg border">Abrir cámara</button>
            ) : (
              <button onClick={stopCamera} className="px-4 py-2 rounded-lg border">Detener cámara</button>
            )}
          </div>
        </div>
        {camOpen && <div className="mt-3"><div id={readerId.current} className="w-full max-w-sm aspect-square rounded-xl border mx-auto" /></div>}
      </div>

      {/* Panel */}
      <div className="rounded-2xl border bg-white p-4">
        {loadingPreview ? (
          <div className="text-gray-500">Cargando información…</div>
        ) : !clientId ? (
          <div className="text-gray-500">Introduce o detecta un cliente para continuar.</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : preview ? (
          <>
            {/* Aviso si en este escaneo se han ganado recompensas */}
            {earnedNow > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800">
                ¡Has ganado {earnedNow} recompensa{earnedNow > 1 ? 's' : ''}!
              </div>
            )}

            <div className="mb-3">
              <div className="text-sm text-gray-500">Negocio</div>
              <div className="font-medium">{preview.business?.name || '-'}</div>
            </div>
            <div className="mb-3">
              <div className="text-sm text-gray-500">Cliente</div>
              <div className="font-medium">{preview.client?.name || clientId}</div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-50">
                <div className="text-sm text-gray-500">Sellos actuales</div>
                <div className="font-semibold text-lg">{preview.membership?.stamps ?? 0}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50">
                <div className="text-sm text-gray-500">Premios disponibles</div>
                <div className="font-semibold text-lg">{availableRewards}</div>
              </div>
            </div>

            {preview.program?.reward_threshold ? (
              <div className="mt-3 text-sm text-gray-600">
                Premio: <b>{preview.program.reward_name || 'premio'}</b> cada <b>{preview.program.reward_threshold}</b> sellos.
              </div>
            ) : (
              <div className="mt-3 text-sm text-gray-600">Sin umbral de premio configurado.</div>
            )}

            {preview.expired ? (
              <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700">
                Tarjeta caducada. No es posible sumar sellos ni canjear.
              </div>
            ) : (
              <>
                {/* Sumar sellos */}
                <div className="mt-4 grid md:grid-cols-[160px_1fr_auto] gap-3 items-center">
                  <label className="text-sm">Sellos a sumar</label>
                  <input type="number" min={1} value={count} onChange={e => setCount(Math.max(1, Number(e.target.value || 1)))} className="border rounded-lg px-3 py-2 w-32" />
                  <button disabled={sending} onClick={onAddStamps} className="px-4 py-2 rounded-lg bg-brand text-white">
                    {sending ? 'Sumando…' : 'Sumar sellos'}
                  </button>
                </div>

                {/* Canjear premios (visible si hay recompensas) */}
                {canRedeem && (
                  <div className="mt-4 grid md:grid-cols-[160px_1fr_auto] gap-3 items-center">
                    <label className="text-sm">Canjear premios</label>
                    <input
                      type="number"
                      min={1}
                      max={availableRewards}
                      value={countRedeem}
                      onChange={e => setCountRedeem(Math.max(1, Math.min(availableRewards, Number(e.target.value || 1))))}
                      className="border rounded-lg px-3 py-2 w-32"
                    />
                    <button disabled={sending} onClick={onRedeem} className="px-4 py-2 rounded-lg bg-amber-500 text-white">
                      {sending ? 'Canjeando…' : 'Canjear premio(s)'}
                    </button>
                  </div>
                )}

                {/* Mensajes */}
                {message && <div className="mt-3 p-3 rounded-lg bg-green-50 text-green-700">{message}</div>}
                {rewardMsg && <div className="mt-2 p-3 rounded-lg bg-yellow-50 text-yellow-700">{rewardMsg}</div>}
                {redeemMsg && <div className="mt-2 p-3 rounded-lg bg-indigo-50 text-indigo-700">{redeemMsg}</div>}
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
