# 构建阶段
FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# 复制包管理文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/

# 安装依赖
RUN pnpm install --frozen-lockfile --filter frontend...

# 复制源代码并构建
COPY . .
RUN pnpm run --filter frontend build

# 生产阶段 - Nginx
FROM nginx:alpine

# 复制构建好的静态文件
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]