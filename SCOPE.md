# SCOPE.md - Anomaly Log & Database Schema

## Relational Database Schema

We migrated from MongoDB (NoSQL) to SQLite (relational) using Sequelize ORM. The relational model consists of the following tables:

### 1. `Users` Table
Tracks user details, roles, credits, and subscription details.
* `id` (INTEGER, Primary Key, Auto-increment)
* `name` (STRING, Nullable: False)
* `email` (STRING, Unique, Nullable: False)
* `password` (STRING, Nullable: True)
* `googleId` (STRING, Nullable: True)
* `role` (STRING, Default: 'admin', Nullable: False)
* `adminId` (INTEGER, Nullable: True)
* `credits` (INTEGER, Default: 1)
* `subscriptionId` (STRING, Nullable: True)
* `subscriptionPlanId` (STRING, Nullable: True)
* `subscriptionStatus` (STRING, Nullable: True)
* `subscriptionStart` (DATE, Nullable: True)
* `subscriptionEnd` (DATE, Nullable: True)
* `subscriptionLastBillDate` (DATE, Nullable: True)
* `subscriptionNextBillDate` (DATE, Nullable: True)
* `subscriptionPaymentsMade` (INTEGER, Nullable: True)
* `subscriptionPaymentsRemaining` (INTEGER, Nullable: True)

### 2. `Groups` Table
Represents shared expense groups and their status.
* `id` (INTEGER, Primary Key, Auto-increment)
* `name` (STRING, Nullable: False)
* `description` (STRING, Nullable: True)
* `adminEmail` (STRING, Nullable: False)
* `createdAt` (DATE, Default: NOW)
* `thumbnail` (STRING, Nullable: True)
* `paymentAmount` (DOUBLE, Default: 0)
* `paymentCurrency` (STRING, Default: 'INR')
* `paymentDate` (DATE, Nullable: True)
* `paymentIsPaid` (BOOLEAN, Default: False)

### 3. `GroupMembers` Table
A junction table representing user memberships in groups over time. This structure solves timeline-based split issues.
* `id` (INTEGER, Primary Key, Auto-increment)
* `groupId` (INTEGER, Foreign Key referencing `Groups.id`, On Delete: CASCADE)
* `email` (STRING, Nullable: False)
* `joinedAt` (DATE, Default: NOW, Nullable: False)
* `leftAt` (DATE, Nullable: True)

### 4. `Expenses` Table
Stores header information for logged expenses.
* `id` (INTEGER, Primary Key, Auto-increment)
* `groupId` (INTEGER, Foreign Key referencing `Groups.id`, On Delete: CASCADE)
* `amount` (DOUBLE, Converted base value in INR, Nullable: False)
* `description` (STRING, Nullable: False)
* `date` (DATE, Default: NOW, Nullable: False)
* `paidBy` (STRING, email of the payer, Nullable: False)
* `originalAmount` (DOUBLE, Amount in original currency, Nullable: True)
* `currency` (STRING, Default: 'INR')
* `exchangeRate` (DOUBLE, Default: 1.0)
* `splitType` (STRING, Default: 'EXACT', e.g. EQUAL, EXACT, PERCENTAGE, SHARE)
* `settled` (BOOLEAN, Default: False)
* `imported` (BOOLEAN, Default: False)
* `importBatchId` (STRING, Nullable: True)
* `excludedMembersData` (TEXT representing JSON array of excluded member emails)

### 5. `ExpenseSplits` Table
Details the exact allocation of expenses among participants.
* `id` (INTEGER, Primary Key, Auto-increment)
* `expenseId` (INTEGER, Foreign Key referencing `Expenses.id`, On Delete: CASCADE)
* `userEmail` (STRING, Nullable: False)
* `splitAmount` (DOUBLE, amount in base currency INR, Nullable: False)

### 6. `ImportReports` Table
Persists an audit log of all data anomalies detected during CSV file imports.
* `id` (INTEGER, Primary Key, Auto-increment)
* `rowNumber` (INTEGER, Nullable: False)
* `anomalyType` (STRING, Nullable: False)
* `severity` (STRING, Default: 'WARNING', e.g., INFO, WARNING, ERROR)
* `originalDataText` (TEXT, raw CSV row stored as JSON string)
* `actionTaken` (STRING, action taken by user/importer)
* `importBatchId` (STRING, Nullable: False)
* `createdAt` (DATE, Default: NOW, Nullable: False)

---

## Anomaly Log - CSV Data Problems & Resolutions

The spreadsheet import contains the following deliberate anomalies. Here is how our importer detects and resolves them:

| Row(s) | Problem / Anomaly | Severity | Detection Rule | Resolution Policy |
| :--- | :--- | :--- | :--- | :--- |
| **5 & 6** | Duplicate expense log: Same dinner, same date (08-02-2026), amount (3200), payer (Dev), and split. | **WARNING** | Check if same date, amount, payer, and split exist on other rows or in DB. | Surfaced in duplicate list. User decides whether to keep, merge, or skip. Defaults to skip one. |
| **7** | Formatted string amount: `"1,200"` contains a comma. | **INFO** | Amount contains non-numeric chars like commas. | Remove formatting, parse as float, and surface warning. |
| **9, 27** | Lowercase/Space name casing: `priya` (Row 9) and `rohan ` (Row 27). | **WARNING** | String case-insensitive match on user names. | Standardize to DB casing (`Priya`, `Rohan`), trim spaces. |
| **10** | Floating point precision: `899.995` has 3 decimal places. | **INFO** | Amount string has > 2 decimal places. | Round to 2 decimal places (`900.00`). |
| **11** | Name typo: `Priya S` paid instead of `Priya`. | **WARNING** | Prefix match or Edit Distance matching with known flatmates. | Auto-suggest name mapping (`Priya`) for user confirmation. |
| **13** | Missing Payer: `paid_by` field is blank. | **ERROR** | `paid_by` is empty or null. | Flag as error (isImportable = false). User must select payer from dropdown to proceed. |
| **14** | Settlement logged as expense: description "Rohan paid Aisha back", missing split_type. | **WARNING** | Description contains "paid back" and split_type is empty. | Convert to peer-to-peer settlement payment (Credit Rohan, Debit Aisha). |
| **15** | Percentage split mismatch: percentages sum to 110% (Aisha 30, Rohan 30, Priya 30, Meera 20). | **ERROR** | Split percentages sum != 100%. | Flag as error. Auto-normalize button scales them proportionally to sum to 100%. |
| **20, 21, 23, 26** | Multi-currency (USD): villa bookings, rentals, and refunds in USD. | **INFO** | Currency field is `USD`. | Convert to base currency INR using exchange rate (1 USD = 83 INR). Store both original and converted. |
| **23** | Guest Split (Non-group member): split includes `Dev's friend Kabir` who isn't a flatmate. | **WARNING** | Split member is not in the group member list. | Highlight guest. User chooses to add Kabir as temp member or let Dev absorb Kabir's share. |
| **24 & 25** | Conflict / Duplicate: Row 24 (Aisha logged 2400) vs Row 25 (Rohan logged 2450) for Thalassa dinner. | **WARNING** | Matching dinner event on same date with different payers/amounts. | Surface conflict. User selects which record is valid and skips/merges the other. |
| **26** | Negative amount: `-30` USD (Parasailing refund). | **INFO** | Amount is negative. | Process as valid refund, reducing the split balances of participants. |
| **27** | Inconsistent date format: `Mar-14` instead of `DD-MM-YYYY`. | **WARNING** | String does not match standard DD-MM-YYYY date regex. | Parse using common date-string structures. Convert to standardized date `2026-03-14`. |
| **28** | Missing currency: currency field is empty. | **WARNING** | Currency field is empty. | Assign default currency (`INR`). |
| **31** | Zero amount expense: `0` INR. | **WARNING** | Amount is exactly 0. | Flag warning. Import allowed but noted as 0 effect. |
| **34** | Ambiguous date format: `04-05-2026` but note says "is this April 5 or May 4?". | **WARNING** | Specific descriptor tag matching. | Prompt user to confirm format (defaulting to May 4th/DD-MM-YYYY). |
| **36** | Left group split: Meera in split list on April 2nd, but she left at end of March. | **WARNING** | Expense date is after member's left date in `GroupMembers`. | Flag anomaly. User chooses to keep Meera in split or exclude her (auto re-splitting among active members). |
| **40** | Join group split: March electricity split doesn't affect Sam (joined in mid-April). | **WARNING** | Expense date is before member's joined date in `GroupMembers`. | Flag anomaly. Exclude Sam from split automatically since he wasn't a member on that date. |
| **42** | Redundant split details: split_type is equal but split_details lists shares. | **INFO** | split_type is equal but split_details is populated. | Verify shares are equal, strip details, import as equal. |
