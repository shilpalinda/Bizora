# Bizora detailed testing plan - 01.04.042

Prepared 2026-10-10 against baseline commit `41b3a55`.
This is a proposed execution plan, not an execution report.
Read the [master strategy](MASTER_TESTING_STRATEGY.md) and
[case catalogue](COMPREHENSIVE_TEST_CASES.md) together.

## 1. Preparation and safety checklist

1. Record source commit, branch, `versionStamp`, `publicVersion`, OS, browser,
   timezone, frontend URL, API URL and test DB name.
2. Obtain creator approval for decisions in strategy section 7.
3. Create a disposable browser profile. Confirm it contains no live Bizora data.
4. Create a dedicated test PostgreSQL database. Have the environment owner set
   its connection configuration locally; do not print or commit credentials.
5. Confirm the API and browser profile cannot access a production database.
6. Preserve any pre-existing local configuration separately. Use synthetic
   credentials for privacy configuration and test-only WhatsApp destinations.
7. Record every reset, fixture import, clock override and backend interruption.
8. Use separate profiles for clean-state, legacy-data and concurrency cases.
9. Do not change system time; use a test browser clock or an isolated test host.
10. Do not execute destructive or outbound-message cases on the shared active
    browser page. This documentation task has not reset that page or its data.

The source-code ZIP in `backup` is different from the in-app JSON data backup.
Neither substitutes for a tested database backup and restore.

## 2. Start and verify the environment

Windows PowerShell commands from the repository root:

```powershell
git rev-parse HEAD
npm.cmd run build
node --test .\server\privacy-auth.test.js
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Run the long-lived frontend command in its own terminal/task. Use the available
port chosen for the test run rather than assuming 5174 is free.
The browser URL is `http://127.0.0.1:5174/` for this example.

For the connected lane, use another terminal, after the environment owner has
configured a dedicated test database:

```powershell
Set-Location .\server
npm.cmd run db:init
node .\configure-privacy.js
npm.cmd start
```

`configure-privacy.js` prompts for activation and account verification passwords
and writes local `privacy-secrets.json`. Use test-only passwords. Its hashes are
not account-login provisioning: normal frontend login still uses the local
account map. Existing server configuration must not be overwritten casually.

Verify in a separate terminal:

```powershell
curl.exe --fail -I http://127.0.0.1:5174/
curl.exe --fail http://127.0.0.1:4000/api/health
```

The current frontend derives the API host from the browser hostname and uses
port 4000. A custom server port or HTTPS deployment requires explicit compatible
configuration before connected tests can pass.

Install dependencies only if the selected command fails because they are missing.
Use `npm.cmd ci` in the affected package directory when its lockfile is the
approved baseline. Do not reinstall a shared environment unnecessarily.

Build warnings must be recorded. A successful build is not proof that the API,
privacy verification, calculations or all browser workflows work.

## 3. Reproducible fixture catalogue

Use a supported backup import for ordinary fixture setup. For legacy/corruption
cases, controlled test-only storage/DB seeding is permitted and must be recorded.
Clear the disposable browser's one-time sync marker only when the bootstrap test
requires it. Keep API/DB state consistent with each fixture to avoid accidental
rehydration of unrelated data.

| Fixture | Contents |
|---|---|
| F0: clean | Empty business records; configured menu and test staff; no previous balances; current business date D |
| F1: basic | Services QA Massage: 2,000, 60 min, staff QA Therapist A; QA Facial: 1,500, 45 min, staff QA Therapist B |
| F2: identities | QA Client Cash `9000000001`; QA Client Card `9000000002`; QA Client UPI `9000000003`; QA Member `9000000004`; use as synthetic values only |
| F3: staff | QA Therapist A without off days; QA Therapist B off on Monday; QA Therapist C with multiple off days |
| F4: packages | QA Eight: 8 sessions, 12,000, 6 months, active; QA Trial: 1 session, 1,000, 1 month; QA Inactive: inactive |
| F5: memberships | Active 8/0 used; active 8/7 used; exhausted 8/8; expired yesterday; expires today; cancelled; two active packages for one phone with different expiry dates |
| F6: legacy | Bare attendance status strings; receipt `items` and legacy payment names; membership visit without `receiptId`; backup missing newly added fields |
| F7: reports | D-1 closed with known balance; D open; D+1 future appointment; deleted receipt; EOD snapshot for D-1 |
| F8: failures | Invalid JSON, valid JSON wrong schema, duplicate IDs, wrong numeric types, quota exhausted, API down, DB down, delayed and reordered PUTs |
| F9: scale | 1,000/10,000 receipts, 1,000 clients, 100 staff, long names/notes and repeated dates; provisional scale requiring approval |

D is the controlled test calendar date in `Asia/Kolkata`. Use ISO dates internally.
Keep test phones as strings, including synthetic leading-zero variants.
Do not use real customer numbers or send messages to these fixture values.

Login roles: Frontdesk, Manager, Superuser using the current local demo accounts.
Obtain the baseline login values locally; exclude passwords from reports.
Each role has a separate browser login run. Reload normally returns to sign-in
because role state is React state, not a persisted authenticated session.

## 4. Independent financial oracles

### Oracle O1: mixed service payments

Starting from F0/F1 with zero prior balance:

| Transaction | Base | GST | Total paid | Towel cash out |
|---|---:|---:|---:|---:|
| Cash service | 2,000 | 0 | 2,000 | 50 |
| Card service, tax 5% | 2,000 | 100 | 2,100 | 0 |
| GPay service, tax 5% | 1,500 | 75 | 1,575 | 0 |
| Expense, Cash | n/a | n/a | n/a | 500 expense, not towel |

Expected:

- Base buckets: Cash 2,000; Card 2,000; GPay 1,500.
- GST buckets: Card 100; GPay 75; Cash 0.
- Gross paid collection: 5,675; towel cash: 50; expenses: 500.
- Net receipt after towel: 5,625; EOD closing: **5,125**.
- Three paid receipt records; three distinct paid clients using F2 identities.
- Current Daily Summary base receipts: 5,500; payments including towel: 550;
  zero-opening base-only closing: 4,950. Difference from EOD is GST 175.
  Record this as a characterization and obtain approval or raise a defect;
  do not assert that both balances are the same.

### Oracle O2: membership sale and visits

Starting clean, sell QA Eight to QA Member by Card:

- Package base 12,000; GST 600; amount paid **12,600**.
- Exactly one membership contract, one `New Membership` receipt and one
  auto-linked client. No separate duplicate membership-fee collection.
- Redeem two sessions: two `Membership Session` receipts with zero price, GST
  and total; two linked visits; used sessions 2, remaining 6.
- Gross collection remains **12,600**.
- EOD unique membership clients 1; membership sessions used 2; memberships sold
  1; active receipt count 3.
- Soft-delete one visit receipt: used 1, remaining 7, one linked visit removed;
  restore it: used 2, remaining 6 again.
- Re-saving the same active Member receipt must not deduct another session.

### Oracle O3: carry-forward balance

Seed D-1 with a paid total 1,050, towel cash 50 and expenses 100.
Opening for D must be **900**. Add O1:
EOD closing for D must be **6,025**. D+1 opening must equal the approved
closed-day net balance. Check every view against its documented gross/base
semantics; do not use ambiguous "cash balance" labels as an oracle.

### Oracle O4: boundaries

- Normal receipt price 19.99 at 5%: current whole-rupee GST 1; stored total 20.99.
- Membership amount 19.99 at 5%: current paise GST 1; total 20.99.
- Normal receipt price 10.01 at 5%: current GST 1; total 11.01.
- Membership amount 10.01 at 5%: current GST 0.50; total 10.51.
- Expiry equal to calendar D is currently not expired; D-1 is expired.
- Check in 09:15/check out 18:00: 8h 45m; equal/reversed times rejected when
  both are supplied for Present/Half Day.
- Time 11:45 AM + 60 min: 12:45; 11:30 PM + 60 min: 00:30.

These document current arithmetic boundaries. The creator must approve rounding,
overnight attendance and membership calendar policy before acceptance sign-off.

## 5. Execution waves and dependencies

| Wave | Work | Prerequisite | Deliverable |
|---|---|---|---|
| W0 | Baseline, safe environment, creator decisions | None | Environment record, approved oracles |
| W1 | REL/AUTH/DASH smoke; basic API health | W0 | Runnable UI/API baseline |
| W2 | CLI/SVC/STF/PKG/SET fixture and validation tests | W1 | Stable reference data |
| W3 | APT/RCP/MEM/VIS/EXP/ATT positive and negative tests | W2 | Verified business transactions |
| W4 | REC/LED/RPT/EOD/HIS/XLS and independent balances | W3 | Reconciled lifecycle and real file evidence |
| W5 | BAK/DAT/API/PRV failure, recovery and concurrency | Isolated W0 environment plus needed W2/W3 fixtures | Failure/recovery evidence |
| W6 | UX/performance/browser matrix and E2E/UAT | W3-W5 findings addressed | Release recommendation |

W5 can run in parallel only on isolated data/configuration. Tests that modify
shared privacy files, DB rows or business date must not run concurrently.

### P0 smoke selector

Run at each candidate build:

`REL-01`, `AUTH-01`, `AUTH-02`, `RCP-01`, `RCP-02`, `RCP-03`, `RCP-14`,
`MEM-01`, `MEM-02`, `VIS-01`, `VIS-02`, `REC-01`, `REC-03`, `DAY-01`,
`DAY-04`, `EOD-01`, `DAT-01`, `BAK-02`, `PRV-01`, `PRV-05`, `E2E-01`.

A passing smoke suite is necessary but insufficient for release.

## 6. Execution procedure for every case

1. Select the case ID and record C/A/D expectation class, priority, role,
   environment lane, fixture and prerequisites.
2. Reset only the named disposable fixture; record baseline record counts,
   counters, business date and relevant balances.
3. Execute the catalogue's steps in order; parameterized values are separate
   executions, not one representative sample.
4. Capture validation or state transition and relevant stored records.
5. For money/session cases, calculate expected results independently.
6. For API-dependent cases, inspect HTTP status and persisted DB values.
7. Reload or use a new profile when required; confirm state is durable.
8. Record actual results and link sanitized evidence.
9. Assign PASS/FAIL/BLOCKED/NOT RUN; PARTIAL is not a pass.
10. Remove only test-created data, close test-only connections and restore
    configuration as agreed. Preserve evidence and failing fixtures safely.

Native HTML validation is acceptable if it prevents invalid persistence and is
accessible. Record that it intercepted submission; do not claim a JavaScript
error-message branch ran.

## 7. Evidence and results template

Use a spreadsheet or test-management tool with one execution row per
case/parameter/role/browser combination:

| Field | Required content |
|---|---|
| Run ID | `BZ-01.04.042-YYYYMMDD-sequence` |
| Case ID / parameter | Catalogue ID plus exact input partition |
| Build | Commit and version stamp |
| Tester / timestamp | Owner and local time with timezone |
| Environment | Browser/version, OS, viewport, frontend/API, isolated DB identifier |
| Prerequisites | Fixture, role, privacy state, day state |
| Expected | Independent values and required output shape |
| Actual | Observed values, errors, counts and persistence |
| Evidence | Redacted screenshot/log/HTTP/DB/file references |
| Status | NOT RUN, PASS, FAIL, BLOCKED, PARTIAL or NOT APPLICABLE |
| Defect / decision | Linked ID, severity, owner and reason |
| Cleanup | Test-data/configuration disposition |

Rules:

- NOT RUN is the initial state of every case in the new catalogue.
- PASS requires all assertions and requested persistence/output checks.
- BLOCKED covers unavailable lanes and unresolved D-class requirements.
- NOT APPLICABLE needs creator approval and explanation.
- PARTIAL covers missing evidence such as a download not inspected.
- Historical results must not be copied into this version's execution status.
- Do not label opening WhatsApp as successful message delivery.

## 8. Defect management and retest

Severity:

- Critical: data loss, unauthorized disclosure, incorrect money/session state or
  inability to operate/recover safely.
- High: core business workflow blocked, closed-day integrity broken, widespread
  incorrect reports or role rules.
- Medium: validation, export, compatibility or workflow issue with a workaround.
- Low: cosmetic issue without functional impact.

Defect record:

```text
Defect ID / concise title:
Case ID(s), version stamp, commit:
Severity / execution priority:
Fixture, role, browser, API/DB lane:
Preconditions and exact reproduction:
Expected result with independent calculation:
Actual result and persistence impact:
Sanitized evidence:
Reproducibility / affected scope:
Owner / decision / workaround:
Fix commit / retest result / regression cases:
```

Retest the original failure on the fix build, then related surfaces:

| Changed area | Mandatory related regression |
|---|---|
| Receipt/tax | RCP, REC, LED, RPT, EOD, XLS, O1/O3 |
| Membership/session | MEM, VIS, REC, HIS, EOD, XLS, O2 |
| Day/date | DAY, APT, EXP, ATT, MEM, VIS, HIS |
| Storage/API | DAT, API, BAK, counter tests and E2E |
| Privacy | PRV, XLS, print, login, all protected pages |
| Attendance | STF, ATT, HIS, role matrix and legacy records |

## 9. Compatibility and proposed performance targets

Baseline: Chrome and Edge desktop; Firefox and Safari/WebKit where the creator
declares support. Mobile: 360/390 pixels; tablet: 768/1024; desktop: 1440.
Test at 100% and 200% zoom, keyboard-only and one screen-reader/browser pairing.

Proposed limits, requiring creator approval:

- First interactive view <= 3 seconds after navigation on recorded test hardware
  with warm assets and healthy API.
- Save acknowledgement <= 1 second locally; durable server write <= 3 seconds
  under a healthy connected test lane.
- Search/filter <= 500 ms for 1,000 current-day receipts.
- XLSX export <= 10 seconds for 1,000 current-day receipts.
- No loss/duplication or inability to recover at the approved maximum dataset.

Record dataset, hardware, network, cold/warm cache and at least five measured
trials; report median and maximum. These are proposed thresholds, not measured
claims or existing product guarantees. Raise memory/date-loop limits with the
creator if F9 is beyond the approved operating scale.

## 10. UAT and release decision

Operators complete:

1. Frontdesk: appointment -> arrival/completion -> normal/member receipt ->
   expense -> attendance, with accurate search and client linkage.
2. Manager: package/target setup -> new membership -> day reconciliation ->
   closeout -> historical review -> actual XLSX inspection.
3. Superuser: deleted-receipt recovery/permanent deletion in test data ->
   privacy verification -> JSON backup/restore -> failure recovery.

The creator reviews financial labels/rounding, role permissions, expiry policy,
data protection, all open defects and remaining blocked cases.
Apply the strategy's exit criteria before recommending release.

Final report must include exact execution counts by status and module, approved
exceptions, unresolved risks, evidence, tested environments and signatories.
Do not commit or push test documents/results unless explicitly requested.
