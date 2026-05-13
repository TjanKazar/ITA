package server

import (
	"context"
	"database/sql"
	"errors"

	"court-service/internal/models"
	pb "court-service/proto"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Store interface {
	Create(c *models.Court) (*models.Court, error)
	GetByID(id int32) (*models.Court, error)
	List(city string, activeOnly bool) ([]*models.Court, error)
	UpdateStatus(id int32, status int32) (*models.Court, error)
	Delete(id int32) error
}

type CourtServer struct {
	pb.UnimplementedCourtServiceServer
	store Store
}

func New(store *models.CourtStore) *CourtServer {
	return &CourtServer{store: store}
}

func NewWithStore(store Store) *CourtServer {
	return &CourtServer{store: store}
}

func (s *CourtServer) CreateCourt(_ context.Context, req *pb.CreateCourtRequest) (*pb.Court, error) {
	if req.Name == "" || req.City == "" || req.Address == "" {
		return nil, status.Error(codes.InvalidArgument, "name, city and address are required")
	}
	if req.HoopCount <= 0 {
		return nil, status.Error(codes.InvalidArgument, "hoop_count must be > 0")
	}

	c, err := s.store.Create(&models.Court{
		Name:      req.Name,
		City:      req.City,
		Address:   req.Address,
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
		HoopCount: req.HoopCount,
		CourtType: int32(req.CourtType),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "create court: %v", err)
	}
	return toProto(c), nil
}

func (s *CourtServer) GetCourt(_ context.Context, req *pb.GetCourtRequest) (*pb.Court, error) {
	c, err := s.store.GetByID(req.Id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) || err.Error() == "sql: no rows in result set" {
			return nil, status.Errorf(codes.NotFound, "court %d not found", req.Id)
		}
		return nil, status.Errorf(codes.Internal, "get court: %v", err)
	}
	return toProto(c), nil
}

func (s *CourtServer) ListCourts(_ context.Context, req *pb.ListCourtsRequest) (*pb.ListCourtsResponse, error) {
	courts, err := s.store.List(req.City, req.ActiveOnly)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list courts: %v", err)
	}

	resp := &pb.ListCourtsResponse{}
	for _, c := range courts {
		resp.Courts = append(resp.Courts, toProto(c))
	}
	return resp, nil
}

func (s *CourtServer) UpdateCourtStatus(_ context.Context, req *pb.UpdateCourtStatusRequest) (*pb.Court, error) {
	c, err := s.store.UpdateStatus(req.CourtId, int32(req.Status))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) || err.Error() == "sql: no rows in result set" {
			return nil, status.Errorf(codes.NotFound, "court %d not found", req.CourtId)
		}
		return nil, status.Errorf(codes.Internal, "update status: %v", err)
	}
	return toProto(c), nil
}

func (s *CourtServer) DeleteCourt(_ context.Context, req *pb.DeleteCourtRequest) (*pb.DeleteCourtResponse, error) {
	if err := s.store.Delete(req.Id); err != nil {
		return nil, status.Errorf(codes.Internal, "delete court: %v", err)
	}
	return &pb.DeleteCourtResponse{Success: true}, nil
}

func toProto(c *models.Court) *pb.Court {
	return &pb.Court{
		Id:        c.ID,
		Name:      c.Name,
		City:      c.City,
		Address:   c.Address,
		Latitude:  c.Latitude,
		Longitude: c.Longitude,
		HoopCount: c.HoopCount,
		CourtType: pb.CourtType(c.CourtType),
		Status:    pb.CourtStatus(c.Status),
		CreatedAt: c.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
}
