# ---------- 依赖安装阶段 ----------
FROM node:20-alpine AS deps

ENV PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH" \
    NPM_CONFIG_UNSAFE_PERM=true

RUN corepack enable && pnpm config set unsafe-perm true

WORKDIR /repo

# 复制 workspace 配置
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/markdown2html/package.json ./apps/markdown2html/

RUN pnpm install --frozen-lockfile

# ---------- 构建阶段 ----------
FROM deps AS build
WORKDIR /repo
COPY . .

# 构建前端项目
RUN pnpm --filter markdown2html build

# ---------- 运行阶段 ----------
FROM nginx:alpine AS runner

# 删除默认静态目录
RUN rm -rf /usr/share/nginx/html/*

# 复制构建产物
COPY --from=build /repo/apps/markdown2html/dist /usr/share/nginx/html

# 可选 nginx 配置
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
