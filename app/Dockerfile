# Single Dockerfile for both development and production
FROM node:25-bookworm AS base

# Set working directory
WORKDIR /app

FROM base AS client
ARG BASE_PATH=""
ENV VITE_BASE_PATH=${BASE_PATH}
COPY client client
RUN cd client && npm install && npm run build

FROM base AS release

# Set environment for runtime
ENV NODE_ENV=${NODE_ENV}

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY --from=client /app/dist /dist
COPY server .

# Build the application
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Start command based on environment
CMD if [ "$NODE_ENV" = "production" ]; then \
      npm start; \
    else \
      npm run dev; \
    fi
