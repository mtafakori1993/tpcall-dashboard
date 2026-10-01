# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /src

# Optional outbound proxy for npm (set by CI; empty locally).
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
# Backend the dashboard talks to (baked into the bundle at build time).
ARG VITE_API_BASE=https://tpcallapi.tafakorpardazan.ir
ENV VITE_API_BASE=$VITE_API_BASE

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 8080
