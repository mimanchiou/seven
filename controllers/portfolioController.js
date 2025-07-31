const portfolioService = require('../services/portfolioService');

class PortfolioController {
  // 买入股票
  async buyStock(req, res) {
    try {
      const result = await portfolioService.buyStock(req.body);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // 获取用户股票组合
  async getUserPortfolio(req, res) {
    try {
      const items = await portfolioService.getUserPortfolio(req.params.userId);
      res.status(200).json({
        success: true,
        count: items.length,
        data: items
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

   /**
   * 根据股票名称获取总持仓数量
   * 前端请求示例: GET /api/portfolio/stock/AAPL/total-quantity
   */
  async getTotalQuantityByStock(req, res) {
    try {
      // 从 URL 参数中获取股票名称，例如 :stockName
      const { stock_name } = req.params;
      
      // 调用 service 层方法，传入股票名称
      const totalQuantity = await portfolioService.getTotalQuantityByStock(stock_name);

      // 如果没有找到任何记录，totalQuantity 会是 0，这仍然是一个有效的结果
      res.status(200).json({
        success: true,
        stockName: stock_name,
        totalQuantity: totalQuantity
      });
    } catch (error) {
      // 捕获可能的错误，例如数据库查询错误
      res.status(500).json({ // 使用 500 表示服务器内部错误
        success: false,
        message: '计算股票总持仓数量时失败',
        error: error.message
      });
    }
  }
  // 获取所有股票的总持股数
  async getAllStocksTotalQuantity(req, res) {
  try {
    // 不再需要从请求中获取参数
    // 直接调用 service 层方法，获取所有股票的总持股数
    const stocksSummary = await portfolioService.getAllStocksTotalQuantity();

    // 返回一个包含所有股票及其总持股数的数组
    res.status(200).json({
      success: true,
      count: stocksSummary.length, // 返回有多少种不同的股票
      data: stocksSummary
    });
  } catch (error) {
    // 捕获可能的错误，例如数据库查询错误
    console.error("Error in getAllStocksTotalQuantity controller:", error); // 建议在服务器端打印错误日志
    res.status(500).json({
      success: false,
      message: '获取所有股票总持股数时失败',
      error: error.message
    });
  }
}


  // 卖出股票
  async sellStock(req, res) {
    try {
      
      const { stock_name, quantity, buy_price } = req.body;
      console.log(`卖出股票: ${stock_name}, 数量: ${quantity}, 卖出价格: ${buy_price}`);
      const a = await portfolioService.buyStock(req.body);//更新买卖数据库表
      if (typeof buy_price !== 'number' || buy_price <= 0) {
        return res.status(400).json({
          success: false,
          message: '卖出价格必须为正数'
        });
      }
      
      const result = await portfolioService.sellStock(
        stock_name,
        quantity,
        buy_price
      );
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // 删除股票组合项
  async deletePortfolioItem(req, res) {
    try {
      const { name } = req.params;
      const result = await portfolioService.findAndDeleteByStockName(name);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message
        });
      }
      res.status(404).json({
        success: false,
        message: result.message
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  // 更新组合项
  async updatePortfolioItem(req, res) {
    console.log('更新组合项:', req.params.itemId, req.body);
    try {
      const updatedItem = await portfolioService.updatePortfolioItem(
        req.params.itemId,
        req.body
      );
      
      if (!updatedItem) {
        return res.status(404).json({
          success: false,
          message: '股票记录不存在'
        });
      }
      
      res.status(200).json({
        success: true,
        data: updatedItem
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PortfolioController();
