import { Router } from 'express';
import { requireAuth } from '../utils/auth';
import { query } from '../db';

const router = Router();

// GET ajustes (incluye caducidad)
router.get('/settings', requireAuth, async (req: any, res) => {
  const businessId = req.user.businessId;
  const { rows } = await query(
    `
    select id, name, slug, reward_name, reward_threshold,
           card_expiration_mode, card_expiration_date, card_expiration_days
      from businesses
     where id = $1
    `,
    [businessId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Business not found' });
  res.json({ business: rows[0] });
});

// POST caducidad
router.post('/expiration', requireAuth, async (req: any, res) => {
  const businessId = req.user.businessId;
  const { mode, date, days } = req.body as {
    mode: 'none' | 'fixed_date' | 'days_from_signup';
    date?: string;
    days?: number;
  };

  if (!mode || !['none', 'fixed_date', 'days_from_signup'].includes(mode)) {
    return res.status(400).json({ error: 'Modo inválido' });
  }
  if (mode === 'fixed_date' && !date) {
    return res.status(400).json({ error: 'Falta fecha para fixed_date' });
  }
  if (mode === 'days_from_signup' && (!days || days <= 0)) {
    return res.status(400).json({ error: 'Faltan días (>0) para days_from_signup' });
  }

  const { rows } = await query(
    `
    update businesses
       set card_expiration_mode = $2,
           card_expiration_date = $3,
           card_expiration_days = $4
     where id = $1
     returning id, name, slug, card_expiration_mode, card_expiration_date, card_expiration_days
    `,
    [businessId, mode, mode === 'fixed_date' ? date : null, mode === 'days_from_signup' ? days : null]
  );

  res.json({ ok: true, business: rows[0] });
});

// ✅ Exporta de las dos formas (default y nombrado) para evitar undefined por discrepancias de import
export const restaurantRouter = router;
export default router;
