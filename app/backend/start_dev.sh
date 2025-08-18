#!/bin/bash

# Backend development environment startup script
# 设置Python命令
PYTHON_CMD="python3"
echo "Using $($PYTHON_CMD --version)"

# Create virtual environment (if not exists)
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mini_feeds"
export REDIS_URL="redis://localhost:6379/0"
export LOG_LEVEL="debug"
export ENVIRONMENT="development"

# Start backend service
echo "Starting backend service..."
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload