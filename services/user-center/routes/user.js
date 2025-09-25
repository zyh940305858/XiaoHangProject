// 用户信息相关路由 - 处理用户信息的获取、更新等功能
const express = require('express');
const router = express.Router();
const UserModel = require('../models/user.model');
const { authJWT, authorizeRoles } = require('../middleware/auth.jwt');

/**
 * @swagger
 * tags:
 *   name: User
 *   description: 用户信息管理相关接口
 */

/**
 * @swagger
 * /api/user-center/users:
 *   get:
 *     summary: 获取用户列表（管理员可用）
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: 用户名筛选
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: 邮箱筛选
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: 角色筛选
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 状态筛选
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
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
 *                   properties:
 *                     users: 
 *                       type: array
 *                       items: 
 *                         type: object
 *                     total: 
 *                       type: number
 *       401: 
 *         description: 未授权
 *       403: 
 *         description: 权限不足
 */
router.get('/', authJWT, authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { username, email, role, status, page = 1, pageSize = 10 } = req.query;
    
    // 构建过滤条件
    const filters = {};
    if (username) filters.username = username;
    if (email) filters.email = email;
    if (role) filters.role = role;
    if (status) filters.status = status;
    
    const result = await UserModel.getUserList(
      filters,
      parseInt(page),
      parseInt(pageSize)
    );
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message || '获取用户列表失败'
    });
  }
});

/**
 * @swagger
 * /api/user-center/users:
 *   post:
 *     summary: 管理员创建用户
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
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
 *               role: 
 *                 type: string
 *                 enum: [user, admin, superadmin]
 *                 description: 角色
 *               status: 
 *                 type: string
 *                 enum: [active, inactive, blocked]
 *                 description: 状态
 *               disabledRemark: 
 *                 type: string
 *                 description: 禁用备注（仅在status为blocked时有效）
 *     responses:
 *       200: 
 *         description: 创建成功
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
 *         description: 创建失败
 *       401: 
 *         description: 未授权
 *       403: 
 *         description: 权限不足
 */
router.post('/', authJWT, authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { username, email, password, nickname, role, status, disabledRemark } = req.body;
    
    // 验证参数
    if (!username || !email || !password) {
      return res.status(200).json({
        code: 400,
        message: '请提供用户名、邮箱和密码'
      });
    }
    
    if (password.length < 6) {
      return res.status(200).json({
        code: 400,
        message: '密码长度不能少于6位'
      });
    }
    
    const userData = {
      username,
      email,
      password,
      nickname,
      role,
      status,
      disabledRemark
    };
    
    const user = await UserModel.adminCreateUser(userData);
    
    res.status(200).json(user);
  } catch (error) {
    res.status(200).json({
      code: 400,
      message: error.message || '创建用户失败'
    });
  }
});

/**
 * @swagger
 * /api/user-center/users/{id}:
 *   delete:
 *     summary: 删除用户（管理员可用）
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     responses:
 *       200: 
 *         description: 删除成功
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
 *       403: 
 *         description: 权限不足
 *       404: 
 *         description: 用户不存在
 */
router.delete('/:id', authJWT, authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的用户ID'
      });
    }
    
    // 不允许删除当前登录用户
    if (req.user.id === userId) {
      return res.status(400).json({
        code: 400,
        message: '不能删除当前登录用户'
      });
    }
    
    // 不允许普通管理员删除超级管理员
    if (req.user.role === 'admin') {
      const targetUser = await UserModel.getUserInfo(userId);
      if (targetUser.role === 'superadmin') {
        return res.status(403).json({
          code: 403,
          message: '权限不足，无法删除超级管理员'
        });
      }
    }
    
    await UserModel.deleteUser(userId);
    
    res.status(200).json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    if (error.message === '用户不存在') {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }
    res.status(500).json({
      code: 500,
      message: error.message || '删除用户失败'
    });
  }
});

/**
 * @swagger
 * /api/user-center/users/{id}:
 *   get:
 *     summary: 获取用户信息（管理员可用）
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
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
 *       403: 
 *         description: 权限不足
 *       404: 
 *         description: 用户不存在
 */
router.get('/:id', authJWT, authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的用户ID'
      });
    }

    const userInfo = await UserModel.getUserInfo(userId);

    res.status(200).json(userInfo);
  } catch (error) {
    if (error.message === '用户不存在') {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }
    res.status(500).json({
      code: 500,
      message: error.message || '获取用户信息失败'
    });
  }
});

/**
 * @swagger
 * /api/user-center/users/me:
 *   put:
 *     summary: 更新当前用户信息
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname: 
 *                 type: string
 *                 description: 昵称
 *               avatar: 
 *                 type: string
 *                 description: 头像URL
 *               password: 
 *                 type: string
 *                 description: 密码（如需修改）
 *     responses:
 *       200: 
 *         description: 更新成功
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
 */
router.put('/me', authJWT, async (req, res) => {
  try {
    const { nickname, avatar, password } = req.body;
    
    // 构建更新数据
    const updateData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          code: 400,
          message: '密码长度不能少于6位'
        });
      }
      updateData.password = password;
    }

    // 如果没有可更新的字段
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供要更新的字段'
      });
    }

    const updatedUser = await UserModel.updateUser(req.user.id, updateData);

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({
      code: 400,
      message: error.message || '更新失败'
    });
  }
});

/**
 * @swagger
 * /api/user-center/users/{id}:
 *   put:
 *     summary: 更新用户信息（管理员可用）
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname: 
 *                 type: string
 *                 description: 昵称
 *               avatar: 
 *                 type: string
 *                 description: 头像URL
 *               role: 
 *                 type: string
 *                 enum: [user, admin, superadmin]
 *                 description: 角色
 *               status: 
 *                 type: string
 *                 enum: [active, inactive, blocked]
 *                 description: 状态
 *               disabledRemark: 
 *                 type: string
 *                 description: 禁用备注（仅在status为blocked时有效）
 *     responses:
 *       200: 
 *         description: 更新成功
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
 *       403: 
 *         description: 权限不足
 *       404: 
 *         description: 用户不存在
 */
router.put('/:id', authJWT, authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的用户ID'
      });
    }

    // 不允许普通管理员修改超级管理员的信息
    if (req.user.role === 'admin') {
      const targetUser = await UserModel.getUserInfo(userId);
      if (targetUser.role === 'superadmin') {
        return res.status(403).json({
          code: 403,
          message: '权限不足，无法修改超级管理员信息'
        });
      }
    }

    // 构建更新数据
    const { username, email, nickname, avatar, role, status, disabledRemark } = req.body;
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (nickname !== undefined) updateData.nickname = nickname;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (disabledRemark !== undefined) updateData.disabledRemark = disabledRemark;

    // 如果禁用用户且没有备注，给出提示
    if (status === 'blocked' && !disabledRemark) {
      return res.status(400).json({
        code: 400,
        message: '禁用用户时必须添加备注'
      });
    }

    // 如果启用用户，清空禁用备注
    if (status !== 'blocked' && disabledRemark === undefined) {
      // 获取当前用户信息，检查是否有禁用备注需要清空
      const currentUser = await UserModel.getUserInfo(userId);
      if (currentUser.disabledRemark) {
        updateData.disabledRemark = null;
      }
    }

    // 如果没有可更新的字段
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供要更新的字段'
      });
    }

    const updatedUser = await UserModel.updateUser(userId, updateData);

    res.status(200).json(updatedUser);
  } catch (error) {
    if (error.message === '用户不存在') {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }
    res.status(400).json({
      code: 400,
      message: error.message || '更新失败'
    });
  }
});

/**
 * @swagger
 * /api/user-center/users/change-password:
 *   put:
 *     summary: 修改密码
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword: 
 *                 type: string
 *                 description: 当前密码
 *               newPassword: 
 *                 type: string
 *                 description: 新密码
 *     responses:
 *       200: 
 *         description: 修改成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: 
 *                   type: number
 *                 message: 
 *                   type: string
 *       400: 
 *         description: 修改失败
 *       401: 
 *         description: 未授权
 */
router.put('/change-password', authJWT, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 验证参数
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        code: 400,
        message: '请提供当前密码和新密码'
      });
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '新密码长度不能少于6位'
      });
    }

    // 为了验证当前密码，我们需要先尝试登录
    try {
      const loginInfo = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };
      
      // 获取当前用户的用户名或邮箱
      const user = await UserModel.getUserInfo(req.user.id);
      const username = user.username;
      
      // 尝试用当前密码登录来验证
      await UserModel.login(username, currentPassword, loginInfo);
    } catch (error) {
      return res.status(400).json({
        code: 400,
        message: '当前密码错误'
      });
    }

    // 更新密码
    await UserModel.updateUser(req.user.id, { password: newPassword });

    // 为了安全，注销所有会话
    await UserModel.logout(req.user.id);

    res.status(200).json({
      code: 200,
      message: '密码修改成功，请重新登录'
    });
  } catch (error) {
    res.status(400).json({
      code: 400,
      message: error.message || '密码修改失败'
    });
  }
});

/**
 * @swagger
 * /api/user-center/users/{userId}/products:
 *   post:
 *     summary: 添加用户产品关联
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: 
 *                 type: string
 *                 description: 产品ID
 *               name: 
 *                 type: string
 *                 description: 产品名称
 *               accessTime: 
 *                 type: string
 *                 format: date-time
 *                 description: 访问时间
 *     responses:
 *       200: 
 *         description: 关联成功
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
 *         description: 产品已关联
 *       401: 
 *         description: 未授权
 *       403: 
 *         description: 权限不足
 *       404: 
 *         description: 用户不存在
 */
router.post('/:userId/products', authJWT, authorizeRoles('admin', 'user'), async (req, res) => {
  try {
    const { userId } = req.params;
    const productInfo = req.body;
    const currentUser = req.user;

    // 检查权限
    if (currentUser.role !== 'admin' && currentUser.id !== parseInt(userId)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足'
      });
    }

    const result = await UserModel.addUserProduct(parseInt(userId), productInfo);
    res.json({
      code: 200,
      message: '产品关联成功',
      data: result
    });
  } catch (error) {
    if (error.message === '用户不存在') {
      return res.status(404).json({
        code: 404,
        message: error.message
      });
    }
    if (error.message === '产品已关联') {
      return res.status(400).json({
        code: 400,
        message: error.message
      });
    }
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/user-center/users/{userId}/products/{productId}:
 *   delete:
 *     summary: 移除用户产品关联
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 产品ID
 *     responses:
 *       200: 
 *         description: 移除成功
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
 *         description: 产品关联不存在
 *       401: 
 *         description: 未授权
 *       403: 
 *         description: 权限不足
 *       404: 
 *         description: 用户不存在
 */
router.delete('/:userId/products/:productId', authJWT, authorizeRoles('admin', 'user'), async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const currentUser = req.user;

    // 检查权限
    if (currentUser.role !== 'admin' && currentUser.id !== parseInt(userId)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足'
      });
    }

    const result = await UserModel.removeUserProduct(parseInt(userId), productId);
    res.json({
      code: 200,
      message: '产品关联移除成功',
      data: result
    });
  } catch (error) {
    if (error.message === '用户不存在') {
      return res.status(404).json({
        code: 404,
        message: error.message
      });
    }
    if (error.message === '产品关联不存在') {
      return res.status(400).json({
        code: 400,
        message: error.message
      });
    }
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

module.exports = router;