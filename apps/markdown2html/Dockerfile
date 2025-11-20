FROM node:20-alpine AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/markdown2html/package.json apps/markdown2html/

RUN pnpm install --frozen-lockfile --filter markdown2html...

FROM deps AS build

COPY . .

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN pnpm --filter markdown2html build

FROM nginx:1.27-alpine AS runner

COPY apps/markdown2html/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/markdown2html/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O - http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]