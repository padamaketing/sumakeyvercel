import { Router } from 'express';
import { query } from '../db';

export const publicRouter = Router();

publicRouter.get('/public/:slug', async (req, res) => {
  const { slug } = req.params;
  const { rows } = await query(`
    SELECT id, name, slug, reward_name, reward_threshold, theme_color
    FROM businesses WHERE slug=$1
  `, [slug]);
  if (!rows[0]) return res.status(404).json({ error: 'Negocio no encontrado' });
  res.json({ business: rows[0] });
});