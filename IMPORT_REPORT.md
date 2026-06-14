# Import Report - CSV Ingestion Audit Log

This report documents the actual scan results and resolution actions logged by the Shared Expenses App when importing the `expenses_export.csv` file. 

* **Import Batch ID**: `imp_batch_20260315_001`
* **Target Group**: `Flatmates Group`
* **Status**: `Successfully Approved & Ingested`

---

## Ingestion Summary Table

| Row # | Expense Description | Original Payer | Detected Anomaly | Severity | Action Taken / Resolution |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **5** | Dinner at Thalassa | Dev | Duplicate entry (identical to Row 6) | WARNING | **Skipped** (Excluded from final database ingestion) |
| **6** | Dinner at Thalassa | Dev | None (Base duplicate reference) | INFO | **Imported** (Created Expense ID: 5) |
| **7** | Cab to Thalassa | Priya | Formatted currency string (`"1,200"`) | INFO | **Normalized** (Parsed commas and imported as `1200.00`) |
| **9** | Drinks | priya | Incorrect user casing (`priya` instead of `Priya`) | WARNING | **Auto-Corrected** (Standardized to user email in group) |
| **10** | Snacks | Rohan | Floating point precision (`899.995`) | INFO | **Rounded** (Rounded to two decimal places: `900.00`) |
| **11** | Shopping | Priya S | Name typo/name mismatch (`Priya S`) | WARNING | **Mapped & Resolved** (Mapped `Priya S` to flatmate `Priya`) |
| **13** | Fuel | *[Blank]* | Missing Payer | ERROR | **Manually Resolved** (Assigned payer to `Dev` in importer grid) |
| **14** | Rohan paid Aisha back | Rohan | Peer-to-peer payment logged as expense | WARNING | **Reclassified** (Created peer settlement, bypassing splits) |
| **15** | Grocery | Aisha | Split percentages sum to 110% | ERROR | **Auto-Normalized** (Recalculated splits proportionally to 100%) |
| **20** | Villa booking | Priya | Multi-currency (USD: `$300`) | INFO | **Converted** (Stored as `24900.00 INR` using rate 1 USD = 83 INR) |
| **21** | Scooter Rental | Priya | Multi-currency (USD: `$45`) | INFO | **Converted** (Stored as `3735.00 INR` using rate 1 USD = 83 INR) |
| **23** | Scuba Diving | Dev | Guest split includes `Kabir` (non-flatmate) | WARNING | **Absorbed** (Dev absorbed guest Kabir's share of `125.00 USD`) |
| **24** | Dinner | Aisha | Duplicate conflict (matching Row 25) | WARNING | **Skipped** (Omitted in favor of Row 25 after review) |
| **25** | Dinner | Rohan | Duplicate conflict (matching Row 24) | WARNING | **Imported** (Imported valid record, Expense ID: 12) |
| **26** | Parasailing Refund | Priya | Negative amount refund (USD: `-$30`) | INFO | **Processed** (Created negative expense split, credited participants) |
| **27** | Lunch | rohan | Bad date format (`Mar-14`) & casing | WARNING | **Normalized** (Parsed to `2026-03-14` and normalized casing) |
| **28** | Breakfast | Rohan | Missing currency | WARNING | **Defaulted** (Assigned default group currency `INR`) |
| **31** | Parking | Dev | Zero amount expense | WARNING | **Imported** (Recorded as zero-value audit trace) |
| **34** | Water bottles | Aisha | Ambiguous date (`04-05-2026`) | WARNING | **User Confirmed** (Confirmed format as `04-05-2026` / May 4th) |
| **36** | Sightseeing | Meera | Timeline conflict (Meera left group end of March) | WARNING | **Timeline Resolved** (Meera excluded; share split among active members) |
| **40** | Electricity Bill | Rohan | Timeline conflict (Sam joined mid-April) | WARNING | **Timeline Resolved** (Sam excluded; share split among active members) |
| **42** | Go-Karting | Dev | Redundant equal split details | INFO | **Cleared** (Processed as clean EQUAL split) |

---

## Verification & Audit Trail

All resolved rows have been stored inside the SQLite relational database under the **`Expenses`** and **`ExpenseSplits`** tables. The audit log itself is saved in the **`ImportReports`** table, which can be queried directly to review historical import sessions.
