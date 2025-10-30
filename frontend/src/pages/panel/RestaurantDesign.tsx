import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../state/store'
import { api } from '../../lib/api'

/** ================== Tipos ================== */

type BrandConfig = {
  logoUrl: string
  commercialName: string          // nombre comercial/emisor (cabecera)
  cardTitle: string               // título visible de la tarjeta
  primaryColor: string
  labelColor: string              // color de etiquetas
  textColor: string               // color de textos
  backgroundColor: string
  fontFamily: string
  buttonRadius: number
  coverUrl: string                // imagen hero/strip opcional
}

type StampColors = {
  iconColor: string
  bgColor: string
  borderColor: string
}
type StampsConfig = {
  bgAreaColor: string            // “fondo de los sellos”
  emptyIconUrl: string           // icono sin sellar (opcional)
  filledIconUrl: string          // icono sellado (opcional)
  empty: StampColors
  filled: StampColors
  reward: { bgColor: string; borderColor: string }
  columns: number                // columnas del grid de sellos
  total: number                  // sellos por recompensa (p.ej. 10)
}

type FrontField = {
  id: string
  enabled: boolean
  position: 'header' | 'text'    // zona visible
  name: string                   // etiqueta
  field: 'free' | 'client_name' | 'rewards_available' | 'points'
  align: 'left' | 'center' | 'right' | 'default'
  value?: string                 // texto libre si field === 'free'
  color?: string                 // color opcional del texto
}

type LinkItem = {
  id: string
  name: string
  type: 'url' | 'address' | 'phone' | 'email'
  url: string
}

type TextsConfig = {
  backTitles: {
    updates: string
    holder: string
    rewardsToRedeem: string
    rewardsWon: string
    howToGetStamps: string
    rewardDetails: string
    links: string
    questions: string
  }
  signupMessages: {
    generating: string
    thanks: string
  }
  expiry: {
    label: string
    expired: string
  }
}

type DesignConfig = {
  brand: BrandConfig
  stamps: StampsConfig
  frontFields: FrontField[]
  links: LinkItem[]
  texts: TextsConfig
}

/** ================== Defaults ================== */

const DEFAULT_CFG: DesignConfig = {
  brand: {
    logoUrl: '',
    commercialName: 'Tu negocio',
    cardTitle: 'Tu tarjeta de fidelidad',
    primaryColor: '#4B90FF',
    labelColor: '#F2F2F2',
    textColor: '#222222',
    backgroundColor: '#FFFFFF',
    fontFamily:
      'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    buttonRadius: 14,
    coverUrl: '',
  },
  stamps: {
    bgAreaColor: 'rgb(239, 235, 243)',
    emptyIconUrl: '',
    filledIconUrl: '',
    empty: { iconColor: 'rgb(83, 83, 176)', bgColor: 'rgba(255,255,255,0.7)', borderColor: 'rgb(83, 83, 176)' },
    filled: { iconColor: 'rgb(121,249,4)', bgColor: 'rgb(45,43,43)', borderColor: 'rgb(121,249,4)' },
    reward: { bgColor: '#ffffff', borderColor: 'rgb(23,57,98)' },
    columns: 5,
    total: 10,
  },
  frontFields: [
    {
      id: 'hdr_wifi',
      enabled: true,
      position: 'header',
      name: 'Wifi Nombre',
      field: 'free',
      value: 'Contraseña',
      align: 'default',
    },
    {
      id: 'txt_holder',
      enabled: true,
      position: 'text',
      name: 'Titular',
      field: 'client_name',
      align: 'left',
    },
    {
      id: 'txt_rewards',
      enabled: true,
      position: 'text',
      name: 'Premio',
      field: 'rewards_available',
      align: 'right',
    },
  ],
  links: [
    { id: 'lk1', name: 'Horario', type: 'url', url: '' },
  ],
  texts: {
    backTitles: {
      updates: 'ÚLTIMAS ACTUALIZACIONES',
      holder: 'TITULAR',
      rewardsToRedeem: 'PREMIOS PARA CANJEAR',
      rewardsWon: 'PREMIOS GANADOS',
      howToGetStamps: 'CÓMO CONSEGUIR SELLOS',
      rewardDetails: 'DETALLES DEL PREMIO',
      links: 'ENLACES DE INTERÉS',
      questions: '¿PREGUNTAS SOBRE ESTA TARJETA?',
    },
    signupMessages: {
      generating: 'Estamos generando tu tarjeta',
      thanks: 'Gracias por unirte',
    },
    expiry: {
      label: 'VÁLIDO HASTA',
      expired: 'Esta tarjeta ha caducado',
    },
  },
}

/** ================== Endpoints ================== */
const PREFERRED_ENDPOINT = { get: '/api/restaurant/design', post: '/api/restaurant/design' }
const FALLBACK_ENDPOINT = { get: '/api/business/branding', post: '/api/business/branding' }

/** ================== Página principal ================== */

export default function RestaurantDesign() {
  const { token, business } = useAuth()
  const [tab, setTab] = useState<'design' | 'front' | 'links' | 'texts'>('design')
  const [cfg, setCfg] = useState<DesignConfig>(DEFAULT_CFG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  // Cargar (defensivo con fallback)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        let data: any = null
        try {
          data = await api(PREFERRED_ENDPOINT.get, {}, token || undefined)
        } catch (e: any) {
          if (String(e?.message || '').includes('404')) {
            data = await api(FALLBACK_ENDPOINT.get, {}, token || undefined)
          } else throw e
        }
        if (mounted && data) {
          const inCfg: Partial<DesignConfig> = data.design || data.branding || data.config || data
          setCfg(prev => deepMergeDesign(prev, inCfg))
        }
      } catch (e) {
        console.error('load design error', e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [token])

  const upBrand   = <K extends keyof BrandConfig>(k: K, v: BrandConfig[K])   => setCfg(p => ({ ...p, brand: { ...p.brand, [k]: v }}))
  const upStamps  = <K extends keyof StampsConfig>(k: K, v: StampsConfig[K]) => setCfg(p => ({ ...p, stamps: { ...p.stamps, [k]: v }}))
  const setFields = (fields: FrontField[]) => setCfg(p => ({ ...p, frontFields: fields }))
  const setLinks  = (links: LinkItem[])   => setCfg(p => ({ ...p, links }))
  const setTexts  = (texts: TextsConfig)  => setCfg(p => ({ ...p, texts }))

  const onPickImage = (cb: (dataUrl: string) => void) => (file: File | null) => {
    if (!file) return
    const r = new FileReader()
    r.onload = () => cb(String(r.result || ''))
    r.readAsDataURL(file)
  }

  async function onSave() {
    setSaving(true)
    setMsg(null)
    try {
      let res: any = null
      try {
        res = await api(PREFERRED_ENDPOINT.post, { method: 'POST', body: { design: cfg } }, token || undefined)
      } catch (e: any) {
        if (String(e?.message || '').includes('404')) {
          res = await api(FALLBACK_ENDPOINT.post, { method: 'POST', body: { branding: cfg } }, token || undefined)
        } else throw e
      }
      setMsg('Guardado correctamente.')
    } catch (e) {
      console.error(e)
      setMsg('No se pudo guardar. Reintenta.')
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(null), 2200)
    }
  }

  const previewStyle = useMemo(
    () =>
      ({
        '--p': cfg.brand.primaryColor,
        '--lbl': cfg.brand.labelColor,
        '--txt': cfg.brand.textColor,
        '--bg': cfg.brand.backgroundColor,
        '--r': `${cfg.brand.buttonRadius}px`,
        fontFamily: cfg.brand.fontFamily,
      }) as React.CSSProperties,
    [cfg]
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 grid md:grid-cols-[1fr_360px] gap-6">
      {/* IZQUIERDA */}
      <div className="p-4 rounded-2xl border bg-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Diseña tu tarjeta</h1>
          {business && <span className="text-sm text-gray-500">{business.name}</span>}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <TabBtn active={tab === 'design'} onClick={() => setTab('design')}>Diseño</TabBtn>
          <TabBtn active={tab === 'front'}  onClick={() => setTab('front')}>Frontal</TabBtn>
          <TabBtn active={tab === 'links'}  onClick={() => setTab('links')}>Enlaces</TabBtn>
          <TabBtn active={tab === 'texts'}  onClick={() => setTab('texts')}>Textos</TabBtn>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Cargando…</div>
        ) : (
          <>
            {tab === 'design' && (
              <section className="grid gap-6">
                {/* Logos y cabecera */}
                <div className="grid md:grid-cols-2 gap-4">
                  <fieldset className="grid gap-2">
                    <legend className="text-sm font-semibold mb-1">Logo</legend>
                    <input type="file" accept="image/*" onChange={(e) => onPickImage((d) => upBrand('logoUrl', d))(e.target.files?.[0] || null)} />
                    {cfg.brand.logoUrl && <img src={cfg.brand.logoUrl} alt="logo" className="mt-2 h-10 object-contain" />}
                  </fieldset>
                  <fieldset className="grid gap-2">
                    <legend className="text-sm font-semibold mb-1">Imagen de cabecera</legend>
                    <input type="file" accept="image/*" onChange={(e) => onPickImage((d) => upBrand('coverUrl', d))(e.target.files?.[0] || null)} />
                    {cfg.brand.coverUrl && <img src={cfg.brand.coverUrl} alt="cover" className="mt-2 h-10 object-cover rounded" />}
                  </fieldset>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <TextInput label="Nombre comercial del emisor" value={cfg.brand.commercialName} onChange={(v) => upBrand('commercialName', v)} />
                  <TextInput label="Título de la tarjeta" value={cfg.brand.cardTitle} onChange={(v) => upBrand('cardTitle', v)} />
                </div>

                {/* Colores */}
                <div className="grid md:grid-cols-2 gap-4">
                  <ColorInput label="Color primario" value={cfg.brand.primaryColor} onChange={(v) => upBrand('primaryColor', v)} />
                  <ColorInput label="Color de las etiquetas" value={cfg.brand.labelColor} onChange={(v) => upBrand('labelColor', v)} />
                  <ColorInput label="Color de los textos" value={cfg.brand.textColor} onChange={(v) => upBrand('textColor', v)} />
                  <ColorInput label="Color de fondo" value={cfg.brand.backgroundColor} onChange={(v) => upBrand('backgroundColor', v)} />
                </div>

                {/* Tipografía y radio */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tipografía</label>
                    <select
                      className="border rounded-lg px-3 py-2 w-full"
                      value={cfg.brand.fontFamily}
                      onChange={(e) => upBrand('fontFamily', e.target.value)}
                    >
                      <option value="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif">Inter</option>
                      <option value="Poppins, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif">Poppins</option>
                      <option value="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif">System UI</option>
                      <option value="Roboto, Helvetica, Arial, sans-serif">Roboto</option>
                      <option value="Helvetica, Arial, sans-serif">Helvetica</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Radio de botón</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={28}
                        value={cfg.brand.buttonRadius}
                        onChange={(e) => upBrand('buttonRadius', Number(e.target.value))}
                      />
                      <span className="text-sm text-gray-600 w-10">{cfg.brand.buttonRadius}px</span>
                    </div>
                  </div>
                </div>

                {/* Fondo sellos + iconos */}
                <div className="grid gap-4">
                  <fieldset className="grid md:grid-cols-3 gap-4">
                    <ColorInput label="Fondo de los sellos" value={cfg.stamps.bgAreaColor} onChange={(v) => upStamps('bgAreaColor', v)} />
                    <NumberInput label="Total de sellos" min={1} max={30} value={cfg.stamps.total} onChange={(v) => upStamps('total', v)} />
                    <NumberInput label="Columnas" min={1} max={10} value={cfg.stamps.columns} onChange={(v) => upStamps('columns', v)} />
                  </fieldset>

                  <div className="grid md:grid-cols-2 gap-4">
                    <StampBlock
                      title="Icono sin sellar"
                      iconUrl={cfg.stamps.emptyIconUrl}
                      onPick={onPickImage((d) => upStamps('emptyIconUrl', d))}
                      colors={cfg.stamps.empty}
                      onColors={(c) => upStamps('empty', c)}
                    />
                    <StampBlock
                      title="Icono sellado"
                      iconUrl={cfg.stamps.filledIconUrl}
                      onPick={onPickImage((d) => upStamps('filledIconUrl', d))}
                      colors={cfg.stamps.filled}
                      onColors={(c) => upStamps('filled', c)}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <ColorInput label="Sello con premio (fondo)" value={cfg.stamps.reward.bgColor} onChange={(v) => upStamps('reward', { ...cfg.stamps.reward, bgColor: v })} />
                    <ColorInput label="Sello con premio (borde)" value={cfg.stamps.reward.borderColor} onChange={(v) => upStamps('reward', { ...cfg.stamps.reward, borderColor: v })} />
                  </div>
                </div>
              </section>
            )}

            {tab === 'front' && (
              <FrontFieldsEditor fields={cfg.frontFields} setFields={setFields} />
            )}

            {tab === 'links' && (
              <LinksEditor links={cfg.links} setLinks={setLinks} />
            )}

            {tab === 'texts' && (
              <TextsEditor texts={cfg.texts} setTexts={setTexts} />
            )}

            <div className="mt-6 flex items-center gap-3">
              <button onClick={onSave} disabled={saving} className="px-4 py-2 rounded-lg bg-brand text-white w-max">
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button onClick={() => setCfg(DEFAULT_CFG)} className="px-4 py-2 rounded-lg border">
                Restaurar por defecto
              </button>
              {msg && <span className="text-sm text-gray-600">{msg}</span>}
            </div>
          </>
        )}
      </div>

      {/* DERECHA: Preview tipo Wallet */}
      <WalletPreview cfg={cfg} style={previewStyle} />
    </div>
  )
}

/** ================== Subcomponentes / Helpers ================== */

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border ${active ? 'bg-brand text-white border-brand' : 'bg-white'}`}
    >
      {children}
    </button>
  )
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">{label}</label>
      <input className="border rounded-lg px-3 py-2 w-full" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function NumberInput({ label, value, onChange, min = 0, max = 999 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">{label}</label>
      <input type="number" min={min} max={max} className="border rounded-lg px-3 py-2 w-full" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

function ColorInput({ label, value, onChange, small }: { label: string; value: string; onChange: (v: string) => void; small?: boolean }) {
  return (
    <div className={`grid gap-2 ${small ? 'text-xs' : ''}`}>
      <label className={`font-medium ${small ? '' : 'text-sm'}`}>{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className={`p-0 border rounded ${small ? 'h-7 w-10' : 'h-9 w-12'}`} />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="border rounded-lg px-3 py-2 w-full font-mono text-sm" placeholder="#000000" />
      </div>
    </div>
  )
}

function StampBlock({
  title, iconUrl, onPick, colors, onColors,
}: {
  title: string
  iconUrl: string
  onPick: (file: File | null) => void
  colors: StampColors
  onColors: (c: StampColors) => void
}) {
  return (
    <div>
      <label className="text-sm font-medium">{title}</label>
      <input type="file" accept="image/*" onChange={(e) => onPick(e.target.files?.[0] || null)} />
      {iconUrl && <img src={iconUrl} alt="icon" className="mt-2 h-8 object-contain" />}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <ColorInput small label="Color icono" value={colors.iconColor} onChange={(v) => onColors({ ...colors, iconColor: v })} />
        <ColorInput small label="Fondo" value={colors.bgColor} onChange={(v) => onColors({ ...colors, bgColor: v })} />
        <ColorInput small label="Borde" value={colors.borderColor} onChange={(v) => onColors({ ...colors, borderColor: v })} />
      </div>
    </div>
  )
}

/** ---------- Frontal (campos) ---------- */

function FrontFieldsEditor({ fields, setFields }: { fields: FrontField[]; setFields: (f: FrontField[]) => void }) {
  const [editing, setEditing] = useState<FrontField | null>(null)

  const addRow = () => {
    const id = `f_${Math.random().toString(36).slice(2, 9)}`
    setFields([...fields, { id, enabled: true, position: 'text', name: 'Campo', field: 'free', value: '', align: 'left' }])
  }
  const removeRow = (id: string) => setFields(fields.filter(f => f.id !== id))
  const toggleRow = (id: string) => setFields(fields.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f))

  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold">Campos frontales de la tarjeta</h2>
      <p className="text-sm text-gray-600">Configura qué se muestra en la parte frontal del pass.</p>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Activo</th>
              <th className="px-3 py-2 text-left">Posición</th>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">Campo</th>
              <th className="px-3 py-2 text-left">Alineación</th>
              <th className="px-3 py-2 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="px-3 py-2"><input type="checkbox" checked={f.enabled} onChange={() => toggleRow(f.id)} /></td>
                <td className="px-3 py-2">{f.position === 'header' ? 'Encabezamiento' : 'Texto'}</td>
                <td className="px-3 py-2">{f.name}</td>
                <td className="px-3 py-2">
                  {f.field === 'free' ? 'Texto libre' : f.field === 'client_name' ? 'Cliente: NOMBRE Y APELLIDOS' : f.field === 'rewards_available' ? 'Vales/Premios Disponibles' : 'Puntos/Sellos'}
                </td>
                <td className="px-3 py-2 capitalize">{f.align}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="px-2 py-1 rounded border" onClick={() => setEditing(f)}>Editar</button>
                    <button className="px-2 py-1 rounded border text-red-600" onClick={() => removeRow(f.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={addRow} className="px-3 py-2 rounded-lg border w-max">Añadir campo</button>

      {editing && (
        <EditFieldModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(nf) => {
            setFields(fields.map(f => f.id === nf.id ? nf : f))
            setEditing(null)
          }}
        />
      )}
    </section>
  )
}

function EditFieldModal({ initial, onSave, onClose }: { initial: FrontField; onSave: (f: FrontField) => void; onClose: () => void }) {
  const [f, setF] = useState<FrontField>(initial)
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-4">
        <h3 className="text-lg font-semibold mb-3">Campo frontal</h3>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Posición</label>
            <select className="border rounded-lg px-3 py-2 w-full" value={f.position} onChange={(e) => setF({ ...f, position: e.target.value as any })}>
              <option value="header">Encabezamiento</option>
              <option value="text">Texto</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Opciones posición</label>
            <div className="flex items-center gap-3 px-1 py-2">
              <label className="text-xs">Activo <input type="checkbox" className="ml-1" checked={f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked })} /></label>
            </div>
          </div>
          <TextInput label="Nombre del campo" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
          <div>
            <label className="text-sm font-medium">Campo</label>
            <select className="border rounded-lg px-3 py-2 w-full" value={f.field} onChange={(e) => setF({ ...f, field: e.target.value as any })}>
              <option value="free">Texto libre</option>
              <option value="client_name">Cliente: NOMBRE Y APELLIDOS</option>
              <option value="rewards_available">Vales/Premios Disponibles</option>
              <option value="points">Puntos/Sellos</option>
            </select>
          </div>

          {f.field === 'free' && (
            <TextInput label="Texto libre" value={f.value || ''} onChange={(v) => setF({ ...f, value: v })} />
          )}

          <div>
            <label className="text-sm font-medium">Alineación</label>
            <select className="border rounded-lg px-3 py-2 w-full" value={f.align} onChange={(e) => setF({ ...f, align: e.target.value as any })}>
              <option value="default">Por defecto</option>
              <option value="left">Izquierda</option>
              <option value="center">Centro</option>
              <option value="right">Derecha</option>
            </select>
          </div>

          <ColorInput label="Color (opcional)" value={f.color || ''} onChange={(v) => setF({ ...f, color: v })} />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-2 rounded-lg border" onClick={onClose}>Cancelar</button>
          <button className="px-3 py-2 rounded-lg bg-brand text-white" onClick={() => onSave(f)}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

/** ---------- Enlaces ---------- */

function LinksEditor({ links, setLinks }: { links: LinkItem[]; setLinks: (l: LinkItem[]) => void }) {
  const addLink = () => {
    const id = `lk_${Math.random().toString(36).slice(2, 9)}`
    setLinks([...links, { id, name: '', type: 'url', url: '' }])
  }
  const update = (id: string, patch: Partial<LinkItem>) =>
    setLinks(links.map(l => l.id === id ? { ...l, ...patch } : l))
  const remove = (id: string) => setLinks(links.filter(l => l.id !== id))

  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold">Enlaces de interés</h2>
      <p className="text-sm text-gray-600">Añade links que aparecerán en la tarjeta (sección de enlaces).</p>

      <div className="grid gap-2">
        {links.map((l) => (
          <div key={l.id} className="grid md:grid-cols-[1fr_140px_1fr_auto] gap-2 items-center">
            <input className="border rounded-lg px-3 py-2" placeholder="Nombre" value={l.name} onChange={(e) => update(l.id, { name: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={l.type} onChange={(e) => update(l.id, { type: e.target.value as any })}>
              <option value="url">URL</option>
              <option value="address">Dirección</option>
              <option value="phone">Teléfono</option>
              <option value="email">Email</option>
            </select>
            <input className="border rounded-lg px-3 py-2" placeholder="https://..." value={l.url} onChange={(e) => update(l.id, { url: e.target.value })} />
            <button className="px-3 py-2 rounded-lg border text-red-600" onClick={() => remove(l.id)}>Eliminar</button>
          </div>
        ))}
      </div>

      <button onClick={addLink} className="px-3 py-2 rounded-lg border w-max">Añadir enlace</button>
    </section>
  )
}

/** ---------- Textos ---------- */

function TextsEditor({ texts, setTexts }: { texts: TextsConfig; setTexts: (t: TextsConfig) => void }) {
  const up = (path: string, v: string) => {
    const next = structuredClone(texts) as TextsConfig
    const [a, b] = path.split('.')
    // @ts-ignore
    next[a][b] = v
    setTexts(next)
  }
  return (
    <section className="grid gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Títulos de la parte trasera</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {Object.entries(texts.backTitles).map(([k, val]) => (
            <TextInput key={k} label={k.replace(/([A-Z])/g, ' $1').toUpperCase()} value={val} onChange={(v) => up(`backTitles.${k}`, v)} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Mensajes de alta cliente</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <TextInput label="Generando tarjeta" value={texts.signupMessages.generating} onChange={(v) => up('signupMessages.generating', v)} />
          <TextInput label="Gracias por unirte" value={texts.signupMessages.thanks} onChange={(v) => up('signupMessages.thanks', v)} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Etiquetas y expiración</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <TextInput label="Etiqueta de validez" value={texts.expiry.label} onChange={(v) => up('expiry.label', v)} />
          <TextInput label="Mensaje de caducada" value={texts.expiry.expired} onChange={(v) => up('expiry.expired', v)} />
        </div>
      </div>
    </section>
  )
}

/** ---------- Preview tipo Wallet ---------- */

function WalletPreview({ cfg, style }: { cfg: DesignConfig; style: React.CSSProperties }) {
  // Datos “fake” para la vista previa
  const clientName = 'DANIEL PEREZ'
  const rewardsAvailable = 2
  const points = 7

  const grid = Array.from({ length: cfg.stamps.total }, (_, i) => i < points)

  return (
    <div className="rounded-2xl border bg-white p-4 h-max">
      <div className="text-sm mb-2"><b>Preview</b> <span className="text-gray-500">Google/Apple Wallet (simulada)</span></div>
      <div className="w-[320px] mx-auto rounded-[36px] border-8 border-gray-900 overflow-hidden bg-white" style={style}>
        {/* notch */}
        <div className="h-6 bg-gray-900" />
        {/* header/strip */}
        <div className="relative" style={{ background: 'var(--p)' }}>
          <div className="flex items-center gap-2 p-3">
            {cfg.brand.logoUrl && <img src={cfg.brand.logoUrl} className="h-6 w-6 object-contain rounded bg-white/90 p-1" alt="logo" />}
            <div className="text-white font-semibold truncate">{cfg.brand.commercialName}</div>
          </div>
          {/* grid de sellos */}
          <div className="p-3" style={{ background: cfg.stamps.bgAreaColor }}>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cfg.stamps.columns}, minmax(0,1fr))` }}>
              {grid.map((filled, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-full flex items-center justify-center text-[10px] border"
                  style={{
                    background: filled ? cfg.stamps.filled.bgColor : cfg.stamps.empty.bgColor,
                    borderColor: filled ? cfg.stamps.filled.borderColor : cfg.stamps.empty.borderColor,
                    color: filled ? cfg.stamps.filled.iconColor : cfg.stamps.empty.iconColor,
                  }}
                >
                  {filled
                    ? (cfg.stamps.filledIconUrl ? <img src={cfg.stamps.filledIconUrl} className="h-4 w-4 object-contain" /> : '✔')
                    : (cfg.stamps.emptyIconUrl ? <img src={cfg.stamps.emptyIconUrl} className="h-4 w-4 object-contain" /> : '○')
                  }
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* cuerpo */}
        <div className="p-4" style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
          {/* campos header */}
          <div className="text-[11px] mb-1 flex items-center justify-between" style={{ color: 'var(--lbl)' }}>
            {cfg.frontFields.filter(f => f.enabled && f.position === 'header').map(f => (
              <span key={f.id} className="truncate">{f.name}: <b className="text-[11px]" style={{ color: f.color || 'var(--lbl)' }}>
                {renderFieldValue(f, { clientName, rewardsAvailable, points })}
              </b></span>
            ))}
          </div>

          {/* “caja” principal */}
          <div className="rounded-xl p-4 border bg-white/70" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <div className="flex items-center justify-between text-[12px] mb-2">
              <span className="opacity-70">TITULAR</span>
              <span className="opacity-70">PREMIO</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{clientName}</div>
              <div className="text-sm font-medium">{rewardsAvailable}</div>
            </div>

            {/* QR simulado */}
            <div className="mt-4 flex justify-center">
              <div className="rounded bg-white border p-2">
                <div className="h-28 w-28 bg-[repeating-linear-gradient(45deg,#000_0_2px,#fff_2px_4px)]" />
              </div>
            </div>
          </div>

          {/* botón demo */}
          <button className="w-full mt-4 py-2 font-medium text-white" style={{ background: 'var(--p)', borderRadius: 'var(--r)' }}>
            CTA de ejemplo
          </button>
        </div>
      </div>
    </div>
  )
}

function renderFieldValue(f: FrontField, ctx: { clientName: string; rewardsAvailable: number; points: number }) {
  switch (f.field) {
    case 'free': return f.value || ''
    case 'client_name': return ctx.clientName
    case 'rewards_available': return String(ctx.rewardsAvailable)
    case 'points': return String(ctx.points)
    default: return ''
  }
}

/** ---------- utilidades ---------- */

function deepMergeDesign(prev: DesignConfig, incoming: Partial<DesignConfig>): DesignConfig {
  // mezcla defensiva por secciones
  const out = structuredClone(prev) as DesignConfig

  if (incoming.brand)     Object.assign(out.brand, incoming.brand)
  if (incoming.stamps)    Object.assign(out.stamps, incoming.stamps)
  if (incoming.frontFields) out.frontFields = normalizeArray(incoming.frontFields, prev.frontFields)
  if (incoming.links)       out.links = normalizeArray(incoming.links, prev.links)
  if (incoming.texts)       Object.assign(out.texts, incoming.texts)

  return out
}

function normalizeArray<T>(arr?: any, fallback?: T[]): T[] {
  if (!Array.isArray(arr)) return fallback || []
  return arr as T[]
}
