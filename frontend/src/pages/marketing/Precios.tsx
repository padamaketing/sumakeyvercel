export default function Precios() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Precios</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { name:'Starter', price:'€0', desc:'Prueba con funciones básicas.' },
          { name:'Pro', price:'€29', desc:'Todo lo que necesitas para tu local.' },
          { name:'Business', price:'€79', desc:'Multi-local y API avanzadas.' },
        ].map(p => (
          <div key={p.name} className="p-6 rounded-2xl border bg-white">
            <h3 className="font-semibold">{p.name}</h3>
            <div className="text-3xl font-extrabold my-2">{p.price}/mes</div>
            <p className="text-sm text-gray-600 mb-4">{p.desc}</p>
            <a href="/registro" className="inline-block px-4 py-2 rounded-lg bg-brand text-white">Elegir</a>
          </div>
        ))}
      </div>
    </div>
  )
}
