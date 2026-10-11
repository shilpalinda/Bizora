# Bizora master testing strategy

## 1. Baseline and document control

| Item | Value |
|---|---|
| Product | Bizora business workspace |
| Public version | `01.04` |
| Internal version | `01.04.042` |
| Source baseline | Commit `41b3a55`, branch `release/01.04.042` |
| Prepared | 2026-10-10 |
| Status | Proposed strategy; execution and business approval pending |
| Audience | Creator/product owner, test lead, developers, business operators |

This strategy is grounded in the current React application, its attendance,
privacy and historical-report components, and the Express/PostgreSQL API.
It is not a claim that the platform has passed testing.

Companion documents:

- [Detailed execution plan](DETAILED_TESTING_PLAN.md)
- [Positive and negative test case catalogue](COMPREHENSIVE_TEST_CASES.md)
- [Versioning protocol](VERSIONING.md)
- [Earlier test plan](TESTING_PLAN.md) and
  [earlier execution results](TEST_EXECUTION_RESULTS.md): historical only.

## 2. Objectives

1. Verify every reachable implemented module and cross-module workflow.
2. Independently reconcile money, GST, towel cash out, session counts and balances.
3. Verify valid, invalid, boundary, cancellation and repeated-action events.
4. Demonstrate persistence, recoverability and failure visibility without damaging
   real customer data.
5. Verify role-specific UI behavior separately from server access controls.
6. Verify privacy across screen, keyboard, print, download and shared tabs.
7. Produce auditable, version-specific evidence and a release recommendation.

## 3. Scope and implementation map

| Capability | Main implementation | Coverage |
|---|---|---|
| Login, role navigation, dashboard, clock, day lifecycle | `src/App.jsx` | AUTH, DASH, DAY |
| Booking, inline edits, time calculations, status/color, print | `src/App.jsx` | APT |
| Receipt creation/editing, GST, search/filter/sort, deletion/restoration, audit | `src/App.jsx` | RCP, REC |
| Expenses and daily ledger/summary | `src/App.jsx` | EXP, LED, RPT |
| Packages, memberships, sale receipts, redemption and renewal handoff | `src/App.jsx`, `src/membership-payment.js` | PKG, MEM, VIS |
| Clients, service menu and staff directory | `src/App.jsx` | CLI, SVC, STF |
| Attendance, hours, weekly off and admin overrides | `src/StaffAttendance.jsx` | ATT |
| Targets, JSON backup/restore, WhatsApp configuration | `src/App.jsx` | SET, BAK |
| Closeout and read-only historical report | `src/App.jsx`, `src/DayReport.jsx` | EOD, HIS |
| Privacy display and password verification | `src/PrivacyDisplay.jsx`, `server/privacy-auth.js`, `server/configure-privacy.js` | PRV, API |
| Local storage, bootstrap and PostgreSQL mirroring | `src/App.jsx`, `server/index.js`, `server/db.js`, `server/init-db.js`, `server/schema.sql` | DAT, API |
| XLSX files and print views | `src/App.jsx`, print styles | XLS, UX |
| Build/version metadata and complete workflows | Package manifests, lockfiles, application | REL, E2E |

The public navigation labels are not always the internal page names:

- Daily Receipts opens the receipt transaction workspace.
- Daily Payments (Exp) opens Expenditure.
- Membership Plan opens Memberships.
- Settings opens target/package/backup/history settings.
- Menu opens Services; Team opens Staff and Attendance.
- Daily Report opens current-day EOD Reports.
- Daily Summary opens the daily ledger/statement.
- Settings -> Day Report provides historical records for a specific date.

### Not claimed as implemented

Online payment settlement/refunds, WhatsApp delivery confirmation, payroll,
inventory, production-grade login identity management, transactional multi-device
conflict resolution and a selectable weekly/monthly attendance UI are not assumed
features. Weekly/monthly attendance helper code exists, but the active view is
daily. Do not invent controls or mark unavailable features as tested.

The legacy root `app.js` is tracked but is not the active React entry point.
Production validation follows `index.html` -> `src/main.jsx` -> `src/App.jsx`.
If the creator requires the legacy application to remain supported independently,
it needs a separately approved suite.

## 4. Risk-first approach

| Priority | Risk | Required test depth |
|---|---|---|
| P0 | Wrong collections, balances or GST; lost records; invalid session deductions | Independent numeric oracle, failure/recovery tests, cross-module reconciliation |
| P0 | Mutations after closeout; privacy exposure; incorrect restore | State-transition and role matrix, protected-output tests, backup round trip |
| P0 | Bootstrap overwrites or simultaneous writers losing work | Controlled latency, clean and populated DB, two isolated browsers |
| P1 | Wrong reports, audit, identifiers, attendance overrides or exports | Integration assertions plus actual file inspection |
| P1 | Incorrect role behavior, date rollover, client/package linkage | All three roles and date/identity boundaries |
| P2 | Filter/sort, layout, keyboard and empty states | Browser, viewport and accessibility matrix |

P0/P1/P2 describe execution priority, not defect severity.
All supported functional modules must be covered before release; risk weighting
does not justify omitting lower-priority cases.

## 5. Test levels and design techniques

| Level | Approach | Primary evidence |
|---|---|---|
| Static baseline | Inspect entry points, version metadata, manifests and build | Commit, build log, configuration fingerprint without secrets |
| Unit | Arithmetic, status precedence, time helpers, attendance resolver, password hashes | Named automated assertions and boundary values |
| Component | Forms, validation, dialogs, hidden/inert content and filter behavior | Before/after state and DOM/accessibility evidence |
| API | State CRUD shape, error status, privacy verification, DB bootstrap | Redacted HTTP requests/responses and DB readback |
| Integration | Receipt -> ledger -> reports; membership -> visit -> receipt; UI -> storage -> DB | Independent reconciliation across stores |
| End-to-end | Open day through closeout, reload, recovery and historical inspection | Case-linked workflow evidence |
| Non-functional | Compatibility, accessibility, performance, privacy, offline and concurrency | Measurements under recorded conditions |
| Business UAT | Operator performs realistic daily duties | Creator/operator sign-off |

Use equivalence partitions, boundary values, decision tables, state transitions,
pairwise configuration coverage and exploratory charters.
Do not treat a screenshot or a success toast as sufficient evidence of persistence,
a correct exported file or WhatsApp delivery.

## 6. Positive, negative and state coverage

Every writable form needs:

- Valid minimum and typical input.
- Empty/whitespace-only required input.
- Invalid format, negative/zero amount and applicable upper/lower boundaries.
- Cancel/Escape/backdrop behavior where offered.
- Double-submit or repeated action.
- Reload, backend unavailable and storage failure coverage.
- Role and closed-day restrictions where relevant.

Important transitions:

| Entity | Transitions to verify |
|---|---|
| Appointment | Booked/Confirmed -> Completed; undo; Not Coming/reset; time and service edits; deletion/cancel |
| Receipt | New -> edited -> soft-deleted -> restored -> permanently deleted by admin |
| Membership | Sold -> active -> last session -> exhausted; expiry/cancellation; renewal handoff |
| Session link | Paid -> Member; Member -> paid; Member A -> Member B; re-save same member |
| Package | Active -> edited -> inactive -> active; existing contracts unchanged |
| Day | Open -> manually closed -> midnight advance; stale day -> automatic close/advance |
| Attendance | Unmarked/scheduled off -> manual status -> edit -> delete -> scheduled fallback |
| Privacy | Visible -> hidden -> verification pending -> revealed; failure/re-hide while pending |
| Data | Local-only -> backend-connected -> bootstrap/reload; backup -> change -> restore |

## 7. Test oracles and unresolved requirements

Three expectation classes are used in the catalogue:

- **C (current contract):** behavior directly supported by the implementation.
  Passing it proves compatibility, not necessarily business acceptability.
- **A (acceptance requirement):** a safety/correctness requirement the product
  must meet. It may fail in the present implementation; never redefine a failure
  as a pass simply because the code behaves that way.
- **D (decision required):** business policy or supported limit must be approved.
  Record observed behavior, but keep acceptance BLOCKED until the creator decides.

Use independently computed expected values, not the application totals as the
oracle. Distinguish gross collection, base collection, GST and net-after-outflow.
Use integer paise for independent financial calculations and compare stored
numeric values as well as formatted output.

Decisions to resolve before financial/UAT sign-off:

1. Normal-receipt GST is rounded to whole rupees; membership GST is rounded to
   paise. Approve consistent rounding and display rules.
2. Daily Summary currently sums base collection without separate GST columns,
   whereas EOD includes GST. Approve labels/reconciliation or require a fix.
3. Define month-end membership expiry (for example, one month from 31 January),
   expiry-day inclusivity, future-start eligibility and backdated-day redemption.
4. Define whether duplicate names/phones, same-time staff appointments and
   multiple daily ledger rows are allowed.
5. Define service zero price, fractional sessions/months, negative achieved
   baseline, maximum money/text/file sizes and performance scale.
6. Confirm which role may close days, restore backups, change targets/packages
   and delete attendance. The current UI is not a complete production permission
   model.
7. Define whether closed-day attendance and permanent deletion of a closed-day
   soft-deleted receipt are allowed. Admin permanent deletion currently lacks a
   closed-date restriction.
8. Define safe synchronization, conflict and offline-retry policy; no transaction
   or conflict-resolution protocol is assumed.
9. Agree expected atomic restore and identifier-counter coverage.
10. Approve deployment protocol/ports, supported browsers, authentication and
    server-side authorization before calling the system production-ready.

Known test targets from source inspection, not newly executed defects:

- Browser login uses a fixed local account map; API state routes do not implement
  login authorization.
- State writes are best-effort background PUTs. A network failure is caught and
  HTTP failure responses are not checked by the state writer.
- Bootstrap is once per browser session, with no live multi-device state merge.
- JSON restore parses data but does not validate every dataset's schema.
- JSON backup enumerates `STORAGE`; the separate receipt-number counter is not
  included in that exported object.
- Appointment initialization repopulates sample appointments for an empty array.
- The direct membership redemption handler has no closed-date guard equivalent
  to the main receipt save handler.
- Existing tests cover password hash verification only; there is no evidence of
  comprehensive automated UI/API coverage.
- The current WhatsApp message includes a membership-sessions-used line, unlike
  the earlier plan's removal expectation. Confirm the intended message contract.

These warrant targeted acceptance tests, not unverified PASS/FAIL declarations.

## 8. Environments and data safety

Use an isolated browser profile and a dedicated PostgreSQL test database.
Never clear shared browser storage, change system time, run DB initialization
against production, send real messages or permanently delete customer records.

Environment lanes:

1. Local-only: API intentionally unavailable; synthetic browser state.
2. Connected: dedicated API on configured port, PostgreSQL test DB, disposable
   privacy hash configuration.
3. Fresh-device: independent browser/profile for bootstrap and concurrency.
4. Build preview: generated frontend assets, with explicitly configured API
   connectivity.
5. Compatibility: Chromium/Edge, Firefox and Safari/WebKit where supported;
   widths 360, 390, 768, 1024 and 1440 pixels; print/PDF.

Do not share passwords, local privacy hashes, real phone numbers or customer
records in evidence. Stop if a test points to a non-test database or real account.

## 9. Automation roadmap

Reuse `npm.cmd run build` and
`node --test .\server\privacy-auth.test.js` first.
The repository currently has no comprehensive UI automation script.

Recommended additions, after implementation approval:

1. Node tests for membership arithmetic and refactored pure business helpers.
2. Component tests for receipt/session transitions and attendance override rules.
3. API integration tests using a disposable database and isolated configuration.
4. Browser E2E tests for the P0 smoke suite, downloads, midnight clock control and
   multi-tab privacy.
5. CI build + unit/API + smoke gates, with sanitized reports and artifacts.

Do not install test frameworks, change application code or introduce CI merely
to write this plan. Manual cases remain executable independently of future
automation.

## 10. Metrics, gates and governance

Measure:

- Coverage by module, role, browser and positive/negative class.
- P0/P1 execution rate and pass rate.
- Blocked/not-run cases, with owner and reason.
- Open defects by severity; retest and regression results.
- Numeric reconciliation differences; lost/duplicated records; privacy exposures.
- File round-trip fidelity and measured performance.

Entry criteria: identified version, safe environment, reproducible fixtures,
build success, required backend/privacy lane available and approved oracles.

Release exit criteria:

- 100% of P0 and P1 cases executed and passing.
- All functional groups executed; at least 95% of P2 cases passing, with every
  remaining P2 item explicitly accepted by the creator.
- Zero open critical/high defects, financial mismatches, unintended data loss,
  session corruption or privacy exposures.
- Backup/restore, closed-day behavior and supported browser smoke verified.
- All D-class release-relevant decisions resolved; no critical BLOCKED case.
- Business UAT signed off and evidence linked to the exact source baseline.

Any threshold change requires explicit approval, not tester discretion.

| Responsibility | Accountable work |
|---|---|
| Creator/product owner | Business policies, scope, data permissions, UAT and risk acceptance |
| Test lead | Environment readiness, coverage, execution coordination and release report |
| Developer | Defect investigation/fixes, unit/integration support and regression impact |
| Business operator | Realistic workflows, receipts/reports and operational UAT |
| Environment owner | Disposable database, credentials, backups and isolation |

Testing can expose access-control problems, but this strategy is not a completed
security assessment or certification.
