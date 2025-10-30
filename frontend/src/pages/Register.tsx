import { useState } from 'react'
import { useAuth } from '../state/store'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo-sumakey.png'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  // 👇 Solo estos tres campos
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // 👇 Enviamos name = businessName (el backend generará el slug desde aquí)
      await register({ name: businessName, email, password })
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url('/src/assets/bg-auth.png')` }}
    >
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Sumakey" className="h-10 w-auto opacity-90" loading="lazy" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-6">Crear cuenta de negocio</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nombre del negocio"
            className="w-full border rounded-lg px-4 py-2"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded-lg px-4 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full border rounded-lg px-4 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white py-2 rounded-lg hover:opacity-90 transition"
          >
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}
