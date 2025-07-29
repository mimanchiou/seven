Portfolio-mgr7

1.Visual display of Portfolio Page
2.Resrieving user investment details
3.Implementing CRUD operations for Portfolio items

Historical Price Data API  
This module handles historical stock price data retrieval and processing for the portfolio management system.  

**Core Functionality**
Yahoo Finance Integration - Fetches real-time and historical stock data  
1.Implements dynamic ES6 module import in CommonJS environment  
2.Handles Yahoo Finance API authentication and rate limiting  
3.Provides retry mechanism for 403 Forbidden errors  

Historical Price Endpoints  
* GET /api/quick-chart/:ticker/:days     # Main historical data endpoint
* GET /api/chart/:ticker/current         # Current price data
* GET /api/stocks/search?q=keyword       # Stock symbol search
* GET /api/stocks/:ticker/info           # Company information

Data Processing Features  
Time Intervals & Data Points  
* 1 Day: 2-minute intervals → ~195 data points  
* 3 Days: 5-minute intervals → ~576 data points  
* 5 Days: 15-minute intervals → ~320 data points  

Chart-Ready Data Format  
Provides Chart.js compatible data structure:  
json  
{
  "chartData": {
    "labels": ["09:30", "09:32", "09:34"],
    "datasets": [{
      "label": "AAPL high",
      "data": [214.25, 214.30, 214.28]
    }]
  }
}  

Technical Implementation  
Yahoo Finance Service (yahooFinanceService.js):  

// Dynamic ES6 import handling  
const yahooFinanceModule = await import('yahoo-finance2');
this.yahooFinance = yahooFinanceModule.default;

// Historical data retrieval
async getHistoryByDays(ticker, days) {
  const queryOptions = {
    period1: startDate,
    period2: endDate, 
    interval: days === 1 ? '2m' : days === 3 ? '5m' : '15m'
  };
  
  const chart = await yahooFinance.chart(ticker, queryOptions);
  return this.formatHighPriceData(chart.quotes);
}

History Controller (historyController.js):
// Main endpoint handler  
static async getQuickChartData(req, res) {  
  const { ticker, days } = req.params;  
  const historyData = await yahooFinanceService.getHistoryByDays(ticker, days);  
  
  // Extract high price data points  
  const pricePoints = historyData.data.map(item => ({  
    time: item.timestamp.toISOString(),  
    price: item.high  // Focus on high price  
  }));  
  
  res.json({ success: true, data: { pricePoints, chartData, stats } });  
}  

Testing Historical Price API  
# Test 1-day data (2-minute intervals)
curl "http://localhost:3000/api/quick-chart/AAPL/1"

# Test 3-day data (5-minute intervals)  
curl "http://localhost:3000/api/quick-chart/TSLA/3"

# Test 5-day data (15-minute intervals)
curl "http://localhost:3000/api/quick-chart/GOOGL/5"

# Test current price
curl "http://localhost:3000/api/chart/AAPL/current"

# Test stock search
curl "http://localhost:3000/api/stocks/search?q=Apple"