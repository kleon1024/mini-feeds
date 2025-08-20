#!/bin/bash

# Mini Feeds 生产环境启动脚本

echo "=== 启动 Mini Feeds 生产环境 ==="

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "项目根目录: $PROJECT_ROOT"

# 启动Docker容器（所有组件）
echo "\n1. 启动Docker容器（PostgreSQL、Redis、Adminer、SQLPad）..."
cd "$PROJECT_ROOT/app/infra"

# 检查是否存在数据卷，如果存在则提示用户是否要清空
if docker volume ls | grep -q "infra_postgres_data"; then
    echo "检测到已存在的数据卷。PostgreSQL容器只在首次启动时执行初始化脚本。"
    echo "如果您修改了初始化脚本(如metrics_seed.sql)，建议清空数据卷以重新执行。"
    read -p "是否清空数据卷并重新初始化？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "正在清空数据卷..."
        docker-compose -f docker-compose.prod.yml down --volumes 2>/dev/null || true
        docker volume rm infra_postgres_data infra_redis_data infra_sqlpad_data 2>/dev/null || true
        echo "✓ 数据卷已清空，将重新执行初始化脚本"
    else
        echo "! 保留现有数据卷，初始化脚本可能不会重新执行"
    fi
fi

# 启动容器
docker-compose -f docker-compose.prod.yml up -d

# 等待数据库准备就绪
echo "\n等待数据库准备就绪..."
sleep 5

# 构建并启动后端服务
echo "\n2. 构建并启动后端服务..."
cd "$PROJECT_ROOT/app/backend"

# 确保使用Python 3.11
PYTHON_VERSION="3.11"
if command -v python$PYTHON_VERSION &> /dev/null; then
    PYTHON_CMD="python$PYTHON_VERSION"
elif command -v python3 &> /dev/null && [[ $(python3 --version) == *"$PYTHON_VERSION"* ]]; then
    PYTHON_CMD="python3"
else
    echo "错误: 需要Python $PYTHON_VERSION，但未找到。请安装Python $PYTHON_VERSION。"
    exit 1
fi

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    $PYTHON_CMD -m venv venv
fi

# 激活虚拟环境
echo "激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "安装依赖..."
pip install -r requirements.txt

# 设置生产环境变量
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mini_feeds"
export REDIS_URL="redis://localhost:6379/0"
export LOG_LEVEL="info"
export ENVIRONMENT="production"

# 后台启动后端服务
echo "后台启动后端服务..."
nohup uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4 > backend.log 2>&1 &
echo $! > backend.pid
echo "后端服务已启动，PID: $(cat backend.pid)"

# 构建并启动前端服务
echo "\n3. 构建并启动前端服务..."
cd "$PROJECT_ROOT/app/frontend"

# 检查nvm是否安装
if [ -z "$NVM_DIR" ]; then
    if [ -d "$HOME/.nvm" ]; then
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # 加载nvm
    else
        echo "错误: 未找到nvm。请安装nvm: https://github.com/nvm-sh/nvm#installing-and-updating"
        exit 1
    fi
fi

# 使用.nvmrc文件中指定的Node.js版本（如果存在）
if [ -f ".nvmrc" ]; then
    echo "使用.nvmrc中指定的Node.js版本"
    nvm use
else
    # 否则使用最新的LTS版本
    echo "使用最新的Node.js LTS版本"
    nvm use --lts
fi

# 安装依赖
echo "安装依赖..."
npm ci

# 构建前端
echo "构建前端..."
npm run build

# 设置生产环境变量
export NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
export NODE_ENV="production"

# 后台启动前端服务
echo "后台启动前端服务..."
nohup npm start > frontend.log 2>&1 &
echo $! > frontend.pid
echo "前端服务已启动，PID: $(cat frontend.pid)"

echo "\n=== Mini Feeds 生产环境启动完成 ==="
echo "\n访问地址："
echo "- 前端: http://localhost:3000"
echo "- 后端API: http://localhost:8000/docs/1-architecture/system-overview"
echo "- Adminer: http://localhost:8080 (服务器: postgres, 用户名: postgres, 密码: postgres, 数据库: mini_feeds)"
echo "- SQLPad: http://localhost:3010 (用户名: admin@example.com, 密码: admin)"