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
echo "To start all services in production:"
echo "  pm2 start ecosystem.config.js"
echo ""
echo "To monitor services:"
echo "  pm2 monit"
echo ""
echo "To view logs:"
echo "  pm2 logs"
echo ""
echo "To stop all services:"
echo "  pm2 stop all"
echo ""
echo "Frontend build is in: frontend/dist/"
echo "Serve it with nginx, Apache, or: npx serve frontend/dist -p 5173"
