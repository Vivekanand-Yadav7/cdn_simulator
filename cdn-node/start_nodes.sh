#!/bin/bash
echo "Starting Node 1 on Port 3001..."
PORT=3001 node src/server.js &
NODE1_PID=$!

echo "Starting Node 2 on Port 3002..."
PORT=3002 node src/server.js &
NODE2_PID=$!

echo "Starting Node 3 on Port 3003..."
PORT=3003 node src/server.js &
NODE3_PID=$!

echo "Nodes started with PIDs: $NODE1_PID, $NODE2_PID, $NODE3_PID"
echo "Press Ctrl+C to stop all nodes."

# Wait for all background processes to finish
wait $NODE1_PID $NODE2_PID $NODE3_PID
