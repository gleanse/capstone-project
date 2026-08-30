FROM node:22 AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# ---- DEVELOPMENT target ----
FROM base AS development
COPY . .
CMD ["npm", "run", "dev:docker"]

# ---- PRODUCTION target ----
FROM base AS production
COPY . .
RUN npm run css:build
CMD ["node", "server.js"]