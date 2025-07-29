const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.js');

// 股票组合模型，对应user_portfolio_items表
const PortfolioItem = sequelize.define('PortfolioItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  stock_name: {
    type: DataTypes.STRING(220),
    allowNull: false,
    comment: '股票名称'
  },
  buy_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '买入时间'
  },
  buy_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '买入价格'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '买入股票数量'
  }
}, {
  tableName: 'user_portfolio_items',
  timestamps: false,
  indexes: [
    {
      name: 'stock_id',
      fields: ['stock_name']
    }
  ]
});

// 与User模型建立关联
/*PortfolioItem.belongsTo(require('./User'), { 
  foreignKey: 'user_id', 
  as: 'user' 
});*/

module.exports = PortfolioItem;
