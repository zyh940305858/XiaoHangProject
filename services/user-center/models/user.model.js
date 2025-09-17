// 用户模型 - 处理用户相关业务逻辑
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

/**
 * 用户模型类
 * 处理用户相关的业务逻辑，包括创建用户、验证用户、更新用户信息等
 */
class UserModel {
  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 创建的用户信息
   */
  static async createUser(userData) {
    try {
      // 检查用户名和邮箱是否已存在
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: userData.username },
            { email: userData.email }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.username === userData.username) {
          throw new Error('用户名已存在');
        }
        if (existingUser.email === userData.email) {
          throw new Error('邮箱已被注册');
        }
      }

      // 加密密码
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(userData.password, salt);

      // 创建用户
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          passwordHash: passwordHash,
          nickname: userData.nickname || userData.username,
          role: userData.role || 'user',
          status: 'active',
          source: userData.source || 'unknown' // 用户来源，默认为unknown
        },
        select: {
          id: true,
          username: true,
          email: true,
          nickname: true,
          role: true,
          status: true,
          createdAt: true,
          source: true
        }
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @param {Object} loginInfo - 登录信息（IP、用户代理等）
   * @returns {Promise<Object>} 包含用户信息和JWT令牌的对象
   */
  static async login(username, password, loginInfo = {}) {
    try {
      // 查找用户
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { email: username }
          ]
        }
      });

      if (!user) {
        await this.saveLoginLog(null, username, loginInfo, false, '用户不存在');
        throw new Error('用户名或密码错误');
      }

      if (user.status !== 'active') {
        await this.saveLoginLog(user.id, username, loginInfo, false, '用户已被禁用');
        throw new Error('用户已被禁用');
      }

      // 验证密码
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        await this.saveLoginLog(user.id, username, loginInfo, false, '密码错误');
        throw new Error('用户名或密码错误');
      }

      // 生成JWT令牌
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // 计算令牌过期时间
      const expiresAt = new Date();
      const [hours] = process.env.JWT_EXPIRES_IN.match(/\d+/);
      expiresAt.setHours(expiresAt.getHours() + parseInt(hours));

      // 创建用户会话
      await prisma.userSession.create({
        data: {
          userId: user.id,
          token: token,
          expiresAt: expiresAt,
          ipAddress: loginInfo.ipAddress,
          userAgent: loginInfo.userAgent,
          deviceId: loginInfo.deviceId
        }
      });

      // 更新用户最后登录时间
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // 保存登录日志
      await this.saveLoginLog(user.id, username, loginInfo, true, '登录成功');

      // 返回用户信息和令牌
      const userInfo = {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        status: user.status
      };

      return { user: userInfo, token };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取用户信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 用户信息
   */
  static async getUserInfo(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          nickname: true,
          avatar: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          source: true,
          products: true,
          disabledRemark: true
        }
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新用户信息
   * @param {number} userId - 用户ID
   * @param {Object} updateData - 要更新的数据
   * @returns {Promise<Object>} 更新后的用户信息
   */
  static async updateUser(userId, updateData) {
    try {
      // 构建更新数据
      const data = { ...updateData };

      // 如果更新密码，需要加密
      if (data.password) {
        const salt = await bcrypt.genSalt(10);
        data.passwordHash = await bcrypt.hash(data.password, salt);
        delete data.password;
      }

      // 检查用户名和邮箱是否已被其他用户使用
      if (data.username || data.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            id: { not: userId },
            OR: [
              { username: data.username },
              { email: data.email }
            ].filter(Boolean)
          }
        });

        if (existingUser) {
          if (existingUser.username === data.username) {
            throw new Error('用户名已存在');
          }
          if (existingUser.email === data.email) {
            throw new Error('邮箱已被注册');
          }
        }
      }

      // 更新用户信息
      const user = await prisma.user.update({
        where: { id: userId },
        data: data,
        select: {
          id: true,
          username: true,
          email: true,
          nickname: true,
          avatar: true,
          role: true,
          status: true,
          updatedAt: true,
          source: true,
          products: true,
          disabledRemark: true
        }
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 删除用户
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 删除的用户信息
   */
  static async deleteUser(userId) {
    try {
      // 检查用户是否存在
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 事务处理：删除用户及其相关数据
      await prisma.$transaction([
        // 删除用户会话
        prisma.userSession.deleteMany({
          where: { userId: userId }
        }),
        // 删除用户登录日志
        prisma.userLoginLog.deleteMany({
          where: { userId: userId }
        }),
        // 删除用户
        prisma.user.delete({
          where: { id: userId }
        })
      ]);

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取用户列表
   * @param {Object} filters - 过滤条件
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<{users: Array, total: number}>} 用户列表和总数
   */
  static async getUserList(filters = {}, page = 1, pageSize = 10) {
    try {
      const where = {};

      // 构建过滤条件
      if (filters.username) {
        where.username = { contains: filters.username };
      }
      if (filters.email) {
        where.email = { contains: filters.email };
      }
      if (filters.role) {
        where.role = filters.role;
      }
      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.source) {
        where.source = filters.source;
      }

      // 计算偏移量
      const offset = (page - 1) * pageSize;

      // 并行获取用户列表和总数
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: where,
          skip: offset,
          take: pageSize,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            username: true,
            email: true,
            nickname: true,
            avatar: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
            source: true,
            disabledRemark: true
          }
        }),
        prisma.user.count({ where: where })
      ]);

      return { users, total };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 管理员创建用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 创建的用户信息
   */
  static async adminCreateUser(userData) {
    try {
      // 检查用户名和邮箱是否已存在
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: userData.username },
            { email: userData.email }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.username === userData.username) {
          throw new Error('用户名已存在');
        }
        if (existingUser.email === userData.email) {
          throw new Error('邮箱已被注册');
        }
      }

      // 加密密码
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(userData.password, salt);

      // 创建用户
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          passwordHash: passwordHash,
          nickname: userData.nickname || userData.username,
          role: userData.role || 'user',
          status: userData.status || 'active',
          source: userData.source || 'admin-created',
          disabledRemark: userData.disabledRemark
        },
        select: {
          id: true,
          username: true,
          email: true,
          nickname: true,
          role: true,
          status: true,
          createdAt: true,
          source: true,
          disabledRemark: true
        }
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 注销用户会话
   * @param {number} userId - 用户ID
   * @param {string} token - JWT令牌（可选，如不提供则注销所有会话）
   * @returns {Promise<void>}
   */
  static async logout(userId, token = null) {
    try {
      if (token) {
        // 注销指定令牌
        await prisma.userSession.deleteMany({
          where: {
            userId: userId,
            token: token
          }
        });
      } else {
        // 注销所有会话
        await prisma.userSession.deleteMany({
          where: {
            userId: userId
          }
        });
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * 保存登录日志
   * @param {number|null} userId - 用户ID
   * @param {string} username - 用户名
   * @param {Object} loginInfo - 登录信息
   * @param {boolean} success - 是否登录成功
   * @param {string} message - 登录消息
   * @returns {Promise<void>}
   */
  static async saveLoginLog(userId, username, loginInfo, success, message) {
    try {
      await prisma.userLoginLog.create({
        data: {
          userId: userId,
          username: username,
          ipAddress: loginInfo.ipAddress,
          userAgent: loginInfo.userAgent,
          success: success,
          message: message
        }
      });
    } catch (error) {
      console.error('保存登录日志失败:', error);
      // 不抛出错误，防止影响主要业务流程
    }
  }

  /**
   * 添加用户产品关联
   * @param {number} userId - 用户ID
   * @param {Object} productInfo - 产品信息
   * @returns {Promise<Object>} 更新后的用户信息
   */
  static async addUserProduct(userId, productInfo) {
    try {
      // 获取当前用户产品列表
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { products: true }
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 初始化产品列表（如果不存在）
      let products = user.products || [];
      if (typeof products === 'string') {
        products = JSON.parse(products);
      }

      // 检查产品是否已存在
      const existingProductIndex = products.findIndex(p => p.id === productInfo.id);
      if (existingProductIndex >= 0) {
        throw new Error('产品已关联');
      }

      // 添加新的产品关联
      products.push({
        id: productInfo.id,
        name: productInfo.name,
        joinedAt: new Date().toISOString()
      });

      // 更新用户产品列表
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { products: JSON.stringify(products) },
        select: {
          id: true,
          username: true,
          products: true
        }
      });

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 移除用户产品关联
   * @param {number} userId - 用户ID
   * @param {string} productId - 产品ID
   * @returns {Promise<Object>} 更新后的用户信息
   */
  static async removeUserProduct(userId, productId) {
    try {
      // 获取当前用户产品列表
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { products: true }
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 初始化产品列表（如果不存在）
      let products = user.products || [];
      if (typeof products === 'string') {
        products = JSON.parse(products);
      }

      // 过滤掉要移除的产品
      const filteredProducts = products.filter(p => p.id !== productId);
      if (filteredProducts.length === products.length) {
        throw new Error('产品关联不存在');
      }

      // 更新用户产品列表
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { products: JSON.stringify(filteredProducts) },
        select: {
          id: true,
          username: true,
          products: true
        }
      });

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }


}

module.exports = UserModel;