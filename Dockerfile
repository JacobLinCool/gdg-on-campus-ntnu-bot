FROM node:lts-slim AS builder

WORKDIR /app

# Copy package.json and pnpm-lock.yaml to use layer caching
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Create a smaller production image
FROM node:lts-slim AS runner

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install pnpm and production dependencies only
RUN npm install -g pnpm && pnpm install --prod

# Set environment variables
ENV NODE_ENV=production

# Run the application
CMD ["node", "--enable-source-maps", "dist/index.js"]
