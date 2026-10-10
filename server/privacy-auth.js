import { scryptSync, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const verifyPassword = (password, encoded) => {
  if (typeof password !== 'string' || password.length > 256 || typeof encoded !== 'string') return false;
  const [scheme, salt, digest] = encoded.split(':');
  if (scheme !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(digest || '')) return false;
  const expected = Buffer.from(digest, 'hex');
  return timingSafeEqual(scryptSync(password, salt, 64), expected);
};

export const registerPrivacyAuth = (app) => {
  let config = {};
  try {
    config = JSON.parse(readFileSync(new URL('./privacy-secrets.json', import.meta.url), 'utf8'));
  } catch {
    console.warn('Privacy password verification is unavailable: configure server/privacy-secrets.json.');
  }
  const attempts = new Map();
  const limit = (req, res, next) => {
    const now = Date.now();
    for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
    const key = req.ip;
    const entry = attempts.get(key) || { count: 0, until: now + 60000 };
    entry.count += 1;
    attempts.set(key, entry);
    if (entry.count > 10) return res.status(429).json({ error: 'Too many attempts. Try again in a minute.' });
    next();
  };
  app.post('/api/privacy/activate', limit, (req, res) => {
    const hash = process.env.PRIVACY_ACTIVATION_HASH || config.activationHash;
    if (!hash) return res.status(503).json({ error: 'Privacy password is not configured.' });
    if (!verifyPassword(req.body?.password, hash)) return res.status(401).json({ error: 'Incorrect privacy password.' });
    res.json({ ok: true });
  });
  app.post('/api/privacy/reveal', limit, (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const hash = config.users?.[email];
    if (!verifyPassword(req.body?.password, hash)) return res.status(401).json({ error: 'Re-authentication failed.' });
    res.json({ ok: true });
  });
};