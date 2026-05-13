package server

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"court-service/internal/models"
)

type createCourtRequest struct {
	Name      string  `json:"name"`
	City      string  `json:"city"`
	Address   string  `json:"address"`
	Latitude  float32 `json:"latitude"`
	Longitude float32 `json:"longitude"`
	HoopCount int32   `json:"hoop_count"`
	CourtType int32   `json:"court_type"`
}

type updateStatusRequest struct {
	Status int32 `json:"status"`
}

type courtResponse struct {
	ID        int32   `json:"id"`
	Name      string  `json:"name"`
	City      string  `json:"city"`
	Address   string  `json:"address"`
	Latitude  float32 `json:"latitude"`
	Longitude float32 `json:"longitude"`
	HoopCount int32   `json:"hoop_count"`
	CourtType int32   `json:"court_type"`
	Status    int32   `json:"status"`
	CreatedAt string  `json:"created_at"`
}

func NewHTTPHandler(store Store) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		withCORS(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodGet {
			methodNotAllowed(w)
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "court-service"})
	})

	mux.HandleFunc("/openapi.json", func(w http.ResponseWriter, r *http.Request) {
		withCORS(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodGet {
			methodNotAllowed(w)
			return
		}
		writeJSON(w, http.StatusOK, buildOpenAPISpec(r))
	})

	mux.HandleFunc("/docs", func(w http.ResponseWriter, r *http.Request) {
		withCORS(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodGet {
			methodNotAllowed(w)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(courtDocsHTML))
	})

	mux.HandleFunc("/courts", func(w http.ResponseWriter, r *http.Request) {
		withCORS(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		switch r.Method {
		case http.MethodGet:
			activeOnly := false
			if raw := r.URL.Query().Get("active_only"); raw != "" {
				parsed, err := strconv.ParseBool(raw)
				if err != nil {
					writeJSON(w, http.StatusBadRequest, map[string]string{"error": "active_only must be true or false"})
					return
				}
				activeOnly = parsed
			}
			courts, err := store.List(r.URL.Query().Get("city"), activeOnly)
			if err != nil {
				writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list courts"})
				return
			}
			resp := make([]courtResponse, 0, len(courts))
			for _, c := range courts {
				resp = append(resp, toCourtResponse(c))
			}
			writeJSON(w, http.StatusOK, map[string]any{"courts": resp})
		case http.MethodPost:
			var payload createCourtRequest
			if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
				writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON body"})
				return
			}
			if payload.Name == "" || payload.City == "" || payload.Address == "" {
				writeJSON(w, http.StatusBadRequest, map[string]string{"error": "name, city and address are required"})
				return
			}
			if payload.HoopCount <= 0 {
				writeJSON(w, http.StatusBadRequest, map[string]string{"error": "hoop_count must be > 0"})
				return
			}

			created, err := store.Create(&models.Court{
				Name:      payload.Name,
				City:      payload.City,
				Address:   payload.Address,
				Latitude:  payload.Latitude,
				Longitude: payload.Longitude,
				HoopCount: payload.HoopCount,
				CourtType: payload.CourtType,
			})
			if err != nil {
				writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create court"})
				return
			}
			writeJSON(w, http.StatusCreated, toCourtResponse(created))
		default:
			methodNotAllowed(w)
		}
	})

	mux.HandleFunc("/courts/", func(w http.ResponseWriter, r *http.Request) {
		withCORS(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		path := strings.TrimPrefix(r.URL.Path, "/courts/")
		parts := strings.Split(strings.Trim(path, "/"), "/")
		if len(parts) == 0 || parts[0] == "" {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
			return
		}

		id, err := strconv.ParseInt(parts[0], 10, 32)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "court id must be an integer"})
			return
		}
		courtID := int32(id)

		if len(parts) == 1 {
			switch r.Method {
			case http.MethodGet:
				court, getErr := store.GetByID(courtID)
				if getErr != nil {
					if errors.Is(getErr, sql.ErrNoRows) {
						writeJSON(w, http.StatusNotFound, map[string]string{"error": "court not found"})
						return
					}
					writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to get court"})
					return
				}
				writeJSON(w, http.StatusOK, toCourtResponse(court))
			case http.MethodDelete:
				if delErr := store.Delete(courtID); delErr != nil {
					writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to delete court"})
					return
				}
				writeJSON(w, http.StatusOK, map[string]bool{"success": true})
			default:
				methodNotAllowed(w)
			}
			return
		}

		if len(parts) == 2 && parts[1] == "status" {
			if r.Method != http.MethodPatch {
				methodNotAllowed(w)
				return
			}

			var payload updateStatusRequest
			if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
				writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON body"})
				return
			}

			court, updateErr := store.UpdateStatus(courtID, payload.Status)
			if updateErr != nil {
				if errors.Is(updateErr, sql.ErrNoRows) {
					writeJSON(w, http.StatusNotFound, map[string]string{"error": "court not found"})
					return
				}
				writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to update court status"})
				return
			}
			writeJSON(w, http.StatusOK, toCourtResponse(court))
			return
		}

		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
	})

	return mux
}

func withCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
}

func methodNotAllowed(w http.ResponseWriter) {
	writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func toCourtResponse(c *models.Court) courtResponse {
	return courtResponse{
		ID:        c.ID,
		Name:      c.Name,
		City:      c.City,
		Address:   c.Address,
		Latitude:  c.Latitude,
		Longitude: c.Longitude,
		HoopCount: c.HoopCount,
		CourtType: c.CourtType,
		Status:    c.Status,
		CreatedAt: c.CreatedAt.UTC().Format(time.RFC3339),
	}
}

func buildOpenAPISpec(r *http.Request) map[string]any {
	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	}
	serverURL := scheme + "://" + r.Host

	return map[string]any{
		"openapi": "3.0.3",
		"info": map[string]any{
			"title":       "HOOPS Court Service API",
			"version":     "1.0.0",
			"description": "HTTP wrapper for Court service operations.",
		},
		"servers": []map[string]string{
			{"url": serverURL},
		},
		"paths": map[string]any{
			"/health": map[string]any{
				"get": map[string]any{
					"summary":   "Health check",
					"responses": map[string]any{"200": map[string]any{"description": "Service healthy"}},
				},
			},
			"/courts": map[string]any{
				"get": map[string]any{
					"summary": "List courts",
					"parameters": []map[string]any{
						{"name": "city", "in": "query", "schema": map[string]string{"type": "string"}},
						{"name": "active_only", "in": "query", "schema": map[string]string{"type": "boolean"}},
					},
					"responses": map[string]any{"200": map[string]any{"description": "Courts returned"}},
				},
				"post": map[string]any{
					"summary":     "Create court",
					"requestBody": map[string]any{"required": true},
					"responses":   map[string]any{"201": map[string]any{"description": "Court created"}},
				},
			},
			"/courts/{id}": map[string]any{
				"get": map[string]any{
					"summary": "Get court by id",
					"parameters": []map[string]any{
						{"name": "id", "in": "path", "required": true, "schema": map[string]string{"type": "integer"}},
					},
					"responses": map[string]any{"200": map[string]any{"description": "Court returned"}},
				},
				"delete": map[string]any{
					"summary": "Delete court",
					"parameters": []map[string]any{
						{"name": "id", "in": "path", "required": true, "schema": map[string]string{"type": "integer"}},
					},
					"responses": map[string]any{"200": map[string]any{"description": "Court deleted"}},
				},
			},
			"/courts/{id}/status": map[string]any{
				"patch": map[string]any{
					"summary": "Update court status",
					"parameters": []map[string]any{
						{"name": "id", "in": "path", "required": true, "schema": map[string]string{"type": "integer"}},
					},
					"requestBody": map[string]any{"required": true},
					"responses":   map[string]any{"200": map[string]any{"description": "Court updated"}},
				},
			},
		},
	}
}

const courtDocsHTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>HOOPS Court API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
      });
    </script>
  </body>
</html>`
