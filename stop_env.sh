#!/bin/bash

# Mini Feeds 环境停止脚本

echo "=== 停止 Mini Feeds 环境 ==="

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "项目根目录: $PROJECT_ROOT"

# 停止前端服务（如果在生产模式下运行）
if [ -f "$PROJECT_ROOT/app/frontend/frontend.pid" ]; then
    echo "\n1. 停止前端服务..."
    FRONTEND_PID=$(cat "$PROJECT_ROOT/app/frontend/frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null; then
        kill $FRONTEND_PID
        echo "前端服务已停止，PID: $FRONTEND_PID"
    else
        echo "前端服务未运行"
    fi
    rm -f "$PROJECT_ROOT/app/frontend/frontend.pid"
fi

# 停止后端服务（如果在生产模式下运行）
if [ -f "$PROJECT_ROOT/app/backend/backend.pid" ]; then
    echo "\n2. 停止后端服务..."
    BACKEND_PID=$(cat "$PROJECT_ROOT/app/backend/backend.pid")
    if ps -p $BACKEND_PID > /dev/null; then
        kill $BACKEND_PID
        echo "后端服务已停止，PID: $BACKEND_PID"
    else
        echo "后端服务未运行"
    fi
    rm -f "$PROJECT_ROOT/app/backend/backend.pid"
fi

# 停止Docker容器
echo "\n3. 停止Docker容器..."
cd "$PROJECT_ROOT/app/infra"

# 检查开发环境容器
if docker-compose -f docker-compose.dev.yml ps -q | grep -q .; then
    echo "停止开发环境容器..."
    docker-compose -f docker-compose.dev.yml down
fi

# 检查生产环境容器
if docker-compose -f docker-compose.prod.yml ps -q | grep -q .; then
    echo "停止生产环境容器..."
    docker-compose -f docker-compose.prod.yml down
fi

# 检查默认环境容器
if docker-compose ps -q | grep -q .; then
    echo "停止默认环境容器..."
    docker-compose down
fi

echo "\n=== Mini Feeds 环境已完全停止 ==="