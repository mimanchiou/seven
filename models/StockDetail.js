const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.js'); // 导入数据库连接

// 定义股票详情模型，映射 stocks_detail 表
const StockDetail = sequelize.define('StockDetail', {
  record_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '记录ID，自增主键'
  },
  stocks_name: {
    type: DataTypes.STRING(220),
    allowNull: true,
    comment: '股票名称'
  },
  time_stamp: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '时间戳'
  },
  open: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '开盘价'
  },
  high: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '最高价'
  },
  low: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '最低价'
  },
  close: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '收盘价'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '成交量'
  }
}, {
  tableName: 'stocks_detail', // 关联数据库表名
  timestamps: false, // 表中没有createdAt/updatedAt字段，禁用自动生成
  indexes: [
    {
      name: 'stocks_info_id',
      fields: ['stocks_name'] // 对应表中的索引
    }
  ]
});

module.exports = StockDetail;
// 导出模型以供其他模块使用