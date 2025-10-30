// URL base del backend (forzada a Railway para prod)
export const BASE = 'https://sumakeyvercel-production.up.railway.app'

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

export async function api<T = any>(
  path: string,
  initOrBody?: ApiInit | any,
  token?: string
): Promise<T> {
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

  let body: any = init.body
  if (method !== 'GET' && method !== 'HEAD') {
    body = isPlainObject(init.body) ? JSON.stringify(init.body) : init.body
  } else {
    body = undefined
  }

  const res = await fetch(`${BASE}${path}`, { ...init, method, headers, body })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status} on ${path}`)
  }
  try {
    return (await res.json()) as T
  } catch {
    return undefined as T
  }
}
