#!/bin/bash

# Exit on error
set -e

# Store PIDs for cleanup
PIDS=()

# Function to kill processes on a specific port (cross-platform)
kill_port() {
    local port=$1
    
    # Try using powershell.exe if on Windows/WSL
    if command -v powershell.exe &> /dev/null; then
        powershell.exe -Command "\$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue; foreach (\$conn in \$connections) { Stop-Process -Id \$conn.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host 'Killed process on port $port' }" 2>/dev/null || true
    fi
    
    # Also try lsof for Linux/Mac
    if command -v lsof &> /dev/null; then
        local pids=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$pids" ]; then
            echo "🔪 Killing existing processes on port $port..."
            echo "$pids" | xargs kill -9 2>/dev/null || true
        fi
    fi
    
    sleep 0.5
}

# Cleanup function to kill all child processes
cleanup() {
    echo ''
    echo '🛑 Stopping services...'
    
    # Kill all processes in the process group
    if [ ${#PIDS[@]} -gt 0 ]; then
        for pid in "${PIDS[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                # Kill the process and all its children
                pkill -P "$pid" 2>/dev/null || true
                kill -9 "$pid" 2>/dev/null || true
            fi
        done
    fi
    
    # Kill any remaining node processes on ports 3000 and 5000
    kill_port 3000
    kill_port 5000
    
    echo '✅ All services stopped'
    exit 0
}

# Trap Ctrl+C and other termination signals
trap cleanup INT TERM

echo "🚀 Starting development environment..."

# Clean up any existing processes on ports 3000 and 5000
echo "🧹 Cleaning up ports 3000 and 5000..."
kill_port 3000
kill_port 5000

# Step 1: Build shared-types package
echo "📦 Building packages/shared-types..."
cd packages/shared-types
pnpm build
cd ../..

# Step 2: Start API service in background
echo "🔧 Starting API service..."
cd services/api
pnpm dev &
API_PID=$!
PIDS+=($API_PID)
cd ../..

# Step 3: Start web app
echo "🌐 Starting web app..."
cd apps/web
pnpm dev &
WEB_PID=$!
PIDS+=($WEB_PID)
cd ../..

echo "✅ Development environment started!"
echo "   API PID: $API_PID"
echo "   Web PID: $WEB_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all background processes
wait
