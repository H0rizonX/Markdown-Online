# ---------- 依赖安装阶段 ----------
FROM node:20-alpine AS deps

# 设置 pnpm 环境
ENV PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH" \
    NPM_CONFIG_UNSAFE_PERM=true

RUN corepack enable && pnpm config set unsafe-perm true

WORKDIR /repo

# 复制 workspace 配置
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制前端 package.json
COPY apps/markdown2html/package.json ./apps/markdown2html/

# 安装依赖
RUN pnpm install --frozen-lockfile

# ---------- 构建阶段 ----------
FROM deps AS build

WORKDIR /repo

# 复制整个前端源码（确保 dist 可以生成）
COPY apps/markdown2html ./apps/markdown2html

# 执行构建
RUN pnpm --filter markdown2html build

# 调试: 确认 dist 是否生成
RUN ls -l /repo/apps/markdown2html/dist

# ---------- 运行阶段 ----------
FROM nginx:alpine AS runner

# 删除默认静态目录
RUN rm -rf /usr/share/nginx/html/*

# 复制构建产物到 nginx
COPY --from=build /repo/apps/markdown2html/dist /usr/share/nginx/html

# 可选: 覆盖 nginx 配置，支持 SPA 前端刷新 fallback
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
