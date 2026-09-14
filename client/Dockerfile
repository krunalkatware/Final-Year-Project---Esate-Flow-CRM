# Production Dockerfile for EstateFlow React 19 Frontend
FROM node:20-alpine as build

WORKDIR /app

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

FROM nginx:alpine as runner

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
