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

  // 卖出股票
  async sellStock(req, res) {
    try {
      const { stocks_name, quantity, sellPrice } = req.body;
      console.log(`卖出股票: ${stocks_name}, 数量: ${quantity}, 卖出价格: ${sellPrice}`);
      if (typeof sellPrice !== 'number' || sellPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: '卖出价格必须为正数'
        });
      }
      
      const result = await portfolioService.sellStock(
        stocks_name,
        quantity,
        sellPrice
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
