const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');

// 用户相关路由
//router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);
router.put('/:id/funds', userController.updateFunds);
router.delete('/:id', userController.deleteUser);

module.exports = router;
