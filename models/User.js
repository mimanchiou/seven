const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.js');

// 用户信息模型，对应user_info表
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '用户ID，自增主键'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名，唯一不可重复'
  },
  total_funds: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '总资金，保留两位小数'
  },
  available_funds: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '可用资金'
  },
  invested_funds: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '已买入资金'
  }
}, {
  tableName: 'user_info',
  timestamps: false,
  comment: '用户信息表，存储用户资金相关信息'
});

module.exports = User;
