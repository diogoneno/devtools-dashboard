#!/bin/bash

# Port Conflict Detection Script
# Checks if required ports are available before starting services

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_port() {
    local port=$1
    local service=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${RED}✗ Port $port is already in use${NC} ($service)"
        lsof -Pi :$port -sTCP:LISTEN | tail -n +2
        return 1
    else
        echo -e "${GREEN}✓ Port $port is available${NC} ($service)"
        return 0
    fi
}

echo "==================================================="
echo "  DevTools Dashboard - Port Availability Check"
echo "==================================================="
echo ""

failed=0

# Backend services
check_port 5000 "Main API (Flask)" || failed=1

# Misinformation Lab
check_port 5001 "Misinfo Ingest" || failed=1
check_port 5002 "Fact Check" || failed=1
check_port 5003 "NLP Analysis" || failed=1
check_port 5004 "Media Forensics" || failed=1

# E-Portfolio
check_port 5005 "Portfolio Indexer" || failed=1
check_port 5006 "Portfolio API" || failed=1

# Cyber Resilience
check_port 5007 "Backup Manager" || failed=1
check_port 5008 "Ransomware Defense" || failed=1
check_port 5009 "Log Monitoring" || failed=1
check_port 5010 "Compliance Check" || failed=1

# AI Safety
check_port 5011 "Prompt Monitor" || failed=1
check_port 5012 "Red Team" || failed=1
check_port 5013 "Robustness Test" || failed=1
check_port 5014 "Tool Gate" || failed=1

# Frontend
check_port 5173 "Frontend (Vite)" || failed=1

echo ""
echo "==================================================="
if [ $failed -eq 1 ]; then
    echo -e "${RED}✗ Some required ports are in use${NC}"
    echo "==================================================="
    echo ""
    echo -e "${YELLOW}To fix this:${NC}"
    echo "  1. Stop the processes using these ports"
    echo "  2. Or change the port configuration in .env files"
    echo "  3. To kill a process on a specific port:"
    echo "     lsof -ti:PORT | xargs kill -9"
    echo ""
    exit 1
else
    echo -e "${GREEN}✓ All required ports are available${NC}"
    echo "==================================================="
    exit 0
fi
