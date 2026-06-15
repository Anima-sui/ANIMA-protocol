FROM node:22-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN echo "approve-builds[]=@nestjs/core\napprove-builds[]=unrs-resolver" > .npmrc
RUN pnpm i --frozen-lockfile
COPY backend/ .
RUN pnpm run build
CMD ["pnpm", "run", "start"]