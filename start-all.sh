#!/bin/bash

echo "🚀 Starting DevTools Dashboard - Enterprise Edition"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if databases exist, initialize if not
if [ ! -f "data/misinfo.db" ]; then
    echo -e "${YELLOW}Initializing Misinformation Lab database...${NC}"
    cd services/misinfo && npm run init-db && cd ../..
fi

if [ ! -f "data/portfolio.db" ]; then
    echo -e "${YELLOW}Initializing E-Portfolio database...${NC}"
    cd services/portfolio && npm run init-db && cd ../..
fi

if [ ! -f "data/resilience.db" ]; then
    echo -e "${YELLOW}Initializing Resilience database...${NC}"
    cd services/resilience && npm run init-db && cd ../..
fi

if [ ! -f "data/ai-safety.db" ]; then
    echo -e "${YELLOW}Initializing AI Safety database...${NC}"
    cd services/ai-safety && npm run init-db && cd ../..
fi

echo -e "${GREEN}Starting all services...${NC}"
echo ""

# Start Flask backend
echo -e "${BLUE}[1/6] Starting Flask Backend (port 5000)...${NC}"
cd backend && python3 app.py &
FLASK_PID=$!
cd ..

# Give Flask a moment to start
sleep 2

# Start Misinformation Lab services
echo -e "${BLUE}[2/6] Starting Misinformation Lab (ports 5001-5004)...${NC}"
cd services/misinfo
PORT=5001 node ingest-api/server.js &
PORT=5002 node facts-api/server.js &
PORT=5003 node nlp-api/server.js &
PORT=5004 node forensics-api/server.js &
cd ../..

# Start E-Portfolio services
echo -e "${BLUE}[3/6] Starting E-Portfolio (ports 5005-5006)...${NC}"
cd services/portfolio
GH_INDEXER_PORT=5005 node gh-indexer/index.js &
PORTFOLIO_API_PORT=5006 node portfolio-api/server.js &
cd ../..

# Start Cyber Resilience services
echo -e "${BLUE}[4/6] Starting Cyber Resilience (ports 5007-5010)...${NC}"
cd services/resilience
BACKUP_API_PORT=5007 node backup-api/server.js &
RANSOMWARE_API_PORT=5008 node ransomware-api/server.js &
LOGS_API_PORT=5009 node logs-api/server.js &
COMPLIANCE_API_PORT=5010 node compliance-api/server.js &
cd ../..

# Start AI Safety services
echo -e "${BLUE}[5/6] Starting AI Safety (ports 5011-5014)...${NC}"
cd services/ai-safety
PORT=5011 node prompt-monitor-api/server.js &
PORT=5012 node redteam-api/server.js &
PORT=5013 node robustness-api/server.js &
PORT=5014 node tool-gate-api/server.js &
cd ../..

# Give services time to start
sleep 3

# Start Frontend (last, in foreground)
echo -e "${BLUE}[6/6] Starting Frontend (port 5173)...${NC}"
echo ""
echo -e "${GREEN}=================================================="
echo "✅ All services started successfully!"
echo "=================================================="
echo ""
echo "🌐 Access the application:"
echo "   Local:   http://localhost:5173"
echo "   Network: http://$(hostname -I | awk '{print $1}'):5173"
echo ""
echo "📊 Backend Services:"
echo "   Flask API:          http://localhost:5000"
echo "   Misinformation Lab: http://localhost:5001-5004"
echo "   E-Portfolio:        http://localhost:5005-5006"
echo "   Cyber Resilience:   http://localhost:5007-5010"
echo "   AI Safety:          http://localhost:5011-5014"
echo ""
echo "Press Ctrl+C to stop all services"
echo -e "==================================================${NC}"
echo ""

cd frontend && npm run dev -- --host

# Cleanup on exit
trap "echo -e '\n${YELLOW}Stopping all services...${NC}'; kill 0" EXIT
