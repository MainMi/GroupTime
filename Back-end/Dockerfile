# node:18-slim (Debian) so bcrypt installs from prebuilt binaries.
FROM node:18-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
