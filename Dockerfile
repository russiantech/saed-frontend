FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# VITE_* values are baked into the bundle at build time.
ARG VITE_API_URL=/api
ARG VITE_LOGO_URL=/logo.png
ENV VITE_API_URL=$VITE_API_URL VITE_LOGO_URL=$VITE_LOGO_URL
RUN npm run build

FROM nginx:1.27-alpine
# nginx:alpine renders /etc/nginx/templates/*.template with the container environment at start-up.
COPY deploy/default.conf.template /etc/nginx/templates/default.conf.template
# Optional runtime API address (written to /config.js at start-up; empty = same-origin /api via the proxy below).
COPY deploy/40-saed-config.sh /docker-entrypoint.d/40-saed-config.sh
RUN chmod +x /docker-entrypoint.d/40-saed-config.sh
ENV API_UPSTREAM=http://backend:8002 DNS_RESOLVER=127.0.0.11 API_URL=
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
