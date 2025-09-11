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

# Install dependencies
RUN npm ci

# Copy source code
COPY --chown=nodejs:nodejs . .

# Build the application
RUN npm run build

# Set environment for runtime
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Set the NODE_ENV environment variable for runtime
ENV NODE_ENV=${NODE_ENV}

# Start command based on environment
CMD if [ "$NODE_ENV" = "production" ]; then \
      npm start; \
    else \
      npm run dev; \
    fi
