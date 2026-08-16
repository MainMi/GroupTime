# node:22-slim (Debian) so bcrypt installs from prebuilt binaries.
# Node 20+ is required: node-ical uses the `v` regex flag, which Node 18 rejects
# at parse time (SyntaxError: Invalid regular expression flags).
FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
