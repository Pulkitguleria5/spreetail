# DECISIONS.md - Decision Log

This log documents the significant architectural and product design decisions made while building the Shared Expenses App, detailing the options considered and the rationale behind the chosen paths.

---

## 1. Database Migration: NoSQL to Relational (SQLite + Sequelize)

### Options Considered
1. **Option A: Keep MongoDB (NoSQL)**: Already integrated in the codebase.
2. **Option B: Migrate to SQLite using Sequelize (Relational)**: Relational DB setup running locally in-process without external server dependencies.
3. **Option C: Migrate to PostgreSQL (Relational)**: External database server requiring installation and credentials.

### Chosen Path & Rationale
We chose **Option B (SQLite + Sequelize)**. 
* *Relational Requirement*: Satisfies Requirement #5 ("Use relational DBs only"). 
* *Zero Setup*: SQLite is highly portable, file-based, and fits easily into a node development environment.
* *ORM Control*: Sequelize provides clean schema definitions, transaction safety, and associations (joins) between users, groups, memberships, and splits, which are crucial for this relational model.

---

## 2. CSV Import Architecture: Interactive Wizard vs. Silent Guessing

### Options Considered
1. **Option A: Silent Guessing / Auto-Correction**: Make a guess for each of the 12+ anomalies, import immediately, and display a read-only report afterwards.
2. **Option B: Reject and Crash**: Fail the import on the first error, instructing the user to edit the CSV manually.
3. **Option C: Interactive Resolution Wizard**: Parse the CSV, scan for anomalies, and present warnings and errors in an interactive dashboard where the user can resolve typos, skip duplicates, normalize splits, and confirm details before execution.

### Chosen Path & Rationale
We chose **Option C (Interactive Resolution Wizard)**.
* *PDF Instruction*: The PDF explicitly states: "A crashed import and a silent guess are both failing answers."
* *Meera's Request*: Meera wanted to approve anything deleted or changed: "Clean up the duplicates — but I want to approve anything the app deletes or changes."
* *Data Integrity*: User gets full control. For example, if percentages don't sum to 100%, they can normalize them. If a payer is missing, they select them from a dropdown instead of the app guessing.

---

## 3. Currency Conversion Policy: Base Currency INR & USD Conversion

### Options Considered
1. **Option A: Multi-currency Ledger**: Maintain distinct balances in USD and INR for each user.
2. **Option B: Auto-Conversion to INR**: Convert all USD expenses to INR using a standard historical rate (e.g. 1 USD = 83 INR) and store only INR.
3. **Option C: Converted Ledger + Audit Log**: Convert foreign currencies to INR for splits/balances, but record the original amount, original currency, and exchange rate on the expense table for auditability.

### Chosen Path & Rationale
We chose **Option C (Converted Ledger + Audit Log)**.
* *Priya's Request*: Priya pointed out that "Half the trip was in dollars. The sheet pretends a dollar is a rupee. That can't be right."
* *Uniform Balances*: Converting to a single base currency (INR) allows the app to return "one number per person" (Aisha's request).
* *Auditability*: Storing the original USD amount and exchange rate on the expense card allows Rohan to verify splits exactly without "magic numbers". We used 1 USD = 83 INR as the default rate, reflecting March 2026 trip conditions.

---

## 4. Time-Based Group Membership

### Options Considered
1. **Option A: Static Members List**: Represent group members as a simple array of emails. Membership changes overwrite the list.
2. **Option B: Soft-deletion Timeline (Junction Table)**: Store member relationships with `joinedAt` and `leftAt` timestamps. Check that expense dates fall inside membership windows.

### Chosen Path & Rationale
We chose **Option B (Soft-deletion Timeline)**.
* *Sam's Request*: Sam asked why March electricity affected his balance since he moved in mid-April.
* *Meera's Request*: Meera left at the end of March, so April expenses shouldn't affect her.
* *Historical Integrity*: By checking `joinedAt <= expenseDate <= leftAt`, the app ensures new members are not billed for past costs, and old members are not billed for future costs, while correctly retaining their historical liabilities.

---

## 5. Debt Settlement Simplification: Greedy Minimizer

### Options Considered
1. **Option A: Pairwise Settlements**: Every participant pays back their specific net share to everyone else. (Leads to $N(N-1)/2$ transactions).
2. **Option B: Greedy Minimizer Algorithm**: Match the largest debtor with the largest creditor, settle, update balances, and repeat. (Minimizes number of transactions to at most $N-1$).

### Chosen Path & Rationale
We chose **Option B (Greedy Minimizer)**.
* *Aisha's Request*: Aisha asked for "one number per person. Who pays whom, how much, done."
* *Usability*: The greedy algorithm reduces transaction friction by simplifying paths (e.g., instead of A paying B and B paying C, A pays C directly).
