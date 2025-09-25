# 制定 node 镜像的版本
FROM node:latest
# 移动当前目录下面的文件到 app 目录下
ADD . /app/
# 进入到 app 目录下面，类似 cd
WORKDIR /app
# 安装依赖
RUN npm install
RUN npm install -g pm2
RUN npm run prisma:generate

# 对外暴露的端口
EXPOSE 3000