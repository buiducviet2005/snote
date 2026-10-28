FROM node:24-alpine AS builder

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run prisma:generate && npm run build

FROM node:24-alpine
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/prisma.config.ts ./
EXPOSE 4000
CMD ["node", "dist/server.js"]
