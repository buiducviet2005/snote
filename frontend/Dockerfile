FROM node:24-alpine AS build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY packages/shared/src /app/packages/shared/src
COPY frontend/ ./
ENV VITE_API_BASE_URL=/api
RUN npm run build

FROM nginx:stable-alpine
COPY frontend/nginx.selfhost.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
