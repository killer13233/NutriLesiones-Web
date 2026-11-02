# Alternativa opcional a Vercel: imagen estática con nginx.
#   docker build --build-arg API_URL=https://TU-API.onrender.com -t nutrilesiones-web .
#   docker run -p 8080:80 nutrilesiones-web
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
ARG API_URL
ENV API_URL=$API_URL
# Con esta variable, set-env.js falla si falta API_URL o no es https.
ENV REQUIRE_API_URL=1
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/nutrilesiones-web/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost/ >/dev/null || exit 1
