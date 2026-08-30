# Multi-stage Dockerfile for SNOTE Backend
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root và các package.json
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY backend/package*.json ./backend/

# Cài đặt dependencies
RUN npm install
RUN npm install --prefix packages/shared
RUN npm install --prefix backend

# Copy mã nguồn
COPY packages/shared ./packages/shared
COPY backend ./backend

# Build Shared Contract và Backend
RUN npm run build --prefix packages/shared
RUN npm run build --prefix backend
RUN npx prisma generate --schema=backend/prisma/schema.prisma

# Runner Stage
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/packages/shared/package*.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules

WORKDIR /app/backend

EXPOSE 4000

CMD ["node", "dist/server.js"]
