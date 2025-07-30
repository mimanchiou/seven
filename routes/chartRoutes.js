const express = require('express');
const HistoryController = require('../controllers/historyController');

const router = express.Router();

// 获取股票历史数据 - 支持1、3、5天
router.get('/:id/history', HistoryController.getStockHistory);

// 获取实时价格
router.get('/:ticker/current', HistoryController.getCurrentPrice);

// 获取股票推荐
router.get('/:ticker/recommendations', HistoryController.getRecommendations);

module.exports = router;