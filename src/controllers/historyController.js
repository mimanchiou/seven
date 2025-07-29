// 使用Yahoo Finance API，完全免费无限制
const yahooFinanceService = require('../services/yahooFinanceService');

class HistoryController {
  // 快速获取图表数据 - 使用Yahoo Finance
  static async getQuickChartData(req, res) {
    try {
      const { ticker, days } = req.params;
      
      if (![1, 3, 5].includes(parseInt(days))) {
        return res.status(400).json({
          success: false,
          error: '天数只支持 1、3、5'
        });
      }

      console.log(`📊 Yahoo Finance请求数据: ${ticker} ${days}天`);

      // 使用Yahoo Finance获取历史数据
      const historyData = await yahooFinanceService.getHistoryByDays(ticker, parseInt(days));

      // 图表数据格式
      const chartData = {
        labels: historyData.data.map(item => {
          const date = new Date(item.timestamp);
          return parseInt(days) === 1 
            ? date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: `${ticker} 股价`,
          data: historyData.data.map(item => item.close),
          borderColor: 'rgb(34, 197, 94)', // 绿色表示Yahoo Finance
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.1
        }]
      };

      // 统计信息
      const prices = historyData.data.map(item => item.close);
      const stats = {
        currentPrice: prices[prices.length - 1],
        highestPrice: Math.max(...prices),
        lowestPrice: Math.min(...prices),
        priceChange: prices[prices.length - 1] - prices[0],
        priceChangePercent: ((prices[prices.length - 1] - prices[0]) / prices[0] * 100).toFixed(2)
      };

      res.json({
        success: true,
        data: {
          ticker: ticker.toUpperCase(),
          period: `${days}天`,
          chartData: chartData,
          rawData: historyData.data,
          stats: stats,
          source: historyData.source,
          provider: 'Yahoo Finance (免费无限制)'
        }
      });

    } catch (error) {
      console.error('❌ Yahoo Finance获取数据失败:', error.message);
      
      res.status(503).json({
        success: false,
        error: 'Yahoo Finance API不可用',
        details: error.message,
        suggestion: '请检查股票代码是否正确'
      });
    }
  }

  // 搜索股票 - 使用Yahoo Finance
  static async searchStocks(req, res) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: '请提供搜索关键词'
        });
      }

      console.log(`🔍 Yahoo Finance搜索: ${q}`);
      const searchResults = await yahooFinanceService.searchSymbols(q.trim());

      res.json({
        success: true,
        data: {
          query: q.trim(),
          results: searchResults,
          count: searchResults.length,
          provider: 'Yahoo Finance'
        }
      });

    } catch (error) {
      console.error('❌ Yahoo Finance搜索失败:', error.message);
      res.status(503).json({
        success: false,
        error: 'Yahoo Finance搜索API不可用',
        details: error.message
      });
    }
  }

  // 获取股票详细信息 - 使用Yahoo Finance
  static async getStockInfo(req, res) {
    try {
      const { ticker } = req.params;

      console.log(`🏢 Yahoo Finance获取股票信息: ${ticker}`);
      const stockInfo = await yahooFinanceService.getCompanyOverview(ticker);

      res.json({
        success: true,
        data: {
          ...stockInfo,
          provider: 'Yahoo Finance'
        }
      });

    } catch (error) {
      console.error('❌ Yahoo Finance获取股票信息失败:', error.message);
      res.status(503).json({
        success: false,
        error: 'Yahoo Finance股票信息API不可用',
        details: error.message
      });
    }
  }

  // 获取实时价格 - 使用Yahoo Finance
  static async getCurrentPrice(req, res) {
    try {
      const { ticker } = req.params;
      
      console.log(`💰 Yahoo Finance获取实时价格: ${ticker}`);
      const priceData = await yahooFinanceService.getCurrentPrice(ticker);

      res.json({
        success: true,
        data: {
          symbol: ticker.toUpperCase(),
          ...priceData,
          timestamp: new Date(),
          provider: 'Yahoo Finance'
        }
      });
    } catch (error) {
      console.error('❌ Yahoo Finance获取实时价格失败:', error.message);
      res.status(503).json({
        success: false,
        error: 'Yahoo Finance价格API不可用',
        details: error.message
      });
    }
  }

  // 获取趋势股票 - 新增功能
  static async getTrendingStocks(req, res) {
    try {
      const { region = 'US', count = 10 } = req.query;
      
      console.log(`📈 Yahoo Finance获取趋势股票: ${region}`);
      const trendingStocks = await yahooFinanceService.getTrendingSymbols(region, parseInt(count));

      res.json({
        success: true,
        data: {
          region: region,
          trending: trendingStocks,
          count: trendingStocks.length,
          provider: 'Yahoo Finance'
        }
      });

    } catch (error) {
      console.error('❌ Yahoo Finance获取趋势失败:', error.message);
      res.status(503).json({
        success: false,
        error: 'Yahoo Finance趋势API不可用',
        details: error.message
      });
    }
  }

  // 获取股票推荐 - 新增功能
  static async getRecommendations(req, res) {
    try {
      const { ticker } = req.params;
      
      console.log(`💡 Yahoo Finance获取推荐: ${ticker}`);
      const recommendations = await yahooFinanceService.getRecommendations(ticker);

      res.json({
        success: true,
        data: {
          symbol: ticker.toUpperCase(),
          recommendations: recommendations,
          provider: 'Yahoo Finance'
        }
      });

    } catch (error) {
      console.error('❌ Yahoo Finance获取推荐失败:', error.message);
      res.status(503).json({
        success: false,
        error: 'Yahoo Finance推荐API不可用',
        details: error.message
      });
    }
  }

  // 添加股票到数据库 - 使用Yahoo Finance验证
  static async addStock(req, res) {
    try {
      const { ticker, fetchData = false } = req.body;
      
      if (!ticker) {
        return res.status(400).json({
          success: false,
          error: '请提供股票代码'
        });
      }

      // 使用Yahoo Finance验证股票代码
      console.log(`✅ Yahoo Finance验证股票代码: ${ticker}`);
      const stockInfo = await yahooFinanceService.getCompanyOverview(ticker);

      res.status(201).json({
        success: true,
        data: {
          ticker: ticker.toUpperCase(),
          info: stockInfo,
          message: '股票代码验证成功',
          provider: 'Yahoo Finance'
        }
      });

    } catch (error) {
      console.error('❌ Yahoo Finance验证股票代码失败:', error.message);
      res.status(400).json({
        success: false,
        error: '无法验证股票代码',
        details: error.message
      });
    }
  }

  // 获取股票历史数据 - 数据库版本
  static async getStockHistory(req, res) {
    try {
      const { id } = req.params;
      const { days = 1 } = req.query;
      
      res.status(501).json({
        success: false,
        error: '需要完整的数据库集成来支持此功能',
        message: '请使用 /api/quick-chart/:ticker/:days 获取历史数据',
        suggestion: '当前使用Yahoo Finance提供免费无限制的股票数据'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = HistoryController;