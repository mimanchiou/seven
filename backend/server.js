const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


let portfolio = [];
let nextId = 1;

// 1. 投资组合
app.get('/api/portfolio', (req, res) => {
    res.json(portfolio);
});

// 2. 添加股票
app.post('/api/portfolio', (req, res) => {
    const { stockTicker, quantity, purchasePrice } = req.body;
    
    if (!stockTicker || !quantity) {
        return res.status(400).json({ error: 'stockTicker and quantity are required' });
    }
    
    const newHolding = {
        id: nextId++,
        stockTicker: stockTicker.toUpperCase(),
        quantity: parseFloat(quantity),
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        purchaseDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    };
    
    portfolio.push(newHolding);
    res.status(201).json(newHolding);
});

// 3. 删除
app.delete('/api/portfolio/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = portfolio.findIndex(item => item.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Portfolio item not found' });
    }
    
    const deleted = portfolio.splice(index, 1)[0];
    res.json(deleted);
});

// 4. 股票当前价格
app.get('/api/stock/:ticker', async (req, res) => {
    const ticker = req.params.ticker.toUpperCase();
    
    try {
        const stockData = await getStockData(ticker);
        const currentPrice = extractPrice(stockData);
        
        res.json({
            ticker: ticker,
            currentPrice: currentPrice,
            rawData: stockData
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to fetch data for ${ticker}: ${error.message}` });
    }
});


app.get('/', (req, res) => {
    res.json({ 
        message: 'Portfolio Manager API is running!',
        endpoints: [
            'GET /api/portfolio - 查看投资组合',
            'POST /api/portfolio - 添加股票',
            'DELETE /api/portfolio/:id - 删除股票',
            'GET /api/stock/:ticker - 获取股票价格'
        ]
    });
});


function getStockData(ticker) {
    return new Promise((resolve, reject) => {
        const url = `https://c4rm9elh30.execute-api.us-east-1.amazonaws.com/default/cachedPriceData?ticker=${ticker}`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    if (data.trim() === '') {
                        reject(new Error('Empty response'));
                        return;
                    }
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        }).on('error', reject);
    });
}


function extractPrice(stockData) {

    if (stockData && stockData.price_data && stockData.price_data.close) {
        const closePrices = stockData.price_data.close;
        return closePrices[closePrices.length - 1]; // 返回最新的收盘价
    }
    return null;
}


app.listen(PORT, () => {
    console.log(`Portfolio Manager API running on http://localhost:${PORT}`);
    console.log(`Test the API at http://localhost:${PORT}/api/portfolio`);
    console.log(` API Documentation at http://localhost:${PORT}/`);
});