#!/bin/bash
# Cross-platform server launcher for macOS/Linux
cd "$(dirname "$0")"
echo "Starting Glacier Moon server..."
echo ""
echo "Opening http://localhost:8000 in your browser..."
echo "Press Ctrl+C to stop the server."
echo ""

# Try to open browser (works on macOS and most Linux distros)
if command -v open &> /dev/null; then
    open "http://localhost:8000"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:8000"
fi

# Start Python HTTP server
python3 -m http.server 8000 --bind 127.0.0.1
