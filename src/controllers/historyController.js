
const yahooFinanceService = require('../services/yahooFinanceService');

class HistoryController {
  // 快速获取图表数据 - 只返回时间和最高价
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

      // 提取时间和最高价数据
      const pricePoints = historyData.data.map(item => ({
        time: item.timestamp.toISOString(),
        price: item.high // 只使用最高价
      }));

      // 图表数据格式 - 简化版本
      const chartData = {
        labels: pricePoints.map(point => {
          const date = new Date(point.time);
          return parseInt(days) === 1 
            ? date.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })
            : date.toLocaleDateString('zh-CN', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
        }),
        datasets: [{
          label: `${ticker} 最高价`,
          data: pricePoints.map(point => point.price),
          borderColor: 'rgb(220, 38, 127)', // 粉红色表示最高价
          backgroundColor: 'rgba(220, 38, 127, 0.1)',
          tension: 0.1,
          pointRadius: 1,
          pointHoverRadius: 4
        }]
      };

      // 计算统计信息
      const prices = pricePoints.map(point => point.price);
      const stats = {
        currentPrice: prices[prices.length - 1], // 最新最高价
        highestPrice: Math.max(...prices),       // 期间最高点
        lowestPrice: Math.min(...prices),        // 期间最低点
        priceChange: prices[prices.length - 1] - prices[0], // 价格变化
        priceChangePercent: (((prices[prices.length - 1] - prices[0]) / prices[0]) * 100).toFixed(2), // 变化百分比
        dataPointsCount: prices.length,          // 数据点数量
        startTime: pricePoints[0]?.time,         // 开始时间
        endTime: pricePoints[pricePoints.length - 1]?.time // 结束时间
      };

      res.json({
        success: true,
        data: {
          ticker: ticker.toUpperCase(),
          period: `${days}天`,
          
          // 主要图表数据
          chartData: chartData,
          
          // 简化的数据点 - 只包含时间和最高价
          pricePoints: pricePoints,
          
          // 统计信息
          stats: stats,
          
          // 数据质量信息
          quality: {
            dataPoints: pricePoints.length,
            interval: historyData.quality?.interval || '未知',
            timeRange: `${stats.startTime?.split('T')[0]} 到 ${stats.endTime?.split('T')[0]}`,
            coverage: historyData.quality?.coverage || 100
          },
          
          source: historyData.source,
          provider: 'Yahoo Finance',
          
          // 使用说明
          usage: {
            description: "只返回时间和最高价数据",
            chartData: "使用 chartData 直接绘制图表",
            rawData: "使用 pricePoints 获取原始时间和价格对",
            example: "pricePoints[0] = { time: '2025-07-28T13:06:00.000Z', price: 214.2 }"
          }
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
        suggestion: '当前使用Yahoo Finance提供股票数据'
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