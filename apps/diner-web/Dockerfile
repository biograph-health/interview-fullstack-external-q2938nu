FROM node:22-alpine

WORKDIR /app
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/diner-web /app/apps/diner-web

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
RUN pnpm install

WORKDIR /app/apps/diner-web
EXPOSE 3000
CMD ["pnpm", "dev"]
