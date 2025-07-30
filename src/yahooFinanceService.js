const yahooFinance = require('yahoo-finance2').default;

class YahooFinanceService {
  constructor() {
    console.log('Yahoo Finance API service initialized');
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
      
      console.log('Yahoo Finance configuration completed');
    } catch (error) {
      console.log('Yahoo Finance configuration failed, using default settings');
    }
  }

  // Get current price - modified to return complete OHLC data
  async getCurrentPrice(symbol) {
    try {
      console.log(`Yahoo Finance get ${symbol} complete real-time price`);
      
      const quote = await this.retryApiCall(() => yahooFinance.quote(symbol));
      
      if (!quote || quote.regularMarketPrice === null || quote.regularMarketPrice === undefined) {
        throw new Error(`Yahoo Finance did not return price data for ${symbol}`);
      }

      const price = quote.regularMarketPrice;
      console.log(`${symbol} Yahoo Finance price: $${price}`);
      
      return {
        price: price,
        open: quote.regularMarketOpen || price,           // Open price
        high: quote.regularMarketDayHigh || price,        // High price
        low: quote.regularMarketDayLow || price,          // Low price
        close: price,                                     // Close price
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        previousClose: quote.previousClose || 0,
        marketCap: quote.marketCap || 0,
        currency: quote.currency || 'USD'
      };
      
    } catch (error) {
      console.error(`Yahoo Finance get ${symbol} price failed:`, error.message);
      throw new Error(`Yahoo Finance get ${symbol} price failed: ${error.message}`);
    }
  }

  // Get history data
  async getHistoryByDays(ticker, days) {
    try {
      console.log(`Yahoo Finance get ${ticker} ${days} days history data`);
      
      const period2 = new Date();
      const period1 = new Date();
      period1.setDate(period1.getDate() - days);
      
      let interval;
      let expectedDataPoints;
      
      if (days === 1) {
        interval = '2m';
        expectedDataPoints = 195;
      } else if (days === 3) {
        interval = '5m';
        expectedDataPoints = 576;
      } else if (days === 5) {
        interval = '15m';
        expectedDataPoints = 320;
      } else {
        interval = '1d';
        expectedDataPoints = days;
      }
      
      const queryOptions = {
        period1: period1,
        period2: period2,
        interval: interval
      };

      console.log('Yahoo Finance query params:', {
        period1: period1.toISOString(),
        period2: period2.toISOString(),
        interval: interval,
        expectedDataPoints: expectedDataPoints
      });

      const chart = await this.retryApiCall(() => yahooFinance.chart(ticker, queryOptions));
      
      if (!chart || !chart.quotes || chart.quotes.length === 0) {
        throw new Error(`Yahoo Finance did not return history data for ${ticker}`);
      }

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

      console.log(`Yahoo Finance returned ${historicalData.length} data points (expected ~${expectedDataPoints})`);
      
      const dataQuality = {
        actualPoints: historicalData.length,
        expectedPoints: expectedDataPoints,
        coverage: Math.round((historicalData.length / expectedDataPoints) * 100),
        interval: interval,
        timeRange: `${period1.toISOString().split('T')[0]} to ${period2.toISOString().split('T')[0]}`
      };
      
      return { 
        data: historicalData,
        source: `Yahoo Finance API - ${interval} interval`,
        symbol: chart.meta?.symbol || ticker,
        quality: dataQuality
      };
      
    } catch (error) {
      console.error(`Yahoo Finance get ${ticker} ${days} days data failed:`, error.message);
      throw new Error(`Yahoo Finance get ${ticker} history data failed: ${error.message}`);
    }
  }

  // Other methods
  async searchSymbols(keywords) {
    try {
      console.log(`Yahoo Finance search: ${keywords}`);
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

      console.log(`Yahoo Finance search returned ${searchResults.length} results`);
      return searchResults;
      
    } catch (error) {
      console.error(`Yahoo Finance search failed:`, error.message);
      return [];
    }
  }

  async getCompanyOverview(symbol) {
    try {
      console.log(`Yahoo Finance get ${symbol} company info`);
      const quote = await this.retryApiCall(() => yahooFinance.quote(symbol));
      
      if (!quote || !quote.symbol) {
        throw new Error(`Yahoo Finance did not return company info for ${symbol}`);
      }

      const overview = {
        symbol: quote.symbol,
        name: quote.longName || quote.shortName || quote.symbol,
        description: quote.longBusinessSummary || 'No description available',
        sector: quote.sector || 'Unknown',
        industry: quote.industry || 'Unknown',
        marketCapitalization: quote.marketCap || 0,
        peRatio: quote.trailingPE || quote.forwardPE || 0,
        beta: quote.beta || 0,
        dividendYield: quote.dividendYield || 0,
        eps: quote.trailingEps || 0,
        currency: quote.currency || 'USD',
        exchange: quote.fullExchangeName || quote.exchange || 'Unknown'
      };

      console.log(`Yahoo Finance returned ${symbol} company info`);
      return overview;
      
    } catch (error) {
      console.error(`Yahoo Finance get ${symbol} company info failed:`, error.message);
      throw new Error(`Yahoo Finance get ${symbol} company info failed: ${error.message}`);
    }
  }

  async getTrendingSymbols(region = 'US', count = 10) {
    try {
      console.log(`Yahoo Finance get trending stocks: ${region}`);
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

      console.log(`Yahoo Finance returned ${results.length} trending stocks`);
      return results;
      
    } catch (error) {
      console.error(`Yahoo Finance get trending failed:`, error.message);
      return [];
    }
  }

  async getRecommendations(symbol) {
    try {
      console.log(`Yahoo Finance get ${symbol} recommendations`);
      const recommendations = await this.retryApiCall(() => yahooFinance.recommendationsBySymbol(symbol));
      
      console.log(`Yahoo Finance returned ${symbol} recommendations`);
      return recommendations;
      
    } catch (error) {
      console.error(`Yahoo Finance get ${symbol} recommendations failed:`, error.message);
      return null;
    }
  }

  // Retry mechanism
  async retryApiCall(apiCall, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        if (i > 0) {
          console.log(`Retry attempt ${i}...`);
          await this.sleep(delay * i);
        }
        
        const result = await apiCall();
        return result;
        
      } catch (error) {
        console.log(`Attempt ${i + 1} failed:`, error.message);
        
        if (i === maxRetries - 1 || !this.isRetryableError(error)) {
          throw error;
        }
      }
    }
  }

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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new YahooFinanceService();