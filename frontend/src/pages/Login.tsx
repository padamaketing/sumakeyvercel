// frontend/src/pages/Login.tsx
import { useState } from 'react'
import { api } from '../lib/api'
import logo from '../assets/logo-sumakey.png'
import bg from '../assets/bg-auth.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // ✅ POST explícito a tu backend
      const res = await api<{ token?: string; accessToken?: string; business?: any; error?: string }>(
        '/api/auth/login',
        { method: 'POST', body: { email: email.trim(), password } }
      )

      const token = res.token || res.accessToken
      if (!token) throw new Error(res?.error || 'Login inválido')

      // ✅ Persistimos para que el resto de la app lo lea al recargar
      localStorage.setItem('sumakey:token', token)
      if (res.business) {
        localStorage.setItem('sumakey:business', JSON.stringify(res.business))
      }

      // ✅ Redirección dura para evitar cualquier bucle/estado raro
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Sumakey" className="h-10 w-auto opacity-90" loading="eager" />
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
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full border rounded-lg px-4 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white py-2 rounded-lg hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
