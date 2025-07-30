const StockDetail = require('../models/StockDetail');

class StockDetailService {
  // 1. 创建股票详情记录
  async createStockDetail(data) {
    return await StockDetail.create(data);
  }

  // 2. 根据ID查询单条记录
  async getStockDetailById(recordId) {
    return await StockDetail.findByPk(recordId);
  }

  // 3. 根据股票名称查询记录（支持分页）
  async getStockDetailsByName(stocksName, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await StockDetail.findAndCountAll({
      where: { stocks_name: stocksName },
      order: [['time_stamp', 'DESC']], // 按时间倒序
      limit,
      offset
    });
  }

  // 4. 更新股票详情记录
  async updateStockDetail(recordId, data) {
    const [updated] = await StockDetail.update(data, {
      where: { record_id: recordId }
    });
    if (updated) {
      return await this.getStockDetailById(recordId);
    }
    return null;
  }

  // 5. 删除股票详情记录
  async deleteStockDetail(recordId) {
    const deleted = await StockDetail.destroy({
      where: { record_id: recordId }
    });
    return deleted > 0; // 返回是否删除成功
  }

  // 6. 获取指定时间范围内的股票数据
  async getStockDetailsByTimeRange(stocksName, startTime, endTime) {
    return await StockDetail.findAndCountAll({
      where: {
        stocks_name: stocksName,
        time_stamp: {
          [Op.between]: [startTime, endTime]
        }
      },
      order: [['time_stamp', 'ASC']]
    });
  }
}

module.exports = new StockDetailService();
    