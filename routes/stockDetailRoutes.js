const express = require('express');
const router = express.Router();
const stockDetailController = require('../controllers/stockDetailController');

// 路由映射
router.post('/', stockDetailController.create); // 创建记录
router.get('/:id', stockDetailController.getById); // 根据ID查询
router.get('/name/:name', stockDetailController.getByName); // 根据股票名称查询
router.put('/:id', stockDetailController.update); // 更新记录
router.delete('/:id', stockDetailController.delete); // 删除记录
router.get('/range', stockDetailController.getByTimeRange); // 时间范围查询

module.exports = router;
    