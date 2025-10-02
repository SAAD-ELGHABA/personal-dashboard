# Deployment Guide

This guide covers deploying the Personal Dashboard to production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Environment Variables](#environment-variables)
- [Security Considerations](#security-considerations)
- [Monitoring](#monitoring)

## Prerequisites

- Server with Docker and Docker Compose installed
- Domain name (optional but recommended)
- SSL certificate (for HTTPS)
- MongoDB instance or MongoDB Atlas account

## Docker Deployment

### 1. Prepare Your Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone the Repository

```bash
git clone <your-repo-url>
cd personal-dashboard
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

Update with production values:
```env
JWT_SECRET=<generate-strong-random-secret>
N8N_API_KEY=<your-n8n-api-key>
N8N_BASE_URL=https://your-n8n-instance.com/api/v1
PORTFOLIO_BASE_URL=https://your-portfolio.com/api
```

### 4. Build and Start Services

```bash
docker-compose up -d
```

### 5. Verify Deployment

```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f

# Test the application
curl http://localhost:5000/health
```

## Manual Deployment

### Backend Deployment

1. **Install Node.js and MongoDB**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
# Follow: https://docs.mongodb.com/manual/installation/
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
nano .env  # Configure environment variables
npm run build
```

3. **Run with PM2 (Process Manager)**
```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start dist/server.js --name dashboard-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Frontend Deployment

1. **Build Frontend**
```bash
cd frontend
npm install
cp .env.example .env
nano .env  # Set VITE_API_URL to your backend URL
npm run build
```

2. **Serve with Nginx**
```bash
# Install Nginx
sudo apt install nginx

# Copy build files
sudo cp -r dist/* /var/www/html/dashboard/

# Configure Nginx
sudo nano /etc/nginx/sites-available/dashboard
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html/dashboard;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

## Environment Variables

### Production Environment Variables

**Backend (.env)**
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://username:password@host:27017/dashboard
JWT_SECRET=<strong-random-secret-min-32-chars>
JWT_EXPIRES_IN=7d
N8N_API_KEY=<your-n8n-api-key>
N8N_BASE_URL=https://your-n8n.com/api/v1
PORTFOLIO_BASE_URL=https://your-portfolio.com/api
```

**Frontend (.env)**
```env
VITE_API_URL=https://your-domain.com
```

### Generating Secure Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

## Security Considerations

### 1. Environment Variables
- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Rotate secrets regularly

### 2. Database Security
- Use strong MongoDB passwords
- Enable MongoDB authentication
- Restrict MongoDB network access
- Regular backups

### 3. API Security
- Enable rate limiting (already configured)
- Use HTTPS in production
- Implement CORS properly
- Regular security updates

### 4. Server Security
```bash
# Setup firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

## Database Backup

### Automated MongoDB Backup

Create backup script:
```bash
#!/bin/bash
# backup-mongodb.sh

BACKUP_DIR="/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

mongodump --uri="mongodb://username:password@localhost:27017/dashboard" \
  --out="$BACKUP_DIR/backup_$TIMESTAMP"

# Keep only last 7 days of backups
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

Setup cron job:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-mongodb.sh
```

## Monitoring

### Application Monitoring

1. **PM2 Monitoring**
```bash
pm2 monit
pm2 logs dashboard-api
```

2. **Docker Monitoring**
```bash
docker-compose logs -f
docker stats
```

### Health Checks

Setup monitoring service to check:
- `GET /health` endpoint
- Database connectivity
- API response times

### Log Management

Configure log rotation:
```bash
# /etc/logrotate.d/dashboard
/var/log/dashboard/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

## Scaling

### Horizontal Scaling

1. **Load Balancer Setup**
   - Use Nginx or HAProxy
   - Multiple backend instances
   - Session management with Redis

2. **Database Scaling**
   - MongoDB replica sets
   - Read replicas for analytics
   - Sharding for large datasets

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Enable caching (Redis)

## Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
# Find process using port
sudo lsof -i :5000
# Kill process
sudo kill -9 <PID>
```

2. **MongoDB Connection Issues**
```bash
# Check MongoDB status
sudo systemctl status mongod
# Check logs
sudo tail -f /var/log/mongodb/mongod.log
```

3. **Nginx Issues**
```bash
# Test configuration
sudo nginx -t
# Check logs
sudo tail -f /var/log/nginx/error.log
```

## Rollback Strategy

1. **Keep Previous Version**
```bash
# Tag before deployment
git tag v1.0.0
git push --tags
```

2. **Quick Rollback**
```bash
# Stop current version
docker-compose down

# Checkout previous version
git checkout v1.0.0

# Restart
docker-compose up -d
```

## Updates and Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose down
docker-compose build
docker-compose up -d

# Or for manual deployment
cd backend && npm install && npm run build
pm2 restart dashboard-api

cd ../frontend && npm install && npm run build
sudo cp -r dist/* /var/www/html/dashboard/
```

### Database Migrations

```bash
# Backup before migration
./backup-mongodb.sh

# Run migrations (if any)
cd backend
npm run migrate
```

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Review Nginx/Docker logs
5. Open an issue on GitHub

## Checklist

Before going to production:

- [ ] Strong JWT secret configured
- [ ] Database authentication enabled
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Backup system in place
- [ ] Monitoring setup
- [ ] Log rotation configured
- [ ] Environment variables secured
- [ ] API keys configured
- [ ] Domain DNS configured
- [ ] Health checks working
- [ ] Error tracking setup
