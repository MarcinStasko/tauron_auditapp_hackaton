# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Install deps (use lockfile if present)
COPY package.json package-lock.json* bun.lock* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Build
COPY . .

# Vite reads VITE_* env vars at build time. Cloud Build can pass them as --build-arg.
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_URL
ARG VITE_GEOCODER_URL=https://nominatim.openstreetmap.org/search
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_GEOCODER_URL=$VITE_GEOCODER_URL

RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine AS runtime

# Replace default config with SPA-friendly one
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Cloud Run injects $PORT (default 8080). Make nginx listen on it.
ENV PORT=8080
EXPOSE 8080

# Substitute $PORT into nginx config at container start
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/default.conf > /tmp/default.conf && mv /tmp/default.conf /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
