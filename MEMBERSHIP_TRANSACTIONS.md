# Unified membership transactions

Membership purchases automatically create one linked `New Membership` receipt
on the working date. Package price and actual GST/payment are counted once.
The membership stores its receipt link.

Confirming a member session creates one `Membership Session` receipt and one
linked visit. Its collected price and tax are zero; it deducts exactly one
session. Editing the same receipt does not deduct again. Appointment membership
actions prefill client/service/staff and prevent a second redemption for the same
appointment. Selecting or navigating to a member does not itself redeem a session.
Session confirmation is blocked on a closed working day.

The compact Receipt grid uses 12 columns: Date, Client, Phone, Dur., Member,
Price, Payment, Tax, Staff, Towel, Notes and Actions.
Service, Quantity and Appointment Reference are not shown. Service is still
selected in Add/Edit Receipt, saved with the record and searchable.
Percentage-based column widths fit the desktop panel without horizontal scrolling.
Small screens retain an internally scrollable 700px table for readability.
Membership displays `✓ Member 4/8` for redeemed sessions and a dash for
normal paid visits. The XLSX export includes the same Membership column.
The main `All Visit & Payment Activity` grid combines all active working-day
paid visits, membership redemptions and membership purchases. Redeemed sessions
display `Membership` in Payment Mode; the saved method and form option remain
`Member`. GPay (including legacy UPI), Cash and Card retain their paid labels.
Deleted activity stays in the separate, restorable Deleted Receipts grid.
Notes include package,
sessions, session used and membership status without changing saved client notes.
XLSX uses the same data columns (without interactive Actions).
Dates use DD-MM-YYYY, currency uses INR, and payment modes have distinct badges.
Saving updates the grid immediately, clears filters and shows newest rows first.
Edit opens the existing record; Delete moves it to a collapsible Deleted Receipts
grid with original details and Restore. Permanent deletion remains a separate,
explicit administrator action.
Only the current working day's rows appear in Receipts.
The date control displays that working date; historical dates use Day Report.

Settings -> Day Report retains previous-day transactions and provides distinct
paid/member client counts, sessions, purchases, receipt counts and collections.
End-of-day totals and WhatsApp reports use the same transaction summary logic.
A person appearing in both paid and member activity is counted once in total
clients, while appearing in each relevant category.

Deleted linked purchases do not reappear as collected income through package
fallback. Legacy purchases/visits without receipts receive receipt links after
state hydration without deducting sessions or adding ledger contributions again.
Historical saved closeout snapshots remain unchanged.

Existing membership tax policy is preserved: digital membership payments incur
5% GST; Cash/Other do not. Session usage never collects the package price again.

Payment Mode is a required dropdown: GPay, Cash, Card or Member. Member keeps
Membership Details directly below the dropdown until saving, with a read-only
zero price and zero tax. Invalid membership visits disable Save and also fail
save-time validation. Incomplete phone numbers cannot fall back to name lookup;
duplicate client names require a full phone number. New redemptions and restores
check start date, expiry, cancellation and remaining sessions against the working
date. Editing an already redeemed session retains its deduction, including after
expiry or exhaustion. Switching to paid restores the session; switching back
deducts only on save. Delete reverses the deduction and restore reapplies it.

Targeted automated checks:

```powershell
node --test .\src\receipt-membership.test.js .\src\transaction-summary.test.js .\server\privacy-auth.test.js
npm.cmd run build
```

## Verification

The focused receipt/membership regression run passed all 14 isolated browser scenarios:
four payment modes; zero-charge session/edit/export; appointment deduplication;
closeout confirmation and collection totals; historical/legacy reconciliation;
deletion and permanent deletion; multiple ledger rows; Member receipt
delete/restore; future-day appointment separation; and automatic closeout after
legacy receipt repair.
The original receipt-register scenario also verified the then-current 12-column order, immediate
row display under previously active filters, edit/cancel/delete, retained data,
hide/show and restore. XLSX retained membership details in Service and Notes.

All eight Node tests passed (seven transaction-summary tests and the existing
password test). The production build passed with the existing bundle-size warning.
These results validate this change, not the entire 276-case platform catalogue.

### Payment Mode and Membership Selection follow-up

The latest focused Node run includes eight receipt-membership tests and seven
transaction-summary tests. Browser checks on a separate test origin verified:
the four dropdown options; membership details directly below Payment Mode;
zero price/tax; no deduction before save; save and edit without double deduction;
Member-to-paid and paid-to-Member conversion; delete and restore; all paid modes;
summary totals including configured GST; persistence after reload; missing,
expired, exhausted, cancelled and not-yet-started membership warnings; and editing
the final redeemed session. The actual XLSX file was parsed to verify its
Membership column and zero-charge Member row. The grid now has 13 columns.

Browser tests used isolated local storage with mocked API responses and did not
modify existing business records. Backend/database synchronization was not tested
because the local backend was unavailable. The production build passed with the
existing bundle-size warning.
