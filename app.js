const dashboardMetrics = [
  { title: 'Today\'s Appointments', value: 18, accent: 'blue', details: 'Completed 10 • Upcoming 6 • Cancelled 2' },
  { title: 'Today\'s Revenue', value: '₹25,500', accent: 'green', details: 'Cash ₹10,000 • Card ₹8,500 • UPI ₹7,000' },
  { title: 'Monthly Revenue', value: '₹4,25,000', accent: 'orange', details: 'Target ₹5,00,000 • 85% achieved' },
  { title: 'Today\'s Expenses', value: '₹8,500', accent: 'red', details: 'Rent, supplies, electricity and staff' }
];

const appointments = [
  { client: 'Priya', phone: '9876543210', service: 'Facial', staff: 'Anu', duration: '60 min', time: '10:00 AM', status: 'Confirmed', className: 'blue', payment: 'Pending' },
  { client: 'Ravi Kumar', phone: '9876543211', service: 'Swedish Massage', staff: 'Meena', duration: '60 min', time: '11:00 AM', status: 'Completed', className: 'green', payment: 'Paid' },
  { client: 'Kumar', phone: '9876543212', service: 'Hair Cut', staff: 'Priya', duration: '45 min', time: '12:00 PM', status: 'Cancelled', className: 'red', payment: 'Refund' },
  { client: 'Shreya', phone: '9876543213', service: 'Manicure', staff: 'Kavya', duration: '30 min', time: '2:00 PM', status: 'Arrived', className: 'blue', payment: 'Pending' },
  { client: 'Nisha', phone: '9876543214', service: 'Hair Spa', staff: 'Anu', duration: '90 min', time: '9:30 AM', status: 'Upcoming', className: 'yellow', payment: 'Pending' },
  { client: 'Anand', phone: '9876543215', service: 'Balinese Massage', staff: 'Meena', duration: '120 min', time: '4:00 PM', status: 'No Show', className: 'gray', payment: 'Pending' }
];

const paymentRows = [
  { date: '22 Sep', receipt: 'REC-001', client: 'Ravi Kumar', service: 'Massage', amount: '₹2,000', payment: 'GPay / UPI' },
  { date: '22 Sep', receipt: 'REC-002', client: 'Priya', service: 'Facial', amount: '₹1,500', payment: 'Cash' },
  { date: '22 Sep', receipt: 'REC-003', client: 'Arun', service: 'Hair Spa', amount: '₹2,500', payment: 'Card' }
];

const expenseRows = [
  { name: 'Electricity', amount: '₹2,500' },
  { name: 'Cleaning', amount: '₹800' },
  { name: 'Products', amount: '₹3,000' },
  { name: 'Transport', amount: '₹500' }
];

const services = ['Hair Cut', 'Hair Colour', 'Hair Spa', 'Facial', 'Manicure', 'Pedicure', 'Makeup', 'Swedish Massage'];
const staffMembers = [
  { name: 'Anu', role: 'Hair Stylist', skills: ['Hair Cut', 'Hair Colour', 'Hair Spa'] },
  { name: 'Priya', role: 'Beautician', skills: ['Facial', 'Manicure', 'Pedicure'] },
  { name: 'Meena', role: 'Therapist', skills: ['Swedish Massage', 'Balinese Massage', 'Aroma Oil Massage'] },
  { name: 'Kavya', role: 'Therapist', skills: ['Body Massage', 'Steam', 'Thai Massage'] }
];

const clients = [
  { name: 'Ravi Kumar', phone: '9876543210', visits: 12, lastVisit: '22 September 2026' },
  { name: 'Priya', phone: '9876543211', visits: 8, lastVisit: '18 September 2026' },
  { name: 'Arun', phone: '9876543222', visits: 5, lastVisit: '16 September 2026' }
];

const reports = [
  { name: 'Appointment Report', value: '245 total appointments' },
  { name: 'Revenue Report', value: '₹4,25,000 monthly revenue' },
  { name: 'Expense Report', value: '₹1,85,000 monthly expenses' },
  { name: 'Financial Report', value: 'Net revenue: ₹2,40,000' }
];

const targetData = {
  month: 'September 2026',
  target: '₹5,00,000',
  current: '₹4,25,000',
  remaining: '₹75,000',
  achieved: 85
};

function renderDashboard() {
  const view = document.getElementById('dashboardView');
  view.innerHTML = `
    <section class="quick-actions">
      <button class="action-button">+ NEW APPOINTMENT</button>
      <button class="action-button">+ NEW RECEIPT</button>
      <button class="action-button">+ ADD EXPENSE</button>
      <button class="action-button">VIEW TODAY</button>
    </section>

    <div class="filter-bar">
      <button class="chip active">Today</button>
      <button class="chip">This Week</button>
      <button class="chip">This Month</button>
      <button class="chip">Custom</button>
    </div>

    <div class="date-range">
      <label>
        From
        <input type="date" value="2026-09-01" />
      </label>
      <label>
        To
        <input type="date" value="2026-09-30" />
      </label>
    </div>

    <section class="metrics-grid">
      ${dashboardMetrics.map(item => `
        <article class="metric-card ${item.accent}">
          <div class="metric-title">${item.title}</div>
          <div class="metric-value">${item.value}</div>
          <div class="metric-details">${item.details}</div>
        </article>
      `).join('')}
    </section>

    <div class="chart-grid">
      <div class="chart-card">
        <div class="panel-header">
          <h2>Revenue vs Expenditure</h2>
          <button class="secondary-button small">Monthly</button>
        </div>
        <div style="height: 220px;">
          <canvas id="revenueChart"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <div class="panel-header">
          <h2>Monthly Expense</h2>
          <button class="secondary-button small">Breakdown</button>
        </div>
        <div class="legend-list">
          <div class="legend-item"><div class="legend-left"><span class="color-dot"></span> Rent</div><strong>25%</strong></div>
          <div class="legend-item"><div class="legend-left"><span class="color-dot alt"></span> Salary</div><strong>40%</strong></div>
          <div class="legend-item"><div class="legend-left"><span class="color-dot soft"></span> Products</div><strong>15%</strong></div>
          <div class="legend-item"><div class="legend-left"><span class="color-dot"></span> Electricity</div><strong>10%</strong></div>
          <div class="legend-item"><div class="legend-left"><span class="color-dot alt"></span> Marketing</div><strong>5%</strong></div>
          <div class="legend-item"><div class="legend-left"><span class="color-dot soft"></span> Other</div><strong>5%</strong></div>
        </div>
      </div>
    </div>

    <section class="content-grid">
      <article class="panel">
        <div class="panel-header">
          <h2>Appointments</h2>
          <button class="primary-button small">+ New Appointment</button>
        </div>
        <div class="search-row">
          <input type="text" value="Search client, phone number or appointment" aria-label="Search appointments" />
        </div>
        <div class="appointment-list">
          ${appointments.map(item => `
            <div class="appointment-card ${item.className}">
              <div class="appointment-topline">
                <span class="status-badge">${item.status}</span>
                <span class="time">${item.time}</span>
              </div>
              <div class="client-name">${item.client}</div>
              <div class="service-meta">${item.service}</div>
              <div class="mini-row">
                <span>${item.duration}</span>
                <span>${item.staff}</span>
              </div>
              <div class="mini-row muted">
                <span>${item.phone}</span>
                <span>${item.payment}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h2>Receipt & Payments</h2>
          <button class="primary-button small">New Receipt</button>
        </div>
        <div class="receipt-summary">
          <div class="summary-row"><span>Client</span><strong>Ravi Kumar</strong></div>
          <div class="summary-row"><span>Phone</span><strong>9876543210</strong></div>
          <div class="summary-row"><span>Service</span><strong>Swedish Massage</strong></div>
          <div class="summary-row"><span>Amount</span><strong>₹2,000</strong></div>
          <div class="summary-row"><span>Payment</span><strong>GPay / UPI</strong></div>
        </div>
        <div class="payment-methods">
          <button class="method-pill">Cash</button>
          <button class="method-pill">Card</button>
          <button class="method-pill selected">GPay / UPI</button>
          <button class="method-pill">Other</button>
        </div>
        <button class="success-button">CONFIRM PAYMENT</button>
      </article>
    </section>

    <section class="bottom-grid">
      <article class="panel">
        <div class="panel-header">
          <h2>Payments</h2>
          <button class="secondary-button small">This Month</button>
        </div>
        <table>
          <thead>
            <tr><th>Date</th><th>Receipt</th><th>Client</th><th>Service</th><th>Amount</th><th>Payment</th></tr>
          </thead>
          <tbody>
            ${paymentRows.map(row => `
              <tr>
                <td>${row.date}</td>
                <td>${row.receipt}</td>
                <td>${row.client}</td>
                <td>${row.service}</td>
                <td>${row.amount}</td>
                <td>${row.payment}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h2>Daily Expenditure</h2>
          <button class="secondary-button small">+ Add Expense</button>
        </div>
        <div class="expense-list">
          ${expenseRows.map(expense => `
            <div class="expense-item"><span>${expense.name}</span><strong>${expense.amount}</strong></div>
          `).join('')}
        </div>
        <div class="total-box"><span>Total Expense</span><strong>₹6,800</strong></div>
      </article>
    </section>

    <section class="full-panel panel">
      <div class="panel-header"><h2>Service & Staff Overview</h2></div>
      <div class="service-grid">${services.map(service => `<div class="tag-box">${service}</div>`).join('')}</div>
      <div class="staff-list">
        ${staffMembers.map(member => `
          <div class="staff-card">
            <div class="staff-name">${member.name}</div>
            <div class="staff-role">${member.role}</div>
            <div class="skill-list">${member.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}</div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderAppointments() {
  const view = document.getElementById('appointmentsView');
  view.innerHTML = `
    <div class="section-card">
      <div class="section-head">
        <h3>Appointments</h3>
        <button class="primary-button small">+ New Appointment</button>
      </div>
      <div class="filter-bar">
        <button class="chip active">All</button>
        <button class="chip">Confirmed</button>
        <button class="chip">Completed</button>
        <button class="chip">Cancelled</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Client</th><th>Phone</th><th>Service</th><th>Staff</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>
            ${appointments.map(item => `
              <tr>
                <td>${item.client}</td>
                <td>${item.phone}</td>
                <td>${item.service}</td>
                <td>${item.staff}</td>
                <td>${item.time}</td>
                <td><span class="status-badge ${item.className}">${item.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderClients() {
  const view = document.getElementById('clientsView');
  view.innerHTML = `
    <div class="section-card">
      <div class="section-head">
        <h3>Clients</h3>
        <button class="primary-button small">+ Add Client</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Phone</th><th>Visits</th><th>Last Visit</th></tr></thead>
          <tbody>
            ${clients.map(client => `
              <tr>
                <td>${client.name}</td>
                <td>${client.phone}</td>
                <td>${client.visits}</td>
                <td>${client.lastVisit}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderServices() {
  const view = document.getElementById('servicesView');
  view.innerHTML = `
    <div class="section-card">
      <div class="section-head">
        <h3>Services / Therapies</h3>
        <button class="primary-button small">+ Add Service</button>
      </div>
      <div class="service-grid">${services.map(service => `<div class="tag-box">${service}</div>`).join('')}</div>
    </div>
  `;
}

function renderStaff() {
  const view = document.getElementById('staffView');
  view.innerHTML = `
    <div class="section-card">
      <div class="section-head">
        <h3>Staff</h3>
        <button class="primary-button small">+ Add Staff</button>
      </div>
      <div class="staff-list">
        ${staffMembers.map(member => `
          <div class="staff-card">
            <div class="staff-name">${member.name}</div>
            <div class="staff-role">${member.role}</div>
            <div class="skill-list">${member.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderReceipts() {
  const view = document.getElementById('receiptsView');
  view.innerHTML = `
    <div class="section-card">
      <div class="section-head">
        <h3>Receipts</h3>
        <button class="primary-button small">Create Receipt</button>
      </div>
      <div class="receipt-summary">
        <div class="summary-row"><span>Receipt Number</span><strong>REC-000125</strong></div>
        <div class="summary-row"><span>Client</span><strong>Ravi Kumar</strong></div>
        <div class="summary-row"><span>Service</span><strong>Swedish Massage</strong></div>
        <div class="summary-row"><span>Amount</span><strong>₹2,000</strong></div>
      </div>
    </div>
  `;
}

function renderPayments() {
  const view = document.getElementById('paymentsView');
  view.innerHTML = `
    <div class="section-card">
      <div class="section-head"><h3>Payments</h3><button class="secondary-button small">This Month</button></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Receipt</th><th>Client</th><th>Service</th><th>Amount</th><th>Payment</th></tr></thead>
          <tbody>
            ${paymentRows.map(row => `
              <tr><td>${row.date}</td><td>${row.receipt}</td><td>${row.client}</td><td>${row.service}</td><td>${row.amount}</td><td>${row.payment}</td></tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderCollection() {
  const view = document.getElementById('collectionView');
  view.innerHTML = `
    <div class="section-card">
      <div class="section-head"><h3>Daily Collection</h3></div>
      <div class="receipt-summary">
        <div class="summary-row"><span>Cash</span><strong>₹15,000</strong></div>
        <div class="summary-row"><span>Card</span><strong>₹10,000</strong></div>
        <div class="summary-row"><span>GPay / UPI</span><strong>₹12,500</strong></div>
        <div class="summary-row"><span>Total Collection</span><strong>₹37,500</strong></div>
      </div>
    </div>
  `;
}

function renderExpenses() {
  const view = document.getElementById('expensesView');
  view.innerHTML = `
    <div class="section-card">
      <div class="section-head"><h3>Expenditure</h3><button class="primary-button small">+ Add Expense</button></div>
      <div class="expense-list">
        ${expenseRows.map(expense => `<div class="expense-item"><span>${expense.name}</span><strong>${expense.amount}</strong></div>`).join('')}
      </div>
    </div>
  `;
}

function renderReports() {
  const view = document.getElementById('reportsView');
  view.innerHTML = `
    <div class="section-card">
      <div class="section-head"><h3>Reports</h3></div>
      <div class="expense-list">
        ${reports.map(report => `<div class="expense-item"><span>${report.name}</span><strong>${report.value}</strong></div>`).join('')}
      </div>
    </div>
  `;
}

function renderTargets() {
  const view = document.getElementById('targetsView');
  view.innerHTML = `
    <div class="section-card">
      <div class="section-head"><h3>Target Tracking</h3></div>
      <div class="receipt-summary">
        <div class="summary-row"><span>Month</span><strong>${targetData.month}</strong></div>
        <div class="summary-row"><span>Target</span><strong>${targetData.target}</strong></div>
        <div class="summary-row"><span>Current Revenue</span><strong>${targetData.current}</strong></div>
        <div class="summary-row"><span>Remaining</span><strong>${targetData.remaining}</strong></div>
        <div class="summary-row"><span>Achievement</span><strong>${targetData.achieved}%</strong></div>
      </div>
    </div>
  `;
}

function renderSettings() {
  const view = document.getElementById('settingsView');
  view.innerHTML = `
    <div class="section-card">
      <div class="section-head"><h3>Settings</h3></div>
      <div class="receipt-summary">
        <div class="summary-row"><span>Business Name</span><strong>Bizora</strong></div>
        <div class="summary-row"><span>Currency</span><strong>INR</strong></div>
        <div class="summary-row"><span>Payment Methods</span><strong>Cash, Card, GPay / UPI</strong></div>
        <div class="summary-row"><span>Role Access</span><strong>Front Desk, Admin, CEO</strong></div>
      </div>
    </div>
  `;
}

function showPage(pageName) {
  const pages = document.querySelectorAll('.page-view');
  pages.forEach(page => page.classList.remove('active'));
  const target = document.getElementById(`${pageName}View`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageName);
  });
}

function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    alert('Please enter your username and password.');
    return;
  }

  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  document.getElementById('userRoleTag').textContent = 'Admin';
  showPage('dashboard');
}

function logout() {
  document.getElementById('appScreen').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
}

function filterAppointments(status = 'All') {
  const rows = document.querySelectorAll('#appointmentsView tbody tr');
  rows.forEach(row => {
    const match = status === 'All' || row.dataset.status === status;
    row.style.display = match ? '' : 'none';
  });
}

function attachAppointmentFilters() {
  const chips = document.querySelectorAll('#appointmentsView .chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(item => item.classList.toggle('active', item === chip));
      const label = chip.textContent.trim();
      filterAppointments(label);
    });
  });
}

function initializeCharts() {
  const canvas = document.getElementById('revenueChart');
  if (!canvas || typeof Chart === 'undefined') return;

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Revenue',
          data: [68, 82, 74, 91, 96, 78],
          backgroundColor: '#a98cf7',
          borderRadius: 8
        },
        {
          label: 'Expenditure',
          data: [42, 52, 48, 58, 63, 51],
          backgroundColor: '#111111',
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

renderDashboard();
renderAppointments();
renderClients();
renderServices();
renderStaff();
renderReceipts();
renderPayments();
renderCollection();
renderExpenses();
renderReports();
renderTargets();
renderSettings();

const appRows = document.querySelectorAll('#appointmentsView tbody tr');
appRows.forEach(row => {
  const statusCell = row.querySelector('span');
  if (statusCell) {
    row.dataset.status = statusCell.textContent.trim();
  }
});

attachAppointmentFilters();
initializeCharts();

const loginBtn = document.getElementById('loginBtn');
if (loginBtn) loginBtn.addEventListener('click', login);

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', logout);

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => showPage(item.dataset.page));
});
