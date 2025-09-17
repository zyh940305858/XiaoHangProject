// JWT验证中间件
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * JWT认证中间件
 * 验证请求中的JWT令牌，并将用户信息附加到请求对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const authJWT = async (req, res, next) => {
  try {
    // 从请求头中获取Authorization字段
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    // 提取JWT令牌
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '无效的认证令牌' });
    }

    // 验证JWT令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 查找用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        avatar: true,
        role: true,
        status: true
      }
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: '用户不存在或已被禁用' });
    }

    // 检查会话是否有效
    const session = await prisma.userSession.findFirst({
      where: {
        userId: user.id,
        token: token,
        expiresAt: { gt: new Date() }
      }
    });

    if (!session) {
      return res.status(401).json({ message: '会话已过期或无效' });
    }

    // 将用户信息附加到请求对象
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的JWT令牌' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'JWT令牌已过期' });
    }
    console.error('JWT认证错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

/**
 * 角色权限验证中间件
 * @param {Array} roles - 允许访问的角色列表
 * @returns {Function} - Express中间件函数
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: '权限不足' });
    }
    next();
  };
};

module.exports = { authJWT, authorizeRoles };