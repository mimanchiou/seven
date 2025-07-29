const https = require('https');

const BASE_URL = 'http://localhost:3000/api';

async function testPortfolioAPI() {
    console.log(' Testing Portfolio API...\n');
    
    try {
        // 1. 空投资组合
        console.log('1. Getting empty portfolio...');
        await makeRequest('GET', '/portfolio');
        
        // 2. 加股票
        console.log('\n2. Adding stocks to portfolio...');
        await makeRequest('POST', '/portfolio', {
            stockTicker: 'AAPL',
            quantity: 10,
            purchasePrice: 150
        });
        
        await makeRequest('POST', '/portfolio', {
            stockTicker: 'TSLA',
            quantity: 5,
            purchasePrice: 200
        });
        
        // 3. 投资组合
        console.log('\n3. Getting updated portfolio...');
        await makeRequest('GET', '/portfolio');
        
        // 4. 股票价格
        console.log('\n4. Getting current stock price...');
        await makeRequest('GET', '/stock/AAPL');
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/api${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        const req = require('http').request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`${method} ${path} - Status: ${res.statusCode}`);
                if (data) {
                    console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
                }
                resolve(data);
            });
        });
        
        req.on('error', reject);
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}


testPortfolioAPI();