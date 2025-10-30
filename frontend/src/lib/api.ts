// frontend/src/lib/api.ts

// 🔧 URL base del backend (configúralo en Vercel → Environment Variables)
export const BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (typeof window !== 'undefined' && (window as any).__API_BASE__) ||
  'http://localhost:4000' // fallback en local

function isPlainObject(v: any) {
  return (
    v != null &&
    typeof v === 'object' &&
    !(v instanceof FormData) &&
    !(v instanceof Blob) &&
    !(v instanceof ArrayBuffer)
  )
}

type ApiInit = RequestInit & { body?: any }

/**
 * api('/api/restaurant/program', { method: 'GET' }, token)
 * api('/api/restaurant/program', { foo: 'bar' }, token)  // => POST JSON
 */
export async function api<T = any>(
  path: string,
  initOrBody?: ApiInit | any,
  token?: string
): Promise<T> {
  // Si el 2º argumento parece un RequestInit -> úsalo tal cual; si no, lo tratamos como body de POST
  let init: ApiInit =
    initOrBody && (initOrBody.method || initOrBody.headers)
      ? (initOrBody as ApiInit)
      : initOrBody !== undefined
      ? ({ method: 'POST', body: initOrBody } as ApiInit)
      : ({} as ApiInit)

  const method = (init.method || 'GET').toUpperCase()

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
    ...(method !== 'GET' && method !== 'HEAD' ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  // Serializa body solo si es objeto plano y el método admite body
  let body: any = init.body
  if (method !== 'GET' && method !== 'HEAD') {
    body = isPlainObject(init.body) ? JSON.stringify(init.body) : init.body
  } else {
    // Nunca mandes body en GET/HEAD
    body = undefined
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    method,
    headers,
    body,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status} on ${path}`)
  }

  // Si no hay JSON, devuelve undefined
  try {
    return (await res.json()) as T
  } catch {
    return undefined as T
  }
}
