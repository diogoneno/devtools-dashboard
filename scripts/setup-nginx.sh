#!/bin/bash

# Nginx Setup Script for DevTools Dashboard
# This script automates the nginx reverse proxy configuration

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "==================================================="
echo "  DevTools Dashboard - Nginx Setup"
echo "==================================================="
echo ""

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: This script must be run with sudo${NC}"
    echo "Usage: sudo ./scripts/setup-nginx.sh"
    exit 1
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Nginx is not installed. Installing...${NC}"
    apt update
    apt install nginx -y
    systemctl enable nginx
    systemctl start nginx
    echo -e "${GREEN}✓ Nginx installed${NC}"
else
    echo -e "${GREEN}✓ Nginx is already installed${NC}"
fi

# Copy configuration files
echo ""
echo -e "${BLUE}Copying configuration files...${NC}"

# Copy main config
cp config/nginx/devtools.conf /etc/nginx/sites-available/devtools
echo -e "${GREEN}✓ Copied devtools.conf${NC}"

# Copy proxy params
cp config/nginx/proxy_params /etc/nginx/
echo -e "${GREEN}✓ Copied proxy_params${NC}"

# Prompt for domain name
echo ""
echo -e "${YELLOW}Enter your domain name (or press Enter for 'localhost'):${NC}"
read domain
domain=${domain:-localhost}

# Update domain in config
sed -i "s/server_name localhost/server_name $domain/" /etc/nginx/sites-available/devtools
echo -e "${GREEN}✓ Updated domain to: $domain${NC}"

# Prompt for deployment path
echo ""
echo -e "${YELLOW}Enter the full path to your deployment (or press Enter for current directory):${NC}"
read deploy_path
deploy_path=${deploy_path:-$(pwd)}

# Update root path in config
sed -i "s|root /var/www/devtools/frontend/dist|root $deploy_path/frontend/dist|" /etc/nginx/sites-available/devtools
echo -e "${GREEN}✓ Updated deployment path to: $deploy_path${NC}"

# Enable site
echo ""
echo -e "${BLUE}Enabling site...${NC}"
ln -sf /etc/nginx/sites-available/devtools /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default  # Remove default site

# Test configuration
echo ""
echo -e "${BLUE}Testing nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"

    # Reload nginx
    echo ""
    echo -e "${BLUE}Reloading nginx...${NC}"
    systemctl reload nginx
    echo -e "${GREEN}✓ Nginx reloaded successfully${NC}"
else
    echo -e "${RED}✗ Nginx configuration test failed${NC}"
    echo "Please check the configuration at /etc/nginx/sites-available/devtools"
    exit 1
fi

# SSL Setup prompt
echo ""
echo -e "${GREEN}=================================================="
echo "✅ Nginx reverse proxy configured!"
echo "==================================================${NC}"
echo ""
echo "🌐 Your application should now be accessible at:"
echo "   http://$domain"
echo ""
echo "🔒 Next Step - Setup SSL/TLS (recommended):"
echo ""
echo "  1. Install certbot:"
echo "     sudo apt install certbot python3-certbot-nginx -y"
echo ""
echo "  2. Obtain SSL certificate:"
echo "     sudo certbot --nginx -d $domain"
echo ""
echo "  3. Test auto-renewal:"
echo "     sudo certbot renew --dry-run"
echo ""
echo "📖 Full guide: docs/DEPLOYMENT.md"
echo ""
