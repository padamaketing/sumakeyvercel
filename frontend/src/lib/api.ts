// /frontend/src/lib/api.ts
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function buildUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: any; headers?: Record<string, string> } = {},
  token?: string | null
): Promise<T> {
  const { method = 'GET' } = opts;

  // serializa body si es objeto
  const hasBody = opts.body !== undefined && opts.body !== null;
  const body =
    hasBody && typeof opts.body !== 'string' ? JSON.stringify(opts.body) : opts.body;

  const res = await fetch(buildUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: hasBody ? body : undefined,
    mode: 'cors',           // explícito
    // ❌ nada de credentials si no usas cookies:
    // credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json?.error || text || `HTTP ${res.status}`);
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  return (await res.text()) as T;
}
