#!/bin/bash

echo "🚀 Production Deployment Script"
echo "================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Please do not run as root${NC}"
    exit 1
fi

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"

# Frontend
cd frontend
echo -e "${BLUE}Configuring production environment...${NC}"
# Copy production environment variables for build
if [ -f .env.production ]; then
    cp .env.production .env
    echo -e "${GREEN}✓ Production environment configured${NC}"
else
    echo -e "${YELLOW}⚠ Warning: .env.production not found, using development settings${NC}"
fi
npm install
npm run build
cd ..

# Backend
cd backend
pip3 install -r requirements.txt
cd ..

# Microservices
for service in misinfo portfolio resilience ai-safety; do
    echo -e "${BLUE}Installing $service dependencies...${NC}"
    cd services/$service
    npm install
    cd ../..
done

# Initialize databases
echo -e "${BLUE}Initializing databases...${NC}"
cd services/misinfo && npm run init-db && cd ../..
cd services/portfolio && npm run init-db && cd ../..
cd services/resilience && npm run init-db && cd ../..
cd services/ai-safety && npm run init-db && cd ../..

# Install PM2 globally (for production process management)
echo -e "${BLUE}Installing PM2...${NC}"
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'flask-backend',
      script: 'backend/app.py',
      interpreter: 'python3',
      env: {
        FLASK_ENV: 'production'
      }
    },
    {
      name: 'misinfo-ingest',
      script: 'services/misinfo/ingest-api/server.js',
      env: { PORT: 5001 }
    },
    {
      name: 'misinfo-facts',
      script: 'services/misinfo/facts-api/server.js',
      env: { PORT: 5002 }
    },
    {
      name: 'misinfo-nlp',
      script: 'services/misinfo/nlp-api/server.js',
      env: { PORT: 5003 }
    },
    {
      name: 'misinfo-forensics',
      script: 'services/misinfo/forensics-api/server.js',
      env: { PORT: 5004 }
    },
    {
      name: 'portfolio-indexer',
      script: 'services/portfolio/gh-indexer/index.js',
      env: { GH_INDEXER_PORT: 5005 }
    },
    {
      name: 'portfolio-api',
      script: 'services/portfolio/portfolio-api/server.js',
      env: { PORTFOLIO_API_PORT: 5006 }
    },
    {
      name: 'resilience-backup',
      script: 'services/resilience/backup-api/server.js',
      env: { BACKUP_API_PORT: 5007 }
    },
    {
      name: 'resilience-ransomware',
      script: 'services/resilience/ransomware-api/server.js',
      env: { RANSOMWARE_API_PORT: 5008 }
    },
    {
      name: 'resilience-logs',
      script: 'services/resilience/logs-api/server.js',
      env: { LOGS_API_PORT: 5009 }
    },
    {
      name: 'resilience-compliance',
      script: 'services/resilience/compliance-api/server.js',
      env: { COMPLIANCE_API_PORT: 5010 }
    },
    {
      name: 'ai-safety-prompt-monitor',
      script: 'services/ai-safety/prompt-monitor-api/server.js',
      env: { PORT: 5011 }
    },
    {
      name: 'ai-safety-redteam',
      script: 'services/ai-safety/redteam-api/server.js',
      env: { PORT: 5012 }
    },
    {
      name: 'ai-safety-robustness',
      script: 'services/ai-safety/robustness-api/server.js',
      env: { PORT: 5013 }
    },
    {
      name: 'ai-safety-toolgate',
      script: 'services/ai-safety/tool-gate-api/server.js',
      env: { PORT: 5014 }
    }
  ]
};
EOF

echo -e "${GREEN}✅ Production setup complete!${NC}"
echo ""

# Check port availability
echo -e "${BLUE}Checking port availability...${NC}"
if [ -x "./scripts/check-ports.sh" ]; then
    ./scripts/check-ports.sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Required ports are not available.${NC}"
        echo "Please stop conflicting services before deploying."
        exit 1
    fi
    echo ""
fi

# Start all services with PM2
echo -e "${BLUE}Starting all services with PM2...${NC}"
pm2 start ecosystem.config.js

# Wait for services to initialize
echo -e "${YELLOW}Waiting for services to initialize...${NC}"
sleep 10

# Run health checks
echo ""
echo -e "${BLUE}Running health checks...${NC}"
if [ -x "./scripts/health-check.sh" ]; then
    ./scripts/health-check.sh
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}ERROR: Some services failed health checks!${NC}"
        echo ""
        echo "View logs with: pm2 logs"
        echo "Check service status: pm2 status"
        echo "Stop services: pm2 stop all"
        exit 1
    fi
else
    echo -e "${YELLOW}Warning: Health check script not found, skipping...${NC}"
fi

echo ""
echo -e "${GREEN}=================================================="
echo "✅ All services deployed and healthy!"
echo "==================================================${NC}"
echo ""
echo "📊 Service Management:"
echo "  Monitor services:    pm2 monit"
echo "  View logs:           pm2 logs"
echo "  Check status:        pm2 status"
echo "  Restart service:     pm2 restart <name>"
echo "  Stop all services:   pm2 stop all"
echo ""
echo "🌐 Frontend:"
echo "  Build location:      frontend/dist/"
echo ""
echo "🔧 Next Steps - Setup Nginx Reverse Proxy:"
echo "  1. Copy nginx config:"
echo "     sudo cp config/nginx/devtools.conf /etc/nginx/sites-available/devtools"
echo "     sudo cp config/nginx/proxy_params /etc/nginx/"
echo ""
echo "  2. Edit config with your domain and paths:"
echo "     sudo nano /etc/nginx/sites-available/devtools"
echo ""
echo "  3. Enable site:"
echo "     sudo ln -sf /etc/nginx/sites-available/devtools /etc/nginx/sites-enabled/"
echo "     sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "  4. Setup SSL with Let's Encrypt (recommended):"
echo "     sudo certbot --nginx -d yourdomain.com"
echo ""
echo "📖 Full deployment guide: docs/DEPLOYMENT.md"
echo ""
echo "🔍 Health Check:"
echo "  Run manually:        ./scripts/health-check.sh"
echo ""
