# Docker Setup - VectorSets Face Similarity

## Quick Start

```bash
# Start everything
docker-compose up --build

# Start in background
docker-compose up -d --build

# Stop everything
docker-compose down

# View logs
docker-compose logs -f
```

## Environment Switch

Edit `docker.env` to change environment:

```bash
NODE_ENV=development  # Hot reloading
NODE_ENV=production   # Optimized builds
```

Restart after changing: `docker-compose down && docker-compose up --build`

## Individual Services

```bash
# Start specific service
docker-compose up backend
docker-compose up frontend

# View service status
docker-compose ps
```

## Project Structure

```
.
├── backend/
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml
├── docker.env
└── DOCKER_README.md
```

## Services

- **Backend**: Node.js API on port 3001
- **Frontend**: Next.js app on port 3000
- **Redis**: External (configured in backend .env)

## Environment Files

- `docker.env` - Controls Docker environment (dev/prod)
- `./backend/.env` - Backend configuration
- `./frontend/.env` - Frontend configuration

## Troubleshooting

```bash
# Rebuild without cache
docker-compose build --no-cache

# Clean everything
docker-compose down -v --rmi all

# View container resources
docker stats
```
