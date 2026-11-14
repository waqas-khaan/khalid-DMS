# Dairy Business Management System Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production runtime using lightweight Node server
FROM node:22-alpine
WORKDIR /app

RUN npm install -g serve
RUN apk add --no-cache curl wget

COPY --from=builder /app/dist ./dist

EXPOSE 80

CMD ["serve", "-s", "dist", "-l", "80"]
