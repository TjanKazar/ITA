package server_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"court-service/internal/models"
	"court-service/internal/server"
	pb "court-service/proto"
)

// ---------- mock store ----------

type mockStore struct {
	courts []*models.Court
	nextID int32
}

func newMockStore() *mockStore {
	return &mockStore{nextID: 1}
}

func (m *mockStore) Create(c *models.Court) (*models.Court, error) {
	c.ID = m.nextID
	c.CreatedAt = time.Now()
	m.nextID++
	m.courts = append(m.courts, c)
	return c, nil
}

func (m *mockStore) GetByID(id int32) (*models.Court, error) {
	for _, c := range m.courts {
		if c.ID == id {
			return c, nil
		}
	}
	return nil, errors.New("sql: no rows in result set")
}

func (m *mockStore) List(city string, activeOnly bool) ([]*models.Court, error) {
	var result []*models.Court
	for _, c := range m.courts {
		if city != "" && c.City != city {
			continue
		}
		if activeOnly && c.Status == 0 {
			continue
		}
		result = append(result, c)
	}
	return result, nil
}

func (m *mockStore) UpdateStatus(id int32, status int32) (*models.Court, error) {
	for _, c := range m.courts {
		if c.ID == id {
			c.Status = status
			return c, nil
		}
	}
	return nil, errors.New("sql: no rows in result set")
}

func (m *mockStore) Delete(id int32) error {
	for i, c := range m.courts {
		if c.ID == id {
			m.courts = append(m.courts[:i], m.courts[i+1:]...)
			return nil
		}
	}
	return nil
}

// ---------- helpers ----------

func newServer(t *testing.T) (*server.CourtServer, *mockStore) {
	t.Helper()
	store := newMockStore()
	return server.NewWithStore(store), store
}

func createCourt(t *testing.T, srv *server.CourtServer, name, city string) *pb.Court {
	t.Helper()
	court, err := srv.CreateCourt(context.Background(), &pb.CreateCourtRequest{
		Name:      name,
		City:      city,
		Address:   "Test Street 1",
		Latitude:  46.05,
		Longitude: 14.50,
		HoopCount: 2,
		CourtType: pb.CourtType_OUTDOOR,
	})
	if err != nil {
		t.Fatalf("CreateCourt failed: %v", err)
	}
	return court
}

// ---------- CreateCourt ----------

func TestCreateCourt_Success(t *testing.T) {
	srv, _ := newServer(t)

	court, err := srv.CreateCourt(context.Background(), &pb.CreateCourtRequest{
		Name:      "Tivoli Court",
		City:      "Ljubljana",
		Address:   "Tivoli 1",
		Latitude:  46.05,
		Longitude: 14.50,
		HoopCount: 2,
		CourtType: pb.CourtType_OUTDOOR,
	})

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if court.Id == 0 {
		t.Error("expected non-zero id")
	}
	if court.Name != "Tivoli Court" {
		t.Errorf("expected name 'Tivoli Court', got '%s'", court.Name)
	}
	if court.Status != pb.CourtStatus_EMPTY {
		t.Errorf("expected status EMPTY, got %v", court.Status)
	}
}

func TestCreateCourt_MissingName(t *testing.T) {
	srv, _ := newServer(t)

	_, err := srv.CreateCourt(context.Background(), &pb.CreateCourtRequest{
		City:      "Ljubljana",
		Address:   "Tivoli 1",
		HoopCount: 2,
	})

	if err == nil {
		t.Fatal("expected error for missing name, got nil")
	}
}

func TestCreateCourt_MissingCity(t *testing.T) {
	srv, _ := newServer(t)

	_, err := srv.CreateCourt(context.Background(), &pb.CreateCourtRequest{
		Name:      "Tivoli Court",
		Address:   "Tivoli 1",
		HoopCount: 2,
	})

	if err == nil {
		t.Fatal("expected error for missing city, got nil")
	}
}

func TestCreateCourt_ZeroHoopCount(t *testing.T) {
	srv, _ := newServer(t)

	_, err := srv.CreateCourt(context.Background(), &pb.CreateCourtRequest{
		Name:      "Tivoli Court",
		City:      "Ljubljana",
		Address:   "Tivoli 1",
		HoopCount: 0,
	})

	if err == nil {
		t.Fatal("expected error for zero hoop_count, got nil")
	}
}

// ---------- GetCourt ----------

func TestGetCourt_Success(t *testing.T) {
	srv, _ := newServer(t)
	created := createCourt(t, srv, "Park Court", "Maribor")

	got, err := srv.GetCourt(context.Background(), &pb.GetCourtRequest{Id: created.Id})

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if got.Id != created.Id {
		t.Errorf("expected id %d, got %d", created.Id, got.Id)
	}
	if got.Name != "Park Court" {
		t.Errorf("expected name 'Park Court', got '%s'", got.Name)
	}
}

func TestGetCourt_NotFound(t *testing.T) {
	srv, _ := newServer(t)

	_, err := srv.GetCourt(context.Background(), &pb.GetCourtRequest{Id: 999})

	if err == nil {
		t.Fatal("expected not found error, got nil")
	}
}

// ---------- ListCourts ----------

func TestListCourts_All(t *testing.T) {
	srv, _ := newServer(t)
	createCourt(t, srv, "Court A", "Ljubljana")
	createCourt(t, srv, "Court B", "Ljubljana")
	createCourt(t, srv, "Court C", "Maribor")

	resp, err := srv.ListCourts(context.Background(), &pb.ListCourtsRequest{})

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(resp.Courts) != 3 {
		t.Errorf("expected 3 courts, got %d", len(resp.Courts))
	}
}

func TestListCourts_FilterByCity(t *testing.T) {
	srv, _ := newServer(t)
	createCourt(t, srv, "Court A", "Ljubljana")
	createCourt(t, srv, "Court B", "Ljubljana")
	createCourt(t, srv, "Court C", "Maribor")

	resp, err := srv.ListCourts(context.Background(), &pb.ListCourtsRequest{City: "Ljubljana"})

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(resp.Courts) != 2 {
		t.Errorf("expected 2 courts for Ljubljana, got %d", len(resp.Courts))
	}
}

func TestListCourts_ActiveOnly(t *testing.T) {
	srv, _ := newServer(t)
	c1 := createCourt(t, srv, "Court A", "Ljubljana")
	createCourt(t, srv, "Court B", "Ljubljana")

	srv.UpdateCourtStatus(context.Background(), &pb.UpdateCourtStatusRequest{
		CourtId: c1.Id,
		Status:  pb.CourtStatus_WAITING_FOR_PLAYERS,
	})

	resp, err := srv.ListCourts(context.Background(), &pb.ListCourtsRequest{ActiveOnly: true})

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(resp.Courts) != 1 {
		t.Errorf("expected 1 active court, got %d", len(resp.Courts))
	}
}

func TestListCourts_Empty(t *testing.T) {
	srv, _ := newServer(t)

	resp, err := srv.ListCourts(context.Background(), &pb.ListCourtsRequest{})

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(resp.Courts) != 0 {
		t.Errorf("expected 0 courts, got %d", len(resp.Courts))
	}
}
