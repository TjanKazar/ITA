#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Wait for Kong to be ready
echo -e "${YELLOW}Waiting for Kong to be ready...${NC}"
until curl -s http://localhost:8001/status > /dev/null 2>&1; do
  echo "Kong is unavailable - sleeping"
  sleep 2
done

echo -e "${GREEN}Kong is up - configuring services and routes...${NC}"

KONG_ADMIN="http://localhost:8001"

# Clear existing config (optional - only if re-running)
echo -e "${YELLOW}Cleaning up existing configuration...${NC}"
curl -s -X DELETE $KONG_ADMIN/services/auth-service >/dev/null 2>&1
curl -s -X DELETE $KONG_ADMIN/services/notification-service >/dev/null 2>&1
curl -s -X DELETE $KONG_ADMIN/services/court-service >/dev/null 2>&1

# ===================
# AUTH SERVICE
# ===================
echo -e "${YELLOW}Setting up Auth Service...${NC}"

# Create service pointing to hoops-auth container
curl -s -X POST $KONG_ADMIN/services \
  --data name=auth-service \
  --data url=http://hoops-auth:8002

# Route: /api/v1/auth/register -> /auth/register
curl -s -X POST $KONG_ADMIN/services/auth-service/routes \
  --data 'name=auth-register' \
  --data 'paths[]=/api/v1/auth/register' \
  --data 'methods[]=POST' \
  --data 'strip_path=false' \
  --data 'preserve_host=false'

# Route: /api/v1/auth/login -> /auth/login
curl -s -X POST $KONG_ADMIN/services/auth-service/routes \
  --data 'name=auth-login' \
  --data 'paths[]=/api/v1/auth/login' \
  --data 'methods[]=POST' \
  --data 'strip_path=false'

# Route: /api/v1/auth/me -> /auth/me
curl -s -X POST $KONG_ADMIN/services/auth-service/routes \
  --data 'name=auth-me' \
  --data 'paths[]=/api/v1/auth/me' \
  --data 'methods[]=GET' \
  --data 'strip_path=false'

# Add request-transformer to rewrite path
curl -s -X POST $KONG_ADMIN/services/auth-service/plugins \
  --data name=request-transformer \
  --data 'config.replace.uri=/auth$(uri)'

echo -e "${GREEN}✓ Auth service configured${NC}"

# ===================
# NOTIFICATION SERVICE
# ===================
echo -e "${YELLOW}Setting up Notification Service...${NC}"

curl -s -X POST $KONG_ADMIN/services \
  --data name=notification-service \
  --data url=http://notification-service:8003

curl -s -X POST $KONG_ADMIN/services/notification-service/routes \
  --data 'name=notifications' \
  --data 'paths[]=/api/v1/notifications' \
  --data 'strip_path=true'

echo -e "${GREEN}✓ Notification service configured${NC}"

# ===================
# COURT SERVICE
# ===================
echo -e "${YELLOW}Setting up Court Service...${NC}"

curl -s -X POST $KONG_ADMIN/services \
  --data name=court-service \
  --data url=http://court-service:50051

curl -s -X POST $KONG_ADMIN/services/court-service/routes \
  --data 'name=courts' \
  --data 'paths[]=/api/v1/courts'

echo -e "${GREEN}✓ Court service configured${NC}"

# ===================
# GLOBAL PLUGINS
# ===================
echo -e "${YELLOW}Adding global plugins...${NC}"

# CORS
curl -s -X POST $KONG_ADMIN/plugins \
  --data name=cors \
  --data config.origins=* \
  --data config.methods=GET \
  --data config.methods=POST \
  --data config.methods=PUT \
  --data config.methods=DELETE \
  --data config.methods=OPTIONS \
  --data config.headers=Accept \
  --data config.headers=Authorization \
  --data config.headers=Content-Type \
  --data config.exposed_headers=Authorization \
  --data config.credentials=true \
  --data config.max_age=3600

echo -e "${GREEN}✓ CORS enabled${NC}"

# Rate Limiting
curl -s -X POST $KONG_ADMIN/plugins \
  --data name=rate-limiting \
  --data config.minute=100 \
  --data config.policy=local

echo -e "${GREEN}✓ Rate limiting enabled${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Kong configuration complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Gateway: http://localhost:8000"
echo "Admin API: http://localhost:8001"
echo ""
echo "Configured routes:"
curl -s $KONG_ADMIN/routes | jq -r '.data[] | "  \(.methods[0] // "ANY") \(.paths[0])"'