FROM node:20-alpine AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/markdown2html-server/package.json apps/markdown2html-server/

RUN pnpm install --frozen-lockfile --filter markdown2html-server...

FROM deps AS build

COPY . .

RUN pnpm --filter markdown2html-server build

FROM node:20-alpine AS runner

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production
RUN corepack enable

WORKDIR /app

COPY --from=build /repo/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/apps/markdown2html-server/package.json ./apps/markdown2html-server/package.json

RUN pnpm install --frozen-lockfile --prod --filter markdown2html-server...

COPY --from=build /repo/apps/markdown2html-server/dist ./apps/markdown2html-server/dist

WORKDIR /app/apps/markdown2html-server

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -q -O - http://localhost:3003/health || exit 1

CMD ["node", "dist/app.js"]