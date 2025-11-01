import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../state/store'
import PhonePreview from './_PhonePreview'
import { api } from '../../lib/api'

type FieldsConfig = { name: boolean; lastname: boolean; email: boolean; phone: boolean; birthday: boolean }
type LegalConfig = { businessName: string; email: string; phone: string; terms: string; privacy: string }
type LandingConfig = {
  formTitle: string
  headerText: string
  buttonText: string
  logoUrl: string
  fields: FieldsConfig
  legal: LegalConfig
}

const DEFAULT_CFG: LandingConfig = {
  formTitle: 'Únete a nuestro club',
  headerText: 'Regístrate y recoge sellos con cada visita.',
  buttonText: 'Registrarme',
  logoUrl: '',
  fields: { name: true, lastname: true, email: true, phone: true, birthday: false },
  legal: {
    businessName: 'Nombre del negocio',
    email: 'contacto@tunegocio.com',
    phone: '+34 600 000 000',
    terms: 'Texto legal completo…',
    privacy: 'Describe tu política de privacidad…',
  },
}

function getStoredBusinessSlug(): string | null {
  try {
    const raw = localStorage.getItem('sumakey:business')
    if (!raw) return null
    const obj = JSON.parse(raw)
    return typeof obj?.slug === 'string' ? obj.slug : null
  } catch {
    return null
  }
}

export default function RestaurantLanding() {
  const { business, token } = useAuth()

  const resolvedSlug = useMemo(() => business?.slug || getStoredBusinessSlug() || '', [business?.slug])

  const publicUrl = useMemo(() => {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return resolvedSlug ? `${base}/public/${resolvedSlug}` : ''
  }, [resolvedSlug])

  const [tab, setTab] = useState<'landing' | 'fields' | 'legal'>('landing')
  const [cfg, setCfg] = useState<LandingConfig>(DEFAULT_CFG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  // ─────────────────────────────
  // Nueva función: carga SIEMPRE desde el backend
  // ─────────────────────────────
  async function loadLanding() {
    if (!token) return
    try {
      setLoading(true)
      // GET explícito para evitar defaults/POST involuntarios
      const res = await api<{ ok?: boolean; config?: LandingConfig }>(
        '/api/restaurant/landing',
        { method: 'GET' },
        token || undefined
      )
      if (res?.config) {
        setCfg(res.config)
      }
    } catch (e) {
      // No machacar con DEFAULT_CFG si falla; dejamos lo que hubiera en pantalla
      console.error('Error loading landing config:', e)
    } finally {
      setLoading(false)
    }
  }

  // Cargar al entrar
  useEffect(() => {
    loadLanding()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Re-cargar al volver el foco o visibilidad (evita que se vean defaults al volver)
  useEffect(() => {
    const onFocus = () => loadLanding()
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadLanding()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const up = <K extends keyof LandingConfig>(key: K, value: LandingConfig[K]) =>
    setCfg((prev) => ({ ...prev, [key]: value }))
  const upFields = <K extends keyof FieldsConfig>(key: K, value: FieldsConfig[K]) =>
    setCfg((prev) => ({ ...prev, fields: { ...prev.fields, [key]: value } }))
  const upLegal = <K extends keyof LegalConfig>(key: K, value: LegalConfig[K]) =>
    setCfg((prev) => ({ ...prev, legal: { ...prev.legal, [key]: value } }))

  const onLogoPicked = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => up('logoUrl', String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  async function onSave() {
    setSaving(true)
    setMsg(null)
    try {
      await api('/api/restaurant/landing', { method: 'POST', body: { config: cfg } }, token || undefined)
      // Refrescar justo después de guardar para mantener editor y preview sincronizados
      await loadLanding()
      setMsg('Guardado correctamente.')
    } catch (e: any) {
      console.error(e)
      setMsg('No se pudo guardar. Reintenta.')
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(null), 2500)
    }
  }

  const copyUrl = async () => {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setMsg('URL copiada')
      setTimeout(() => setMsg(null), 1500)
    } catch {}
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 grid md:grid-cols-[1fr_340px] gap-6">
      {/* Editor izquierda */}
      <div className="p-4 rounded-2xl border bg-white">
        <h1 className="text-2xl font-semibold mb-3">Landing de alta</h1>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('landing')}
            className={`px-3 py-1.5 rounded-lg border ${tab === 'landing' ? 'bg-brand text-white border-brand' : 'bg-white'}`}
          >
            Landing
          </button>
          <button
            onClick={() => setTab('fields')}
            className={`px-3 py-1.5 rounded-lg border ${tab === 'fields' ? 'bg-brand text-white border-brand' : 'bg-white'}`}
          >
            Campos
          </button>
          <button
            onClick={() => setTab('legal')}
            className={`px-3 py-1.5 rounded-lg border ${tab === 'legal' ? 'bg-brand text-white border-brand' : 'bg-white'}`}
          >
            Legal
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Cargando…</div>
        ) : (
          <>
            {tab === 'landing' && (
              <div className="grid gap-3">
                <label className="text-sm font-medium">Título del formulario</label>
                <input
                  className="border rounded-lg px-3 py-2"
                  value={cfg.formTitle}
                  onChange={(e) => up('formTitle', e.target.value)}
                />

                <label className="text-sm font-medium">Texto del encabezado</label>
                <input
                  className="border rounded-lg px-3 py-2"
                  value={cfg.headerText}
                  onChange={(e) => up('headerText', e.target.value)}
                />

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Logo del formulario</label>
                    <input type="file" accept="image/*" onChange={(e) => onLogoPicked(e.target.files?.[0] || null)} />
                    {cfg.logoUrl && <img src={cfg.logoUrl} alt="Logo" className="mt-2 h-10 object-contain" />}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Texto del botón de alta</label>
                    <input
                      className="border rounded-lg px-3 py-2 w-full"
                      value={cfg.buttonText}
                      onChange={(e) => up('buttonText', e.target.value)}
                    />
                  </div>
                </div>

                {/* URL pública */}
                <div className="text-sm">
                  <span className="font-medium">URL pública:</span>{' '}
                  {publicUrl ? (
                    <a className="text-brand underline" href={publicUrl} target="_blank" rel="noreferrer">
                      {publicUrl}
                    </a>
                  ) : (
                    <span className="text-gray-500">Inicia sesión nuevamente para obtener tu URL</span>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    className="border rounded-lg px-3 py-2 w-full text-sm"
                    readOnly
                    value={
                      publicUrl ||
                      (typeof window !== 'undefined' ? `${window.location.origin}/public/{tu-slug}` : '')
                    }
                  />
                  <button
                    type="button"
                    onClick={copyUrl}
                    disabled={!publicUrl}
                    className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}

            {tab === 'fields' && (
              <div className="grid gap-2">
                <label className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <span>Nombre</span>
                  <input
                    type="checkbox"
                    checked={cfg.fields.name}
                    onChange={(e) => upFields('name', e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <span>Apellidos</span>
                  <input
                    type="checkbox"
                    checked={cfg.fields.lastname}
                    onChange={(e) => upFields('lastname', e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <span>Email</span>
                  <input
                    type="checkbox"
                    checked={cfg.fields.email}
                    onChange={(e) => upFields('email', e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <span>Teléfono</span>
                  <input
                    type="checkbox"
                    checked={cfg.fields.phone}
                    onChange={(e) => upFields('phone', e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <span>Fecha de cumpleaños</span>
                  <input
                    type="checkbox"
                    checked={cfg.fields.birthday}
                    onChange={(e) => upFields('birthday', e.target.checked)}
                  />
                </label>
              </div>
            )}

            {tab === 'legal' && (
              <div className="grid gap-3">
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">Nombre de la empresa*</label>
                    <input
                      className="border rounded-lg px-3 py-2 w-full"
                      value={cfg.legal.businessName}
                      onChange={(e) => upLegal('businessName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email empresa*</label>
                    <input
                      className="border rounded-lg px-3 py-2 w-full"
                      value={cfg.legal.email}
                      onChange={(e) => upLegal('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Teléfono empresa*</label>
                    <input
                      className="border rounded-lg px-3 py-2 w-full"
                      value={cfg.legal.phone}
                      onChange={(e) => upLegal('phone', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Términos y condiciones</label>
                  <textarea
                    className="border rounded-lg px-3 py-2 w-full"
                    rows={6}
                    value={cfg.legal.terms}
                    onChange={(e) => upLegal('terms', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Política de privacidad y consentimiento</label>
                  <textarea
                    className="border rounded-lg px-3 py-2 w-full"
                    rows={6}
                    value={cfg.legal.privacy}
                    onChange={(e) => upLegal('privacy', e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button onClick={onSave} disabled={saving} className="px-4 py-2 rounded-lg bg-brand text-white w-max">
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              {msg && <span className="text-sm text-gray-600">{msg}</span>}
            </div>
          </>
        )}
      </div>

      {/* Preview móvil en vivo */}
      <PhonePreview
        title={cfg.formTitle}
        subtitle={cfg.headerText}
        buttonText={cfg.buttonText}
        logoUrl={cfg.logoUrl}
        fields={cfg.fields}
      />
    </div>
  )
}
