# Single Dockerfile for both development and production
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (all for dev, production-only for prod)
ARG NODE_ENV=production
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm ci --only=production; \
    else \
      npm ci; \
    fi

# Copy source code
COPY . .

# Build for production if needed
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm run build; \
    fi

# Create uploads directory
RUN mkdir -p uploads

# Create non-root user for production
RUN if [ "$NODE_ENV" = "production" ]; then \
      addgroup -g 1001 -S nodejs && \
      adduser -S nodejs -u 1001 && \
      chown -R nodejs:nodejs /app && \
      USER nodejs; \
    fi

# Expose port
EXPOSE 3001

# Start command based on environment
CMD if [ "$NODE_ENV" = "production" ]; then \
      npm start; \
    else \
      npm run dev; \
    fi
