import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeTransactions, transactionAmount } from './transaction-summary.js';

const date = '2026-10-08';
const sale = { id: 'sale', date: '2026-10-01', phone: '9000000001', membershipId: 1, transactionType: 'New Membership', method: 'GPay', total: 12000 };
const visit = { id: 'session', date, phone: sale.phone, membershipId: 1, transactionType: 'Membership Session', method: 'Member', total: 12000 };

test('membership visits collect zero and do not repeat a previous membership sale', () => {
  const summary = summarizeTransactions(date, [sale, visit], [{ id: 1, date, receiptId: visit.id, phone: sale.phone }]);
  assert.equal(summary.totalCollection, 0);
  assert.equal(summary.membershipSessionsUsed, 1);
  assert.equal(summary.membershipClientsServed, 1);
  assert.equal(summary.totalReceipts, 1);
  assert.equal(transactionAmount(visit), 0);
});

test('same client is counted once across paid and membership visits', () => {
  const normal = { id: 'normal', date, phone: sale.phone, method: 'Cash', total: 2000 };
  const summary = summarizeTransactions(date, [visit, normal, { ...normal, id: 'normal2' }]);
  assert.equal(summary.totalClientsServed, 1);
  assert.equal(summary.regularPaidClients, 1);
  assert.equal(summary.membershipClientsServed, 1);
  assert.equal(summary.totalCollection, 4000);
});

test('deleted linked sales and visits are not resurrected by legacy fallback', () => {
  const deletedSale = { ...sale, date, deleted: true };
  const deletedVisit = { ...visit, deleted: true, visitId: 5 };
  const summary = summarizeTransactions(date, [deletedSale, deletedVisit], [{ id: 5, date, receiptId: visit.id }]);
  assert.equal(summary.totalCollection, 0);
  assert.equal(summary.newMembershipsSold, 0);
  assert.equal(summary.membershipSessionsUsed, 0);
});

test('unlinked legacy visits count as attendance, never as payments or receipts', () => {
  const summary = summarizeTransactions(date, [], [{ id: 5, date, phone: sale.phone }]);
  assert.equal(summary.membershipCollection, 0);
  assert.equal(summary.membershipSessionsUsed, 1);
  assert.equal(summary.totalClientsServed, 1);
  assert.equal(summary.totalReceipts, 0);
});

test('mixed daily collection separates normal, membership and zero visits', () => {
  const summary = summarizeTransactions(date, [{ ...sale, date }, visit, { date, phone: '9000000002', method: 'Card', price: 2000, taxAmount: 100 }]);
  assert.equal(summary.membershipCollection, 12000);
  assert.equal(summary.normalServiceCollection, 2100);
  assert.equal(summary.totalCollection, 14100);
  assert.equal(summary.newMembershipsSold, 1);
  assert.equal(summary.totalReceipts, 3);
});

test('membership purchasers count as paid and membership clients', () => {
  const summary = summarizeTransactions(sale.date, [sale]);
  assert.equal(summary.regularPaidClients, 1);
  assert.equal(summary.membershipClientsServed, 1);
  assert.equal(summary.membershipSessionsUsed, 0);
});

test('missing linked receipts do not resurrect visits and names are normalized', () => {
  const summary = summarizeTransactions(date, [
    { date, client: ' Jane   Doe ', method: 'Cash', total: 100 },
    { date, client: 'jane doe', transactionType: 'Member / No Payment', price: 12000 },
  ], [{ date, name: 'Someone else', receiptId: 'removed' }]);
  assert.equal(summary.totalClientsServed, 1);
  assert.equal(summary.membershipSessionsUsed, 1);
  assert.equal(summary.totalCollection, 100);
});
