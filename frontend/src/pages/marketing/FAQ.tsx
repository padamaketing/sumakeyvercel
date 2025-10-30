export default function FAQ() {
  const faqs = [
    ['¿Qué necesito para empezar?', 'Crear tu cuenta, configurar el programa y compartir tu landing.'],
    ['¿Puedo personalizar la tarjeta?', 'Sí, colores, textos, logos y campos informativos.'],
    ['¿Necesito app?', 'No. Escaneas desde el navegador y tus clientes usan la Wallet nativa.'],
  ]
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">FAQ</h1>
      <div className="space-y-4">
        {faqs.map(([q,a])=>(
          <div key={q} className="p-5 rounded-xl border bg-white">
            <div className="font-semibold mb-1">{q}</div>
            <div className="text-gray-600 text-sm">{a}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
