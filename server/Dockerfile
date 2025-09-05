# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

RUN apt-get update -y && apt-get install -y openssl

COPY . .


ENV DATABASE_URL=file:dev.db
RUN bun install --frozen-lockfile --production
RUN bun run prisma:migrate

# run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]
