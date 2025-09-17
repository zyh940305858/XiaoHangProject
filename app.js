// 个人产品网站服务端主入口文件
const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const userCenterRouter = require('./services/user-center');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '个人产品网站API文档',
      version: '1.0.0',
      description: '个人产品网站服务端API文档',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: '本地开发环境',
      },
    ],
  },
  apis: ['./services/**/*.js'], // 扫描所有服务中的API路由
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 路由配置
app.use('/api/user-center', userCenterRouter);

// 健康检查接口
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器错误', error: err.message });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`Swagger文档地址: http://localhost:${PORT}/api-docs`);
});