# 项目初始化指南

本指南将帮助您快速设置和运行个人产品网站服务端项目。

## 前提条件

在开始之前，请确保您的系统中安装了以下软件：

- Node.js (v14.0 或更高版本)
- npm (v6.0 或更高版本)
- MySQL (v5.7 或更高版本)

## 步骤1：安装依赖

打开终端，进入项目根目录，执行以下命令安装项目依赖：

```bash
npm install
```

## 步骤2：配置数据库

### 创建数据库

在MySQL中创建一个新的数据库：

```sql
CREATE DATABASE xiaohangproject;
```

### 配置环境变量

项目根目录中已经创建了`.env`文件，包含了必要的环境变量配置。请根据您的实际情况修改以下配置：

```env
# 数据库配置 - 修改为您的MySQL连接信息
DATABASE_URL="mysql://root:password@localhost:3306/xiaohangproject?schema=public"

# JWT配置 - 修改为安全的密钥
JWT_SECRET="your-secret-key-here-change-it-in-production"
JWT_EXPIRES_IN="24h"

# 服务器配置
PORT=3000

# 环境标识
NODE_ENV="development"
```

## 步骤3：初始化Prisma

执行以下命令生成Prisma客户端并初始化数据库：

```bash
# 生成Prisma客户端
npx prisma generate

# 执行数据库迁移（创建表结构）
npx prisma migrate dev --name init
```

## 步骤4：启动项目

使用以下命令启动开发服务器：

```bash
npm run dev
```

服务器启动后，可以访问以下地址：

- API服务：http://localhost:3000
- Swagger API文档：http://localhost:3000/api-docs

## 步骤5：测试用户中心接口

您可以使用Swagger文档页面测试用户中心的接口：

1. 首先访问 http://localhost:3000/api-docs
2. 找到 `Auth` 标签下的 `/api/user-center/auth/register` 接口，注册一个新用户
3. 使用 `/api/user-center/auth/login` 接口登录，获取JWT令牌
4. 点击页面右上角的 "Authorize" 按钮，输入 `Bearer {令牌}` 进行认证
5. 现在可以测试需要认证的接口了

## 生产环境部署注意事项

1. 在生产环境中，请确保修改`.env`文件中的`JWT_SECRET`为一个强密钥
2. 生产环境中请勿使用默认的数据库配置
3. 修改`NODE_ENV`为`production`
4. 使用`npm start`命令启动生产服务器
5. 考虑使用PM2等进程管理工具来管理Node.js应用

## 常见问题解决

### 数据库连接问题

如果遇到数据库连接问题，请检查：
- MySQL服务是否正在运行
- 数据库名称、用户名和密码是否正确
- 数据库用户是否有足够的权限

### Prisma迁移问题

如果遇到Prisma迁移问题，请尝试：

```bash
# 重置数据库（注意：这将删除所有数据）
npx prisma migrate reset

# 重新生成Prisma客户端
npx prisma generate

# 重新执行迁移
npx prisma migrate dev
```

### 端口被占用

如果端口3000被占用，请修改`.env`文件中的`PORT`配置为其他可用端口。