import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';
import { verifyPassword } from './privacy-auth.js';

test('password hashes reject incorrect, differently cased and malformed credentials', () => {
  const password = randomBytes(16).toString('hex') + 'A';
  const salt = randomBytes(16).toString('hex');
  const hash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
  assert.equal(verifyPassword(password, hash), true);
  assert.equal(verifyPassword(password.toLowerCase(), hash), false);
  assert.equal(verifyPassword('wrong', hash), false);
  assert.equal(verifyPassword(null, hash), false);
  assert.equal(verifyPassword(password, 'bad'), false);
  assert.equal(verifyPassword(password, undefined), false);
});