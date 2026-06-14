const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'admin'
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  subscriptionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subscriptionPlanId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subscriptionStatus: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subscriptionStart: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subscriptionEnd: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subscriptionLastBillDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subscriptionNextBillDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subscriptionPaymentsMade: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  subscriptionPaymentsRemaining: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  subscription: {
    type: DataTypes.VIRTUAL,
    get() {
      const status = this.getDataValue('subscriptionStatus');
      const subId = this.getDataValue('subscriptionId');
      if (!status && !subId) {
        return null;
      }
      return {
        subscriptionId: subId,
        planId: this.getDataValue('subscriptionPlanId'),
        status: status,
        start: this.getDataValue('subscriptionStart'),
        end: this.getDataValue('subscriptionEnd'),
        lastBillDate: this.getDataValue('subscriptionLastBillDate'),
        nextBillDate: this.getDataValue('subscriptionNextBillDate'),
        paymentsMade: this.getDataValue('subscriptionPaymentsMade'),
        paymentsRemaining: this.getDataValue('subscriptionPaymentsRemaining')
      };
    },
    set(value) {
      if (value) {
        this.setDataValue('subscriptionId', value.subscriptionId || null);
        this.setDataValue('subscriptionPlanId', value.planId || null);
        this.setDataValue('subscriptionStatus', value.status || null);
        this.setDataValue('subscriptionStart', value.start || null);
        this.setDataValue('subscriptionEnd', value.end || null);
        this.setDataValue('subscriptionLastBillDate', value.lastBillDate || null);
        this.setDataValue('subscriptionNextBillDate', value.nextBillDate || null);
        this.setDataValue('subscriptionPaymentsMade', value.paymentsMade || null);
        this.setDataValue('subscriptionPaymentsRemaining', value.paymentsRemaining || null);
      } else {
        this.setDataValue('subscriptionId', null);
        this.setDataValue('subscriptionPlanId', null);
        this.setDataValue('subscriptionStatus', null);
        this.setDataValue('subscriptionStart', null);
        this.setDataValue('subscriptionEnd', null);
        this.setDataValue('subscriptionLastBillDate', null);
        this.setDataValue('subscriptionNextBillDate', null);
        this.setDataValue('subscriptionPaymentsMade', null);
        this.setDataValue('subscriptionPaymentsRemaining', null);
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
User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  values._id = this.id ? this.id.toString() : null;
  const status = this.getDataValue('subscriptionStatus');
  const subId = this.getDataValue('subscriptionId');
  if (status || subId) {
    values.subscription = {
      subscriptionId: subId,
      planId: this.getDataValue('subscriptionPlanId'),
      status: status,
      start: this.getDataValue('subscriptionStart'),
      end: this.getDataValue('subscriptionEnd'),
      lastBillDate: this.getDataValue('subscriptionLastBillDate'),
      nextBillDate: this.getDataValue('subscriptionNextBillDate'),
      paymentsMade: this.getDataValue('subscriptionPaymentsMade'),
      paymentsRemaining: this.getDataValue('subscriptionPaymentsRemaining')
    };
  } else {
    values.subscription = null;
  }
  return values;
};

module.exports = User;