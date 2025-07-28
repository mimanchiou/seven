const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// API密钥
const ALPHAVANTAGE_API_KEY = 'LIJCDHQUDDQCGN9D';

app.use(cors());
app.use(express.json());

// Alpha Vantage API基础URL
const BASE_URL = 'https://www.alphavantage.co/query';

// 简单的内存数据库
let portfolioItems = [
  {
    id: 1,
    stockTicker: 'AAPL',
    quantity: 10,
    purchasePrice: 150.00,
    purchaseDate: '2024-01-15',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    stockTicker: 'GOOGL',
    quantity: 5,
    purchasePrice: 2800.00,
    purchaseDate: '2024-02-01',
    createdAt: new Date().toISOString()
  }
];

let nextId = 3;

// API调用
async function callAlphaVantageAPI(params) {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        ...params,
        apikey: ALPHAVANTAGE_API_KEY
      },
      timeout: 10000
    });

    if (response.data['Error Message']) {
      throw new Error(`API错误: ${response.data['Error Message']}`);
    }

    if (response.data['Note']) {
      throw new Error(`API限制: ${response.data['Note']}`);
    }

    return response.data;
  } catch (error) {
    console.error('API调用错误:', error.message);
    throw error;
  }
}

// 获取股票当前价格
async function getCurrentPrice(symbol) {
  try {
    const data = await callAlphaVantageAPI({
      function: 'GLOBAL_QUOTE',
      symbol: symbol
    });
    
    const quote = data['Global Quote'];
    return parseFloat(quote['05. price']);
  } catch (error) {
    console.error(`获取${symbol}价格失败:`, error.message);
    return null;
  }
}


app.get('/', (req, res) => {
  res.json({ 
    message: '投资组合管理系统 API', 
    time: new Date().toLocaleString('zh-CN'),
    version: '1.0.0'
  });
});

// 获取股票报价
app.get('/api/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`获取股票报价: ${symbol}`);
    
    const data = await callAlphaVantageAPI({
      function: 'GLOBAL_QUOTE',
      symbol: symbol.toUpperCase()
    });
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// 获取所有投资组合项目
app.get('/api/portfolio', async (req, res) => {
  try {
    console.log('获取投资组合列表');
    
    // 为每项添加当前价格和盈亏信息
    const portfolioWithPrices = await Promise.all(
      portfolioItems.map(async (item) => {
        const currentPrice = await getCurrentPrice(item.stockTicker);
        const currentValue = currentPrice ? currentPrice * item.quantity : null;
        const purchaseValue = item.purchasePrice * item.quantity;
        const gainLoss = currentValue ? currentValue - purchaseValue : null;
        const gainLossPercent = gainLoss ? ((gainLoss / purchaseValue) * 100).toFixed(2) : null;
        
        return {
          ...item,
          currentPrice,
          currentValue,
          purchaseValue,
          gainLoss,
          gainLossPercent: gainLossPercent ? `${gainLossPercent}%` : null
        };
      })
    );
    
    res.json({
      success: true,
      data: portfolioWithPrices,
      count: portfolioWithPrices.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取单个投资组合项目
app.get('/api/portfolio/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = portfolioItems.find(item => item.id === id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: '投资项目未找到'
      });
    }
    
    // 添加当前价格信息
    const currentPrice = await getCurrentPrice(item.stockTicker);
    const currentValue = currentPrice ? currentPrice * item.quantity : null;
    const purchaseValue = item.purchasePrice * item.quantity;
    const gainLoss = currentValue ? currentValue - purchaseValue : null;
    
    res.json({
      success: true,
      data: {
        ...item,
        currentPrice,
        currentValue,
        purchaseValue,
        gainLoss
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 添加新的投资项目
app.post('/api/portfolio', async (req, res) => {
  try {
    const { stockTicker, quantity, purchasePrice, purchaseDate } = req.body;
    
    // 基本验证
    if (!stockTicker || !quantity || !purchasePrice || !purchaseDate) {
      return res.status(400).json({
        success: false,
        error: '请提供所有必需字段: stockTicker, quantity, purchasePrice, purchaseDate'
      });
    }
    
    if (quantity <= 0 || purchasePrice <= 0) {
      return res.status(400).json({
        success: false,
        error: '数量和价格必须大于0'
      });
    }
    
    // 验证股票代码是否有效
    try {
      await getCurrentPrice(stockTicker.toUpperCase());
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: `无效的股票代码: ${stockTicker}`
      });
    }
    
    const newItem = {
      id: nextId++,
      stockTicker: stockTicker.toUpperCase(),
      quantity: parseInt(quantity),
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate,
      createdAt: new Date().toISOString()
    };
    
    portfolioItems.push(newItem);
    
    console.log('添加新投资项目:', newItem);
    
    res.status(201).json({
      success: true,
      data: newItem,
      message: '投资项目添加成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 更新投资项目
app.put('/api/portfolio/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const itemIndex = portfolioItems.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '投资项目未找到'
      });
    }
    
    const { stockTicker, quantity, purchasePrice, purchaseDate } = req.body;
    
    // 更新字段
    if (stockTicker) portfolioItems[itemIndex].stockTicker = stockTicker.toUpperCase();
    if (quantity) portfolioItems[itemIndex].quantity = parseInt(quantity);
    if (purchasePrice) portfolioItems[itemIndex].purchasePrice = parseFloat(purchasePrice);
    if (purchaseDate) portfolioItems[itemIndex].purchaseDate = purchaseDate;
    
    console.log('更新投资项目:', portfolioItems[itemIndex]);
    
    res.json({
      success: true,
      data: portfolioItems[itemIndex],
      message: '投资项目更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 删除投资项目
app.delete('/api/portfolio/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const itemIndex = portfolioItems.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '投资项目未找到'
      });
    }
    
    const deletedItem = portfolioItems.splice(itemIndex, 1)[0];
    
    console.log('删除投资项目:', deletedItem);
    
    res.json({
      success: true,
      data: deletedItem,
      message: '投资项目删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取投资组合总览
app.get('/api/portfolio/summary', async (req, res) => {
  try {
    console.log('获取投资组合总览');
    
    let totalPurchaseValue = 0;
    let totalCurrentValue = 0;
    let successCount = 0;
    
    const summaryData = await Promise.all(
      portfolioItems.map(async (item) => {
        try {
          const currentPrice = await getCurrentPrice(item.stockTicker);
          const purchaseValue = item.purchasePrice * item.quantity;
          const currentValue = currentPrice ? currentPrice * item.quantity : 0;
          
          totalPurchaseValue += purchaseValue;
          if (currentPrice) {
            totalCurrentValue += currentValue;
            successCount++;
          }
          
          return {
            stockTicker: item.stockTicker,
            quantity: item.quantity,
            purchaseValue,
            currentValue,
            currentPrice
          };
        } catch (error) {
          console.error(`获取${item.stockTicker}数据失败:`, error.message);
          return null;
        }
      })
    );
    
    const totalGainLoss = totalCurrentValue - totalPurchaseValue;
    const totalGainLossPercent = totalPurchaseValue > 0 ? 
      ((totalGainLoss / totalPurchaseValue) * 100).toFixed(2) : 0;
    
    res.json({
      success: true,
      data: {
        totalItems: portfolioItems.length,
        totalPurchaseValue: totalPurchaseValue.toFixed(2),
        totalCurrentValue: totalCurrentValue.toFixed(2),
        totalGainLoss: totalGainLoss.toFixed(2),
        totalGainLossPercent: `${totalGainLossPercent}%`,
        items: summaryData.filter(item => item !== null),
        dataRetrievalSuccess: `${successCount}/${portfolioItems.length}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log('=================================');
  console.log(' 投资组合管理系统启动成功！');
  console.log(`访问地址: http://localhost:${PORT}`);
  console.log('=================================');
  
  if (ALPHAVANTAGE_API_KEY === 'LIJCDHQUDDQCGN9D') {
    console.log('警告: 请设置你的Alpha Vantage API密钥！');
  } else {
    console.log('API密钥已设置');
  }
  
  console.log('\n 可用的API端点:');
  console.log('投资组合管理:');
  console.log('GET    /api/portfolio              - 获取所有投资项目');
  console.log('POST   /api/portfolio              - 添加新投资项目');
  console.log('GET    /api/portfolio/:id          - 获取特定投资项目');
  console.log('PUT    /api/portfolio/:id          - 更新投资项目');
  console.log('DELETE /api/portfolio/:id          - 删除投资项目');
  console.log('GET    /api/portfolio/summary      - 获取投资组合总览');
  console.log('\n股票数据:');
  console.log('GET    /api/quote/:symbol          - 获取股票报价');
  
  console.log('\n 示例数据已加载，包含AAPL和GOOGL');
});