const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const ImportReport = sequelize.define('ImportReport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rowNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  anomalyType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  severity: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'WARNING'
  },
  originalDataText: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actionTaken: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  importBatchId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  originalData: {
    type: DataTypes.VIRTUAL,
    get() {
      const data = this.getDataValue('originalDataText');
      return data ? JSON.parse(data) : null;
    },
    set(value) {
      if (value) {
        this.setDataValue('originalDataText', JSON.stringify(value));
      } else {
        this.setDataValue('originalDataText', null);
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
ImportReport.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  values._id = this.id ? this.id.toString() : null;
  const data = this.getDataValue('originalDataText');
  values.originalData = data ? JSON.parse(data) : null;
  return values;
};

module.exports = ImportReport;