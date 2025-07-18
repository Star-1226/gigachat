# packages/server/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY . .

RUN corepack enable && corepack prepare pnpm@latest --activate

RUN pnpm install --frozen-lockfile

RUN pnpm run -r build

# Copy built client files to a dedicated folder
RUN mkdir -p /app/client && cp -r /app/packages/client/dist/* /app/client/

EXPOSE 8787
CMD ["pnpm", "--filter", "server", "start"]
