export const isMemberSession = (entry) => entry.method === 'Member' || ['Membership Session', 'Member / No Payment'].includes(entry.transactionType);

export const transactionAmount = (entry) => isMemberSession(entry) ? 0 : Number(entry.total ?? (
  (entry.price ?? ((entry.cash || 0) + (entry.card || 0) + (entry.gpay || 0) + (entry.memberFee || 0))) +
  (entry.taxAmount ?? ((entry.cardGst || 0) + (entry.gpayGst || 0)))
));

const clientKey = (entry) => {
  const phone = String(entry.phone || '').replace(/\D/g, '');
  const name = String(entry.client || entry.name || '').trim().replace(/\s+/g, ' ').toLowerCase();
  return phone ? `phone:${phone}` : name ? `name:${name}` : null;
};
const clientCount = (entries) => new Set(entries.map(clientKey).filter(Boolean)).size;

export const summarizeTransactions = (date, receipts, visits = []) => {
  const dayReceipts = receipts.filter((entry) => entry.date === date);
  const active = dayReceipts.filter((entry) => !entry.deleted);
  const sessionReceipts = active.filter(isMemberSession);
  const paid = active.filter((entry) => !isMemberSession(entry));
  const unlinkedVisits = visits.filter((visit) => visit.date === date && !visit.receiptId && !dayReceipts.some((entry) =>
    entry.id === visit.receiptId || entry.visitId === visit.id));
  const memberActivity = [...sessionReceipts, ...unlinkedVisits];
  const paidActivity = paid;
  const membershipCollection = paid.filter((entry) => entry.transactionType === 'New Membership')
    .reduce((sum, entry) => sum + transactionAmount(entry), 0);
  const normalServiceCollection = paid.filter((entry) => entry.transactionType !== 'New Membership')
    .reduce((sum, entry) => sum + transactionAmount(entry), 0);
  return {
    totalClientsServed: clientCount([...paidActivity, ...memberActivity]),
    regularPaidClients: clientCount(paidActivity.filter((entry) => transactionAmount(entry) > 0)),
    membershipClientsServed: clientCount([...memberActivity, ...paid.filter((entry) => entry.transactionType === 'New Membership')]),
    membershipSessionsUsed: memberActivity.length,
    newMembershipsSold: paid.filter((entry) => entry.transactionType === 'New Membership').length,
    totalReceipts: active.length,
    totalCollection: membershipCollection + normalServiceCollection,
    membershipCollection,
    normalServiceCollection,
    zeroMembershipVisits: memberActivity.length,
    membershipSessionCollection: 0,
    membershipRevenueToday: membershipCollection
  };
};
