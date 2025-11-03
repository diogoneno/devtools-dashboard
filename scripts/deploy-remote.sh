#!/bin/bash

# Remote Deployment Script
# This script is designed to be run on the production server after deployment package is uploaded

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DEPLOY_PATH=${DEPLOY_PATH:-/var/www/devtools}
BACKUP_DIR=${BACKUP_DIR:-/var/www/backups}
MAX_BACKUPS=5

echo "==================================================="
echo "  DevTools Dashboard - Remote Deployment"
echo "==================================================="
echo ""

# Create backup of current deployment
create_backup() {
    echo -e "${BLUE}Creating backup of current deployment...${NC}"

    BACKUP_NAME=backup-$(date +%Y%m%d_%H%M%S)
    mkdir -p "$BACKUP_DIR"

    if [ -d "$DEPLOY_PATH" ]; then
        tar -czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" -C "$DEPLOY_PATH" . 2>/dev/null || true
        echo -e "${GREEN}✓ Backup created: ${BACKUP_NAME}.tar.gz${NC}"

        # Cleanup old backups
        cd "$BACKUP_DIR"
        ls -t *.tar.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true
        echo -e "${GREEN}✓ Cleaned up old backups (keeping last $MAX_BACKUPS)${NC}"
    else
        echo -e "${YELLOW}⚠ No existing deployment to backup${NC}"
    fi
}

# Deploy new version
deploy() {
    echo ""
    echo -e "${BLUE}Deploying new version...${NC}"

    cd "$DEPLOY_PATH"

    # Install dependencies
    echo -e "${BLUE}Installing dependencies...${NC}"

    # Frontend
    cd frontend && npm ci --production && cd ..
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

    # Backend
    cd backend && pip3 install -r requirements.txt && cd ..
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"

    # Microservices
    for service in misinfo portfolio resilience ai-safety; do
        cd services/$service && npm ci --production && cd ../..
        echo -e "${GREEN}✓ $service dependencies installed${NC}"
    done

    # Initialize databases if needed
    echo ""
    echo -e "${BLUE}Checking databases...${NC}"
    for service in misinfo portfolio resilience ai-safety; do
        if [ ! -f "data/${service}.db" ]; then
            echo -e "${YELLOW}Initializing ${service}.db...${NC}"
            cd services/$service && npm run init-db && cd ../..
        fi
    done
    echo -e "${GREEN}✓ All databases ready${NC}"

    # Reload PM2 processes
    echo ""
    echo -e "${BLUE}Reloading PM2 processes...${NC}"
    pm2 reload ecosystem.config.js --update-env
    echo -e "${GREEN}✓ PM2 processes reloaded${NC}"
}

# Rollback to previous version
rollback() {
    echo ""
    echo -e "${YELLOW}Rolling back to previous version...${NC}"

    # Find most recent backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -n1)

    if [ -z "$LATEST_BACKUP" ]; then
        echo -e "${RED}✗ ERROR: No backup found for rollback!${NC}"
        exit 1
    fi

    echo -e "${BLUE}Rolling back to: $(basename $LATEST_BACKUP)${NC}"

    # Stop services
    pm2 stop all

    # Remove current deployment
    cd "$DEPLOY_PATH"
    rm -rf ./*

    # Restore from backup
    tar -xzf "$LATEST_BACKUP"

    # Restart services
    pm2 start ecosystem.config.js

    echo -e "${GREEN}✓ Rollback completed${NC}"
}

# Health check
health_check() {
    echo ""
    echo -e "${BLUE}Running health checks...${NC}"
    sleep 5

    cd "$DEPLOY_PATH"
    chmod +x scripts/health-check.sh

    if ./scripts/health-check.sh; then
        echo -e "${GREEN}✓ All services healthy${NC}"
        return 0
    else
        echo -e "${RED}✗ Health checks failed${NC}"
        return 1
    fi
}

# Main deployment flow
main() {
    # Create backup
    create_backup

    # Deploy
    deploy

    # Health check
    if health_check; then
        echo ""
        echo -e "${GREEN}==================================================="
        echo "✅ Deployment successful!"
        echo "===================================================${NC}"
        echo ""
        echo "Deployed at: $(date)"
        echo ""
        echo "📊 Manage services:"
        echo "  pm2 status"
        echo "  pm2 logs"
        echo "  pm2 monit"
        echo ""
    else
        echo ""
        echo -e "${RED}==================================================="
        echo "❌ Deployment failed - health checks did not pass"
        echo "===================================================${NC}"
        echo ""
        echo "Initiating automatic rollback..."
        rollback

        # Re-check health after rollback
        if health_check; then
            echo ""
            echo -e "${YELLOW}==================================================="
            echo "⚠ Rolled back to previous version"
            echo "===================================================${NC}"
            exit 1
        else
            echo ""
            echo -e "${RED}==================================================="
            echo "❌ CRITICAL: Rollback also failed!"
            echo "===================================================${NC}"
            echo "Manual intervention required"
            exit 2
        fi
    fi
}

# Run main deployment
main
