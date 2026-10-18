# Build stage
FROM golang:1.22-alpine AS build
RUN apk add --no-cache gcc musl-dev
WORKDIR /app
COPY go.mod ./
RUN go mod download || true
COPY . .
# CGO is required for the sqlite driver; for postgres/mysql you can set CGO_ENABLED=0.
RUN CGO_ENABLED=1 go build -o server ./cmd/server

# Run stage
FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /app/server .
COPY .env.example .env
EXPOSE 8080
CMD ["./server"]
