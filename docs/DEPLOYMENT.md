# Production Deployment Guide

This guide covers deploying DevTools Dashboard to a production server with nginx reverse proxy.

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Node.js 20+ (required by Vite 7 and React Router 7)
- Python 3.8+
- nginx web server
- PM2 for process management
- Domain name (optional but recommended)

## Quick Deployment

For a quick automated deployment:

```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

This script will:
1. Build the frontend
2. Install backend dependencies
3. Initialize databases
4. Create PM2 configuration
5. Check port availability
6. Start all services
7. Run health checks

## Manual Deployment Steps

### 1. Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install nginx
sudo apt install nginx -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Install Python and pip
sudo apt install python3 python3-pip -y

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Clone and Setup Application

```bash
# Clone repository
git clone https://github.com/yourusername/devtools-dashboard.git
cd devtools-dashboard

# Install dependencies
cd frontend && npm install && cd ..
cd backend && pip3 install -r requirements.txt && cd ..

# Install microservice dependencies
for service in misinfo portfolio resilience ai-safety; do
    cd services/$service && npm install && cd ../..
done
```

### 3. Configure Environment Variables

```bash
# Backend configuration
cp backend/.env.example backend/.env
nano backend/.env  # Add your API keys if needed

# Microservice configurations
cp services/misinfo/.env.example services/misinfo/.env
cp services/portfolio/.env.example services/portfolio/.env
cp services/resilience/.env.example services/resilience/.env
cp services/ai-safety/.env.example services/ai-safety/.env

# Edit each as needed
```

### 4. Build Frontend

```bash
cd frontend
cp .env.production .env
npm run build
cd ..
```

The build will be created in `frontend/dist/`.

### 5. Setup Nginx Reverse Proxy

```bash
# Copy nginx configuration
sudo cp config/nginx/devtools.conf /etc/nginx/sites-available/devtools
sudo cp config/nginx/proxy_params /etc/nginx/

# Update the server_name and root path in the config
sudo nano /etc/nginx/sites-available/devtools

# Enable site
sudo ln -sf /etc/nginx/sites-available/devtools /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default  # Remove default site

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

**Important:** Update these lines in `/etc/nginx/sites-available/devtools`:
- `server_name` - Change from `localhost` to your domain name
- `root` - Change from `/var/www/devtools/frontend/dist` to your actual deployment path

### 6. Deploy Frontend Files

```bash
# Create web directory
sudo mkdir -p /var/www/devtools
sudo chown $USER:$USER /var/www/devtools

# Copy frontend build
cp -r frontend/dist /var/www/devtools/frontend/
```

### 7. Initialize Databases

```bash
cd services/misinfo && npm run init-db && cd ../..
cd services/portfolio && npm run init-db && cd ../..
cd services/resilience && npm run init-db && cd ../..
cd services/ai-safety && npm run init-db && cd ../..
```

### 8. Start Backend Services with PM2

```bash
# Start all services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command output instructions

# Check status
pm2 status
```

### 9. Verify Deployment

```bash
# Run health checks
./scripts/health-check.sh

# Check nginx is serving frontend
curl http://localhost

# Check API endpoints
curl http://localhost/api/health
curl http://localhost/api/misinfo/ingest/health
```

## SSL/TLS Configuration (Recommended)

### Using Let's Encrypt (Free)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Certbot will automatically:
# - Obtain SSL certificate
# - Update nginx configuration
# - Setup auto-renewal

# Test renewal
sudo certbot renew --dry-run
```

### Manual SSL Configuration

If you have your own SSL certificates:

```bash
# Copy certificates
sudo cp your-cert.pem /etc/ssl/certs/devtools-cert.pem
sudo cp your-key.pem /etc/ssl/private/devtools-key.pem
sudo chmod 600 /etc/ssl/private/devtools-key.pem

# Edit nginx config and uncomment SSL section
sudo nano /etc/nginx/sites-available/devtools

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

## Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct access to backend ports (security)
sudo ufw deny 5000:5014/tcp

# Enable firewall
sudo ufw enable
```

## Service Management

### PM2 Commands

```bash
# View all services
pm2 status

# View logs
pm2 logs
pm2 logs flask-backend
pm2 logs misinfo-ingest

# Restart service
pm2 restart flask-backend
pm2 restart all

# Stop service
pm2 stop flask-backend
pm2 stop all

# Delete service
pm2 delete flask-backend

# Monitor in real-time
pm2 monit
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload (graceful, no downtime)
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

## Monitoring and Maintenance

### Health Checks

Run health checks regularly:

```bash
./scripts/health-check.sh
```

Consider setting up a cron job:

```bash
# Add to crontab
crontab -e

# Add line (check every 5 minutes)
*/5 * * * * cd /path/to/devtools && ./scripts/health-check.sh >> /var/log/devtools-health.log 2>&1
```

### Log Rotation

```bash
# Setup PM2 log rotation
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Database Backups

```bash
# Backup databases
mkdir -p backups
sqlite3 data/misinfo.db ".backup 'backups/misinfo-$(date +%Y%m%d).db'"
sqlite3 data/portfolio.db ".backup 'backups/portfolio-$(date +%Y%m%d).db'"
sqlite3 data/resilience.db ".backup 'backups/resilience-$(date +%Y%m%d).db'"
sqlite3 data/ai-safety.db ".backup 'backups/ai-safety-$(date +%Y%m%d).db'"
```

## Troubleshooting

### Services Won't Start

```bash
# Check port conflicts
./scripts/check-ports.sh

# Check PM2 logs
pm2 logs --err

# Check system logs
sudo journalctl -u nginx -n 50
```

### Health Checks Fail

```bash
# Check if services are running
pm2 status

# Test individual service
curl http://localhost:5000/health
curl http://localhost:5001/health

# Check firewall
sudo ufw status
```

### Frontend Not Loading

```bash
# Check nginx configuration
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify files exist
ls -la /var/www/devtools/frontend/dist/
```

### CORS Errors

If you see CORS errors:
1. Verify nginx proxy headers are set correctly
2. Check that all services have CORS enabled
3. Ensure `CORS_ORIGIN` in service `.env` files matches your domain

## Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild frontend
cd frontend && npm install && npm run build && cd ..

# Update backend
cd backend && pip3 install -r requirements.txt && cd ..

# Update microservices
for service in misinfo portfolio resilience ai-safety; do
    cd services/$service && npm install && cd ../..
done

# Restart services
pm2 restart all

# Run health checks
./scripts/health-check.sh
```

## Performance Optimization

### Nginx Caching

Add to your nginx config:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout http_500 http_502 http_503;
    # ... other proxy settings
}
```

### Enable Gzip Compression

Add to nginx config:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

## Security Checklist

- [ ] SSL/TLS certificates installed and working
- [ ] Firewall configured (allow 80/443, block 5000-5014)
- [ ] Backend ports not directly accessible from internet
- [ ] Environment variables properly secured (no secrets in code)
- [ ] Regular security updates applied
- [ ] Database backups configured
- [ ] Rate limiting configured in nginx (optional)
- [ ] Fail2ban configured for brute force protection (optional)

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/devtools-dashboard/issues
- Documentation: See `/docs` folder
