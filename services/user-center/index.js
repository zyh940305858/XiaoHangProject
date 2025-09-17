// 用户中心服务主入口
const express = require('express');
const router = express.Router();
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

// 使用认证路由
router.use('/auth', authRoutes);

// 使用用户信息路由
router.use('/users', userRoutes);

module.exports = router;