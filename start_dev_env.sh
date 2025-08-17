#!/bin/bash

# Mini Feeds 开发环境启动脚本

echo "=== 启动 Mini Feeds 开发环境 ==="

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "项目根目录: $PROJECT_ROOT"

# 启动Docker容器（仅关键组件）
echo "\n1. 启动Docker容器（PostgreSQL、Redis、Adminer、SQLPad）..."
cd "$PROJECT_ROOT/app/infra"
docker-compose -f docker-compose.yml up -d

# 等待数据库准备就绪
echo "\n等待数据库准备就绪..."
sleep 5

# 启动后端服务（新终端）
echo "\n2. 启动后端服务..."
gnome-terminal --tab --title="Backend" --working-directory="$PROJECT_ROOT/app/backend" -- bash -c "chmod +x start_dev.sh && ./start_dev.sh; exec bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '"$PROJECT_ROOT/app/backend"' && chmod +x start_dev.sh && ./start_dev.sh"' 2>/dev/null || \
xterm -T "Backend" -e "cd '$PROJECT_ROOT/app/backend' && chmod +x start_dev.sh && ./start_dev.sh" 2>/dev/null || \
echo "无法自动打开新终端，请手动运行后端启动脚本：
cd $PROJECT_ROOT/app/backend && chmod +x start_dev.sh && ./start_dev.sh"

# 启动前端服务（新终端）
echo "\n3. 启动前端服务..."
gnome-terminal --tab --title="Frontend" --working-directory="$PROJECT_ROOT/app/frontend" -- bash -c "chmod +x start_dev.sh && ./start_dev.sh; exec bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '"$PROJECT_ROOT/app/frontend"' && chmod +x start_dev.sh && ./start_dev.sh"' 2>/dev/null || \
xterm -T "Frontend" -e "cd '$PROJECT_ROOT/app/frontend' && chmod +x start_dev.sh && ./start_dev.sh" 2>/dev/null || \
echo "无法自动打开新终端，请手动运行前端启动脚本：
cd $PROJECT_ROOT/app/frontend && chmod +x start_dev.sh && ./start_dev.sh"

echo "\n=== Mini Feeds 开发环境启动完成 ==="
echo "\n访问地址："
echo "- 前端: http://localhost:3000"
echo "- 后端API: http://localhost:8000/docs"
echo "- Adminer: http://localhost:8080 (服务器: postgres, 用户名: postgres, 密码: postgres, 数据库: mini_feeds)"
echo "- SQLPad: http://localhost:3010 (用户名: admin@example.com, 密码: admin)"