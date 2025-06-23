# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

COPY . .
RUN bun install

ENV PORT=3000
ENV DB_URL="sqlite:///data/database.sqlite"
ENV CDN_DIRECTORY="/data/user_content"

# run the app
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "server:start" ]