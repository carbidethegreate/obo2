# OnlyFans Automation Manager Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .CMD ["node", "src/server/server.js"]
