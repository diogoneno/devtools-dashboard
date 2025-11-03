#!/bin/bash

# Integration Test Script for DevTools Dashboard
# Tests all services and API endpoints

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2

    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "  Testing $test_name... "

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Function to initialize databases
init_databases() {
    echo -e "${BLUE}Initializing test databases...${NC}"

    mkdir -p data

    cd services/misinfo && npm run init-db && cd ../..
    cd services/portfolio && npm run init-db && cd ../..
    cd services/resilience && npm run init-db && cd ../..
    cd services/ai-safety && npm run init-db && cd ../..

    echo -e "${GREEN}✓ Databases initialized${NC}"
}

# Function to test API endpoint
test_api() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}

    run_test "$name" "curl -s -o /dev/null -w '%{http_code}' http://localhost$url | grep -q $expected_status"
}

# Function to test health endpoint
test_health() {
    local port=$1
    local service_name=$2

    run_test "$service_name health (port $port)" \
        "curl -s http://localhost:$port/health | grep -q '\"status\".*\"ok\"\\|\"healthy\"'"
}

# Main test suite
run_tests() {
    echo ""
    echo "==================================================="
    echo "  DevTools Dashboard - Integration Tests"
    echo "==================================================="
    echo ""

    # Test 1: Health Checks
    echo -e "${BLUE}[1/5] Testing Health Endpoints...${NC}"
    test_health 5000 "Main API"
    test_health 5001 "Misinfo Ingest API"
    test_health 5002 "Fact Check API"
    test_health 5003 "NLP Analysis API"
    test_health 5004 "Media Forensics API"
    test_health 5005 "Portfolio Indexer API"
    test_health 5006 "Portfolio API"
    test_health 5007 "Backup API"
    test_health 5008 "Ransomware API"
    test_health 5009 "Logs API"
    test_health 5010 "Compliance API"
    test_health 5011 "Prompt Monitor API"
    test_health 5012 "Red Team API"
    test_health 5013 "Robustness API"
    test_health 5014 "Tool Gate API"

    echo ""
    echo -e "${BLUE}[2/5] Testing Main API Endpoints...${NC}"
    test_api "Main API health" ":5000/api/health"

    echo ""
    echo -e "${BLUE}[3/5] Testing Misinformation Lab APIs...${NC}"
    run_test "Ingest API - POST /api/ingest/gdelt" \
        "curl -s -X POST http://localhost:5001/api/ingest/gdelt \
        -H 'Content-Type: application/json' \
        -d '{\"keyword\":\"test\",\"limit\":10}' | grep -q '\"'"

    run_test "Facts API - GET /api/factchecks" \
        "curl -s http://localhost:5002/api/factchecks | grep -q '\['"

    echo ""
    echo -e "${BLUE}[4/5] Testing E-Portfolio APIs...${NC}"
    run_test "Portfolio API - GET /api/modules" \
        "curl -s http://localhost:5006/api/modules | grep -q '\['"

    echo ""
    echo -e "${BLUE}[5/5] Testing Cyber Resilience APIs...${NC}"
    run_test "Backup API - GET /api/kpis" \
        "curl -s http://localhost:5007/api/kpis | grep -q '\"totalBackups\"'"

    run_test "Compliance API - GET /api/frameworks" \
        "curl -s http://localhost:5010/api/frameworks | grep -q '\['"

    echo ""
    echo "==================================================="
    echo -e "${BLUE}AI Safety APIs...${NC}"
    run_test "Prompt Monitor - POST /api/score" \
        "curl -s -X POST http://localhost:5011/api/score \
        -H 'Content-Type: application/json' \
        -d '{\"input\":\"test prompt\"}' | grep -q '\"score\"'"

    run_test "Red Team API - GET /api/recipes" \
        "curl -s http://localhost:5012/api/recipes | grep -q '\['"

    # Summary
    echo ""
    echo "==================================================="
    echo "  Test Results"
    echo "==================================================="
    echo -e "Total tests:  ${BLUE}$TESTS_RUN${NC}"
    echo -e "Passed:       ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed:       ${RED}$TESTS_FAILED${NC}"
    echo "==================================================="

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
        return 0
    else
        echo -e "${RED}✗ Some tests failed${NC}"
        return 1
    fi
}

# Command handling
case "${1:-run}" in
    init)
        init_databases
        ;;
    run)
        run_tests
        ;;
    *)
        echo "Usage: $0 {init|run}"
        echo "  init - Initialize test databases"
        echo "  run  - Run integration tests"
        exit 1
        ;;
esac
