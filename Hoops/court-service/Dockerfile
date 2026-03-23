FROM golang:1.24-alpine AS builder

WORKDIR /app
COPY go.mod ./
RUN go mod download

COPY . .
RUN go build -o court-service ./cmd/server

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/court-service .
EXPOSE 50051
CMD ["./court-service"]