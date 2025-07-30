const yahooFinance = require('yahoo-finance2').default;

class YahooFinanceService {
  constructor() {
    console.log('🔑 Yahoo Finance API服务初始化 (免费无限制)');
  }

  // 获取当前价格
  async getCurrentPrice(symbol) {
    try {
      console.log(`📊 Yahoo Finance获取 ${symbol} 实时价格`);
      
      const quote = await yahooFinance.quote(symbol);
      
      if (!quote || !quote.regularMarketPrice) {
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

  // 获取历史数据
  async getHistoryByDays(ticker, days) {
    try {
      console.log(`📈 Yahoo Finance获取 ${ticker} ${days}天历史数据`);
      
      // 计算时间范围
      const period2 = new Date();
      const period1 = new Date();
      
      if (days === 1) {
        // 1天数据，获取更详细的间隔
        period1.setDate(period1.getDate() - 1);
      } else {
        period1.setDate(period1.getDate() - days);
      }

      // 设置查询选项
      const queryOptions = {
        period1: period1.toISOString().split('T')[0], // YYYY-MM-DD 格式
        period2: period2.toISOString().split('T')[0],
        interval: days === 1 ? '5m' : '1d' // 1天用5分钟间隔，其他用1天间隔
      };

      console.log('📊 Yahoo Finance查询参数:', queryOptions);

      const chart = await yahooFinance.chart(ticker, queryOptions);
      
      if (!chart || !chart.quotes || chart.quotes.length === 0) {
        throw new Error(`Yahoo Finance未返回${ticker}的历史数据`);
      }

      // 处理数据格式
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

      // 如果是1天数据，只取最近50个点
      const finalData = days === 1 ? historicalData.slice(-50) : historicalData;

      console.log(`✅ Yahoo Finance返回 ${finalData.length} 个数据点`);
      
      return { 
        data: finalData,
        source: `Yahoo Finance API - ${days === 1 ? '5分钟间隔' : '每日数据'}`,
        symbol: chart.meta?.symbol || ticker
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
      
      const results = await yahooFinance.search(keywords);
      
      if (!results || !results.quotes || results.quotes.length === 0) {
        throw new Error(`Yahoo Finance未找到"${keywords}"的搜索结果`);
      }

      const searchResults = results.quotes
        .filter(quote => quote.symbol && quote.shortname)
        .map(quote => ({
          symbol: quote.symbol,
          name: quote.shortname || quote.longname || quote.symbol,
          type: quote.quoteType || 'EQUITY',
          exchange: quote.exchange || 'Unknown',
          region: 'United States' // Yahoo Finance主要是美股
        }))
        .slice(0, 10); // 限制返回10个结果

      console.log(`✅ Yahoo Finance搜索返回 ${searchResults.length} 个结果`);
      return searchResults;
      
    } catch (error) {
      console.error(`❌ Yahoo Finance搜索失败:`, error.message);
      throw new Error(`Yahoo Finance搜索失败: ${error.message}`);
    }
  }

  // 获取公司概况
  async getCompanyOverview(symbol) {
    try {
      console.log(`🏢 Yahoo Finance获取 ${symbol} 公司信息`);
      
      const quote = await yahooFinance.quote(symbol);
      
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
      
      const queryOptions = { count: count, lang: "en-US" };
      const trending = await yahooFinance.trendingSymbols(region, queryOptions);
      
      if (!trending || !trending.finance || !trending.finance.result) {
        throw new Error('Yahoo Finance未返回趋势数据');
      }

      const trendingStocks = trending.finance.result[0]?.quotes || [];
      
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
      throw new Error(`Yahoo Finance获取趋势失败: ${error.message}`);
    }
  }

  // 获取股票推荐
  async getRecommendations(symbol) {
    try {
      console.log(`💡 Yahoo Finance获取 ${symbol} 推荐信息`);
      
      const recommendations = await yahooFinance.recommendationsBySymbol(symbol);
      
      if (!recommendations) {
        throw new Error(`Yahoo Finance未返回${symbol}的推荐信息`);
      }

      console.log(`✅ Yahoo Finance返回 ${symbol} 推荐信息`);
      return recommendations;
      
    } catch (error) {
      console.error(`❌ Yahoo Finance获取${symbol}推荐失败:`, error.message);
      throw new Error(`Yahoo Finance获取${symbol}推荐失败: ${error.message}`);
    }
  }
}

module.exports = new YahooFinanceService();