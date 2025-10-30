// ⚠️ SOLO PARA TEST. Luego volvemos a import.meta.env.
export const BASE = 'https://sumakeyvercel-production.up.railway.app';

function isPlainObject(v: any) {
  return v != null && typeof v === 'object' &&
         !(v instanceof FormData) && !(v instanceof Blob) && !(v instanceof ArrayBuffer);
}

export async function api<T = any>(
  path: string,
  initOrBody?: (RequestInit & { body?: any }) | any,
  token?: string
): Promise<T> {
  let init: RequestInit & { body?: any } =
    initOrBody && (initOrBody.method || initOrBody.headers)
      ? (initOrBody as any)
      : initOrBody !== undefined
      ? { method: 'POST', body: initOrBody }
      : {};

  const headers = {
    'Content-Type': 'application/json',
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const body =
    isPlainObject(init.body) ? JSON.stringify(init.body) : (init.body as any);

  const res = await fetch(`${BASE}${path}`, { ...init, headers, body });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status} on ${path}`);
  }
  try { return (await res.json()) as T } catch { return undefined as T }
}
