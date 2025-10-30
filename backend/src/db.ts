// backend/src/db.ts
import { Pool } from 'pg';
import { config } from './config';

// 🔒 Fuerza NO verificar certificados en desarrollo (evita SELF_SIGNED_CERT_IN_CHAIN)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const isLocal =
  config.databaseUrl.includes('localhost') ||
  config.databaseUrl.includes('127.0.0.1');

// Log para diagnóstico
console.log('[db] DATABASE_URL present =', !!config.databaseUrl);
console.log('[db] Using TLS with no verification:', !isLocal);

// Pool PG con SSL sin verificación fuera de localhost
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: !isLocal ? { rejectUnauthorized: false } : false,
  max: 10,
});

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return { rows: res.rows as T[] };
  } finally {
    client.release();
  }
}
