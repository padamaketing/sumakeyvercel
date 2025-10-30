type FieldsConfig = {
  name: boolean
  lastname: boolean
  email: boolean
  phone: boolean
  birthday: boolean
}

export default function PhonePreview({
  title,
  subtitle,
  buttonText,
  logoUrl,
  fields
}: {
  title?: string
  subtitle?: string
  buttonText?: string
  logoUrl?: string
  fields: FieldsConfig
}) {
  const Field = ({ placeholder }: { placeholder: string }) => (
    <div className="border rounded-lg px-3 py-2 text-sm text-gray-400">{placeholder}</div>
  )

  return (
    <div className="rounded-2xl border bg-white p-4 w-[320px]">
      <div className="text-sm mb-2"><b>Landing</b><div className="text-gray-500">Preview /public/:slug</div></div>
      <div className="mx-auto w-[280px] h-[560px] rounded-[36px] border-8 border-gray-900 bg-white overflow-hidden relative">
        <div className="h-6 bg-gray-900" />
        <div className="p-4 space-y-3">
          {logoUrl ? (
            <div className="flex justify-center"><img src={logoUrl} alt="logo" className="max-h-10 object-contain" /></div>
          ) : null}

          <div className="text-center">
            <div className="text-base font-semibold">{title || 'Tarjeta Wallet'}</div>
            <div className="text-xs text-gray-600">{subtitle || 'Vista previa'}</div>
          </div>

          <div className="mt-2 space-y-2">
            {fields?.name && <Field placeholder="Nombre" />}
            {fields?.lastname && <Field placeholder="Apellidos" />}
            {fields?.email && <Field placeholder="Email" />}
            {fields?.phone && <Field placeholder="Teléfono" />}
            {fields?.birthday && <Field placeholder="Fecha de cumpleaños" />}
          </div>

          <button className="mt-3 w-full px-4 py-2 rounded-lg bg-brand text-white text-sm">
            {buttonText || 'Registrarme'}
          </button>

          <div className="pt-2 text-[10px] text-gray-500">
            Al registrarte, aceptas nuestros términos y política de privacidad.
          </div>
        </div>
      </div>
    </div>
  )
}
