const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import configurations and services
const HistoryController = require('./controllers/historyController');

// Import routes
const chartRoutes = require('./routes/chartRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file service
app.use(express.static(path.join(__dirname, '../public')));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Yahoo Finance service
const yahooFinanceService = require('./services/yahooFinanceService');

// Basic routes
app.get('/', (req, res) => {
  res.json({
    message: 'Stock Chart API (Yahoo Finance)',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    provider: 'Yahoo Finance',
    endpoints: {
      quickChart: '/api/quick-chart/:ticker/:days',
      trending: '/api/stocks/trending',
      health: '/health',
      api: '/api'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      charts: 'active',
      yahooFinance: 'active'
    },
    version: '3.0.0'
  });
});

// Chart data API
// Register chart routes
app.use('/api/chart', chartRoutes);

// Quick chart data - core feature
app.get('/api/quick-chart/:ticker/:days', HistoryController.getQuickChartData);

// Stock search API
app.get('/api/stocks/search', HistoryController.searchStocks);

// Get stock detailed info
app.get('/api/stocks/:ticker/info', HistoryController.getStockInfo);

// Add stock to database
app.post('/api/stocks', HistoryController.addStock);

// Get trending stocks
app.get('/api/stocks/trending', HistoryController.getTrendingStocks);

// Get stock recommendations
app.get('/api/stocks/:ticker/recommendations', HistoryController.getRecommendations);

// Compatible quote API
app.get('/api/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`Get stock quote: ${symbol}`);
    
    const priceData = await yahooFinanceService.getCurrentPrice(symbol);
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      data: priceData,
      provider: 'Yahoo Finance'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API documentation
app.get('/api', (req, res) => {
  res.json({
    title: 'Stock Chart API (Yahoo Finance Edition)',
    version: '3.0.0',
    description: 'Using Yahoo Finance',
    provider: 'Yahoo Finance',
    baseURL: `http://localhost:${PORT}`,
    
    endpoints: {
      
      // Chart data (core feature)
      charts: {
        'GET /api/quick-chart/:ticker/:days': 'Quick chart data (days: 1|3|5)',
        'GET /api/chart/:ticker/current': 'Get real-time price',
        'GET /api/chart/:ticker/recommendations': 'Get stock recommendations'
      },
      
      // Stock management
      stocks: {
        'GET /api/stocks/search?q=keyword': 'Search stocks',
        'GET /api/stocks/:ticker/info': 'Get stock detailed info',
        'GET /api/stocks/trending?region=US&count=10': 'Get trending stocks',
        'GET /api/stocks/:ticker/recommendations': 'Get stock recommendations',
        'POST /api/stocks': 'Validate and add stock',
        'GET /api/quote/:symbol': 'Get stock quote'
      },
      
      // System
      system: {
        'GET /health': 'Health check',
        'GET /api': 'API documentation'
      }
    },
    
    examples: {
      quickChart1Day: {
        url: `/api/quick-chart/AAPL/1`,
        description: 'Get AAPL 1-day chart data (5-minute interval)',
        method: 'GET'
      },
      quickChart5Day: {
        url: `/api/quick-chart/AAPL/5`,
        description: 'Get AAPL 5-day chart data (daily data)',
        method: 'GET'
      },
      trending: {
        url: `/api/stocks/trending?region=US&count=5`,
        description: 'Get top 5 trending US stocks',
        method: 'GET'
      },
      search: {
        url: `/api/stocks/search?q=Apple`,
        description: 'Search stocks containing Apple',
        method: 'GET'
      }
    },
    
    features: [
      'Real-time price updates', 
      '1, 3, 5 day historical data',
      'Stock search functionality',
      'Trending stock recommendations',
      'Company basic information',
      'Chart.js ready data format'
    ]
  });
});

// Error handling middleware
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Requested resource not found',
    path: req.originalUrl,
    method: req.method,
    suggestion: 'Visit /api to see available API endpoints'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  // Yahoo Finance API error
  if (error.message && error.message.includes('Yahoo Finance')) {
    return res.status(503).json({
      success: false,
      error: 'Yahoo Finance API temporarily unavailable',
      details: error.message
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Please contact administrator'
  });
});

// Server startup
async function startServer() {
  try {
    const server = app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('Service started successfully! (Yahoo Finance Edition)');
      console.log(`Service URL: http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(60));
      
      console.log('\nChart Data API :');
      console.log('  GET    /api/quick-chart/AAPL/1        - 1-day data (5-minute interval)');
      console.log('  GET    /api/quick-chart/AAPL/3        - 3-day data (daily)');
      console.log('  GET    /api/quick-chart/AAPL/5        - 5-day data (daily)');
      console.log('  GET    /api/chart/:ticker/current     - Get real-time price');
      
      console.log('\nStock Management API:');
      console.log('  GET    /api/stocks/search?q=AAPL     - Search stocks');
      console.log('  GET    /api/stocks/AAPL/info         - Stock details');
      console.log('  GET    /api/stocks/trending           - Trending stocks');
      console.log('  GET    /api/stocks/AAPL/recommendations - Stock recommendations');
      console.log('  POST   /api/stocks                    - Validate stock');
      console.log('  GET    /api/quote/AAPL               - Get quote');
      
      console.log('\nSystem:');
      console.log('  GET    /health                        - Health check');
      console.log('  GET    /api                           - API documentation');
      
      console.log('\nData Provider: Yahoo Finance');
      console.log('Service ready!');
      
      console.log('\nQuick Test:');
      console.log(`   1-day chart: curl http://localhost:${PORT}/api/quick-chart/AAPL/1`);
      console.log(`   3-day chart: curl http://localhost:${PORT}/api/quick-chart/AAPL/3`);
      console.log(`   5-day chart: curl http://localhost:${PORT}/api/quick-chart/AAPL/5`);
      console.log(`   Trending stocks: curl http://localhost:${PORT}/api/stocks/trending`);
      console.log(`   Stock search: curl "http://localhost:${PORT}/api/stocks/search?q=Apple"`);
      console.log(`   API docs: http://localhost:${PORT}/api`);
      console.log('');
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\nReceived ${signal} signal, starting shutdown...`);
      
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
      
      setTimeout(() => {
        console.error('Force shutdown server');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

// Only start server when this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;