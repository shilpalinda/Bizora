import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db.js';
import { registerPrivacyAuth } from './privacy-auth.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
registerPrivacyAuth(app);

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Returns every stored key as { [key]: value }, mirroring the shape of the old localStorage bundle.
app.get('/api/state', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM app_state');
    const state = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/state/:key', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT value FROM app_state WHERE key = $1', [req.params.key]);
    res.json({ value: rows[0]?.value ?? null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/state/:key', async (req, res) => {
  try {
    const value = req.body?.value ?? null;
    await pool.query(
      `INSERT INTO app_state (key, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [req.params.key, JSON.stringify(value)]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`Bizora API listening on http://localhost:${port}`));
