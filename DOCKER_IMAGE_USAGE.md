# Docker Image Usage Guide

## Using Pre-built Images

Dienstato is available as a pre-built Docker image on GitHub Container Registry. This means you don't need to build the image locally.

### Image URL

```
ghcr.io/phontary/dienstato:latest
```

## Quick Start with Docker Run

```bash
# Pull the image
docker pull ghcr.io/phontary/dienstato:latest

# Run the container
docker run -d \
  -p 3000:3000 \
  -v ./data:/app/data \
  -v ./temp:/app/temp \
  -e SMTP_HOST=smtp.strato.de \
  -e SMTP_PORT=465 \
  -e SMTP_SECURE=true \
  -e SMTP_USER=your-email@example.com \
  -e SMTP_PASSWORD=your_password \
  -e SMTP_FROM_EMAIL=your-email@example.com \
  -e SMTP_FROM_NAME=Dienstato \
  -e CRON_SECRET=$(openssl rand -hex 32) \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  -e DATABASE_URL=file:./data/sqlite.db \
  --name dienstato \
  ghcr.io/phontary/dienstato:latest
```

## Quick Start with Docker Compose (Recommended)

The provided `docker-compose.yml` is already configured to use the pre-built image:

```bash
# Clone the repository (for docker-compose.yml and .env.example)
git clone https://github.com/phontary/Dienstato.git
cd Dienstato

# Use the automated deploy script
./deploy.sh
```

Or manually:

```bash
# Copy and configure environment
cp .env.example .env
nano .env  # Edit with your SMTP credentials

# Create required directories
mkdir -p data temp

# Pull the latest image
docker-compose pull

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f dienstato
```

## Available Image Tags

| Tag | Description |
|-----|-------------|
| `latest` | Latest stable release (recommended) |
| `v2.2.0` | Specific version 2.2.0 |
| `dev` | Development build (unstable, not recommended) |

### Using a Specific Version

Edit `docker-compose.yml` to use a specific version:

```yaml
services:
  dienstato:
    image: ghcr.io/phontary/dienstato:v2.2.0  # Use specific version
    # ... rest of configuration
```

## Updating to Latest Version

```bash
# Pull the latest image
docker-compose pull

# Recreate the container with new image
docker-compose up -d

# Verify the update
docker-compose logs dienstato
```

## Docker Compose Configuration

The `docker-compose.yml` file is configured as follows:

```yaml
services:
  dienstato:
    # Pre-built image (no local build needed)
    image: ghcr.io/phontary/dienstato:latest

    container_name: dienstato
    restart: unless-stopped

    ports:
      - "3000:3000"

    volumes:
      - ./data:/app/data    # Database storage
      - ./temp:/app/temp    # Temporary files

    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./data/sqlite.db

    env_file:
      - .env

    healthcheck:
      test: ["CMD", "node", "-e", "..."]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Benefits of Pre-built Images

1. **Faster Deployment**: No build time, just pull and run
2. **Consistent**: Same image everywhere, no build variations
3. **Smaller Download**: Only need the repository for config files
4. **Automatic Updates**: Pull latest image to get updates
5. **CI/CD Ready**: Images are built and tested automatically

## Environment Variables

All configuration is done via environment variables in the `.env` file:

### Required Variables

```env
# SMTP Configuration
SMTP_HOST=smtp.strato.de
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your_password_here
SMTP_FROM_EMAIL=your-email@example.com
SMTP_FROM_NAME=Dienstato

# Security
CRON_SECRET=your-secure-secret-here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (auto-configured)
DATABASE_URL=file:./data/sqlite.db
```

See `.env.example` for all available options.

## Volume Mounts

### Data Volume (`./data:/app/data`)

Stores:
- SQLite database (`sqlite.db`)
- Database journals and WAL files
- User-uploaded avatars

**Important**: Always back up this directory!

### Temp Volume (`./temp:/app/temp`)

Stores:
- Temporary PDF files for email attachments
- Other temporary processing files

This directory can be safely cleared.

## Healthcheck

The container includes a built-in healthcheck that:
- Checks the `/api/health` endpoint every 30 seconds
- Waits 40 seconds before starting checks (startup period)
- Marks unhealthy after 3 failed attempts

Monitor health status:
```bash
docker ps  # Check STATUS column
docker inspect dienstato --format='{{.State.Health.Status}}'
```

## Troubleshooting

### Image Pull Fails

```bash
# Try logging in to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Or pull without authentication (for public images)
docker pull ghcr.io/phontary/dienstato:latest
```

### Container Won't Start

```bash
# Check logs
docker-compose logs dienstato

# Check environment variables
docker-compose config

# Verify .env file
cat .env
```

### Database Issues

```bash
# Check database file
ls -lh data/sqlite.db

# Verify permissions
chmod 644 data/sqlite.db

# Check database integrity
docker exec dienstato sqlite3 /app/data/sqlite.db "PRAGMA integrity_check;"
```

### Need to Rebuild Locally?

If you need to build from source instead of using the pre-built image:

```bash
# Edit docker-compose.yml
services:
  dienstato:
    # Comment out image line
    # image: ghcr.io/phontary/dienstato:latest

    # Add build configuration
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VERSION: "2.2.0"
```

Then build:
```bash
docker-compose build
docker-compose up -d
```

## Image Information

- **Registry**: GitHub Container Registry (ghcr.io)
- **Repository**: phontary/dienstato
- **Base Image**: node:20-alpine
- **Size**: ~500MB (compressed)
- **Architecture**: linux/amd64, linux/arm64

## Security

The pre-built images:
- Are built from the main branch automatically
- Use official Node.js base images
- Include security scanning in CI/CD
- Run as non-root user inside container
- Have minimal attack surface (Alpine Linux)

## Support

For issues with:
- **Image availability**: Check GitHub Actions for build status
- **Image functionality**: Report on GitHub Issues
- **Deployment help**: See DEPLOYMENT.md
- **Configuration**: See EMAIL_SYSTEM_README.md

## Related Documentation

- [Quick Start Guide](DOCKER_DEPLOYMENT_QUICK_START.md)
- [Full Deployment Guide](DEPLOYMENT.md)
- [Email System Setup](EMAIL_SYSTEM_README.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
