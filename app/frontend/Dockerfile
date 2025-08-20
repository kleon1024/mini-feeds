FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装依赖
COPY package.json package-lock.json ./
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产环境
FROM node:18-alpine AS production
WORKDIR /app

COPY --from=base /app/package.json /app/package-lock.json ./
COPY --from=base /app/next.config.ts ./
COPY --from=base /app/public ./public
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]