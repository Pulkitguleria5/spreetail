const { DataTypes } = require('sequelize');
const sequelize = require('./db');
const ExpenseSplit = require('./expenseSplit');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  paidBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalAmount: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'INR'
  },
  exchangeRate: {
    type: DataTypes.DOUBLE,
    defaultValue: 1.0
  },
  splitType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'EXACT'
  },
  settled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  imported: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  importBatchId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  excludedMembersData: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  excludedMembers: {
    type: DataTypes.VIRTUAL,
    get() {
      const data = this.getDataValue('excludedMembersData');
      return data ? JSON.parse(data) : [];
    },
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue('excludedMembersData', JSON.stringify(value));
      } else {
        this.setDataValue('excludedMembersData', JSON.stringify([]));
      }
    }
  },
  _id: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.id ? this.id.toString() : null;
    }
  }
});

// Explicit JSON serialization override to ensure mongoose compatibility fields are always present
Expense.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  values._id = this.id ? this.id.toString() : null;
  const data = this.getDataValue('excludedMembersData');
  values.excludedMembers = data ? JSON.parse(data) : [];
  return values;
};

// Associations
Expense.hasMany(ExpenseSplit, { as: 'split', foreignKey: 'expenseId', onDelete: 'CASCADE' });
ExpenseSplit.belongsTo(Expense, { foreignKey: 'expenseId' });

module.exports = Expense;