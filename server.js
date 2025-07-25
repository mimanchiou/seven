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
    database: 'stocks'  // 确保使用正确的数据库名
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
        version: '1.1.0',
        endpoints: [
            'GET /api/stocks - 获取所有股票信息',
            'GET /api/stock/:id/info - 获取单个股票信息',
            'GET /api/stock/:id/price - 获取股票最新价格',
            'GET /api/stock/:id/history - 获取股票历史数据',
            'GET /api/stock/:id/stats - 获取股票统计信息（涨跌幅等）',
            'GET /api/dashboard - 获取仪表板概览数据',
            'POST /api/transaction - 记录交易行为',
            'GET /api/transactions - 获取交易历史',
            'GET /api/stock/:id/transactions - 获取特定股票的交易历史'
        ],
        available_dates: ['2025-07-18', '2025-07-21', '2025-07-22', '2025-07-23']
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

// 8. 获取股票价格统计（日内涨跌幅、最高最低等）
app.get('/api/stock/:id/stats', (req, res) => {
    const stockId = parseInt(req.params.id);
    const date = req.query.date || '2025-07-18'; // 默认使用有数据的日期
    
    if (isNaN(stockId)) {
        return res.status(400).json({ 
            error: 'Invalid stock ID',
            message: 'Stock ID must be a number' 
        });
    }
    
    const query = `
        SELECT 
            MIN(CAST(REPLACE(low, ',', '') AS DECIMAL(10,2))) as day_low,
            MAX(CAST(high AS DECIMAL(10,2))) as day_high,
            (SELECT open FROM stock_data WHERE stock_info_id = ? AND DATE(timestamp) = ? ORDER BY timestamp ASC LIMIT 1) as day_open,
            (SELECT close FROM stock_data WHERE stock_info_id = ? AND DATE(timestamp) = ? ORDER BY timestamp DESC LIMIT 1) as day_close,
            SUM(volume) as total_volume,
            COUNT(*) as data_points,
            AVG(CAST(close AS DECIMAL(10,2))) as avg_price,
            si.stocks_name
        FROM stock_data sd
        LEFT JOIN stocks_info si ON sd.stock_info_id = si.stocks_id
        WHERE sd.stock_info_id = ? AND DATE(sd.timestamp) = ?
        GROUP BY sd.stock_info_id, si.stocks_name
    `;
    
    db.query(query, [stockId, date, stockId, date, stockId, date], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ 
                error: 'Database query failed',
                details: err.message 
            });
        }
        
        if (results.length === 0 || !results[0].day_open) {
            return res.status(404).json({ 
                error: 'No data found',
                message: `No price data found for stock ${stockId} on ${date}`,
                suggestion: 'Try dates: 2025-07-18, 2025-07-21, 2025-07-22, 2025-07-23'
            });
        }
        
        const stats = results[0];
        const changeAmount = parseFloat((stats.day_close - stats.day_open).toFixed(2));
        const changePercent = parseFloat(((changeAmount / stats.day_open) * 100).toFixed(2));
        const priceRange = parseFloat((stats.day_high - stats.day_low).toFixed(2));
        
        res.json({
            success: true,
            stock_id: stockId,
            stock_name: stats.stocks_name,
            date: date,
            data: {
                day_open: parseFloat(stats.day_open || 0),
                day_close: parseFloat(stats.day_close || 0),
                day_high: parseFloat(stats.day_high || 0),
                day_low: parseFloat(stats.day_low || 0),
                change_amount: changeAmount,
                change_percent: changePercent,
                price_range: priceRange,
                total_volume: parseInt(stats.total_volume || 0),
                avg_price: stats.avg_price ? parseFloat(stats.avg_price.toFixed(2)) : 0,
                data_points: parseInt(stats.data_points || 0)
            }
        });
    });
});

// 9. 获取所有股票的概览（仪表板数据）
app.get('/api/dashboard', (req, res) => {
    const date = req.query.date || '2025-07-23'; // 默认使用最新的日期
    
    // 获取所有股票的基本信息
    const stocksQuery = 'SELECT stocks_id, stocks_name FROM stocks_info ORDER BY stocks_id';
    
    db.query(stocksQuery, (err, stocks) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ 
                error: 'Database query failed',
                details: err.message 
            });
        }
        
        if (stocks.length === 0) {
            return res.status(404).json({ 
                error: 'No stocks found',
                message: 'No stocks available in the database' 
            });
        }
        
        // 为每只股票获取最新价格数据
        let completedQueries = 0;
        const dashboardData = [];
        
        stocks.forEach((stock) => {
            const priceQuery = `
                SELECT 
                    close as current_price,
                    open as day_open,
                    CAST(high AS DECIMAL(10,2)) as day_high,
                    CAST(REPLACE(low, ',', '') AS DECIMAL(10,2)) as day_low,
                    volume,
                    timestamp
                FROM stock_data 
                WHERE stock_info_id = ? AND DATE(timestamp) = ?
                ORDER BY timestamp DESC 
                LIMIT 1
            `;
            
            db.query(priceQuery, [stock.stocks_id, date], (err, priceResults) => {
                if (!err && priceResults.length > 0) {
                    const priceData = priceResults[0];
                    const changeAmount = parseFloat((priceData.current_price - priceData.day_open).toFixed(2));
                    const changePercent = parseFloat(((changeAmount / priceData.day_open) * 100).toFixed(2));
                    
                    dashboardData.push({
                        stock_id: stock.stocks_id,
                        stock_name: stock.stocks_name,
                        current_price: parseFloat(priceData.current_price),
                        day_open: parseFloat(priceData.day_open),
                        day_high: parseFloat(priceData.day_high),
                        day_low: parseFloat(priceData.day_low),
                        change_amount: changeAmount,
                        change_percent: changePercent,
                        volume: parseInt(priceData.volume),
                        last_update: priceData.timestamp,
                        trend: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat'
                    });
                } else {
                    // 如果没有找到数据，添加基本信息
                    dashboardData.push({
                        stock_id: stock.stocks_id,
                        stock_name: stock.stocks_name,
                        current_price: null,
                        change_amount: 0,
                        change_percent: 0,
                        volume: 0,
                        last_update: null,
                        trend: 'no_data'
                    });
                }
                
                completedQueries++;
                
                // 当所有查询完成时返回结果
                if (completedQueries === stocks.length) {
                    // 按股票ID排序
                    dashboardData.sort((a, b) => a.stock_id - b.stock_id);
                    
                    // 计算市场概览
                    const validStocks = dashboardData.filter(stock => stock.current_price !== null);
                    const marketStats = {
                        total_stocks: stocks.length,
                        active_stocks: validStocks.length,
                        advancing: validStocks.filter(s => s.change_percent > 0).length,
                        declining: validStocks.filter(s => s.change_percent < 0).length,
                        unchanged: validStocks.filter(s => s.change_percent === 0).length,
                        total_volume: validStocks.reduce((sum, stock) => sum + stock.volume, 0)
                    };
                    
                    res.json({
                        success: true,
                        date: date,
                        market_stats: marketStats,
                        stocks: dashboardData,
                        generated_at: new Date().toISOString()
                    });
                }
            });
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
    console.log('- GET /api/stock/:id/info');
    console.log('- GET /api/stock/:id/price');
    console.log('- GET /api/stock/:id/history');
    console.log('- GET /api/stock/:id/stats');
    console.log('- GET /api/dashboard');
    console.log('- POST /api/transaction');
    console.log('- GET /api/transactions');
    console.log('- GET /api/stock/:id/transactions');
});