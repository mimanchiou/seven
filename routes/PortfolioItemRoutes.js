const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController.js');

// 股票组合相关路由
router.post('/portfolio/buy', portfolioController.buyStock);
router.get('/portfolio/user/:userId', portfolioController.getUserPortfolio);
router.put('/portfolio/sell', portfolioController.sellStock);
router.put('/portfolio/:itemId', portfolioController.updatePortfolioItem);//根据id来改
router.delete('/portfolio/:name', portfolioController.deletePortfolioItem);
router.get('/portfolio/stock/:stock_name', portfolioController.getTotalQuantityByStock);//根据股票名称获取总持股数
router.get('/portfolio/get_all_stock_sum_quantity', portfolioController.getAllStocksTotalQuantity);//获取所有股票的总持股数

module.exports = router;
