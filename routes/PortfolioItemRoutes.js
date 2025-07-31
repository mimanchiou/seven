const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController.js');

// 股票组合相关路由
/**
 * @swagger
 * /portfolio-items/portfolio/buy:
 *   post:
 *     summary: Buy stock and add to portfolio
 *     tags: [Portfolio]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stockTicker:
 *                 type: string
 *                 example: AAPL
 *               quantity:
 *                 type: integer
 *                 example: 10
 *               purchasePrice:
 *                 type: number
 *                 example: 150.00
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-07-30
 *     responses:
 *       201:
 *         description: Stock purchased and added to portfolio successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/portfolio/buy', portfolioController.buyStock);
/**
 * @swagger
 * /portfolio-items/portfolio/user/{userId}:
 *   get:
 *     summary: Get portfolio for a specific user
 *     tags: [Portfolio]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: User ID to retrieve portfolio
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns user's portfolio items
 *       404:
 *         description: User portfolio not found
 */
router.get('/portfolio/user/:userId', portfolioController.getUserPortfolio);
/**
 * @swagger
 * /portfolio-items/portfolio/sell:
 *   put:
 *     summary: Sell stock from portfolio
 *     tags: [Portfolio]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stockTicker:
 *                 type: string
 *                 example: AAPL
 *               quantity:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: Stock sold successfully and portfolio updated
 *       400:
 *         description: Invalid input or insufficient quantity
 */
router.put('/portfolio/sell', portfolioController.sellStock);

/**
 * @swagger
 * /portfolio-items/portfolio/{itemId}:
 *   put:
 *     summary: Update a portfolio item by ID
 *     tags: [Portfolio]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         description: Portfolio item ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stockTicker:
 *                 type: string
 *                 example: MSFT
 *               quantity:
 *                 type: integer
 *                 example: 15
 *               purchasePrice:
 *                 type: number
 *                 example: 300.00
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-07-01
 *     responses:
 *       200:
 *         description: Portfolio item updated successfully
 *       404:
 *         description: Portfolio item not found
 */
router.put('/portfolio/:itemId', portfolioController.updatePortfolioItem);//根据id来改
/**
 * @swagger
 * /portfolio-items/portfolio/{name}:
 *   delete:
 *     summary: Delete a portfolio item by stock name
 *     tags: [Portfolio]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Stock name or ticker symbol to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Portfolio item deleted successfully
 *       404:
 *         description: Portfolio item not found
 */
router.delete('/portfolio/:name', portfolioController.deletePortfolioItem);
/**@swagger
 * /portfolio-items/portfolio/stock/{stock_name}:
 *   get:
 *     summary: Get total quantity of stock by stock name
 *     tags: [Portfolio]
 *     parameters:
 *       - in: path
 *         name: stock_name
 *         required: true
 *         description: The name or ticker symbol of the stock
 *         schema:
 *           type: string
 *           example: AAPL
 *     responses:
 *       200:
 *         description: Successfully returns the total quantity of the specified stock
 *       404:
 *         description: Stock not found in portfolio
 */ 
router.get('/portfolio/stock/:stock_name', portfolioController.getTotalQuantityByStock);
/**
 * @swagger
 * /portfolio-items/portfolio/get_all_stock_sum_quantity:
 *   get:
 *     summary: Get total quantity of all stocks in the portfolio
 *     tags: [Portfolio]
 *     responses:
 *       200:
 *         description: Successfully returns the total quantity of all stocks in the portfolio
 */
router.get('/portfolio/get_all_stock_sum_quantity', portfolioController.getAllStocksTotalQuantity);//获取所有股票的总持股数

module.exports = router;
