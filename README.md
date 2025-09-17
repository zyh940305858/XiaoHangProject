# 个人产品网站服务端

基于Express+JWT+Prisma+MySQL+Swagger的个人产品网站服务端实现。

## 技术栈

- Express: Web框架
- JWT: 用户认证
- Prisma: ORM工具
- MySQL: 数据库
- Swagger: API文档

## 项目结构

```
├── app.js                # 主入口文件
├── package.json          # 项目依赖配置
├── prisma/               # Prisma相关配置
│   └── schema.prisma     # 数据模型定义
├── .env                  # 环境变量配置
├── services/             # 各服务模块
│   ├── admin-app/        # 后台管理接口
│   ├── user-center/      # 用户中心接口
│   └── web-app/          # 网站客户端接口
└── README.md             # 项目说明文档
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置数据库

1. 在MySQL中创建数据库
2. 复制`.env.example`文件并重命名为`.env`，然后修改数据库连接配置

### 初始化数据库

```bash
# 生成Prisma客户端
npx prisma generate

# 执行数据库迁移
npx prisma migrate dev
```

### 启动项目

```bash
# 开发模式（使用nodemon自动重启）
npm run dev

# 生产模式
npm start
```

### API文档

启动项目后，可以访问以下地址查看API文档：

```
http://localhost:3000/api-docs
```

## 用户中心接口说明

用户中心提供以下主要功能：

### 认证相关

- 用户注册
- 用户登录
- 用户登出
- 注销所有会话
- 获取当前用户信息

### 用户信息管理

- 获取用户信息（管理员可用）
- 更新当前用户信息
- 更新用户信息（管理员可用）
- 修改密码

## 注意事项

1. 请确保在生产环境中修改`.env`文件中的`JWT_SECRET`为安全的密钥
2. 生产环境中请勿使用默认的数据库配置
3. 所有API接口都返回统一的响应格式：`{ code, message, data? }`
4. 需要认证的接口需要在请求头中添加`Authorization: Bearer {token}`

## 开发规范

1. 遵循RESTful API设计规范
2. 所有代码添加适当的注释
3. 使用JSDoc格式编写接口文档