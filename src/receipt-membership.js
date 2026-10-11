const normalizeName = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
const normalizePhone = (value) => String(value || '').replace(/\D/g, '');

export const receiptMembershipState = (membership, date) => {
  if (membership.cancelled) return 'cancelled';
  if (membership.startDate && membership.startDate > date) return 'not-started';
  if (membership.expiryDate && membership.expiryDate < date) return 'expired';
  if (Number(membership.usedSessions || 0) >= Number(membership.sessions || 0)) return 'exhausted';
  return 'ready';
};

export const resolveReceiptMembership = (form, existing, memberships, date) => {
  const phone = normalizePhone(form.phone);
  const name = normalizeName(form.client);
  if ((phone && phone.length !== 10) || (!phone && !name)) return { state: 'needs-client' };
  const candidates = memberships.filter((item) => phone
    ? normalizePhone(item.phone) === phone
    : normalizeName(item.name) === name);
  if (!phone && new Set(candidates.map((item) => normalizePhone(item.phone))).size > 1) {
    return { state: 'ambiguous' };
  }
  if (existing?.method === 'Member' && !existing.deleted) {
    const current = candidates.find((item) => item.id === existing.membershipId);
    // Editing a saved redemption retains its session, even after expiry or exhaustion.
    if (current) return { state: 'already-redeemed', membership: current, sessionNumber: existing.sessionNumber };
  }
  const redeemable = candidates.filter((item) => receiptMembershipState(item, date) === 'ready')
    .sort((first, second) => (first.expiryDate || '').localeCompare(second.expiryDate || ''));
  if (redeemable.length) {
    const membership = redeemable[0];
    return { state: 'ready', membership, sessionNumber: Number(membership.usedSessions || 0) + 1 };
  }
  if (!candidates.length) return { state: 'none' };
  const membership = [...candidates].sort((first, second) => (second.startDate || '').localeCompare(first.startDate || ''))[0];
  return { state: receiptMembershipState(membership, date), membership };
};
