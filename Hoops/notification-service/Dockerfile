# syntax=docker/dockerfile:1

FROM node:20-alpine

WORKDIR /app

# Install system dependencies required by Prisma
RUN apk add --no-cache openssl openssl-dev

# Install dependencies first (cached layer)
COPY package*.json ./

# Use npm cache mount to speed up installs
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline

# Copy Prisma schema and generate
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Run migrations and start app
EXPOSE 8003

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]