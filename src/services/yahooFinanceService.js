const yahooFinance = require('yahoo-finance2').default;

class YahooFinanceService {
  constructor() {
    console.log('🔑 Yahoo Finance API服务初始化 (免费无限制)');
    this.setupYahooFinance();
  }

  setupYahooFinance() {
    try {
      if (yahooFinance.suppressNotices) {
        yahooFinance.suppressNotices(['yahooSurvey']);
      }
      
      if (yahooFinance.setGlobalConfig) {
        yahooFinance.setGlobalConfig({
          notThrowOnMissingSymbol: true,
          queue: {
            concurrency: 1,
            interval: 250
          },
          cookieJar: true,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
      }
      
      console.log('✅ Yahoo Finance 配置完成');
    } catch (error) {
      console.log('⚠️ Yahoo Finance 配置失败，使用默认设置');
    }
  }

  // 获取当前价格
  async getCurrentPrice(symbol) {
    try {
      console.log(`📊 Yahoo Finance获取 ${symbol} 实时价格`);
      
      const quote = await this.retryApiCall(() => yahooFinance.quote(symbol));
      
      if (!quote || quote.regularMarketPrice === null || quote.regularMarketPrice === undefined) {
        throw new Error(`Yahoo Finance未返回${symbol}的价格数据`);
      }

      const price = quote.regularMarketPrice;
      console.log(`✅ ${symbol} Yahoo Finance价格: $${price}`);
      
      return {
        price: price,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        previousClose: quote.previousClose || 0,
        marketCap: quote.marketCap || 0,
        currency: quote.currency || 'USD'
      };
      
    } catch (error) {
      console.error(`❌ Yahoo Finance获取${symbol}价格失败:`, error.message);
      throw new Error(`Yahoo Finance获取${symbol}价格失败: ${error.message}`);
    }
  }

  // 修复后的获取历史数据 - 提供更多数据点用于折线图
  async getHistoryByDays(ticker, days) {
    try {
      console.log(`📈 Yahoo Finance获取 ${ticker} ${days}天历史数据`);
      
      const period2 = new Date();
      const period1 = new Date();
      period1.setDate(period1.getDate() - days);
      
      // 根据天数设置不同的间隔，获取更多数据点
      let interval;
      let expectedDataPoints;
      
      if (days === 1) {
        interval = '2m';  // 2分钟间隔，1天约195个数据点
        expectedDataPoints = 195;
      } else if (days === 3) {
        interval = '5m';  // 5分钟间隔，3天约576个数据点
        expectedDataPoints = 576;
      } else if (days === 5) {
        interval = '15m'; // 15分钟间隔，5天约320个数据点
        expectedDataPoints = 320;
      } else {
        interval = '1d';  // 默认日线
        expectedDataPoints = days;
      }
      
      const queryOptions = {
        period1: period1,
        period2: period2,
        interval: interval
      };

      console.log('📊 Yahoo Finance查询参数:', {
        period1: period1.toISOString(),
        period2: period2.toISOString(),
        interval: interval,
        expectedDataPoints: expectedDataPoints
      });

      const chart = await this.retryApiCall(() => yahooFinance.chart(ticker, queryOptions));
      
      if (!chart || !chart.quotes || chart.quotes.length === 0) {
        throw new Error(`Yahoo Finance未返回${ticker}的历史数据`);
      }

      // 处理数据格式，保留所有有效数据点
      const historicalData = chart.quotes
        .filter(quote => quote.close !== null && quote.close !== undefined)
        .map(quote => ({
          timestamp: new Date(quote.date),
          open: quote.open,
          high: quote.high,
          low: quote.low,
          close: quote.close,
          volume: quote.volume || 0
        }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // 不再限制数据点数量，返回所有数据用于折线图
      console.log(`✅ Yahoo Finance返回 ${historicalData.length} 个数据点 (预期约${expectedDataPoints}个)`);
      
      // 添加数据质量信息
      const dataQuality = {
        actualPoints: historicalData.length,
        expectedPoints: expectedDataPoints,
        coverage: Math.round((historicalData.length / expectedDataPoints) * 100),
        interval: interval,
        timeRange: `${period1.toISOString().split('T')[0]} 到 ${period2.toISOString().split('T')[0]}`
      };
      
      return { 
        data: historicalData,
        source: `Yahoo Finance API - ${interval} 间隔`,
        symbol: chart.meta?.symbol || ticker,
        quality: dataQuality
      };
      
    } catch (error) {
      console.error(`❌ Yahoo Finance获取${ticker} ${days}天数据失败:`, error.message);
      throw new Error(`Yahoo Finance获取${ticker}历史数据失败: ${error.message}`);
    }
  }

  // 搜索股票
  async searchSymbols(keywords) {
    try {
      console.log(`🔍 Yahoo Finance搜索: ${keywords}`);
      
      const results = await this.retryApiCall(() => yahooFinance.search(keywords));
      
      if (!results || !results.quotes || results.quotes.length === 0) {
        return [];
      }

      const searchResults = results.quotes
        .filter(quote => quote.symbol && (quote.shortname || quote.longname))
        .map(quote => ({
          symbol: quote.symbol,
          name: quote.shortname || quote.longname || quote.symbol,
          type: quote.quoteType || 'EQUITY',
          exchange: quote.exchange || 'Unknown',
          region: quote.market || 'United States'
        }))
        .slice(0, 10);

      console.log(`✅ Yahoo Finance搜索返回 ${searchResults.length} 个结果`);
      return searchResults;
      
    } catch (error) {
      console.error(`❌ Yahoo Finance搜索失败:`, error.message);
      return [];
    }
  }

  // 获取公司概况
  async getCompanyOverview(symbol) {
    try {
      console.log(`🏢 Yahoo Finance获取 ${symbol} 公司信息`);
      
      const quote = await this.retryApiCall(() => yahooFinance.quote(symbol));
      
      if (!quote || !quote.symbol) {
        throw new Error(`Yahoo Finance未返回${symbol}的公司信息`);
      }

      const overview = {
        symbol: quote.symbol,
        name: quote.longName || quote.shortName || quote.symbol,
        description: quote.longBusinessSummary || '暂无描述信息',
        sector: quote.sector || '未知',
        industry: quote.industry || '未知',
        marketCapitalization: quote.marketCap || 0,
        peRatio: quote.trailingPE || quote.forwardPE || 0,
        beta: quote.beta || 0,
        dividendYield: quote.dividendYield || 0,
        eps: quote.trailingEps || 0,
        currency: quote.currency || 'USD',
        exchange: quote.fullExchangeName || quote.exchange || '未知'
      };

      console.log(`✅ Yahoo Finance返回 ${symbol} 公司信息`);
      return overview;
      
    } catch (error) {
      console.error(`❌ Yahoo Finance获取${symbol}公司信息失败:`, error.message);
      throw new Error(`Yahoo Finance获取${symbol}公司信息失败: ${error.message}`);
    }
  }

  // 获取推荐/趋势股票
  async getTrendingSymbols(region = 'US', count = 10) {
    try {
      console.log(`📈 Yahoo Finance获取趋势股票: ${region}`);
      
      const queryOptions = { count: parseInt(count), lang: "en-US" };
      const trending = await this.retryApiCall(() => yahooFinance.trendingSymbols(region, queryOptions));
      
      if (!trending || !trending.finance || !trending.finance.result || !trending.finance.result[0]) {
        return [];
      }

      const trendingStocks = trending.finance.result[0].quotes || [];
      
      const results = trendingStocks.map(quote => ({
        symbol: quote.symbol,
        name: quote.shortName || quote.longName || quote.symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0
      }));

      console.log(`✅ Yahoo Finance返回 ${results.length} 个趋势股票`);
      return results;
      
    } catch (error) {
      console.error(`❌ Yahoo Finance获取趋势失败:`, error.message);
      return [];
    }
  }

  // 获取股票推荐
  async getRecommendations(symbol) {
    try {
      console.log(`💡 Yahoo Finance获取 ${symbol} 推荐信息`);
      
      const recommendations = await this.retryApiCall(() => yahooFinance.recommendationsBySymbol(symbol));
      
      console.log(`✅ Yahoo Finance返回 ${symbol} 推荐信息`);
      return recommendations;
      
    } catch (error) {
      console.error(`❌ Yahoo Finance获取${symbol}推荐失败:`, error.message);
      return null;
    }
  }

  // 重试机制
  async retryApiCall(apiCall, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        if (i > 0) {
          console.log(`🔄 重试第 ${i} 次...`);
          await this.sleep(delay * i);
        }
        
        const result = await apiCall();
        return result;
        
      } catch (error) {
        console.log(`❌ 尝试 ${i + 1} 失败:`, error.message);
        
        if (i === maxRetries - 1 || !this.isRetryableError(error)) {
          throw error;
        }
      }
    }
  }

  // 判断是否为可重试的错误
  isRetryableError(error) {
    const retryableMessages = [
      'status 403',
      'Forbidden',
      'Failed to get crumb',
      'timeout',
      'ECONNRESET',
      'ENOTFOUND'
    ];
    
    return retryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  // 睡眠函数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new YahooFinanceService();