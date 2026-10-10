import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import StaffAttendance, { WEEKDAY_SHORT } from './StaffAttendance.jsx';
import DayReport from './DayReport.jsx';
import { calculateMembershipPayment, formatMembershipMoney } from './membership-payment.js';
import { isPrivacyActive, PrivacyControls, PrivacyPlaceholder, usePrivacyDisplay } from './PrivacyDisplay.jsx';
import { AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, Bell, CalendarClock, CalendarRange, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Contact, Download, FileBarChart, Filter, Gem, Inbox, Info, LayoutDashboard, Lock, Pencil, Plus, Printer, ReceiptText, RotateCcw, Search, Settings, Sparkles, Trash2, UserPlus, UsersRound, Wallet, X } from 'lucide-react';

const appointments = [];

const navItems = [['Dashboard', '⌂'], ['Appointments', '◷'], ['Daily Receipts', '▤'], ['Daily Payments (Exp)', '↘'], ['Membership Plan', '◎'], ['Settings', '⚙'], ['Client Directory', '◌'], ['Team', '♙'], ['Menu', '✦'], ['Report(s)', '▥', 'section'], ['Daily Report', '▤', 'sub'], ['Daily Summary', '◒', 'sub']];
const frontdeskNavItems = [['Appointments', '◷'], ['Daily Receipts', '▤'], ['Daily Payments (Exp)', '↘'], ['Membership Plan', '◎'], ['Settings', '⚙'], ['Client Directory', '◌'], ['Team', '♙'], ['Menu', '✦'], ['Report(s)', '▥', 'section'], ['Daily Report', '▤', 'sub'], ['Daily Summary', '◒', 'sub']];
const USERS = {
  'frontdesk@bizora.com': { role: 'Frontdesk', password: 'bizora' },
  'manager@bizora.com': { role: 'Manager', password: 'bizora' },
  'superuser@bizora.com': { role: 'Superuser', password: 'bizora' }
};
const STORAGE = {
  businessDate: 'bizora-business-date',
  closedDates: 'bizora-closed-dates',
  receiptEntries: 'bizora-receipt-entries',
  deletionLogs: 'bizora-deletion-logs',
  appointments: 'bizora-appointments',
  services: 'bizora-services',
  staff: 'bizora-staff',
  clients: 'bizora-clients',
  memberships: 'bizora-memberships',
  nextMemberId: 'bizora-next-member-id',
  monthlyTargets: 'bizora-monthly-targets',
  eodReports: 'bizora-eod-reports',
  whatsappNumber: 'bizora-whatsapp-number',
  businessProfile: 'bizora-business-profile',
  preferences: 'bizora-preferences',
  membershipPackages: 'bizora-membership-packages',
  membershipVisits: 'bizora-membership-visits',
  staffAttendance: 'bizora-staff-attendance',
  dailyRows: 'bizora-daily-rows',
  dailyExpenses: 'bizora-daily-expenses'
};
const membershipDurations = ['1 Month', '3 Months', '6 Months', '1 Year'];
const membershipBranches = ['Main Branch'];

const calculateOutTime = (inTime, durationStr) => {
  if (!inTime) return '--:--';
  const durationMatch = durationStr ? durationStr.match(/\d+/) : null;
  const durationMins = durationMatch ? parseInt(durationMatch[0], 10) : 60;
  const parts = inTime.replace(/\s*[AaPp][Mm]/, '').split(':');
  let hours = parseInt(parts[0], 10) || 10;
  let minutes = parseInt(parts[1], 10) || 0;
  if (inTime.toLowerCase().includes('pm') && hours < 12) hours += 12;
  if (inTime.toLowerCase().includes('am') && hours === 12) hours = 0;
  const totalMins = hours * 60 + minutes + durationMins;
  const outHours = Math.floor(totalMins / 60) % 24;
  const outMins = totalMins % 60;
  return `${String(outHours).padStart(2, '0')}:${String(outMins).padStart(2, '0')}`;
};

const formatTime12h = (time24) => {
  if (!time24) return '--:--';
  const twelveHourMatch = time24.match(/^\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])\s*$/);
  if (twelveHourMatch) return `${Number(twelveHourMatch[1])}:${twelveHourMatch[2]} ${twelveHourMatch[3].toUpperCase()}`;
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h)}:${m} ${ampm}`;
};
const appointmentHours = Array.from({ length: 14 }, (_, index) => {
  const hour24 = index + 9;
  return `${hour24 > 12 ? hour24 - 12 : hour24} ${hour24 < 12 ? 'AM' : 'PM'}`;
});
const appointmentMinutes = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0'));
const getAppointmentTimeParts = (time) => {
  const match = formatTime12h(time).match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
  return match ? { hour: `${Number(match[1])} ${match[3]}`, minute: match[2] } : { hour: '10 AM', minute: '00' };
};
const receiptPaymentModes = ['GPay', 'Cash', 'Card', 'Member'];
const receiptDurations = ['30 min', '45 min', '60 min', '90 min', '120 min'];
// [key, header, kind]; widths live in styles.css (.rx-col-<key>) so breakpoints can tighten them.
const receiptColumns = [['date', 'Date', 'date'], ['client', 'Client', 'text'], ['phone', 'Phone', 'text'], ['duration', 'Duration', 'text'], ['service', 'Service', 'text'], ['membership', 'Membership', 'text'], ['sessionNumber', 'Session', 'text'], ['price', 'Price', 'num'], ['method', 'Payment', 'text'], ['taxAmount', 'Tax', 'num'], ['staff', 'Staff', 'text'], ['towelKit', 'Towel Kit', 'num'], ['notes', 'Notes', 'text']];
const navIconComponents = { Dashboard: LayoutDashboard, Appointments: CalendarClock, 'Daily Receipts': ReceiptText, 'Daily Payments (Exp)': Wallet, 'Membership Plan': Gem, Settings, 'Client Directory': Contact, Team: UsersRound, Menu: Sparkles, 'Daily Report': FileBarChart, 'Daily Summary': CalendarRange };
const formatGridDate = (iso) => { const [year, month, day] = (iso || '').split('-'); return day ? `${day}/${month}/${year.slice(2)}` : '—'; };
const receiptCellValue = (row, key) => key === 'date' ? formatGridDate(row.date) : key === 'membership' ? (row.membership || '—') : key === 'transactionType' ? (row.transactionType || 'Normal Payment') : key === 'sessionNumber' ? (row.sessionNumber || '—') : key === 'price' || key === 'taxAmount' || key === 'towelKit' ? money(row[key]) : row[key] || '—';
const receiptCellTitle = (row, key, value) => {
  if (key === 'duration' && row.inTime) return `${row.duration} · ${formatTime12h(row.inTime)} – ${formatTime12h(row.outTime)}`;
  if (key === 'taxAmount') return row.taxAmount ? `${money(row.taxAmount)} (${row.taxRate}% of ${money(row.price)})` : 'No tax';
  if (key === 'membership') return row.membership ? `${row.membership}${row.memberId ? ` · ${row.memberId}` : ''}` : 'Not a membership transaction';
  if (key === 'price' && row.method === 'Member') return 'Included in membership';
  return key === 'date' ? row.date : String(value);
};
const receiptCellContent = (row, key, value) => {
  if (key === 'membership' && row.membership) return <span className="rx-member-tag"><Check size={11} strokeWidth={2.6} aria-hidden="true" />{value}</span>;
  if (key === 'transactionType') return <span className={`rx-transaction-type rx-type-${row.transactionType === 'New Membership' ? 'membership' : row.transactionType === 'Membership Session' ? 'member' : 'paid'}`}>{value}</span>;
  if (key === 'method') return <span className={`rx-pay rx-pay-${String(row.method).toLowerCase().replace(/[^a-z]/g, '')}`}>{value}</span>;
  return value;
};
const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatMemberDate = (iso) => { const [year, month, day] = (iso || '').split('-'); return day ? `${day}-${shortMonthNames[Number(month) - 1]}-${year}` : '—'; };
const normalizeReceiptMethod = (method) => method === 'GPay / UPI' || method === 'UPI' ? 'GPay' : method || 'Cash';
// Maps onto the cash/card/gpay buckets that the Monthly Report and EOD totals read; Member visits collect no money.
const splitReceiptPayment = (method, base, tax) => method === 'Member' ? { cash: 0, card: 0, cardGst: 0, gpay: 0, gpayGst: 0 } : method === 'Card' ? { cash: 0, card: base, cardGst: tax, gpay: 0, gpayGst: 0 } : method === 'GPay' || method === 'UPI' || method === 'Bank Transfer' ? { cash: 0, card: 0, cardGst: 0, gpay: base, gpayGst: tax } : { cash: base, card: 0, cardGst: 0, gpay: 0, gpayGst: 0 };
const receiptRevenueBucket = (method) => method === 'Member' ? 'Member' : method === 'Card' ? 'Card' : method === 'Cash' || method === 'Other' ? 'Cash' : 'GPay';
// Older receipts stored an items[] list instead of a single service row.
const toReceiptRow = (entry) => {
  const items = entry.items || [];
  return {
    ...entry,
    phone: entry.phone || '',
    notes: entry.notes || '',
    duration: entry.duration || '',
    method: normalizeReceiptMethod(entry.method),
    service: entry.service ?? items.map((item) => item.service).join(', '),
    transactionType: entry.transactionType || (entry.method === 'Member' ? 'Membership Session' : 'Normal Payment'),
    membership: entry.membership || (entry.packageName ? `${entry.packageName} · ${entry.sessionsTotal || entry.sessions || ''} sessions` : entry.method === 'Member' ? 'Membership' : ''),
    sessionNumber: entry.sessionNumber ? `${entry.sessionNumber}/${entry.sessionsTotal || entry.sessions || ''}` : '',
    staff: entry.staff ?? [...new Set(items.map((item) => item.staff))].join(', '),
    price: entry.price ?? (entry.cash || 0) + (entry.card || 0) + (entry.gpay || 0),
    taxAmount: entry.taxAmount ?? (entry.cardGst || 0) + (entry.gpayGst || 0),
    taxRate: Number(entry.tax) || 0,
    towelKit: entry.towelKit || 0
  };
};
const buildReceiptForm = (date, prefs, service) => ({ date, client: '', phone: '', time: '10:00 AM', duration: service?.duration || '60 min', service: service?.name || '', staff: service?.staff || '', price: service ? String(service.price) : '', method: '', tax: '0', towelKit: prefs?.defaultTowelKitFee || '0', notes: '' });

const getInitialAppointments = (baseDate) => [
  { id: 'APT-1001', date: baseDate, inTime: '09:30', outTime: '11:00', client: 'Nisha Sharma', phone: '9876543214', service: 'Hair Spa', staff: 'Anu', duration: '90 min', status: 'Upcoming', completed: false, colorTag: 'default', payment: 'Pending', notes: 'Scalp treatment' },
  { id: 'APT-1002', date: baseDate, inTime: '10:00', outTime: '11:00', client: 'Priya Patel', phone: '9876543210', service: 'Facial', staff: 'Priya', duration: '60 min', status: 'Arrived', completed: false, colorTag: 'blue', payment: 'Pending', notes: 'Herbal facial' },
  { id: 'APT-1003', date: baseDate, inTime: '11:30', outTime: '12:30', client: 'Ravi Kumar', phone: '9876543211', service: 'Swedish Massage', staff: 'Meena', duration: '60 min', status: 'Completed', completed: true, colorTag: 'green', payment: 'Paid', notes: 'Regular client' },
  { id: 'APT-1004', date: baseDate, inTime: '14:00', outTime: '14:30', client: 'Shreya Roy', phone: '9876543213', service: 'Manicure', staff: 'Kavya', duration: '30 min', status: 'Upcoming', completed: false, colorTag: 'default', payment: 'Pending', notes: 'French manicure' },
  { id: 'APT-1005', date: baseDate, inTime: '16:00', outTime: '18:00', client: 'Anand Verma', phone: '9876543215', service: 'Balinese Massage', staff: 'Meena', duration: '120 min', status: 'Not Coming', completed: false, colorTag: 'red', payment: 'Pay at visit', notes: 'Client called: not coming' },
  { id: 'APT-1006', date: addDaysISO(baseDate, 1), inTime: '10:30', outTime: '11:30', client: 'Kavita Menon', phone: '9876543220', service: 'Facial', staff: 'Priya', duration: '60 min', status: 'Upcoming', completed: false, colorTag: 'default', payment: 'Pending', notes: 'First visit' },
  { id: 'APT-1007', date: addDaysISO(baseDate, 1), inTime: '13:00', outTime: '14:00', client: 'Rajesh Gupta', phone: '9876543221', service: 'Swedish Massage', staff: 'Meena', duration: '60 min', status: 'Upcoming', completed: false, colorTag: 'default', payment: 'Paid', notes: 'Aroma oil' },
  { id: 'APT-1008', date: addDaysISO(baseDate, 1), inTime: '15:30', outTime: '16:15', client: 'Deepa Rao', phone: '9876543222', service: 'Hair Cut', staff: 'Anu', duration: '45 min', status: 'Upcoming', completed: false, colorTag: 'default', payment: 'Pending', notes: 'Styling' }
];

const API_BASE = `${window.location.protocol}//${window.location.hostname}:4000/api`;
const NEXT_RECEIPT_NUMBER_KEY = 'salon-next-receipt-number-v2';
const SYNCED_FLAG_KEY = 'bizora-synced-from-server';

const loadJSON = (key, fallback) => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};
// Writes go to localStorage immediately (fast, offline-safe) and to Postgres in the background.
const saveJSON = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
  fetch(`${API_BASE}/state/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value })
  }).catch(() => { /* backend offline — app keeps working from localStorage */ });
};
const fetchAllServerState = async () => {
  try {
    const response = await fetch(`${API_BASE}/state`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};
const toISODate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const todayISO = () => toISODate(new Date());
const addDaysISO = (iso, days) => {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toISODate(date);
};
const addMonthsISO = (iso, months) => {
  const date = new Date(`${iso}T00:00:00`);
  date.setMonth(date.getMonth() + Number(months || 0));
  return toISODate(date);
};
const getMembershipStatus = (membership) => {
  if (membership.cancelled) return 'Cancelled';
  if ((membership.usedSessions || 0) >= membership.sessions) return 'Sessions Completed';
  if (membership.expiryDate && membership.expiryDate < todayISO()) return 'Expired';
  return 'Active';
};
const canRedeemSession = (membership) => getMembershipStatus(membership) === 'Active' && (membership.sessions - (membership.usedSessions || 0)) > 0;
const formatDisplayDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const sanitizePhone = (value) => value.replace(/\D/g, '').slice(0, 10);
const routeFor = (label) => {
  if (label === 'Daily Receipts') return 'Receipts';
  if (label === 'Daily Report') return 'EOD Reports';
  if (label === 'Monthly Report' || label === 'Daily Summary') return 'Daily Receipts';
  if (label === 'Daily Payments (Exp)' || label === 'Daily Payments') return 'Expenditure';
  if (label === 'Membership Plan' || label === 'Membership') return 'Memberships';
  if (label === 'Target Set Up' || label === 'Target Setup' || label === 'Settings') return 'Targets';
  if (label === 'Client Directory') return 'Clients';
  if (label === 'Team') return 'Staff';
  if (label === 'Menu') return 'Services';
  return label;
};
const getMonthKey = (dateISO) => (dateISO || todayISO()).slice(0, 7);
const formatMonthLabel = (monthKey) => new Date(`${monthKey}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
const chartBars = [0, 0, 0, 0, 0, 0];
const expenseBreakdown = [];
const paymentRows = [];
const defaultServices = [
  { id: 1, name: 'Swedish Massage', price: 2000, duration: '60 min', staff: 'Meena' },
  { id: 2, name: 'Facial', price: 1500, duration: '60 min', staff: 'Priya' },
  { id: 3, name: 'Hair Spa', price: 2500, duration: '90 min', staff: 'Anu' },
  { id: 4, name: 'Manicure', price: 1000, duration: '30 min', staff: 'Kavya' },
  { id: 5, name: 'Hair Cut', price: 1200, duration: '45 min', staff: 'Priya' }
];
const defaultStaff = [
  { id: 1, name: 'Meena', phone: '9876543211', role: 'Massage Therapist' },
  { id: 2, name: 'Priya', phone: '9876543212', role: 'Facial Therapist' },
  { id: 3, name: 'Anu', phone: '9876543213', role: 'Hair Specialist' },
  { id: 4, name: 'Kavya', phone: '9876543214', role: 'Nail Technician' }
];
const defaultBusinessProfile = { name: 'Bizora', tagline: 'Business manager', phone: '', gstNumber: '', address: '', openTime: '09:00', closeTime: '20:00' };
const defaultPreferences = { defaultTaxRate: '5', defaultTowelKitFee: '0', lowCashAlert: '5000' };
const defaultMembershipPackages = [
  { id: 1, name: 'Basic 8', sessions: 8, price: 12000, validityMonths: 6, active: true, notes: '' },
  { id: 2, name: 'Premium 10', sessions: 10, price: 15000, validityMonths: 6, active: true, notes: '' },
  { id: 3, name: 'Gold 15', sessions: 15, price: 20000, validityMonths: 12, active: true, notes: '' }
];
const receiptServices = defaultServices.map((service) => [service.name, service.staff, service.price]);
const appointmentServices = defaultServices.map((service) => [service.name, service.staff, service.duration]);
const initialDailyReceipts = [
  { id: 1, day: 'Sunday', date: '2026-08-09', cash: 60000, card: 18500, cardGst: 925, gpay: 15500, gpayGst: 775, memberFee: 0, memberCount: 0, clientCount: 0, towelKit: 0 },
  { id: 2, day: 'Monday', date: '2026-08-10', cash: 47500, card: 16000, cardGst: 800, gpay: 5000, gpayGst: 250, memberFee: 0, memberCount: 25, clientCount: 5, towelKit: 12500 },
  { id: 3, day: 'Tuesday', date: '2026-08-11', cash: 59000, card: 9500, cardGst: 475, gpay: 5000, gpayGst: 250, memberFee: 0, memberCount: 27, clientCount: 2, towelKit: 13500 },
  { id: 4, day: 'Wednesday', date: '2026-08-12', cash: 59175, card: 11000, cardGst: 550, gpay: 0, gpayGst: 0, memberFee: 0, memberCount: 16, clientCount: 5, towelKit: 8000 },
  { id: 5, day: 'Thursday', date: '2026-08-13', cash: 58000, card: 2500, cardGst: 125, gpay: 2500, gpayGst: 125, memberFee: 0, memberCount: 18, clientCount: 10, towelKit: 9000 },
  { id: 6, day: 'Friday', date: '2026-08-14', cash: 76000, card: 7500, cardGst: 375, gpay: 6000, gpayGst: 300, memberFee: 0, memberCount: 27, clientCount: 10, towelKit: 13500 },
  { id: 7, day: 'Saturday', date: '2026-08-15', cash: 65000, card: 3500, cardGst: 175, gpay: 27500, gpayGst: 1375, memberFee: 0, memberCount: 0, clientCount: 0, towelKit: 0 }
];
const initialDailyExpenses = [];
const money = (value) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;
const buildProgressBar = (achieved, target, slots = 10) => {
  if (!target) return '░'.repeat(slots) + ' 0%';
  const ratio = Math.max(0, Math.min(1, achieved / target));
  const filled = Math.round(ratio * slots);
  return `${'█'.repeat(filled)}${'░'.repeat(slots - filled)} ${Math.round(ratio * 100)}%`;
};
const buildEodMessage = (report, businessName = 'Bizora') => [
  `🌸 *${businessName.toUpperCase()} — END OF DAY REPORT* 🌸`,
  `📅 ${report.day}`,
  '━━━━━━━━━━━━━━━━━━',
  '💰 *RECEIPTS*',
  `Opening balance: ${money(report.openingBalance)}`,
  `Cash: ${money(report.cash)}`,
  `Card: ${money(report.card)}`,
  `GPay: ${money(report.gpay)}`,
  `*Total collected: ${money(report.totalCollection ?? report.receiptsSubtotal)}*`,
  `Towel cash: - ${money(report.towelCash)}`,
  `*Receipts after towel cash: ${money(report.receiptsAfterTowel)}*`,
  '',
  '� *PAYMENTS*',
  `Expenses for the day: ${money(report.paymentsForDay)}`,
  '',
  '🏦 *CLOSING BALANCE*',
  `*${money(report.closingBalance)}*`,
  '━━━━━━━━━━━━━━━━━━',
  '🎯 *MONTHLY TARGET*',
  `Target: ${money(report.targetAmount)}`,
  `Achieved so far: ${money(report.achievedSoFar)}`,
  buildProgressBar(report.achievedSoFar, report.targetAmount),
  '━━━━━━━━━━━━━━━━━━',
  '👥 *CLIENT FOOTFALL*',
  `Total clients served: ${report.totalClientsServed}`,
  `Regular paid clients: ${report.regularPaidClients}`,
  `Number of membership clients: ${report.membershipClientsServed}`,
  `Membership sessions used: ${report.membershipSessionsUsed}`,
  `New memberships sold: ${report.newMembershipsSold || 0}`,
  `Membership collection: ${money(report.membershipCollection || 0)}`,
  `Normal service collection: ${money(report.normalServiceCollection || 0)}`,
  `₹0 membership visits: ${report.zeroMembershipVisits || 0}`,
  '━━━━━━━━━━━━━━━━━━',
  `✅ Closed by ${report.closedBy} · ${new Date(report.closedAt).toLocaleString('en-IN')}`
].join('\n');

function MonthlyStatement({ snapshots, totalReceipts, totalPayments, closingBalance }) {
  return <section className="panel monthly-statement"><div className="panel-header"><div><p className="panel-kicker">Monthly transaction snapshot</p><h2>Daily balances</h2></div><span className="form-status">{snapshots.length} days</span></div><div className="monthly-table-wrap"><table className="excel-table monthly-snapshot-table"><thead><tr><th>Date</th><th>Opening Balance</th><th>Total Receipts</th><th>Total Payments</th><th>Closing Balance</th></tr></thead><tbody>{snapshots.map((snapshot) => <tr key={snapshot.date}><td><strong>{snapshot.date}</strong></td><td>{money(snapshot.openingBalance)}</td><td>{money(snapshot.receipts)}</td><td>{money(snapshot.payments)}</td><td><strong>{money(snapshot.closingBalance)}</strong></td></tr>)}</tbody></table></div><div className="monthly-total-grid"><article><span>Total Receipts</span><strong>{money(totalReceipts)}</strong><small>For selected date range</small></article><article><span>Total Payments</span><strong>{money(totalPayments)}</strong><small>Expenses and cashouts</small></article><article className="monthly-final"><span>Closing Balance</span><strong>{money(closingBalance)}</strong><small>Balance at end of selected range</small></article></div></section>;
}

function App() {
  const privacyActive = usePrivacyDisplay();
  const [privacyPage, setPrivacyPage] = useState(null);
  useEffect(() => { if (!privacyActive) setPrivacyPage(null); }, [privacyActive]);
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [stateHydrated, setStateHydrated] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [page, setPage] = useState('Dashboard');
  const [businessDate, setBusinessDate] = useState(() => {
    const today = todayISO();
    const stored = loadJSON(STORAGE.businessDate, null);
    if (stored && stored <= today) return stored;
    saveJSON(STORAGE.businessDate, today);
    return today;
  });
  const [dayReportDate, setDayReportDate] = useState(businessDate);
  const [closedDates, setClosedDates] = useState(() => loadJSON(STORAGE.closedDates, []));
  const [receiptEntries, setReceiptEntries] = useState(() => loadJSON(STORAGE.receiptEntries, []));
  const [deletionLogs, setDeletionLogs] = useState(() => loadJSON(STORAGE.deletionLogs, []));
  const [showDeletedReceipts, setShowDeletedReceipts] = useState(false);
  const [range, setRange] = useState('Today');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState(null);
  const [receiptForm, setReceiptForm] = useState(() => buildReceiptForm(businessDate, loadJSON(STORAGE.preferences, defaultPreferences), loadJSON(STORAGE.services, defaultServices)[0]));
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [editingReceiptId, setEditingReceiptId] = useState(null);
  const [receiptError, setReceiptError] = useState('');
  const [receiptSearch, setReceiptSearch] = useState('');
  const [receiptMethodFilter, setReceiptMethodFilter] = useState('All');
  const [receiptStaffFilter, setReceiptStaffFilter] = useState('All');
  const [exportingReceipts, setExportingReceipts] = useState(false);
  const [receiptSort, setReceiptSort] = useState({ key: 'date', dir: 'desc' });
  const [receiptConfirm, setReceiptConfirm] = useState(null);
  const [nextReceiptNumber, setNextReceiptNumber] = useState(() => Number(window.localStorage.getItem(NEXT_RECEIPT_NUMBER_KEY)) || 1);
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState(() => {
    return businessDate;
  });
  const [appointmentsList, setAppointmentsList] = useState(() => {
    const stored = loadJSON(STORAGE.appointments, null);
    if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    const initial = getInitialAppointments(businessDate);
    saveJSON(STORAGE.appointments, initial);
    return initial;
  });
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [appointment, setAppointment] = useState(() => ({
    client: '',
    phone: '',
    date: businessDate,
    time: '10:00 AM',
    inTime: '10:00 AM',
    outTime: '11:00 AM',
    service: 'Swedish Massage',
    staff: 'Meena',
    duration: '60 min',
    status: 'Booked',
    payment: 'Pending',
    notes: '',
    colorTag: 'default',
    completed: false
  }));
  const [appointmentError, setAppointmentError] = useState('');
  const [savedAppointment, setSavedAppointment] = useState(null);
  const [clients, setClients] = useState(() => loadJSON(STORAGE.clients, []));
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientForm, setClientForm] = useState({ name: '', phone: '' });
  const [clientError, setClientError] = useState('');
  const [services, setServices] = useState(() => loadJSON(STORAGE.services, defaultServices));
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: '', price: '', duration: '60 min', staff: 'Meena' });
  const [staffList, setStaffList] = useState(() => loadJSON(STORAGE.staff, defaultStaff));
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', role: 'Therapist', weekOff: '' });
  const [staffAttendance, setStaffAttendance] = useState(() => loadJSON(STORAGE.staffAttendance, {}));
  const [attendanceDate, setAttendanceDate] = useState(() => businessDate);
  const [memberships, setMemberships] = useState(() => loadJSON(STORAGE.memberships, []));
  const [membershipPackages, setMembershipPackages] = useState(() => loadJSON(STORAGE.membershipPackages, defaultMembershipPackages));
  const [membershipVisits, setMembershipVisits] = useState(() => loadJSON(STORAGE.membershipVisits, []));
  const [packageForm, setPackageForm] = useState({ name: '', sessions: '8', price: '12000', validityMonths: '6', notes: '' });
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [packageError, setPackageError] = useState('');
  const activeMembershipPackages = membershipPackages.filter((pkg) => pkg.active);
  const [membershipForm, setMembershipForm] = useState({ name: '', phone: '', branch: membershipBranches[0], packageId: activeMembershipPackages[0]?.id || '', paymentMode: 'Cash', startDate: businessDate, notes: '' });
  const [membershipError, setMembershipError] = useState('');
  const [membershipSearch, setMembershipSearch] = useState('');
  const [savedMembership, setSavedMembership] = useState(null);
  const [membershipLookupPhone, setMembershipLookupPhone] = useState('');
  const [redeemForm, setRedeemForm] = useState({ membershipId: null, service: defaultServices[0]?.name || '', staff: defaultStaff[0]?.name || '', notes: '' });
  const [savedMembershipVisit, setSavedMembershipVisit] = useState(null);
  const [dailyRows, setDailyRows] = useState(() => loadJSON(STORAGE.dailyRows, []));
  const [dailyExpenses, setDailyExpenses] = useState(() => loadJSON(STORAGE.dailyExpenses, initialDailyExpenses));
  const [dailyFrom, setDailyFrom] = useState(businessDate);
  const [dailyTo, setDailyTo] = useState(businessDate);
  const [dailyForm, setDailyForm] = useState({ date: businessDate, cash: '', card: '', gpay: '', memberFee: '', memberCount: '', clientCount: '', towelKit: '' });
  const [expenseForm, setExpenseForm] = useState({ date: businessDate, narration: '', amount: '', source: 'Cash' });
  const [expenseError, setExpenseError] = useState('');
  const [monthlyTargets, setMonthlyTargets] = useState(() => loadJSON(STORAGE.monthlyTargets, { [getMonthKey(todayISO())]: { target: 20000000, achievedBaseline: 17000000 } }));
  const [targetForm, setTargetForm] = useState(() => ({ month: getMonthKey(businessDate), amount: '', baseline: '' }));
  const [targetError, setTargetError] = useState('');
  const [eodReports, setEodReports] = useState(() => loadJSON(STORAGE.eodReports, []));
  const [selectedEodReportId, setSelectedEodReportId] = useState(null);
  const [whatsappNumber, setWhatsappNumber] = useState(() => loadJSON(STORAGE.whatsappNumber, ''));
  const [whatsappNumberDraft, setWhatsappNumberDraft] = useState(() => loadJSON(STORAGE.whatsappNumber, ''));
  const [businessProfile] = useState(() => loadJSON(STORAGE.businessProfile, defaultBusinessProfile));
  const [preferences] = useState(() => loadJSON(STORAGE.preferences, defaultPreferences));
  const [restoreError, setRestoreError] = useState('');

  useEffect(() => {
    const tick = () => setClockTick((value) => value + 1);
    let midnightTimer;
    const scheduleMidnight = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      midnightTimer = window.setTimeout(() => { tick(); scheduleMidnight(); }, Math.max(1, midnight.getTime() - now.getTime()));
    };
    scheduleMidnight();
    const safetyInterval = window.setInterval(tick, 60000);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearTimeout(midnightTimer);
      window.clearInterval(safetyInterval);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  useLayoutEffect(() => {
    const membershipDate = page === 'Memberships' ? document.querySelector('.memberships-page .membership-form input[type="date"]') : null;
    if (membershipDate) {
      membershipDate.disabled = true;
      membershipDate.value = businessDate;
      setMembershipForm((current) => current.startDate === businessDate ? current : { ...current, startDate: businessDate });
    }
    const appointmentDate = page === 'New Appointment' ? document.querySelector('.appointment-page input[type="date"]') : null;
    if (appointmentDate) appointmentDate.min = businessDate;
    const dailyDate = page === 'Daily Receipts' ? document.querySelector('.daily-entry-form input[type="date"]') : null;
    if (dailyDate) {
      dailyDate.disabled = true;
      dailyDate.value = businessDate;
      setDailyForm((current) => current.date === businessDate ? current : { ...current, date: businessDate });
    }
    if (page === 'Daily Receipts') {
      document.querySelectorAll('.daily-date-controls input[type="date"]').forEach((input) => {
        input.disabled = true;
        input.value = businessDate;
      });
      setDailyFrom((current) => current === businessDate ? current : businessDate);
      setDailyTo((current) => current === businessDate ? current : businessDate);
    }
  }, [page, businessDate]);

  useEffect(() => { saveJSON(STORAGE.dailyRows, dailyRows); }, [dailyRows]);
  useEffect(() => { saveJSON(STORAGE.dailyExpenses, dailyExpenses); }, [dailyExpenses]);

  // One-time bootstrap: pull the latest saved state from Postgres (if reachable) so a second
  // device/browser sees the same data. Falls back to whatever is already in localStorage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const serverState = await fetchAllServerState();
      if (cancelled) return;
      if (!serverState) { setStateHydrated(true); return; }
      const syncKeys = [...Object.values(STORAGE), NEXT_RECEIPT_NUMBER_KEY];
      const hasServerData = syncKeys.some((key) => serverState[key] !== undefined && serverState[key] !== null);
      if (!hasServerData) {
        syncKeys.forEach((key) => {
          const raw = window.localStorage.getItem(key);
          if (raw === null) return;
          try { saveJSON(key, JSON.parse(raw)); } catch { /* skip malformed local value */ }
        });
        setStateHydrated(true);
        return;
      }
      if (window.sessionStorage.getItem(SYNCED_FLAG_KEY)) { setStateHydrated(true); return; }
      let changed = false;
      syncKeys.forEach((key) => {
        if (serverState[key] === undefined || serverState[key] === null) return;
        const nextRaw = JSON.stringify(serverState[key]);
        if (window.localStorage.getItem(key) !== nextRaw) {
          window.localStorage.setItem(key, nextRaw);
          changed = true;
        }
      });
      window.sessionStorage.setItem(SYNCED_FLAG_KEY, '1');
      if (changed) window.location.reload();
      else setStateHydrated(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const appointmentsForSelectedDate = useMemo(() => {
    const scheduleDate = selectedAppointmentDate < businessDate ? businessDate : selectedAppointmentDate;
    return appointmentsList.filter((item) => item.date === scheduleDate && item.date >= businessDate);
  }, [appointmentsList, selectedAppointmentDate, businessDate]);

  const dayStats = useMemo(() => {
    return {
      total: appointmentsForSelectedDate.length,
      completed: appointmentsForSelectedDate.filter((a) => a.completed || a.colorTag === 'green' || a.status === 'Completed').length,
      notComing: appointmentsForSelectedDate.filter((a) => a.colorTag === 'red' || a.status === 'Not Coming' || a.status === 'Cancelled').length,
      arrived: appointmentsForSelectedDate.filter((a) => a.colorTag === 'blue' || a.status === 'Arrived' || a.status === 'In Service').length,
      upcoming: appointmentsForSelectedDate.filter((a) => a.colorTag === 'yellow' || a.status === 'Upcoming' || a.status === 'Confirmed').length
    };
  }, [appointmentsForSelectedDate]);

  const filteredAppointments = useMemo(() => {
    return appointmentsForSelectedDate.filter((item) => {
      const query = search.toLowerCase().trim();
      let matchesStatus = true;
      if (status === 'Completed') {
        matchesStatus = item.completed || item.colorTag === 'green' || item.status === 'Completed';
      } else if (status === 'Cancelled') {
        matchesStatus = item.colorTag === 'red' || item.status === 'Not Coming' || item.status === 'Cancelled';
      } else if (status === 'Arrived') {
        matchesStatus = item.colorTag === 'blue' || item.status === 'Arrived' || item.status === 'In Service';
      } else if (status === 'Upcoming') {
        matchesStatus = item.colorTag === 'yellow' || item.status === 'Upcoming' || item.status === 'Confirmed';
      } else if (status !== 'All') {
        matchesStatus = item.status === status;
      }
      const matchesSearch = !query || [item.client, item.phone, item.service, item.staff, item.id].some((value) => value?.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    }).sort((a, b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0));
  }, [appointmentsForSelectedDate, search, status]);

  const showNotice = (message, tone = 'success') => {
    const id = Date.now();
    setNotice({ id, message, tone });
    window.setTimeout(() => setNotice((current) => current?.id === id ? null : current), 2800);
  };

  const activeReceiptEntries = receiptEntries.filter((entry) => !entry.deleted);
  const isAdminUser = userRole === 'Manager' || userRole === 'Superuser';
  const receiptFormIsMember = receiptForm.method === 'Member';
  const receiptFormPrice = receiptFormIsMember ? 0 : Math.max(0, Number(receiptForm.price) || 0);
  const receiptFormTaxAmount = receiptForm.method === 'Cash' || receiptFormIsMember ? 0 : Math.round(receiptFormPrice * (Math.max(0, Number(receiptForm.tax) || 0) / 100));

  const updateReceiptForm = (field, value) => setReceiptForm((current) => {
    if (field === 'service') {
      const selected = services.find((service) => service.name === value);
      const price = current.method === 'Member' ? '0' : selected ? String(selected.price) : current.price;
      return { ...current, service: value, staff: selected?.staff || current.staff, price, duration: selected?.duration || current.duration };
    }
    if (field === 'method') {
      if (value === 'Member') return { ...current, method: value, price: '0', tax: '0' };
      const servicePrice = services.find((service) => service.name === current.service)?.price;
      const price = current.method === 'Member' || current.price === '' ? String(servicePrice ?? '') : current.price;
      const wasUntaxed = current.method === 'Cash' || current.method === 'Member' || current.method === '';
      return { ...current, method: value, price, tax: value === 'Cash' ? '0' : wasUntaxed ? String(preferences.defaultTaxRate || '0') : current.tax };
    }
    return { ...current, [field]: value };
  });
  const updateReceiptFormTime = (field, value) => setReceiptForm((current) => {
    const nextParts = { ...getAppointmentTimeParts(current.time), [field]: value };
    return { ...current, time: `${nextParts.hour.split(' ')[0]}:${nextParts.minute} ${nextParts.hour.split(' ')[1]}` };
  });
  const persistReceiptEntries = (nextEntries) => {
    setReceiptEntries(nextEntries);
    saveJSON(STORAGE.receiptEntries, nextEntries);
  };
  const logReceiptAction = (action, entry) => {
    const nextLogs = [{ id: Date.now(), what: `${action} · ${entry.number} · ${entry.client} · ${money(entry.total)}`, who: userEmail || userRole, when: new Date().toISOString(), date: entry.date }, ...deletionLogs];
    setDeletionLogs(nextLogs);
    saveJSON(STORAGE.deletionLogs, nextLogs);
  };
  const applyReceiptToDailyRows = (entry, sign) => setDailyRows((rows) => {
    const fields = ['cash', 'card', 'cardGst', 'gpay', 'gpayGst', 'memberFee', 'towelKit'];
    const countField = entry.method === 'Member' ? 'memberCount' : 'clientCount';
    if (rows.some((row) => row.date === entry.date)) {
      return rows.map((row) => row.date !== entry.date ? row : { ...row, ...Object.fromEntries(fields.map((field) => [field, Math.max(0, (row[field] || 0) + sign * (entry[field] || 0))])), [countField]: Math.max(0, (row[countField] || 0) + sign) });
    }
    if (sign < 0) return rows;
    const day = new Date(`${entry.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long' });
    return [...rows, { id: Date.now() + 1, day, date: entry.date, memberCount: 0, clientCount: 0, [countField]: 1, ...Object.fromEntries(fields.map((field) => [field, entry[field] || 0])) }].sort((first, second) => first.date.localeCompare(second.date));
  });
  const adjustMembershipSessions = (membershipId, delta) => setMemberships((records) => {
    const nextRecords = records.map((item) => item.id === membershipId ? { ...item, usedSessions: Math.min(item.sessions, Math.max(0, (item.usedSessions || 0) + delta)) } : item);
    saveJSON(STORAGE.memberships, nextRecords);
    return nextRecords;
  });
  const upsertReceiptMembershipVisit = (entry, membership) => setMembershipVisits((visits) => {
    const visit = { id: `visit-${entry.id}`, receiptId: entry.id, membershipId: membership.id, memberId: membership.memberId, name: membership.name, phone: membership.phone, packageName: membership.packageName, date: entry.date, time: formatTime12h(entry.inTime), service: entry.service, staff: entry.staff, sessionNumber: entry.sessionNumber, remainingAfter: membership.sessions - entry.sessionNumber, frontDeskUser: userEmail || userRole, notes: entry.notes };
    const nextVisits = visits.some((item) => item.receiptId === entry.id) ? visits.map((item) => item.receiptId === entry.id ? { ...item, ...visit } : item) : [visit, ...visits];
    saveJSON(STORAGE.membershipVisits, nextVisits);
    return nextVisits;
  });
  const removeReceiptMembershipVisit = (receiptId) => setMembershipVisits((visits) => {
    const nextVisits = visits.filter((item) => item.receiptId !== receiptId);
    saveJSON(STORAGE.membershipVisits, nextVisits);
    return nextVisits;
  });
  const resolveReceiptMembership = (form, existing) => {
    const phone = (form.phone || '').replace(/\D/g, '');
    const name = form.client.trim().toLowerCase();
    if (phone.length !== 10 && !name) return { state: 'needs-client' };
    const candidates = memberships.filter((item) => phone.length === 10 ? item.phone === phone : item.name.trim().toLowerCase() === name);
    if (existing?.method === 'Member' && !existing.deleted) {
      const current = candidates.find((item) => item.id === existing.membershipId);
      if (current) return { state: 'already-redeemed', membership: current, sessionNumber: existing.sessionNumber };
    }
    const redeemable = candidates.filter(canRedeemSession).sort((first, second) => (first.expiryDate || '').localeCompare(second.expiryDate || ''));
    if (redeemable.length) return { state: 'ready', membership: redeemable[0], sessionNumber: (redeemable[0].usedSessions || 0) + 1 };
    if (!candidates.length) return { state: 'none' };
    const latest = [...candidates].sort((first, second) => (second.startDate || '').localeCompare(first.startDate || ''))[0];
    const status = getMembershipStatus(latest);
    return { state: status === 'Expired' ? 'expired' : status === 'Cancelled' ? 'cancelled' : 'exhausted', membership: latest };
  };
  const memberLookupErrors = { 'needs-client': 'Enter the client phone number to find their membership.', none: 'No active membership found for this client.', exhausted: 'Membership sessions exhausted.', expired: 'This membership has expired.', cancelled: 'This membership has been cancelled.' };
  const closeReceiptForm = () => {
    setShowReceiptForm(false);
    setEditingReceiptId(null);
    setReceiptError('');
  };
  useEffect(() => {
    if (!showReceiptForm && !receiptConfirm) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (receiptConfirm) setReceiptConfirm(null);
      else closeReceiptForm();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showReceiptForm, receiptConfirm]);
  const openAddReceipt = () => {
    setEditingReceiptId(null);
    setReceiptForm(buildReceiptForm(businessDate, preferences, services[0]));
    setReceiptError('');
    setShowReceiptForm(true);
  };
  const openEditReceipt = (id) => {
    const entry = receiptEntries.find((item) => item.id === id);
    if (!entry) return;
    if (closedDates.includes(entry.date)) { showNotice('This day is closed. Receipts for closed days cannot be edited.', 'error'); return; }
    if (entry.transactionType === 'New Membership') { showNotice('Edit membership sales from the Memberships page.', 'error'); return; }
    const row = toReceiptRow(entry);
    const method = receiptPaymentModes.includes(row.method) ? row.method : '';
    setReceiptForm({ date: row.date, client: row.client, phone: row.phone, time: entry.inTime || '10:00 AM', duration: row.duration || '60 min', service: row.service, staff: row.staff, price: String(row.price), method, tax: method === 'Cash' || method === 'Member' ? '0' : String(row.taxRate), towelKit: String(row.towelKit), notes: row.notes });
    setEditingReceiptId(id);
    setReceiptError('');
    setShowReceiptForm(true);
  };
  const toggleReceiptSort = (key) => setReceiptSort((current) => current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'date' ? 'desc' : 'asc' });
  const receiptQuery = receiptSearch.trim().toLowerCase();
  const receiptSortValue = (row, key) => {
    if (key === 'date') return `${row.date} ${row.createdAt || ''}`;
    if (key === 'duration') return parseInt(row.duration, 10) || 0;
    if (key === 'price' || key === 'taxAmount' || key === 'towelKit') return row[key];
    return String(row[key] || '').toLowerCase();
  };
  const toReceiptGridRows = (entries) => entries.map(toReceiptRow)
    .filter((row) => (receiptMethodFilter === 'All' || row.method === receiptMethodFilter) && (receiptStaffFilter === 'All' || row.staff.split(', ').includes(receiptStaffFilter)) && (!receiptQuery || [row.client, row.phone, row.service, row.staff, row.notes, row.number, row.method].some((value) => String(value || '').toLowerCase().includes(receiptQuery))))
    .sort((first, second) => {
      const a = receiptSortValue(first, receiptSort.key);
      const b = receiptSortValue(second, receiptSort.key);
      const order = a < b ? -1 : a > b ? 1 : 0;
      return receiptSort.dir === 'asc' ? order : -order;
    });
  const allocateReceiptNumber = () => {
    const currentNumber = Number(window.localStorage.getItem(NEXT_RECEIPT_NUMBER_KEY)) || nextReceiptNumber || 1;
    const nextNumber = currentNumber + 1;
    saveJSON(NEXT_RECEIPT_NUMBER_KEY, nextNumber);
    setNextReceiptNumber(nextNumber);
    return `REC-${String(currentNumber).padStart(5, '0')}`;
  };
  const saveReceipt = (event) => {
    event.preventDefault();
    const form = receiptForm;
    const client = form.client.trim();
    const isMember = form.method === 'Member';
    const price = isMember ? 0 : Number(form.price);
    const taxRate = form.method === 'Cash' || isMember ? 0 : Number(form.tax || 0);
    const towelKit = Number(form.towelKit || 0);
    const existing = editingReceiptId ? receiptEntries.find((item) => item.id === editingReceiptId) : null;
    if (!businessDate || closedDates.includes(businessDate)) { setReceiptError('The current working day is closed. New receipts cannot be entered.'); return; }
    if (existing && existing.date !== businessDate) { setReceiptError('Only receipts from the current working day can be edited here.'); return; }
    if (!client) { setReceiptError('Enter the client name.'); return; }
    if (form.phone && !/^\d{10}$/.test(form.phone)) { setReceiptError('Enter a valid 10-digit phone number, or leave it blank.'); return; }
    if (!form.duration) { setReceiptError('Choose the duration.'); return; }
    if (!form.service) { setReceiptError('Choose a service.'); return; }
    if (!receiptPaymentModes.includes(form.method)) { setReceiptError('Choose a payment mode.'); return; }
    if (!isMember && (!Number.isFinite(price) || price <= 0)) { setReceiptError('Enter a price greater than zero.'); return; }
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) { setReceiptError('Tax must be a percentage between 0 and 100.'); return; }
    if (!form.staff) { setReceiptError('Choose the staff name.'); return; }
    if (!Number.isFinite(towelKit) || towelKit < 0) { setReceiptError('Towel kit cash out must be zero or more.'); return; }
    const lookup = isMember ? resolveReceiptMembership(form, existing) : null;
    if (lookup && lookup.state !== 'ready' && lookup.state !== 'already-redeemed') { setReceiptError(memberLookupErrors[lookup.state]); return; }
    const previousMembershipId = existing?.method === 'Member' ? existing.membershipId : null;
    const membership = lookup?.membership || null;
    const releasing = Boolean(previousMembershipId) && previousMembershipId !== membership?.id;
    const redeeming = Boolean(membership) && membership.id !== previousMembershipId;
    const now = new Date().toISOString();
    const taxAmount = Math.round(price * taxRate / 100);
    const { items: _legacyItems, discount: _legacyDiscount, membershipId: _membershipId, memberId: _memberId, sessionNumber: _sessionNumber, sessionsTotal: _sessionsTotal, ...base } = existing || {};
    const entry = {
      ...base,
      id: existing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      number: existing?.number ?? allocateReceiptNumber(),
      date: businessDate,
      client,
      phone: form.phone,
      inTime: form.time,
      duration: form.duration,
      outTime: calculateOutTime(form.time, form.duration),
      service: form.service,
      packageName: membership?.packageName || '',
      membership: membership ? `${membership.packageName} · ${membership.sessions} sessions` : '',
      transactionType: isMember ? 'Membership Session' : existing?.transactionType === 'New Membership' ? 'New Membership' : 'Normal Payment',
      staff: form.staff,
      price,
      method: form.method,
      tax: taxRate,
      taxAmount,
      towelKit,
      notes: form.notes.trim(),
      memberFee: existing?.memberFee || 0,
      ...splitReceiptPayment(form.method, price, taxAmount),
      ...(membership ? { membershipId: membership.id, memberId: membership.memberId, sessionNumber: redeeming ? (membership.usedSessions || 0) + 1 : existing.sessionNumber, sessionsTotal: membership.sessions } : {}),
      total: price + taxAmount,
      deleted: false,
      createdAt: existing?.createdAt ?? now,
      createdBy: existing?.createdBy ?? userEmail,
      ...(existing ? { updatedAt: now, updatedBy: userEmail } : {})
    };
    persistReceiptEntries(existing ? receiptEntries.map((item) => item.id === existing.id ? entry : item) : [entry, ...receiptEntries]);
    if (existing) applyReceiptToDailyRows(existing, -1);
    applyReceiptToDailyRows(entry, 1);
    // Sessions move only when the linked membership changes, so re-saving a Member receipt never deducts twice.
    if (releasing) { adjustMembershipSessions(previousMembershipId, -1); removeReceiptMembershipVisit(entry.id); }
    if (redeeming) adjustMembershipSessions(membership.id, 1);
    if (membership) upsertReceiptMembershipVisit(entry, membership);
    if (entry.date < dailyFrom || entry.date > dailyTo) { setDailyFrom(entry.date); setDailyTo(entry.date); }
    if (entry.phone) addClientRecord(entry.client, entry.phone);
    closeReceiptForm();
    showNotice(existing ? 'Receipt updated successfully' : 'Receipt added successfully');
  };
  const confirmReceiptAction = () => {
    const { id, permanent } = receiptConfirm || {};
    const entry = receiptEntries.find((item) => item.id === id);
    setReceiptConfirm(null);
    if (!entry) return;
    if (permanent) {
      if (!isAdminUser || !entry.deleted) return;
      persistReceiptEntries(receiptEntries.filter((item) => item.id !== id));
      logReceiptAction('Permanently deleted', entry);
      showNotice('Receipt permanently deleted');
      return;
    }
    if (closedDates.includes(entry.date)) { showNotice('This day is closed. Receipts for closed days cannot be deleted.', 'error'); return; }
    persistReceiptEntries(receiptEntries.map((item) => item.id === id ? { ...item, deleted: true, deletedAt: new Date().toISOString(), deletedBy: userEmail || userRole } : item));
    applyReceiptToDailyRows(entry, -1);
    if (entry.method === 'Member' && entry.membershipId) { adjustMembershipSessions(entry.membershipId, -1); removeReceiptMembershipVisit(entry.id); }
    logReceiptAction('Deleted', entry);
    if (editingReceiptId === id) closeReceiptForm();
    showNotice('Receipt moved to Deleted Receipts');
  };
  const restoreReceipt = (id) => {
    const entry = receiptEntries.find((item) => item.id === id);
    if (!entry?.deleted) return;
    if (closedDates.includes(entry.date)) { showNotice('This day is closed. Receipts cannot be restored into a closed day.', 'error'); return; }
    const { deletedAt: _deletedAt, deletedBy: _deletedBy, ...restored } = entry;
    let restoredEntry = { ...restored, deleted: false };
    const membership = entry.method === 'Member' ? memberships.find((item) => item.id === entry.membershipId) : null;
    if (entry.method === 'Member') {
      if (!membership || !canRedeemSession(membership)) { showNotice('Cannot restore: this membership has no sessions available.', 'error'); return; }
      restoredEntry = { ...restoredEntry, sessionNumber: (membership.usedSessions || 0) + 1, sessionsTotal: membership.sessions };
    }
    persistReceiptEntries(receiptEntries.map((item) => item.id === id ? restoredEntry : item));
    applyReceiptToDailyRows(entry, 1);
    if (membership) { adjustMembershipSessions(membership.id, 1); upsertReceiptMembershipVisit(restoredEntry, membership); }
    logReceiptAction('Restored', entry);
    showNotice('Receipt restored successfully');
  };
  const getMonthlyTarget = (monthKey) => monthlyTargets[monthKey]?.target || 0;
  const getMonthlyBaseline = (monthKey) => monthlyTargets[monthKey]?.achievedBaseline || 0;
  const receiptEntryTotal = (entry) => entry.total ?? (entry.cash || 0) + (entry.card || 0) + (entry.gpay || 0) + (entry.memberFee || 0);
  const achievedForMonth = (monthKey, uptoDateInclusive) => getMonthlyBaseline(monthKey) + activeReceiptEntries
    .filter((entry) => entry.date.startsWith(monthKey) && entry.date <= uptoDateInclusive)
    .reduce((total, entry) => total + receiptEntryTotal(entry), 0);
  const achievedBeforeDate = (monthKey, dateISO) => getMonthlyBaseline(monthKey) + activeReceiptEntries
    .filter((entry) => entry.date.startsWith(monthKey) && entry.date < dateISO)
    .reduce((total, entry) => total + receiptEntryTotal(entry), 0);
  const saveMonthlyTarget = (event) => {
    event.preventDefault();
    const amount = Number(targetForm.amount);
    const baseline = Number(targetForm.baseline) || 0;
    if (!targetForm.month || amount <= 0) { setTargetError('Choose a month and enter a target amount greater than zero.'); return; }
    const nextTargets = { ...monthlyTargets, [targetForm.month]: { target: amount, achievedBaseline: baseline } };
    setMonthlyTargets(nextTargets);
    saveJSON(STORAGE.monthlyTargets, nextTargets);
    setTargetForm((form) => ({ ...form, amount: '', baseline: '' }));
    setTargetError('');
    showNotice(`Target for ${formatMonthLabel(targetForm.month)} saved`);
  };
  const deleteMonthlyTarget = (monthKey) => {
    if (!window.confirm(`Remove the target for ${formatMonthLabel(monthKey)}?`)) return;
    const nextTargets = { ...monthlyTargets };
    delete nextTargets[monthKey];
    setMonthlyTargets(nextTargets);
    saveJSON(STORAGE.monthlyTargets, nextTargets);
  };
  const sendEodReport = (id) => {
    const report = eodReports.find((item) => item.id === id);
    if (!report) return;
    const numbers = whatsappNumber.split(',').map((value) => value.replace(/\D/g, '')).filter((digits) => digits.length >= 10);
    if (!numbers.length) {
      showNotice('Add a WhatsApp number in Settings before sending.', 'error');
      setPage('Targets');
      return;
    }
    const message = buildEodMessage(report, businessProfile.name);
    numbers.forEach((digits) => window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank'));
    const nextReports = eodReports.map((item) => item.id === id ? { ...item, sent: true, sentAt: new Date().toISOString() } : item);
    setEodReports(nextReports);
    saveJSON(STORAGE.eodReports, nextReports);
    showNotice(`WhatsApp opened for ${numbers.length} ${numbers.length === 1 ? 'number' : 'numbers'} — press Send inside WhatsApp to deliver it.`);
  };
  const saveWhatsappNumber = (event) => {
    event.preventDefault();
    setWhatsappNumber(whatsappNumberDraft);
    saveJSON(STORAGE.whatsappNumber, whatsappNumberDraft);
    showNotice('WhatsApp number saved');
  };
  const backupAllData = () => {
    const data = Object.fromEntries(Object.entries(STORAGE).map(([key, storageKey]) => [key, loadJSON(storageKey, null)]));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bizora-backup-${todayISO()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice('Backup file downloaded');
  };
  const restoreAllData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        Object.entries(STORAGE).forEach(([key, storageKey]) => {
          if (data[key] !== undefined && data[key] !== null) saveJSON(storageKey, data[key]);
        });
        setRestoreError('');
        showNotice('Data restored. Reloading…');
        window.setTimeout(() => window.location.reload(), 900);
      } catch {
        setRestoreError('That file could not be read. Choose a valid Bizora backup JSON file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  const closeBusinessDay = (automatic = false) => {
    const closingDate = businessDate;
    if (closedDates.includes(closingDate)) {
      if (!automatic) { showNotice('This day is already closed.', 'error'); return; }
      const nextDate = addDaysISO(closingDate, 1);
      setBusinessDate(nextDate);
      setSelectedAppointmentDate(nextDate);
      setAttendanceDate(nextDate);
      setReceiptForm((current) => ({ ...current, date: nextDate }));
      setAppointment((current) => ({ ...current, date: nextDate }));
      setExpenseForm((current) => ({ ...current, date: nextDate }));
      setMembershipForm((current) => ({ ...current, startDate: nextDate }));
      setDailyForm((current) => ({ ...current, date: nextDate }));
      setDailyFrom(nextDate);
      setDailyTo(nextDate);
      saveJSON(STORAGE.businessDate, nextDate);
      return;
    }
    if (!automatic && !window.confirm(`Close ${formatDisplayDate(closingDate)}? After closing you cannot change receipts for this day.`)) return;
    const todayEntries = activeReceiptEntries.filter((entry) => entry.date === closingDate);
    const priorReceiptsNet = activeReceiptEntries.filter((entry) => entry.date < closingDate).reduce((total, entry) => total + receiptEntryTotal(entry) - (entry.towelKit || 0), 0);
    const priorExpenses = dailyExpenses.filter((item) => item.date < closingDate).reduce((total, item) => total + item.amount, 0);
    const openingBalance = priorReceiptsNet - priorExpenses;
    const cash = todayEntries.reduce((total, entry) => total + (entry.cash || 0), 0);
    const card = todayEntries.reduce((total, entry) => total + (entry.card || 0), 0);
    const gpay = todayEntries.reduce((total, entry) => total + (entry.gpay || 0), 0);
    const memberFee = todayEntries.reduce((total, entry) => total + (entry.memberFee || 0), 0);
    const receiptsSubtotal = cash + card + gpay;
    const gstCollected = todayEntries.reduce((total, entry) => total + (entry.cardGst || 0) + (entry.gpayGst || 0), 0);
    const receiptsTotalWithTax = receiptsSubtotal + gstCollected;
    const paymentsForDay = dailyExpenses.filter((item) => item.date === closingDate).reduce((total, item) => total + item.amount, 0);
    const towelCash = todayEntries.reduce((total, entry) => total + (entry.towelKit || 0), 0);
    const receiptsAfterTowel = receiptsTotalWithTax - towelCash;
    const closingBalance = openingBalance + receiptsAfterTowel - paymentsForDay;
    const memberEntries = todayEntries.filter((entry) => entry.method === 'Member' || entry.transactionType === 'Membership Session');
    const legacyMembershipVisits = membershipVisits.filter((visit) => visit.date === closingDate && !visit.receiptId);
    const memberKeys = [...memberEntries.map((entry) => entry.membershipId || entry.phone || entry.client), ...legacyMembershipVisits.map((visit) => visit.membershipId || visit.phone || visit.name)];
    const membershipClientsServed = new Set(memberKeys.filter(Boolean)).size;
    const membershipSessionsUsed = memberEntries.length + legacyMembershipVisits.length;
    const regularPaidEntries = todayEntries.filter((entry) => entry.method !== 'Member');
    const regularPaidClients = new Set(regularPaidEntries.map((entry) => entry.phone || entry.client).filter(Boolean)).size;
    const newMembershipRecords = memberships.filter((membership) => membership.startDate === closingDate);
    const newMembershipEntries = todayEntries.filter((entry) => entry.transactionType === 'New Membership');
    const membershipRevenueToday = newMembershipRecords.reduce((total, membership) => total + (membership.totalAmount ?? membership.amount ?? 0), 0);
    const normalServiceCollection = regularPaidEntries.filter((entry) => entry.transactionType !== 'New Membership').reduce((total, entry) => total + (entry.total ?? receiptEntryTotal(entry)), 0);
    const membershipCollection = newMembershipEntries.reduce((total, entry) => total + (entry.total ?? receiptEntryTotal(entry)), 0) || membershipRevenueToday;
    const totalCollection = normalServiceCollection + membershipCollection;
    const totalClientsServed = new Set([...regularPaidEntries.map((entry) => entry.phone || entry.client), ...memberKeys].filter(Boolean)).size;
    const monthKey = getMonthKey(closingDate);
    const targetAmount = getMonthlyTarget(monthKey);
    const achievedSoFar = achievedForMonth(monthKey, closingDate);
    const report = {
      id: Date.now(),
      date: closingDate,
      day: formatDisplayDate(closingDate),
      openingBalance,
      cash, card, gpay,
      receiptsSubtotal,
      gstCollected,
      receiptsTotalWithTax,
      receiptsAfterTowel,
      memberFee,
      paymentsForDay,
      towelCash,
      closingBalance,
      totalClientsServed,
      regularPaidClients,
      membershipClientsServed,
      membershipSessionsUsed,
      newMembershipsSold: newMembershipRecords.length,
      totalReceipts: todayEntries.length,
      totalCollection,
      membershipCollection,
      normalServiceCollection,
      zeroMembershipVisits: membershipSessionsUsed,
      membershipRevenueToday,
      monthKey,
      targetAmount,
      achievedSoFar,
      sent: false,
      sentAt: null,
      closedBy: userEmail || userRole,
      closedAt: new Date().toISOString()
    };
    const nextReports = eodReports.some((item) => item.date === closingDate) ? eodReports.map((item) => item.date === closingDate ? { ...item, ...report } : item) : [report, ...eodReports];
    setEodReports(nextReports);
    saveJSON(STORAGE.eodReports, nextReports);
    const nextClosed = [...closedDates, closingDate];
    const nextDate = addDaysISO(closingDate, 1);
    setClosedDates(nextClosed);
    saveJSON(STORAGE.closedDates, nextClosed);
    const advanceNow = automatic || closingDate < todayISO();
    if (advanceNow) {
      setBusinessDate(nextDate);
      setSelectedAppointmentDate(nextDate);
      setAttendanceDate(nextDate);
      setReceiptForm((current) => ({ ...current, date: nextDate }));
      setAppointment((current) => ({ ...current, date: nextDate }));
      setExpenseForm((current) => ({ ...current, date: nextDate }));
      setMembershipForm((current) => ({ ...current, startDate: nextDate }));
      setDailyForm((current) => ({ ...current, date: nextDate }));
      setDailyFrom(nextDate);
      setDailyTo(nextDate);
      saveJSON(STORAGE.businessDate, nextDate);
    }
    showNotice(advanceNow ? `Day closed automatically. End of day report saved. Now working on ${formatDisplayDate(nextDate)}` : `Day closed. End of day report saved. The next working day begins at midnight.`);
  };
  useEffect(() => {
    if (stateHydrated && businessDate < todayISO()) closeBusinessDay(true);
  }, [businessDate, clockTick, stateHydrated]);
  const updateAppointment = (field, value) => setAppointment((current) => ({ ...current, [field]: field === 'date' && value < businessDate ? businessDate : value }));
  const updateAppointmentTime = (field, value) => setAppointment((current) => {
    const nextParts = { ...getAppointmentTimeParts(current.time), [field]: value };
    const time = `${nextParts.hour.split(' ')[0]}:${nextParts.minute} ${nextParts.hour.split(' ')[1]}`;
    return { ...current, time, inTime: time, outTime: calculateOutTime(time, current.duration) };
  });
  const openNewAppointment = () => {
    setAppointment((current) => ({ ...current, date: selectedAppointmentDate < businessDate ? businessDate : selectedAppointmentDate }));
    setEditingAppointmentId(null);
    setAppointmentError('');
    setPage('New Appointment');
  };
  const handleAppointmentService = (service) => {
    const selected = services.find((item) => item.name === service) || defaultServices.find((item) => item.name === service);
    const duration = selected?.duration || appointment.duration;
    const currentIn = appointment.inTime || appointment.time || '10:00';
    const outTime = calculateOutTime(currentIn, duration);
    setAppointment((current) => ({ ...current, service, staff: selected?.staff || current.staff || 'Meena', duration, outTime }));
  };
  const saveAppointment = (event) => {
    event.preventDefault();
    if (appointment.date < businessDate) { setAppointmentError('Appointments cannot be booked or moved to a previous day.'); return; }
    if (!appointment.client.trim()) { setAppointmentError('Enter the client name before saving the appointment.'); return; }
    if (appointment.phone.replace(/\D/g, '').length !== 10) { setAppointmentError('Enter a valid 10-digit phone number.'); return; }
    const inTime = appointment.inTime || appointment.time || '10:00';
    if (!appointment.date || !inTime) { setAppointmentError('Choose an appointment date and arrival time.'); return; }
    const outTime = appointment.outTime || calculateOutTime(inTime, appointment.duration);
    const appointmentId = editingAppointmentId || `APT-${Date.now().toString().slice(-4)}`;
    const newEntry = {
      id: appointmentId,
      ...appointment,
      client: appointment.client.trim(),
      phone: appointment.phone.trim(),
      time: inTime,
      inTime,
      outTime,
      createdAt: appointment.createdAt || new Date().toISOString(),
      displayTime: formatTime12h(inTime),
      completed: appointment.status === 'Completed',
      colorTag: appointment.status === 'Completed' ? 'green' : appointment.status === 'Not Coming' ? 'red' : (appointment.colorTag || 'default')
    };
    const nextAppointments = editingAppointmentId
      ? appointmentsList.map((item) => item.id === editingAppointmentId ? newEntry : item)
      : [...appointmentsList, newEntry];
    setAppointmentsList(nextAppointments);
    saveJSON(STORAGE.appointments, nextAppointments);
    setSavedAppointment(newEntry);
    addClientRecord(appointment.client, appointment.phone);
    setAppointmentError('');
    setShowBookingForm(false);
    setEditingAppointmentId(null);
    setSelectedAppointmentDate(appointment.date);
    setPage('Appointments');
    setAppointment({
      client: '',
      phone: '',
      date: appointment.date,
      time: '10:00 AM',
      inTime: '10:00 AM',
      outTime: '11:00 AM',
      service: 'Swedish Massage',
      staff: 'Meena',
      duration: '60 min',
      status: 'Booked',
      payment: 'Pending',
      notes: '',
      colorTag: 'default',
      completed: false
    });
    showNotice(`${appointmentId} ${editingAppointmentId ? 'updated' : 'booked'} for ${newEntry.client}`);
  };
  const updateAppointmentStatus = (id, newStatus) => {
    const nextAppointments = appointmentsList.map((apt) => {
      if (apt.id === id) {
        const isDone = newStatus === 'Completed';
        const isNotComing = newStatus === 'Not Coming';
        return {
          ...apt,
          status: newStatus,
          completed: isDone,
          colorTag: isDone ? 'green' : isNotComing ? 'red' : apt.colorTag
        };
      }
      return apt;
    });
    setAppointmentsList(nextAppointments);
    saveJSON(STORAGE.appointments, nextAppointments);
    showNotice(`Appointment updated to ${newStatus}`);
  };
  const toggleAppointmentDone = (id) => {
    const nextAppointments = appointmentsList.map((apt) => {
      if (apt.id === id) {
        const nextDone = !apt.completed;
        return {
          ...apt,
          completed: nextDone,
          status: nextDone ? 'Completed' : 'Booked',
          colorTag: nextDone ? 'green' : 'default',
          customBg: null
        };
      }
      return apt;
    });
    setAppointmentsList(nextAppointments);
    saveJSON(STORAGE.appointments, nextAppointments);
    const target = nextAppointments.find((a) => a.id === id);
    showNotice(target?.completed ? '✓ Client arrived & finished session! Row turned GREEN' : 'Appointment unchecked');
  };
  const markAppointmentNotComing = (id) => {
    const nextAppointments = appointmentsList.map((apt) => {
      if (apt.id === id) {
        const isAlreadyNotComing = apt.status === 'Not Coming' || apt.colorTag === 'red';
        return {
          ...apt,
          completed: false,
          status: isAlreadyNotComing ? 'Confirmed' : 'Not Coming',
          colorTag: isAlreadyNotComing ? 'default' : 'red',
          customBg: null
        };
      }
      return apt;
    });
    setAppointmentsList(nextAppointments);
    saveJSON(STORAGE.appointments, nextAppointments);
    const target = nextAppointments.find((a) => a.id === id);
    showNotice(target?.status === 'Not Coming' ? 'Client marked Not Coming (Row turned RED)' : 'Reset appointment status');
  };
  const updateAppointmentColor = (id, colorTag, customHex = null) => {
    const nextAppointments = appointmentsList.map((apt) => {
      if (apt.id === id) {
        let matchingStatus = apt.status;
        let isDone = apt.completed;
        if (colorTag === 'green') {
          matchingStatus = 'Completed';
          isDone = true;
        } else if (colorTag === 'red') {
          matchingStatus = 'Not Coming';
          isDone = false;
        } else if (colorTag === 'blue') {
          matchingStatus = 'Arrived';
          isDone = false;
        } else if (colorTag === 'yellow') {
          matchingStatus = 'Upcoming';
          isDone = false;
        } else if (colorTag === 'default') {
          matchingStatus = 'Confirmed';
          isDone = false;
        }
        return {
          ...apt,
          colorTag,
          customBg: customHex,
          status: matchingStatus,
          completed: isDone
        };
      }
      return apt;
    });
    setAppointmentsList(nextAppointments);
    saveJSON(STORAGE.appointments, nextAppointments);
    showNotice(`Row color updated to ${colorTag || 'custom'}`);
  };
  const updateAppointmentField = (id, field, value) => {
    const nextAppointments = appointmentsList.map((apt) => {
      if (apt.id === id) {
        const updated = { ...apt, [field]: value };
        if (field === 'inTime' || field === 'time') {
          updated.time = value;
          updated.inTime = value;
          updated.displayTime = formatTime12h(value);
          if (apt.duration) {
            updated.outTime = calculateOutTime(value, apt.duration);
          }
        }
        if (field === 'duration' && (apt.inTime || apt.time)) {
          updated.outTime = calculateOutTime(apt.inTime || apt.time, value);
        }
        return updated;
      }
      return apt;
    });
    setAppointmentsList(nextAppointments);
    saveJSON(STORAGE.appointments, nextAppointments);
  };
  const getAutoAppointmentColor = (item) => {
    if (item.completed || item.status === 'Completed') return 'green';
    if (item.status === 'Cancelled') return 'red';
    const inTime = item.inTime || item.time || '10:00';
    const outTime = item.outTime || calculateOutTime(inTime, item.duration);
    const now = new Date();
    const scheduled = new Date(`${item.date}T${inTime}:00`);
    const allocatedEnd = new Date(`${item.date}T${outTime}:00`);

    if (Number.isNaN(scheduled.getTime()) || Number.isNaN(allocatedEnd.getTime()) || now <= scheduled) return 'default';
    return now <= allocatedEnd ? 'yellow' : 'red';
  };
  const getRowColorClass = (item) => {
    const autoColor = getAutoAppointmentColor(item);
    if (autoColor === 'green') return 'excel-row-green';
    if (autoColor === 'red') return 'excel-row-red';
    if (autoColor === 'blue') return 'excel-row-blue';
    if (autoColor === 'yellow') return 'excel-row-yellow';
    if (item.colorTag === 'purple') return 'excel-row-purple';
    return 'excel-row-default';
  };
  const deleteAppointment = (id) => {
    if (!window.confirm('Cancel and delete this appointment?')) return;
    const nextAppointments = appointmentsList.filter((apt) => apt.id !== id);
    setAppointmentsList(nextAppointments);
    saveJSON(STORAGE.appointments, nextAppointments);
    showNotice('Appointment removed');
  };
  const editAppointment = (id) => {
    const selected = appointmentsList.find((item) => item.id === id);
    if (!selected) return;
    setAppointment({
      ...selected,
      time: formatTime12h(selected.inTime || selected.time || '10:00'),
      inTime: formatTime12h(selected.inTime || selected.time || '10:00'),
      outTime: selected.outTime || calculateOutTime(selected.inTime || selected.time || '10:00', selected.duration),
      notes: selected.notes || '',
      status: selected.status || 'Confirmed',
      payment: selected.payment || 'Pending'
    });
    setEditingAppointmentId(id);
    setSavedAppointment(selected);
    setAppointmentError('');
    setPage('New Appointment');
  };
  const addClientRecord = (name, phone) => setClients((records) => {
    if (records.some((client) => client.phone === phone.trim())) return records;
    const nextClients = [...records, { id: Date.now(), name: name.trim(), phone: phone.trim(), createdDate: businessDate }];
    saveJSON(STORAGE.clients, nextClients);
    return nextClients;
  });
  const saveClient = (event) => {
    event.preventDefault();
    if (!clientForm.name.trim() || clientForm.phone.replace(/\D/g, '').length !== 10) { setClientError('Enter a name and valid phone number.'); return; }
    if (clients.some((client) => client.phone === clientForm.phone.trim())) { setClientError('This phone number is already saved.'); return; }
    addClientRecord(clientForm.name, clientForm.phone);
    setClientForm({ name: '', phone: '' });
    setShowClientForm(false);
    setClientError('');
    showNotice('Client added');
  };
  const saveService = (event) => {
    event.preventDefault();
    if (!serviceForm.name.trim()) {
      showNotice('Enter a service name.', 'error');
      return;
    }
    const price = Number(serviceForm.price) || 0;
    const nextServices = [...services, { id: Date.now(), name: serviceForm.name.trim(), price, duration: serviceForm.duration || '60 min', staff: serviceForm.staff || 'Meena' }];
    setServices(nextServices);
    saveJSON(STORAGE.services, nextServices);
    setServiceForm({ name: '', price: '', duration: '60 min', staff: 'Meena' });
    setShowServiceForm(false);
    showNotice('Service added');
  };
  const deleteService = (id) => {
    const nextServices = services.filter((service) => service.id !== id);
    setServices(nextServices);
    saveJSON(STORAGE.services, nextServices);
    showNotice('Service removed');
  };
  const updateServicePrice = (id, value) => {
    const nextServices = services.map((service) => service.id === id ? { ...service, price: Math.max(0, Number(value) || 0) } : service);
    setServices(nextServices);
    saveJSON(STORAGE.services, nextServices);
  };
  const saveStaffMember = (event) => {
    event.preventDefault();
    if (!staffForm.name.trim() || staffForm.phone.replace(/\D/g, '').length !== 10) {
      showNotice('Enter staff name and a valid phone number.', 'error');
      return;
    }
    const nextStaff = [...staffList, { id: Date.now(), name: staffForm.name.trim(), phone: staffForm.phone.trim(), role: staffForm.role || 'Therapist', weekOffs: staffForm.weekOff === '' ? [] : [Number(staffForm.weekOff)] }];
    setStaffList(nextStaff);
    saveJSON(STORAGE.staff, nextStaff);
    setStaffForm({ name: '', phone: '', role: 'Therapist', weekOff: '' });
    setShowStaffForm(false);
    showNotice('Staff added');
  };
  const deleteStaffMember = (id) => {
    const nextStaff = staffList.filter((member) => member.id !== id);
    setStaffList(nextStaff);
    saveJSON(STORAGE.staff, nextStaff);
    showNotice('Staff removed');
  };
  const saveAttendanceRecord = (date, staffId, record) => setStaffAttendance((current) => {
    const dayRecord = { ...(current[date] || {}) };
    if (record) dayRecord[staffId] = record;
    else delete dayRecord[staffId];
    const next = { ...current, [date]: dayRecord };
    saveJSON(STORAGE.staffAttendance, next);
    return next;
  });
  const updateStaffWeekOffs = (staffId, weekOffs) => {
    const nextStaff = staffList.map((member) => member.id === staffId ? { ...member, weekOffs } : member);
    setStaffList(nextStaff);
    saveJSON(STORAGE.staff, nextStaff);
  };
  const formatWeekOffs = (member) => (member.weekOffs || []).length ? [1, 2, 3, 4, 5, 6, 0].filter((day) => member.weekOffs.includes(day)).map((day) => WEEKDAY_SHORT[day]).join(', ') : '—';
  const allocateMemberId = () => {
    const currentNumber = Number(window.localStorage.getItem(STORAGE.nextMemberId)) || 1;
    saveJSON(STORAGE.nextMemberId, currentNumber + 1);
    return `MEM-${String(currentNumber).padStart(4, '0')}`;
  };
  const addMembershipRecord = (details) => {
    const pkg = membershipPackages.find((item) => item.id === Number(details.packageId));
    const startDate = businessDate;
    const amount = pkg?.price || Number(details.amount) || 0;
    const paymentMode = details.paymentMode || 'Cash';
    const record = {
      id: Date.now() + Math.random(),
      memberId: allocateMemberId(),
      name: details.name.trim(),
      phone: details.phone.trim(),
      branch: details.branch || membershipBranches[0],
      packageId: pkg?.id || null,
      packageName: pkg?.name || details.packageName || '',
      validityMonths: pkg?.validityMonths || 0,
      amount,
      ...calculateMembershipPayment(amount, paymentMode),
      sessions: pkg?.sessions || Number(details.sessions) || 0,
      usedSessions: 0,
      paymentMode,
      startDate,
      expiryDate: pkg ? addMonthsISO(startDate, pkg.validityMonths) : startDate,
      cancelled: false,
      notes: details.notes || ''
    };
    setMemberships((records) => {
      const nextRecords = [...records, record];
      saveJSON(STORAGE.memberships, nextRecords);
      return nextRecords;
    });
    const method = normalizeReceiptMethod(paymentMode);
    const now = new Date().toISOString();
    const membershipReceipt = {
      id: `membership-sale-${record.id}`,
      number: allocateReceiptNumber(),
      date: businessDate,
      client: record.name,
      phone: record.phone,
      inTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      duration: '',
      service: record.packageName,
      packageName: record.packageName,
      membership: `${record.packageName} · ${record.sessions} sessions`,
      transactionType: 'New Membership',
      membershipId: record.id,
      memberId: record.memberId,
      sessionNumber: '',
      sessionsTotal: record.sessions,
      staff: '',
      price: amount,
      method,
      tax: record.gstRate,
      taxRate: record.gstRate,
      taxAmount: record.gstAmount,
      towelKit: 0,
      notes: record.notes,
      ...splitReceiptPayment(method, amount, record.gstAmount),
      memberFee: 0,
      total: record.totalAmount,
      deleted: false,
      createdAt: now,
      createdBy: userEmail
    };
    persistReceiptEntries([membershipReceipt, ...receiptEntries]);
    applyReceiptToDailyRows(membershipReceipt, 1);
    addClientRecord(record.name, record.phone);
    return record;
  };
  const saveMembership = (event) => {
    event.preventDefault();
    const pkg = membershipPackages.find((item) => item.id === Number(membershipForm.packageId));
    if (closedDates.includes(businessDate)) { setMembershipError('The current working day is closed. Memberships cannot be sold today.'); return; }
    if (!membershipForm.name.trim() || membershipForm.phone.replace(/\D/g, '').length !== 10 || !pkg) {
      setMembershipError('Enter client details and select a membership package.');
      return;
    }
    const record = addMembershipRecord({ ...membershipForm, startDate: businessDate });
    setSavedMembership(record);
    setMembershipForm((form) => ({ ...form, name: '', phone: '', notes: '' }));
    setMembershipError('');
    showNotice('Membership added — receipt generated');
  };
  const savePackage = (event) => {
    event.preventDefault();
    const sessions = Number(packageForm.sessions);
    const price = Number(packageForm.price);
    const validityMonths = Number(packageForm.validityMonths);
    if (!packageForm.name.trim() || sessions <= 0 || price <= 0 || validityMonths <= 0) {
      setPackageError('Enter a package name, sessions, price and validity greater than zero.');
      return;
    }
    let nextPackages;
    if (editingPackageId) {
      nextPackages = membershipPackages.map((pkg) => pkg.id === editingPackageId ? { ...pkg, name: packageForm.name.trim(), sessions, price, validityMonths, notes: packageForm.notes } : pkg);
    } else {
      nextPackages = [...membershipPackages, { id: Date.now(), name: packageForm.name.trim(), sessions, price, validityMonths, active: true, notes: packageForm.notes }];
    }
    setMembershipPackages(nextPackages);
    saveJSON(STORAGE.membershipPackages, nextPackages);
    setPackageForm({ name: '', sessions: '8', price: '12000', validityMonths: '6', notes: '' });
    setEditingPackageId(null);
    setPackageError('');
    showNotice(editingPackageId ? 'Package updated' : 'Package created');
  };
  const editPackage = (pkg) => {
    setPackageForm({ name: pkg.name, sessions: String(pkg.sessions), price: String(pkg.price), validityMonths: String(pkg.validityMonths), notes: pkg.notes || '' });
    setEditingPackageId(pkg.id);
    setPackageError('');
  };
  const togglePackageActive = (id) => {
    const nextPackages = membershipPackages.map((pkg) => pkg.id === id ? { ...pkg, active: !pkg.active } : pkg);
    setMembershipPackages(nextPackages);
    saveJSON(STORAGE.membershipPackages, nextPackages);
  };
  const completeMembershipSession = (id) => {
    const membership = memberships.find((item) => item.id === id);
    if (!membership || !canRedeemSession(membership)) { showNotice('This membership cannot redeem a session.', 'error'); return; }
    setMembershipLookupPhone(membership.phone);
    setRedeemForm({ membershipId: membership.id, service: services[0]?.name || '', staff: staffList[0]?.name || '', notes: '' });
    setPage('Receipts');
    showNotice('Confirm the visit in Receipts to deduct one session.');
  };
  const membershipsByPhone = (phone) => memberships.filter((membership) => membership.phone === phone.replace(/\D/g, ''));
  const openAppointmentMemberRedemption = (appointmentRecord) => {
    const membership = membershipsByPhone(appointmentRecord.phone).find(canRedeemSession);
    if (!membership) { showNotice('No active membership with available sessions for this client.', 'error'); return; }
    setMembershipLookupPhone(membership.phone);
    setRedeemForm({ membershipId: membership.id, service: appointmentRecord.service, staff: appointmentRecord.staff || staffList[0]?.name || '', notes: appointmentRecord.notes || '' });
    setPage('Receipts');
  };
  const redeemMembershipSession = (event) => {
    event.preventDefault();
    const membership = memberships.find((item) => item.id === redeemForm.membershipId);
    if (!membership || !canRedeemSession(membership)) { showNotice('This membership cannot redeem a session.', 'error'); return; }
    const remainingAfter = membership.sessions - membership.usedSessions - 1;
    const receiptId = `membership-session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const visit = {
      id: Date.now(),
      receiptId,
      membershipId: membership.id,
      memberId: membership.memberId,
      name: membership.name,
      phone: membership.phone,
      packageName: membership.packageName,
      date: businessDate,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      service: redeemForm.service,
      staff: redeemForm.staff,
      sessionNumber: membership.usedSessions + 1,
      remainingAfter,
      frontDeskUser: userEmail || userRole,
      notes: redeemForm.notes
    };
    const sessionReceipt = {
      id: receiptId,
      number: allocateReceiptNumber(),
      date: businessDate,
      client: membership.name,
      phone: membership.phone,
      inTime: visit.time,
      duration: services.find((service) => service.name === redeemForm.service)?.duration || '',
      service: redeemForm.service,
      packageName: membership.packageName,
      membership: `${membership.packageName} · ${membership.sessions} sessions`,
      transactionType: 'Membership Session',
      membershipId: membership.id,
      memberId: membership.memberId,
      sessionNumber: visit.sessionNumber,
      sessionsTotal: membership.sessions,
      staff: redeemForm.staff,
      price: 0,
      method: 'Member',
      tax: 0,
      taxRate: 0,
      taxAmount: 0,
      towelKit: 0,
      notes: redeemForm.notes,
      ...splitReceiptPayment('Member', 0, 0),
      memberFee: 0,
      total: 0,
      deleted: false,
      createdAt: new Date().toISOString(),
      createdBy: userEmail || userRole
    };
    persistReceiptEntries([sessionReceipt, ...receiptEntries]);
    applyReceiptToDailyRows(sessionReceipt, 1);
    const nextVisits = [visit, ...membershipVisits];
    setMembershipVisits(nextVisits);
    saveJSON(STORAGE.membershipVisits, nextVisits);
    const nextMemberships = memberships.map((item) => item.id === membership.id ? { ...item, usedSessions: item.usedSessions + 1 } : item);
    setMemberships(nextMemberships);
    saveJSON(STORAGE.memberships, nextMemberships);
    setSavedMembershipVisit({ ...visit, memberId: membership.memberId, sessions: membership.sessions });
    setRedeemForm({ membershipId: null, service: defaultServices[0]?.name || '', staff: defaultStaff[0]?.name || '', notes: '' });
    showNotice(`Session used for ${membership.name} — ${remainingAfter} remaining. No charge, no towel cash.`);
  };
  const currentActiveMemberships = memberships.filter((membership) => canRedeemSession(membership));
  const filteredMemberships = currentActiveMemberships.filter((membership) => {
    const query = membershipSearch.toLowerCase().trim();
    if (!query) return true;
    return [membership.name, membership.phone, membership.memberId].some((value) => value?.toLowerCase().includes(query));
  });
  const exportMembershipsToExcel = () => {
    const rows = filteredMemberships.map((membership) => ({
      'Member ID': membership.memberId,
      'Client Name': membership.name,
      'Phone Number': membership.phone,
      'Branch': membership.branch,
      'Package': membership.packageName,
      'Status': getMembershipStatus(membership),
      'Used Sessions': membership.usedSessions,
      'Remaining Sessions': membership.sessions - membership.usedSessions,
      'Total Sessions': membership.sessions,
      'Package Amount': membership.amount,
      'GST (%)': membership.gstRate || 0,
      'GST Amount': membership.gstAmount || 0,
      'Amount Paid': membership.totalAmount ?? membership.amount,
      'Payment Mode': membership.paymentMode,
      'Start Date': membership.startDate,
      'Expiry Date': membership.expiryDate,
      'Notes': membership.notes
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Memberships');
    XLSX.writeFile(workbook, `memberships-${todayISO()}.xlsx`);
  };
  const dailyVisibleRows = dailyRows.filter((row) => row.date === businessDate);
  const dailyTotals = dailyVisibleRows.reduce((totals, row) => ({
    cash: totals.cash + row.cash, card: totals.card + row.card, cardGst: totals.cardGst + row.cardGst,
    gpay: totals.gpay + row.gpay, gpayGst: totals.gpayGst + row.gpayGst, memberFee: totals.memberFee + row.memberFee,
    memberCount: totals.memberCount + row.memberCount, clientCount: totals.clientCount + row.clientCount, towelKit: totals.towelKit + row.towelKit
  }), { cash: 0, card: 0, cardGst: 0, gpay: 0, gpayGst: 0, memberFee: 0, memberCount: 0, clientCount: 0, towelKit: 0 });
  const dailyGross = dailyTotals.cash + dailyTotals.card + dailyTotals.gpay + dailyTotals.memberFee;
  const dailyGst = dailyTotals.cardGst + dailyTotals.gpayGst;
  const dailyCashReceipt = dailyTotals.cash + dailyTotals.memberFee - dailyTotals.towelKit;
  const dailyNetReceipt = dailyGross - dailyTotals.towelKit;
  const dailyExpenseTotal = dailyExpenses.filter((item) => item.date === businessDate).reduce((total, item) => total + item.amount, 0);
  const monthlyExpenseRows = dailyExpenses.filter((item) => item.date === businessDate);
  let reportBalance = 0;
  const monthlySnapshots = [];
  const reportDateCursor = new Date(`${dailyFrom}T00:00:00`);
  const reportLastDate = new Date(`${dailyTo}T00:00:00`);
  while (reportDateCursor <= reportLastDate) {
    const date = toISODate(reportDateCursor);
    const row = dailyRows.find((item) => item.date === date);
    const expenses = monthlyExpenseRows.filter((item) => item.date === date).reduce((total, item) => total + item.amount, 0);
    const cash = row?.cash || 0;
    const card = row?.card || 0;
    const gpay = row?.gpay || 0;
    const memberFee = row?.memberFee || 0;
    const receipts = cash + card + gpay + memberFee;
    const towelCashout = row?.towelKit || 0;
    const payments = expenses + towelCashout;
    const closingBalance = reportBalance + receipts - payments;
    monthlySnapshots.push({ date, openingBalance: reportBalance, cash, card, gpay, memberFee, receipts, expenses, towelCashout, payments, closingBalance });
    reportBalance = closingBalance;
    reportDateCursor.setDate(reportDateCursor.getDate() + 1);
  }
  const monthlyTotalReceipts = monthlySnapshots.reduce((total, snapshot) => total + snapshot.receipts, 0);
  const monthlyTotalPayments = monthlySnapshots.reduce((total, snapshot) => total + snapshot.payments, 0);
  const monthlyClosingBalance = monthlySnapshots.at(-1)?.closingBalance ?? reportBalance;
  const exportMonthlyReport = () => {
    const exportRows = monthlySnapshots.map((snapshot) => ({ Date: snapshot.date, 'Opening Balance': snapshot.openingBalance, Cash: snapshot.cash, Card: snapshot.card, GPay: snapshot.gpay, 'Membership Fees': snapshot.memberFee, 'Total Receipts': snapshot.receipts, Expenses: snapshot.expenses, 'Towel Cashout': snapshot.towelCashout, 'Total Payments': snapshot.payments, 'Closing Balance': snapshot.closingBalance }));
    exportRows.push({ Date: 'TOTAL', 'Opening Balance': monthlySnapshots[0]?.openingBalance || 0, Cash: monthlySnapshots.reduce((total, snapshot) => total + snapshot.cash, 0), Card: monthlySnapshots.reduce((total, snapshot) => total + snapshot.card, 0), GPay: monthlySnapshots.reduce((total, snapshot) => total + snapshot.gpay, 0), 'Membership Fees': monthlySnapshots.reduce((total, snapshot) => total + snapshot.memberFee, 0), 'Total Receipts': monthlyTotalReceipts, Expenses: monthlySnapshots.reduce((total, snapshot) => total + snapshot.expenses, 0), 'Towel Cashout': monthlySnapshots.reduce((total, snapshot) => total + snapshot.towelCashout, 0), 'Total Payments': monthlyTotalPayments, 'Closing Balance': monthlyClosingBalance });
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet['!cols'] = [{ wch: 14 }, ...Array(10).fill({ wch: 18 })];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Summary');
    XLSX.writeFile(workbook, `daily-summary-${businessDate}.xlsx`);
  };
  const recentExpenses = dailyExpenses.filter((item) => item.date === businessDate).slice(-4).reverse();
  const allExpenseTotal = dailyExpenses.filter((item) => item.date === businessDate).reduce((total, item) => total + item.amount, 0);
  const expensesForDate = (date) => monthlyExpenseRows.filter((item) => item.date === date);
  const updateDailyRow = (id, field, value) => setDailyRows((rows) => rows.map((row) => row.id === id ? { ...row, [field]: field === 'date' || field === 'day' ? value : Math.max(0, Number(value) || 0) } : row));
  const addDailyRow = (event) => {
    event.preventDefault();
    if (closedDates.includes(businessDate)) { showNotice('The working day is closed. A daily row cannot be added.', 'error'); return; }
    const date = new Date(`${businessDate}T00:00:00`);
    const row = { id: Date.now(), day: date.toLocaleDateString('en-IN', { weekday: 'long' }), date: businessDate, cash: Number(dailyForm.cash) || 0, card: Number(dailyForm.card) || 0, cardGst: Math.round((Number(dailyForm.card) || 0) * 0.05), gpay: Number(dailyForm.gpay) || 0, gpayGst: Math.round((Number(dailyForm.gpay) || 0) * 0.05), memberFee: Number(dailyForm.memberFee) || 0, memberCount: Number(dailyForm.memberCount) || 0, clientCount: Number(dailyForm.clientCount) || 0, towelKit: Number(dailyForm.towelKit) || 0 };
    setDailyRows((rows) => [...rows, row].sort((first, second) => first.date.localeCompare(second.date)));
    setDailyForm((form) => ({ ...form, date: businessDate, cash: '', card: '', gpay: '', memberFee: '', memberCount: '', clientCount: '', towelKit: '' }));
    showNotice('Daily receipt added');
  };
  const addDailyExpense = (event) => {
    event.preventDefault();
    if (closedDates.includes(businessDate)) { setExpenseError('This day is closed. Open the next working date to enter expenses.'); return; }
    if (!expenseForm.narration.trim() || Number(expenseForm.amount) <= 0) {
      setExpenseError('Enter a description and amount greater than zero.');
      return;
    }
    const entry = { id: Date.now(), date: businessDate, narration: expenseForm.narration.trim(), amount: Number(expenseForm.amount), source: expenseForm.source };
    setDailyExpenses((items) => [...items, entry]);
    if (businessDate < dailyFrom || businessDate > dailyTo) { setDailyFrom(businessDate); setDailyTo(businessDate); }
    setExpenseForm((form) => ({ ...form, date: businessDate, narration: '', amount: '' }));
    setExpenseError('');
    showNotice('Expense added');
  };
  const handleLogin = (event) => {
    event.preventDefault();
    const email = loginForm.email.trim().toLowerCase();
    if (!email || !loginForm.password) {
      setLoginError('Enter your email and password to continue.');
      return;
    }
    const account = USERS[email];
    if (!account || account.password !== loginForm.password) {
      setLoginError('Invalid email or password.');
      return;
    }
    setLoginError('');
    setUserEmail(email);
    setUserRole(account.role);
    setReceiptForm((current) => ({ ...current, date: businessDate }));
    setAppointment((current) => ({ ...current, date: businessDate }));
    setSelectedAppointmentDate(businessDate);
    setPage(account.role === 'Frontdesk' ? 'Appointments' : 'Dashboard');
  };

  const dayIsClosed = closedDates.includes(businessDate);
  const dayReportAppointments = appointmentsList.filter((item) => item.date === dayReportDate);
  const dayReportReceipts = receiptEntries.filter((item) => item.date === dayReportDate).map(toReceiptRow);
  const dayReportExpenses = dailyExpenses.filter((item) => item.date === dayReportDate);
  const dayReportMemberships = memberships.filter((item) => item.startDate === dayReportDate);
  const dayReportVisits = membershipVisits.filter((item) => item.date === dayReportDate);
  const dayReportCloseout = eodReports.find((item) => item.date === dayReportDate);
  const dayReportLedger = dailyRows.find((item) => item.date === dayReportDate);
  const currentDayEodReports = eodReports.filter((item) => item.date === businessDate);
  const currentDayMembershipVisits = membershipVisits.filter((visit) => visit.date === businessDate);
  const workingDayClientPhones = new Set([
    ...appointmentsList.filter((item) => item.date === businessDate).map((item) => item.phone),
    ...activeReceiptEntries.filter((item) => item.date === businessDate).map((item) => item.phone),
    ...memberships.filter((item) => item.startDate === businessDate).map((item) => item.phone),
    ...currentDayMembershipVisits.map((item) => item.phone)
  ].filter(Boolean));
  const workingDayClients = clients.filter((client) => client.createdDate === businessDate || workingDayClientPhones.has(client.phone));
  const activeDayReceipts = activeReceiptEntries.filter((entry) => entry.date === businessDate);
  const deletedDayReceipts = receiptEntries.filter((entry) => entry.deleted && entry.date === businessDate);
  const activeReceiptRows = toReceiptGridRows(activeDayReceipts);
  const deletedReceiptRows = toReceiptGridRows(deletedDayReceipts);
  const deletedReceiptCount = deletedDayReceipts.length;
  const todaysReceiptRows = activeDayReceipts.map(toReceiptRow);
  // Sessions redeemed from the membership lookup panel have no receipt but are still visits.
  const walkInMemberVisits = membershipVisits.filter((visit) => visit.date === businessDate && !visit.receiptId).length;
  const todaysMemberReceipts = todaysReceiptRows.filter((row) => row.method === 'Member').length;
  const todaysBreakdown = todaysReceiptRows.reduce((totals, row) => {
    const bucket = receiptRevenueBucket(row.method);
    return { ...totals, [bucket]: totals[bucket] + (bucket === 'Member' ? 0 : row.price + row.taxAmount) };
  }, { GPay: 0, Cash: 0, Card: 0, Member: 0 });
  const todaysRevenue = todaysBreakdown.GPay + todaysBreakdown.Cash + todaysBreakdown.Card;
  const receiptEditingEntry = editingReceiptId ? receiptEntries.find((item) => item.id === editingReceiptId) : null;
  const receiptMemberLookup = showReceiptForm && receiptFormIsMember ? resolveReceiptMembership(receiptForm, receiptEditingEntry) : null;
  const changeReceiptPaymentMode = () => {
    updateReceiptForm('method', '');
    window.setTimeout(() => document.getElementById('rx-payment-mode')?.focus(), 0);
  };
  const createMembershipFromReceipt = () => {
    setMembershipForm((form) => ({ ...form, name: receiptForm.client.trim(), phone: receiptForm.phone }));
    closeReceiptForm();
    setPage('Memberships');
    showNotice('Create the membership, then return to Receipts to record the visit.');
  };
  const renderMembershipPanel = () => {
    const lookup = receiptMemberLookup;
    if (!lookup) return null;
    if (lookup.state === 'needs-client') return <div className="rx-member-panel is-info" role="status"><div className="rx-member-head"><h4><Info size={15} strokeWidth={2} aria-hidden="true" />Membership Details</h4></div><p className="rx-member-note">Enter the client's 10-digit phone number (or exact name) to load their membership.</p></div>;
    const membership = lookup.membership;
    const actions = <div className="rx-member-actions"><button type="button" className="secondary-button small" onClick={changeReceiptPaymentMode}>Change Payment Mode</button><button type="button" className="secondary-button small rx-with-icon" onClick={createMembershipFromReceipt}><UserPlus size={14} strokeWidth={2} aria-hidden="true" />{membership ? 'Renew Membership' : 'Create Membership'}</button></div>;
    if (lookup.state === 'none') return <div className="rx-member-panel is-warning" role="alert"><div className="rx-member-head"><h4><AlertCircle size={15} strokeWidth={2} aria-hidden="true" />No active membership found for this client.</h4></div><p className="rx-member-note">Change the payment mode to GPay, Cash or Card, or create a membership first.</p>{actions}</div>;
    const used = membership.usedSessions || 0;
    const valid = lookup.state === 'ready' || lookup.state === 'already-redeemed';
    const details = <dl className="rx-member-grid">{[['Client', membership.name], ['Package', `${membership.packageName} · ${membership.sessions} Sessions`], ['Package Amount', money(membership.amount)], ['Purchased', formatMemberDate(membership.startDate)], ['Sessions Used', `${used} / ${membership.sessions}`], ['Sessions Remaining', membership.sessions - used], ['Valid Until', formatMemberDate(membership.expiryDate)], ['Status', getMembershipStatus(membership)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd title={String(value)}>{value}</dd></div>)}</dl>;
    if (!valid) return <div className="rx-member-panel is-warning" role="alert"><div className="rx-member-head"><h4><AlertCircle size={15} strokeWidth={2} aria-hidden="true" />{memberLookupErrors[lookup.state]}</h4><span className="rx-member-id">{membership.memberId}</span></div>{details}<p className="rx-member-note">Select another payment mode, or renew the membership before recording this visit as Member.</p>{actions}</div>;
    return <div className="rx-member-panel is-active" role="status" aria-live="polite"><div className="rx-member-head"><h4>Membership Details</h4><span className="rx-member-badge"><Check size={12} strokeWidth={2.6} aria-hidden="true" />{lookup.state === 'ready' ? 'Active Membership' : 'Membership Visit'}</span><span className="rx-member-id">{membership.memberId}</span></div>{details}<div className="rx-member-callout"><strong>{lookup.state === 'ready' ? 'This visit will use' : 'This visit uses'} Session {lookup.sessionNumber} of {membership.sessions}</strong><span><Info size={14} strokeWidth={2} aria-hidden="true" />{lookup.state === 'ready' ? '1 membership session will be deducted from this visit.' : 'This visit\'s session is already deducted — saving changes will not deduct another.'}</span></div></div>;
  };
  const receiptFiltersActive = Boolean(receiptSearch || receiptMethodFilter !== 'All' || receiptStaffFilter !== 'All');
  const clearReceiptFilters = () => { setReceiptSearch(''); setReceiptMethodFilter('All'); setReceiptStaffFilter('All'); };
  const exportReceiptsXlsx = async () => {
    if (!activeReceiptRows.length) { showNotice('There are no receipts to export.', 'error'); return; }
    setExportingReceipts(true);
    try {
      const excelModule = await import('exceljs');
      const ExcelJS = excelModule.default ?? excelModule;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = businessProfile.name;
      workbook.created = new Date();
      const sheet = workbook.addWorksheet('Receipts', { views: [{ state: 'frozen', ySplit: 1 }] });
      const currency = '"₹"#,##0.00';
      const centered = { horizontal: 'center', vertical: 'middle' };
      sheet.columns = [
        { header: 'Date', key: 'date', width: 13, style: { numFmt: 'dd-mmm-yyyy', alignment: centered } },
        { header: 'Client Name', key: 'client', width: 26 },
        { header: 'Phone Number', key: 'phone', width: 15, style: { alignment: centered } },
        { header: 'Duration', key: 'duration', width: 11, style: { alignment: centered } },
        { header: 'Service', key: 'service', width: 24 },
        { header: 'Membership', key: 'membership', width: 15, style: { alignment: centered } },
        { header: 'Transaction Type', key: 'transactionType', width: 22 },
        { header: 'Session Number', key: 'sessionNumber', width: 15, style: { alignment: centered } },
        { header: 'Price', key: 'price', width: 13, style: { numFmt: currency } },
        { header: 'Payment Mode', key: 'method', width: 15 },
        { header: 'Tax', key: 'tax', width: 12, style: { numFmt: currency } },
        { header: 'Staff Name', key: 'staff', width: 18 },
        { header: 'Towel Kit Cash Out', key: 'towelKit', width: 19, style: { numFmt: currency } },
        { header: 'Notes', key: 'notes', width: 36, style: { alignment: { wrapText: true, vertical: 'top' } } }
      ];
      activeReceiptRows.forEach((row) => {
        const [year, month, day] = row.date.split('-').map(Number);
        sheet.addRow({ date: new Date(Date.UTC(year, month - 1, day)), client: row.client, phone: row.phone, duration: row.duration, service: row.service, membership: row.membership, transactionType: row.transactionType, sessionNumber: row.sessionNumber, price: row.price, method: row.method, tax: row.taxAmount, staff: row.staff, towelKit: row.towelKit, notes: row.notes });
      });
      const edge = { style: 'thin', color: { argb: 'FFE2DEE6' } };
      sheet.eachRow((sheetRow, rowNumber) => sheetRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = { top: edge, left: edge, bottom: edge, right: edge };
        if (rowNumber > 1 && rowNumber % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F6FA' } };
      }));
      const header = sheet.getRow(1);
      header.height = 22;
      header.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A2431' } };
        cell.alignment = centered;
      });
      sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columns.length } };
      const buffer = await workbook.xlsx.writeBuffer();
      if (isPrivacyActive()) return;
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipts-${todayISO()}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      showNotice(`Exported ${activeReceiptRows.length} ${activeReceiptRows.length === 1 ? 'receipt' : 'receipts'} to Excel`);
    } catch {
      showNotice('Export failed. Please try again.', 'error');
    } finally {
      setExportingReceipts(false);
    }
  };
  const renderReceiptEmpty = (title, text) => <div className="rx-empty"><span className="rx-empty-icon"><Inbox size={20} strokeWidth={1.6} aria-hidden="true" /></span><strong>{title}</strong><p>{text}</p></div>;
  const renderReceiptSheet = (rows, deletedMode) => <div className="rx-sheet-scroll"><table className="rx-sheet"><colgroup>{receiptColumns.map(([key]) => <col key={key} className={`rx-col-${key}`} />)}<col className="rx-col-actions" /></colgroup><thead><tr>{receiptColumns.map(([key, label, kind]) => {
    const active = receiptSort.key === key;
    const SortIcon = active ? (receiptSort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
    return <th key={key} className={kind === 'num' ? 'rx-num' : ''} aria-sort={active ? (receiptSort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}><button type="button" className={`rx-sort ${active ? 'active' : ''}`} onClick={() => toggleReceiptSort(key)} title={`Sort by ${label}`}><span>{label}</span><SortIcon size={11} strokeWidth={2.2} aria-hidden="true" /></button></th>;
  })}<th className="rx-actions-col">Actions</th></tr></thead><tbody>{rows.map((row) => {
    const locked = closedDates.includes(row.date);
    return <tr key={row.id} className={locked ? 'rx-locked' : ''}>{receiptColumns.map(([key, , kind]) => {
      const value = receiptCellValue(row, key);
      return <td key={key} className={kind === 'num' ? 'rx-num' : kind === 'date' ? 'rx-date' : ''} title={receiptCellTitle(row, key, value)}>{receiptCellContent(row, key, value)}</td>;
    })}<td className="rx-actions">{deletedMode ? <><button type="button" className="rx-icon-button" onClick={() => restoreReceipt(row.id)} disabled={locked} title={locked ? 'Day closed — cannot restore' : 'Restore'} aria-label={`Restore ${row.number}`}><RotateCcw size={14} strokeWidth={2} /></button>{isAdminUser && <button type="button" className="rx-icon-button rx-danger" onClick={() => setReceiptConfirm({ id: row.id, permanent: true })} title="Delete permanently" aria-label={`Delete ${row.number} permanently`}><Trash2 size={14} strokeWidth={2} /></button>}</> : locked ? <span className="rx-lock" title="Day closed — locked"><Lock size={13} strokeWidth={2} aria-label="Locked" /></span> : <><button type="button" className="rx-icon-button" onClick={() => openEditReceipt(row.id)} title="Edit" aria-label={`Edit ${row.number}`}><Pencil size={14} strokeWidth={2} /></button><button type="button" className="rx-icon-button rx-danger" onClick={() => setReceiptConfirm({ id: row.id, permanent: false })} title="Delete" aria-label={`Delete ${row.number}`}><Trash2 size={14} strokeWidth={2} /></button></>}</td></tr>;
  })}</tbody>{!deletedMode && rows.length > 0 && <tfoot><tr><th colSpan={7}>Total · {rows.length} {rows.length === 1 ? 'receipt' : 'receipts'}</th><th className="rx-num">{money(rows.reduce((total, row) => total + row.price, 0))}</th><th /><th className="rx-num">{money(rows.reduce((total, row) => total + row.taxAmount, 0))}</th><th /><th className="rx-num">{money(rows.reduce((total, row) => total + row.towelKit, 0))}</th><th colSpan={2} /></tr></tfoot>}</table></div>;
  const todayExpenses = dailyExpenses.filter((item) => item.date === businessDate);
  const todayExpenseTotal = todayExpenses.reduce((total, item) => total + item.amount, 0);
  const todayAppointments = appointmentsList.filter((item) => item.date === businessDate);
  const todayVisitCount = todaysReceiptRows.length + walkInMemberVisits;
  const todayDashboardPayments = todaysReceiptRows.slice(0, 5).map((row) => [formatGridDate(row.date), row.number, row.client, row.service, money(row.total), row.method]);
  const visibleNav = userRole === 'Frontdesk' ? frontdeskNavItems : navItems;

  if (!userRole) return <>
    <PrivacyControls email="" />
    {privacyActive && <PrivacyPlaceholder page="Sign in" />}
    <div className="privacy-sensitive" hidden={privacyActive} inert={privacyActive ? '' : undefined} aria-hidden={privacyActive || undefined}>
      <main className="login-shell"><section className="login-card"><div className="login-brand"><span className="brand-mark">{businessProfile.name[0] || 'B'}</span><div><strong>{businessProfile.name}</strong><span>{businessProfile.tagline}</span></div></div><div className="login-heading"><p className="panel-kicker">Sign in</p><h1>Welcome back</h1><p>Enter your email and password to continue.</p></div><form className="login-form" onSubmit={handleLogin}><label>Email address<input type="email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} placeholder="you@bizora.com" autoComplete="username" required /></label><label>Password<input type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} placeholder="Enter password" autoComplete="current-password" required /></label>{loginError && <div className="form-error" role="alert">{loginError}</div>}<button className="primary-button login-button" type="submit">Sign in<span>→</span></button></form></section></main>
    </div>
  </>;

  const metricData = [
    ["Today's Appointments", String(todayAppointments.length), `${todayAppointments.filter((item) => item.status === 'Completed').length} completed`, 'violet'],
    ["Today's Revenue", money(todaysRevenue), 'Payments collected today', 'ink'],
    ["Today's Visits", String(todayVisitCount), `${todaysMemberReceipts + walkInMemberVisits} member visits`, 'gold'],
    ["Today's Expenses", money(todayExpenseTotal), `${todayExpenses.length} expense records`, 'rose']
  ];

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="brand-wrap"><div className="brand-mark">{privacyActive ? 'B' : businessProfile.name[0] || 'B'}</div><div className="brand-copy"><div className="brand-title">{privacyActive ? 'Hidden' : businessProfile.name}</div><div className="brand-subtitle">{privacyActive ? '' : businessProfile.tagline}</div></div><button type="button" className="sidebar-toggle" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}>{sidebarCollapsed ? <ChevronRight size={15} strokeWidth={2} /> : <ChevronLeft size={15} strokeWidth={2} />}</button></div>
      <nav className="nav" aria-label="Primary navigation">{visibleNav.map(([label, icon, kind]) => { if (kind === 'section') return <div key={label} className="nav-section-label">{label}</div>; const route = routeFor(label); const NavIcon = navIconComponents[label]; return <button key={label} className={`nav-item ${kind === 'sub' ? 'nav-item-sub' : ''} ${(privacyPage || page) === route ? 'active' : ''}`} onClick={() => privacyActive ? setPrivacyPage(route) : setPage(route)} title={label}><span>{NavIcon ? <NavIcon size={17} strokeWidth={1.8} aria-hidden="true" /> : icon}</span>{label}</button>; })}</nav>
      <div className="sidebar-footer">{userRole === 'Frontdesk' ? <><span>Working date</span><strong>{formatDisplayDate(businessDate)}</strong><button type="button" className="close-day-button" onClick={closeBusinessDay} disabled={dayIsClosed}>Close day</button></> : <><span className="status-dot" /> Open today <strong>{formatTime12h(businessProfile.openTime)} - {formatTime12h(businessProfile.closeTime)}</strong></>}</div>
    </aside>

    <main className="main-panel">
      <PrivacyControls email={userEmail} showActivation={(privacyPage || page) === 'Targets'} />
      {privacyActive && <PrivacyPlaceholder page={privacyPage || page} />}
      <div className="privacy-sensitive" hidden={privacyActive} inert={privacyActive ? '' : undefined} aria-hidden={privacyActive || undefined} onClickCapture={(event) => { if (isPrivacyActive()) { event.preventDefault(); event.stopPropagation(); } }} onSubmitCapture={(event) => { if (isPrivacyActive()) { event.preventDefault(); event.stopPropagation(); } }}>
      <header className="topbar"><div>{page !== 'Expenditure' && page !== 'Receipts' && page !== 'Clients' && page !== 'Staff' && page !== 'Services' && page !== 'Daily Receipts' && page !== 'Memberships' && <h1>{page === 'Dashboard' ? formatDisplayDate(businessDate) : page === 'Appointments' ? 'Appointment Dashboard' : page}</h1>}</div><div className="topbar-actions"><button className="icon-button" aria-label="Notifications"><Bell size={17} strokeWidth={1.8} /><span className="notification-dot" /></button><div className="user-pill"><span className="avatar">{userRole[0]}</span><span>{userRole}</span><b><ChevronDown size={14} strokeWidth={2} /></b></div></div></header>
      {page === 'Dashboard' && userRole !== 'Frontdesk' ? <>
        <section className="quick-actions">{['+ New Appointment', '+ Daily Report', '+ Add Expense', 'View Daily Summary'].map((action) => <button key={action} className="action-button" onClick={() => action === '+ Daily Report' ? setPage('Receipts') : action === '+ New Appointment' ? openNewAppointment() : action === '+ Add Expense' ? setPage('Expenditure') : action === 'View Daily Summary' ? setPage('Daily Receipts') : showNotice(`${action.replace('+ ', '')} opened`)}>{action}</button>)}</section>
        <section className="toolbar"><div className="filter-bar">{['Today', 'This Week', 'This Month', 'Custom'].map((item) => <button key={item} className={`chip ${range === item ? 'active' : ''}`} onClick={() => setRange(item)}>{item}</button>)}</div><div className="date-range"><label>From <input type="date" defaultValue="2026-09-01" /></label><span>to</span><label>To <input type="date" defaultValue="2026-09-30" /></label></div></section>
        <section className="metrics-grid">{metricData.map(([title, value, details, tone]) => <article className={`metric-card ${tone}`} key={title}><div className="metric-icon">✦</div><div className="metric-title">{title}</div><div className="metric-value">{value}</div><div className="metric-details">{details}</div><div className="metric-trend">Current day</div></article>)}</section>
        <section className="chart-grid"><article className="panel chart-panel"><div className="panel-header"><div><p className="panel-kicker">Performance</p><h2>Revenue overview</h2></div><button className="secondary-button small">Monthly ⌄</button></div><div className="chart-legend"><span><i className="legend-swatch violet" /> Revenue</span><span><i className="legend-swatch ink" /> Expenditure</span></div><div className="bar-chart">{chartBars.map((height, index) => <div className="bar-column" key={index}><div className="bar-pair"><div className="bar violet-bar" style={{ height: `${height}%` }} /><div className="bar ink-bar" style={{ height: `${height * 0.62}%` }} /></div><span>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}</span></div>)}</div></article><article className="panel expense-panel"><div className="panel-header"><div><p className="panel-kicker">Monthly split</p><h2>Expense breakdown</h2></div><button className="more-button">•••</button></div><div className="donut"><div><strong>{money(allExpenseTotal)}</strong><span>Total spent</span></div></div><div className="legend-list">{expenseBreakdown.map(([name, value, tone]) => <div className="legend-item" key={name}><span><i className={`legend-swatch ${tone}`} />{name}</span><strong>{value}</strong></div>)}</div></article></section>
        <section className="bottom-grid"><article className="panel"><div className="panel-header"><div><p className="panel-kicker">Transactions · {formatDisplayDate(businessDate)}</p><h2>Recent payments</h2></div><button className="secondary-button small" onClick={() => setPage('Receipts')}>View receipts</button></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Receipt</th><th>Client</th><th>Service</th><th>Amount</th><th>Method</th></tr></thead><tbody>{todayDashboardPayments.map((row) => <tr key={row[1]}>{row.map((cell, index) => <td key={`${row[1]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table>{todayDashboardPayments.length === 0 && <div className="empty-state">No payments recorded today.</div>}</div></article><article className="panel"><div className="panel-header"><div><p className="panel-kicker">Live records · {formatDisplayDate(businessDate)}</p><h2>Daily expenditure</h2></div><button className="more-button" onClick={() => setPage('Expenditure')}>•••</button></div><div className="expense-list">{recentExpenses.map((item) => <div className="expense-item" key={item.id}><span>{item.narration}<small>{item.date} · {item.source}</small></span><strong>{money(item.amount)}</strong></div>)}{recentExpenses.length === 0 && <div className="empty-state">No expenses recorded today.</div>}</div><div className="total-box"><span>Today's expenses</span><strong>{money(todayExpenseTotal)}</strong></div></article></section>
      </> : page === 'Appointments' ? <section className="appointments-page">
        <div className="appointments-header">
          <div>
            <p className="panel-kicker">Front desk · Daily Schedule</p>
            <h2>Appointments</h2>
            <p className="page-intro">{formatDisplayDate(selectedAppointmentDate)}</p>
          </div>
          <div className="appointments-header-actions">
            <button
              type="button"
              className="primary-button"
                onClick={openNewAppointment}
            >
              + Book Appointment
            </button>
          </div>
        </div>

        {/* Current date only */}

        {/* Status Filters and Search */}
        <div className="appointments-filter-row">
          <div className="excel-stats-bar">
            <button
              type="button"
              className={`excel-stat-card ${status === 'All' ? 'active' : ''}`}
              onClick={() => setStatus('All')}
            >
              All Total <strong>{dayStats.total}</strong>
            </button>
            <button
              type="button"
              className={`excel-stat-card green ${status === 'Completed' ? 'active' : ''}`}
              onClick={() => setStatus('Completed')}
              title="Completed appointments (Green)"
            >
              ✓ Completed <strong>{dayStats.completed}</strong>
            </button>
            <button
              type="button"
              className={`excel-stat-card red ${status === 'Cancelled' ? 'active' : ''}`}
              onClick={() => setStatus('Cancelled')}
              title="Cancelled appointments (Red)"
            >
              ✕ Cancelled <strong>{dayStats.notComing}</strong>
            </button>
          </div>

          <div className="search-row" style={{ maxWidth: '320px', margin: 0 }}>
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search client, phone, staff, service..."
            />
          </div>
        </div>

        {/* Collapsible Booking Drawer */}
        {showBookingForm && (
          <form className="booking-drawer" onSubmit={saveAppointment}>
            <div className="booking-drawer-header">
              <div>
                <p className="panel-kicker">New Appointment Row</p>
                <h3>Book Appointment for {formatDisplayDate(appointment.date || selectedAppointmentDate)}</h3>
              </div>
            </div>
            <div className="booking-drawer-grid">
              <label>
                Client name
                <input
                  autoFocus
                  value={appointment.client}
                  onChange={(event) => updateAppointment('client', event.target.value)}
                  placeholder="e.g. Ananya Rao"
                  required
                />
              </label>
              <label>
                Phone number
                <input
                  value={appointment.phone}
                  onChange={(event) => updateAppointment('phone', sanitizePhone(event.target.value))}
                  placeholder="9876543210"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  required
                />
              </label>
              <label>
                Specific Staff booked
                <select
                  value={appointment.staff}
                  onChange={(event) => updateAppointment('staff', event.target.value)}
                >
                  {staffList.map((member) => <option key={member.id}>{member.name}</option>)}
                </select>
              </label>
              <label>
                Service
                <select
                  value={appointment.service}
                  onChange={(event) => handleAppointmentService(event.target.value)}
                >
                  {services.map((service) => <option key={service.id}>{service.name}</option>)}
                </select>
              </label>
              <label>
                Duration
                <select
                  value={appointment.duration}
                  onChange={(event) => {
                    const dur = event.target.value;
                    const currentIn = appointment.inTime || appointment.time || '10:00';
                    setAppointment((current) => ({
                      ...current,
                      duration: dur,
                      outTime: calculateOutTime(currentIn, dur)
                    }));
                  }}
                >
                  <option>30 min</option>
                  <option>45 min</option>
                  <option>60 min</option>
                  <option>90 min</option>
                  <option>120 min</option>
                </select>
              </label>
              <label>
                Arrive Time (In)
                <input
                  type="time"
                  value={appointment.inTime || appointment.time}
                  onChange={(event) => {
                    const inVal = event.target.value;
                    setAppointment((current) => ({
                      ...current,
                      time: inVal,
                      inTime: inVal,
                      outTime: calculateOutTime(inVal, current.duration)
                    }));
                  }}
                  required
                />
              </label>
              <label>
                Out Time
                <input
                  type="time"
                  value={appointment.outTime || calculateOutTime(appointment.inTime || appointment.time || '10:00', appointment.duration)}
                  onChange={(event) => updateAppointment('outTime', event.target.value)}
                  required
                />
              </label>
              <label>
                Payment status
                <select
                  value={appointment.payment}
                  onChange={(event) => updateAppointment('payment', event.target.value)}
                >
                  <option>Pending</option>
                  <option>Paid</option>
                  <option>Pay at visit</option>
                </select>
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                Notes (optional)
                <input
                  value={appointment.notes}
                  onChange={(event) => updateAppointment('notes', event.target.value)}
                  placeholder="e.g. Prefers female therapist, sensitive skin"
                />
              </label>
            </div>
            {appointmentError && <div className="form-error" role="alert" style={{ marginTop: '14px' }}>{appointmentError}</div>}
            <div className="booking-drawer-actions">
              <button type="button" className="secondary-button" onClick={() => setShowBookingForm(false)}>Cancel</button>
              <button type="submit" className="primary-button">Confirm Booking <span>→</span></button>
            </div>
          </form>
        )}

        {/* Excel-like SpreadSheet Appointments Table */}
        <div className="excel-wrapper">
          <div className="excel-top-bar">
            <div className="excel-title-group">
              <div className="excel-sheet-icon">XLS</div>
              <div>
                <strong>Appointment Schedule Sheet</strong>
                <span> · {formatDisplayDate(selectedAppointmentDate)} ({filteredAppointments.length} Booked)</span>
              </div>
            </div>
            <div className="excel-top-actions">
              <button
                type="button"
                className="secondary-button small"
                onClick={() => window.print()}
                title="Print daily appointment sheet"
              >
                🖨 Print Sheet
              </button>
            </div>
          </div>

          <div className="excel-scroll">
            <table className="excel-table">
              <thead>
                <tr>
                  <th style={{ width: '36px', textAlign: 'center' }}>#</th>
                  <th style={{ minWidth: '140px' }}>Status</th>
                  <th style={{ minWidth: '150px' }}>Client Name</th>
                  <th style={{ minWidth: '120px' }}>Phone Number</th>
                  <th style={{ minWidth: '110px' }}>Staff</th>
                  <th style={{ minWidth: '160px' }}>Service & Duration</th>
                  <th style={{ minWidth: '105px' }}>Arrive Time (In)</th>
                  <th style={{ minWidth: '150px' }}>Notes</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((item, index) => {
                  const rowClass = getRowColorClass(item);
                  const currentIn = item.inTime || item.time || '10:00';
                  const hasRedeemableMembership = membershipsByPhone(item.phone || '').some(canRedeemSession);

                  return (
                    <tr
                      key={item.id}
                      className={`excel-row ${rowClass}`}
                      style={item.customBg ? { backgroundColor: item.customBg } : undefined}
                    >
                      <td className="excel-row-num">{index + 1}</td>

                      <td>
                        <select
                          className="excel-select"
                          value={['Booked', 'Completed', 'Cancelled'].includes(item.status) ? item.status : 'Booked'}
                          onChange={(event) => {
                            const val = event.target.value;
                            updateAppointmentStatus(item.id, val);
                          }}
                          title="Choose appointment status"
                        >
                          <option>Booked</option>
                          <option>Completed</option>
                          <option>Cancelled</option>
                        </select>
                      </td>

                      <td>
                        <div className="client-cell-wrap">
                          <strong>{item.client}</strong>
                          <span style={{ fontSize: '0.66rem', color: '#9ca3af' }}>{item.id}</span>
                        </div>
                      </td>

                      <td>
                        <div className="client-cell-wrap">
                          <a href={`tel:${item.phone}`} className="phone" style={{ textDecoration: 'none' }} title="Call client">
                            📞 {item.phone}
                          </a>
                        </div>
                      </td>

                      <td><span className="dashboard-readonly">{item.staff || '—'}</span></td>

                      <td>
                        <div className="service-cell-wrap">
                          <strong>{item.service}</strong>
                          <small>⏱ {item.duration}</small>
                        </div>
                      </td>

                      <td><span className="dashboard-readonly">{formatTime12h(currentIn)}</span></td>

                      <td><span className="dashboard-readonly">{item.notes || '—'}</span></td>

                      <td>
                        <div className="excel-actions-cell">
                          {hasRedeemableMembership && <button type="button" className="excel-member-btn" onClick={() => openAppointmentMemberRedemption(item)} title="Redeem a membership session" aria-label={`Redeem membership for ${item.client}`}><Gem size={14} strokeWidth={2} /></button>}
                          <button type="button" className="excel-edit-btn" onClick={() => editAppointment(item.id)} title="Edit appointment">✎</button>
                          <button type="button" className="excel-delete-btn" onClick={() => deleteAppointment(item.id)} title="Delete appointment">🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredAppointments.length === 0 && (
              <div className="empty-excel-sheet">
                <span className="empty-icon">📋</span>
                <p><strong>No appointments found for {formatDisplayDate(selectedAppointmentDate)}.</strong></p>
                <p>Use "+ Add Row" or "+ Book Appointment" above to schedule clients for this day.</p>
              </div>
            )}
          </div>
        </div>
      </section> : page === 'Expenditure' ? <section className="expenditure-page">
        <div className="receipt-page-header"><div><p className="panel-kicker">Finance</p><h2>Payments</h2><p className="page-intro">{formatDisplayDate(businessDate)}. Add today's payments below; closed days move to Monthly Report.</p></div><div className="daily-header-actions"><span className="form-status">{dayIsClosed ? 'Closed' : 'Open'}</span><button type="button" className="primary-button" onClick={closeBusinessDay} disabled={dayIsClosed}>Close day</button></div></div>
        <form className="receipt-layout" onSubmit={addDailyExpense}>
          <fieldset className="receipt-form-column unified-receipt-panel" disabled={dayIsClosed}>
            <section className="panel receipt-section"><div className="panel-header"><div><p className="panel-kicker">New payment</p><h2>Payment details</h2></div><span className="form-status">{businessDate}</span></div><div className="form-grid"><label>Amount (₹)<input type="number" min="1" value={expenseForm.amount} onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })} placeholder="0" required /></label><label className="notes-field">Payment description<input value={expenseForm.narration} onChange={(event) => setExpenseForm({ ...expenseForm, narration: event.target.value })} placeholder="e.g. Water bottles" required /></label><label>Mode<select value={expenseForm.source} onChange={(event) => setExpenseForm({ ...expenseForm, source: event.target.value })}><option>Cash</option><option>Card</option><option>GPay</option></select></label></div></section>
            {expenseError && <div className="form-error" role="alert">{expenseError}</div>}
            <button className="primary-button save-receipt-button" type="submit">Save expense <span>→</span></button>
          </fieldset>
          <aside className="receipt-preview expenditure-preview"><div className="preview-top"><span className="preview-logo">{businessProfile.name[0] || 'B'}</span><div><strong>{businessProfile.name}</strong><span>Manager</span></div><span className="preview-label">{dayIsClosed ? 'CLOSED' : 'OPEN'}</span></div><div className="preview-divider" /><div className="preview-heading"><div><p className="panel-kicker">Today</p><h3>{money(todayExpenseTotal)}</h3></div><span>{todayExpenses.length} {todayExpenses.length === 1 ? 'entry' : 'entries'}</span></div><div className="preview-client"><span>Current entry</span><strong>{expenseForm.narration || 'Expense description'}</strong><small>{businessDate} · {expenseForm.source}</small></div><div className="preview-totals"><div><span>Current amount</span><strong>{money(Number(expenseForm.amount) || 0)}</strong></div><div className="preview-total"><span>Today's total</span><strong>{money(todayExpenseTotal)}</strong></div></div><p className="preview-thanks">Outgoing payments, accounted for.</p></aside>
        </form>
        <section className="panel receipt-grid-panel"><div className="panel-header"><div><p className="panel-kicker">Entered today</p><h2>Payment grid</h2></div><span className="form-status">{money(todayExpenseTotal)}</span></div>
          {todayExpenses.length ? <div className="excel-scroll"><table className="excel-table expense-excel-table"><thead><tr><th style={{ width: '8%', textAlign: 'center' }}>#</th><th>Description</th><th>Mode</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead><tbody>{todayExpenses.slice().reverse().map((item, index) => <tr key={item.id} className="excel-row"><td className="excel-row-num">{index + 1}</td><td>{item.narration}</td><td>{item.source}</td><td style={{ textAlign: 'right' }}><strong>{money(item.amount)}</strong></td></tr>)}</tbody></table></div> : <div className="empty-state">No payments for this date yet.</div>}
        </section>
      </section> : page === 'Memberships' ? <section className="memberships-page">
        <div className="receipt-page-header"><div><p className="panel-kicker">Client plans · Current working day</p><h2>Memberships</h2><p className="page-intro">Manage active packages available for today’s client visits.</p></div><span className="form-status">{currentActiveMemberships.length} active</span></div>
        <section className="membership-stats-line">
          <span>Total active memberships <strong>{memberships.filter((m) => getMembershipStatus(m) === 'Active').length}</strong></span>
          <span>Membership revenue today <strong>{money(memberships.filter((m) => m.startDate === businessDate).reduce((total, m) => total + (m.totalAmount ?? m.amount), 0))}</strong></span>
        </section>
        <div className="membership-layout"><section className="panel receipt-section"><div className="panel-header"><div><p className="panel-kicker">New membership</p><h2>Plan details</h2></div><span className="form-status">Required</span></div><form className="membership-form" onSubmit={saveMembership}><div className="form-grid"><label>Client name<input value={membershipForm.name} onChange={(event) => setMembershipForm({ ...membershipForm, name: event.target.value })} placeholder="e.g. Priya Sharma" required /></label><label>Phone number<input value={membershipForm.phone} onChange={(event) => setMembershipForm({ ...membershipForm, phone: sanitizePhone(event.target.value) })} placeholder="9876543210" inputMode="numeric" maxLength={10} required /></label><label>Package<select value={membershipForm.packageId} onChange={(event) => setMembershipForm({ ...membershipForm, packageId: event.target.value })} required><option value="">Select a package</option>{activeMembershipPackages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name} — {pkg.sessions} sessions — {money(pkg.price)}</option>)}</select></label><label>Payment mode<select value={membershipForm.paymentMode} onChange={(event) => setMembershipForm({ ...membershipForm, paymentMode: event.target.value })}><option>Cash</option><option>Card</option><option>GPay / UPI</option><option>Other</option></select></label><label>Start date<input type="date" value={membershipForm.startDate} onChange={(event) => setMembershipForm({ ...membershipForm, startDate: event.target.value })} required /></label><label className="notes-field">Notes<input value={membershipForm.notes} onChange={(event) => setMembershipForm({ ...membershipForm, notes: event.target.value })} placeholder="Optional plan note" /></label></div>{(() => {
          const pkg = membershipPackages.find((item) => item.id === Number(membershipForm.packageId));
          if (!pkg) return null;
          const payment = calculateMembershipPayment(pkg.price, membershipForm.paymentMode);
          return <div className="membership-autofill"><span>Total sessions</span><strong>{pkg.sessions}</strong><span>Package amount</span><strong>{formatMembershipMoney(pkg.price)}</strong>{payment.gstRate > 0 && <><span>GST (5%)</span><strong>{formatMembershipMoney(payment.gstAmount)}</strong></>}<span>Total payable</span><strong>{formatMembershipMoney(payment.totalAmount)}</strong><span>Validity</span><strong>{pkg.validityMonths} months</strong><span>Expiry date</span><strong>{addMonthsISO(membershipForm.startDate, pkg.validityMonths)}</strong></div>;
        })()}{membershipError && <div className="form-error" role="alert">{membershipError}</div>}<button className="primary-button save-receipt-button" type="submit">Add membership <span>→</span></button></form></section>
        {savedMembership && <section className="rx-mreceipt" aria-label="Membership receipt"><div className="rx-mreceipt-head"><span className="rx-visit-icon"><Check size={14} strokeWidth={2.6} aria-hidden="true" /></span><div className="rx-mreceipt-title"><strong>Membership Receipt</strong><span>{savedMembership.memberId} · Paid in full</span></div><strong className="rx-mreceipt-amount">{formatMembershipMoney(savedMembership.totalAmount ?? savedMembership.amount)}</strong><span className="rx-visit-actions"><button type="button" className="rx-icon-button" onClick={() => window.print()} title="Print" aria-label="Print membership receipt"><Printer size={14} strokeWidth={2} /></button><button type="button" className="rx-icon-button" onClick={() => setSavedMembership(null)} title="Dismiss" aria-label="Dismiss membership receipt"><X size={14} strokeWidth={2} /></button></span></div><dl className="rx-member-grid rx-mreceipt-grid">{[['Client', savedMembership.name], ['Mobile', savedMembership.phone], ['Package', `${savedMembership.packageName} · ${savedMembership.sessions} sessions`], ['Payment', savedMembership.paymentMode], ['Valid', `${formatMemberDate(savedMembership.startDate)} → ${formatMemberDate(savedMembership.expiryDate)}`], ['Status', 'Active'], ...(savedMembership.gstRate > 0 ? [['Package amount', formatMembershipMoney(savedMembership.amount)], ['GST (5%)', formatMembershipMoney(savedMembership.gstAmount)], ['Total paid', formatMembershipMoney(savedMembership.totalAmount)]] : [])].map(([label, value]) => <div key={label}><dt>{label}</dt><dd title={String(value)}>{value}</dd></div>)}</dl></section>}
        <section className="panel membership-list"><div className="panel-header"><div><p className="panel-kicker">Active directory</p><h2>Membership clients</h2></div><div className="clients-page-actions"><input className="membership-search" value={membershipSearch} onChange={(event) => setMembershipSearch(event.target.value)} placeholder="Search active members" /><button type="button" className="secondary-button small" onClick={exportMembershipsToExcel} disabled={!filteredMemberships.length}>Export to Excel</button></div></div>
          {filteredMemberships.length ? <div className="excel-scroll"><table className="excel-table membership-excel-table"><thead><tr><th style={{ width: '36px', textAlign: 'center' }}>#</th><th>Member ID</th><th>Client Name</th><th>Phone Number</th><th>Package</th><th>Used Sessions</th><th>Remaining Sessions</th><th>Expiry</th><th>Status</th><th style={{ width: '150px', textAlign: 'center' }}>Actions</th></tr></thead><tbody>{filteredMemberships.map((membership, index) => { const remaining = membership.sessions - membership.usedSessions; const statusLabel = getMembershipStatus(membership); const redeemable = canRedeemSession(membership); return <tr key={membership.id} className="excel-row"><td className="excel-row-num">{index + 1}</td><td><strong>{membership.memberId}</strong></td><td>{membership.name}</td><td><a href={`tel:${membership.phone}`} className="phone" style={{ textDecoration: 'none' }}>📞 {membership.phone}</a></td><td>{membership.packageName || '—'}</td><td>{membership.usedSessions}</td><td><span className={`session-count ${remaining === 0 ? 'session-zero' : remaining <= 2 ? 'session-low' : ''}`}>{remaining}</span></td><td>{membership.expiryDate}</td><td><span className={`membership-status ${statusLabel === 'Active' ? 'complete' : ''}`}>{statusLabel}</span></td><td className="excel-actions-cell"><button type="button" className="secondary-button small" disabled={!redeemable} onClick={() => completeMembershipSession(membership.id)}>Use session</button></td></tr>; })}</tbody></table></div> : <div className="empty-state">No memberships yet.</div>}
        </section></div>
        <section className="panel membership-list"><div className="panel-header"><div><p className="panel-kicker">Today’s activity</p><h2>Session usage</h2></div><span className="form-status">{currentDayMembershipVisits.length} sessions logged today</span></div>
          {currentDayMembershipVisits.length ? <div className="excel-scroll"><table className="excel-table membership-excel-table"><thead><tr><th style={{ width: '36px', textAlign: 'center' }}>#</th><th>Date</th><th>Time</th><th>Client</th><th>Package</th><th>Service</th><th>Staff</th><th>Session #</th><th>Remaining After</th><th>Front desk</th></tr></thead><tbody>{currentDayMembershipVisits.slice(0, 50).map((visit, index) => <tr key={visit.id} className="excel-row"><td className="excel-row-num">{index + 1}</td><td>{visit.date}</td><td>{visit.time}</td><td>{visit.name}</td><td>{visit.packageName}</td><td>{visit.service}</td><td>{visit.staff}</td><td>{visit.sessionNumber}</td><td><span className={`session-count ${visit.remainingAfter === 0 ? 'session-zero' : visit.remainingAfter <= 2 ? 'session-low' : ''}`}>{visit.remainingAfter}</span></td><td>{visit.frontDeskUser}</td></tr>)}</tbody></table></div> : <div className="empty-state">No membership sessions used today.</div>}
        </section>
      </section> : page === 'Clients' ? <section className="clients-page">
        <div className="receipt-page-header clients-page-header"><div><p className="panel-kicker">People · {formatDisplayDate(businessDate)}</p><h2>Clients</h2><p className="page-intro">Clients added or seen on the current working day.</p></div><div className="clients-page-actions"><span className="form-status">{workingDayClients.length} {workingDayClients.length === 1 ? 'client' : 'clients'}</span><button type="button" className="primary-button" onClick={() => { setClientError(''); setShowClientForm((visible) => !visible); }}>{showClientForm ? 'Close form' : '+ Add client'}</button></div></div>
        {showClientForm && <section className="panel client-entry-panel"><div className="panel-header"><div><p className="panel-kicker">New client</p><h2>Client details</h2></div><span className="form-status">Required</span></div><form className="client-form" onSubmit={saveClient}><label>Client name<input autoFocus value={clientForm.name} onChange={(event) => setClientForm({ ...clientForm, name: event.target.value })} placeholder="e.g. Priya Sharma" required /></label><label>Phone number<input value={clientForm.phone} onChange={(event) => setClientForm({ ...clientForm, phone: sanitizePhone(event.target.value) })} placeholder="9876543210" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" required /></label>{clientError && <div className="form-error" role="alert">{clientError}</div>}<button className="primary-button" type="submit">Add client <span>→</span></button></form></section>}
        <section className="directory-sheet-panel"><div className="panel-header"><div><p className="panel-kicker">Today’s directory</p><h2>Working-day clients</h2></div></div>{workingDayClients.length ? <div className="directory-sheet-scroll"><table className="directory-sheet"><thead><tr><th>#</th><th>Client Name</th><th>Phone Number</th></tr></thead><tbody>{workingDayClients.map((client, index) => <tr key={client.id}><td>{index + 1}</td><td><strong>{client.name}</strong></td><td>{client.phone}</td></tr>)}</tbody></table></div> : <div className="empty-state">No clients for the current working day.</div>}</section>
      </section> : page === 'Services' ? <section className="services-page">
        <div className="receipt-page-header clients-page-header"><div><p className="panel-kicker">Catalog</p><h2>Services</h2><p className="page-intro">Browse salon services, pricing, duration, and assigned staff.</p></div><div className="clients-page-actions"><span className="form-status">{services.length} services</span><button type="button" className="primary-button" onClick={() => setShowServiceForm((visible) => !visible)}>{showServiceForm ? 'Close form' : '+ Add service'}</button></div></div>
        {showServiceForm && <section className="panel client-entry-panel"><div className="panel-header"><div><p className="panel-kicker">New service</p><h2>Service details</h2></div><span className="form-status">Required</span></div><form className="client-form" onSubmit={saveService}><label>Service name<input autoFocus value={serviceForm.name} onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} placeholder="e.g. Deep Tissue Massage" required /></label><label>Price (₹)<input type="number" min="0" value={serviceForm.price} onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })} placeholder="2000" required /></label><button className="primary-button" type="submit">Add service <span>→</span></button></form></section>}
        <section className="directory-sheet-panel"><div className="panel-header"><div><p className="panel-kicker">Directory sheet</p><h2>Saved services</h2></div></div>{services.length ? <div className="directory-sheet-scroll"><table className="directory-sheet"><thead><tr><th>#</th><th>Service Name</th><th>Price</th><th>Actions</th></tr></thead><tbody>{services.map((service, index) => <tr key={service.id}><td>{index + 1}</td><td><strong>{service.name}</strong></td><td><input className="directory-sheet-input" type="number" min="0" value={service.price} onChange={(event) => updateServicePrice(service.id, event.target.value)} aria-label={`Price for ${service.name}`} /></td><td><button type="button" className="secondary-button small" onClick={() => deleteService(service.id)}>Remove</button></td></tr>)}</tbody></table></div> : <div className="empty-state">No services yet.</div>}</section>
      </section> : page === 'Staff' ? <section className="staff-page">
        <div className="receipt-page-header clients-page-header"><div><p className="panel-kicker">Team</p><h2>Staff</h2><p className="page-intro">Browse staff names, roles, and phone numbers.</p></div><div className="clients-page-actions"><span className="form-status">{staffList.length} staff</span><button type="button" className="primary-button" onClick={() => setShowStaffForm((visible) => !visible)}>{showStaffForm ? 'Close form' : '+ Add staff'}</button></div></div>
        {showStaffForm && <section className="panel client-entry-panel"><div className="panel-header"><div><p className="panel-kicker">New staff</p><h2>Staff details</h2></div><span className="form-status">Required</span></div><form className="client-form" onSubmit={saveStaffMember}><label>Staff name<input autoFocus value={staffForm.name} onChange={(event) => setStaffForm({ ...staffForm, name: event.target.value })} placeholder="e.g. Meena" required /></label><label>Phone number<input value={staffForm.phone} onChange={(event) => setStaffForm({ ...staffForm, phone: sanitizePhone(event.target.value) })} placeholder="9876543210" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" required /></label><label>Role<select value={staffForm.role} onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })}><option>Massage Therapist</option><option>Facial Therapist</option><option>Hair Specialist</option><option>Nail Technician</option><option>Receptionist</option></select></label><label>Weekly off<select value={staffForm.weekOff} onChange={(event) => setStaffForm({ ...staffForm, weekOff: event.target.value })}><option value="">No fixed weekly off</option>{[1, 2, 3, 4, 5, 6, 0].map((day) => <option key={day} value={day}>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]}</option>)}</select></label><button className="primary-button" type="submit">Add staff <span>→</span></button></form></section>}
        <section className="directory-sheet-panel"><div className="panel-header"><div><p className="panel-kicker">Directory sheet</p><h2>Saved staff</h2></div></div>{staffList.length ? <div className="directory-sheet-scroll"><table className="directory-sheet"><thead><tr><th>#</th><th>Staff Name</th><th>Role</th><th>Phone Number</th><th>Weekly Off</th><th>Actions</th></tr></thead><tbody>{staffList.map((member, index) => <tr key={member.id}><td>{index + 1}</td><td><strong>{member.name}</strong></td><td>{member.role}</td><td>{member.phone}</td><td>{(member.weekOffs || []).length ? <span className="at-badge at-weekoff" title="Regular weekly off">OFF · {formatWeekOffs(member)}</span> : <span className="at-muted">Not set</span>}</td><td><button type="button" className="secondary-button small" onClick={() => deleteStaffMember(member.id)}>Remove</button></td></tr>)}</tbody></table></div> : <div className="empty-state">No staff yet.</div>}</section>
        <StaffAttendance staffList={staffList} attendance={staffAttendance} date={attendanceDate} today={businessDate} isAdmin={isAdminUser} userLabel={userEmail || userRole} onDateChange={setAttendanceDate} onSaveRecord={saveAttendanceRecord} onUpdateWeekOffs={updateStaffWeekOffs} notify={showNotice} />
      </section> : page === 'Daily Receipts' ? <section className="daily-receipts-page">
        <div className="receipt-page-header"><div><p className="panel-kicker">Current working day</p><h2>Daily Summary</h2><p className="page-intro">{formatDisplayDate(businessDate)}. Previous-date reports and transactions are available in Settings → Day Report.</p></div><div className="daily-header-actions"><button type="button" className="secondary-button" onClick={exportMonthlyReport}>Export XLSX</button><button className="primary-button" onClick={() => setPage('Expenditure')}>+ Add expense</button></div></div>
        <section className="daily-toolbar panel"><div><p className="panel-kicker">Working date</p><div className="daily-date-controls"><label>Date<input type="date" value={businessDate} readOnly disabled /></label></div></div><div className="daily-period-note"><strong>{formatGridDate(businessDate)}</strong><span>Operational totals for this date only.</span></div></section>
        <MonthlyStatement snapshots={monthlySnapshots} totalReceipts={monthlyTotalReceipts} totalPayments={monthlyTotalPayments} closingBalance={monthlyClosingBalance} />
        <section className="daily-metrics-grid"><article className="daily-metric violet"><span>Gross receipts</span><strong>{money(dailyGross)}</strong><small>Before towel-kit cashout</small></article><article className="daily-metric ink"><span>Net receipts</span><strong>{money(dailyNetReceipt)}</strong><small>Gross less towel kits</small></article><article className="daily-metric gold"><span>Membership fees</span><strong>{money(dailyTotals.memberFee)}</strong><small>{dailyTotals.memberCount} member visits</small></article><article className="daily-metric towel"><span>Towel kit cashout</span><strong>{money(dailyTotals.towelKit)}</strong><small>Deducted from cash receipts</small></article><article className="daily-metric rose"><span>Profit after expenses</span><strong>{money(dailyNetReceipt - dailyExpenseTotal)}</strong><small>Expenses {money(dailyExpenseTotal)}</small></article></section>
        <section className="panel daily-ledger-panel"><div className="panel-header"><div><p className="panel-kicker">Receipt register</p><h2>Daily collection breakdown</h2></div><span className="form-status">{money(dailyCashReceipt)} cash to account</span></div><div className="ledger-scroll"><table className="daily-ledger"><thead><tr><th>Day / date</th><th>Cash</th><th>Card</th><th>GST 5%</th><th>GPay</th><th>GST 5%</th><th>Membership fee</th><th>Client / member</th><th>Towel kit cashout</th><th>Receipt balance</th><th /></tr></thead><tbody>{dailyVisibleRows.map((row) => { const rowGross = row.cash + row.card + row.gpay + row.memberFee; const rowBalance = rowGross - row.towelKit; return <tr key={row.id}><td><strong>{row.day}</strong><small>{row.date}</small></td><td><input aria-label={`${row.day} cash`} type="number" value={row.cash} onChange={(event) => updateDailyRow(row.id, 'cash', event.target.value)} /></td><td><input aria-label={`${row.day} card`} type="number" value={row.card} onChange={(event) => updateDailyRow(row.id, 'card', event.target.value)} /></td><td><input aria-label={`${row.day} card GST`} type="number" value={row.cardGst} onChange={(event) => updateDailyRow(row.id, 'cardGst', event.target.value)} /></td><td><input aria-label={`${row.day} GPay`} type="number" value={row.gpay} onChange={(event) => updateDailyRow(row.id, 'gpay', event.target.value)} /></td><td><input aria-label={`${row.day} GPay GST`} type="number" value={row.gpayGst} onChange={(event) => updateDailyRow(row.id, 'gpayGst', event.target.value)} /></td><td><input aria-label={`${row.day} membership fee`} type="number" value={row.memberFee} onChange={(event) => updateDailyRow(row.id, 'memberFee', event.target.value)} /></td><td><div className="count-inputs"><input aria-label={`${row.day} member count`} type="number" value={row.memberCount} onChange={(event) => updateDailyRow(row.id, 'memberCount', event.target.value)} /><input aria-label={`${row.day} client count`} type="number" value={row.clientCount} onChange={(event) => updateDailyRow(row.id, 'clientCount', event.target.value)} /></div><small>{row.memberCount} members · {row.clientCount} clients</small></td><td><input aria-label={`${row.day} towel kit cashout`} type="number" value={row.towelKit} onChange={(event) => updateDailyRow(row.id, 'towelKit', event.target.value)} /></td><td className="ledger-balance">{money(rowBalance)}</td><td><button className="remove-item" aria-label={`Remove ${row.day}`} onClick={() => setDailyRows((rows) => rows.filter((item) => item.id !== row.id))}>×</button></td></tr>; })}</tbody><tfoot><tr><th>Grand total</th><th>{money(dailyTotals.cash)}</th><th>{money(dailyTotals.card)}</th><th>{money(dailyTotals.cardGst)}</th><th>{money(dailyTotals.gpay)}</th><th>{money(dailyTotals.gpayGst)}</th><th>{money(dailyTotals.memberFee)}</th><th>{dailyTotals.memberCount + dailyTotals.clientCount} visits</th><th>{money(dailyTotals.towelKit)}</th><th>{money(dailyNetReceipt)}</th><th /></tr></tfoot></table></div><div className="ledger-legend"><span><i className="legend-swatch violet" /> Receipt balance includes membership fees.</span><span><i className="legend-swatch rose" /> Towel kit is a cashout and reduces cash/net receipt.</span></div></section>
        <div className="daily-lower-grid"><section className="panel" id="daily-entry-form"><div className="panel-header"><div><p className="panel-kicker">New row</p><h2>Add daily receipt</h2></div><span className="form-status">GST auto-calculated</span></div><form className="daily-entry-form" onSubmit={addDailyRow}><label>Date<input type="date" value={dailyForm.date} onChange={(event) => setDailyForm({ ...dailyForm, date: event.target.value })} required /></label><label>Cash<input type="number" min="0" value={dailyForm.cash} onChange={(event) => setDailyForm({ ...dailyForm, cash: event.target.value })} placeholder="0" /></label><label>Card<input type="number" min="0" value={dailyForm.card} onChange={(event) => setDailyForm({ ...dailyForm, card: event.target.value })} placeholder="0" /></label><label>GPay<input type="number" min="0" value={dailyForm.gpay} onChange={(event) => setDailyForm({ ...dailyForm, gpay: event.target.value })} placeholder="0" /></label><label>Membership fee<input type="number" min="0" value={dailyForm.memberFee} onChange={(event) => setDailyForm({ ...dailyForm, memberFee: event.target.value })} placeholder="0" /></label><label>Members<input type="number" min="0" value={dailyForm.memberCount} onChange={(event) => setDailyForm({ ...dailyForm, memberCount: event.target.value })} placeholder="0" /></label><label>Clients<input type="number" min="0" value={dailyForm.clientCount} onChange={(event) => setDailyForm({ ...dailyForm, clientCount: event.target.value })} placeholder="0" /></label><label>Towel kit cashout<input type="number" min="0" value={dailyForm.towelKit} onChange={(event) => setDailyForm({ ...dailyForm, towelKit: event.target.value })} placeholder="0" /></label><button className="primary-button" type="submit">Add receipt row <span>→</span></button></form></section><section className="panel"><div className="panel-header"><div><p className="panel-kicker">Cash movement</p><h2>Daily expenses</h2></div><strong className="daily-expense-total">{money(dailyExpenseTotal)}</strong></div><div className="expense-list daily-expense-list">{monthlyExpenseRows.length ? monthlyExpenseRows.map((item) => <div className="expense-item" key={item.id}><span><strong>{item.narration}</strong><small>{item.date} · {item.source}</small></span><strong>{money(item.amount)}</strong></div>) : <div className="empty-state">No expenses in this period.</div>}</div></section></div>
      </section> : page === 'New Appointment' ? <form className="receipt-page appointment-page" onSubmit={saveAppointment}>
        <div className="receipt-page-header"><div><p className="panel-kicker">Schedule</p><p className="page-intro">{editingAppointmentId ? 'Update the client visit details.' : 'Enter a new client appointment.'}</p></div></div>
        <div className="receipt-layout">
          <div className="receipt-form-column">
            <section className="panel receipt-section"><div className="panel-header"><div><h2>Schedule</h2></div><span className="form-status">{appointment.date}</span></div><div className="form-grid"><label>Client name<input autoFocus value={appointment.client} onChange={(event) => updateAppointment('client', event.target.value)} placeholder="e.g. Priya Sharma" /></label><label>Phone number<input value={appointment.phone} onChange={(event) => updateAppointment('phone', sanitizePhone(event.target.value))} placeholder="9876543210" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" /></label><label>Appointment date<input type="date" value={appointment.date} onChange={(event) => updateAppointment('date', event.target.value)} /></label><div className="appointment-time-group"><label>Start hour<select value={getAppointmentTimeParts(appointment.time).hour} onChange={(event) => updateAppointmentTime('hour', event.target.value)}>{appointmentHours.map((hour) => <option key={hour}>{hour}</option>)}</select></label><label>Start minute<select value={getAppointmentTimeParts(appointment.time).minute} onChange={(event) => updateAppointmentTime('minute', event.target.value)}>{appointmentMinutes.map((minute) => <option key={minute}>{minute}</option>)}</select></label></div><label>Service<select value={appointment.service} onChange={(event) => handleAppointmentService(event.target.value)}>{services.map((service) => <option key={service.id}>{service.name}</option>)}</select></label><label>Duration<select value={appointment.duration} onChange={(event) => updateAppointment('duration', event.target.value)}><option>30 min</option><option>45 min</option><option>60 min</option><option>90 min</option><option>120 min</option></select></label><label>Assigned staff<select value={appointment.staff} onChange={(event) => updateAppointment('staff', event.target.value)}>{staffList.map((member) => <option key={member.id}>{member.name}</option>)}</select></label><label className="notes-field">Notes<input value={appointment.notes} onChange={(event) => updateAppointment('notes', event.target.value)} placeholder="Optional note for the therapist" /></label></div></section>
            {appointmentError && <div className="form-error" role="alert">{appointmentError}</div>}
            <button className="primary-button save-receipt-button" type="submit">{editingAppointmentId ? 'Save changes' : 'Book appointment'} <span>→</span></button>
          </div>
          <aside className="receipt-preview appointment-preview"><div className="preview-top"><span className="preview-logo">{businessProfile.name[0] || 'B'}</span><div><strong>{businessProfile.name}</strong><span>Manager</span></div><span className="preview-label">{savedAppointment ? 'BOOKED' : 'PREVIEW'}</span></div><div className="preview-divider" /><div className="preview-heading"><div><p className="panel-kicker">Appointment</p><h3>{savedAppointment?.id || 'APT-1048'}</h3></div><span>{appointment.date}</span></div><div className="preview-client"><span>Client</span><strong>{appointment.client || 'Client name'}</strong><small>{appointment.phone || 'Phone number'}</small></div><div className="appointment-summary-block"><div><span className="summary-icon">◷</span><div><small>Date &amp; time</small><strong>{appointment.date} at {formatTime12h(appointment.time)}</strong></div></div><div><span className="summary-icon">✦</span><div><small>Service</small><strong>{appointment.service} · {appointment.duration}</strong></div></div><div><span className="summary-icon">♙</span><div><small>Therapist</small><strong>{appointment.staff}</strong></div></div></div><p className="preview-thanks">A calm visit starts with a clear plan.</p>{savedAppointment && <button type="button" className="secondary-button print-button" onClick={() => window.print()}>Print appointment</button>}</aside>
        </div>
      </form> : page === 'Receipts' ? <section className="receipt-page">
        <div className="receipt-page-header rx-page-header"><div><h2>Receipts</h2><p className="page-intro">Manage, track and organize all customer payments and receipt records.</p></div><div className="rx-header-actions"><span className={`rx-day-status ${dayIsClosed ? 'closed' : ''}`} title="Working date">{dayIsClosed ? <Lock size={12} strokeWidth={2} aria-hidden="true" /> : <span className="rx-live-dot" aria-hidden="true" />}{formatDisplayDate(businessDate)} · {dayIsClosed ? 'Closed' : 'Open'}</span><button type="button" className="secondary-button" onClick={closeBusinessDay} disabled={dayIsClosed}>Close day</button><button type="button" className="primary-button rx-with-icon" onClick={openAddReceipt}><Plus size={16} strokeWidth={2.2} aria-hidden="true" />Add Receipt</button></div></div>
        <section className="rx-summary" aria-label="Today's summary">
          <div className="rx-summary-stats">
            <div><span>Today's Visits</span><strong>{todaysReceiptRows.length + walkInMemberVisits}</strong></div>
            <div><span>Paid Visits</span><strong>{todaysReceiptRows.length - todaysMemberReceipts}</strong></div>
            <div><span>Member Visits</span><strong>{todaysMemberReceipts + walkInMemberVisits}</strong></div>
            <div className="rx-summary-revenue"><span>Today's Revenue</span><strong>{money(todaysRevenue)}</strong></div>
          </div>
          <div className="rx-summary-breakdown" aria-label="Payment breakdown">{['GPay', 'Cash', 'Card', 'Member'].map((mode) => <div key={mode} className={`rx-pay-${mode.toLowerCase()}`}><span className="rx-pay">{mode}</span><strong>{money(todaysBreakdown[mode])}</strong></div>)}</div>
        </section>
        <div className="rx-toolbar">
          <label className="rx-search"><Search size={15} strokeWidth={2} aria-hidden="true" /><span className="sr-only">Search receipts</span><input type="search" value={receiptSearch} onChange={(event) => setReceiptSearch(event.target.value)} placeholder="Search client, phone, service, notes…" /></label>
          <div className="rx-filters" role="group" aria-label="Filters">
            <span className="rx-filters-label"><Filter size={13} strokeWidth={2} aria-hidden="true" />Filter</span>
            <label className="rx-filter"><span className="sr-only">Payment mode</span><select value={receiptMethodFilter} onChange={(event) => setReceiptMethodFilter(event.target.value)}><option value="All">All payments</option>{receiptPaymentModes.map((mode) => <option key={mode}>{mode}</option>)}</select></label>
            <label className="rx-filter"><span className="sr-only">Staff</span><select value={receiptStaffFilter} onChange={(event) => setReceiptStaffFilter(event.target.value)}><option value="All">All staff</option>{staffList.map((member) => <option key={member.id}>{member.name}</option>)}</select></label>
            {receiptFiltersActive && <button type="button" className="rx-text-button" onClick={clearReceiptFilters}><X size={13} strokeWidth={2.2} aria-hidden="true" />Clear</button>}
          </div>
          <button type="button" className="secondary-button rx-with-icon rx-export" onClick={exportReceiptsXlsx} disabled={exportingReceipts || !activeReceiptRows.length}><Download size={15} strokeWidth={2} aria-hidden="true" />{exportingReceipts ? 'Exporting…' : 'Export XLSX'}</button>
        </div>
        <section className="panel rx-panel">
          <div className="rx-panel-head"><div><h3>Active Receipts</h3><span className="rx-count">{receiptFiltersActive ? `${activeReceiptRows.length} of ${activeDayReceipts.length}` : activeDayReceipts.length} {activeDayReceipts.length === 1 ? 'record' : 'records'}</span></div></div>
          {activeReceiptRows.length ? renderReceiptSheet(activeReceiptRows, false) : activeDayReceipts.length ? renderReceiptEmpty('No matching receipts', 'Try a different search term or clear the filters.') : renderReceiptEmpty('No receipts yet', 'Click “Add Receipt” to record your first payment.')}
        </section>
        <section className="panel rx-panel rx-deleted-panel">
          <div className="rx-panel-head"><div><h3>Deleted Receipts</h3><span className="rx-count">{deletedReceiptCount} {deletedReceiptCount === 1 ? 'record' : 'records'}</span></div><button type="button" className="secondary-button small rx-with-icon" onClick={() => setShowDeletedReceipts((visible) => !visible)} aria-expanded={showDeletedReceipts}>{showDeletedReceipts ? 'Hide Deleted Receipts' : 'Show Deleted Receipts'}<ChevronDown size={14} strokeWidth={2} className={`rx-chevron ${showDeletedReceipts ? 'open' : ''}`} aria-hidden="true" /></button></div>
          {showDeletedReceipts && (deletedReceiptRows.length ? renderReceiptSheet(deletedReceiptRows, true) : renderReceiptEmpty(deletedReceiptCount ? 'No matching deleted receipts' : 'Nothing here', deletedReceiptCount ? 'Try a different search term or clear the filters.' : 'Deleted receipts appear here and can be restored at any time.'))}
        </section>
        {showReceiptForm && <div className="rx-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) closeReceiptForm(); }}>
          <form className="rx-modal panel" role="dialog" aria-modal="true" aria-labelledby="rx-form-title" onSubmit={saveReceipt} noValidate>
            <div className="rx-modal-head"><div><h2 id="rx-form-title">{editingReceiptId ? 'Edit Receipt' : 'Add Receipt'}</h2><p className="page-intro">{editingReceiptId ? 'Update the receipt details and save your changes.' : 'Record a customer payment. Fields marked * are required.'}</p></div><button type="button" className="rx-icon-button" onClick={closeReceiptForm} aria-label="Close form"><X size={16} strokeWidth={2} /></button></div>
            <div className="rx-form-grid">
              <label>Working Date<input type="date" value={businessDate} readOnly aria-readonly="true" /></label>
              <label>Client Name *<input autoFocus value={receiptForm.client} onChange={(event) => updateReceiptForm('client', event.target.value)} placeholder="e.g. Ravi Kumar" required /></label>
              <label>Phone Number<input type="tel" value={receiptForm.phone} onChange={(event) => updateReceiptForm('phone', sanitizePhone(event.target.value))} placeholder="9876543210" inputMode="numeric" maxLength={10} /></label>
              <div className="rx-duration-group"><span className="rx-group-label">Duration *</span><div className="rx-duration-fields"><label>Start hour<select value={getAppointmentTimeParts(receiptForm.time).hour} onChange={(event) => updateReceiptFormTime('hour', event.target.value)}>{appointmentHours.map((hour) => <option key={hour}>{hour}</option>)}</select></label><label>Minute<select value={getAppointmentTimeParts(receiptForm.time).minute} onChange={(event) => updateReceiptFormTime('minute', event.target.value)}>{appointmentMinutes.map((minute) => <option key={minute}>{minute}</option>)}</select></label><label>Length<select value={receiptForm.duration} onChange={(event) => updateReceiptForm('duration', event.target.value)}>{[...new Set([...receiptDurations, receiptForm.duration])].map((duration) => <option key={duration}>{duration}</option>)}</select></label></div><small className="rx-hint">{formatTime12h(receiptForm.time)} – {formatTime12h(calculateOutTime(receiptForm.time, receiptForm.duration))}</small></div>
              <label>Service *<select value={receiptForm.service} onChange={(event) => updateReceiptForm('service', event.target.value)} required>{!services.some((service) => service.name === receiptForm.service) && <option value={receiptForm.service}>{receiptForm.service || 'Select a service'}</option>}{services.map((service) => <option key={service.id}>{service.name}</option>)}</select></label>
              {receiptFormIsMember ? <label>Price<input className="rx-member-price" value="₹0 – Included in Membership" readOnly aria-readonly="true" tabIndex={-1} /></label> : <label>Price (₹) *<input type="number" min="0" step="1" inputMode="decimal" value={receiptForm.price} onChange={(event) => updateReceiptForm('price', event.target.value)} required /></label>}
              <label>Payment Mode *<select id="rx-payment-mode" value={receiptForm.method} onChange={(event) => updateReceiptForm('method', event.target.value)} required><option value="" disabled>Select Payment Mode</option>{receiptPaymentModes.map((mode) => <option key={mode}>{mode}</option>)}</select></label>
              <label>Tax (%){(receiptForm.method === 'Cash' || receiptFormIsMember) && <small className="tax-cash-note">{receiptFormIsMember ? ' ₹0 — no payment collected' : ' GST not applicable on cash'}</small>}<input type="number" min="0" max="100" step="0.01" inputMode="decimal" value={receiptForm.method === 'Cash' || receiptFormIsMember ? '0' : receiptForm.tax} onChange={(event) => updateReceiptForm('tax', event.target.value)} disabled={receiptForm.method === 'Cash' || receiptFormIsMember} /></label>
              {renderMembershipPanel()}
              <label>Staff Name *<select value={receiptForm.staff} onChange={(event) => updateReceiptForm('staff', event.target.value)} required>{!staffList.some((member) => member.name === receiptForm.staff) && <option value={receiptForm.staff}>{receiptForm.staff || 'Select staff'}</option>}{staffList.map((member) => <option key={member.id}>{member.name}</option>)}</select></label>
              <label>Towel Kit Cash Out (₹)<input type="number" min="0" step="1" inputMode="decimal" value={receiptForm.towelKit} onChange={(event) => updateReceiptForm('towelKit', event.target.value)} /></label>
              <label className="rx-notes-field">Notes<input value={receiptForm.notes} onChange={(event) => updateReceiptForm('notes', event.target.value)} placeholder="Optional" /></label>
            </div>
            <div className="rx-form-summary"><span>Payment <strong>{receiptForm.method || '—'}</strong></span><span>Price <strong>{money(receiptFormPrice)}</strong></span><span>Tax <strong>{money(receiptFormTaxAmount)}</strong></span><span>Total <strong>{money(receiptFormPrice + receiptFormTaxAmount)}</strong></span></div>
            {receiptError && <div className="form-error" role="alert">{receiptError}</div>}
            <div className="rx-modal-actions"><button type="button" className="secondary-button" onClick={closeReceiptForm}>Cancel</button><button type="submit" className="primary-button">{editingReceiptId ? 'Save Changes' : 'Save Receipt'}</button></div>
          </form>
        </div>}
        {receiptConfirm && <div className="rx-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setReceiptConfirm(null); }}>
          <div className="rx-modal rx-confirm panel" role="alertdialog" aria-modal="true" aria-labelledby="rx-confirm-title" aria-describedby="rx-confirm-text">
            <span className="rx-confirm-icon"><Trash2 size={18} strokeWidth={1.8} aria-hidden="true" /></span>
            <h2 id="rx-confirm-title">{receiptConfirm.permanent ? 'Delete Permanently?' : 'Delete Receipt?'}</h2>
            <p id="rx-confirm-text" className="page-intro">{receiptConfirm.permanent ? 'This receipt will be removed forever and cannot be restored.' : 'Are you sure you want to move this receipt to deleted receipts?'}</p>
            <div className="rx-modal-actions"><button type="button" className="secondary-button" autoFocus onClick={() => setReceiptConfirm(null)}>Cancel</button><button type="button" className="primary-button rx-danger-button" onClick={confirmReceiptAction}>Delete</button></div>
          </div>
        </div>}
        <section className="target-strip">
          <article className="target-strip-card">
            <span>Target set ({formatMonthLabel(getMonthKey(businessDate))})</span>
            <strong>{money(getMonthlyTarget(getMonthKey(businessDate)))}</strong>
          </article>
          <article className="target-strip-card">
            <span>Achieved so far (till previous date)</span>
            <strong>{money(achievedBeforeDate(getMonthKey(businessDate), businessDate))}</strong>
          </article>
        </section>
        <section className="panel receipt-section membership-lookup-panel">
          <div className="panel-header"><div><p className="panel-kicker">Membership</p><h2>Find membership by mobile number</h2></div></div>
          <div className="settings-form membership-lookup-input"><label>Mobile number<input value={membershipLookupPhone} onChange={(event) => setMembershipLookupPhone(sanitizePhone(event.target.value))} placeholder="9876543210" inputMode="numeric" maxLength={10} /></label></div>
          {membershipLookupPhone.length === 10 && (() => {
            const found = membershipsByPhone(membershipLookupPhone);
            if (!found.length) return <div className="empty-state">No membership found for this number.</div>;
            return <div className="membership-lookup-results">{found.map((membership) => {
              const remaining = membership.sessions - membership.usedSessions;
              const statusLabel = getMembershipStatus(membership);
              const redeemable = canRedeemSession(membership);
              const isRedeeming = redeemForm.membershipId === membership.id;
              return <div className="membership-lookup-card" key={membership.id}>
                <div className="membership-lookup-head"><strong>{membership.name}</strong><span className={`membership-status ${statusLabel === 'Active' ? 'complete' : ''}`}>{statusLabel}</span></div>
                <div className="membership-lookup-grid">
                  <span>Package<strong>{membership.packageName}</strong></span>
                  <span>Total sessions<strong>{membership.sessions}</strong></span>
                  <span>Used<strong>{membership.usedSessions}</strong></span>
                  <span>Remaining<strong className={`session-count ${remaining === 0 ? 'session-zero' : remaining <= 2 ? 'session-low' : ''}`}>{remaining}</strong></span>
                  <span>Expiry<strong>{membership.expiryDate}</strong></span>
                </div>
                {!redeemable && <p className="receipt-accounting-note">{remaining === 0 ? 'Sessions exhausted — this membership cannot be redeemed.' : `This membership is ${statusLabel.toLowerCase()} and cannot be redeemed.`}</p>}
                {redeemable && !isRedeeming && <button type="button" className="secondary-button small" onClick={() => setRedeemForm({ membershipId: membership.id, service: services[0]?.name || '', staff: staffList[0]?.name || '', notes: '' })}>Use 1 session</button>}
                {redeemable && isRedeeming && <form className="membership-redeem-form" onSubmit={redeemMembershipSession}>
                  <label>Service<select value={redeemForm.service} onChange={(event) => setRedeemForm({ ...redeemForm, service: event.target.value })}>{services.map((service) => <option key={service.id}>{service.name}</option>)}</select></label>
                  <label>Staff<select value={redeemForm.staff} onChange={(event) => setRedeemForm({ ...redeemForm, staff: event.target.value })}>{staffList.map((member) => <option key={member.id}>{member.name}</option>)}</select></label>
                  <button type="submit" className="primary-button small">Confirm session <span>→</span></button>
                  <button type="button" className="secondary-button small" onClick={() => setRedeemForm({ membershipId: null, service: '', staff: '', notes: '' })}>Cancel</button>
                </form>}
              </div>;
            })}</div>;
          })()}
        </section>
        {savedMembershipVisit && <section className="rx-visit-slip" aria-label="Membership visit receipt" title={`${savedMembershipVisit.name} · ${savedMembershipVisit.phone} · ${savedMembershipVisit.packageName} · Session ${savedMembershipVisit.sessionNumber} of ${savedMembershipVisit.sessions} · ${savedMembershipVisit.remainingAfter} remaining · no payment due`}><span className="rx-visit-icon"><Check size={14} strokeWidth={2.6} aria-hidden="true" /></span><div className="rx-visit-main"><strong>{savedMembershipVisit.name}</strong><span>{savedMembershipVisit.memberId} · {savedMembershipVisit.packageName}</span></div><div className="rx-visit-main"><strong>{savedMembershipVisit.service}</strong><span>{savedMembershipVisit.staff} · {formatMemberDate(savedMembershipVisit.date)} · {savedMembershipVisit.time}</span></div><span className="rx-member-tag">Session {savedMembershipVisit.sessionNumber}/{savedMembershipVisit.sessions}</span><span className="rx-visit-left">{savedMembershipVisit.remainingAfter} left</span><strong className="rx-visit-amount">{money(0)}</strong><span className="rx-visit-actions"><button type="button" className="rx-icon-button" onClick={() => window.print()} title="Print" aria-label="Print membership visit receipt"><Printer size={14} strokeWidth={2} /></button><button type="button" className="rx-icon-button" onClick={() => setSavedMembershipVisit(null)} title="Dismiss" aria-label="Dismiss membership visit receipt"><X size={14} strokeWidth={2} /></button></span></section>}
      </section> : page === 'Targets' ? <section className="targets-page">
        <div className="receipt-page-header"><div><p className="panel-kicker">Setup</p><h2>Settings</h2><p className="page-intro">Set the sales target for any month and configure WhatsApp report delivery. This appears on the Daily Receipts page and end of day reports.</p></div></div>
        <DayReport date={dayReportDate} maxDate={businessDate} onDateChange={setDayReportDate} appointments={dayReportAppointments} receipts={dayReportReceipts} expenses={dayReportExpenses} memberships={dayReportMemberships} visits={dayReportVisits} staff={staffList} attendance={staffAttendance} eodReport={dayReportCloseout} dailyRow={dayReportLedger} onSendEodReport={sendEodReport} />
        <div className="membership-layout">
          <section className="panel receipt-section">
            <div className="panel-header"><div><p className="panel-kicker">New / update target</p><h2>Monthly target</h2></div><span className="form-status">Required</span></div>
            <form className="settings-form" onSubmit={saveMonthlyTarget}>
              <label>Month<input type="month" value={targetForm.month} onChange={(event) => setTargetForm({ ...targetForm, month: event.target.value })} required /></label>
              <label>Target amount (₹)<input type="number" min="1" value={targetForm.amount} onChange={(event) => setTargetForm({ ...targetForm, amount: event.target.value })} placeholder="e.g. 20000000" required /></label>
              <label>Achieved so far already (₹) — optional opening figure<input type="number" min="0" value={targetForm.baseline} onChange={(event) => setTargetForm({ ...targetForm, baseline: event.target.value })} placeholder="e.g. 17000000" /></label>
              {targetError && <div className="form-error" role="alert">{targetError}</div>}
              <button className="primary-button" type="submit">Save target <span>→</span></button>
            </form>
          </section>
          <section className="panel membership-list">
            <div className="panel-header"><div><p className="panel-kicker">Directory sheet</p><h2>Saved targets</h2></div><span className="form-status">{Object.keys(monthlyTargets).length} months</span></div>
            {Object.keys(monthlyTargets).length ? <div className="directory-sheet-scroll"><table className="directory-sheet"><thead><tr><th>#</th><th>Month</th><th>Target</th><th>Achieved so far</th><th>Actions</th></tr></thead><tbody>{Object.keys(monthlyTargets).sort().reverse().map((monthKey, index) => <tr key={monthKey}><td>{index + 1}</td><td><strong>{formatMonthLabel(monthKey)}</strong></td><td>{money(getMonthlyTarget(monthKey))}</td><td>{money(achievedForMonth(monthKey, `${monthKey}-31`))}</td><td><button type="button" className="secondary-button small" onClick={() => deleteMonthlyTarget(monthKey)}>Remove</button></td></tr>)}</tbody></table></div> : <div className="empty-state">No targets set yet.</div>}
          </section>
        </div>
        <section className="panel receipt-section">
          <div className="panel-header"><div><p className="panel-kicker">Send report</p><h2>WhatsApp delivery number(s)</h2></div><span className="form-status">{whatsappNumber ? 'Configured' : 'Not set'}</span></div>
          <form className="settings-form" onSubmit={saveWhatsappNumber}>
            <label>WhatsApp numbers (with country code, comma separated for more than one)<input value={whatsappNumberDraft} onChange={(event) => setWhatsappNumberDraft(event.target.value.replace(/[^\d+,\s]/g, ''))} placeholder="e.g. 919876543210, 919123456780" /></label>
            <button className="primary-button" type="submit">Save number(s) <span>→</span></button>
          </form>
          <p className="receipt-accounting-note">The "Send report" button on EOD Reports opens WhatsApp with the report pre-filled to every number listed above (comma separated) — press Send inside WhatsApp for each to deliver it. To send to a group, add one of these numbers to the group, or open WhatsApp normally and paste the pre-filled message into the group chat (WhatsApp does not allow websites to auto-post into group chats).</p>
        </section>
        <div className="membership-layout">
          <section className="panel receipt-section">
            <div className="panel-header"><div><p className="panel-kicker">{editingPackageId ? 'Update package' : 'New package'}</p><h2>Membership packages</h2></div><span className="form-status">Required</span></div>
            <form className="settings-form" onSubmit={savePackage}>
              <label>Package name<input value={packageForm.name} onChange={(event) => setPackageForm({ ...packageForm, name: event.target.value })} placeholder="e.g. Basic 8" required /></label>
              <label>Total sessions<input type="number" min="1" value={packageForm.sessions} onChange={(event) => setPackageForm({ ...packageForm, sessions: event.target.value })} required /></label>
              <label>Package price (₹)<input type="number" min="1" value={packageForm.price} onChange={(event) => setPackageForm({ ...packageForm, price: event.target.value })} required /></label>
              <label>Validity (months)<input type="number" min="1" value={packageForm.validityMonths} onChange={(event) => setPackageForm({ ...packageForm, validityMonths: event.target.value })} required /></label>
              <label>Notes<input value={packageForm.notes} onChange={(event) => setPackageForm({ ...packageForm, notes: event.target.value })} placeholder="Optional" /></label>
              {packageError && <div className="form-error" role="alert">{packageError}</div>}
              <button className="primary-button" type="submit">{editingPackageId ? 'Update package' : 'Create package'} <span>→</span></button>
              {editingPackageId && <button type="button" className="secondary-button small" onClick={() => { setEditingPackageId(null); setPackageForm({ name: '', sessions: '8', price: '12000', validityMonths: '6', notes: '' }); }}>Cancel edit</button>}
            </form>
          </section>
          <section className="panel membership-list">
            <div className="panel-header"><div><p className="panel-kicker">Directory sheet</p><h2>Configured packages</h2></div><span className="form-status">{membershipPackages.length} packages</span></div>
            {membershipPackages.length ? <div className="directory-sheet-scroll"><table className="directory-sheet"><thead><tr><th>#</th><th>Package</th><th>Sessions</th><th>Price</th><th>Validity</th><th>Status</th><th>Actions</th></tr></thead><tbody>{membershipPackages.map((pkg, index) => <tr key={pkg.id}><td>{index + 1}</td><td><strong>{pkg.name}</strong></td><td>{pkg.sessions}</td><td>{money(pkg.price)}</td><td>{pkg.validityMonths} months</td><td><span className={`membership-status ${pkg.active ? 'complete' : ''}`}>{pkg.active ? 'Active' : 'Inactive'}</span></td><td className="excel-actions-cell"><button type="button" className="excel-edit-btn" onClick={() => editPackage(pkg)} title="Edit package" aria-label="Edit package">✎</button><button type="button" className={`excel-icon-btn ${pkg.active ? 'deactivate' : 'activate'}`} onClick={() => togglePackageActive(pkg.id)} title={pkg.active ? 'Deactivate package' : 'Activate package'} aria-label={pkg.active ? 'Deactivate package' : 'Activate package'}>{pkg.active ? '⏻' : '✓'}</button></td></tr>)}</tbody></table></div> : <div className="empty-state">No packages configured yet.</div>}
          </section>
        </div>
        <section className="panel receipt-section">
          <div className="panel-header"><div><p className="panel-kicker">Data safety</p><h2>Backup &amp; restore</h2></div><span className="form-status">Stored on this device only</span></div>
          <p className="receipt-accounting-note">All data lives in this browser's storage. Download a backup regularly, and restore it here (or on another device) if data is ever lost or you switch computers.</p>
          <div className="backup-restore-actions">
            <button type="button" className="secondary-button" onClick={backupAllData}>⬇ Download backup</button>
            <label className="secondary-button restore-upload-label">⬆ Restore from file<input type="file" accept="application/json" onChange={restoreAllData} hidden /></label>
          </div>
          {restoreError && <div className="form-error" role="alert">{restoreError}</div>}
        </section>
      </section> : page === 'EOD Reports' ? <section className="eod-reports-page">
        <div className="receipt-page-header"><div><p className="panel-kicker">Close of day</p><h2>End of Day Reports</h2><p className="page-intro">Current working day only. Previous day closeouts are available in Settings → Day Report.</p></div><span className="form-status">{currentDayEodReports.length} reports</span></div>
        {currentDayEodReports.length ? <div className="daily-lower-grid">
          <section className="panel directory-sheet-panel">
            <div className="panel-header"><div><p className="panel-kicker">Directory sheet</p><h2>Saved reports</h2></div></div>
            <div className="directory-sheet-scroll"><table className="directory-sheet"><thead><tr><th>#</th><th>Date</th><th>Closing balance</th><th></th></tr></thead><tbody>{currentDayEodReports.map((report, index) => <tr key={report.id} className={selectedEodReportId === report.id ? 'active-row' : ''}><td>{index + 1}</td><td>{report.day}</td><td>{money(report.closingBalance)}</td><td><button type="button" className="secondary-button small" onClick={() => setSelectedEodReportId(report.id)}>View</button></td></tr>)}</tbody></table></div>
          </section>
          {(() => {
            const report = currentDayEodReports.find((item) => item.id === selectedEodReportId) || currentDayEodReports[0];
            if (!report) return null;
            return <section className="panel eod-report-panel">
              <div className="panel-header"><div><p className="panel-kicker">End of day report</p><h2>{report.day}</h2></div><button type="button" className="secondary-button small" onClick={() => window.print()}>🖨 Print</button></div>
              <table className="eod-report-table">
                <tbody>
                  <tr><td>Opening balance</td><td>{money(report.openingBalance)}</td></tr>
                  <tr><td>Cash</td><td>{money(report.cash)}</td></tr>
                  <tr><td>Card</td><td>{money(report.card)}</td></tr>
                  <tr><td>GPay</td><td>{money(report.gpay)}</td></tr>
                  <tr className="eod-row-strong"><td>Total receipts</td><td>{money(report.receiptsSubtotal)}</td></tr>
                  <tr><td>GST collected</td><td>{money(report.gstCollected || 0)}</td></tr>
                  <tr className="eod-row-strong"><td>Total amount collected</td><td>{money(report.totalCollection ?? report.receiptsSubtotal)}</td></tr>
                  <tr><td>Towel cash</td><td>{money(report.towelCash)}</td></tr>
                  <tr className="eod-row-strong"><td>Total receipts after towel cash</td><td>{money(report.receiptsAfterTowel)}</td></tr>
                  <tr><td>Payment (expenses)</td><td>{money(report.paymentsForDay)}</td></tr>
                  <tr className="eod-row-final"><td>Closing balance</td><td>{money(report.closingBalance)}</td></tr>
                  <tr className="eod-row-spacer"><td colSpan={2} /></tr>
                  <tr><td>Target</td><td>{money(report.targetAmount)}</td></tr>
                  <tr><td>Achieved so far</td><td>{money(report.achievedSoFar)}</td></tr>
                  <tr className="eod-row-spacer"><td colSpan={2} /></tr>
                  <tr><td>Total clients served</td><td>{report.totalClientsServed}</td></tr>
                  <tr><td>Regular paid clients</td><td>{report.regularPaidClients}</td></tr>
                  <tr><td>Membership clients served</td><td>{report.membershipClientsServed}</td></tr>
                  <tr><td>Membership sessions used</td><td>{report.membershipSessionsUsed}</td></tr>
                  <tr><td>New memberships sold</td><td>{report.newMembershipsSold || 0}</td></tr>
                  <tr><td>Total receipts</td><td>{report.totalReceipts ?? 0}</td></tr>
                  <tr><td>Membership collection</td><td>{money(report.membershipCollection || 0)}</td></tr>
                  <tr><td>Normal service collection</td><td>{money(report.normalServiceCollection || 0)}</td></tr>
                  <tr><td>₹0 membership visits</td><td>{report.zeroMembershipVisits || 0}</td></tr>
                  <tr><td>Membership revenue collected today</td><td>{money(report.membershipRevenueToday)}</td></tr>
                </tbody>
              </table>
              <div className="eod-report-actions">
                <button type="button" className="primary-button" onClick={() => sendEodReport(report.id)}>📲 Send report on WhatsApp <span>→</span></button>
                {report.sent && <span className="form-status">Sent · {new Date(report.sentAt).toLocaleString('en-IN')}</span>}
              </div>
              <p className="preview-thanks">Closed by {report.closedBy} · {new Date(report.closedAt).toLocaleString('en-IN')}</p>
            </section>;
          })()}
        </div> : <div className="empty-state">No closeout exists for the current working day. View previous closeouts in Settings → Day Report.</div>}
      </section> : <section className="panel page-placeholder"><p className="panel-kicker">Coming soon</p><h2>{page}</h2><p>This module is not active yet.</p><button className="primary-button" onClick={() => setPage(userRole === 'Frontdesk' ? 'Appointments' : 'Dashboard')}>Back</button></section>}
      {notice && !privacyActive && <div key={notice.id} className={`toast toast-${notice.tone}`} role={notice.tone === 'error' ? 'alert' : 'status'}>{notice.tone === 'error' ? <AlertCircle size={17} strokeWidth={2} aria-hidden="true" /> : <CheckCircle2 size={17} strokeWidth={2} aria-hidden="true" />}<span>{notice.message}</span></div>}
      </div>
    </main>
  </div>;
}

export default App;
