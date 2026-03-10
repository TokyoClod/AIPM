#!/bin/bash

BASE_URL="http://localhost:3001/api"
TOKEN=""

echo "=== Team API Test Script ==="
echo ""

echo "1. Login to get token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}')

echo "$LOGIN_RESPONSE" | jq .

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Failed to get token. Trying to register..."
  REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"password123","name":"Admin User"}')
  echo "$REGISTER_RESPONSE" | jq .
  TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token')
fi

echo ""
echo "Token: $TOKEN"
echo ""

echo "2. Get team status..."
curl -s -X GET "$BASE_URL/team/status" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "3. Get team workload summary..."
curl -s -X GET "$BASE_URL/team/workload-summary" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "4. Get user workload (using first user ID)..."
USER_ID=$(curl -s -X GET "$BASE_URL/team/status" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].user.id')

if [ "$USER_ID" != "null" ] && [ -n "$USER_ID" ]; then
  echo "User ID: $USER_ID"
  curl -s -X GET "$BASE_URL/team/$USER_ID/workload" \
    -H "Authorization: Bearer $TOKEN" | jq .
else
  echo "No users found"
fi
echo ""

echo "5. Send a team message..."
curl -s -X POST "$BASE_URL/team/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello team! This is a test message.","message_type":"general"}' | jq .
echo ""

echo "6. Get team messages..."
curl -s -X GET "$BASE_URL/team/messages?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "=== Test Complete ==="
