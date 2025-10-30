// src/pages/PublicRegister.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'

type FieldsConfig = {
  name: boolean
  lastname: boolean
  email: boolean
  phone: boolean
  birthday: boolean
}
type LegalConfig = {
  businessName: string
  email: string
  phone: string
  terms: string
  privacy: string
}
type LandingConfig = {
  formTitle: string
  headerText: string
  buttonText: string
  logoUrl: string
  fields: FieldsConfig
  legal: LegalConfig
}

export default function PublicRegister() {
  const { slug } = useParams()
  const nav = useNavigate()

  const [cfg, setCfg] = useState<LandingConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Campos
  const [name, setName] = useState('')
  const [lastname, setLastname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [birthday, setBirthday] = useState('') // YYYY-MM-DD

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await api(`/api/public/landing/${slug}`)
        if (mounted && res?.ok) setCfg(res.config as LandingConfig)
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [slug])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!slug) return

    try {
      setSending(true)
      const res = await api('/api/public/register', {
        method: 'POST',
        body: {
          slug,
          name: name || null,
          lastname: lastname || null,
          email: email || null,
          phone: phone || null,
          // el backend ya acepta birthday o birthdate
          birthday: birthday || null,
        }
      })

      if (!res?.ok || !res?.clientId) {
        setError(typeof res?.error === 'string' ? res.error : 'No se pudo completar el registro.')
        setSending(false)
        return
      }

      nav(`/qr/${res.clientId}`, { replace: true })
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'No se pudo completar el registro.')
    } finally {
      setSending(false)
    }
  }

  if (loading || !cfg) return <div className="max-w-md mx-auto p-6">Cargando…</div>

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex justify-center mb-2">
        {cfg.logoUrl && <img src={cfg.logoUrl} className="h-10 object-contain" />}
      </div>
      <h1 className="text-2xl font-semibold text-center">{cfg.formTitle}</h1>
      <p className="text-center text-gray-600">{cfg.headerText}</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        {cfg.fields.name && (
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Nombre"
                 value={name} onChange={e => setName(e.target.value)} />
        )}
        {cfg.fields.lastname && (
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Apellidos"
                 value={lastname} onChange={e => setLastname(e.target.value)} />
        )}
        {cfg.fields.email && (
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Email" type="email"
                 value={email} onChange={e => setEmail(e.target.value)} />
        )}
        {cfg.fields.phone && (
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Teléfono"
                 value={phone} onChange={e => setPhone(e.target.value)} />
        )}
        {cfg.fields.birthday && (
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Fecha de cumpleaños"
                 type="date" value={birthday} onChange={e => setBirthday(e.target.value)} />
        )}

        <button disabled={sending} className="w-full px-4 py-2 rounded-lg bg-brand text-white">
          {sending ? 'Enviando…' : (cfg.buttonText || 'Registrarme')}
        </button>

        {error && <div className="text-sm text-red-600 break-all">{error}</div>}
      </form>

      <div className="mt-4 text-xs text-gray-500 space-y-2">
        <div><b>Empresa:</b> {cfg.legal.businessName} · {cfg.legal.email} · {cfg.legal.phone}</div>
        <div><b>Términos:</b> {cfg.legal.terms}</div>
        <div><b>Privacidad:</b> {cfg.legal.privacy}</div>
      </div>
    </div>
  )
}
