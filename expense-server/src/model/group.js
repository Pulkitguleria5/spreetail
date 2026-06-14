const { DataTypes } = require('sequelize');
const sequelize = require('./db');
const GroupMember = require('./groupMember');

const Group = sequelize.define('Group', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  adminEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  thumbnail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentAmount: {
    type: DataTypes.DOUBLE,
    defaultValue: 0
  },
  paymentCurrency: {
    type: DataTypes.STRING,
    defaultValue: 'INR'
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paymentIsPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  paymentStatus: {
    type: DataTypes.VIRTUAL,
    get() {
      return {
        amount: this.paymentAmount,
        currency: this.paymentCurrency,
        date: this.paymentDate,
        isPaid: this.paymentIsPaid
      };
    },
    set(value) {
      if (value) {
        this.setDataValue('paymentAmount', value.amount || 0);
        this.setDataValue('paymentCurrency', value.currency || 'INR');
        this.setDataValue('paymentDate', value.date || null);
        this.setDataValue('paymentIsPaid', value.isPaid || false);
      }
    }
  },
  _id: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.id ? this.id.toString() : null;
    }
  },
  membersEmail: {
    type: DataTypes.VIRTUAL,
    get() {
      if (this.members) {
        return this.members.map(m => m.email);
      }
      return [];
    }
  }
});

// Explicit JSON serialization override to ensure mongoose compatibility fields are always present
Group.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  values._id = this.id ? this.id.toString() : null;
  if (this.members) {
    values.membersEmail = this.members.map(m => m.email);
  } else {
    values.membersEmail = [];
  }
  return values;
};

// Associations
Group.hasMany(GroupMember, { as: 'members', foreignKey: 'groupId', onDelete: 'CASCADE' });
GroupMember.belongsTo(Group, { foreignKey: 'groupId' });

module.exports = Group;