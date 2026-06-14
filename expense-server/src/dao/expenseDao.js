const Expense = require('../model/expense');
const ExpenseSplit = require('../model/expenseSplit');

const expenseDao = {
    createExpense: async (data) => {
        const { split, ...expenseData } = data;
        
        // Handle excludedMembers array mapping
        if (data.excludedMembers) {
            expenseData.excludedMembers = data.excludedMembers;
        }

        const expense = await Expense.create(expenseData);

        if (split && Array.isArray(split)) {
            for (const s of split) {
                await ExpenseSplit.create({
                    expenseId: expense.id,
                    userEmail: s.userEmail.trim(),
                    splitAmount: Number(s.splitAmount)
                });
            }
        }

        return await Expense.findByPk(expense.id, {
            include: [{ model: ExpenseSplit, as: 'split' }]
        });
    },

    updateExpense: async (data) => {
        const { expenseId, split, ...updateFields } = data;
        const expense = await Expense.findByPk(expenseId);
        if (!expense) return null;

        if (data.excludedMembers) {
            updateFields.excludedMembers = data.excludedMembers;
        }

        await expense.update(updateFields);

        if (split && Array.isArray(split)) {
            // Delete old splits
            await ExpenseSplit.destroy({ where: { expenseId } });
            // Re-insert new splits
            for (const s of split) {
                await ExpenseSplit.create({
                    expenseId,
                    userEmail: s.userEmail.trim(),
                    splitAmount: Number(s.splitAmount)
                });
            }
        }

        return await Expense.findByPk(expenseId, {
            include: [{ model: ExpenseSplit, as: 'split' }]
        });
    },

    getExpensesByGroupId: async (groupId) => {
        return await Expense.findAll({
            where: { groupId },
            include: [{ model: ExpenseSplit, as: 'split' }]
        });
    },

    getExpenseById: async (expenseId) => {
        return await Expense.findByPk(expenseId, {
            include: [{ model: ExpenseSplit, as: 'split' }]
        });
    },

    updateSplitAmount: async (expenseId, userEmail, amount) => {
        await ExpenseSplit.update(
            { splitAmount: Number(amount) },
            { where: { expenseId, userEmail: userEmail.trim() } }
        );
        return await Expense.findByPk(expenseId, {
            include: [{ model: ExpenseSplit, as: 'split' }]
        });
    },

    addSplitUser: async (expenseId, userEmail, amount) => {
        await ExpenseSplit.create({
            expenseId,
            userEmail: userEmail.trim(),
            splitAmount: Number(amount)
        });
        return await Expense.findByPk(expenseId, {
            include: [{ model: ExpenseSplit, as: 'split' }]
        });
    },

    deleteExpense: async (expenseId) => {
        return await Expense.destroy({ where: { id: expenseId } });
    },

    getUnsettledExpensesByGroupId: async (groupId) => {
        return await Expense.findAll({
            where: { groupId, settled: false },
            include: [{ model: ExpenseSplit, as: 'split' }]
        });
    },

    markAllExpensesAsSettled: async (groupId) => {
        return await Expense.update(
            { settled: true },
            { where: { groupId, settled: false } }
        );
    },
};

module.exports = expenseDao;
