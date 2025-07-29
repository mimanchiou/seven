const stockDetailService = require('../services/stockDetailService');

class StockDetailController {
  // 创建记录
  async create(req, res) {
    try {
      const data = req.body;
      const result = await stockDetailService.createStockDetail(data);
      res.json({
        success: true,
        message: '记录创建成功',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '创建失败',
        error: error.message
      });
    }
  }

  // 根据ID查询
  async getById(req, res) {
    try {
      const { id } = req.params;
      const result = await stockDetailService.getStockDetailById(id);
      if (result) {
        return res.json({
          success: true,
          data: result
        });
      }
      res.json({
        success: false,
        message: '记录不存在'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '查询失败',
        error: error.message
      });
    }
  }

  // 根据股票名称查询
  async getByName(req, res) {
    try {
      const { name } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const { count, rows } = await stockDetailService.getStockDetailsByName(name, page, limit);
      res.json({
        success: true,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        data: rows
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '查询失败',
        error: error.message
      });
    }
  }

  // 更新记录
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const result = await stockDetailService.updateStockDetail(id, data);
      if (result) {
        return res.json({
          success: true,
          message: '记录更新成功',
          data: result
        });
      }
      res.json({
        success: false,
        message: '记录不存在'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '更新失败',
        error: error.message
      });
    }
  }

  // 删除记录
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await stockDetailService.deleteStockDetail(id);
      if (result) {
        return res.json({
          success: true,
          message: '记录删除成功'
        });
      }
      res.json({
        success: false,
        message: '记录不存在'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '删除失败',
        error: error.message
      });
    }
  }

  // 获取时间范围内的数据
  async getByTimeRange(req, res) {
    try {
      const { name, startTime, endTime } = req.query;
      if (!name || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: '缺少参数（name、startTime、endTime）'
        });
      }
      const { count, rows } = await stockDetailService.getStockDetailsByTimeRange(name, startTime, endTime);
      res.json({
        success: true,
        total: count,
        data: rows
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '查询失败',
        error: error.message
      });
    }
  }
}

module.exports = new StockDetailController();
    