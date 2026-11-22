FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json bun.lock* package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000
CMD ["sh", "-c", "npx drizzle-kit push --force && npm run start -- --port 3000"]
