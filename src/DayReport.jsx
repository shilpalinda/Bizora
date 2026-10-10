import { CalendarDays, FileBarChart, ReceiptText, UsersRound, Wallet } from 'lucide-react';
import { resolveAttendance } from './StaffAttendance.jsx';

const money = (value) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;
const shortDate = (iso) => iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const time = (value) => {
  if (!value) return '—';
  if (/[ap]m/i.test(value)) return value;
  const [hours, minutes] = value.split(':').map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}` : value;
};
const sumPaid = (rows) => rows.filter((row) => row.method !== 'Member' && !row.deleted).reduce((total, row) => total + (row.total ?? row.price ?? 0), 0);

function HistoricalTable({ title, count, headers, rows, empty }) {
  return <section className="day-report-block">
    <div className="day-report-block-head"><h4>{title}</h4><span>{count}</span></div>
    {rows.length ? <div className="rx-sheet-scroll"><table className="rx-sheet day-report-table"><thead><tr>{headers.map((header) => <th className="day-report-th" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || row.number || `${title}-${index}`} className={row.deleted ? 'day-report-deleted' : ''}>{row.cells.map((cell, cellIndex) => <td key={cellIndex} title={String(cell ?? '—')}>{cell || '—'}</td>)}</tr>)}</tbody></table></div> : <div className="day-report-empty">{empty}</div>}
  </section>;
}

export default function DayReport({ date, maxDate, onDateChange, appointments, receipts, expenses, memberships, visits, staff, attendance, eodReport, dailyRow, onSendEodReport }) {
  const activeReceipts = receipts.filter((item) => !item.deleted);
  const memberReceipts = activeReceipts.filter((item) => item.method === 'Member');
  const newMembershipReceipts = activeReceipts.filter((item) => item.transactionType === 'New Membership');
  const memberVisits = [...memberReceipts, ...visits.filter((visit) => !visit.receiptId)];
  const membershipSales = memberships.filter((item) => item.startDate === date);
  const normalCollection = sumPaid(activeReceipts.filter((item) => item.transactionType !== 'New Membership'));
  const membershipCollection = newMembershipReceipts.reduce((total, row) => total + (row.total ?? row.price ?? 0), 0) || membershipSales.reduce((total, item) => total + (item.totalAmount ?? item.amount ?? 0), 0);
  const totalCollection = normalCollection + membershipCollection;
  const expensesTotal = expenses.reduce((total, item) => total + (Number(item.amount) || 0), 0);
  const paidClients = activeReceipts.filter((item) => item.method !== 'Member').length;
  const staffAttendance = staff.map((member) => ({ member, entry: resolveAttendance(attendance || {}, member, date) }));
  const summary = [
    ['Appointments', appointments.length, CalendarDays],
    ['Paid visits', paidClients, UsersRound],
    ['Member visits', memberVisits.length, UsersRound],
    ['Memberships sold', membershipSales.length, ReceiptText],
    ['Collection', money(eodReport?.totalCollection ?? totalCollection), Wallet],
    ['Expenses', money(eodReport?.paymentsForDay ?? expensesTotal), FileBarChart],
    ['Present staff', staffAttendance.filter(({ entry }) => entry.status === 'Present').length, UsersRound],
    ['Week Off', staffAttendance.filter(({ entry }) => entry.status === 'Week Off').length, CalendarDays]
  ];
  const receiptRows = receipts.map((row) => ({ ...row, cells: [shortDate(row.date), row.client, row.phone, row.service, row.membership, row.duration, row.price != null ? money(row.price) : '—', row.method, row.transactionType, row.sessionNumber, row.staff, row.taxAmount ? money(row.taxAmount) : '—', row.notes, row.deleted ? 'Deleted' : 'Active'] }));
  const appointmentRows = appointments.map((item) => ({ ...item, cells: [shortDate(item.date), time(item.inTime || item.time), item.client, item.phone, item.service, item.duration, item.staff, item.status || 'Booked', item.notes] }));
  const expenseRows = expenses.map((item) => ({ ...item, cells: [shortDate(item.date), item.narration, item.source, money(item.amount)] }));
  const membershipRows = membershipSales.map((item) => ({ ...item, cells: [shortDate(item.startDate), item.memberId, item.name, item.phone, item.packageName, `${item.sessions} sessions`, item.paymentMode, money(item.amount), item.gstRate ? money(item.gstAmount) : '—', money(item.totalAmount ?? item.amount), shortDate(item.expiryDate), item.notes] }));
  const visitRows = visits.map((item) => ({ ...item, cells: [shortDate(item.date), item.name, item.phone, item.packageName, item.service, `Session ${item.sessionNumber}`, item.staff, '₹0', item.notes] }));
  const attendanceRows = staffAttendance.map(({ member, entry }) => ({ id: member.id, cells: [member.name, member.role, entry.status || 'Not marked', entry.checkIn || '—', entry.checkOut || '—', entry.notes || (entry.source === 'scheduled' ? 'Scheduled weekly off' : '—')] }));

  return <section className="panel rx-panel day-report-panel">
    <div className="rx-panel-head"><div><h3>Day Report</h3><span className="rx-count">Read-only historical records and daily totals</span></div><label className="day-report-date">Specific date<input type="date" value={date} max={maxDate} onChange={(event) => onDateChange(event.target.value)} /></label></div>
    <div className="day-report-summary">{summary.map(([label, value, Icon]) => <article key={label}><span><Icon size={14} strokeWidth={1.8} aria-hidden="true" />{label}</span><strong>{value}</strong></article>)}</div>
    {eodReport ? <section className="day-report-closeout"><div className="day-report-block-head"><div><h4>End-of-day closeout</h4><span>Closed by {eodReport.closedBy || '—'}</span></div><button type="button" className="secondary-button small" onClick={() => onSendEodReport?.(eodReport.id)}>{eodReport.sent ? 'Resend WhatsApp report' : 'Send WhatsApp report'}</button></div><div className="day-report-closeout-grid">{[['Paid clients', eodReport.regularPaidClients], ['Member clients', eodReport.membershipClientsServed], ['Membership sessions', eodReport.membershipSessionsUsed], ['New memberships', eodReport.newMembershipsSold ?? membershipSales.length], ['Receipts', eodReport.totalReceipts ?? receipts.length], ['Total collection', money(eodReport.totalCollection ?? totalCollection)], ['Membership collection', money(eodReport.membershipCollection ?? membershipCollection)], ['Normal service collection', money(eodReport.normalServiceCollection ?? Math.max(0, totalCollection - membershipCollection))], ['₹0 member visits', eodReport.zeroMembershipVisits ?? memberVisits.length]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section> : <p className="day-report-note">No closeout report exists for this date. Current totals are calculated from the saved records below.</p>}
    {dailyRow && <div className="day-report-ledger"><strong>Daily collection ledger</strong><span>Cash {money(dailyRow.cash)} · Card {money(dailyRow.card)} · GPay {money(dailyRow.gpay)} · Member visits {dailyRow.memberCount || 0} · Clients {dailyRow.clientCount || 0}</span></div>}
    <HistoricalTable title="Appointments" count={`${appointments.length} records`} headers={['Date', 'Time', 'Client', 'Phone', 'Service', 'Duration', 'Staff', 'Status', 'Notes']} rows={appointmentRows} empty="No appointments for this date." />
    <HistoricalTable title="Receipts and membership transactions" count={`${receipts.length} records`} headers={['Date', 'Client', 'Phone', 'Service', 'Membership', 'Duration', 'Price', 'Payment', 'Type', 'Session', 'Staff', 'Tax', 'Notes', 'Record']} rows={receiptRows} empty="No receipts for this date." />
    <HistoricalTable title="Memberships purchased" count={`${membershipSales.length} records`} headers={['Date', 'Member ID', 'Client', 'Phone', 'Package', 'Sessions', 'Payment', 'Price', 'GST', 'Total paid', 'Valid until', 'Notes']} rows={membershipRows} empty="No memberships purchased on this date." />
    <HistoricalTable title="Membership sessions used" count={`${visits.length} records`} headers={['Date', 'Client', 'Phone', 'Package', 'Service', 'Session', 'Staff', 'Collected', 'Notes']} rows={visitRows} empty="No membership sessions used on this date." />
    <HistoricalTable title="Expenses" count={`${expenses.length} records · ${money(expensesTotal)}`} headers={['Date', 'Description', 'Payment source', 'Amount']} rows={expenseRows} empty="No expenses for this date." />
    <HistoricalTable title="Staff attendance" count={`${staffAttendance.length} staff`} headers={['Staff', 'Role', 'Status', 'Check In', 'Check Out', 'Notes']} rows={attendanceRows} empty="No staff attendance records for this date." />
  </section>;
}