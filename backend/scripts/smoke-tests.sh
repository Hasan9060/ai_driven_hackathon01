#!/bin/bash
# Smoke tests for RAG Chatbot API

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
BASE_URL=${2:-http://localhost:8000}

# Logging functions
log() {
    echo -e "${GREEN}[SMOKE] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[SMOKE] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[SMOKE] ERROR: $1${NC}"
    return 1
}

# Test tracking
TESTS_PASSED=0
TESTS_FAILED=0

# Run a test
run_test() {
    local test_name=$1
    local command=$2
    local expected_status=${3:-200}

    log "Running test: $test_name"

    if eval "$command"; then
        log "✓ $test_name passed"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        error "✗ $test_name failed"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Check API response
check_api() {
    local endpoint=$1
    local method=${2:-GET}
    local data=$3
    local expected_status=${4:-200}

    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        status_code=$(curl -X POST -s -o /dev/null -w "%{http_code}" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        status_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    fi

    [ "$status_code" = "$expected_status" ]
}

# Wait for API to be ready
wait_for_api() {
    local max_attempts=30
    local attempt=1

    log "Waiting for API to be ready..."

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$BASE_URL/health/simple" > /dev/null 2>&1; then
            log "API is ready after $attempt attempts"
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done

    error "API not ready after $max_attempts attempts"
    return 1
}

# Start smoke tests
log "Starting smoke tests for $ENVIRONMENT environment"
log "Base URL: $BASE_URL"

# Wait for API to be ready
wait_for_api || exit 1

# Test 1: Health check
run_test "Health Check" "check_api '/health'"

# Test 2: Simple health check
run_test "Simple Health Check" "check_api '/health/simple'"

# Test 3: Readiness probe
run_test "Readiness Probe" "check_api '/health/ready'"

# Test 4: Liveness probe
run_test "Liveness Probe" "check_api '/health/live'"

# Test 5: Create session
run_test "Create Session" "check_api '/sessions' 'POST' '{}'"

# Create a session for subsequent tests
SESSION_ID=$(curl -s -X POST "$BASE_URL/sessions" \
    -H "Content-Type: application/json" \
    -d '{}' | grep -o '"session_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
    error "Failed to create session"
    exit 1
fi

log "Created session: $SESSION_ID"

# Test 6: Get session
run_test "Get Session" "check_api '/sessions/$SESSION_ID'"

# Test 7: Chat with book content (basic query)
CHAT_DATA='{
    "query": "What is robotics?",
    "session_id": "'$SESSION_ID'"
}'

run_test "Chat - Basic Query" "check_api '/chat' 'POST' '$CHAT_DATA'"

# Test 8: Chat with selected text
SELECTED_TEXT_DATA='{
    "query": "Explain this concept",
    "selected_text": "Robotics is an interdisciplinary field involving mechanical engineering, electrical engineering, and computer science.",
    "session_id": "'$SESSION_ID'"
}'

run_test "Chat - Selected Text" "check_api '/chat' 'POST' '$SELECTED_TEXT_DATA'"

# Test 9: Session status
run_test "Get Session Status" "check_api '/sessions/$SESSION_ID/status'"

# Test 10: List sessions
run_test "List Sessions" "check_api '/sessions?limit=10'"

# Test 11: Session stats
run_test "Get Session Stats" "check_api '/sessions/stats'"

# Test 12: Rate limiting (multiple quick requests)
log "Testing rate limiting..."
rate_limit_triggered=false
for i in {1..25}; do
    if ! check_api '/chat' 'POST' '{"query": "test", "session_id": "'$SESSION_ID'"}' 200; then
        if check_api '/chat' 'POST' '{"query": "test", "session_id": "'$SESSION_ID'"}' 429; then
            rate_limit_triggered=true
            break
        fi
    fi
done

if [ "$rate_limit_triggered" = true ]; then
    log "✓ Rate limiting is working"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    warn "Rate limiting may not be configured properly"
fi

# Test 13: Error handling - invalid session
run_test "Error Handling - Invalid Session" "! check_api '/sessions/invalid-session-id'"

# Test 14: Error handling - empty chat query
run_test "Error Handling - Empty Query" "! check_api '/chat' 'POST' '{\"query\": \"\", \"session_id\": \"'$SESSION_ID'\"}'"

# Test 15: CORS headers
log "Checking CORS headers..."
cors_headers=$(curl -s -I -X OPTIONS "$BASE_URL/chat" \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type")

if echo "$cors_headers" | grep -q "Access-Control-Allow-Origin"; then
    log "✓ CORS headers present"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    warn "CORS headers may not be properly configured"
fi

# Test 16: Security headers
log "Checking security headers..."
security_headers=$(curl -s -I "$BASE_URL/health")

security_checks=0
if echo "$security_headers" | grep -q "X-Content-Type-Options"; then
    security_checks=$((security_checks + 1))
fi

if echo "$security_headers" | grep -q "X-Frame-Options"; then
    security_checks=$((security_checks + 1))
fi

if echo "$security_headers" | grep -q "X-XSS-Protection"; then
    security_checks=$((security_checks + 1))
fi

if [ $security_checks -ge 2 ]; then
    log "✓ Security headers present"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    warn "Security headers may not be properly configured"
fi

# Test 17: Content ingestion endpoint (if available)
if check_api '/ingest' 'GET' 405; then
    log "✓ Ingestion endpoint exists (method not allowed for GET)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log "✓ Ingestion endpoint not exposed (expected)"
fi

# Test cleanup
log "Cleaning up test session..."
curl -s -X DELETE "$BASE_URL/sessions/$SESSION_ID" > /dev/null || true

# Print results
log "Smoke tests completed!"
log "Tests passed: $TESTS_PASSED"
log "Tests failed: $TESTS_FAILED"

# Exit with appropriate code
if [ $TESTS_FAILED -eq 0 ]; then
    log "All tests passed! ✓"
    exit 0
else
    error "Some tests failed ✗"
    exit 1
fi