#!/bin/bash

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

KONG_ADMIN="${KONG_ADMIN:-http://localhost:8001}"
MOBILE_PREFIX="${MOBILE_PREFIX:-/api/mobile/v1}"

wait_for_kong() {
  echo -e "${YELLOW}Waiting for Kong admin API at ${KONG_ADMIN}...${NC}"
  until curl -fsS "${KONG_ADMIN}/status" >/dev/null 2>&1; do
    sleep 2
  done
}

upsert_service() {
  local name="$1"
  local url="$2"
  curl -fsS -X PUT "${KONG_ADMIN}/services/${name}" \
    --data "name=${name}" \
    --data "url=${url}" \
    --data "connect_timeout=5000" \
    --data "read_timeout=10000" \
    --data "write_timeout=10000" \
    --data "retries=2" >/dev/null
}

upsert_route() {
  local name="$1"
  local service="$2"
  local path="$3"
  local strip="${4:-true}"

  curl -fsS -X PUT "${KONG_ADMIN}/routes/${name}" \
    --data "name=${name}" \
    --data "service.name=${service}" \
    --data "paths[]=${path}" \
    --data "strip_path=${strip}" \
    --data "preserve_host=false" \
    --data "protocols[]=http" \
    --data "protocols[]=https" \
    --data "methods[]=GET" \
    --data "methods[]=POST" \
    --data "methods[]=PUT" \
    --data "methods[]=PATCH" \
    --data "methods[]=DELETE" \
    --data "methods[]=OPTIONS" >/dev/null
}

wait_for_kong

echo -e "${YELLOW}Configuring mobile gateway routes...${NC}"

# ===================
# AUTH / USER SERVICE
# ===================
upsert_service "mobile-auth" "http://hoops-auth:8000/auth"
upsert_route "mobile-auth-prefix" "mobile-auth" "${MOBILE_PREFIX}/auth"

upsert_service "mobile-users" "http://hoops-auth:8000/users"
upsert_route "mobile-users-prefix" "mobile-users" "${MOBILE_PREFIX}/users"

upsert_service "mobile-ranking" "http://hoops-auth:8000/ranking"
upsert_route "mobile-ranking-prefix" "mobile-ranking" "${MOBILE_PREFIX}/ranking"

upsert_service "mobile-auth-health" "http://hoops-auth:8000/health"
upsert_route "mobile-auth-health" "mobile-auth-health" "${MOBILE_PREFIX}/user-service/health"

upsert_service "mobile-auth-openapi" "http://hoops-auth:8000/openapi.json"
upsert_route "mobile-auth-openapi" "mobile-auth-openapi" "${MOBILE_PREFIX}/user-service/openapi.json"

upsert_service "mobile-auth-docs" "http://hoops-auth:8000/docs"
upsert_route "mobile-auth-docs" "mobile-auth-docs" "${MOBILE_PREFIX}/user-service/docs"

# ===================
# NOTIFICATION SERVICE
# ===================
upsert_service "mobile-notifications" "http://notification-service:8003/notifications"
upsert_route "mobile-notifications-prefix" "mobile-notifications" "${MOBILE_PREFIX}/notifications"

upsert_service "mobile-devices" "http://notification-service:8003/devices"
upsert_route "mobile-devices-prefix" "mobile-devices" "${MOBILE_PREFIX}/devices"

upsert_service "mobile-preferences" "http://notification-service:8003/preferences"
upsert_route "mobile-preferences-prefix" "mobile-preferences" "${MOBILE_PREFIX}/preferences"

upsert_service "mobile-notification-test" "http://notification-service:8003/test"
upsert_route "mobile-notification-test-prefix" "mobile-notification-test" "${MOBILE_PREFIX}/test"

upsert_service "mobile-notification-health" "http://notification-service:8003/health"
upsert_route "mobile-notification-health" "mobile-notification-health" "${MOBILE_PREFIX}/notification-service/health"

upsert_service "mobile-notification-openapi" "http://notification-service:8003/openapi.json"
upsert_route "mobile-notification-openapi" "mobile-notification-openapi" "${MOBILE_PREFIX}/notification-service/openapi.json"

upsert_service "mobile-notification-docs" "http://notification-service:8003/docs"
upsert_route "mobile-notification-docs" "mobile-notification-docs" "${MOBILE_PREFIX}/notification-service/docs"

# ===================
# COURT SERVICE
# ===================
upsert_service "mobile-courts" "http://court-service:8080/courts"
upsert_route "mobile-courts-prefix" "mobile-courts" "${MOBILE_PREFIX}/courts"

upsert_service "mobile-court-health" "http://court-service:8080/health"
upsert_route "mobile-court-health" "mobile-court-health" "${MOBILE_PREFIX}/court-service/health"

upsert_service "mobile-court-openapi" "http://court-service:8080/openapi.json"
upsert_route "mobile-court-openapi" "mobile-court-openapi" "${MOBILE_PREFIX}/court-service/openapi.json"

upsert_service "mobile-court-docs" "http://court-service:8080/docs"
upsert_route "mobile-court-docs" "mobile-court-docs" "${MOBILE_PREFIX}/court-service/docs"

echo -e "${GREEN}✅ Mobile Kong gateway configured${NC}"
echo "Gateway base: http://localhost:8000${MOBILE_PREFIX}"
echo ""
echo "Configured mobile routes:"
if command -v jq >/dev/null 2>&1; then
  curl -fsS "${KONG_ADMIN}/routes" | jq -r '.data[] | select(.name | startswith("mobile-")) | "  \(.name): \(.paths[0])"'
else
  curl -fsS "${KONG_ADMIN}/routes"
fi
