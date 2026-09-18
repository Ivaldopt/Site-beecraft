FROM node:22-alpine AS build
ARG VITE_BASE_PATH=/
ARG VITE_API_URL=http://localhost:8000/api
ARG VITE_STORE_URL=http://localhost:5173
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_STORE_URL=$VITE_STORE_URL
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html/adm
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
