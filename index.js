const express = require('express');
const db = require('./config/db.js');
// 在文件顶部，其他 require 语句旁边
const yahooFinanceService = require('./services/yahooFinanceService.js');

const HistoryController = require('./controllers/historyController');
const app = express();
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const PORT = 8080;

app.use(express.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 导入路由
const chartRoutes = require('./routes/chartRoutes');
const userRoutes = require('./routes/userRoutes.js');
const portfolioItemRoutes = require('./routes/PortfolioItemRoutes.js');
const stockDetailroutes = require('./routes/stockDetailRoutes.js');

// 中间件设置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use('/users', userRoutes);
app.use('/portfolio-items', portfolioItemRoutes);
app.use('/stocks', stockDetailroutes);

app.use(express.static(path.join(__dirname, '../public')));

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});


// ==================== 图表数据API ====================
// 注册图表路由
app.use('/api/chart', chartRoutes);

// 快速获取图表数据 - 核心功能
app.get('/api/quick-chart/:ticker/:days', HistoryController.getQuickChartData);

// 股票搜索API
app.get('/api/stocks/search', HistoryController.searchStocks);

// 获取股票详细信息
app.get('/api/stocks/:ticker/info', HistoryController.getStockInfo);

// 添加股票到数据库
app.post('/api/stocks', HistoryController.addStock);

// 获取趋势股票 - 新功能
app.get('/api/stocks/trending', HistoryController.getTrendingStocks);

// 获取股票推荐 - 新功能
app.get('/api/stocks/:ticker/recommendations', HistoryController.getRecommendations);

// 兼容原有的报价API
app.get('/api/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`获取股票报价: ${symbol}`);
    
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

// ==================== API文档 ====================
app.get('/api', (req, res) => {
  res.json({
    title: '股票投资组合 + 图表 API (Yahoo Finance版)',
    version: '3.0.0',
    description: '使用Yahoo Finance',
    provider: 'Yahoo Finance',
    baseURL: `http://localhost:${PORT}`,
    
    endpoints: {
      
      // 投资组合管理
      portfolio: {
        'GET /api/portfolio': '获取所有投资项目',
        'GET /api/portfolio/:id': '获取单个投资项目',
        'POST /api/portfolio': '添加新投资项目',
        'PUT /api/portfolio/:id': '更新投资项目',
        'DELETE /api/portfolio/:id': '删除投资项目',
        'GET /api/portfolio/summary': '获取投资组合总览'
      },
      
      // 图表数据 (核心功能)
      charts: {
        'GET /api/quick-chart/:ticker/:days': '快速获取图表数据 (天数: 1|3|5)',
        'GET /api/chart/:ticker/current': '获取实时价格',
        'GET /api/chart/:ticker/recommendations': '获取股票推荐'
      },
      
      // 股票管理
      stocks: {
        'GET /api/stocks/search?q=keyword': '搜索股票',
        'GET /api/stocks/:ticker/info': '获取股票详细信息',
        'GET /api/stocks/trending?region=US&count=10': '获取趋势股票',
        'GET /api/stocks/:ticker/recommendations': '获取股票推荐',
        'POST /api/stocks': '验证并添加股票',
        'GET /api/quote/:symbol': '获取股票报价'
      },
      
      // 系统
      system: {
        'GET /health': '健康检查',
        'GET /api': 'API文档'
      }
    },
    
    examples: {
      quickChart1Day: {
        url: `/api/quick-chart/AAPL/1`,
        description: '获取AAPL 1天图表数据（5分钟间隔）',
        method: 'GET'
      },
      quickChart5Day: {
        url: `/api/quick-chart/AAPL/5`,
        description: '获取AAPL 5天图表数据（每日数据）',
        method: 'GET'
      },
      portfolio: {
        url: `/api/portfolio`,
        description: '获取投资组合（使用Yahoo Finance实时价格）',
        method: 'GET'
      },
      addPortfolioItem: {
        url: `/api/portfolio`,
        method: 'POST',
        description: '添加投资项目',
        body: {
          stockTicker: 'MSFT',
          quantity: 10,
          purchasePrice: 300.00,
          purchaseDate: '2024-07-29'
        }
      },
      trending: {
        url: `/api/stocks/trending?region=US&count=5`,
        description: '获取美国前5只趋势股票',
        method: 'GET'
      },
      search: {
        url: `/api/stocks/search?q=Apple`,
        description: '搜索包含Apple的股票',
        method: 'GET'
      }
    },
    
    features: [
      '✅ 免费无限制股票数据',
      '✅ 实时价格更新', 
      '✅ 1、3、5天历史数据',
      '✅ 股票搜索功能',
      '✅ 趋势股票推荐',
      '✅ 公司基本信息',
      '✅ 投资组合管理',
      '✅ Chart.js就绪的数据格式'
    ]
  });
});

// ==================== 错误处理中间件 ====================
// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '请求的资源不存在',
    path: req.originalUrl,
    method: req.method,
    suggestion: '访问 /api 查看可用的API端点'
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('未处理的错误:', error);
  
  // Yahoo Finance API错误
  if (error.message && error.message.includes('Yahoo Finance')) {
    return res.status(503).json({
      success: false,
      error: 'Yahoo Finance API暂时不可用',
      details: error.message
    });
  }
  
  // 默认错误响应
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? error.message : '请联系管理员'
  });
});

// ==================== 服务器启动 ====================
async function startServer() {
  try {
    // 可选：测试数据库连接
    if (process.env.DB_HOST) {
      console.log('🔍 检查数据库连接...');
      try {
        const dbConnected = await testConnection();
        if (dbConnected) {
          console.log('✅ 数据库连接成功');
        } else {
          console.log('⚠️ 数据库连接失败，投资组合数据将保存在内存中');
        }
      } catch (error) {
        console.log('⚠️ 数据库连接失败，投资组合数据将保存在内存中');
      }
    }

    
    const server = app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('服务启动成功！(Yahoo Finance版)');
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(60));
      
      console.log('📊 投资组合API:');
      console.log('  GET    /api/portfolio                 - 获取投资组合');
      console.log('  POST   /api/portfolio                 - 添加投资项目');
      console.log('  GET    /api/portfolio/summary         - 获取组合总览');
      console.log('  PUT    /api/portfolio/:id             - 更新投资项目');
      console.log('  DELETE /api/portfolio/:id             - 删除投资项目');
      
      console.log('\n📈 图表数据API (核心功能):');
      console.log('  GET    /api/quick-chart/AAPL/1        - 1天数据（5分钟间隔）');
      console.log('  GET    /api/quick-chart/AAPL/3        - 3天数据（每日）');
      console.log('  GET    /api/quick-chart/AAPL/5        - 5天数据（每日）');
      console.log('  GET    /api/chart/:ticker/current     - 获取实时价格');
      
      console.log('\n🔍 股票管理API:');
      console.log('  GET    /api/stocks/search?q=AAPL     - 搜索股票');
      console.log('  GET    /api/stocks/AAPL/info         - 股票详情');
      console.log('  GET    /api/stocks/trending           - 趋势股票');
      console.log('  GET    /api/stocks/AAPL/recommendations - 股票推荐');
      console.log('  POST   /api/stocks                    - 验证股票');
      console.log('  GET    /api/quote/AAPL               - 获取报价');
      
      console.log('\n🌐 系统:');
      console.log('  GET    /health                        - 健康检查');
      console.log('  GET    /api                           - API文档');
      
      console.log('\n💡 数据提供商: Yahoo Finance (免费无限制)');
      console.log('✨ 服务已就绪！');
      
      console.log('\n🎯 快速测试:');
      console.log(`   投资组合: curl http://localhost:${PORT}/api/portfolio`);
      console.log(`   1天图表:  curl http://localhost:${PORT}/api/quick-chart/AAPL/1`);
      console.log(`   3天图表:  curl http://localhost:${PORT}/api/quick-chart/AAPL/3`);
      console.log(`   5天图表:  curl http://localhost:${PORT}/api/quick-chart/AAPL/5`);
      console.log(`   趋势股票: curl http://localhost:${PORT}/api/stocks/trending`);
      console.log(`   股票搜索: curl "http://localhost:${PORT}/api/stocks/search?q=Apple"`);
      console.log(`   API文档:  http://localhost:${PORT}/api`);
      console.log('');
    });

    // 优雅关闭
    const gracefulShutdown = (signal) => {
      console.log(`\n📥 收到 ${signal} 信号，开始关闭...`);
      
      server.close(() => {
        console.log('🛑 HTTP 服务器已关闭');
        process.exit(0);
      });
      
      setTimeout(() => {
        console.error('⚠️ 强制关闭服务器');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ 服务器启动失败:', error.message);
    process.exit(1);
  }
}

// 只有直接运行此文件时才启动服务器
if (require.main === module) {
  startServer();
}


// 启动服务器
/*app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});*/
