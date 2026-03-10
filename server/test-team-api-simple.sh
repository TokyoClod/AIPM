#!/bin/bash

BASE_URL="http://localhost:3001/api"

echo "=== Team API Manual Test ==="
echo ""

echo "1. Testing with existing user from database..."
echo "Checking database for users..."

echo ""
echo "2. Testing GET /api/team/status (without auth - should fail)..."
curl -s -X GET "$BASE_URL/team/status" | jq .
echo ""

echo "3. Testing GET /api/team/workload-summary (without auth - should fail)..."
curl -s -X GET "$BASE_URL/team/workload-summary" | jq .
echo ""

echo "4. Testing POST /api/team/messages (without auth - should fail)..."
curl -s -X POST "$BASE_URL/team/messages" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test message"}' | jq .
echo ""

echo "5. Testing GET /api/team/messages (without auth - should fail)..."
curl -s -X GET "$BASE_URL/team/messages" | jq .
echo ""

echo "=== Test Complete ==="
echo ""
echo "Note: All endpoints require authentication."
echo "To test with authentication, you need a valid JWT token."
echo ""
echo "You can get a token by:"
echo "1. Login with existing user credentials"
echo "2. Or register a new user"
echo ""
echo "Example with curl:"
echo "  curl -X POST http://localhost:3001/api/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"your-email\",\"password\":\"your-password\"}'"
