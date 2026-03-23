package models

import (
	"database/sql"
	"time"
)

type Court struct {
	ID        int32
	Name      string
	City      string
	Address   string
	Latitude  float32
	Longitude float32
	HoopCount int32
	CourtType int32
	Status    int32
	CreatedAt time.Time
}

type CourtStore struct {
	db *sql.DB
}

func NewCourtStore(db *sql.DB) *CourtStore {
	return &CourtStore{db: db}
}

func (s *CourtStore) Create(c *Court) (*Court, error) {
	row := s.db.QueryRow(`
		INSERT INTO courts (name, city, address, latitude, longitude, hoop_count, court_type, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
		RETURNING id, name, city, address, latitude, longitude, hoop_count, court_type, status, created_at`,
		c.Name, c.City, c.Address, c.Latitude, c.Longitude, c.HoopCount, c.CourtType,
	)
	return scanCourt(row)
}

func (s *CourtStore) GetByID(id int32) (*Court, error) {
	row := s.db.QueryRow(`
		SELECT id, name, city, address, latitude, longitude, hoop_count, court_type, status, created_at
		FROM courts WHERE id = $1`, id)
	return scanCourt(row)
}

func (s *CourtStore) List(city string, activeOnly bool) ([]*Court, error) {
	query := `SELECT id, name, city, address, latitude, longitude, hoop_count, court_type, status, created_at FROM courts WHERE 1=1`
	args := []any{}
	i := 1

	if city != "" {
		query += ` AND city = $1`
		args = append(args, city)
		i++
	}
	if activeOnly {
		query += ` AND status > 0`
	}
	_ = i
	query += ` ORDER BY id`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courts []*Court
	for rows.Next() {
		c := &Court{}
		if err := rows.Scan(&c.ID, &c.Name, &c.City, &c.Address,
			&c.Latitude, &c.Longitude, &c.HoopCount, &c.CourtType, &c.Status, &c.CreatedAt); err != nil {
			return nil, err
		}
		courts = append(courts, c)
	}
	return courts, nil
}

func (s *CourtStore) UpdateStatus(id int32, status int32) (*Court, error) {
	row := s.db.QueryRow(`
		UPDATE courts SET status = $1 WHERE id = $2
		RETURNING id, name, city, address, latitude, longitude, hoop_count, court_type, status, created_at`,
		status, id)
	return scanCourt(row)
}

func (s *CourtStore) Delete(id int32) error {
	_, err := s.db.Exec(`DELETE FROM courts WHERE id = $1`, id)
	return err
}

func scanCourt(row *sql.Row) (*Court, error) {
	c := &Court{}
	err := row.Scan(&c.ID, &c.Name, &c.City, &c.Address,
		&c.Latitude, &c.Longitude, &c.HoopCount, &c.CourtType, &c.Status, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return c, nil
}
