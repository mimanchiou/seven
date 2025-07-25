const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 连接数据库
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'myPa$$word',
    database: 'stocks' 
});

db.connect((err) => {
    if (err) {
        console.error("Error connecting to the database:", err);
        return;
    }
    console.log("Connected to the MySQL database.");
});

// 根路径API说明
app.get('/', (req, res) => {
    res.json({ 
        message: 'Portfolio Manager API is running!',
        version: '1.0.0',
        endpoints: [
            'GET /api/stocks - 获取所有股票信息',
            'GET /api/stock/:id/info - 获取单个股票信息',
            'GET /api/stock/:id/price - 获取股票最新价格',
            'GET /api/stock/:id/history - 获取股票历史数据',
            'POST /api/transaction - 记录交易行为',
            'GET /api/transactions - 获取交易历史'
        ]
    });
});

// 1. 获取所有股票信息
app.get('/api/stocks', (req, res) => {
    const query = 'SELECT stocks_id, stocks_name FROM stocks_info ORDER BY stocks_id';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ 
                error: 'Database query failed',
                details: err.message 
            });
        }
        
        console.log(`Retrieved ${results.length} stocks`);
        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
});

// 2. 获取单个股票信息
app.get('/api/stock/:id/info', (req, res) => {
    const stockId = parseInt(req.params.id);
    
    if (isNaN(stockId)) {
        return res.status(400).json({ 
            error: 'Invalid stock ID',
            message: 'Stock ID must be a number' 
        });
    }
    
    const query = 'SELECT * FROM stocks_info WHERE stocks_id = ?';
    
    db.query(query, [stockId], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ 
                error: 'Database query failed',
                details: err.message 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ 
                error: 'Stock not found',
                message: `No stock found with ID ${stockId}` 
            });
        }
        
        res.json({
            success: true,
            data: results[0]
        });
    });
});

// 3. 获取股票最新价格
app.get('/api/stock/:id/price', (req, res) => {
    const stockId = parseInt(req.params.id);
    
    if (isNaN(stockId)) {
        return res.status(400).json({ 
            error: 'Invalid stock ID' 
        });
    }
    
    const query = `
        SELECT sd.*, si.stocks_name 
        FROM stock_data sd
        LEFT JOIN stocks_info si ON sd.stock_info_id = si.stocks_id
        WHERE sd.stock_info_id = ? 
        ORDER BY sd.timestamp DESC 
        LIMIT 1
    `;
    
    db.query(query, [stockId], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ 
                error: 'Database query failed',
                details: err.message 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ 
                error: 'No price data found',
                message: `No price data found for stock ID ${stockId}` 
            });
        }
        
        const priceData = results[0];
        res.json({
            success: true,
            data: {
                stock_id: priceData.stock_info_id,
                stock_name: priceData.stocks_name,
                current_price: priceData.close,
                timestamp: priceData.timestamp,
                volume: priceData.volume,
                high: priceData.high,
                low: priceData.low,
                open: priceData.open
            }
        });
    });
});

// 4. 获取股票历史数据
app.get('/api/stock/:id/history', (req, res) => {
    const stockId = parseInt(req.params.id);
    const date = req.query.date; 
    const limit = parseInt(req.query.limit) || 100; // 默认返回100条记录
    
    if (isNaN(stockId)) {
        return res.status(400).json({ 
            error: 'Invalid stock ID' 
        });
    }
    
    let query = `
        SELECT sd.*, si.stocks_name 
        FROM stock_data sd
        LEFT JOIN stocks_info si ON sd.stock_info_id = si.stocks_id
        WHERE sd.stock_info_id = ?
    `;
    let params = [stockId];
    
    // 如果指定了日期，添加日期过滤
    if (date) {
        query += ' AND DATE(sd.timestamp) = ?';
        params.push(date);
    }
    
    query += ' ORDER BY sd.timestamp DESC LIMIT ?';
    params.push(limit);
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ 
                error: 'Database query failed',
                details: err.message 
            });
        }
        
        res.json({
            success: true,
            count: results.length,
            filters: {
                stock_id: stockId,
                date: date || 'all',
                limit: limit
            },
            data: results
        });
    });
});

// 5. 记录交易行为
app.post('/api/transaction', (req, res) => {
    const { stock_id, cash } = req.body;
    
    // 验证输入
    if (!stock_id || cash === undefined || cash === null) {
        return res.status(400).json({ 
            error: 'Missing required fields',
            message: 'stock_id and cash are required' 
        });
    }
    
    const stockIdNum = parseInt(stock_id);
    const cashNum = parseFloat(cash);
    
    if (isNaN(stockIdNum) || isNaN(cashNum)) {
        return res.status(400).json({ 
            error: 'Invalid data types',
            message: 'stock_id must be a number and cash must be a number' 
        });
    }
    
    // 先检查股票是否存在
    const checkStockQuery = 'SELECT stocks_id FROM stocks_info WHERE stocks_id = ?';
    
    db.query(checkStockQuery, [stockIdNum], (err, stockResults) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ 
                error: 'Database query failed',
                details: err.message 
            });
        }
        
        if (stockResults.length === 0) {
            return res.status(404).json({ 
                error: 'Stock not found',
                message: `Stock with ID ${stockIdNum} does not exist` 
            });
        }
        
        // 插入交易记录
        const insertQuery = `
            INSERT INTO user_behavior (stock_id, buy_time, cash) 
            VALUES (?, NOW(), ?)
        `;
        
        db.query(insertQuery, [stockIdNum, cashNum], (err, result) => {
            if (err) {
                console.error('Insert error:', err);
                return res.status(500).json({ 
                    error: 'Failed to record transaction',
                    details: err.message 
                });
            }
            
            console.log(`Transaction recorded: Stock ${stockIdNum}, Cash ${cashNum}`);
            res.status(201).json({ 
                success: true,
                message: 'Transaction recorded successfully',
                data: {
                    transaction_id: result.insertId,
                    stock_id: stockIdNum,
                    cash: cashNum,
                    timestamp: new Date().toISOString()
                }
            });
        });
    });
});

// 6. 获取交易历史
app.get('/api/transactions', (req, res) => {
    const limit = parseInt(req.query.limit) || 50; 
    const query = `
        SELECT 
            ub.id,
            ub.stock_id,
            ub.buy_time,
            ub.cash,
            si.stocks_name
        FROM user_behavior ub
        LEFT JOIN stocks_info si ON ub.stock_id = si.stocks_id
        ORDER BY ub.buy_time DESC
        LIMIT ?
    `;
    
    db.query(query, [limit], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ 
                error: 'Database query failed',
                details: err.message 
            });
        }
        
        res.json({
            success: true,
            count: results.length,
            limit: limit,
            data: results
        });
    });
});

// 7. 获取特定股票的交易历史
app.get('/api/stock/:id/transactions', (req, res) => {
    const stockId = parseInt(req.params.id);
    
    if (isNaN(stockId)) {
        return res.status(400).json({ 
            error: 'Invalid stock ID' 
        });
    }
    
    const query = `
        SELECT 
            ub.id,
            ub.stock_id,
            ub.buy_time,
            ub.cash,
            si.stocks_name
        FROM user_behavior ub
        LEFT JOIN stocks_info si ON ub.stock_id = si.stocks_id
        WHERE ub.stock_id = ?
        ORDER BY ub.buy_time DESC
    `;
    
    db.query(query, [stockId], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ 
                error: 'Database query failed',
                details: err.message 
            });
        }
        
        res.json({
            success: true,
            stock_id: stockId,
            count: results.length,
            data: results
        });
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong!'
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});


app.listen(PORT, () => {
    console.log(`Portfolio Manager API running on http://localhost:${PORT}`);
    console.log(`API Documentation available at http://localhost:${PORT}/`);
    console.log('Available endpoints:');
    console.log('- GET /api/stocks');
    console.log('- GET /api/stock/:id/price');
    console.log('- GET /api/stock/:id/history');
    console.log('- POST /api/transaction');
    console.log('- GET /api/transactions');
});