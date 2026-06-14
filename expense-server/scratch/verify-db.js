const { sequelize, User, Group, GroupMember, Expense, ExpenseSplit, ImportReport } = require('../src/model');

const runVerification = async () => {
  try {
    console.log("Syncing database...");
    await sequelize.sync({ force: true });
    console.log("Database synced successfully.");

    console.log("Creating test user...");
    const user = await User.create({
      name: "Priya",
      email: "priya@example.com",
      credits: 5
    });
    console.log("Created User:", user.name, "with credits:", user.credits);

    console.log("Creating test group...");
    const group = await Group.create({
      name: "Flatmates Group",
      adminEmail: "priya@example.com"
    });
    console.log("Created Group:", group.name);

    console.log("Creating group memberships...");
    const m1 = await GroupMember.create({ groupId: group.id, email: "priya@example.com", joinedAt: new Date("2026-02-01") });
    const m2 = await GroupMember.create({ groupId: group.id, email: "sam@example.com", joinedAt: new Date("2026-04-15") });
    console.log("Created Memberships for Priya and Sam.");

    console.log("Creating an expense split...");
    const expense = await Expense.create({
      groupId: group.id,
      amount: 1200,
      description: "Electricity bill",
      paidBy: "priya@example.com",
      splitType: "EQUAL"
    });

    const s1 = await ExpenseSplit.create({ expenseId: expense.id, userEmail: "priya@example.com", splitAmount: 600 });
    const s2 = await ExpenseSplit.create({ expenseId: expense.id, userEmail: "sam@example.com", splitAmount: 600 });
    console.log("Created expense split.");

    console.log("Retrieving expense splits from DB...");
    const retrieved = await Expense.findByPk(expense.id, {
      include: [{ model: ExpenseSplit, as: 'split' }]
    });
    console.log("Retrieved Expense:", retrieved.description, "Amount:", retrieved.amount);
    console.log("Splits count:", retrieved.split.length);
    retrieved.split.forEach(s => {
      console.log(` - Member: ${s.userEmail}, Split: ${s.splitAmount}`);
    });

    console.log("Creating an import report anomaly...");
    const report = await ImportReport.create({
      rowNumber: 15,
      anomalyType: "INVALID_PERCENTAGE_SUM",
      severity: "ERROR",
      originalData: { date: "28-02-2026", description: "Pizza Friday" },
      actionTaken: "Normalized splits to 100%",
      importBatchId: "test-batch-123"
    });
    console.log("Created ImportReport item. Original Data:", report.originalData);

    console.log("\nDATABASE VERIFICATION PASSED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  }
};

runVerification();
