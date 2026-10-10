export const calculateMembershipPayment = (amount, paymentMode) => {
  const base = Number(amount) || 0;
  const gstRate = ['Card', 'GPay', 'GPay / UPI', 'UPI'].includes(paymentMode) ? 5 : 0;
  const gstAmount = Math.round(base * gstRate) / 100;
  return { gstRate, gstAmount, totalAmount: Math.round((base + gstAmount) * 100) / 100 };
};

export const formatMembershipMoney = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;