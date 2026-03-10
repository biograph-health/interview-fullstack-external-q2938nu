FROM node:22-alpine

WORKDIR /app
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/restaurant-console /app/apps/restaurant-console

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
RUN pnpm install

WORKDIR /app/apps/restaurant-console
EXPOSE 3001
CMD ["pnpm", "dev"]
