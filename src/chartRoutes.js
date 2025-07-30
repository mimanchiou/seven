const express = require('express');
const HistoryController = require('../controllers/historyController');
const router = express.Router();

// Get stock history data - supports 1, 3, 5 days
router.get('/:id/history', HistoryController.getStockHistory);

// Get real-time price
router.get('/:ticker/current', HistoryController.getCurrentPrice);

// Get stock recommendations
router.get('/:ticker/recommendations', HistoryController.getRecommendations);

module.exports = router;