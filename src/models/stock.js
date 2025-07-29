const { executeQuery, executeTransaction } = require('../config/database');

class Stock {
  // 获取所有股票信息
  static async getAll() {
    const sql = 'SELECT * FROM stocks_info ORDER BY stocks_name';
    return await executeQuery(sql);
  }

  // 根据ID获取股票信息
  static async getById(stocksId) {
    const sql = 'SELECT * FROM stocks_info WHERE stocks_id = ?';
    const results = await executeQuery(sql, [stocksId]);
    return results[0] || null;
  }

  // 根据股票名称获取股票信息
  static async getByName(stockName) {
    const sql = 'SELECT * FROM stocks_info WHERE stocks_name = ?';
    const results = await executeQuery(sql, [stockName]);
    return results[0] || null;
  }

  // 搜索股票（按名称）
  static async search(query) {
    const sql = `
      SELECT * FROM stocks_info 
      WHERE stocks_name LIKE ? 
      ORDER BY stocks_name
      LIMIT 20
    `;
    return await executeQuery(sql, [`%${query}%`]);
  }

  // 添加新股票
  static async create(stockName) {
    const sql = 'INSERT INTO stocks_info (stocks_name) VALUES (?)';
    const result = await executeQuery(sql, [stockName]);
    return result.insertId;
  }

  // 获取股票历史数据
  static async getHistoryData(stocksId, startDate = null, endDate = null, limit = 100) {
    let sql = `
      SELECT sd.*, si.stocks_name
      FROM stocks_detail sd
      JOIN stocks_info si ON sd.stocks_name = si.stocks_id
      WHERE sd.stocks_name = ?
    `;
    const params = [stocksId];

    if (startDate) {
      sql += ' AND sd.time_stamp >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND sd.time_stamp <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY sd.time_stamp DESC LIMIT ?';
    params.push(limit);

    return await executeQuery(sql, params);
  }

  // 获取最新价格数据
  static async getLatestPrice(stocksId) {
    const sql = `
      SELECT sd.*, si.stocks_name
      FROM stocks_detail sd
      JOIN stocks_info si ON sd.stocks_name = si.stocks_id
      WHERE sd.stocks_name = ?
      ORDER BY sd.time_stamp DESC
      LIMIT 1
    `;
    const results = await executeQuery(sql, [stocksId]);
    return results[0] || null;
  }

  // 根据股票名称获取最新价格
  static async getLatestPriceByName(stockName) {
    const sql = `
      SELECT sd.*, si.stocks_name, si.stocks_id
      FROM stocks_detail sd
      JOIN stocks_info si ON sd.stocks_name = si.stocks_id
      WHERE si.stocks_name = ?
      ORDER BY sd.time_stamp DESC
      LIMIT 1
    `;
    const results = await executeQuery(sql, [stockName]);
    return results[0] || null;
  }

  // 批量插入价格数据
  static async insertPriceData(stocksId, priceData) {
    const sql = `
      INSERT INTO stocks_detail (stocks_name, time_stamp, open, high, low, close, quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const queries = priceData.map(data => ({
      sql,
      params: [
        stocksId,
        data.timestamp,
        data.open,
        data.high,
        data.low,
        data.close,
        data.volume || 0
      ]
    }));

    return await executeTransaction(queries);
  }

  // 更新单条价格数据
  static async updatePriceData(stocksId, priceData) {
    const sql = `
      INSERT INTO stocks_detail (stocks_name, time_stamp, open, high, low, close, quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        open = VALUES(open),
        high = VALUES(high),
        low = VALUES(low),
        close = VALUES(close),
        quantity = VALUES(quantity)
    `;
    
    return await executeQuery(sql, [
      stocksId,
      priceData.timestamp,
      priceData.open,
      priceData.high,
      priceData.low,
      priceData.close,
      priceData.volume || 0
    ]);
  }

  // 获取股票统计信息
  static async getStockStats(stocksId, days = 30) {
    const sql = `
      SELECT 
        COUNT(*) as total_records,
        MIN(low) as min_price,
        MAX(high) as max_price,
        AVG(close) as avg_price,
        MIN(time_stamp) as earliest_date,
        MAX(time_stamp) as latest_date
      FROM stocks_detail 
      WHERE stocks_name = ?
      AND time_stamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    
    const results = await executeQuery(sql, [stocksId, days]);
    return results[0] || null;
  }

  // 删除过期数据
  static async deleteOldData(daysToKeep = 365) {
    const sql = `
      DELETE FROM stocks_detail 
      WHERE time_stamp < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    
    return await executeQuery(sql, [daysToKeep]);
  }
}

module.exports = Stock;