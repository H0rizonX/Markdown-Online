FROM node:20-alpine AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/markdown2html-server/package.json apps/markdown2html-server/
COPY apps/markdown2html/package.json apps/markdown2html/

RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter apps/markdown2html-server run build   # ✅ 关键：生成 dist

FROM node:20-alpine AS runner
ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /repo/apps/markdown2html-server/dist ./dist
COPY --from=build /repo/apps/markdown2html-server/package.json ./package.json
COPY --from=build /repo/node_modules ./node_modules

EXPOSE 3003

CMD ["node", "dist/app.js"]
