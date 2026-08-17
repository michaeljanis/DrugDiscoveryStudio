# Multi-stage Dockerfile for Project Episteme

ARG PROJECT_ID

# --- BUILD STAGE ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- RUN STAGE ---
FROM gcr.io/gen-lang-client-0539023084/episteme-db-base:latest

WORKDIR /app
ENV NODE_ENV=production

# Install npm dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY --from=builder /app/dist ./dist
COPY server.js ./
COPY scripts/ ./scripts/

EXPOSE 8080
CMD ["node", "server.js"]
