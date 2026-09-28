import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

const appointments = [];

const navItems = [['Dashboard', '⌂'], ['Appointments', '◷'], ['Clients', '◌'], ['Memberships', '◎'], ['Services', '✦'], ['Staff', '♙'], ['Daily Report', '▤'], ['Monthly Report', '◒'], ['Expenditure', '↘'], ['Reports', '▥'], ['Targets', '◎'], ['Settings', '⚙']];
const frontdeskNavItems = [['Appointments', '◷'], ['Daily Receipts', '▤'], ['Monthly Report', '◒'], ['Daily Payments', '↘'], ['Clients', '◌'], ['Membership', '◎'], ['Staff', '♙'], ['Services', '✦']];
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
  nextMemberId: 'bizora-next-member-id'
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

const loadJSON = (key, fallback) => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};
const saveJSON = (key, value) => window.localStorage.setItem(key, JSON.stringify(value));
const toISODate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const todayISO = () => toISODate(new Date());
const addDaysISO = (iso, days) => {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toISODate(date);
};
const formatDisplayDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const sanitizePhone = (value) => value.replace(/\D/g, '').slice(0, 10);
const routeFor = (label) => {
  if (label === 'Daily Report' || label === 'Daily Receipts') return 'Receipts';
  if (label === 'Monthly Report') return 'Daily Receipts';
  if (label === 'Daily Payments') return 'Expenditure';
  if (label === 'Membership') return 'Memberships';
  return label;
};
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

function MonthlyStatement({ snapshots, totalReceipts, totalPayments, closingBalance }) {
  return <section className="panel monthly-statement"><div className="panel-header"><div><p className="panel-kicker">Monthly transaction snapshot</p><h2>Daily balances</h2></div><span className="form-status">{snapshots.length} days</span></div><div className="monthly-table-wrap"><table className="excel-table monthly-snapshot-table"><thead><tr><th>Date</th><th>Opening Balance</th><th>Total Receipts</th><th>Total Payments</th><th>Closing Balance</th></tr></thead><tbody>{snapshots.map((snapshot) => <tr key={snapshot.date}><td><strong>{snapshot.date}</strong></td><td>{money(snapshot.openingBalance)}</td><td>{money(snapshot.receipts)}</td><td>{money(snapshot.payments)}</td><td><strong>{money(snapshot.closingBalance)}</strong></td></tr>)}</tbody></table></div><div className="monthly-total-grid"><article><span>Total Receipts</span><strong>{money(totalReceipts)}</strong><small>For selected date range</small></article><article><span>Total Payments</span><strong>{money(totalPayments)}</strong><small>Expenses and cashouts</small></article><article className="monthly-final"><span>Closing Balance</span><strong>{money(closingBalance)}</strong><small>Balance at end of selected range</small></article></div></section>;
}

function App() {
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [, setClockTick] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [page, setPage] = useState('Dashboard');
  const [businessDate, setBusinessDate] = useState(() => {
    const stored = loadJSON(STORAGE.businessDate, null);
    if (stored) return stored;
    const today = todayISO();
    saveJSON(STORAGE.businessDate, today);
    return today;
  });
  const [closedDates, setClosedDates] = useState(() => loadJSON(STORAGE.closedDates, []));
  const [receiptEntries, setReceiptEntries] = useState(() => loadJSON(STORAGE.receiptEntries, []));
  const [deletionLogs, setDeletionLogs] = useState(() => loadJSON(STORAGE.deletionLogs, []));
  const [range, setRange] = useState('Today');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('GPay / UPI');
  const [notice, setNotice] = useState('');
  const [receipt, setReceipt] = useState(() => ({ client: '', phone: '', date: loadJSON(STORAGE.businessDate, null) || todayISO(), discount: '0', tax: '5', memberFee: '0', towelKit: '0', notes: '' }));
  const [receiptItems, setReceiptItems] = useState([{ id: 1, service: 'Swedish Massage', staff: 'Meena', quantity: 1, price: 2000 }]);
  const [receiptError, setReceiptError] = useState('');
  const [savedReceipt, setSavedReceipt] = useState(null);
  const [nextReceiptNumber, setNextReceiptNumber] = useState(() => Number(window.localStorage.getItem('salon-next-receipt-number-v2')) || 1);
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState(() => {
    return loadJSON(STORAGE.businessDate, null) || todayISO();
  });
  const [appointmentsList, setAppointmentsList] = useState(() => {
    const stored = loadJSON(STORAGE.appointments, null);
    if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    const initial = getInitialAppointments(loadJSON(STORAGE.businessDate, null) || todayISO());
    saveJSON(STORAGE.appointments, initial);
    return initial;
  });
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [appointment, setAppointment] = useState(() => ({
    client: '',
    phone: '',
    date: loadJSON(STORAGE.businessDate, null) || todayISO(),
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
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', role: 'Therapist' });
  const [memberships, setMemberships] = useState(() => loadJSON(STORAGE.memberships, []));
  const [membershipForm, setMembershipForm] = useState({ name: '', phone: '', branch: membershipBranches[0], packageName: '', duration: membershipDurations[0], amount: '15000', sessions: '8', paymentMode: 'Cash', startDate: '2026-09-24', notes: '' });
  const [membershipError, setMembershipError] = useState('');
  const [membershipSearch, setMembershipSearch] = useState('');
  const [receiptMembership, setReceiptMembership] = useState(false);
  const [receiptMembershipForm, setReceiptMembershipForm] = useState({ branch: membershipBranches[0], packageName: '', duration: membershipDurations[0], sessions: '8' });
  const [dailyRows, setDailyRows] = useState([]);
  const [dailyExpenses, setDailyExpenses] = useState(initialDailyExpenses);
  const [dailyFrom, setDailyFrom] = useState('2026-08-09');
  const [dailyTo, setDailyTo] = useState('2026-08-15');
  const [dailyForm, setDailyForm] = useState({ date: '2026-08-16', cash: '', card: '', gpay: '', memberFee: '', memberCount: '', clientCount: '', towelKit: '' });
  const [expenseForm, setExpenseForm] = useState({ date: loadJSON(STORAGE.businessDate, null) || todayISO(), narration: '', amount: '', source: 'Cash' });
  const [expenseError, setExpenseError] = useState('');

  useEffect(() => {
    const interval = window.setInterval(() => setClockTick((tick) => tick + 1), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const appointmentsForSelectedDate = useMemo(() => {
    return appointmentsList.filter((item) => item.date === selectedAppointmentDate);
  }, [appointmentsList, selectedAppointmentDate]);

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

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  };

  const receiptSubtotal = receiptItems.reduce((total, item) => total + item.quantity * item.price, 0);
  const receiptDiscount = Math.min(receiptSubtotal, Math.max(0, Number(receipt.discount) || 0));
  const receiptTax = Math.round((receiptSubtotal - receiptDiscount) * ((Number(receipt.tax) || 0) / 100));
  const receiptTotal = receiptSubtotal - receiptDiscount + receiptTax;

  const updateReceipt = (field, value) => setReceipt((current) => ({ ...current, [field]: value }));
  const updateReceiptItem = (id, field, value) => setReceiptItems((items) => items.map((item) => item.id === id ? { ...item, [field]: field === 'quantity' || field === 'price' ? Math.max(0, Number(value) || 0) : value } : item));
  const addReceiptItem = () => setReceiptItems((items) => [...items, { id: Date.now(), service: 'Facial', staff: 'Priya', quantity: 1, price: 1500 }]);
  const removeReceiptItem = (id) => setReceiptItems((items) => items.length === 1 ? items : items.filter((item) => item.id !== id));
  const allocateReceiptNumber = () => {
    const currentNumber = Number(window.localStorage.getItem('salon-next-receipt-number-v2')) || nextReceiptNumber || 1;
    const nextNumber = currentNumber + 1;
    window.localStorage.setItem('salon-next-receipt-number-v2', String(nextNumber));
    setNextReceiptNumber(nextNumber);
    return `REC-${String(currentNumber).padStart(5, '0')}`;
  };
  const saveReceipt = (event) => {
    event.preventDefault();
    const entryDate = businessDate;
    if (closedDates.includes(entryDate)) { setReceiptError('This day is closed. Open the next working date to enter receipts.'); return; }
    if (!receipt.client.trim()) { setReceiptError('Enter the client name before saving the receipt.'); return; }
    if (!receiptItems.length || receiptItems.some((item) => !item.service || item.price <= 0)) { setReceiptError('Add at least one service with a valid amount.'); return; }
    if (receiptMembership && (receipt.phone.replace(/\D/g, '').length !== 10 || Number(receiptMembershipForm.sessions) <= 0)) { setReceiptError('Enter a valid phone number and session count to add a membership.'); return; }
    const receiptNumber = allocateReceiptNumber();
    const receiptBase = receiptSubtotal - receiptDiscount;
    const receiptPayment = paymentMethod === 'Card' ? { cash: 0, card: receiptBase, cardGst: receiptTax, gpay: 0, gpayGst: 0 } : paymentMethod === 'GPay / UPI' ? { cash: 0, card: 0, cardGst: 0, gpay: receiptBase, gpayGst: receiptTax } : { cash: receiptBase, card: 0, cardGst: 0, gpay: 0, gpayGst: 0 };
    const receiptDate = new Date(`${entryDate}T00:00:00`);
    const entry = {
      id: Date.now(),
      number: receiptNumber,
      date: entryDate,
      client: receipt.client.trim(),
      phone: receipt.phone.trim(),
      method: paymentMethod,
      items: receiptItems.map((item) => ({ ...item })),
      discount: receiptDiscount,
      tax: Number(receipt.tax) || 0,
      memberFee: Number(receipt.memberFee) || 0,
      towelKit: Number(receipt.towelKit) || 0,
      notes: receipt.notes.trim(),
      ...receiptPayment,
      total: receiptTotal,
      createdAt: new Date().toISOString(),
      createdBy: userEmail
    };
    const nextEntries = [...receiptEntries, entry];
    setReceiptEntries(nextEntries);
    saveJSON(STORAGE.receiptEntries, nextEntries);
    setDailyRows((rows) => {
      const existing = rows.find((row) => row.date === entryDate);
      if (existing) return rows.map((row) => row.date === entryDate ? { ...row, cash: row.cash + receiptPayment.cash, card: row.card + receiptPayment.card, cardGst: row.cardGst + receiptPayment.cardGst, gpay: row.gpay + receiptPayment.gpay, gpayGst: row.gpayGst + receiptPayment.gpayGst, memberFee: row.memberFee + entry.memberFee, clientCount: row.clientCount + 1, towelKit: row.towelKit + entry.towelKit } : row);
      return [...rows, { id: Date.now() + 1, day: receiptDate.toLocaleDateString('en-IN', { weekday: 'long' }), date: entryDate, cash: 0, card: 0, cardGst: 0, gpay: 0, gpayGst: 0, memberFee: entry.memberFee, memberCount: 0, clientCount: 1, towelKit: entry.towelKit, ...receiptPayment }].sort((first, second) => first.date.localeCompare(second.date));
    });
    if (entryDate < dailyFrom || entryDate > dailyTo) { setDailyFrom(entryDate); setDailyTo(entryDate); }
    setSavedReceipt({ number: receiptNumber, total: receiptTotal, client: entry.client, method: paymentMethod });
    if (entry.phone) addClientRecord(entry.client, entry.phone);
    if (receiptMembership) {
      addMembershipRecord({ name: entry.client, phone: entry.phone, branch: receiptMembershipForm.branch, packageName: receiptMembershipForm.packageName, duration: receiptMembershipForm.duration, amount: entry.memberFee, sessions: receiptMembershipForm.sessions, paymentMode: paymentMethod, startDate: entryDate, notes: '' });
    }
    setReceipt({ client: '', phone: '', date: entryDate, discount: '0', tax: '5', memberFee: '0', towelKit: '0', notes: '' });
    setReceiptItems([{ id: Date.now() + 2, service: 'Swedish Massage', staff: 'Meena', quantity: 1, price: 2000 }]);
    setReceiptError('');
    setReceiptMembership(false);
    setReceiptMembershipForm({ branch: membershipBranches[0], packageName: '', duration: membershipDurations[0], sessions: '8' });
    showNotice(receiptMembership ? `${receiptNumber} saved and membership added` : `${receiptNumber} saved`);
  };
  const deleteReceiptEntry = (id) => {
    const entry = receiptEntries.find((item) => item.id === id);
    if (!entry) return;
    if (closedDates.includes(entry.date) || entry.date !== businessDate) {
      showNotice('Closed or past days cannot be changed. Delete is allowed only for the current open day.');
      return;
    }
    if (!window.confirm('Delete this receipt? You can re-enter the details if they were wrong.')) return;
    const nextLogs = [{
      id: Date.now(),
      what: `${entry.number} · ${entry.client} · ${entry.items.map((item) => item.service).join(', ')} · ${entry.method} · ${money(entry.total)}`,
      who: userEmail || userRole,
      when: new Date().toISOString(),
      date: entry.date
    }, ...deletionLogs];
    const nextEntries = receiptEntries.filter((item) => item.id !== id);
    setDeletionLogs(nextLogs);
    setReceiptEntries(nextEntries);
    saveJSON(STORAGE.deletionLogs, nextLogs);
    saveJSON(STORAGE.receiptEntries, nextEntries);
    setDailyRows((rows) => rows.map((row) => row.date !== entry.date ? row : {
      ...row,
      cash: Math.max(0, row.cash - entry.cash),
      card: Math.max(0, row.card - entry.card),
      cardGst: Math.max(0, row.cardGst - entry.cardGst),
      gpay: Math.max(0, row.gpay - entry.gpay),
      gpayGst: Math.max(0, row.gpayGst - entry.gpayGst),
      memberFee: Math.max(0, row.memberFee - entry.memberFee),
      clientCount: Math.max(0, row.clientCount - 1),
      towelKit: Math.max(0, row.towelKit - entry.towelKit)
    }));
    showNotice(`${entry.number} deleted`);
  };
  const closeBusinessDay = () => {
    if (closedDates.includes(businessDate)) {
      showNotice('This day is already closed.');
      return;
    }
    if (!window.confirm(`Close ${formatDisplayDate(businessDate)}? After closing you cannot change receipts for this day.`)) return;
    const nextClosed = [...closedDates, businessDate];
    const nextDate = addDaysISO(businessDate, 1);
    setClosedDates(nextClosed);
    setBusinessDate(nextDate);
    setSelectedAppointmentDate(nextDate);
    saveJSON(STORAGE.closedDates, nextClosed);
    saveJSON(STORAGE.businessDate, nextDate);
    setReceipt((current) => ({ ...current, date: nextDate }));
    setAppointment((current) => ({ ...current, date: nextDate }));
    setExpenseForm((current) => ({ ...current, date: nextDate }));
    showNotice(`Day closed. Now working on ${formatDisplayDate(nextDate)}`);
  };
  const updateAppointment = (field, value) => setAppointment((current) => ({ ...current, [field]: value }));
  const updateAppointmentTime = (field, value) => setAppointment((current) => {
    const nextParts = { ...getAppointmentTimeParts(current.time), [field]: value };
    const time = `${nextParts.hour.split(' ')[0]}:${nextParts.minute} ${nextParts.hour.split(' ')[1]}`;
    return { ...current, time, inTime: time, outTime: calculateOutTime(time, current.duration) };
  });
  const openNewAppointment = () => {
    setAppointment((current) => ({ ...current, date: selectedAppointmentDate < todayISO() ? todayISO() : selectedAppointmentDate }));
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
    if (!editingAppointmentId && appointment.date < todayISO()) { setAppointmentError('New appointments can only be booked for today or a future date.'); return; }
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
    const nextClients = [...records, { id: Date.now(), name: name.trim(), phone: phone.trim() }];
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
      showNotice('Enter a service name.');
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
      showNotice('Enter staff name and a valid phone number.');
      return;
    }
    const nextStaff = [...staffList, { id: Date.now(), name: staffForm.name.trim(), phone: staffForm.phone.trim(), role: staffForm.role || 'Therapist' }];
    setStaffList(nextStaff);
    saveJSON(STORAGE.staff, nextStaff);
    setStaffForm({ name: '', phone: '', role: 'Therapist' });
    setShowStaffForm(false);
    showNotice('Staff added');
  };
  const deleteStaffMember = (id) => {
    const nextStaff = staffList.filter((member) => member.id !== id);
    setStaffList(nextStaff);
    saveJSON(STORAGE.staff, nextStaff);
    showNotice('Staff removed');
  };
  const allocateMemberId = () => {
    const currentNumber = Number(window.localStorage.getItem(STORAGE.nextMemberId)) || 1;
    window.localStorage.setItem(STORAGE.nextMemberId, String(currentNumber + 1));
    return `MEM-${String(currentNumber).padStart(4, '0')}`;
  };
  const addMembershipRecord = (details) => {
    const record = {
      id: Date.now() + Math.random(),
      memberId: allocateMemberId(),
      name: details.name.trim(),
      phone: details.phone.trim(),
      branch: details.branch || membershipBranches[0],
      packageName: details.packageName || '',
      duration: details.duration || membershipDurations[0],
      amount: Number(details.amount) || 0,
      sessions: Number(details.sessions) || 0,
      usedSessions: 0,
      paymentMode: details.paymentMode || 'Cash',
      startDate: details.startDate || todayISO(),
      notes: details.notes || ''
    };
    setMemberships((records) => {
      const nextRecords = [...records, record];
      saveJSON(STORAGE.memberships, nextRecords);
      return nextRecords;
    });
    addClientRecord(record.name, record.phone);
    return record;
  };
  const saveMembership = (event) => {
    event.preventDefault();
    const sessionTotal = Number(membershipForm.sessions);
    const amount = Number(membershipForm.amount);
    if (!membershipForm.name.trim() || membershipForm.phone.replace(/\D/g, '').length !== 10 || amount <= 0 || sessionTotal <= 0) {
      setMembershipError('Enter client details, a valid amount and session count.');
      return;
    }
    addMembershipRecord(membershipForm);
    setMembershipForm((form) => ({ ...form, name: '', phone: '', packageName: '', notes: '' }));
    setMembershipError('');
    showNotice('Membership added');
  };
  const completeMembershipSession = (id) => setMemberships((records) => {
    const nextRecords = records.map((membership) => membership.id === id && membership.usedSessions < membership.sessions ? { ...membership, usedSessions: membership.usedSessions + 1 } : membership);
    saveJSON(STORAGE.memberships, nextRecords);
    return nextRecords;
  });
  const filteredMemberships = memberships.filter((membership) => {
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
      'Duration': membership.duration,
      'Package': membership.packageName,
      'Used Sessions': membership.usedSessions,
      'Remaining Sessions': membership.sessions - membership.usedSessions,
      'Total Sessions': membership.sessions,
      'Amount Paid': membership.amount,
      'Payment Mode': membership.paymentMode,
      'Start Date': membership.startDate,
      'Notes': membership.notes
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Memberships');
    XLSX.writeFile(workbook, `memberships-${todayISO()}.xlsx`);
  };
  const dailyVisibleRows = dailyRows.filter((row) => row.date >= dailyFrom && row.date <= dailyTo);
  const dailyTotals = dailyVisibleRows.reduce((totals, row) => ({
    cash: totals.cash + row.cash, card: totals.card + row.card, cardGst: totals.cardGst + row.cardGst,
    gpay: totals.gpay + row.gpay, gpayGst: totals.gpayGst + row.gpayGst, memberFee: totals.memberFee + row.memberFee,
    memberCount: totals.memberCount + row.memberCount, clientCount: totals.clientCount + row.clientCount, towelKit: totals.towelKit + row.towelKit
  }), { cash: 0, card: 0, cardGst: 0, gpay: 0, gpayGst: 0, memberFee: 0, memberCount: 0, clientCount: 0, towelKit: 0 });
  const dailyGross = dailyTotals.cash + dailyTotals.card + dailyTotals.gpay + dailyTotals.memberFee;
  const dailyGst = dailyTotals.cardGst + dailyTotals.gpayGst;
  const dailyCashReceipt = dailyTotals.cash + dailyTotals.memberFee - dailyTotals.towelKit;
  const dailyNetReceipt = dailyGross - dailyTotals.towelKit;
  const dailyExpenseTotal = dailyExpenses.filter((item) => item.date >= dailyFrom && item.date <= dailyTo).reduce((total, item) => total + item.amount, 0);
  const monthlyExpenseRows = dailyExpenses.filter((item) => item.date >= dailyFrom && item.date <= dailyTo);
  const priorIncome = dailyRows.filter((row) => row.date < dailyFrom).reduce((total, row) => total + row.cash + row.card + row.gpay + row.memberFee - row.towelKit, 0);
  const priorExpenses = dailyExpenses.filter((item) => item.date < dailyFrom).reduce((total, item) => total + item.amount, 0);
  let reportBalance = priorIncome - priorExpenses;
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Report');
    XLSX.writeFile(workbook, `monthly-report-${dailyFrom}-to-${dailyTo}.xlsx`);
  };
  const recentExpenses = dailyExpenses.slice(-4).reverse();
  const allExpenseTotal = dailyExpenses.reduce((total, item) => total + item.amount, 0);
  const expensesForDate = (date) => monthlyExpenseRows.filter((item) => item.date === date);
  const updateDailyRow = (id, field, value) => setDailyRows((rows) => rows.map((row) => row.id === id ? { ...row, [field]: field === 'date' || field === 'day' ? value : Math.max(0, Number(value) || 0) } : row));
  const addDailyRow = (event) => {
    event.preventDefault();
    if (!dailyForm.date) return;
    const date = new Date(`${dailyForm.date}T00:00:00`);
    const row = { id: Date.now(), day: date.toLocaleDateString('en-IN', { weekday: 'long' }), date: dailyForm.date, cash: Number(dailyForm.cash) || 0, card: Number(dailyForm.card) || 0, cardGst: Math.round((Number(dailyForm.card) || 0) * 0.05), gpay: Number(dailyForm.gpay) || 0, gpayGst: Math.round((Number(dailyForm.gpay) || 0) * 0.05), memberFee: Number(dailyForm.memberFee) || 0, memberCount: Number(dailyForm.memberCount) || 0, clientCount: Number(dailyForm.clientCount) || 0, towelKit: Number(dailyForm.towelKit) || 0 };
    setDailyRows((rows) => [...rows, row].sort((first, second) => first.date.localeCompare(second.date)));
    setDailyForm((form) => ({ ...form, date: '', cash: '', card: '', gpay: '', memberFee: '', memberCount: '', clientCount: '', towelKit: '' }));
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
  const resetTestData = () => {
    if (!window.confirm('Clear all saved data and return to the beginning?')) return;
    const freshDate = todayISO();
    setDailyRows([]);
    setDailyExpenses([]);
    setExpenseError('');
    setSavedReceipt(null);
    setSavedAppointment(null);
    setClients([]);
    saveJSON(STORAGE.clients, []);
    setClientForm({ name: '', phone: '' });
    setClientError('');
    setMemberships([]);
    setMembershipForm({ name: '', phone: '', amount: '15000', sessions: '8', paymentMode: 'Cash', startDate: '2026-09-24', notes: '' });
    setMembershipError('');
    setBusinessDate(freshDate);
    setClosedDates([]);
    setReceiptEntries([]);
    setDeletionLogs([]);
    setServices(defaultServices);
    setStaffList(defaultStaff);
    setAppointmentError('');
    setReceiptError('');
    setSearch('');
    setPaymentMethod('GPay / UPI');
    setPage(userRole === 'Frontdesk' ? 'Appointments' : 'Dashboard');
    const freshApts = getInitialAppointments(freshDate);
    setAppointmentsList(freshApts);
    saveJSON(STORAGE.businessDate, freshDate);
    saveJSON(STORAGE.closedDates, []);
    saveJSON(STORAGE.receiptEntries, []);
    saveJSON(STORAGE.deletionLogs, []);
    saveJSON(STORAGE.appointments, freshApts);
    saveJSON(STORAGE.services, defaultServices);
    saveJSON(STORAGE.staff, defaultStaff);
    setSelectedAppointmentDate(freshDate);
    setReceipt({ client: '', phone: '', date: freshDate, discount: '0', tax: '5', memberFee: '0', towelKit: '0', notes: '' });
    setReceiptItems([{ id: 1, service: 'Swedish Massage', staff: 'Meena', quantity: 1, price: 2000 }]);
    setNextReceiptNumber(1);
    window.localStorage.setItem('salon-next-receipt-number-v2', '1');
    setDailyFrom('2026-09-01');
    setDailyTo('2026-09-30');
    showNotice('All data cleared. Starting fresh.');
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
    setReceipt((current) => ({ ...current, date: businessDate }));
    setAppointment((current) => ({ ...current, date: businessDate }));
    setSelectedAppointmentDate(businessDate);
    setPage(account.role === 'Frontdesk' ? 'Appointments' : 'Dashboard');
  };

  const dayIsClosed = closedDates.includes(businessDate);
  const todayReceipts = receiptEntries.filter((entry) => entry.date === businessDate);
  const todayReceiptTotal = todayReceipts.reduce((total, entry) => total + entry.total, 0);
  const todayExpenses = dailyExpenses.filter((item) => item.date === businessDate);
  const todayExpenseTotal = todayExpenses.reduce((total, item) => total + item.amount, 0);
  const visibleNav = userRole === 'Frontdesk' ? frontdeskNavItems : navItems;

  if (!userRole) return <main className="login-shell"><section className="login-card"><div className="login-brand"><span className="brand-mark">B</span><div><strong>Bizora</strong><span>Business manager</span></div></div><div className="login-heading"><p className="panel-kicker">Sign in</p><h1>Welcome back</h1><p>Enter your email and password to continue.</p></div><form className="login-form" onSubmit={handleLogin}><label>Email address<input type="email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} placeholder="you@bizora.com" autoComplete="username" required /></label><label>Password<input type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} placeholder="Enter password" autoComplete="current-password" required /></label>{loginError && <div className="form-error" role="alert">{loginError}</div>}<button className="primary-button login-button" type="submit">Sign in<span>→</span></button></form></section></main>;

  const metricData = [
    ["Today's Appointments", '0', 'No appointments', 'violet'],
    ["Today's Revenue", '₹0', 'No revenue', 'ink'],
    ['Monthly Revenue', '₹0', 'No revenue', 'gold'],
    ["Today's Expenses", money(allExpenseTotal), allExpenseTotal ? 'Live records' : 'No expenses', 'rose']
  ];

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="brand-wrap"><div className="brand-mark">B</div><div className="brand-copy"><div className="brand-title">Bizora</div><div className="brand-subtitle">Business manager</div></div><button type="button" className="sidebar-toggle" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}>{sidebarCollapsed ? '›' : '‹'}</button></div>
      <nav className="nav" aria-label="Primary navigation">{visibleNav.map(([label, icon]) => { const route = routeFor(label); return <button key={label} className={`nav-item ${page === route ? 'active' : ''}`} onClick={() => setPage(route)}><span>{icon}</span>{label}</button>; })}</nav>
      <div className="sidebar-footer">{userRole === 'Frontdesk' ? <><span>Working date</span><strong>{formatDisplayDate(businessDate)}</strong><button type="button" className="close-day-button" onClick={closeBusinessDay} disabled={dayIsClosed}>Close day</button></> : <><span className="status-dot" /> Open today <strong>9:00 - 20:00</strong></>}<button type="button" className="clear-data-button" onClick={resetTestData}>Clear all data</button></div>
    </aside>

    <main className="main-panel">
      <header className="topbar"><div>{page !== 'Expenditure' && page !== 'Receipts' && page !== 'Clients' && page !== 'Staff' && page !== 'Services' && page !== 'Daily Receipts' && <h1>{page === 'Dashboard' ? formatDisplayDate(businessDate) : page === 'Appointments' ? 'Appointment Dashboard' : page}</h1>}</div><div className="topbar-actions"><button className="icon-button" aria-label="Notifications">♧<span className="notification-dot" /></button><div className="user-pill"><span className="avatar">{userRole[0]}</span><span>{userRole}</span><b>⌄</b></div></div></header>
      {page === 'Dashboard' && userRole !== 'Frontdesk' ? <>
        <section className="quick-actions">{['+ New Appointment', '+ Daily Report', '+ Add Expense', 'View Monthly Report'].map((action) => <button key={action} className="action-button" onClick={() => action === '+ Daily Report' ? setPage('Receipts') : action === '+ New Appointment' ? openNewAppointment() : action === '+ Add Expense' ? setPage('Expenditure') : action === 'View Monthly Report' ? setPage('Daily Receipts') : showNotice(`${action.replace('+ ', '')} opened`)}>{action}</button>)}</section>
        <section className="toolbar"><div className="filter-bar">{['Today', 'This Week', 'This Month', 'Custom'].map((item) => <button key={item} className={`chip ${range === item ? 'active' : ''}`} onClick={() => setRange(item)}>{item}</button>)}</div><div className="date-range"><label>From <input type="date" defaultValue="2026-09-01" /></label><span>to</span><label>To <input type="date" defaultValue="2026-09-30" /></label></div></section>
        <section className="metrics-grid">{metricData.map(([title, value, details, tone]) => <article className={`metric-card ${tone}`} key={title}><div className="metric-icon">✦</div><div className="metric-title">{title}</div><div className="metric-value">{value}</div><div className="metric-details">{details}</div><div className="metric-trend">↗ 12.8%</div></article>)}</section>
        <section className="chart-grid"><article className="panel chart-panel"><div className="panel-header"><div><p className="panel-kicker">Performance</p><h2>Revenue overview</h2></div><button className="secondary-button small">Monthly ⌄</button></div><div className="chart-legend"><span><i className="legend-swatch violet" /> Revenue</span><span><i className="legend-swatch ink" /> Expenditure</span></div><div className="bar-chart">{chartBars.map((height, index) => <div className="bar-column" key={index}><div className="bar-pair"><div className="bar violet-bar" style={{ height: `${height}%` }} /><div className="bar ink-bar" style={{ height: `${height * 0.62}%` }} /></div><span>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}</span></div>)}</div></article><article className="panel expense-panel"><div className="panel-header"><div><p className="panel-kicker">Monthly split</p><h2>Expense breakdown</h2></div><button className="more-button">•••</button></div><div className="donut"><div><strong>{money(allExpenseTotal)}</strong><span>Total spent</span></div></div><div className="legend-list">{expenseBreakdown.map(([name, value, tone]) => <div className="legend-item" key={name}><span><i className={`legend-swatch ${tone}`} />{name}</span><strong>{value}</strong></div>)}</div></article></section>
        <section className="bottom-grid"><article className="panel"><div className="panel-header"><div><p className="panel-kicker">Transactions</p><h2>Recent payments</h2></div><button className="secondary-button small">This month ⌄</button></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Receipt</th><th>Client</th><th>Service</th><th>Amount</th><th>Method</th></tr></thead><tbody>{paymentRows.map((row) => <tr key={row[1]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div></article><article className="panel"><div className="panel-header"><div><p className="panel-kicker">Live records</p><h2>Daily expenditure</h2></div><button className="more-button" onClick={() => setPage('Expenditure')}>•••</button></div><div className="expense-list">{recentExpenses.map((item) => <div className="expense-item" key={item.id}><span>{item.narration}<small>{item.date} · {item.source}</small></span><strong>{money(item.amount)}</strong></div>)}{recentExpenses.length === 0 && <div className="empty-state">No expenses recorded yet.</div>}</div><div className="total-box"><span>Total expense</span><strong>{money(allExpenseTotal)}</strong></div></article></section>
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
          <aside className="receipt-preview expenditure-preview"><div className="preview-top"><span className="preview-logo">B</span><div><strong>Bizora</strong><span>Manager</span></div><span className="preview-label">{dayIsClosed ? 'CLOSED' : 'OPEN'}</span></div><div className="preview-divider" /><div className="preview-heading"><div><p className="panel-kicker">Today</p><h3>{money(todayExpenseTotal)}</h3></div><span>{todayExpenses.length} {todayExpenses.length === 1 ? 'entry' : 'entries'}</span></div><div className="preview-client"><span>Current entry</span><strong>{expenseForm.narration || 'Expense description'}</strong><small>{businessDate} · {expenseForm.source}</small></div><div className="preview-totals"><div><span>Current amount</span><strong>{money(Number(expenseForm.amount) || 0)}</strong></div><div className="preview-total"><span>Today's total</span><strong>{money(todayExpenseTotal)}</strong></div></div><p className="preview-thanks">Outgoing payments, accounted for.</p></aside>
        </form>
        <section className="panel receipt-grid-panel"><div className="panel-header"><div><p className="panel-kicker">Entered today</p><h2>Payment grid</h2></div><span className="form-status">{money(todayExpenseTotal)}</span></div>
          {todayExpenses.length ? <div className="excel-scroll"><table className="excel-table expense-excel-table"><thead><tr><th style={{ width: '8%', textAlign: 'center' }}>#</th><th>Description</th><th>Mode</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead><tbody>{todayExpenses.slice().reverse().map((item, index) => <tr key={item.id} className="excel-row"><td className="excel-row-num">{index + 1}</td><td>{item.narration}</td><td>{item.source}</td><td style={{ textAlign: 'right' }}><strong>{money(item.amount)}</strong></td></tr>)}</tbody></table></div> : <div className="empty-state">No payments for this date yet.</div>}
        </section>
      </section> : page === 'Memberships' ? <section className="memberships-page">
        <div className="receipt-page-header"><div><p className="panel-kicker">Client plans</p><h2>Memberships</h2><p className="page-intro">Track membership payments and sessions.</p></div><span className="form-status">{memberships.length} {memberships.length === 1 ? 'membership' : 'memberships'}</span></div>
        <div className="membership-layout"><section className="panel receipt-section"><div className="panel-header"><div><p className="panel-kicker">New membership</p><h2>Plan details</h2></div><span className="form-status">Required</span></div><form className="membership-form" onSubmit={saveMembership}><div className="form-grid"><label>Client name<input value={membershipForm.name} onChange={(event) => setMembershipForm({ ...membershipForm, name: event.target.value })} placeholder="e.g. Priya Sharma" required /></label><label>Phone number<input value={membershipForm.phone} onChange={(event) => setMembershipForm({ ...membershipForm, phone: sanitizePhone(event.target.value) })} placeholder="9876543210" inputMode="numeric" maxLength={10} required /></label><label>Branch<input value={membershipForm.branch} onChange={(event) => setMembershipForm({ ...membershipForm, branch: event.target.value })} placeholder="e.g. Main Branch" required /></label><label>Package<input value={membershipForm.packageName} onChange={(event) => setMembershipForm({ ...membershipForm, packageName: event.target.value })} placeholder="e.g. 8 Session Massage Pack" /></label><label>Validity<select value={membershipForm.duration} onChange={(event) => setMembershipForm({ ...membershipForm, duration: event.target.value })}>{membershipDurations.map((duration) => <option key={duration}>{duration}</option>)}</select></label><label>Membership amount (₹)<input type="number" min="1" value={membershipForm.amount} onChange={(event) => setMembershipForm({ ...membershipForm, amount: event.target.value })} required /></label><label>Total sessions<input type="number" min="1" value={membershipForm.sessions} onChange={(event) => setMembershipForm({ ...membershipForm, sessions: event.target.value })} required /></label><label>Payment mode<select value={membershipForm.paymentMode} onChange={(event) => setMembershipForm({ ...membershipForm, paymentMode: event.target.value })}><option>Cash</option><option>Card</option><option>GPay / UPI</option><option>Other</option></select></label><label>Start date<input type="date" value={membershipForm.startDate} onChange={(event) => setMembershipForm({ ...membershipForm, startDate: event.target.value })} required /></label><label className="notes-field">Notes<input value={membershipForm.notes} onChange={(event) => setMembershipForm({ ...membershipForm, notes: event.target.value })} placeholder="Optional plan note" /></label></div>{membershipError && <div className="form-error" role="alert">{membershipError}</div>}<button className="primary-button save-receipt-button" type="submit">Add membership <span>→</span></button></form></section>
        <section className="panel membership-list"><div className="panel-header"><div><p className="panel-kicker">Directory sheet</p><h2>Membership clients</h2></div><div className="clients-page-actions"><input className="membership-search" value={membershipSearch} onChange={(event) => setMembershipSearch(event.target.value)} placeholder="Search by name, phone or member ID" /><button type="button" className="secondary-button small" onClick={exportMembershipsToExcel} disabled={!filteredMemberships.length}>Export to Excel</button></div></div>
          {filteredMemberships.length ? <div className="excel-scroll"><table className="excel-table membership-excel-table"><thead><tr><th style={{ width: '36px', textAlign: 'center' }}>#</th><th>Member ID</th><th>Client Name</th><th>Phone Number</th><th>Branch</th><th>Validity</th><th>Package</th><th>Used Sessions</th><th>Remaining Sessions</th><th>Status</th><th style={{ width: '150px', textAlign: 'center' }}>Actions</th></tr></thead><tbody>{filteredMemberships.map((membership, index) => { const remaining = membership.sessions - membership.usedSessions; const complete = remaining <= 0; return <tr key={membership.id} className="excel-row"><td className="excel-row-num">{index + 1}</td><td><strong>{membership.memberId}</strong></td><td>{membership.name}</td><td><a href={`tel:${membership.phone}`} className="phone" style={{ textDecoration: 'none' }}>📞 {membership.phone}</a></td><td>{membership.branch}</td><td>{membership.duration}</td><td>{membership.packageName || '—'}</td><td>{membership.usedSessions}</td><td>{remaining}</td><td><span className={`membership-status ${complete ? 'complete' : ''}`}>{complete ? 'Completed' : 'Active'}</span></td><td className="excel-actions-cell"><button type="button" className="secondary-button small" disabled={complete} onClick={() => completeMembershipSession(membership.id)}>Use session</button></td></tr>; })}</tbody></table></div> : <div className="empty-state">No memberships yet.</div>}
        </section></div>
      </section> : page === 'Clients' ? <section className="clients-page">
        <div className="receipt-page-header clients-page-header"><div><p className="panel-kicker">People</p><h2>Clients</h2><p className="page-intro">Browse saved client contacts.</p></div><div className="clients-page-actions"><span className="form-status">{clients.length} {clients.length === 1 ? 'client' : 'clients'}</span><button type="button" className="primary-button" onClick={() => { setClientError(''); setShowClientForm((visible) => !visible); }}>{showClientForm ? 'Close form' : '+ Add client'}</button></div></div>
        {showClientForm && <section className="panel client-entry-panel"><div className="panel-header"><div><p className="panel-kicker">New client</p><h2>Client details</h2></div><span className="form-status">Required</span></div><form className="client-form" onSubmit={saveClient}><label>Client name<input autoFocus value={clientForm.name} onChange={(event) => setClientForm({ ...clientForm, name: event.target.value })} placeholder="e.g. Priya Sharma" required /></label><label>Phone number<input value={clientForm.phone} onChange={(event) => setClientForm({ ...clientForm, phone: sanitizePhone(event.target.value) })} placeholder="9876543210" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" required /></label>{clientError && <div className="form-error" role="alert">{clientError}</div>}<button className="primary-button" type="submit">Add client <span>→</span></button></form></section>}
        <section className="directory-sheet-panel"><div className="panel-header"><div><p className="panel-kicker">Directory sheet</p><h2>Saved clients</h2></div></div>{clients.length ? <div className="directory-sheet-scroll"><table className="directory-sheet"><thead><tr><th>#</th><th>Client Name</th><th>Phone Number</th></tr></thead><tbody>{clients.map((client, index) => <tr key={client.id}><td>{index + 1}</td><td><strong>{client.name}</strong></td><td>{client.phone}</td></tr>)}</tbody></table></div> : <div className="empty-state">No clients yet.</div>}</section>
      </section> : page === 'Services' ? <section className="services-page">
        <div className="receipt-page-header clients-page-header"><div><p className="panel-kicker">Catalog</p><h2>Services</h2><p className="page-intro">Browse salon services, pricing, duration, and assigned staff.</p></div><div className="clients-page-actions"><span className="form-status">{services.length} services</span><button type="button" className="primary-button" onClick={() => setShowServiceForm((visible) => !visible)}>{showServiceForm ? 'Close form' : '+ Add service'}</button></div></div>
        {showServiceForm && <section className="panel client-entry-panel"><div className="panel-header"><div><p className="panel-kicker">New service</p><h2>Service details</h2></div><span className="form-status">Required</span></div><form className="client-form" onSubmit={saveService}><label>Service name<input autoFocus value={serviceForm.name} onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} placeholder="e.g. Deep Tissue Massage" required /></label><label>Price (₹)<input type="number" min="0" value={serviceForm.price} onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })} placeholder="2000" required /></label><button className="primary-button" type="submit">Add service <span>→</span></button></form></section>}
        <section className="directory-sheet-panel"><div className="panel-header"><div><p className="panel-kicker">Directory sheet</p><h2>Saved services</h2></div></div>{services.length ? <div className="directory-sheet-scroll"><table className="directory-sheet"><thead><tr><th>#</th><th>Service Name</th><th>Price</th><th>Actions</th></tr></thead><tbody>{services.map((service, index) => <tr key={service.id}><td>{index + 1}</td><td><strong>{service.name}</strong></td><td><input className="directory-sheet-input" type="number" min="0" value={service.price} onChange={(event) => updateServicePrice(service.id, event.target.value)} aria-label={`Price for ${service.name}`} /></td><td><button type="button" className="secondary-button small" onClick={() => deleteService(service.id)}>Remove</button></td></tr>)}</tbody></table></div> : <div className="empty-state">No services yet.</div>}</section>
      </section> : page === 'Staff' ? <section className="staff-page">
        <div className="receipt-page-header clients-page-header"><div><p className="panel-kicker">Team</p><h2>Staff</h2><p className="page-intro">Browse staff names, roles, and phone numbers.</p></div><div className="clients-page-actions"><span className="form-status">{staffList.length} staff</span><button type="button" className="primary-button" onClick={() => setShowStaffForm((visible) => !visible)}>{showStaffForm ? 'Close form' : '+ Add staff'}</button></div></div>
        {showStaffForm && <section className="panel client-entry-panel"><div className="panel-header"><div><p className="panel-kicker">New staff</p><h2>Staff details</h2></div><span className="form-status">Required</span></div><form className="client-form" onSubmit={saveStaffMember}><label>Staff name<input autoFocus value={staffForm.name} onChange={(event) => setStaffForm({ ...staffForm, name: event.target.value })} placeholder="e.g. Meena" required /></label><label>Phone number<input value={staffForm.phone} onChange={(event) => setStaffForm({ ...staffForm, phone: sanitizePhone(event.target.value) })} placeholder="9876543210" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" required /></label><label>Role<select value={staffForm.role} onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })}><option>Massage Therapist</option><option>Facial Therapist</option><option>Hair Specialist</option><option>Nail Technician</option><option>Receptionist</option></select></label><button className="primary-button" type="submit">Add staff <span>→</span></button></form></section>}
        <section className="directory-sheet-panel"><div className="panel-header"><div><p className="panel-kicker">Directory sheet</p><h2>Saved staff</h2></div></div>{staffList.length ? <div className="directory-sheet-scroll"><table className="directory-sheet"><thead><tr><th>#</th><th>Staff Name</th><th>Role</th><th>Phone Number</th><th>Actions</th></tr></thead><tbody>{staffList.map((member, index) => <tr key={member.id}><td>{index + 1}</td><td><strong>{member.name}</strong></td><td>{member.role}</td><td>{member.phone}</td><td><button type="button" className="secondary-button small" onClick={() => deleteStaffMember(member.id)}>Remove</button></td></tr>)}</tbody></table></div> : <div className="empty-state">No staff yet.</div>}</section>
      </section> : page === 'Daily Receipts' ? <section className="daily-receipts-page">
        <div className="receipt-page-header"><div><p className="panel-kicker">Reports</p><h2>Monthly Report</h2><p className="page-intro">Daily opening balance, receipts, payments, and closing balance.</p></div><div className="daily-header-actions"><button type="button" className="secondary-button" onClick={exportMonthlyReport}>Export XLSX</button><button className="primary-button" onClick={() => setPage('Expenditure')}>+ Add expense</button></div></div>
        <section className="daily-toolbar panel"><div><p className="panel-kicker">Report period</p><div className="daily-date-controls"><label>From<input type="date" value={dailyFrom} onChange={(event) => setDailyFrom(event.target.value)} /></label><span>to</span><label>To<input type="date" value={dailyTo} onChange={(event) => setDailyTo(event.target.value)} /></label></div></div><div className="daily-period-note"><strong>{monthlySnapshots.length} days</strong><span>Daily opening and closing balances for the selected period.</span></div></section>
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
          <aside className="receipt-preview appointment-preview"><div className="preview-top"><span className="preview-logo">S</span><div><strong>Salon &amp; Spa</strong><span>Manager</span></div><span className="preview-label">{savedAppointment ? 'BOOKED' : 'PREVIEW'}</span></div><div className="preview-divider" /><div className="preview-heading"><div><p className="panel-kicker">Appointment</p><h3>{savedAppointment?.id || 'APT-1048'}</h3></div><span>{appointment.date}</span></div><div className="preview-client"><span>Client</span><strong>{appointment.client || 'Client name'}</strong><small>{appointment.phone || 'Phone number'}</small></div><div className="appointment-summary-block"><div><span className="summary-icon">◷</span><div><small>Date &amp; time</small><strong>{appointment.date} at {formatTime12h(appointment.time)}</strong></div></div><div><span className="summary-icon">✦</span><div><small>Service</small><strong>{appointment.service} · {appointment.duration}</strong></div></div><div><span className="summary-icon">♙</span><div><small>Therapist</small><strong>{appointment.staff}</strong></div></div></div><p className="preview-thanks">A calm visit starts with a clear plan.</p>{savedAppointment && <button type="button" className="secondary-button print-button" onClick={() => window.print()}>Print appointment</button>}</aside>
        </div>
      </form> : page === 'Receipts' ? <section className="receipt-page">
        <div className="receipt-page-header"><div><p className="panel-kicker">Current day</p><h2>Daily receipts</h2><p className="page-intro">{formatDisplayDate(businessDate)}. Enter, save, and review in the grid. Wrong entry? Delete and re-enter. No edit after save.</p></div><div className="daily-header-actions"><span className="form-status">{dayIsClosed ? 'Closed' : 'Open'}</span><button type="button" className="primary-button" onClick={closeBusinessDay} disabled={dayIsClosed}>Close day</button></div></div>
        <form className="receipt-layout" onSubmit={saveReceipt}>
          <fieldset className="receipt-form-column unified-receipt-panel" disabled={dayIsClosed}>
            <section className="panel receipt-section"><div className="panel-header"><span className="form-status">{businessDate}</span></div><div className="form-grid"><label>Client name<input autoFocus value={receipt.client} onChange={(event) => updateReceipt('client', event.target.value)} placeholder="e.g. Ravi Kumar" /></label><label>Phone number<input value={receipt.phone} onChange={(event) => updateReceipt('phone', sanitizePhone(event.target.value))} placeholder="9876543210" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" /></label><label>Receipt date<input type="date" value={businessDate} readOnly /></label><label>Appointment reference<input placeholder="Optional" /></label></div></section>
            <section className="panel receipt-section"><div className="panel-header"><button type="button" className="secondary-button small" onClick={addReceiptItem}>+ Add service</button></div><div className="receipt-items">{receiptItems.map((item, index) => <div className="receipt-item-row" key={item.id}><span className="item-number">{String(index + 1).padStart(2, '0')}</span><label>Service<select value={item.service} onChange={(event) => { const selected = services.find((service) => service.name === event.target.value); updateReceiptItem(item.id, 'service', event.target.value); updateReceiptItem(item.id, 'staff', selected?.staff || item.staff || 'Meena'); updateReceiptItem(item.id, 'price', selected?.price || item.price); }}>{services.map((service) => <option key={service.id}>{service.name}</option>)}</select></label><label>Staff<select value={item.staff} onChange={(event) => updateReceiptItem(item.id, 'staff', event.target.value)}>{staffList.map((member) => <option key={member.id}>{member.name}</option>)}</select></label><label className="compact-field">Qty<input type="number" min="1" value={item.quantity} onChange={(event) => updateReceiptItem(item.id, 'quantity', event.target.value)} /></label><label className="price-field">Price<input type="number" min="0" value={item.price} onChange={(event) => updateReceiptItem(item.id, 'price', event.target.value)} /></label><button type="button" className="remove-item" aria-label={`Remove service ${index + 1}`} onClick={() => removeReceiptItem(item.id)}>×</button></div>)}</div></section>
            <section className="panel receipt-section"><div className="panel-header"><span className="form-status">{paymentMethod}</span></div><div className="payment-methods receipt-payment-methods">{['Cash', 'Card', 'GPay / UPI', 'Other'].map((method) => <button type="button" key={method} className={`method-pill ${paymentMethod === method ? 'selected' : ''}`} onClick={() => setPaymentMethod(method)}>{method}</button>)}</div><div className="form-grid adjustment-grid"><label>Discount (₹)<input type="number" min="0" value={receipt.discount} onChange={(event) => updateReceipt('discount', event.target.value)} /></label><label>Tax (%)<input type="number" min="0" max="100" value={receipt.tax} onChange={(event) => updateReceipt('tax', event.target.value)} /></label><label>Membership fee (₹)<input type="number" min="0" value={receipt.memberFee} onChange={(event) => updateReceipt('memberFee', event.target.value)} /></label><label>Towel kit cashout (₹)<input type="number" min="0" value={receipt.towelKit} onChange={(event) => updateReceipt('towelKit', event.target.value)} /></label><label className="notes-field">Notes<input value={receipt.notes} onChange={(event) => updateReceipt('notes', event.target.value)} placeholder="Optional note for the client" /></label></div><p className="receipt-accounting-note">Saved receipts appear in the grid for {formatDisplayDate(businessDate)}. There is no edit. Delete and re-enter if needed.</p></section>
            <section className="panel receipt-section"><div className="panel-header"><label className="membership-toggle"><input type="checkbox" checked={receiptMembership} onChange={(event) => setReceiptMembership(event.target.checked)} /> Add this client as a membership</label></div>{receiptMembership && <div className="form-grid"><label>Branch<input value={receiptMembershipForm.branch} onChange={(event) => setReceiptMembershipForm({ ...receiptMembershipForm, branch: event.target.value })} placeholder="e.g. Main Branch" /></label><label>Package<input value={receiptMembershipForm.packageName} onChange={(event) => setReceiptMembershipForm({ ...receiptMembershipForm, packageName: event.target.value })} placeholder="e.g. 8 Session Massage Pack" /></label><label>Validity<select value={receiptMembershipForm.duration} onChange={(event) => setReceiptMembershipForm({ ...receiptMembershipForm, duration: event.target.value })}>{membershipDurations.map((duration) => <option key={duration}>{duration}</option>)}</select></label><label>Total sessions<input type="number" min="1" value={receiptMembershipForm.sessions} onChange={(event) => setReceiptMembershipForm({ ...receiptMembershipForm, sessions: event.target.value })} /></label></div>}</section>
            {receiptError && <div className="form-error" role="alert">{receiptError}</div>}
            <button className="primary-button save-receipt-button" type="submit">Save receipt <span>→</span></button>
          </fieldset>
          <aside className="receipt-preview"><div className="preview-top"><span className="preview-logo">B</span><div><strong>Bizora</strong><span>Front desk</span></div><span className="preview-label">{dayIsClosed ? 'CLOSED' : 'OPEN'}</span></div><div className="preview-divider" /><div className="preview-heading"><div><p className="panel-kicker">Today</p><h3>{money(todayReceiptTotal)}</h3></div><span>{todayReceipts.length} {todayReceipts.length === 1 ? 'entry' : 'entries'}</span></div><div className="preview-client"><span>Working date</span><strong>{formatDisplayDate(businessDate)}</strong><small>Close the day after reconciling all entries.</small></div><div className="preview-totals"><div><span>Subtotal</span><strong>₹{receiptSubtotal.toLocaleString('en-IN')}</strong></div><div><span>Discount</span><strong>- ₹{receiptDiscount.toLocaleString('en-IN')}</strong></div><div><span>Tax ({receipt.tax}%)</span><strong>₹{receiptTax.toLocaleString('en-IN')}</strong></div><div className="preview-total"><span>This entry</span><strong>₹{receiptTotal.toLocaleString('en-IN')}</strong></div></div><div className="preview-payment"><span>Payment via</span><strong>{paymentMethod}</strong></div><p className="preview-thanks">Key in, save, then check the grid.</p></aside>
        </form>
        <section className="panel receipt-grid-panel"><div className="panel-header"><div><p className="panel-kicker">Entered today</p><h2>Receipts grid</h2></div><span className="form-status">{money(todayReceiptTotal)}</span></div>{todayReceipts.length ? <div className="table-wrap"><table><thead><tr><th>Receipt</th><th>Client</th><th>Services</th><th>Method</th><th>Amount</th><th>Entered by</th><th>Time</th><th /></tr></thead><tbody>{todayReceipts.slice().reverse().map((entry) => <tr key={entry.id}><td>{entry.number}</td><td>{entry.client}<small className="table-sub">{entry.phone || 'No phone'}</small></td><td>{entry.items.map((item) => item.service).join(', ')}</td><td>{entry.method}</td><td><strong>{money(entry.total)}</strong></td><td>{entry.createdBy}</td><td>{new Date(entry.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td><td>{dayIsClosed ? null : <button type="button" className="secondary-button small" onClick={() => deleteReceiptEntry(entry.id)}>Delete</button>}</td></tr>)}</tbody></table></div> : <div className="empty-state">No receipts for this date yet.</div>}</section>
        <section className="panel receipt-audit-panel"><div className="panel-header"><div><p className="panel-kicker">Audit</p><h2>Deleted receipts</h2></div><span className="form-status">{deletionLogs.length} logged</span></div>{deletionLogs.length ? <div className="audit-list">{deletionLogs.slice(0, 8).map((log) => <div className="audit-item" key={log.id}><span>{log.what}<small>Deleted by {log.who} · {new Date(log.when).toLocaleString('en-IN')}</small></span></div>)}</div> : <div className="empty-state">No deletions logged yet.</div>}</section>
      </section> : <section className="panel page-placeholder"><p className="panel-kicker">Coming soon</p><h2>{page}</h2><p>This module is not active yet.</p><button className="primary-button" onClick={() => setPage(userRole === 'Frontdesk' ? 'Appointments' : 'Dashboard')}>Back</button></section>}
      {notice && <div className="toast">{notice}</div>}
    </main>
  </div>;
}

export default App;
