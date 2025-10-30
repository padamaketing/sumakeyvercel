import { useState } from 'react'
import { useAuth } from '../state/store'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo-sumakey.png'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email: email.trim(), password })
      navigate('/dashboard') // ⬅️ redirige tras iniciar sesión
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
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

        <h1 className="text-2xl font-bold text-center mb-6">Iniciar sesión</h1>
        {error && <p className="text-red-500 text-center mb-4 break-all">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
