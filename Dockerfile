# ?? Next.js ?????
FROM oven/bun:1.3.13 AS web-build

WORKDIR /app/web
COPY web/package.json web/bun.lock ./
RUN bun install --registry=https://registry.npmmirror.com
COPY VERSION /app/VERSION
COPY CHANGELOG.md /app/CHANGELOG.md
COPY web ./
RUN bun run build

# ?? Go ?????
FROM golang:1.25-alpine AS api-build

WORKDIR /app
COPY go.mod go.sum ./
COPY config ./config
COPY handler ./handler
COPY middleware ./middleware
COPY model ./model
COPY repository ./repository
COPY router ./router
COPY service ./service
COPY main.go ./
RUN go build -o /server .

# ????:Next.js ???? 3000,Go ???????? 8080?
FROM oven/bun:1.3.13

WORKDIR /app
COPY VERSION /app/VERSION
COPY CHANGELOG.md /app/CHANGELOG.md
COPY --from=api-build /server /app/server
COPY --from=web-build /app/web /app/web
ENV PROMPT_DATA_DIR=/app/data/prompts
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /app/data/prompts

EXPOSE 3000
# ????? Go API,?? Next.js ??????? /api/*?
CMD ["sh", "-c", "PORT=8080 /app/server & cd /app/web && HOSTNAME=0.0.0.0 PORT=3000 bun run start"]
