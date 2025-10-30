# Sumakey / backend (fixed)

Backend listo con:
- CommonJS + ts-node-dev
- Manejo SSL para Supabase (evita SELF_SIGNED_CERT_IN_CHAIN)
- Manejo claro de errores en /auth/register (muestra code/detail y 409 en duplicados)
- Health checks adicionales: /api/health/db y /api/health/full

## Pasos
1) Supabase → SQL Editor → ejecuta `db/supabase.sql`
2) `.env` (usa pooler 6543 y `sslmode=require&pgbouncer=true`)
3) `npm install`  →  `npm run dev`
4) Prueba:
   - `GET /api/health`
   - `GET /api/health/db` (conexión a BD)
   - `GET /api/health/full` (comprueba tablas)

## Endpoints clave (prefijo /api)
- POST `/auth/register`
- POST `/auth/login`
- GET  `/auth/me`
- POST `/program`
- GET  `/public/:slug`
- POST `/client/register`
- GET  `/client/:id`
- GET  `/business/clients`
- GET  `/qr/:clientId`
- POST `/scan/add-stamp`