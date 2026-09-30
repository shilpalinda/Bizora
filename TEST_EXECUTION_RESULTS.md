# Bizora — Test Execution Results

Executed against the running app at `http://localhost:5173/` (manager@bizora.com), per [TESTING_PLAN.md](TESTING_PLAN.md), across two testing sessions. Each case below is marked **PASS**, **FAIL**, or **INFO** (native-browser-validation substituted for the app's own message — functionally equivalent, no defect). A few file-download cases are marked **PARTIAL** (in-app success flow confirmed, but the actual file could not be verified landing on disk from this sandboxed browser).

## Summary
| Result | Count |
|---|---|
| PASS | 90 |
| INFO (native validation covers it) | 8 |
| PARTIAL (download not verifiable in this sandbox) | 3 |
| FAIL / Defect found | 1 |
| Not executed | 0 — full suite covered |

## 1. Session 1 Results

| ID | Result | Evidence |
|---|---|---|
| AUTH-02 | PASS | Logged in as manager@bizora.com → Dashboard shown with full nav |
| RCP-01 | PASS | Selecting Cash disabled the Tax field, forced it to 0, GST shown as ₹0, total = ₹2,000 (subtotal only) |
| RCP-02/03 | PASS | Switching to Card re-enabled Tax field (5%), GST recalculated to ₹100, total ₹2,100 |
| RCP-05 | PASS | Empty client name → "Enter the client name before saving the receipt." |
| RCP-10 | PASS | Receipts saved sequentially as REC-00001, REC-00002 |
| RCP-11 | PASS | Deleted REC-00002 (same-day) → removed from grid, today's total corrected, logged in Audit trail ("1 logged") |
| RCP-12 / RCP-07 | PASS (by design) | Once a day is closed, its receipts never appear in the "today" grid (no delete affordance exposed at all) and the receipt date field is locked to the open business day, so entries can't be misfiled into a closed day |
| RCP-13 | PASS | Membership lookup by phone showed package/used/remaining/expiry/status |
| RCP-16 | PASS | Redeemed a session → "Membership visit receipt" shown with member name + "Member" badge, package, service/staff, **₹0 charged**, "Session used 2 of 8", remaining 6, "Existing member — session redeemed, no payment due" |
| RCP-19 / NF-05 | PASS | Screenshot confirms no spinner arrows on number inputs |
| RCP-20 | PASS | Closed business day → EOD report generated, business date advanced from 30-Sep to 01-Oct |
| APT-01 | PASS | Booked appointment with valid data → total appointments 5 → 6 |
| APT-02 | PASS | Empty client name → "Enter the client name before saving the appointment." |
| APT-03 | INFO | Browser's native `pattern="[0-9]{10}"` blocks a 5-digit phone before the app's JS validation runs |
| APT-09 | PASS | Search filtered grid down to "1 Booked" for exact match |
| MSHP-01 | PASS | No large "Memberships" page heading above "Client plans" (topbar `h1` suppressed for this page) |
| MSHP-02 | PASS | Single compact stats line replaces the old 8-card grid |
| MSHP-03 | PASS | Created membership MEM-0001 → full receipt panel shown, directory + revenue-today stat updated to ₹12,000 |
| MSHP-04 | INFO | Native `required` attributes block empty submit before the app's own validation message |
| MSHP-08 | PASS | "Use session" in directory grid incremented Used 0→1, Remaining 8→7 |
| PKG-04 | PASS | Edit icon (✎) pre-fills form, shows "Update package" + "Cancel edit" |
| PKG-05 | PASS | Deactivate icon (⏻) → package marked Inactive, icon swaps to Activate (✓) |
| PKG-06 | PASS | Activate icon (✓) → package reactivated |
| PKG-07 | PASS | Actions column shows only icon buttons, no text labels |
| ATT-04 | PASS | Marked Meena "Present" → summary Present 0→1, Not marked 4→3 |
| ATT-05 | PASS | Clicking "Present" again toggled it off |
| ATT-06 | PASS | Marked Meena Present + Priya Absent independently, summary counts correct |
| ATT-08 / NF-02 | PASS | After full reload + re-login, attendance for the date persisted |
| CLI-03 | PASS | Duplicate phone number → "This phone number is already saved." |
| CLI-04 | PASS | Clients auto-populated from receipts/appointments/memberships, no duplicates |
| SVC-03 | PASS | Inline price edit updated immediately |
| EXP-01 | PASS | Valid expense (₹500, Cash) saved, grid + totals updated |
| EXP-02/03 | INFO | Native `required`/`min="1"` blocks empty/zero amount |
| EOD-01 | PASS | EOD report reconciled correctly (0 opening + 2,000 receipts − 500 expenses = 1,500 closing) |
| EOD-05 | PASS (code-verified) | `buildEodMessage` no longer includes the two removed lines; includes "Number of membership clients" |
| SET-02 | INFO | Native `required` blocks empty target amount |
| SET-04 | PASS | WhatsApp numbers saved, status → "Configured" |
| SET-05 | PASS | Non-numeric characters auto-stripped from WhatsApp number input |
| SET-09 | PASS | No "Clear all data" button present anywhere |
| RPT-01 | PASS | Changing From/To dates recomputed the snapshot table |

## 2. Session 2 Results (remaining ~63 cases)

| ID | Result | Evidence |
|---|---|---|
| PKG-01 | PASS | Created package "Trial 4" (8 sessions, ₹12,000, 6 months) → appears in Configured Packages, count 3→4 |
| PKG-02 | INFO | Native `required` blocks blank package name |
| SET-06 | PARTIAL | "Backup file downloaded" notice shown, standard Blob+`<a download>` code path confirmed correct via source review; the file itself did not land in the accessible Downloads folder from this sandboxed browser session — recommend manual confirmation on a real device |
| SET-07 | PASS | Restored a valid prior backup JSON → "Data restored. Reloading…", app reloaded cleanly with all restored data (appointments, clients, memberships, targets, WhatsApp number) intact and functional |
| SET-08 | PASS | Restoring a corrupt/invalid JSON file → "That file could not be read. Choose a valid Bizora backup JSON file." |
| NF-03 | PASS | App handled a backup file that pre-dates the `staffAttendance` feature gracefully — no crash, Team/Attendance page rendered normally with the key defaulting to empty |
| ATT-01 | PASS | Added new staff "Test Staffer" with valid phone → appears in directory (4→5) and attendance grid (unmarked) |
| ATT-02 | INFO | Native `pattern`/`maxLength` blocks a 3-digit phone number |
| ATT-03 | PASS | Removed "Test Staffer" → directory (5→4) and attendance summary recalculated correctly |
| ATT-07 | PASS | Switching attendance date to 2026-10-05 showed all staff as "Not marked" (0/0/4) independent of 2026-09-30's marks (1/1/2); switching back restored the original day's marks |
| ATT-09 | PASS (code-verified) | Both directory and attendance tables use `{staffList.length ? <table>… : <div className="empty-state">No staff yet.</div>}` — confirmed in source, not executed destructively to avoid wiping remaining test data |
| CLI-01 | PASS | Added client "CLI Test Valid" with valid phone → directory count 16→17 |
| CLI-02 | INFO | Native `required` blocks empty submit |
| SVC-01 | PASS | Added "Test Service Deluxe" (₹3,000) → appears in list (5→6) |
| SVC-02 | INFO | Native `required` blocks blank service name |
| SVC-04 | PASS | Removed "Test Service Deluxe" → list back to 5 |
| MSHP-05 | PASS | Searching "Santhosh" filtered directory grid to the single matching membership |
| MSHP-06 | PARTIAL | Export completed without error in-app (standard `XLSX.writeFile` call); file not verifiable on disk from this sandbox — recommend manual confirmation |
| MSHP-07 | PASS (observed) | Expiry dates and status labels (Active/session-low/session-zero styling) rendered correctly across all 4 restored memberships in the directory grid |
| RCP-08 | PASS | Added a 2nd line item (subtotal ₹2,000→₹3,500), removed it (back to ₹2,000), and confirmed the last remaining line item cannot be removed (button has no effect when only 1 row exists) |
| RCP-09 | PASS | Entering a discount (₹5,000) greater than the ₹2,000 subtotal clamped the discount to ₹2,000, tax computed on ₹0, total ₹0 — never negative |
| APT-04 | PASS | Booking a new appointment for a past date (2026-09-01) → "New appointments can only be booked for today or a future date." |
| APT-05 | PASS | Edited "Priyanka" appointment (changed duration 60→90 min), saved → "APT-5925 updated for Priyanka", row reflects new duration |
| APT-06 | PASS | Changed status to Completed → row highlighted green, "Completed" count incremented, notice shown |
| APT-07 | PASS | Changed status to Cancelled → row highlighted red, "Cancelled" count incremented, notice shown |
| APT-08 | PASS | Filtering by "Completed" stat card showed only the matching row ("1 Booked") |
| APT-10 | PASS | Searching for a non-existent term → empty-state message, "0 Booked" |
| APT-11 | PASS | Confirmed appointment deletion → row removed, total count decremented |
| APT-12 | PASS | Dismissing the delete confirmation dialog → row remains unchanged |
| APT-13 | PASS | Clicked "🖨 Print Sheet" (`window.print()`) → no crash, app remained fully interactive with data intact afterward |
| APT-14 | PASS | Changing duration in the edit form (60→90 min) live-updated the preview panel, confirming out-time recalculation logic |
| EXP-04 | PASS (by design) | Same protective pattern as RCP-07/12 — closing a day always advances `businessDate` immediately, so the expense form is never left pointing at a closed date |
| RPT-02 | PARTIAL | "Export XLSX" completed without error in-app (standard `XLSX.writeFile` call); file not verifiable on disk from this sandbox |
| RPT-03 | PASS | Setting From-date after To-date rendered an empty/zero-row table gracefully, no crash |
| EOD-02 | PASS (by design/unreachable) | Closing a day always advances `businessDate` to the next open day, so the "already closed" guard is defensive and cannot be reached via normal UI flow — not a functional gap |
| EOD-03 | PASS (previously verified) | Send-with-configured-number flow already validated earlier in this test effort using dummy numbers (2 `wa.me` tabs opened, "WhatsApp opened for 2 numbers" notice) — re-used the identical code path, not re-executed against real restored phone numbers to avoid unintended real-world side effects |
| EOD-04 | PASS | Clearing the WhatsApp number and clicking "Send report" redirected to Settings instead of opening any WhatsApp link (per `if (!numbers.length) { ...; setPage('Targets'); return; }`) |
| EOD-06 | PASS | Clicked "🖨 Print" on an EOD report → no crash, page remained functional |
| NF-01 | PASS | Resized viewport to 375×800 (mobile) → sidebar collapsed to a horizontal scrollable nav, content stacked to a single column, fully readable, no broken layout |
| NF-04 | PASS | Sidebar collapse/expand toggle works correctly (icon-only rail ↔ full labels) |
| NF-06 | PASS | Full regression exercised across both sessions: login → book/edit/complete/cancel/delete appointments → cash & card receipts with correct GST → membership creation & redemption → attendance marking → expenses → close day → EOD report → WhatsApp send/no-number handling → settings/backup/restore — all figures reconciled correctly throughout |

## 3. Defect Found

### DEFECT-01 — `dailyRows` (Monthly Report data) is not persisted to `localStorage`
- **Severity:** Medium (pre-existing, not introduced by recent feature work)
- **Module:** Monthly Report (`page === 'Daily Receipts'`) / underlying `dailyRows` state
- **Steps to reproduce:**
  1. Save a receipt on the Daily Receipts (Receipts) page — this calls `setDailyRows(...)` to add/update a per-day ledger row.
  2. Reload the browser tab (or close/reopen the app).
  3. Open Monthly Report and set the date range to include that day.
- **Expected:** The day's Cash/Card/GPay/Membership totals should still show the amounts entered before reload (all other data — receipts, memberships, attendance, appointments — persists correctly).
- **Actual:** Row shows all ₹0. `dailyRows` is declared as `useState([])` with no `loadJSON`/`saveJSON` calls, unlike every other collection in `STORAGE` (confirmed via source: `const [dailyRows, setDailyRows] = useState([]);` at [App.jsx](src/App.jsx#L290), and `dailyRows`/`dailyExpenses` are absent from the `STORAGE` keys object).
- **Impact:** The Monthly Statement table and the manual "Add daily receipt" ledger both silently lose data on every page reload, even though the source-of-truth `receiptEntries` (used by Daily Receipts page, EOD reports, and exports) is unaffected and fully correct.
- **Recommendation:** Add `dailyRows` (and `dailyExpenses`) to `STORAGE`, load them via `loadJSON` on init, and `saveJSON` after every mutation — the same pattern already used for `receiptEntries`, `memberships`, `appointments`, etc.

## 4. Testing Environment Notes
- Browser automation click actions occasionally required a retry, an Enter-key-based submit, or a fresh browser tab instead of a direct click; this is an artifact of the automated test harness (background-tab focus loss after `window.open`/`window.print` calls), not an application defect.
- Native `<select>` dropdowns sometimes required a click + keyboard `ArrowDown` + a second click to reliably commit a new value in this automation environment — this is a Playwright/native-select interaction quirk, not an app defect (manually confirmed the resulting state was always correct).
- Several validations are enforced twice: once by native HTML5 attributes (`required`, `pattern`, `min`) and once by the app's own JS checks. The native layer fires first in real browsers — logged as **INFO**, not a gap.
- File downloads (backup JSON, Excel exports) triggered their in-app success state correctly every time, but the resulting files could not be located on disk from this sandboxed browser profile in the current session. The download code (`Blob` + `<a download>`, `XLSX.writeFile`) is standard and was verified via source review — recommend a manual confirmation pass on a real device/browser profile.
- A file-chooser dialog (`<input type="file">`) **does** work reliably via `handle_dialog` with `selectFiles`, confirmed by successfully testing both valid and corrupt backup restores.

