# FROM node:20-alpine

FROM node:version-qui-nexiste-pas

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Recrée node_modules avec seulement les deps de prod
RUN npm ci --only=production

EXPOSE 3000

CMD ["node", "dist/app.js"]