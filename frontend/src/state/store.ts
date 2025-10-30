// /frontend/src/state/store.ts
import { create } from 'zustand'
import { api } from '../lib/api'

type Business = {
  id: string
  name: string
  slug: string
  reward_name?: string | null
  reward_threshold?: number | null
}

type RegisterInput = { name: string; email: string; password: string }

function getStored<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try { return JSON.parse(raw) as T } catch { return null }
}

function setStored(key: string, value: any) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

type AuthState = {
  token: string | null
  business: Business | null
  loading: boolean
  error: string | null

  register: (inputOrName: RegisterInput | string, email?: string, password?: string) => Promise<void>
  login: (input: { email: string; password: string }) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

const initialToken = typeof window !== 'undefined' ? localStorage.getItem('sumakey:token') : null
const initialBusiness = getStored<Business>('sumakey:business')

export const useAuth = create<AuthState>((set, get) => ({
  token: initialToken,
  business: initialBusiness ?? null,
  loading: false,
  error: null,

  async register(inputOrName, email, password) {
    set({ loading: true, error: null })
    try {
      let payload: RegisterInput
      if (typeof inputOrName === 'object') {
        payload = { name: inputOrName.name, email: inputOrName.email, password: inputOrName.password }
      } else {
        payload = { name: String(inputOrName || ''), email: String(email || ''), password: String(password || '') }
      }

      const res = await api<{ token: string; business: Business }>(
        '/api/auth/register',
        { method: 'POST', body: payload }
      )

      localStorage.setItem('sumakey:token', res.token)
      setStored('sumakey:business', res.business)

      set({ token: res.token, business: res.business, loading: false })
    } catch (e: any) {
      set({ loading: false, error: e?.message || 'No se pudo registrar' })
      throw e
    }
  },

  async login({ email, password }) {
    set({ loading: true, error: null })
    try {
      const res = await api<{ token: string; business: Business }>(
        '/api/auth/login',
        { method: 'POST', body: { email, password } }
      )
      localStorage.setItem('sumakey:token', res.token)
      setStored('sumakey:business', res.business)

      set({ token: res.token, business: res.business, loading: false })
    } catch (e: any) {
      set({ loading: false, error: e?.message || 'No se pudo iniciar sesión' })
      throw e
    }
  },

  logout() {
    localStorage.removeItem('sumakey:token')
    localStorage.removeItem('sumakey:business')
    set({ token: null, business: null })
  },

  async refreshMe() {
    const token = get().token
    if (!token) return
    try {
      const me = await api<{ business: Business }>('/api/auth/me', {}, token)
      setStored('sumakey:business', me.business)
      set({ business: me.business })
    } catch {
      localStorage.removeItem('sumakey:token')
      localStorage.removeItem('sumakey:business')
      set({ token: null, business: null })
    }
  },
}))
