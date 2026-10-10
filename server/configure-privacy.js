import { randomBytes, scryptSync } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';

const hash = (password) => {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};
const readPassword = async (label) => {
  process.stdout.write(`${label}: `);
  const output = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  const reader = createInterface({ input: process.stdin, output, terminal: true });
  try {
    const password = await reader.question('');
    if (!password || password.length > 256) throw new Error('Password must contain 1-256 characters.');
    process.stdout.write('\n');
    return password;
  } finally {
    reader.close();
  }
};

const config = { activationHash: hash(await readPassword('Privacy activation password')), users: {} };
for (const email of ['frontdesk@bizora.com', 'manager@bizora.com', 'superuser@bizora.com']) {
  config.users[email] = hash(await readPassword(`Current login password for ${email}`));
}
writeFileSync(new URL('./privacy-secrets.json', import.meta.url), JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
console.log('Privacy hashes configured. Restart the API server.');