# Bizora test execution report - 01.04.042

Run: BZ-01.04.042-20261010-01

Source commit: `41b3a55f9a987ecbf70c109b08a47ab69709ffb3`.
Executed 2026-10-10 using isolated headless Microsoft Edge, synthetic data,
Asia/Kolkata timezone and a controlled browser clock. No shared browser data,
real messages, production database, source code or Git history was changed.

## Completion status

**Testing is incomplete. The release is not approved.**
All 276 catalogue IDs are accounted for below, but accounting for an ID is not
execution. PASS is limited to the recorded local-browser/native-command lane.
PARTIAL is not PASS; blocked and not-run cases provide no acceptance evidence.
No tests are left running automatically after this report.

| Status | Cases |
|---|---:|
| PASS | 121 |
| FAIL | 14 |
| PARTIAL | 25 |
| BLOCKED | 42 |
| NOT RUN | 74 |
| Total | 276 |

## Environment and evidence limitations

- Frontend HTTP 200 at http://127.0.0.1:5174/.
- API http://127.0.0.1:4000/api/health refused connection.
- After user approval, a separate PostgreSQL17 cluster was initialized on
  loopback port55432, database bizora_qa_0104042. A copied unmodified API ran on
  port54000. No production credentials or existing privacy configuration were
  accessed. State-contract and synthetic privacy HTTP tests were run in this lane.
- Browser-to-API bootstrap/concurrency tests were not subsequently completed.
  Earlier environment-blocked cases retain their original blocker unless a
  later case-specific execution updated the row.
- Isolated browser requests to port 4000 and external destinations were aborted.
  A single privacy propagation test used an explicitly mocked success response
  and is PARTIAL, not live password-verification evidence.
- The browser-runner dependency was installed only in the session artifact
  directory. No repository dependency manifest was changed.
- The managed integrated browser could not create an independent context;
  installed Edge with Playwright supplied disposable contexts instead.
- Real JSON and XLSX files were downloaded and parsed for the listed file cases.
  Native print/PDF fidelity, other browser engines, full accessibility,
  concurrency, failure-recovery matrices and approved performance limits remain
  outstanding unless a row explicitly records completed evidence.
- Initial test-runner locator/scoping failures were corrected and rerun where
  feasible. Incorrect expectations about equivalent time notation, sanitized
  phone input and a spreadsheet reader's UTC conversion were corrected; they
  are not counted as product defects.
- Case PASS records cover their stated assertions, not every possible field
  partition. Full exhaustive role/browser/data cross-products are not claimed.

## Build and numeric findings

- Production build succeeded, 1,585 transformed modules.
- Existing password-hash test: 1 passed, 0 failed.
- Existing build warning: JS chunks 610.47 kB and 938.56 kB exceed 500 kB.
- O1 gross collection 5,675, towel 50, expenses 500, EOD closing 5,125 verified
  locally. Daily Summary base-only closing 4,950 was characterized separately.
- O3 opening 900 and closing 6,025 verified.
- O2 membership collection 12,600 with two zero-charge sessions verified.
- Financial figures above do not substitute for durable DB assertions.

## Failed case findings

| Case | Finding |
|---|---|
| DAY-01 | Close Day button advances 10-Oct to 11-Oct immediately rather than waiting for midnight. |
| DAY-02 | Close Day bypasses confirmation; cancellation cannot prevent creation of a closeout. |
| DAY-04 | On a closed day, the direct membership confirmation consumes a session and creates a receipt. |
| APT-16 | An explicitly empty stored appointment array is replaced with eight sample appointments. |
| LED-05 | With two same-date ledger rows, one 2,000 receipt contributes 4,000 across the ledger. |
| BAK-04 | JSON restore persists receiptEntries as a string without schema validation. |
| BAK-08 | Fresh-profile JSON restore reuses receipt numbers: four records have only three unique numbers. |
| HIS-04 | A deleted membership-sale receipt still appears as 12,600 collection through contract fallback. |
| EOD-04 | One client with two paid receipts and one member visit is reported as two distinct total clients. |
| XLS-03 | Filtered receipt export contains only one visible matching row, contrary to the catalogue requirement to export all two active rows. Export scope needs approval or correction. |
| DAT-10 | A wrong-type stored receipt dataset crashes rendering with receiptEntries.filter is not a function. |
| API-07 | Copied API accepts invalid receipt dataset structure with HTTP200 instead of rejecting invalid business state. |
| API-14 | Copied API returns stored application state with HTTP200 without authentication. |
| AUTH-10 | Copied API accepts unauthenticated state writes with HTTP200. |

DAY-01 and DAY-02 share a close-button wiring cause. BAK-04 and DAT-10 are
related invalid-data handling failures. Failed cases do not necessarily mean
independent root causes. These are runtime observations; no fixes were made.
XLS-03 includes an unresolved export-scope contract difference and should not be
presented as a confirmed unwanted behavior without creator approval.

## Module coverage

| Group | Total | PASS | FAIL | PARTIAL | BLOCKED | NOT RUN |
|---|---:|---:|---:|---:|---:|---:|
| REL | 6 | 4 | 0 | 0 | 1 | 1 |
| AUTH | 10 | 9 | 1 | 0 | 0 | 0 |
| DASH | 6 | 3 | 0 | 0 | 0 | 3 |
| DAY | 10 | 5 | 3 | 0 | 1 | 1 |
| APT | 18 | 7 | 1 | 1 | 1 | 8 |
| RCP | 18 | 9 | 0 | 4 | 2 | 3 |
| REC | 12 | 7 | 0 | 1 | 1 | 3 |
| EXP | 6 | 4 | 0 | 0 | 1 | 1 |
| LED | 6 | 1 | 1 | 0 | 2 | 2 |
| PKG | 8 | 3 | 0 | 1 | 1 | 3 |
| MEM | 12 | 7 | 0 | 2 | 2 | 1 |
| VIS | 16 | 11 | 0 | 2 | 2 | 1 |
| CLI | 6 | 5 | 0 | 0 | 1 | 0 |
| SVC | 6 | 2 | 0 | 2 | 1 | 1 |
| STF | 6 | 2 | 0 | 0 | 1 | 3 |
| ATT | 16 | 12 | 0 | 1 | 1 | 2 |
| SET | 8 | 4 | 0 | 0 | 2 | 2 |
| BAK | 11 | 2 | 2 | 1 | 2 | 4 |
| RPT | 5 | 1 | 0 | 0 | 0 | 4 |
| HIS | 7 | 3 | 1 | 0 | 0 | 3 |
| EOD | 10 | 2 | 1 | 1 | 2 | 4 |
| XLS | 10 | 6 | 1 | 0 | 0 | 3 |
| DAT | 14 | 0 | 1 | 1 | 8 | 4 |
| API | 14 | 8 | 2 | 3 | 1 | 0 |
| PRV | 15 | 4 | 0 | 3 | 4 | 4 |
| UX | 8 | 0 | 0 | 1 | 0 | 7 |
| NFR | 5 | 0 | 0 | 0 | 3 | 2 |
| E2E | 7 | 0 | 0 | 1 | 2 | 4 |

## Per-case results

Use [the catalogue](COMPREHENSIVE_TEST_CASES.md) for complete steps and expected
results and [the detailed plan](DETAILED_TESTING_PLAN.md) for fixture definitions.
Machine-readable records and the runner remain in the session evidence folder.

| Case | Status | Type/class/priority | Actual result or blocker | Evidence |
|---|---|---|---|---|
| REL-01 | PASS | P/C/P0 | Production build exit 0; 1585 modules; 610.47/938.56 kB JS chunks trigger existing >500 kB warning. |  |
| REL-02 | PASS | P/C/P1 | Root/server manifests and lockfiles agree: 1.4.42 / 01.04.042 / 01.04. |  |
| REL-03 | PASS | P/C/P1 | HTTP frontend loaded sign-in without a pageerror in isolated Edge. |  |
| REL-04 | PASS | P/C/P1 | node --test server/privacy-auth.test.js: 1 pass, 0 fail. |  |
| REL-05 | NOT RUN | F/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| REL-06 | BLOCKED | P/C/P1 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| AUTH-01 | PASS | P/C/P0 | frontdesk role navigation and landing verified. |  |
| AUTH-02 | PASS | P/C/P0 | manager, superuser role navigation and landing verified. |  |
| AUTH-03 | PASS | N/C/P1 | Both blank and each separately blank credential rejected. |  |
| AUTH-04 | PASS | N/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| AUTH-05 | PASS | B/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| AUTH-06 | PASS | S/A/P1 | All implemented assertions in the local-browser scenario passed. |  |
| AUTH-07 | PASS | S/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| AUTH-08 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| AUTH-09 | PASS | P/C/P2 | All implemented assertions in the local-browser scenario passed. |  |
| AUTH-10 | FAIL | N/A/P0 | Copied API accepts unauthenticated state writes with HTTP200. |  |
| DASH-01 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| DASH-02 | PASS | S/A/P0 | All implemented assertions in the local-browser scenario passed. |  |
| DASH-03 | NOT RUN | P/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| DASH-04 | PASS | N/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| DASH-05 | NOT RUN | B/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| DASH-06 | NOT RUN | F/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| DAY-01 | FAIL | S/C/P0 | Close Day button advances 10-Oct to 11-Oct immediately rather than waiting for midnight. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/DAY-01-1791639694803.png>) |
| DAY-02 | FAIL | N/C/P0 | Close Day bypasses confirmation; cancellation cannot prevent creation of a closeout. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/DAY-02-1791639620352.png>) |
| DAY-03 | PASS | S/C/P0 | Already-closed UI close button disabled; direct repeated handler branch not reachable through UI. |  |
| DAY-04 | FAIL | N/A/P0 | On a closed day, the direct membership confirmation consumes a session and creates a receipt. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/DAY-04-1791640252249.png>) |
| DAY-05 | PASS | S/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| DAY-06 | PASS | S/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| DAY-07 | PASS | S/A/P0 | All implemented assertions in the local-browser scenario passed. |  |
| DAY-08 | PASS | B/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| DAY-09 | BLOCKED | F/A/P0 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| DAY-10 | NOT RUN | S/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| APT-01 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/APT-01-1791640216028.png>) |
| APT-02 | PASS | N/C/P1 | Blank/whitespace names and 0/9-digit phones rejected; overlength input is sanitized to ten digits. |  |
| APT-03 | PASS | B/C/P1 | All implemented assertions in the local-browser scenario passed. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/APT-03-1791640225020.png>) |
| APT-04 | PASS | N/C/P1 | Past date entry clamped to D; no backdated booking persisted. |  |
| APT-05 | NOT RUN | P/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| APT-06 | PARTIAL | S/C/P1 | Identity/creation metadata/name edit verified; service/duration edit variants not covered. |  |
| APT-07 | NOT RUN | B/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| APT-08 | NOT RUN | S/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| APT-09 | PASS | S/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| APT-10 | NOT RUN | S/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| APT-11 | NOT RUN | S/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| APT-12 | NOT RUN | P/C/P2 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| APT-13 | PASS | N/C/P2 | All implemented assertions in the local-browser scenario passed. |  |
| APT-14 | PASS | S/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| APT-15 | BLOCKED | N/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| APT-16 | FAIL | S/A/P1 | An explicitly empty stored appointment array is replaced with eight sample appointments. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/APT-16-1791640067946.png>) |
| APT-17 | NOT RUN | P/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| APT-18 | NOT RUN | S/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| RCP-01 | PASS | P/C/P0 | Saved/reloaded record: {"cash":2000,"taxAmount":0,"total":2000,"towelKit":50}. |  |
| RCP-02 | PASS | P/C/P0 | Saved/reloaded record: {"card":2000,"cardGst":100,"taxAmount":100,"total":2100}. |  |
| RCP-03 | PASS | P/C/P0 | Saved/reloaded record: {"gpay":1500,"gpayGst":75,"taxAmount":75,"total":1575}. |  |
| RCP-04 | PASS | S/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| RCP-05 | PASS | N/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| RCP-06 | PASS | B/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| RCP-07 | NOT RUN | N/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| RCP-08 | PARTIAL | N/C/P0 | Blank, zero and negative prices rejected. Browser number control excludes literal non-numeric/non-finite typing; programmatic injection not covered. |  |
| RCP-09 | PARTIAL | B/C/P1 | Numeric boundary 0/5/100 accepted; -0.01/100.01 rejected. Non-finite injection not covered. |  |
| RCP-10 | PARTIAL | B/C/P1 | 0/50 accepted as separate cashout; -1 rejected; non-finite injection not covered. |  |
| RCP-11 | BLOCKED | B/D/P0 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| RCP-12 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| RCP-13 | PASS | N/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| RCP-14 | PASS | S/A/P0 | All implemented assertions in the local-browser scenario passed. |  |
| RCP-15 | NOT RUN | S/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| RCP-16 | BLOCKED | B/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| RCP-17 | PARTIAL | P/C/P2 | Name/no-match/clear search verified; mode/staff intersection and other search fields pending. |  |
| RCP-18 | NOT RUN | P/C/P2 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| REC-01 | PASS | S/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| REC-02 | PARTIAL | S/C/P0 | Membership sale generic edit blocked. Closed-day edit variant not executed. |  |
| REC-03 | PASS | S/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| REC-04 | PASS | S/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| REC-05 | NOT RUN | N/C/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| REC-06 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| REC-07 | PASS | S/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| REC-08 | NOT RUN | N/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| REC-09 | PASS | S/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| REC-10 | PASS | N/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| REC-11 | NOT RUN | S/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| REC-12 | BLOCKED | N/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| EXP-01 | PASS | P/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| EXP-02 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| EXP-03 | PASS | N/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| EXP-04 | BLOCKED | B/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| EXP-05 | PASS | N/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| EXP-06 | NOT RUN | S/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| LED-01 | NOT RUN | P/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| LED-02 | BLOCKED | N/C/P0 | Manual daily-row form is not rendered in the active Daily Summary page; requested action unavailable through UI. Handler invocation was not substituted. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/LED-02-1791640648160.png>) |
| LED-03 | BLOCKED | B/D/P0 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| LED-04 | NOT RUN | S/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| LED-05 | FAIL | S/A/P0 | With two same-date ledger rows, one 2,000 receipt contributes 4,000 across the ledger. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/LED-05-1791640430182.png>) |
| LED-06 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| PKG-01 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| PKG-02 | PARTIAL | N/C/P1 | Representative blank/zero/negative partitions tested; full field/value cross-product pending. |  |
| PKG-03 | BLOCKED | B/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| PKG-04 | NOT RUN | S/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| PKG-05 | PASS | S/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| PKG-06 | PASS | S/A/P0 | All implemented assertions in the local-browser scenario passed. |  |
| PKG-07 | NOT RUN | N/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| PKG-08 | NOT RUN | P/C/P2 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| MEM-01 | PASS | P/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| MEM-02 | PASS | P/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| MEM-03 | PASS | B/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| MEM-04 | PASS | N/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| MEM-05 | PASS | S/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| MEM-06 | NOT RUN | S/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| MEM-07 | BLOCKED | B/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| MEM-08 | PASS | B/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| MEM-09 | PARTIAL | P/C/P1 | Active-directory filtering verified; historical lookup/export variants not covered. |  |
| MEM-10 | PASS | P/C/P2 | All implemented assertions in the local-browser scenario passed. |  |
| MEM-11 | PARTIAL | S/C/P1 | Receipt screen/record checked; native print output inspection pending. |  |
| MEM-12 | BLOCKED | N/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| VIS-01 | PASS | P/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| VIS-02 | PASS | S/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| VIS-03 | PASS | B/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| VIS-04 | PASS | N/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| VIS-05 | PASS | N/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| VIS-06 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| VIS-07 | PASS | B/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| VIS-08 | PASS | S/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| VIS-09 | PASS | S/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| VIS-10 | PASS | S/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| VIS-11 | PASS | S/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| VIS-12 | PARTIAL | S/C/P1 | Unknown-client create handoff verified; inactive renewal variant not covered. |  |
| VIS-13 | PARTIAL | S/A/P0 | O2 local collection/session assertions passed; report/export assertions not yet executed. |  |
| VIS-14 | NOT RUN | F/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| VIS-15 | BLOCKED | N/D/P0 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| VIS-16 | BLOCKED | B/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| CLI-01 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| CLI-02 | PASS | N/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| CLI-03 | PASS | N/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| CLI-04 | PASS | S/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| CLI-05 | PASS | S/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| CLI-06 | BLOCKED | B/D/P2 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| SVC-01 | PARTIAL | P/C/P1 | Service creation/persistence and receipt dropdown verified; booking selection/duration/staff variant pending. |  |
| SVC-02 | PASS | N/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| SVC-03 | PARTIAL | S/C/P1 | Inline menu value persisted; helper overwrote form price, so default-price assertion not covered. |  |
| SVC-04 | PASS | S/C/P1 | All implemented assertions in the local-browser scenario passed. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/SVC-04-1791640554036.png>) |
| SVC-05 | BLOCKED | B/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| SVC-06 | NOT RUN | N/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| STF-01 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| STF-02 | NOT RUN | P/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| STF-03 | PASS | N/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| STF-04 | NOT RUN | S/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| STF-05 | BLOCKED | B/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| STF-06 | NOT RUN | N/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| ATT-01 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| ATT-02 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| ATT-03 | PASS | N/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| ATT-04 | PASS | B/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| ATT-05 | PASS | S/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| ATT-06 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/ATT-06-1791640095683.png>) |
| ATT-07 | PASS | N/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| ATT-08 | PASS | S/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| ATT-09 | PASS | S/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| ATT-10 | PASS | S/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| ATT-11 | PASS | S/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| ATT-12 | NOT RUN | P/C/P2 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| ATT-13 | PARTIAL | S/C/P1 | Editor Cancel/Escape verified; backdrop and deletion-dialog variants pending. |  |
| ATT-14 | NOT RUN | S/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| ATT-15 | PASS | B/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| ATT-16 | BLOCKED | B/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| SET-01 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| SET-02 | PASS | N/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| SET-03 | NOT RUN | S/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| SET-04 | BLOCKED | B/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| SET-05 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| SET-06 | NOT RUN | B/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| SET-07 | BLOCKED | N/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| SET-08 | PASS | P/C/P2 | All implemented assertions in the local-browser scenario passed. |  |
| BAK-01 | PASS | P/C/P0 | Downloaded and parsed real JSON file; O1 datasets match. Receipt counter omission handled by BAK-08. |  |
| BAK-02 | NOT RUN | S/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| BAK-03 | PASS | N/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| BAK-04 | FAIL | N/A/P0 | JSON restore persists receiptEntries as a string without schema validation. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/BAK-04-1791639719790.png>) |
| BAK-05 | NOT RUN | S/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| BAK-06 | BLOCKED | S/A/P0 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| BAK-07 | NOT RUN | F/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| BAK-08 | FAIL | S/A/P0 | Fresh-profile JSON restore reuses receipt numbers: four records have only three unique numbers. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/BAK-08-1791640122417.png>) |
| BAK-09 | PARTIAL | N/C/P2 | Same-file reselection verified; native picker cancellation not automated. |  |
| BAK-10 | BLOCKED | B/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| BAK-11 | NOT RUN | P/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| RPT-01 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| RPT-02 | NOT RUN | S/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| RPT-03 | NOT RUN | B/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| RPT-04 | NOT RUN | N/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| RPT-05 | NOT RUN | S/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| HIS-01 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| HIS-02 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| HIS-03 | PASS | S/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| HIS-04 | FAIL | S/A/P0 | A deleted membership-sale receipt still appears as 12,600 collection through contract fallback. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/HIS-04-1791640452746.png>) |
| HIS-05 | NOT RUN | S/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| HIS-06 | NOT RUN | P/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| HIS-07 | NOT RUN | B/C/P2 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| EOD-01 | PARTIAL | P/C/P0 | O1 local snapshot/reload verified. DB snapshot assertion blocked: API unavailable. |  |
| EOD-02 | PASS | P/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| EOD-03 | PASS | P/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| EOD-04 | FAIL | B/C/P1 | One client with two paid receipts and one member visit is reported as two distinct total clients. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/EOD-04-1791640660670.png>) |
| EOD-05 | BLOCKED | N/C/P1 | Current-day closeout cannot be selected after Close day immediately advances date (DAY-01). This case was not completed. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/EOD-05-1791640641669.png>) |
| EOD-06 | NOT RUN | P/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| EOD-07 | NOT RUN | F/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| EOD-08 | BLOCKED | P/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| EOD-09 | NOT RUN | P/C/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| EOD-10 | NOT RUN | F/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| XLS-01 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| XLS-02 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/XLS-02-1791640300207.png>) |
| XLS-03 | FAIL | S/C/P1 | Filtered receipt export contains only one visible matching row, contrary to the catalogue requirement to export all two active rows. Export scope needs approval or correction. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/XLS-03-1791640455622.png>) |
| XLS-04 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| XLS-05 | PASS | P/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| XLS-06 | PASS | N/C/P1 | All implemented assertions in the local-browser scenario passed. |  |
| XLS-07 | NOT RUN | F/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| XLS-08 | PASS | B/A/P1 | All implemented assertions in the local-browser scenario passed. |  |
| XLS-09 | NOT RUN | P/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| XLS-10 | NOT RUN | S/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| DAT-01 | PARTIAL | P/C/P0 | Transactions/membership/client/ledger/date persisted offline; other entity variants not yet executed. |  |
| DAT-02 | BLOCKED | P/A/P0 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| DAT-03 | BLOCKED | S/A/P0 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| DAT-04 | BLOCKED | S/A/P0 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| DAT-05 | BLOCKED | S/C/P1 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| DAT-06 | BLOCKED | F/A/P0 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| DAT-07 | BLOCKED | F/A/P0 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| DAT-08 | BLOCKED | F/A/P0 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| DAT-09 | NOT RUN | B/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| DAT-10 | FAIL | N/A/P0 | A wrong-type stored receipt dataset crashes rendering with receiptEntries.filter is not a function. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/DAT-10-1791640450719.png>) |
| DAT-11 | NOT RUN | F/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| DAT-12 | NOT RUN | B/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| DAT-13 | NOT RUN | S/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| DAT-14 | BLOCKED | N/A/P1 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| API-01 | PASS | P/C/P1 | Assertions passed against copied unmodified API with isolated PostgreSQL. |  |
| API-02 | BLOCKED | F/C/P1 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| API-03 | PASS | P/C/P1 | Assertions passed against copied unmodified API with isolated PostgreSQL. |  |
| API-04 | PASS | P/C/P1 | Assertions passed against copied unmodified API with isolated PostgreSQL. |  |
| API-05 | PASS | S/C/P1 | Assertions passed against copied unmodified API with isolated PostgreSQL. |  |
| API-06 | PASS | B/C/P1 | Assertions passed against copied unmodified API with isolated PostgreSQL. |  |
| API-07 | FAIL | N/A/P1 | Copied API accepts invalid receipt dataset structure with HTTP200 instead of rejecting invalid business state. |  |
| API-08 | PASS | P/C/P1 | Live copied API verification with random test-only hashed credentials passed. |  |
| API-09 | PARTIAL | N/C/P0 | Incorrect/empty/null/non-string/over256/unknown identity rejected. Malformed hash and password-case variants not run against configured HTTP server. |  |
| API-10 | PASS | F/C/P0 | Assertions passed against copied unmodified API with isolated PostgreSQL. |  |
| API-11 | PASS | B/C/P1 | Shared per-IP rate limit reached after ten activate/reveal requests; subsequent request429; fresh window succeeds after61s. |  |
| API-12 | PARTIAL | B/A/P1 | Mixed-case/spaced email and empty body checked; sustained load responsiveness not tested. |  |
| API-13 | PARTIAL | S/C/P1 | Schema reapplied twice preserves test rows; full init-db database creation script not executed in this case. |  |
| API-14 | FAIL | N/A/P0 | Copied API returns stored application state with HTTP200 without authentication. |  |
| PRV-01 | PASS | P/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| PRV-02 | BLOCKED | P/C/P1 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| PRV-03 | PARTIAL | S/C/P1 | All three shortcuts hide and persist preference; post-reload shortcut invocation not covered. |  |
| PRV-04 | NOT RUN | B/C/P2 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| PRV-05 | BLOCKED | P/C/P0 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| PRV-06 | BLOCKED | N/C/P0 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| PRV-07 | PARTIAL | F/C/P0 | Network-down variant verified; non-JSON, HTTP-error and 429 server variants blocked. |  |
| PRV-08 | PASS | S/A/P0 | All implemented assertions in the local-browser scenario passed. |  |
| PRV-09 | PARTIAL | S/C/P0 | Browser propagation tested with explicitly mocked successful reveal; no live server password verification. | [Screenshot](<C:/Users/shilpa.e/.copilot/session-state/597f2f47-7b49-4559-a48b-b89c1f3991e9/files/bizora-qa/evidence/PRV-09-1791640579577.png>) |
| PRV-10 | PASS | S/C/P0 | All implemented assertions in the local-browser scenario passed. |  |
| PRV-11 | BLOCKED | S/C/P0 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| PRV-12 | PASS | N/A/P0 | All implemented assertions in the local-browser scenario passed. |  |
| PRV-13 | NOT RUN | N/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| PRV-14 | NOT RUN | F/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| PRV-15 | NOT RUN | P/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| UX-01 | PARTIAL | P/A/P1 | Representative pages navigable at all five widths; visual clipping/all-page destructive-dialog coverage not complete. |  |
| UX-02 | NOT RUN | P/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| UX-03 | NOT RUN | P/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| UX-04 | NOT RUN | P/C/P2 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| UX-05 | NOT RUN | P/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| UX-06 | NOT RUN | B/A/P2 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| UX-07 | NOT RUN | S/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| UX-08 | NOT RUN | N/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| NFR-01 | BLOCKED | P/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| NFR-02 | BLOCKED | P/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| NFR-03 | BLOCKED | P/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |
| NFR-04 | NOT RUN | F/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| NFR-05 | NOT RUN | S/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| E2E-01 | NOT RUN | P/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| E2E-02 | PARTIAL | P/A/P0 | Manager-only O2 workflow passed; Frontdesk role and re-save variant not covered in this E2E execution. |  |
| E2E-03 | BLOCKED | F/A/P0 | Live API on 127.0.0.1:4000 unavailable. No approved isolated PostgreSQL/privacy environment; production/shared data must not be used. |  |
| E2E-04 | NOT RUN | S/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| E2E-05 | NOT RUN | S/A/P0 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| E2E-06 | NOT RUN | P/A/P1 | Not executed in this batch. No evidence and no acceptance claim. Requires additional case-specific fixtures/automation or manual execution. |  |
| E2E-07 | BLOCKED | P/D/P1 | Creator decision required by catalogue; approved business policy/threshold unavailable. |  |

## Required next steps

1. Continue the approved isolated PostgreSQL/API/privacy lane with browser
   integration, bootstrap, offline recovery and DB failure cases.
2. Resolve creator decisions concerning expiry, money rounding, permissions,
   export scope, limits and performance.
3. Execute remaining available manual/automated cases and incomplete variants.
4. Investigate/fix confirmed failures, then rerun original and related cases.
5. Complete supported-browser, print, recovery/concurrency and UAT evidence.
6. Recompute exact counts and apply the master strategy exit criteria.

No statement in the earlier historical execution report overrides this run.
