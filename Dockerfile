FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci
COPY --from=build /app/dist ./dist
COPY server.ts ./
COPY tsconfig.json ./

VOLUME ["/app/data"]
ENV DATABASE_URL=/app/data/database.sqlite
ENV PORT=3001
EXPOSE 3001

CMD ["npm", "start"]
