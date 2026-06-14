const expenseDao = require('../dao/expenseDao');
const groupDao = require('../dao/groupDao');
const userDao = require('../dao/userDao');
const GroupMember = require('../model/groupMember');
const { Op } = require('sequelize');

// Helper to calculate exact split amounts based on splitType
const calculateSplits = (totalAmount, splitType, splitItems) => {
    const total = Number(totalAmount);
    const type = splitType ? splitType.toUpperCase() : "EXACT";

    if (type === 'EQUAL') {
        const shareCount = splitItems.length;
        if (shareCount === 0) return [];
        const baseShare = Math.floor((total / shareCount) * 100) / 100;
        let sum = 0;
        return splitItems.map((item, idx) => {
            const splitAmount = idx === shareCount - 1 ? Number((total - sum).toFixed(2)) : baseShare;
            sum += splitAmount;
            return { userEmail: item.userEmail.trim(), splitAmount };
        });
    } else if (type === 'PERCENTAGE') {
        const totalPercentage = splitItems.reduce((sum, item) => sum + Number(item.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.1) {
            throw new Error(`Percentages must sum to 100%, got ${totalPercentage}%`);
        }
        let sum = 0;
        return splitItems.map((item, idx) => {
            const splitAmount = idx === splitItems.length - 1 ? Number((total - sum).toFixed(2)) : Number(((item.percentage / 100) * total).toFixed(2));
            sum += splitAmount;
            return { userEmail: item.userEmail.trim(), splitAmount };
        });
    } else if (type === 'SHARE') {
        const totalShares = splitItems.reduce((sum, item) => sum + Number(item.share || 0), 0);
        if (totalShares <= 0) {
            throw new Error(`Total shares must be greater than 0`);
        }
        let sum = 0;
        return splitItems.map((item, idx) => {
            const splitAmount = idx === splitItems.length - 1 ? Number((total - sum).toFixed(2)) : Number(((item.share / totalShares) * total).toFixed(2));
            sum += splitAmount;
            return { userEmail: item.userEmail.trim(), splitAmount };
        });
    } else {
        // EXACT / UNEQUAL
        const totalSplit = splitItems.reduce((sum, item) => sum + Number(item.splitAmount || 0), 0);
        if (Math.abs(totalSplit - total) > 0.02) {
            throw new Error(`Split amounts (${totalSplit.toFixed(2)}) do not sum up to total amount (${total.toFixed(2)})`);
        }
        return splitItems.map(item => ({
            userEmail: item.userEmail.trim(),
            splitAmount: Number(item.splitAmount)
        }));
    }
};

// Greedy debt settlement simplification algorithm
const simplifyDebts = (balances) => {
    const creditors = [];
    const debtors = [];
    for (const [email, balance] of Object.entries(balances)) {
        const rounded = Number(balance.toFixed(2));
        if (rounded > 0.01) {
            creditors.push({ email, amount: rounded });
        } else if (rounded < -0.01) {
            debtors.push({ email, amount: Math.abs(rounded) });
        }
    }

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let cIdx = 0;
    let dIdx = 0;

    while (cIdx < creditors.length && dIdx < debtors.length) {
        const creditor = creditors[cIdx];
        const debtor = debtors[dIdx];

        const amount = Math.min(creditor.amount, debtor.amount);
        if (amount > 0.01) {
            transactions.push({
                from: debtor.email,
                to: creditor.email,
                amount: Number(amount.toFixed(2))
            });
        }

        creditor.amount -= amount;
        debtor.amount -= amount;

        if (creditor.amount < 0.01) cIdx++;
        if (debtor.amount < 0.01) dIdx++;
    }

    return transactions;
};

const expenseController = {

    create: async (request, response) => {
        try {
            const user = request.user;
            const { 
                groupId, 
                amount, 
                description, 
                date, 
                paidBy, 
                split, 
                splitType, 
                originalAmount, 
                currency, 
                exchangeRate 
            } = request.body;

            if (!groupId || amount == null || !description || !paidBy || !Array.isArray(split)) {
                return response.status(400).json({ message: "Missing required fields" });
            }

            // check user is part of group
            const group = await groupDao.getGroupById(groupId);
            if (!group) {
                return response.status(404).json({ message: "Group not found" });
            }

            const groupEmails = group.membersEmail;
            if (!groupEmails.map(e => e.toLowerCase()).includes(user.email.toLowerCase())) {
                return response.status(403).json({ message: "User is not a member of the group" });
            }

            // validate group memberships on the expense date
            const expenseDate = date ? new Date(date) : new Date();
            const activeMemberships = await GroupMember.findAll({
                where: {
                    groupId,
                    joinedAt: { [Op.lte]: expenseDate },
                    [Op.or]: [
                        { leftAt: null },
                        { leftAt: { [Op.gte]: expenseDate } }
                    ]
                }
            });
            const activeEmails = activeMemberships.map(m => m.email.toLowerCase());

            // Payer must be active on the date
            if (!activeEmails.includes(paidBy.trim().toLowerCase())) {
                return response.status(400).json({
                    message: `Payer ${paidBy} was not an active group member on the expense date (${expenseDate.toLocaleDateString()})`
                });
            }

            // All split users must be active on the date
            for (const s of split) {
                if (!activeEmails.includes(s.userEmail.trim().toLowerCase())) {
                    return response.status(400).json({
                        message: `User ${s.userEmail} was not an active group member on the expense date (${expenseDate.toLocaleDateString()})`
                    });
                }
            }

            // Calculate split amounts
            let calculatedSplits = [];
            try {
                calculatedSplits = calculateSplits(amount, splitType, split);
            } catch (err) {
                return response.status(400).json({ message: err.message });
            }

            // excluded members
            const excludedMembers = groupEmails.filter(email =>
                email.trim().toLowerCase() !== paidBy.trim().toLowerCase() &&
                !calculatedSplits.some(s => s.userEmail.toLowerCase() === email.toLowerCase())
            );

            const newExpense = await expenseDao.createExpense({
                groupId,
                amount: Number(amount),
                description,
                date: expenseDate,
                paidBy: paidBy.trim(),
                split: calculatedSplits,
                splitType: splitType || 'EXACT',
                originalAmount: originalAmount != null ? Number(originalAmount) : Number(amount),
                currency: currency || 'INR',
                exchangeRate: exchangeRate != null ? Number(exchangeRate) : 1.0,
                excludedMembers,
                settled: false
            });

            // Unsettle group if it was settled
            if (group.paymentStatus && group.paymentStatus.isPaid) {
                await groupDao.unsettleGroup(groupId);
            }

            response.status(201).json({
                message: "Expense created successfully",
                expenseId: newExpense._id
            });

        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    update: async (request, response) => {
        try {
            const user = request.user;
            const { expenseId } = request.body;

            const expense = await expenseDao.getExpenseById(expenseId);
            if (!expense) {
                return response.status(404).json({ message: "Expense not found" });
            }

            const group = await groupDao.getGroupById(expense.groupId);
            if (!group || group.adminEmail !== user.email) {
                return response.status(403).json({ message: "Only group admin can update expenses" });
            }

            const updatedExpense = await expenseDao.updateExpense(request.body);
            response.status(200).json(updatedExpense);

        } catch (error) {
            response.status(500).json({ message: "Error updating expense" });
        }
    },

    getByGroupId: async (request, response) => {
        try {
            const user = request.user;
            const { groupId } = request.params;

            const group = await groupDao.getGroupById(groupId);
            if (!group) {
                return response.status(404).json({ message: "Group not found" });
            }

            const isMember = group.membersEmail.map(e => e.toLowerCase()).includes(user.email.toLowerCase());
            if (!isMember) {
                return response.status(403).json({ message: "User is not a member of the group" });
            }

            const expenses = await expenseDao.getExpensesByGroupId(groupId);
            response.status(200).json(expenses);

        } catch (error) {
            response.status(500).json({ message: "Error fetching expenses" });
        }
    },

    getByExpenseId: async (request, response) => {
        try {
            const expense = await expenseDao.getExpenseById(request.params.expenseId);
            if (!expense) {
                return response.status(404).json({ message: "Expense not found" });
            }
            response.status(200).json(expense);

        } catch (error) {
            response.status(500).json({ message: "Error fetching expense" });
        }
    },

    delete: async (request, response) => {
        try {
            const user = request.user;
            const { expenseId } = request.params;

            const expense = await expenseDao.getExpenseById(expenseId);
            if (!expense) {
                return response.status(404).json({ message: "Expense not found" });
            }

            const group = await groupDao.getGroupById(expense.groupId);
            if (!group || group.adminEmail !== user.email) {
                return response.status(403).json({ message: "Only group admin can delete expenses" });
            }

            await expenseDao.deleteExpense(expenseId);
            response.status(200).json({ message: "Expense deleted successfully" });

        } catch (error) {
            response.status(500).json({ message: "Error deleting expense" });
        }
    },

    updateSplitAmount: async (request, response) => {
        try {
            const user = request.user;
            const { expenseId, userEmail, amount } = request.body;

            const expense = await expenseDao.getExpenseById(expenseId);
            if (!expense) {
                return response.status(404).json({ message: "Expense not found" });
            }

            const group = await groupDao.getGroupById(expense.groupId);
            if (!group || group.adminEmail !== user.email) {
                return response.status(403).json({ message: "Only group admin can update expenses" });
            }

            const updatedExpense = await expenseDao.updateSplitAmount(expenseId, userEmail, amount);

            const totalSplit = updatedExpense.split.reduce(
                (sum, s) => sum + Number(s.splitAmount),
                0
            );

            if (Math.abs(totalSplit - updatedExpense.amount) > 0.01) {
                return response.status(400).json({
                    message: "Split amounts do not sum up to total amount"
                });
            }

            response.status(200).json(updatedExpense);

        } catch (error) {
            response.status(500).json({ message: "Error updating split amount" });
        }
    },

    addSplitUser: async (request, response) => {
        try {
            const user = request.user;
            const { expenseId, userEmail, amount } = request.body;

            const expense = await expenseDao.getExpenseById(expenseId);
            if (!expense) {
                return response.status(404).json({ message: "Expense not found" });
            }

            const group = await groupDao.getGroupById(expense.groupId);
            if (!group || group.adminEmail !== user.email) {
                return response.status(403).json({ message: "Only group admin can update expenses" });
            }

            if (!group.membersEmail.includes(userEmail)) {
                return response.status(400).json({
                    message: "User does not belong to the group of the expense"
                });
            }

            const updatedExpense = await expenseDao.addSplitUser(expenseId, userEmail, amount);
            response.status(200).json(updatedExpense);

        } catch (error) {
            response.status(500).json({ message: "Error adding split user" });
        }
    },

    getSummary: async (request, response) => {
        try {
            const user = request.user;
            const { groupId } = request.params;

            const group = await groupDao.getGroupById(groupId);
            if (!group) {
                return response.status(404).json({ message: "Group not found" });
            }

            const isMember = group.membersEmail.map(e => e.toLowerCase()).includes(user.email.toLowerCase());
            if (!isMember) {
                return response.status(403).json({ message: "User is not a member of the group" });
            }

            const expenses = await expenseDao.getUnsettledExpensesByGroupId(groupId);

            // Initialize balances
            const balances = {};
            const breakdowns = {};
            
            group.membersEmail.forEach(email => {
                balances[email] = 0;
                breakdowns[email] = [];
            });

            expenses.forEach(expense => {
                const paidBy = expense.paidBy;
                const totalAmount = expense.amount; // Converted base amount (INR)

                // Credit the payer
                if (balances.hasOwnProperty(paidBy)) {
                    balances[paidBy] += totalAmount;
                }

                // Debit each user in the split
                expense.split.forEach(splitItem => {
                    const splitUser = splitItem.userEmail;
                    const splitAmount = splitItem.splitAmount;

                    if (balances.hasOwnProperty(splitUser)) {
                        balances[splitUser] -= splitAmount;
                    }
                });

                // Compute itemized breakdown (Rohan's Request)
                group.membersEmail.forEach(email => {
                    const splitItem = expense.split.find(s => s.userEmail.toLowerCase() === email.toLowerCase());
                    const isPayer = (paidBy.toLowerCase() === email.toLowerCase());
                    const isSplit = !!splitItem;

                    if (isPayer || isSplit) {
                        const userPaid = isPayer ? totalAmount : 0;
                        const userSplit = isSplit ? splitItem.splitAmount : 0;
                        const netEffect = userPaid - userSplit;

                        if (Math.abs(netEffect) > 0.01) {
                            breakdowns[email].push({
                                expenseId: expense.id,
                                description: expense.description,
                                date: expense.date,
                                totalAmount: expense.amount,
                                originalAmount: expense.originalAmount,
                                currency: expense.currency,
                                paidBy: expense.paidBy,
                                userPaid,
                                userSplit,
                                netEffect: Number(netEffect.toFixed(2))
                            });
                        }
                    }
                });
            });

            const summary = group.membersEmail.map(email => ({
                userEmail: email,
                netBalance: balances[email]
            }));

            // Calculate simplified payments (Aisha's Request)
            const simplifiedDebts = simplifyDebts(balances);

            response.status(200).json({
                groupId,
                summary,
                simplifiedDebts,
                breakdowns,
                isSettled: group.paymentStatus?.isPaid || false
            });

        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Error fetching expense summary" });
        }
    },

    settleGroup: async (request, response) => {
        try {
            const user = request.user;
            const { groupId } = request.body;

            const group = await groupDao.getGroupById(groupId);
            if (!group) {
                return response.status(404).json({ message: "Group not found" });
            }

            if (group.adminEmail !== user.email) {
                return response.status(403).json({ message: "Only group admin can settle the group" });
            }

            await expenseDao.markAllExpensesAsSettled(groupId);

            const updatedGroup = await groupDao.updateGroup({
                groupId,
                paymentStatus: {
                    amount: 0,
                    currency: 'INR',
                    date: Date.now(),
                    isPaid: true
                }
            });

            response.status(200).json({
                message: "Group settled successfully",
                group: updatedGroup
            });

        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Error settling group" });
        }
    }
};

module.exports = expenseController;
