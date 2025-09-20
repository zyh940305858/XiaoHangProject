/**
 * 时间戳转换中间件
 * 将响应中的DateTime类型字段转换为Unix时间戳（秒）\ * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const timestampMiddleware = (req, res, next) => {
  // 保存原始的json方法
  const originalJson = res.json;

  // 重写json方法
  res.json = function(data) {
    // 转换DateTime类型字段为时间戳
    const transformDateTimeToTimestamp = (obj) => {
      // 处理null或undefined
      if (obj === null || obj === undefined) {
        return obj;
      }

      // 处理数组
      if (Array.isArray(obj)) {
        return obj.map(item => transformDateTimeToTimestamp(item));
      }

      // 处理对象
      if (typeof obj === 'object') {
        // 检查是否为DateTime对象（Prisma返回的DateTime对象有toISOString方法）
        if (obj instanceof Date || (obj.toISOString && typeof obj.toISOString === 'function')) {
          // 返回Unix时间戳（秒）
          return Math.floor(new Date(obj).getTime() / 1000);
        }

        // 递归处理对象的每个字段
        const transformedObj = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            transformedObj[key] = transformDateTimeToTimestamp(obj[key]);
          }
        }
        return transformedObj;
      }

      // 其他类型直接返回
      return obj;
    };

    // 转换数据
    const transformedData = transformDateTimeToTimestamp(data);

    // 调用原始的json方法
    return originalJson.call(this, transformedData);
  };

  next();
};

module.exports = timestampMiddleware;