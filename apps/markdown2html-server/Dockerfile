# 多阶段构建
FROM node:20-alpine AS deps

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制包管理文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

# 安装依赖
RUN pnpm install --frozen-lockfile --filter backend...

# 构建阶段
FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# 构建应用（如果有构建步骤）
# RUN pnpm run --filter backend build

# 生产阶段
FROM node:20-alpine AS runner

WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 从构建阶段复制文件
COPY --from=builder --chown=nextjs:nodejs /app/backend ./backend
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "backend/app.js"]