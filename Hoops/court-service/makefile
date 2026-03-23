.PHONY: proto build run test

proto:
	protoc --go_out=. --go_opt=paths=source_relative \
	       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
	       proto/court.proto

build: proto
	go build -o bin/court-service ./cmd/server

run: build
	./bin/court-service

docker-up:
	docker compose up --build

# Test with grpcurl (brew install grpcurl)
test-create:
	grpcurl -plaintext -d '{"name":"Park Court","city":"Ljubljana","address":"Tivoli 1","latitude":46.05,"longitude":14.50,"hoop_count":2,"court_type":0}' \
		localhost:50051 court.CourtService/CreateCourt

test-list:
	grpcurl -plaintext -d '{"city":"Ljubljana","active_only":false}' \
		localhost:50051 court.CourtService/ListCourts

test-status:
	grpcurl -plaintext -d '{"court_id":1,"status":1}' \
		localhost:50051 court.CourtService/UpdateCourtStatus