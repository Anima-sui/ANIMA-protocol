FROM node:22-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile --ignore-scripts
COPY backend/ .
RUN pnpm run build
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1
CMD ["pnpm", "run", "start"]