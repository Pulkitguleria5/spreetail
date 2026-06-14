const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const ExpenseSplit = sequelize.define('ExpenseSplit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  expenseId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  splitAmount: {
    type: DataTypes.DOUBLE,
    allowNull: false
  }
});

module.exports = ExpenseSplit;
