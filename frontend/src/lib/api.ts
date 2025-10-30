export const BASE = import.meta.env.VITE_API_BASE;

// Permite api<T> y aceptar body como objeto plano o RequestInit
export async function api<T = any>(
  path: string,
  initOrBody?: (RequestInit & { body?: any }) | any,
  token?: string
): Promise<T> {
  if (!BASE) {
    console.error('VITE_API_BASE no está definido en build');
  } else {
    console.debug('API BASE =>', BASE);
  }

  // Normaliza init/body
  let init: RequestInit & { body?: any } =
    initOrBody && (initOrBody.method || initOrBody.headers)
      ? (initOrBody as any)
      : initOrBody !== undefined
      ? { method: 'POST', body: initOrBody }
      : {};

  const headers = {
    'Content-Type': 'application/json',
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Serializa si es objeto plano
  const isPlain =
    init.body != null &&
    typeof init.body === 'object' &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof Blob) &&
    !(init.body instanceof ArrayBuffer);

  const body = isPlain ? JSON.stringify(init.body) : (init.body as any);

  const res = await fetch(`${BASE}${path}`, { ...init, headers, body });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status} on ${path}`);
  }
  try {
    return (await res.json()) as T;
  } catch {
    return undefined as T;
  }
}
