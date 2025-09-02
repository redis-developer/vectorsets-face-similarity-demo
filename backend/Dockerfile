# Single Dockerfile for both development and production
FROM node:20-bookworm

# Set working directory
WORKDIR /app

# Create non-root user for production
RUN if [ "$NODE_ENV" = "production" ]; then \
      addgroup --system --gid 1001 nodejs && \
      adduser --system --uid 1001 nodejs && \
      USER nodejs; \
    fi

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Install dependencies (all for dev, production-only for prod)
ARG NODE_ENV=production
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm ci --only=production; \
    else \
      npm ci; \
    fi

# Copy source code
COPY --chown=nodejs:nodejs . .

# Build for production if needed
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm run build; \
    fi

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Start command based on environment
CMD if [ "$NODE_ENV" = "production" ]; then \
      npm start; \
    else \
      npm run dev; \
    fi
