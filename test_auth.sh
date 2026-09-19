#!/bin/bash
cd origin-server
echo "Starting server in background..."
node index.js &
SERVER_PID=$!
sleep 5

echo "Testing signup..."
SIGNUP_RES=$(curl -s -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpassword"}')
echo $SIGNUP_RES

echo "Testing login..."
LOGIN_RES=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpassword"}')
echo $LOGIN_RES

echo "Testing login with wrong password..."
BAD_LOGIN_RES=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"wrongpassword"}')
echo $BAD_LOGIN_RES

kill $SERVER_PID
echo "Done."
