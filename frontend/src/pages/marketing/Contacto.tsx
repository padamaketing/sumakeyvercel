export default function Contacto() {
  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">Contacto</h1>
      <form className="space-y-3">
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Nombre" />
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Email" />
        <textarea className="w-full border rounded-lg px-3 py-2" placeholder="Mensaje" rows={5} />
        <button className="w-full bg-brand text-white px-4 py-2 rounded-lg">Enviar</button>
      </form>
    </div>
  )
}
