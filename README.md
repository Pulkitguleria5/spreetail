# Shared Expenses App - Flatmates Expense Tracker

Welcome to the Shared Expenses App, a modern, premium web application built to migrate a chaotic shared expense spreadsheet into a structured, relational database with robust anomaly detection, multi-currency support, timeline-based memberships, and simplified debt settlements.

Built using **React (Frontend)**, **Node.js/Express (Backend)**, and **SQLite + Sequelize ORM (Relational Database)**.

---

## Key Features Implemented

1. **Relational Database Migration**: Fully migrated from MongoDB to a local SQLite database, satisfying the "relational DB only" requirement.
2. **Interactive CSV Import Resolution (Meera's Request)**: 
   - Drag/upload `expenses_export.csv`.
   - The app scans and flags **15+ distinct anomalies** (casing errors, name typos, formatted currencies, percentage sums, duplicate entries, timeline conflicts, negative refunds, zero amounts).
   - Allows users to review, edit, skip duplicates, normalize splits, and map guest users in the UI before executing.
   - Automatically stores the final **Import Report** audit log in the database.
3. **Timeline-Based Group Membership (Sam & Meera's Requests)**:
   - Tracks when flatmates join and leave the group.
   - Prevents members from being charged for expenses dated before they joined or after they left.
4. **Multi-Currency Support & Exchange Rates (Priya's Request)**:
   - Allows logging expenses in **USD** or **INR**.
   - Converted amounts are stored in INR for balance tracking (using a default customizable rate of 1 USD = 83 INR), while original USD amounts are preserved on cards.
5. **No Magic Numbers Balance Breakdown (Rohan's Request)**:
   - Users can expand any flatmate's balance to see the exact itemized list of expenses, showing who paid, their share, and the net impact on their ledger.
6. **Simplified Settlement Plan (Aisha's Request)**:
   - Computes a simplified payment plan ("Who pays whom, how much") using a greedy net-balance minimization algorithm.

---

## Setup & Running the Application

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher)
* `npm` package manager

### 1. Backend Server Setup
1. Open a terminal and navigate to the server folder:
   ```bash
   cd expense-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. The server uses environment configurations defined in `expense-server/.env`. (SQLite will automatically initialize `database.sqlite` in this folder upon startup).
4. Run the development server:
   ```bash
   npm run dev
   ```
   The backend server will run on `http://localhost:5001`.

### 2. Frontend Client Setup
1. Open a new terminal and navigate to the client folder:
   ```bash
   cd expense-react-client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## How to Test the CSV Import Flow

1. Log in to the application (or register an account).
2. Create a default test group by clicking **Import CSV** in the top navigation bar, then clicking **Create Flatmates Group**. This initializes a group called `Flatmates Group` containing the emails of Aisha, Rohan, Priya, Meera, Sam, and Dev.
3. Choose `Flatmates Group` from the **Select Target Group** dropdown.
4. Select the file `expense-server/uploads/c5b9c171cd67dc43587f87e6e023d5f2` (which is the raw `expenses_export.csv` file) and click **Upload & Scan**.
5. The interactive anomaly resolution grid will load. You can review all 15+ anomalies (warnings in amber, errors in red).
6. Resolve the blocking errors:
   - For percentage split sums (e.g. Row 15), click **Auto-Normalize to 100%**.
   - For guest splits (e.g. Row 23 with Kabir), click **Absorb Guest Share (Dev)**.
   - For timeline conflicts (e.g. Rows 36 and 40), click **Override Timeline Check** or choose to skip those rows.
   - For duplicates (e.g. Rows 5, 6, 24, 25), you can toggle them to **Skipped** to clean up the records.
7. Select a payer from the dropdown for Row 13 (Missing Payer).
8. Once all indicators are green, click **Approve & Import**.
9. The final **Import Report** audit summary will load, showcasing successfully imported rows and actions logged.
10. Navigate back to the **Groups** tab, select your group, and verify the balances, simplified settlement plan, and Rohan's itemized breakdowns!
