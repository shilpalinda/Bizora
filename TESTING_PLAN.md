# Bizora — Testing Strategy & Test Plan

> Historical plan: this predates internal version `01.04.042`. Its client-only
> scope and several UI expectations no longer describe the current platform.
> Use the [master strategy](MASTER_TESTING_STRATEGY.md),
> [detailed plan](DETAILED_TESTING_PLAN.md) and
> [current case catalogue](COMPREHENSIVE_TEST_CASES.md) for new test runs.

## 1. Objective
Validate that every module of the Bizora spa/salon management app (src/App.jsx) works correctly for all user roles, handles valid (positive) and invalid (negative) input correctly, persists data reliably in `localStorage`, and enforces business rules (closed-day locking, GST rules, membership session limits, etc.).

## 2. Scope
In scope: Login/roles, Dashboard, Appointments, Daily Receipts (cash/card/GPay + GST), Expenditure, Memberships (packages, plans, redemption/visit receipt), Client Directory, Services catalog, Team/Staff + Attendance, Monthly Report, Targets & Settings (WhatsApp, backup/restore), EOD Reports, print outputs, responsive layout.
Out of scope: Server/API testing (app is fully client-side, data in browser `localStorage`), payment gateway integration (none exists), automated CI test suite (this is a manual/exploratory plan).

## 3. Test Strategy
| Aspect | Approach |
|---|---|
| Test type | Manual black-box + exploratory functional testing |
| Test levels | Feature-level (per module) → Integration (cross-module, e.g. receipt → dashboard → EOD) → End-to-end (login → close day → report) |
| Design technique | Equivalence partitioning, boundary value analysis, decision tables for business rules (e.g. GST by payment mode), state transition (appointment status, membership status, day open/closed) |
| Positive/negative coverage | Every input-bearing form gets ≥1 valid and ≥1–3 invalid/edge case |
| Roles under test | Frontdesk, Manager, Superuser (differ in nav items and Dashboard access) |
| Environments | Chrome/Edge desktop (primary), mobile width ≤760px, print preview (Ctrl+P) |
| Test data reset | Use a fresh browser profile or clear `localStorage` for a clean run; note: the in-app "Clear all data" button has been removed, so use DevTools → Application → Local Storage → clear, or the Settings → "Restore from file" with a blank backup |
| Entry criteria | Build passes (`npx vite build`), dev server runs, no console errors on load |
| Exit criteria | All Critical/High test cases pass; no data-loss or miscalculation defects open |
| Defect severity | Critical (data loss/wrong money figures), High (business rule broken), Medium (UX/validation gap), Low (cosmetic) |

## 4. Test Environment Setup
1. `cmd /c "npm install"` then `cmd /c "npm run dev"` (PowerShell blocks `.ps1` scripts on this machine — always wrap in `cmd /c`).
2. Open `http://localhost:5173/`.
3. Logins (password for all: `bizora`):
   - `frontdesk@bizora.com` → Frontdesk role
   - `manager@bizora.com` → Manager role
   - `superuser@bizora.com` → Superuser role
4. Clear `localStorage` between full test cycles to avoid stale state bleeding into results.

## 5. Master Test Case Suite

Legend: **P** = Positive, **N** = Negative/Edge.

### 5.1 Authentication (AUTH)
| ID | Type | Steps | Expected Result |
|---|---|---|---|
| AUTH-01 | P | Enter valid frontdesk email + `bizora`, submit | Redirects to Appointments page, Frontdesk nav shown |
| AUTH-02 | P | Login as manager@bizora.com | Redirects to Dashboard, full nav shown |
| AUTH-03 | P | Login as superuser@bizora.com | Redirects to Dashboard, full nav shown |
| AUTH-04 | N | Submit with empty email and password | Error: "Enter your email and password to continue." |
| AUTH-05 | N | Valid email, wrong password | Error: "Invalid email or password." |
| AUTH-06 | N | Unregistered email + any password | Error: "Invalid email or password." |
| AUTH-07 | N | Email with mixed case (`Manager@Bizora.com`) + correct password | Should still log in (email lowercased before lookup) |
| AUTH-08 | N | Rapid double-submit of the form | Only one login is processed, no duplicate state corruption |

### 5.2 Dashboard (DASH) — Manager/Superuser only
| ID | Type | Steps | Expected Result |
|---|---|---|---|
| DASH-01 | P | Login as manager, land on Dashboard | Shows date heading, quick actions, metric cards, chart/expense panels |
| DASH-02 | P | Click "+ New Appointment" quick action | Navigates to New Appointment form |
| DASH-03 | P | Click "+ Daily Report" | Navigates to Receipts (Daily Receipts entry) page |
| DASH-04 | P | Click "+ Add Expense" | Navigates to Expenditure page |
| DASH-05 | P | Click "View Monthly Report" | Navigates to Daily Receipts (Monthly Report) page |
| DASH-06 | N | Login as Frontdesk | Dashboard is not in nav; user lands on Appointments instead |

### 5.3 Appointments (APT)
| ID | Type | Steps | Expected Result |
|---|---|---|---|
| APT-01 | P | Book new appointment with valid name, 10-digit phone, service, staff, date = today, time | Appointment saved, appears in Excel-style grid, success notice shown |
| APT-02 | N | Submit booking with empty client name | Error: "Enter the client name before saving the appointment." |
| APT-03 | N | Submit with phone < 10 digits (e.g. `98765`) | Error: "Enter a valid 10-digit phone number." |
| APT-04 | N | Attempt new (non-edit) booking with date in the past | Error: "New appointments can only be booked for today or a future date." |
| APT-05 | P | Edit an existing appointment and change staff/service | Row updates in place, out-time recalculates from new duration |
| APT-06 | P | Change appointment status to Completed | Row turns green, `completed = true` |
| APT-07 | P | Mark appointment "Not Coming" | Row turns red; clicking again toggles back to default |
| APT-08 | P | Filter by status chip (Completed/Cancelled/All) | Grid filters correctly; counts in stat cards match filtered totals |
| APT-09 | P | Search by client name/phone/staff/service substring | Matching rows only are shown |
| APT-10 | N | Search with a query matching nothing | Empty-state message shown, no rows |
| APT-11 | P | Delete an appointment (confirm dialog accepted) | Row removed, notice shown |
| APT-12 | N | Delete an appointment then cancel the confirm dialog | Row remains unchanged |
| APT-13 | P | Print appointment sheet (🖨 Print Sheet) | Print view hides sidebar/topbar/actions, shows table only |
| APT-14 | N | Book appointment with duration change after setting a custom in-time | Out-time auto-recalculates based on new duration and existing in-time |

### 5.4 Daily Receipts / Payment entry (RCP)
| ID | Type | Steps | Expected Result |
|---|---|---|---|
| RCP-01 | P | Add a receipt with 1 service, Cash payment, tax=5 typed manually | Tax input is disabled and forced to 0; GST amount charged = ₹0; total = subtotal − discount |
| RCP-02 | P | Switch payment method from Cash to Card after entering tax % | Tax field re-enables, GST recalculates using entered % |
| RCP-03 | P | Add receipt with Card payment, 5% tax, ₹2000 subtotal | GST = ₹100, total = ₹2100, saved entry routes amount+GST into `card`/`cardGst` buckets |
| RCP-04 | P | Add receipt with GPay / UPI payment | Amount+GST routed into `gpay`/`gpayGst` buckets |
| RCP-05 | N | Submit receipt with empty client name | Error: "Enter the client name before saving the receipt." |
| RCP-06 | N | Remove all service line items down to zero / set price to 0 | Error: "Add at least one service with a valid amount." |
| RCP-07 | N | Try to save a receipt when the business day is closed | Error: "This day is closed. Open the next working date to enter receipts." |
| RCP-08 | P | Add multiple service line items and remove one | Row removed, subtotal recalculates; removing the last remaining row is blocked (always ≥1 row) |
| RCP-09 | P | Enter discount greater than subtotal | Discount is clamped to subtotal (never negative total) |
| RCP-10 | P | Save receipt, verify it appears in "Entered today" grid with correct receipt number (REC-00001, sequential) | Receipt number increments correctly across saves and reloads (persisted in localStorage) |
| RCP-11 | P | Delete a receipt entered on the current (open) business day | Entry removed, daily row totals decremented, deletion logged in Audit trail |
| RCP-12 | N | Attempt to delete a receipt from a closed/past day | Notice: "Closed or past days cannot be changed..."; entry remains |
| RCP-13 | P | Look up a membership by 10-digit mobile number with an active membership with sessions remaining | Membership card displays package, used/remaining sessions, expiry, status; "Use 1 session" button enabled |
| RCP-14 | N | Look up membership number with 0 remaining sessions | Card shows "Sessions exhausted — this membership cannot be redeemed."; no redeem button |
| RCP-15 | N | Look up membership that is Expired or Cancelled | Status label shows correctly; redeem blocked with explanatory note |
| RCP-16 | P | Redeem 1 session (choose service/staff, confirm) | Session used, remaining count decreases by 1, no charge applied, "Membership visit receipt" panel appears showing member name, package, ₹0 charge, session X of Y, remaining count, and "Existing member — no payment due" |
| RCP-17 | N | Look up a mobile number with no membership on record | "No membership found for this number." |
| RCP-18 | N | Enter fewer than 10 digits in membership lookup | No lookup triggered (results only shown at exactly 10 digits) |
| RCP-19 | N | Verify number inputs (Discount, Tax, Membership fee, Towel kit, Qty, Price) have no spin/step arrows | Spinner arrows are not visible in Chrome/Edge/Firefox |
| RCP-20 | P | Close business day with entries present | Day locks, EOD report generated, business date advances to next day, receipt/appointment/expense forms default to new date |

### 5.5 Expenditure (EXP)
| ID | Type | Steps | Expected Result |
|---|---|---|---|
| EXP-01 | P | Add expense with valid amount and description | Expense saved, appears in today's payment grid, total updates |
| EXP-02 | N | Submit with empty description | Error: "Enter a description and amount greater than zero." |
| EXP-03 | N | Submit with amount = 0 or negative | Same validation error, entry not saved |
| EXP-04 | N | Add expense while business day is closed | Error: "This day is closed. Open the next working date to enter expenses." |
| EXP-05 | P | Add expenses across multiple payment sources (Cash/Card/GPay) | Each entry tagged with correct source, shown in grid |

### 5.6 Memberships — Plans (MSHP)
| ID | Type | Steps | Expected Result |
|---|---|---|---|
| MSHP-01 | P | Verify page header no longer shows large "Memberships" title above "Client plans" | Only the small "Client plans" kicker + "Memberships" section heading remain (topbar h1 suppressed) |
| MSHP-02 | P | Verify metrics area shows a single compact line ("Total active memberships", "Membership revenue today") instead of 8 stat cards | Confirms card panels were replaced by a slim stats line, no extra vertical scrolling |
| MSHP-03 | P | Create membership with valid name, phone, package, payment mode, start date | Membership saved, receipt panel shows Member ID, package, sessions, amount, expiry |
| MSHP-04 | N | Submit with missing/invalid phone or no package selected | Error: "Enter client details and select a membership package." |
| MSHP-05 | P | Search directory by name/phone/member ID | Filtered results match query |
| MSHP-06 | P | Export memberships to Excel | .xlsx file downloads with correct columns/data |
| MSHP-07 | P | Membership nearing expiry / 0 sessions remaining | Status/Remaining columns reflect correct state (session-zero styling) |
| MSHP-08 | P | Use "Use session" action directly from directory grid (not lookup) | usedSessions increments, remaining decreases, button disables when exhausted |

### 5.7 Membership Packages — Settings (PKG)
| ID | Type | Steps | Expected Result |
|---|---|---|---|
| PKG-01 | P | Create a new package with valid name/sessions/price/validity | Package appears in Configured Packages table |
| PKG-02 | N | Submit with sessions/price/validity = 0 or name blank | Error: "Enter a package name, sessions, price and validity greater than zero." |
| PKG-03 | P | Edit an existing package | Form pre-fills, "Update package" saves changes, "Cancel edit" reverts form |
| PKG-04 | P | Click the Edit icon (✎) in Configured Packages | Opens package for editing (icon button works same as before, no text needed) |
| PKG-05 | P | Click the Deactivate icon (⏻) on an active package | Package marked Inactive, icon changes to Activate (✓), and it's excluded from new-membership package dropdown |
| PKG-06 | P | Click the Activate icon (✓) on an inactive package | Package reactivated, reappears in the package dropdown |
| PKG-07 | N | Verify Actions column no longer shows "Edit"/"Deactivate" text buttons | Only icon buttons are present, column is visibly narrower |

### 5.8 Team / Staff & Attendance (ATT)
| ID | Type | Steps | Expected Result |
|---|---|---|---|
| ATT-01 | P | Add new staff member with valid name/phone/role | Appears in Saved Staff directory |
| ATT-02 | N | Submit with invalid phone (not 10 digits) | Notice: "Enter staff name and a valid phone number."; not saved |
| ATT-03 | P | Remove a staff member | Row removed from directory |
| ATT-04 | P | Change Attendance date picker to a specific date, mark a staff member "Present" | Button highlights active/green, summary "Present" count increments |
| ATT-05 | P | Click "Present" again on the same staff member (toggle off) | Status cleared, moves back to "Not marked" summary bucket |
| ATT-06 | P | Mark different staff members Present/Half Day/Absent on the same date | Each row shows correct highlighted status; summary counts (Present/Half day/Absent/Not marked) equal staff count |
| ATT-07 | P | Change attendance date to a different day | Attendance grid reflects that date's marks independently (data keyed per date) |
| ATT-08 | P | Reload the page/app after marking attendance | Attendance persists (stored in `bizora-staff-attendance` in localStorage) |
| ATT-09 | N | Mark attendance with zero staff in the list | Table shows "No staff yet." empty state, summary counts show 0 |

### 5.9 Client Directory (CLI)
| ID | Type | Steps | Expected Result |
|---|---|---|---|
| CLI-01 | P | Add client with valid name + 10-digit phone | Appears in directory sheet |
| CLI-02 | N | Submit with invalid phone or blank name | Error: "Enter a name and valid phone number." |
| CLI-03 | N | Add a client with a phone number that already exists | Error: "This phone number is already saved." |
| CLI-04 | P | Save a receipt/appointment/membership with a new phone number | Client auto-added to directory without a duplicate if already present |

### 5.10 Services / Menu (SVC)
| ID | Type | Steps | Expected Result |
|---|---|---|---|
| SVC-01 | P | Add a new service with name + price | Appears in service list and in service dropdowns app-wide |
| SVC-02 | N | Submit with blank service name | Notice: "Enter a service name."; not saved |
| SVC-03 | P | Edit price inline in the services table | Price updates immediately and persists |
| SVC-04 | P | Delete a service | Removed from list; existing receipts/appointments referencing it remain unaffected historically |

### 5.11 Monthly Report (RPT)
| ID | Type | Steps | Expected Result |
|---|---|---|---|
| RPT-01 | P | Change From/To date range | Monthly statement table + totals recompute for the new range |
| RPT-02 | P | Export monthly report to Excel | .xlsx downloads with per-day rows + TOTAL row matching on-screen totals |
| RPT-03 | N | Set From date after To date | Table shows no rows / empty range gracefully (no crash) |

### 5.12 Targets & Settings (SET)
| ID | Type | Steps | Expected Result |
|---|---|---|---|
| SET-01 | P | Save a monthly target with valid amount | Appears in Saved Targets, reflected on Daily Receipts target strip |
| SET-02 | N | Submit with no month or amount ≤ 0 | Error: "Choose a month and enter a target amount greater than zero." |
| SET-03 | P | Remove a saved target (confirm dialog) | Target removed from table |
| SET-04 | P | Save one or more WhatsApp numbers (comma separated) | Saved, status badge shows "Configured" |
| SET-05 | N | Type invalid characters into WhatsApp number field | Non-numeric/non-comma characters are stripped automatically |
| SET-06 | P | Download backup (⬇ Download backup) | JSON file downloads containing all STORAGE keys |
| SET-07 | P | Restore from a valid backup JSON file | Data restored, success notice, page reloads with restored data |
| SET-08 | N | Restore from an invalid/corrupt JSON file | Error: "That file could not be read. Choose a valid Bizora backup JSON file." |
| SET-09 | P | Confirm the sidebar no longer has a "Clear all data" button | Button and its reset-all functionality have been fully removed from the UI |

### 5.13 EOD Reports & WhatsApp (EOD)
| ID | Type | Steps | Expected Result |
|---|---|---|---|
| EOD-01 | P | Close business day with receipts/expenses/membership visits recorded | EOD report generated and listed, values (cash/card/GPay/closing balance) match day's entries |
| EOD-02 | N | Attempt to close a day that is already closed | Notice: "This day is already closed." |
| EOD-03 | P | Send report via WhatsApp with a saved number | `wa.me` link opens per number, report marked as sent |
| EOD-04 | N | Attempt to send without a saved WhatsApp number | Notice to add a number first; redirected to Settings |
| EOD-05 | P | Verify WhatsApp/EOD message content | Message does **not** contain "Membership sessions used" or "Membership revenue collected today" lines; contains "Number of membership clients: X" |
| EOD-06 | P | Print an EOD report (🖨 Print) | Print view shows report table only |

### 5.14 Cross-cutting / Non-functional (NF)
| ID | Type | Steps | Expected Result |
|---|---|---|---|
| NF-01 | P | Resize browser to ≤760px width | Sidebar collapses to horizontal nav, grids stack to 1 column, no horizontal overflow breaking layout |
| NF-02 | P | Reload the app mid-session | All persisted state (receipts, appointments, memberships, attendance, targets, business date) restores from localStorage |
| NF-03 | N | Corrupt/clear a single localStorage key manually then reload | App falls back to sensible defaults without crashing (loadJSON try/catch) |
| NF-04 | P | Collapse/expand sidebar via toggle | Nav icons-only mode works, toggle state visually correct |
| NF-05 | P | Verify no visible up/down spinner arrows on any number input across the app (Receipts, Expenditure, Daily Ledger, Packages, Targets) | Consistent classic look, confirmed cross-browser |
| NF-06 | P | Full regression: login → book appointment → complete it → add receipt (cash) → add membership → redeem session → mark attendance → add expense → close day → view EOD → send WhatsApp | End-to-end flow completes without errors, all numbers reconcile (closing balance = opening + receipts − towel cash − expenses) |

## 6. Risk-Based Priorities
1. **Critical**: Money calculations (GST by payment mode, receipt totals, closing balance), day-closing lock, receipt number sequencing, data persistence/restore.
2. **High**: Membership session redemption (no double-charge, correct session decrement, receipt shown), attendance persistence per date, WhatsApp report content accuracy.
3. **Medium**: Form validations, search/filter correctness, Excel export column accuracy.
4. **Low**: Icon-button cosmetics, spinner-arrow removal, spacing/layout polish.

## 7. Defect Reporting Template
```
ID / Title:
Module:
Severity: Critical | High | Medium | Low
Steps to Reproduce:
Expected Result:
Actual Result:
Test Case Reference (e.g. RCP-01):
Screenshots/Notes:
```
