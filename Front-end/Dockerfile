FROM node:18-alpine AS build

# CRA bakes env vars into the bundle at build time.
ARG REACT_APP_API_URL=http://localhost:5000/api
ARG REACT_APP_SECRET_KEY=SecretAESKey
ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_SECRET_KEY=$REACT_APP_SECRET_KEY

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
