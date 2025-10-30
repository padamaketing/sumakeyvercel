import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import { signToken } from '../middleware/auth';
import { z } from 'zod';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

authRouter.post('/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  const { name, email, password } = parse.data;
  const password_hash = await bcrypt.hash(password, 10);
  const slug = slugify(name);

  try {
    const { rows } = await query(`
      INSERT INTO businesses (name, email, password_hash, slug)
      VALUES ($1,$2,$3,$4)
      RETURNING id, name, email, slug, reward_name, reward_threshold, theme_color
    `, [name, email, password_hash, slug]);

    const business = rows[0];
    const token = signToken(business.id);
    res.json({ token, business });

  } catch (err: any) {
    console.error('Register error:', { code: err?.code, detail: err?.detail, message: err?.message });
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'Email o slug ya existe', code: 'DUPLICATE' });
    }
    return res.status(500).json({
      error: 'Error registrando negocio',
      code: err?.code || null,
      detail: err?.detail || err?.message || null
    });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

authRouter.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  const { email, password } = parse.data;
  const { rows } = await query(
    `SELECT id, name, email, password_hash, slug, reward_name, reward_threshold, theme_color
     FROM businesses
     WHERE email=$1`,
    [email]
  );

  const biz = rows[0];
  if (!biz) return res.status(401).json({ error: 'Credenciales inválidas' });

  const ok = await bcrypt.compare(password, biz.password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = signToken(biz.id);
  delete (biz as any).password_hash;

  res.json({ token, business: biz });
});

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 50);
}