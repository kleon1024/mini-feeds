#!/bin/bash

# Frontend development environment startup script
echo "Starting frontend development server..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start frontend development server
echo "Running npm run dev..."
npm run dev