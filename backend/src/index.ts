// src/index.ts
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Carga .env de forma defensiva y muestra cuál se ha cargado
const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env'), // por si el cwd difiere
];
let loaded = false;
for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    console.log('[env] Loaded:', p);
    loaded = true;
    break;
  }
}
if (!loaded) {
  console.warn('[env] .env not found. Tried:', candidates.join(' | '));
}

import { createServer } from './server';

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
if (!process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL is not set. process.cwd() =', process.cwd());
}

const app = createServer();
app.listen(port, () => {
  console.log(`Sumakey API listening on http://localhost:${port}`);
});
