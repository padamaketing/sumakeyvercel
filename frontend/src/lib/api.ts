export const BASE = import.meta.env.VITE_API_BASE;

function isPlainObject(v: any) {
  return v != null && typeof v === 'object' &&
         !(v instanceof FormData) && !(v instanceof Blob) && !(v instanceof ArrayBuffer);
}

export async function api(
  path: string,
  init: RequestInit = {},
  token?: string
) {
  if (!BASE) {
    // ayuda para detectar si VITE_API_BASE no entró en el build
    console.error('VITE_API_BASE no está definido en build');
  } else {
    // puedes dejarlo temporalmente para depurar
    console.debug('API BASE =>', BASE);
  }

  const url = `${BASE}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  // 🔒 si el body es un objeto plano, lo convertimos a JSON
  const body =
    isPlainObject((init as any).body) ? JSON.stringify((init as any).body) : (init as any).body;

  const res = await fetch(url, { ...init, headers, body });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status} on ${url}`);
  }
  return res.json();
}
