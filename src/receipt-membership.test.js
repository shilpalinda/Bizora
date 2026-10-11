import assert from 'node:assert/strict';
import test from 'node:test';
import { receiptMembershipState, resolveReceiptMembership } from './receipt-membership.js';

const date = '2026-10-10';
const membership = { id: 1, name: 'Priya', phone: '9876543210', sessions: 8, usedSessions: 3, startDate: '2026-10-03', expiryDate: '2027-04-03' };
const form = { client: 'Priya', phone: membership.phone };
const lookup = (records = [membership], existing = null, input = form) => resolveReceiptMembership(input, existing, records, date);

test('selecting Member previews the next session without mutating the balance', () => {
  assert.equal(lookup().state, 'ready');
  assert.equal(lookup().sessionNumber, 4);
  assert.equal(membership.usedSessions, 3);
});

test('legacy numeric strings produce a numeric session number', () => {
  assert.equal(lookup([{ ...membership, sessions: '8', usedSessions: '3' }]).sessionNumber, 4);
});

test('incomplete phone cannot fall back to a name and redeem another client', () => {
  assert.equal(lookup([membership], null, { ...form, phone: '987' }).state, 'needs-client');
  assert.equal(lookup([membership], null, { ...form, phone: '9876543211' }).state, 'none');
});

test('exact-name lookup normalizes whitespace but blocks different clients with the same name', () => {
  assert.equal(lookup([membership], null, { client: '  PRIYA  ', phone: '' }).state, 'ready');
  assert.equal(lookup([membership, { ...membership, id: 2, phone: '9876543211' }], null, { client: 'Priya', phone: '' }).state, 'ambiguous');
});

test('new redemptions block exhausted, expired, cancelled and future packages', () => {
  for (const [changes, state] of [
    [{ usedSessions: 8 }, 'exhausted'],
    [{ expiryDate: '2026-10-09' }, 'expired'],
    [{ cancelled: true }, 'cancelled'],
    [{ startDate: '2026-10-11' }, 'not-started'],
    [{ sessions: 0 }, 'exhausted']
  ]) assert.equal(lookup([{ ...membership, ...changes }]).state, state);
  assert.equal(receiptMembershipState({ ...membership, expiryDate: date }, date), 'ready');
});

test('editing a redeemed receipt retains its session, including the last session', () => {
  const existing = { method: 'Member', membershipId: 1, sessionNumber: 8 };
  const result = lookup([{ ...membership, usedSessions: 8 }], existing);
  assert.equal(result.state, 'already-redeemed');
  assert.equal(result.sessionNumber, 8);
  assert.equal(lookup([{ ...membership, usedSessions: 8 }], { ...existing, deleted: true }).state, 'exhausted');
});

test('changing clients resolves the new membership instead of retaining the old redemption', () => {
  const next = { ...membership, id: 2, name: 'Meena', phone: '9876543211', usedSessions: 1 };
  const result = lookup([membership, next], { method: 'Member', membershipId: 1, sessionNumber: 4 }, { client: next.name, phone: next.phone });
  assert.equal(result.state, 'ready');
  assert.equal(result.membership.id, 2);
  assert.equal(result.sessionNumber, 2);
});

test('a usable package wins over exhausted packages and uses earliest expiry', () => {
  const result = lookup([{ ...membership, usedSessions: 8 }, { ...membership, id: 2, usedSessions: 0 }, { ...membership, id: 3, expiryDate: '2026-12-01' }]);
  assert.equal(result.membership.id, 3);
});
