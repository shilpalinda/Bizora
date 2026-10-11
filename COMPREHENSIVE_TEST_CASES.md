# Bizora comprehensive test cases - 01.04.042

Baseline: `41b3a55`; prepared 2026-10-10.
**All cases start as NOT RUN.** This catalogue records planned checks, not passes.

Read the [strategy](MASTER_TESTING_STRATEGY.md) for C/A/D expectation classes
and the [execution plan](DETAILED_TESTING_PLAN.md) for fixtures F0-F9, oracles
O1-O4, safe environment setup and the execution record template.

## Execution conventions

- P = positive; N = negative; B = boundary; S = state/sequence; F = failure;
  each mixed label requires all listed variants.
- C = current implementation contract; A = acceptance requirement that may expose
  a defect; D = creator decision required before acceptance.
- Priority P0/P1/P2 is independent of defect severity.
- Default role: Manager; default setup: disposable connected environment, D open,
  F0-F4, privacy revealed. Override in the section/row when specified.
- Each row specifies its additional setup, action and observable expectation.
  Restore its fixture before the next independent case.
- For every successful mutation, inspect changed record counts and values, then
  reload/re-login to confirm persistence unless the case explicitly tests an
  in-memory interaction. Verify no unrelated records changed.
- For every rejected/cancelled mutation, verify records, counters, balances and
  session usage are unchanged.
- Run each parameterized value independently. Run role-specific cases as each
  named role. Missing controls are BLOCKED/NOT APPLICABLE with approval, not PASS.
- Use synthetic identity values only. Test files must actually be downloaded,
  opened and inspected; a toast alone does not satisfy file assertions.

## 1. Release and runtime baseline (REL)

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| REL-01 | P/C/P0 | On baseline, run `npm.cmd run build`. | Exit 0; usable generated assets; record any size warnings. |
| REL-02 | P/C/P1 | Inspect root/server manifests and lockfile root entries. | npm version `1.4.42`; stamp `01.04.042`; public `01.04`; both locks match their manifest version. |
| REL-03 | P/C/P1 | Start frontend on a known free test port; request `/` and open browser. | HTTP 200; Bizora sign-in; no fatal rendering error. |
| REL-04 | P/C/P1 | Run `node --test .\server\privacy-auth.test.js`. | Existing password-hash test passes; log retained; do not imply broader coverage. |
| REL-05 | F/A/P1 | Start connected lane with incompatible API port/protocol or API unavailable. | No success-shaped server verification; connectivity limitation observable; offline business-data behavior evaluated separately. |
| REL-06 | P/C/P1 | Run build preview; perform sign-in, create receipt and export with compatible API. | Built assets work, lazy ExcelJS loads, API routing and file generation operate outside dev server. |

## 2. Login and navigation (AUTH)

Setup: sign-out/fresh profile for each account. Password values come from approved
local baseline configuration, not from this test report.

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| AUTH-01 | P/C/P0 | Sign in as Frontdesk; inspect all navigation items. | Appointments landing; no Dashboard item; Frontdesk identity/role correct. |
| AUTH-02 | P/C/P0 | Independently sign in as Manager and Superuser. | Dashboard landing; expected full navigation; correct account label. |
| AUTH-03 | N/C/P1 | Submit empty email/password; then empty one field at a time. | Native/app validation blocks sign-in; no authenticated role. |
| AUTH-04 | N/C/P1 | Use unknown email; correct email/wrong password; differently cased password. | Invalid credentials rejected; no protected workspace entered. |
| AUTH-05 | B/C/P1 | Use mixed-case email with surrounding spaces and valid password. | Email trimmed/lowercased; correct role signs in once. |
| AUTH-06 | S/A/P1 | Double-click submit and press Enter repeatedly with valid credentials. | One effective login state; no duplicate hydration/reload loop or corruption. |
| AUTH-07 | S/C/P1 | Log in, enter records, reload and sign in again. | Sign-in required after reload; records remain; no wrong remembered role. |
| AUTH-08 | P/C/P1 | Click every navigation label, dashboard quick action and section label. | Routes match strategy map; section labels do not open a bogus module. |
| AUTH-09 | P/C/P2 | Collapse/expand navigation, including keyboard activation. | Correct labels/tooltips/active route; content remains reachable. |
| AUTH-10 | N/A/P0 | In test API lane, request/mutate state without login and as restricted account. | Production authorization requires server enforcement; unauthorized reads/writes rejected. Current local login is not proof of this. |

## 3. Dashboard and date context (DASH)

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| DASH-01 | P/C/P1 | Manager and Superuser load dashboard in F0. | Empty/default panels render without NaN or undefined values. |
| DASH-02 | S/A/P0 | Enter O1; open dashboard and other totals panels. | D-specific totals reconcile to documented gross/base semantics; no duplicated income. |
| DASH-03 | P/C/P1 | Activate each visible quick action. | Correct target form/page; business date D carried through. |
| DASH-04 | N/C/P1 | Frontdesk login; inspect menu/landing after navigation and reload. | Dashboard absent from supported Frontdesk UI. |
| DASH-05 | B/A/P1 | Seed prior/future receipts and appointments alongside D records. | Current-day figures exclude unrelated dates; date displayed consistently. |
| DASH-06 | F/A/P1 | Block API after hydration, then navigate dashboard. | Local data remains usable; durable-server status is not falsely implied. |

## 4. Business-day lifecycle (DAY)

Use isolated browser clock for midnight/stale-date cases.

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| DAY-01 | S/C/P0 | D equals calendar today; create O1; accept Close Day. | One closeout/closed-date entry; D stays current until midnight; transaction forms lock. |
| DAY-02 | N/C/P0 | Cancel Close Day confirmation. | Day open; no snapshot/date/counter changes. |
| DAY-03 | S/C/P0 | Close D then request close again where reachable. | Already-closed notice/no duplicate closeout. |
| DAY-04 | N/A/P0 | Closed D: attempt receipt, expense, membership sale and both session redemption entry paths. | All collection/session mutations blocked; no records/session usage change. Direct redemption path specifically inspected. |
| DAY-05 | S/C/P0 | Keep browser open across controlled midnight after manual close. | Advance to D+1; no second D snapshot; forms, attendance and summary dates advance. |
| DAY-06 | S/C/P0 | Leave D open across midnight with O1. | Automatic D closeout, correct totals, D+1 open; no operator confirmation needed. |
| DAY-07 | S/A/P0 | Seed business date D-3, including previously closed and open dates; load at D. | Catch-up reaches today; each required closeout once; prior data preserved. |
| DAY-08 | B/C/P1 | Seed future stored business date; reload in controlled calendar D. | Initial business date reset to calendar today, not unauthorized future operation. |
| DAY-09 | F/A/P0 | Delay server hydration while stale D data loads; then resolve request. | No premature closeout using incomplete/default state; final date/totals consistent. |
| DAY-10 | S/A/P1 | Suspend/background tab around midnight; restore focus later. | Focus/safety tick catches up once; no duplicate dates or stale forms. |

## 5. Appointments (APT)

Setup: F1/F2; create an appointment independently for edit/state cases.

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| APT-01 | P/C/P1 | Book named client, 10-digit phone, D, 10 AM, QA Massage and staff A. | One appointment; out-time 11:00; client linked; date-filtered grid shows booking. |
| APT-02 | N/C/P1 | Submit blank/whitespace name; phone lengths 0/9/11 where input permits. | Invalid booking blocked; native sanitation/validation documented. |
| APT-03 | B/C/P1 | Paste letters/punctuation/overlength phone. | Supported sanitation yields at most 10 digits; cannot persist an invalid phone. |
| APT-04 | N/C/P1 | Book/move appointment to D-1. | Form minimum/clamp or application rejection; no past-day mutation. |
| APT-05 | P/C/P1 | Book D+1; switch selected date between D and D+1. | Booking appears only on chosen future date; no D metric contamination. |
| APT-06 | S/C/P1 | Edit existing booking's service/staff/duration; save. | Same appointment ID, one row, correct out-time; existing creation metadata retained. |
| APT-07 | B/A/P1 | Time 11:45 AM/12 AM/12 PM/11:30 PM with durations 30/60/120 where supported. | Correct 12/24-hour and rollover output; no invalid Date-driven color behavior. |
| APT-08 | S/C/P1 | Change inline in-time, duration and notes separately. | Saved field correct; in-time/duration recompute out-time; unrelated fields unchanged. |
| APT-09 | S/C/P1 | Mark completed; uncheck completed. | Completed/green then Booked/default state; flags and counters agree. |
| APT-10 | S/C/P1 | Mark Not Coming; repeat reset action. | Not Coming then Confirmed; completion false; status counter consistent. |
| APT-11 | S/A/P1 | Exercise available color/status controls, then clock before/during/after session. | Color, completion, label and filters agree with approved policy; no misleading auto-color override. |
| APT-12 | P/C/P2 | Search name/phone/service/staff/ID in mixed case; apply each status filter. | Correct intersection; counts' scope documented; newest creation sorting consistent. |
| APT-13 | N/C/P2 | Search no match; clear search/filter. | Empty state then full selected-date list; no data deletion. |
| APT-14 | S/C/P1 | Delete booking; first cancel confirmation, then accept. | Cancel unchanged; accept removes only selected booking. |
| APT-15 | N/D/P1 | Book same staff/time twice; duplicate client; simultaneous booking saves. | Observe duplicate/overlap policy and identifier uniqueness; creator decides permitted behavior. |
| APT-16 | S/A/P1 | Delete all disposable bookings; reload. | Intentionally empty schedule remains empty; sample reseeding is reported, not hidden as normal persistence. |
| APT-17 | P/C/P1 | Print selected-date appointment sheet. | Relevant rows/time/phone readable; navigation/actions excluded; pagination inspected. |
| APT-18 | S/C/P1 | Use appointment's membership handoff with active F5 member; then with unknown phone. | Active case preloads service/staff in redemption; unknown case explains failure without session deduction. |

## 6. Normal receipts and input validation (RCP)

Current receipt form is a single-service transaction form, not the older
multi-line/discount form. Legacy multi-line compatibility is DAT-09.

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| RCP-01 | P/C/P0 | O1 Cash service with towel 50; attempt tax input. | Base 2,000; tax forced 0; total 2,000; one cash receipt; towel recorded separately. |
| RCP-02 | P/C/P0 | O1 Card service with tax 5%. | Base 2,000, tax 100, paid 2,100; Card/Card GST buckets exact. |
| RCP-03 | P/C/P0 | O1 GPay service with tax 5%. | Base 1,500, tax 75, paid 1,575; GPay/GPay GST buckets exact. |
| RCP-04 | S/C/P1 | Switch Cash -> Card -> GPay -> Member -> Cash in unsaved form. | Tax/default price rules update; Member price/tax zero; returning paid mode restores service price; no premature save. |
| RCP-05 | N/C/P1 | Empty/whitespace client name. | Save blocked; field/app validation accessible. |
| RCP-06 | B/C/P1 | Save with blank phone, then valid phone, then invalid phone. | Blank allowed; valid links client; invalid nonblank blocked. |
| RCP-07 | N/C/P1 | Independently omit service, duration, payment mode and staff. | Required selection validation; no receipt/counter allocation on failure. |
| RCP-08 | N/C/P0 | Paid receipt price blank/0/-1/non-numeric/non-finite in controlled test. | Price must be finite and >0; invalid record not saved. |
| RCP-09 | B/C/P1 | Card tax 0/5/100; -0.01/100.01/non-finite. | Inclusive 0-100 accepted; outside/non-finite rejected; correct formula. |
| RCP-10 | B/C/P1 | Towel cash 0/50/-1/non-finite. | Nonnegative finite values accepted; invalid values rejected; not added to client charge. |
| RCP-11 | B/D/P0 | Run O4 money examples; compare preview/storage/print/export. | Current rounding characterized; approved money precision must agree across outputs. |
| RCP-12 | P/C/P1 | Select different services in form; change arrival hour/minute. | Staff/duration/price defaults follow service; out-time follows arrival/duration. |
| RCP-13 | N/C/P1 | Cancel, Escape and available dialog close before saving. | Form closes without mutation or consumed receipt number. |
| RCP-14 | S/A/P0 | Save three receipts, reload, save another; mix membership sale/visit receipts. | Sequential unique `REC-` numbers shared across transaction types; no reused number. |
| RCP-15 | S/A/P0 | Rapid double-click/Enter on receipt save; two tabs save simultaneously. | No unintended duplicate transaction or reused ID/receipt number; lost update fails acceptance. |
| RCP-16 | B/D/P1 | Towel greater than paid amount; very large price and long client/notes. | Approved limits enforced; allowed cash deficit clearly represented, not silently hidden. |
| RCP-17 | P/C/P2 | Search name/phone/service/staff/receipt attributes; combine mode and staff filters; clear. | Matching visible rows; empty state and clear work; totals scope explicitly verified. |
| RCP-18 | P/C/P2 | Sort each available column twice, including numeric amounts/dates. | Asc/desc correct by data type; sort icon reflects order; no lexicographic money sort. |

## 7. Receipt editing, recovery and audit (REC)

Setup: one active paid receipt and a Member receipt for F5.

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| REC-01 | S/C/P0 | Edit paid price 2,000 -> 2,500 and mode Cash -> Card at 5%. | Same ID/number; old ledger contribution removed; new base 2,500/tax125/total2,625 once. |
| REC-02 | S/C/P0 | Attempt edit on closed D-1 or membership sale receipt. | Closed edit blocked; sale edit directs to Memberships rather than generic receipt modification. |
| REC-03 | S/C/P0 | Soft-delete paid receipt; cancel first, then confirm. | Cancel unchanged; confirm moves to deleted list, subtracts totals once; audit actor/time/number recorded. |
| REC-04 | S/C/P0 | Restore soft-deleted paid receipt. | Same ID/number active; totals restored once; audit record added. |
| REC-05 | N/C/P0 | Delete/restore receipt belonging to a closed date. | Action blocked; locked record and balances unchanged. |
| REC-06 | P/C/P1 | Frontdesk opens deleted list and admin opens it separately. | Frontdesk has no permanent-delete control; Manager/Superuser have admin control. |
| REC-07 | S/C/P1 | Admin permanently deletes a soft-deleted test receipt; cancel first. | Cancel unchanged; confirm removes record, logs action; no second balance/session subtraction. |
| REC-08 | N/A/P0 | Attempt permanent deletion of active receipt or via non-admin pathway. | No permanent deletion outside admin/deleted prerequisites. |
| REC-09 | S/C/P0 | Delete and restore linked Member receipt. | One session refunded then consumed; matching visit removed/recreated; collection stays zero. |
| REC-10 | N/C/P0 | After deleting member receipt, exhaust/cancel/expire member; attempt restore. | Restore blocked without available valid session; counts/visit unchanged. |
| REC-11 | S/A/P0 | Repeat delete/restore action, including stale dialog from another tab. | No duplicate audit-driven financial mutation, over-refund or extra deduction. |
| REC-12 | N/D/P1 | Admin permanently deletes closed-day soft-deleted receipt; inspect historical/audit views. | Current allowance characterized; approved retention/closeout policy enforced before release. |

## 8. Expenses and daily ledger (EXP, LED)

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| EXP-01 | P/C/P0 | Add O1 expense 500 with narration and Cash source. | One D expense; totals/report subtract 500; payment source saved. |
| EXP-02 | P/C/P1 | Independently add expenses using each offered source. | Correct source labels and summed expense values. |
| EXP-03 | N/C/P1 | Empty/whitespace narration; amount blank/0/-1. | Validation blocks saving. |
| EXP-04 | B/D/P1 | Fractional/very large/non-finite amount in controlled input. | Finite approved monetary limits; rounding policy agreed; no invalid stored number. |
| EXP-05 | N/C/P0 | Closed D; attempt expense submission or date change. | Day lock enforced; expense date remains business date. |
| EXP-06 | S/A/P1 | Rapid repeat save, reload, inspect expense list and historical date. | No unintended duplicate; persistence and date isolation correct. |
| LED-01 | P/C/P1 | Add a manual daily row with known Cash/Card/GPay/member/towel/count values. | D row saved; current automatic Card/GPay GST 5% recorded; counts retained. |
| LED-02 | N/C/P0 | Closed D; attempt manual daily-row addition. | Addition blocked; historical ledger unchanged. |
| LED-03 | B/D/P0 | Negative/decimal/non-finite cash and counts via form/inline edit. | Approved amount/count limits enforced consistently; no fractional/negative people counts. |
| LED-04 | S/A/P0 | Existing D row, add normal/member receipts, then edit/delete/restore them. | Exactly one logical contribution per receipt; ledger agrees with active receipt set. |
| LED-05 | S/A/P0 | Add two manual D rows; then save and delete one receipt. | No multiplication of receipt contribution; consolidated totals reconcile or duplicate-row entry rejected. |
| LED-06 | P/C/P1 | Inspect Daily Summary date controls and current visible rows. | Controls fixed to business date in current UI; historical inspection uses Day Report. |

## 9. Membership package configuration (PKG)

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| PKG-01 | P/C/P1 | Create QA Eight with 8 sessions, 12,000, 6 months and notes. | Active package saved; offered in new-membership form. |
| PKG-02 | N/C/P1 | Blank name; zero/negative sessions, price or validity independently. | Validation blocks package save. |
| PKG-03 | B/D/P1 | Fractional/non-finite/very large sessions and validity; duplicate names. | Creator-approved integer/limit/uniqueness policy; invalid data not silently accepted. |
| PKG-04 | S/C/P1 | Edit package; save; reopen and cancel a second edit. | Same package ID updated once; cancel does not modify stored fields. |
| PKG-05 | S/C/P1 | Deactivate then reactivate package. | Removed/restored in new-sale choices; status/icon changes persist. |
| PKG-06 | S/A/P0 | Sell membership, then edit/deactivate its package. | Existing contract's purchased sessions/price/expiry do not retroactively change. |
| PKG-07 | N/A/P1 | Keep sale form open while selected package becomes inactive; submit stale selection. | Inactive package cannot produce a new sale unless explicit approved policy permits it. |
| PKG-08 | P/C/P2 | Keyboard use of package edit/activate/deactivate icons. | Accessible names/focus; action affects only selected package. |

## 10. Membership sales and lifecycle (MEM)

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| MEM-01 | P/C/P0 | Sell QA Eight by Cash to QA Member. | Base/paid12,000, GST0; one contract/sale receipt/client; used0/remaining8. |
| MEM-02 | P/C/P0 | Independently sell by Card and offered GPay/UPI mode. | Base12,000, GST600, paid12,600; correct payment bucket, no duplicate revenue. |
| MEM-03 | B/C/P1 | Direct helper tests: Card/GPay/GPay / UPI/UPI/Cash and other modes. | Supported digital aliases get 5%; others get 0%; total rounded to paise per current helper. |
| MEM-04 | N/C/P1 | Blank name, invalid phone, missing/unknown package ID. | Sale blocked; member/receipt counters not consumed. |
| MEM-05 | S/C/P1 | Attempt change sale start date; save at D. | Sale contract and receipt date use D, not typed future/past date. |
| MEM-06 | S/A/P0 | Sequential sales, reload, restore fixture and new sale; inspect IDs. | Unique `MEM-` identifiers; no collision or receipt-number reuse. |
| MEM-07 | B/D/P1 | Controlled 31-Jan/29-Feb/31-Dec start dates and 1/6/12-month validity. | Observed JS calendar rollover recorded; approved expiry-day/month-end rules required. |
| MEM-08 | B/C/P1 | F5 expires today/yesterday; exhausted; cancelled+expired+exhausted. | Current precedence Cancelled -> Sessions Completed -> Expired -> Active; expiry today active if sessions remain. |
| MEM-09 | P/C/P1 | Active and inactive F5 records; inspect active directory/search/export. | Current directory shows redeemable active contracts; inactive history still visible via supported lookup/history. |
| MEM-10 | P/C/P2 | Search exact/partial name, phone and member ID; no match; clear. | Correct active subset, empty state and restored subset. |
| MEM-11 | S/C/P1 | Print/display new-membership receipt; compare Card O2 stored contract. | Member ID/package/sessions/expiry/base/GST/total correct; no session redemption yet. |
| MEM-12 | N/D/P1 | Sell second active package to same phone; future-start imported contract. | Duplicate-contract policy decided; eligibility must follow approved purchase/start-date rules. |

## 11. Membership session redemption and link changes (VIS)

Setup F5; test main Member receipt form and any visible lookup confirmation form
as separate paths. Unreachable retained code is not a UI test.

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| VIS-01 | P/C/P0 | Member receipt for active8/0; save once. | One zero-charge receipt/linked visit; used1/remaining7; session1; member count +1. |
| VIS-02 | S/C/P0 | Edit same Member receipt's notes/staff; save twice. | Same session/receipt ID; used stays1; visit updated, not duplicated. |
| VIS-03 | B/C/P0 | Active8/7; redeem last session; attempt another. | Used8/remaining0; next redemption blocked; no ninth session. |
| VIS-04 | N/C/P0 | Expired, exhausted and cancelled F5 members. | Explanation by state; no receipt/visit/deduction. |
| VIS-05 | N/C/P1 | Unknown phone/exact name; missing identity. | No active member/needs-client notice; paid-mode or create-membership recovery offered. |
| VIS-06 | P/C/P1 | Lookup exact case-insensitive name without valid phone; then valid phone with a conflicting name. | Name fallback when no valid phone; exact phone match preferred when valid phone given. |
| VIS-07 | B/C/P1 | Two active contracts for one phone with different expiries in main form. | Earliest-expiring redeemable contract selected; correct member/session link saved. |
| VIS-08 | S/C/P0 | Edit linked receipt Member -> Cash. | Old session refunded, visit removed; one paid contribution added. |
| VIS-09 | S/C/P0 | Edit Cash receipt -> valid Member. | Paid contribution removed; exactly one session/visit added; total0. |
| VIS-10 | S/C/P0 | Edit Member A receipt to client/member B. | A refunded once, B consumed once; visit references B; balances zero. |
| VIS-11 | S/C/P1 | Membership directory "Use session" then cancel without confirming visit. | Navigation/prefill only; no deduction until transaction confirmation. |
| VIS-12 | S/C/P1 | Invalid/inactive lookup -> Create/Renew Membership. | Client details handed to sale form; purchase and later visit remain distinct transactions. |
| VIS-13 | S/A/P0 | O2 two redemptions; inspect receipts, visits, reports and export. | Two sessions, not four; collection unchanged12,600; unique member clients1. |
| VIS-14 | F/A/P0 | Two tabs/devices redeem last remaining session concurrently; reorder persistence. | Only one valid consumption; no overwritten visit or usage overflow/lost deduction. |
| VIS-15 | N/D/P0 | Redeem while calendar date differs from business date; future-start/expiry-today member. | Creator-approved eligibility clock; no inconsistent status between paths. |
| VIS-16 | B/D/P1 | Member receipt towel50 in main form versus direct confirmation. | Current main form/direct zero-towel difference characterized; approved zero-charge/towel policy applied consistently. |

## 12. Client directory and service menu (CLI, SVC)

Current client directory is scoped to working-day-created/participating clients.

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| CLI-01 | P/C/P1 | Add named client with valid10-digit phone at D. | One record visible in D directory. |
| CLI-02 | N/C/P1 | Blank/whitespace name and invalid phone independently. | Add blocked without new client record. |
| CLI-03 | N/C/P1 | Add existing phone with same/different name. | Duplicate phone rejected; existing record unchanged. |
| CLI-04 | S/C/P1 | Use same phone across appointment, paid receipt and membership sale. | Exactly one client record; new transactions retain their own details. |
| CLI-05 | S/C/P1 | Client created D-1 with no D activity, then add D appointment. | Initially absent from working-day directory, then visible through D participation. |
| CLI-06 | B/D/P2 | Same name/different phone; leading-zero phone; international number. | String phone integrity; local10-digit scope and duplicate-name policy approved. |
| SVC-01 | P/C/P1 | Add QA Facial price1,500/duration45/staff B. | Menu and new booking/receipt selections include configured service. |
| SVC-02 | N/C/P1 | Add service with blank/whitespace name. | Validation notice; no menu addition. |
| SVC-03 | S/C/P1 | Inline price update; reload; select service in new receipt. | Nonnegative saved value used in new transaction; old receipt amount unchanged. |
| SVC-04 | S/C/P1 | Delete service referenced by existing booking/receipt. | New-choice menu excludes it; historical records remain intelligible. |
| SVC-05 | B/D/P1 | New-service blank/zero/negative/non-finite price; duplicate name. | Current zero fallback characterized; approved price/uniqueness rules applied across add and edit. |
| SVC-06 | N/A/P1 | Remove all disposable services; open receipt/booking. | Clear empty-state/instructions; no crash or phantom valid service save. |

## 13. Staff directory (STF)

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| STF-01 | P/C/P1 | Add staff A with valid name/phone/role and no weekly off. | Saved directory and current attendance row; Not marked initially. |
| STF-02 | P/C/P1 | Add staff B with selected Monday off. | `weekOffs` records Monday; schedule and attendance resolver agree. |
| STF-03 | N/C/P1 | Blank name/invalid phone. | No staff added; accessible validation. |
| STF-04 | S/C/P1 | Remove staff with appointment and attendance history. | Current directory row removed; appointment historical name retained; current counts recalculate. |
| STF-05 | B/D/P1 | Duplicate phone/name; delete staff referenced by historical report. | Approved uniqueness and history-retention policy; no silent historical erasure. |
| STF-06 | N/A/P1 | Remove all disposable staff; open attendance/receipt/member visit. | Staff empty state; required-staff saves cannot persist invalid choices. |

## 14. Attendance, hours and weekly off (ATT)

Active editor is for the current working day. Historical attendance is read-only
through Day Report. Use controlled D weekdays for schedule tests.

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| ATT-01 | P/C/P1 | On unscheduled workday, save Present, Absent, Half Day, Leave, Week Off on separate staff/fixtures. | Correct status badge/counter and persisted record for each. |
| ATT-02 | P/C/P1 | Present09:15-18:00; Half Day09:00-13:00. | Hours8h45m and4h; stored check-in/out match. |
| ATT-03 | N/C/P1 | Present/Half Day equal or reversed in/out. | "Check out must be later" validation; record unchanged. |
| ATT-04 | B/C/P1 | Present with no times or one missing time. | Current optional-time behavior accepted; missing duration displayed as dash, not NaN. |
| ATT-05 | S/C/P1 | Save Present with times, then change to Absent/Leave/Week Off. | Time fields cleared on save; no stale worked hours. |
| ATT-06 | P/C/P1 | Monday D and staff B Monday schedule, no manual record. | Scheduled Week Off shown; not counted Absent. |
| ATT-07 | N/C/P0 | Frontdesk attempts change scheduled off to Present/Leave. | Admin-only override warning; save blocked; schedule unchanged. |
| ATT-08 | S/C/P0 | Manager/Superuser attempts same without Override tick, then with tick. | Without tick rejected; with tick manual override only for D, schedule retained. |
| ATT-09 | S/C/P1 | Delete manual override; cancel then confirm. | Cancel unchanged; confirm restores scheduled off automatically; no Absent substitution. |
| ATT-10 | S/C/P1 | Delete manual ordinary workday status. | Record removed; Not marked fallback, counts correct. |
| ATT-11 | S/C/P1 | Manager toggles multiple off weekdays; Frontdesk views schedule. | Multiple off days persist; Monday-to-Sunday ordering; Frontdesk toggles disabled. |
| ATT-12 | P/C/P2 | Search name/role, filter each status, combine and clear. | Correct row intersection; summary search scope documented; clear restores list. |
| ATT-13 | S/C/P1 | Editor Cancel/Escape/backdrop; delete-dialog Cancel/Escape. | Unsaved edits/deletions discarded; no status change. |
| ATT-14 | S/C/P1 | Reload/re-login; inspect Day Report for D-1 and D. | Each date's saved status/times/notes independent and readable. |
| ATT-15 | B/C/P1 | F6 legacy string records plus new object records. | Both normalize correctly; scheduled fallback only when no explicit record exists. |
| ATT-16 | B/D/P1 | Overnight22:00-06:00; editing after closeout; unsupported imported status. | Overnight/closed-day/import-validation policy decided; unsupported data must not crash platform. |

## 15. Targets and settings (SET)

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| SET-01 | P/C/P1 | Save target20,000 for D month and baseline1,000. | Target persists; matching month's progress uses configured values. |
| SET-02 | N/C/P1 | Missing month and target0/-1 independently. | Save blocked. |
| SET-03 | S/C/P1 | Update same-month target, save next-month target, delete/cancel deletion. | Update replaces correct month only; cancel unchanged; confirmed target removed. |
| SET-04 | B/D/P1 | Negative/non-finite baseline; progress0/100/>100%; zero/no target. | Approved baseline policy; no division error; displayed progress/remaining amounts sensible. |
| SET-05 | P/C/P1 | Save test WhatsApp destinations, comma-separated; reload. | Configuration persists, commas preserved, offered status correct. |
| SET-06 | B/C/P1 | Type letters/punctuation and short numbers, spaces/empty segments. | Input sanitation recorded; send uses only digit strings of at least10 digits. |
| SET-07 | N/D/P1 | Frontdesk attempts targets/packages/backup restore/day close settings. | Current controls characterized; creator-approved role matrix enforced before release. |
| SET-08 | P/C/P2 | Inspect Settings and sidebar for reset-all action; open history. | No removed Clear All Data action; Day Report reachable. |

## 16. JSON backup, restore and source-archive distinction (BAK)

Use only disposable data. File names/content/evidence must not include secrets.

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| BAK-01 | P/C/P0 | Populate records; download JSON; open and inspect file. | ValidJSON object keyed by logical `STORAGE` names; date-based filename; datasets match local source values. |
| BAK-02 | S/A/P0 | Download populated data; alter fixture; restore backup; reload/re-login. | All intended datasets, counters/links/balances/dates faithfully restored; no partial success or ID collision. |
| BAK-03 | N/C/P1 | Restore malformed/truncated JSON. | Visible error; no successful restore claim; original records unchanged. |
| BAK-04 | N/A/P0 | ValidJSON wrong schema: string instead of receipts array, null root, invalid attendance status. | Reject with meaningful error before mutation; no crash after reload. |
| BAK-05 | S/C/P1 | Import legacy backup missing attendance/new keys. | Present valid keys restored; missing/null logical keys left unchanged; behavior documented. |
| BAK-06 | S/A/P0 | Restore on connected test DB; new browser bootstraps afterwards. | Server and local restored state agree; stale bootstrap does not undo restoration. |
| BAK-07 | F/A/P0 | Quota/network/DB failure during restore midway through datasets. | No false full-success claim; atomic recovery or explicit partial-state recovery available. |
| BAK-08 | S/A/P0 | Backup with highest receipt number, reset fresh profile, restore and create new receipt. | Number counter advances safely; backup omission of separate counter must not cause duplicates. |
| BAK-09 | N/C/P2 | Cancel file picker; select same file twice across resets. | Cancel no-op; input reset permits repeated selection. |
| BAK-10 | B/D/P1 | EmptyJSON object, unknown keys, duplicate IDs, huge file and validJSON with wrong types. | Schema/limits/merge policy approved; no unexpected data injection or unbounded freeze. |
| BAK-11 | P/C/P1 | Compare source ZIP versus appJSON backup; inspect secret inclusion. | Source archive is code/configuration, JSON is business data; neither exposes privacy secrets as a normal exported business field. |

## 17. Daily Summary, historical records and closeout (RPT, HIS, EOD)

Use F7 and independent O1/O2/O3.

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| RPT-01 | P/C/P1 | O1; view current Daily Summary. | Current base receipts5,500/payments550/base closing4,950 with zero opening; expense/towel components exact. |
| RPT-02 | S/A/P0 | Compare Daily Summary, dashboard, receipt collection and EOD O1/O3. | Base/gross/GST differences explicit; approved balance semantics; no unexplained discrepancy. |
| RPT-03 | B/C/P1 | No transactions at D; inspect summary/export. | Zero-day row/totals and opening balance sensible; no NaN. |
| RPT-04 | N/A/P1 | Controlled inverted/empty date range in retained report logic. | Graceful rejection/empty range; no infinite loop; UI date locks not bypassed in ordinary testing. |
| RPT-05 | S/A/P0 | Multiple D daily rows and previous expenses; calculate carry-forward. | No lost rows/double contribution; prior expense effects correct; reconcile to approved model. |
| HIS-01 | P/C/P1 | Settings -> Day Report; select D-1 and D. | Only requested date's appointments/receipts/expenses/sales/visits/attendance; no edit actions. |
| HIS-02 | P/C/P1 | Choose date without records/closeout. | Empty tables, zero computed activity and "No closeout" explanation; no unrelated record leakage. |
| HIS-03 | S/C/P1 | F7 deleted receipt and O2 sale/session records. | Deleted row labelled separately; excluded from active collection; purchases/visits distinguishable. |
| HIS-04 | S/A/P0 | Same-day sales with deleted sale receipt; compare calculated history and closeout fallback. | No phantom membership income due to fallback; financial retention policy obeyed. |
| HIS-05 | S/C/P1 | Legacy visit without receiptId plus linked modern visit. | Member visits not double-counted; zero charge; session history readable. |
| HIS-06 | P/C/P1 | D-1 saved closeout; D without snapshot. | Prior report uses saved snapshot where defined; D calculates from saved records with clear explanation. |
| HIS-07 | B/C/P2 | Attempt future date beyond allowed max; long history table. | Date bound respected; table accessible/read-only and scrollable. |
| EOD-01 | P/C/P0 | O1; close D; inspect snapshot/local/DB. | Base5,500, GST175, collection5,675, towel50, expenses500, closing5,125; one snapshot. |
| EOD-02 | P/C/P0 | O3; close D. | Opening900; closing6,025; no opening expense/towel double subtraction. |
| EOD-03 | P/C/P0 | O2; close D after two redemptions. | Collection12,600; new memberships1; membership clients1; sessions2; active receipts3. |
| EOD-04 | B/C/P1 | Same phone multiple paid visits; member also buys/saves paid receipt. | Unique client sets and transaction/session counts distinguished correctly. |
| EOD-05 | N/C/P1 | Send without valid configured destination. | Notice and Settings navigation; no delivery/sent claim. |
| EOD-06 | P/C/P1 | Use isolated approved destination; inspect generated WhatsApp URL/message, cancel delivery. | Encoded text matches snapshot; "opened/press Send" behavior; no actual delivery asserted. |
| EOD-07 | F/A/P1 | Block popups; configure multiple destinations; resend. | Opening failure not mistaken for delivery; no altered financial snapshot; manual send/resend behavior documented. |
| EOD-08 | P/D/P1 | Inspect full message lines versus saved closeout and earlier removal expectations. | Current message includes membership client count, sessions used and collection breakdown, but not the old membership-revenue-collected-today line. Creator approves intended lines; every included value matches snapshot. |
| EOD-09 | P/C/P1 | Print current closeout and view previous in Settings Day Report. | Correct selected snapshot, actor/time, clear money labels; no editable past-day controls. |
| EOD-10 | F/A/P0 | Reload/close browser or interrupt backend during closeout persistence. | Day lock, snapshot and next-day state recover consistently; no locked day without recoverable closeout. |

## 18. XLSX and print output fidelity (XLS)

Inspect workbook contents with Excel/compatible reader. No file-evidence shortcut.

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| XLS-01 | P/C/P1 | Export O1/O2 active current-day receipts. | Receipts sheet includes Date, Client Name, Phone Number, Duration, Service, Membership, Transaction Type, Session Number, Price, Payment Mode, Tax, Staff Name, Towel Kit Cash Out, Notes. |
| XLS-02 | P/C/P1 | Inspect cell types/formats on dates, leading-zero phones and fractional money. | Phone remains text; amount/tax numeric; dates correct timezone/day; currency precision retained. |
| XLS-03 | S/C/P1 | Apply receipt filters; export; soft-delete a receipt; export again. | Current export includes all active D rows, not just displayed filtered subset; deleted/prior-day rows excluded. |
| XLS-04 | P/C/P1 | Filter active membership directory; export. | Export matches filtered active subset; ID/package/status/session/base/GST/paid/start/expiry/notes columns correct. |
| XLS-05 | P/C/P1 | Export Daily Summary with O1. | Daily Summary worksheet plus TOTAL row; numeric base-only values agree with RPT-01, not incorrectly claimed gross amounts. |
| XLS-06 | N/C/P1 | Export receipt workspace with no active D records. | Disabled/export error; no misleading successful populated file. |
| XLS-07 | F/A/P1 | Fail lazy ExcelJS load/file generation and retry. | Explicit error; busy flag clears; retry works; no false downloaded claim. |
| XLS-08 | B/A/P1 | Long text, notes beginning `=`, `+`, `-`, `@`; inspect workbook. | Literal input retained safely as text where intended, no unintended spreadsheet formula execution. |
| XLS-09 | P/A/P1 | Print booking/member sale/member visit/EOD at A4 and narrow viewport. | Correct selected records/totals; no clipped columns/missing pages; navigation/actions hidden. |
| XLS-10 | S/A/P0 | Begin export/print, activate privacy before completion. | Sensitive download/print does not complete after privacy activation; no exposed stale output. |

## 19. Local persistence, bootstrap and concurrency (DAT)

Separate lanes: local-only, dedicated connected DB, fresh profile, two writers.

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| DAT-01 | P/C/P0 | Create each entity, reload/re-login with API offline. | Stored browser records restored; money/session/date state unchanged. |
| DAT-02 | P/A/P0 | Save connected records; inspect HTTP PUT and DBJSONB readback. | Every affected key durably matches latest local state; not merely HTTP request queued. |
| DAT-03 | S/A/P0 | Local populated/server empty; launch and inspect initial uploads. | All intended datasets/counters uploaded without default overwrites or missing keys. |
| DAT-04 | S/A/P0 | Local empty/server populated; fresh profile launches with delayed GET. | Server bootstrap wins safely, at most required reload, no writes wiping server data. |
| DAT-05 | S/C/P1 | Same browser session reopens after server state changes elsewhere. | Current one-time sync limitation documented; no claim of live synchronization. |
| DAT-06 | F/A/P0 | Save offline, restore connectivity, open fresh profile. | Approved retry/recovery proves saved work durable; no silent loss of offline changes. |
| DAT-07 | F/A/P0 | PUT500/401 and delayed/out-of-order responses. | Failed durable save observable; newest intended data wins or conflict explicitly resolved. |
| DAT-08 | F/A/P0 | Two tabs/devices add different receipts and redeem same member concurrently. | No lost receipts, duplicate counters or stale last-write overwrite; conflicts explicit. |
| DAT-09 | B/A/P1 | F6 legacy receipt items/payment aliases; reload and report/export. | Legacy paid amounts, GST, phone and service preserved and reconciled. |
| DAT-10 | N/A/P0 | CorruptJSON then syntactically valid wrong-type datasets. | Safe explicit recovery; no undisclosed data loss/default overwrite or render crash. |
| DAT-11 | F/A/P0 | Block localStorage/read/write; exhaust quota during save. | Clear failure; no false successful persistence or partial linked transaction. |
| DAT-12 | B/A/P1 | Timezone boundary and date strings across DB/browser/XLSX. | Same logical business date; no UTC day shift. |
| DAT-13 | S/A/P0 | Interrupt between receipt, membership, visits and ledger writes; reload. | Transaction recoverable/reconciled; no orphan visit or inconsistent usage/balance. |
| DAT-14 | N/A/P1 | Stale browser marker after backup restore/new DB; reconnect. | Correct source of truth selected; stale sync marker cannot hide unresolved divergence. |

## 20. API and database contract (API)

Use only dedicated DB; HTTP/DB checks are not satisfied by UI-only evidence.

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| API-01 | P/C/P1 | GET `/api/health` with healthy DB. | HTTP200 JSON `{ "ok": true }`. |
| API-02 | F/C/P1 | Make test DB unavailable; GET health/state; PUT key. | HTTP500 with documented JSON error shape, not success; recovery after DB returns. |
| API-03 | P/C/P1 | GET `/api/state` on empty then populated DB. | JSON object mapping keys directly to theirJSON values; empty object on empty table. |
| API-04 | P/C/P1 | PUT test key with `{ "value": { "a": 1 } }`, GET key and full state. | PUT `{ "ok": true }`; key GET `{ "value": { "a": 1 } }`; full-state mapping agrees. |
| API-05 | S/C/P1 | PUT same key with new array/value; inspect row and updated_at. | One upserted row; replacementJSONB and updated timestamp, not duplicate DB key. |
| API-06 | B/C/P1 | GET missing key; PUT absent/null value. | Missing GET `{ "value": null }`; current PUT stores JSON null; acceptance schema policy separate. |
| API-07 | N/A/P1 | MalformedJSON/wrong content type/request over5mb/invalid key/value type. | Appropriate explicit4xx and no invalid business-state overwrite; current parser/schema gaps recorded. |
| API-08 | P/C/P1 | POST privacy activate with correct configured password; reveal with configured email/password. | HTTP200 `{ "ok": true }`; correct respective verifier used. |
| API-09 | N/C/P0 | Wrong/case-changed/empty/non-string/over256 password; unknown reveal email. | HTTP401; no ok result; verifier handles malformed encoded hashes safely. |
| API-10 | F/C/P0 | Missing activation hash/config and unknown user hash. | Activation503; reveal401; visible unavailable configuration; never reveal success. |
| API-11 | B/C/P1 | Send10 privacy attempts from testIP, then11th; wait expiry. | Current shared limiter allows first10, returns429 beyond limit; resets after window. |
| API-12 | B/A/P1 | Mixed-case/spaced email; malformed body; large password causing hash load. | Email normalizes; invalid requests controlled; service remains responsive. |
| API-13 | S/C/P1 | Run DB init twice against disposable test database. | Table exists once; existing test rows preserved; no schema reinitialization loss. |
| API-14 | N/A/P0 | Call state read/write routes outside authorized user/role context. | Approved server access policy enforced; local role visibility cannot substitute for authorization. |

## 21. Privacy controls and protected surfaces (PRV)

Use synthetic configured verification credentials. Normal login and privacy
verification are separate; test both. Do not capture secrets in evidence.

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| PRV-01 | P/C/P0 | With populated data visible, click Hide Data. | Immediate placeholders; sensitive workspace hidden/inert/aria-hidden; no underlying record mutation. |
| PRV-02 | P/C/P1 | Activate through Privacy Mode correct password; repeat wrong password. | Correct activates; wrong stays in prior state with error; password cleared afterward. |
| PRV-03 | S/C/P1 | Select each offered alternate shortcut; trigger it and reload. | Selected shortcut persists; hides only; cannot reveal without verification. |
| PRV-04 | B/C/P2 | Try browser-reserved Ctrl+T versus alternate shortcut. | Reserved shortcut limitation explained; supported alternate/Hide Data works. |
| PRV-05 | P/C/P0 | Reveal with current account's configured verification password. | Successful verification reveals data exactly as before; no data reset. |
| PRV-06 | N/C/P0 | Wrong password/unknown identity; cancel/Escape/close where offered. | No reveal; no saved plaintext password; cancellation leaves state safe. |
| PRV-07 | F/C/P0 | API down/nonJSON/error/429 during reveal. | Verification error; hidden data remains hidden; no success fallback. |
| PRV-08 | S/A/P0 | Activate in tabA; shared-session tabB has data visible. | TabB hides promptly via shared key; separate session behavior documented. |
| PRV-09 | S/C/P0 | Reveal in tabA while tabB remains hidden. | Other tab not silently revealed; only activation propagates through storage listener. |
| PRV-10 | S/C/P0 | Reload while active; revisit login/page navigation. | Privacy persists; placeholders rather than live values; navigation does not reveal. |
| PRV-11 | S/C/P0 | Delay reveal response; hide again/shortcut before response resolves. | Stale response rejected by activation revision; data stays hidden. |
| PRV-12 | N/A/P0 | While hidden attempt mouse/keyboard/form interaction with underlying content. | No mutation; hidden elements not focusable/actionable through normal UI. |
| PRV-13 | N/A/P0 | While hidden use print buttons/Ctrl+P/Ctrl+S/export/backup. | Protected UI paths blocked; actual print output has no sensitive values; no unguarded file download. |
| PRV-14 | F/A/P0 | Disable browser storage/cookies or exhaust quota; hide/reveal. | Fail-safe hidden state and usable explanation; no crash or unexpected reveal. |
| PRV-15 | P/A/P0 | Inspect all pages, dialog backdrop, toast, title, tooltips and accessibility tree while hidden. | No client/phone/financial/attendance information exposed in supported UI or print. Placeholder zeros not reported as actual data. |

## 22. UX, accessibility, compatibility and performance (UX, NFR)

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| UX-01 | P/A/P1 | Each page at360/390/768/1024/1440px. | Controls readable/reachable; intended table scroll allowed; no clipped destructive confirmations. |
| UX-02 | P/A/P1 | Keyboard-only login/nav/forms/modals; Tab/Shift+Tab/Escape. | Visible focus, logical order, no inaccessible action; modal focus behavior recorded. |
| UX-03 | P/A/P1 | 200% zoom and screen-reader pass on login/receipt/attendance/privacy. | Labels, required/errors/status, table headers and modal names conveyed. |
| UX-04 | P/C/P2 | Number inputs across receipts/targets/packages/expenses. | No unintended spinner controls per existing style; keyboard entry still works. |
| UX-05 | P/A/P1 | Repeat smoke in supported Chrome/Edge/Firefox/WebKit versions. | Date/time/inert/privacy/download/print behavior supported; browser differences documented. |
| UX-06 | B/A/P2 | Long names, notes, Unicode, special characters and no-match lists. | Text escaped/rendered correctly; no broken layout or inaccessible hidden truncation. |
| UX-07 | S/A/P1 | Save/error notifications overlap; rapid page navigation. | Latest notice correct, no stale success/error attributed to wrong action. |
| UX-08 | N/A/P1 | Inspect empty forms/datasets and cancelled destructive dialogs. | Clear recoverable empty/error states; no bogus success or accidental deletion. |
| NFR-01 | P/D/P1 | F9 at approved scale; measure initial interactive time across5 runs. | Meets approved threshold; median/max/hardware/network recorded. |
| NFR-02 | P/D/P1 | Measure save acknowledgement and DB durability under healthy lane. | Approved local/durable latencies; measurements distinguish the two. |
| NFR-03 | P/D/P1 | Search/filter and export1,000 current-day receipts across5 runs. | Meets approved500ms/search and10s/export or approved replacement limits; file content complete. |
| NFR-04 | F/A/P0 | Repeated offline/online switches and stalled DB at approved scale. | Data recoverable; no indefinite freeze, memory runaway or silent record loss. |
| NFR-05 | S/A/P1 | Keep app open through navigation/export cycles and midnight. | No accumulating listeners/timers, duplicate actions or degrading usability. |

## 23. Integrated workflows and business UAT (E2E)

Each workflow requires underlying module assertions, not just page completion.

| ID | Type / class / priority | Setup and steps | Expected result |
|---|---|---|---|
| E2E-01 | P/A/P0 | Frontdesk books/completes appointment; saves O1 receipts/expense; Manager reconciles/closes D; inspect history after rollover. | Every record/date/client link correct; EOD O1 totals; next-day lock/history behavior valid. |
| E2E-02 | P/A/P0 | Manager sells O2 membership; Frontdesk confirms2 visits; edit/re-save; delete/restore visit; close D. | Single sale collection12,600; used2/remaining6; two visits; EOD/session totals exact. |
| E2E-03 | F/A/P0 | Work offline, create records, reconnect, open fresh profile, reconcile and back up. | No missing/duplicate records; durable state and approved offline recovery proven. |
| E2E-04 | S/A/P0 | Admin JSON backup -> intentional test changes -> restore -> new receipt/member -> closeout. | Restored links/counters/balances valid; new identifiers unique; no stale server undo. |
| E2E-05 | S/A/P0 | Populated app -> hide across tabs -> rejected reveal -> successful reveal -> export/print. | No exposure during hidden phase; exact preserved data after reveal; outputs only after authorization. |
| E2E-06 | P/A/P1 | Operator marks weekly off/admin override/hours, deletes override, closes D and inspects Day Report. | Correct schedule fallback, hours and historical daily attendance; no off counted absent. |
| E2E-07 | P/D/P1 | Creator/operator review full-day printed/XLSX reports, role restrictions and ambiguity list. | Written approval or explicit blocked/defect decisions; release gate not waived implicitly. |

## Coverage and execution handoff

The section prefixes map directly to strategy capability groups. All monetary,
session, persistence and privacy assertions require evidence from the relevant
records/output, not just UI notifications.

Create execution rows using the detailed plan's template, expanding each
parameter, role and browser variant. Track total/pass/fail/blocked/partial/not-run
counts from those execution rows rather than treating one catalogue row as one
browser run. Retain exact input values and independent expected figures.

No case in this document has been executed merely by creating this catalogue.
