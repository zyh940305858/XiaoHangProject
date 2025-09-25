// 认证相关路由 - 处理用户注册、登录、登出等功能
const express = require('express');
const router = express.Router();
const UserModel = require('../models/user.model');
const { authJWT } = require('../middleware/auth.jwt');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 用户认证相关接口
 */

/**
 * @swagger
 * /api/user-center/auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username: 
 *                 type: string
 *                 description: 用户名
 *               email: 
 *                 type: string
 *                 description: 邮箱
 *               password: 
 *                 type: string
 *                 description: 密码
 *               nickname: 
 *                 type: string
 *                 description: 昵称
 *               source: 
 *                 type: string
 *                 description: 注册来源
 *     responses:
 *       201: 
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: 
 *                   type: number
 *                 message: 
 *                   type: string
 *                 data: 
 *                   type: object
 *       400: 
 *         description: 注册失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: 
 *                   type: number
 *                 message: 
 *                   type: string
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, nickname, source } = req.body;

    // 验证参数
    if (!username || !email || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名、邮箱和密码为必填项'
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '密码长度不能少于6位'
      });
    }

    // 创建用户
    const user = await UserModel.createUser({
      username,
      email,
      password,
      nickname,
      source
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json(user);
  }
});

/**
 * @swagger
 * /api/user-center/auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username: 
 *                 type: string
 *                 description: 用户名或邮箱
 *               password: 
 *                 type: string
 *                 description: 密码
 *     responses:
 *       200: 
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: 
 *                   type: number
 *                 message: 
 *                   type: string
 *                 data: 
 *                   type: object
 *                   properties:
 *                     user: 
 *                       type: object
 *                     token: 
 *                       type: string
 *       401: 
 *         description: 登录失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: 
 *                   type: number
 *                 message: 
 *                   type: string
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证参数
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码为必填项'
      });
    }

    // 获取登录信息
    const loginInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    // 用户登录
    const result = await UserModel.login(username, password, loginInfo);

    res.status(200).json(result);
  } catch (error) {
    res.status(200).json({
      code: 401,
      message: error.message || '用户名或密码错误'
    });
  }
});

/**
 * @swagger
 * /api/user-center/auth/logout:
 *   post:
 *     summary: 用户登出
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: 
 *         description: 登出成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: 
 *                   type: number
 *                 message: 
 *                   type: string
 *       401: 
 *         description: 未授权
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: 
 *                   type: number
 *                 message: 
 *                   type: string
 */
router.post('/logout', authJWT, async (req, res) => {
  try {
    // 注销当前会话
    await UserModel.logout(req.user.id, req.token);

    res.status(200).json({
      code: 200,
      message: '登出成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message || '登出失败'
    });
  }
});

/**
 * @swagger
 * /api/user-center/auth/logout-all:
 *   post:
 *     summary: 注销所有设备会话
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: 
 *         description: 注销成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: 
 *                   type: number
 *                 message: 
 *                   type: string
 *       401: 
 *         description: 未授权
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: 
 *                   type: number
 *                 message: 
 *                   type: string
 */
router.post('/logout-all', authJWT, async (req, res) => {
  try {
    // 注销所有会话
    await UserModel.logout(req.user.id);

    res.status(200).json({
      code: 200,
      message: '所有设备已登出'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message || '操作失败'
    });
  }
});

/**
 * @swagger
 * /api/user-center/auth/me:
 *   get:
 *     summary: 获取当前用户信息
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: 
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: 
 *                   type: number
 *                 message: 
 *                   type: string
 *                 data: 
 *                   type: object
 *       401: 
 *         description: 未授权
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: 
 *                   type: number
 *                 message: 
 *                   type: string
 */
router.get('/me', authJWT, async (req, res) => {
  try {
    // 获取当前用户详细信息
    const userInfo = await UserModel.getUserInfo(req.user.id);

    res.status(200).json(userInfo);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message || '获取用户信息失败'
    });
  }
});

// Swagger定义JWT认证方式
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;