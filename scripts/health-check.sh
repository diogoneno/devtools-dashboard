#!/bin/bash

# Health Check Script for DevTools Dashboard
# Verifies all 15 services are running and healthy

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_service() {
    local port=$1
    local name=$2
    local max_attempts=30
    local attempt=0

    echo -n "Checking $name (port $port)... "

    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s http://localhost:$port/health > /dev/null 2>&1 || curl -f -s http://localhost:$port/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ healthy${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done

    echo -e "${RED}✗ FAILED (not responding after ${max_attempts}s)${NC}"
    return 1
}

echo "==================================================="
echo "  DevTools Dashboard - Health Check"
echo "==================================================="
echo ""

failed_services=()

# Check main API (Flask backend)
check_service 5000 "Main API (Flask)" || failed_services+=("Main API (5000)")

# Check Misinformation Lab services
check_service 5001 "Misinfo Ingest API" || failed_services+=("Misinfo Ingest (5001)")
check_service 5002 "Fact Check API" || failed_services+=("Fact Check (5002)")
check_service 5003 "NLP Analysis API" || failed_services+=("NLP Analysis (5003)")
check_service 5004 "Media Forensics API" || failed_services+=("Media Forensics (5004)")

# Check E-Portfolio services
check_service 5005 "Portfolio Indexer API" || failed_services+=("Portfolio Indexer (5005)")
check_service 5006 "Portfolio API" || failed_services+=("Portfolio API (5006)")

# Check Cyber Resilience services
check_service 5007 "Backup Manager API" || failed_services+=("Backup Manager (5007)")
check_service 5008 "Ransomware Defense API" || failed_services+=("Ransomware Defense (5008)")
check_service 5009 "Log Monitoring API" || failed_services+=("Log Monitoring (5009)")
check_service 5010 "Compliance Check API" || failed_services+=("Compliance Check (5010)")

# Check AI Safety services
check_service 5011 "Prompt Monitor API" || failed_services+=("Prompt Monitor (5011)")
check_service 5012 "Red Team API" || failed_services+=("Red Team (5012)")
check_service 5013 "Robustness Test API" || failed_services+=("Robustness Test (5013)")
check_service 5014 "Tool Access Gate API" || failed_services+=("Tool Gate (5014)")

echo ""
echo "==================================================="
if [ ${#failed_services[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All 15 services are healthy${NC}"
    echo "==================================================="
    exit 0
else
    echo -e "${RED}✗ ${#failed_services[@]} service(s) failed health check:${NC}"
    for service in "${failed_services[@]}"; do
        echo -e "  ${RED}✗${NC} $service"
    done
    echo "==================================================="
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  1. Check if services are running: ps aux | grep node"
    echo "  2. Check service logs: tail -f logs/*.log"
    echo "  3. Verify databases are initialized: ls -la data/"
    echo "  4. Check for port conflicts: lsof -i :5000-5014"
    echo ""
    exit 1
fi
