import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

const host = process.env.PGHOST || 'localhost';
const port = Number(process.env.PGPORT) || 5432;
const user = process.env.PGUSER || 'postgres';
const password = process.env.PGPASSWORD || 'postgres';
const database = process.env.PGDATABASE || 'bizora';

async function ensureDatabaseExists() {
  const client = new Client({ host, port, user, password, database: 'postgres' });
  await client.connect();
  const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
  if (rowCount === 0) {
    // Database names cannot be parameterized; safe here since it comes from our own .env, not user input.
    await client.query(`CREATE DATABASE "${database}"`);
    console.log(`Created database "${database}"`);
  } else {
    console.log(`Database "${database}" already exists`);
  }
  await client.end();
}

async function runSchema() {
  const client = new Client({ host, port, user, password, database });
  await client.connect();
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  await client.query(schema);
  await client.end();
  console.log('Schema applied');
}

await ensureDatabaseExists();
await runSchema();
console.log('bizora database is ready');
