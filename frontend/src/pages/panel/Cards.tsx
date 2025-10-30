export default function Cards() {
  // por ahora placeholders; luego conectamos a “plantillas” y “tarjetas” reales
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Tarjetas</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-lg bg-brand text-white text-sm">Nueva tarjeta</button>
          <button className="px-3 py-2 rounded-lg border text-sm">Plantillas</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[1,2,3].map(x => (
          <div key={x} className="p-4 rounded-2xl border bg-white">
            <div className="font-semibold mb-1">Tarjeta {x}</div>
            <div className="text-sm text-gray-600">Vista previa y parámetros</div>
          </div>
        ))}
      </div>
    </div>
  )
}
