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
COPY web/out ./web/out
RUN go build -o /server .

FROM alpine:latest
WORKDIR /app
COPY --from=api-build /server /app/server
COPY --from=api-build /app/web/out /app/web/out
RUN apk add --no-cache ca-certificates
EXPOSE 8080
CMD ["sh", "-c", "/app/server"]
