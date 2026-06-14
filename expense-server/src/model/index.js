const sequelize = require('./db');
const User = require('./users');
const Group = require('./group');
const GroupMember = require('./groupMember');
const Expense = require('./expense');
const ExpenseSplit = require('./expenseSplit');
const ImportReport = require('./importReport');

// Ensure relationships are set up
// (They are imported individually and establish relationships on execution)

module.exports = {
  sequelize,
  User,
  Group,
  GroupMember,
  Expense,
  ExpenseSplit,
  ImportReport
};
