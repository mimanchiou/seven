// Modified historyController.js
const yahooFinanceService = require('../services/yahooFinanceService');

class HistoryController {
  // Get quick chart data
  static async getQuickChartData(req, res) {
    try {
      const { ticker, days } = req.params;
      
      if (![1, 3, 5].includes(parseInt(days))) {
        return res.status(400).json({
          success: false,
          error: 'Days only support 1, 3, 5'
        });
      }

      console.log(`Yahoo Finance data request: ${ticker} ${days} days`);

      // Get historical data
      const historyData = await yahooFinanceService.getHistoryByDays(ticker, parseInt(days));

      // Extract time and high price data
      const pricePoints = historyData.data.map(item => ({
        time: item.timestamp.toISOString(),
        price: item.high 
      }));

      // Chart data format
      const chartData = {
        labels: pricePoints.map(point => {
          const date = new Date(point.time);
          return parseInt(days) === 1 
            ? date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })
            : date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
        }),
        datasets: [{
          label: `${ticker} High Price`,
          data: pricePoints.map(point => point.price),
          borderColor: 'rgb(220, 38, 127)', 
          backgroundColor: 'rgba(220, 38, 127, 0.1)',
          tension: 0.1,
          pointRadius: 1,
          pointHoverRadius: 4
        }]
      };

      // Calculate statistics
      const prices = pricePoints.map(point => point.price);
      const stats = {
        currentPrice: prices[prices.length - 1], // Latest price
        highestPrice: Math.max(...prices),       // Highest point
        lowestPrice: Math.min(...prices),        // Lowest point
        priceChange: prices[prices.length - 1] - prices[0], // Price change
        priceChangePercent: (((prices[prices.length - 1] - prices[0]) / prices[0]) * 100).toFixed(2), // Change percent
        dataPointsCount: prices.length,          // Data points count
        startTime: pricePoints[0]?.time,         // Start time
        endTime: pricePoints[pricePoints.length - 1]?.time // End time
      };

      res.json({
        success: true,
        data: {
          ticker: ticker.toUpperCase(),
          period: `${days} days`,
          
          // Chart data
          chartData: chartData,
          
          // Data points
          pricePoints: pricePoints,
          
          // Statistics
          stats: stats,
          
          // Data quality
          quality: {
            dataPoints: pricePoints.length,
            interval: historyData.quality?.interval || 'Unknown',
            timeRange: `${stats.startTime?.split('T')[0]} to ${stats.endTime?.split('T')[0]}`,
            coverage: historyData.quality?.coverage || 100
          },
          
          source: historyData.source,
          provider: 'Yahoo Finance',
          
          // Usage info
          usage: {
            description: "Returns time and high price data",
            chartData: "Use chartData to render charts",
            rawData: "Use pricePoints for raw data",
            example: "pricePoints[0] = { time: '2025-07-28T13:06:00.000Z', price: 214.2 }"
          }
        }
      });

    } catch (error) {
      console.error('Yahoo Finance data fetch failed:', error.message);
      
      res.status(503).json({
        success: false,
        error: 'Yahoo Finance API unavailable',
        details: error.message,
        suggestion: 'Please check if the stock symbol is correct'
      });
    }
  }

  // Get current price
  static async getCurrentPrice(req, res) {
    try {
      const { ticker } = req.params;
      
      console.log(`Yahoo Finance get real-time price: ${ticker}`);
      const priceData = await yahooFinanceService.getCurrentPrice(ticker);

      res.json({
        success: true,
        data: {
          symbol: ticker.toUpperCase(),
          
          // Price info
          current: priceData.price,           // Current price
          open: priceData.open,               // Open price
          high: priceData.high,               // High price
          low: priceData.low,                 // Low price
          close: priceData.close,             // Close price
          previousClose: priceData.previousClose, // Previous close
          
          // Price changes
          change: priceData.change,
          changePercent: priceData.changePercent,
          
          // Trading info
          volume: priceData.volume,
          marketCap: priceData.marketCap,
          currency: priceData.currency,
          
          timestamp: new Date(),
          provider: 'Yahoo Finance'
        }
      });
    } catch (error) {
      console.error('Yahoo Finance get real-time price failed:', error.message);
      res.status(503).json({
        success: false,
        error: 'Yahoo Finance price API unavailable',
        details: error.message
      });
    }
  }

  static async searchStocks(req, res) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Please provide search keywords'
        });
      }

      console.log(`Yahoo Finance search: ${q}`);
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
      console.error('Yahoo Finance search failed:', error.message);
      res.status(503).json({
        success: false,
        error: 'Yahoo Finance search API unavailable',
        details: error.message
      });
    }
  }

  static async getStockInfo(req, res) {
    try {
      const { ticker } = req.params;

      console.log(`Yahoo Finance get stock info: ${ticker}`);
      const stockInfo = await yahooFinanceService.getCompanyOverview(ticker);

      res.json({
        success: true,
        data: {
          ...stockInfo,
          provider: 'Yahoo Finance'
        }
      });

    } catch (error) {
      console.error('Yahoo Finance get stock info failed:', error.message);
      res.status(503).json({
        success: false,
        error: 'Yahoo Finance stock info API unavailable',
        details: error.message
      });
    }
  }

  static async getTrendingStocks(req, res) {
    try {
      const { region = 'US', count = 10 } = req.query;
      
      console.log(`Yahoo Finance get trending stocks: ${region}`);
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
      console.error('Yahoo Finance get trending failed:', error.message);
      res.status(503).json({
        success: false,
        error: 'Yahoo Finance trending API unavailable',
        details: error.message
      });
    }
  }

  static async getRecommendations(req, res) {
    try {
      const { ticker } = req.params;
      
      console.log(`Yahoo Finance get recommendations: ${ticker}`);
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
      console.error('Yahoo Finance get recommendations failed:', error.message);
      res.status(503).json({
        success: false,
        error: 'Yahoo Finance recommendations API unavailable',
        details: error.message
      });
    }
  }

  static async addStock(req, res) {
    try {
      const { ticker, fetchData = false } = req.body;
      
      if (!ticker) {
        return res.status(400).json({
          success: false,
          error: 'Please provide stock symbol'
        });
      }

      console.log(`Yahoo Finance validate stock symbol: ${ticker}`);
      const stockInfo = await yahooFinanceService.getCompanyOverview(ticker);

      res.status(201).json({
        success: true,
        data: {
          ticker: ticker.toUpperCase(),
          info: stockInfo,
          message: 'Stock symbol validation successful',
          provider: 'Yahoo Finance'
        }
      });

    } catch (error) {
      console.error('Yahoo Finance validate stock symbol failed:', error.message);
      res.status(400).json({
        success: false,
        error: 'Unable to validate stock symbol',
        details: error.message
      });
    }
  }

  static async getStockHistory(req, res) {
    try {
      const { id } = req.params;
      const { days = 1 } = req.query;
      
      res.status(501).json({
        success: false,
        error: 'Requires complete database integration to support this feature',
        message: 'Please use /api/quick-chart/:ticker/:days to get historical data',
        suggestion: 'Currently using Yahoo Finance to provide stock data'
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