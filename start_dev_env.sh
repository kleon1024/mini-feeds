#!/bin/bash

# Mini Feeds 开发环境启动脚本

echo "=== Mini Feeds 开发环境启动脚本 ==="

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "项目根目录: $PROJECT_ROOT"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 已安装"
        return 0
    else
        echo -e "${RED}✗${NC} $1 未安装"
        return 1
    fi
}

# 检查Docker
check_docker() {
    if check_command "docker"; then
        if docker info &> /dev/null; then
            echo -e "${GREEN}✓${NC} Docker 服务正在运行"
            return 0
        else
            echo -e "${YELLOW}!${NC} Docker 已安装但服务未运行"
            echo -e "${BLUE}请启动 Docker Desktop 或运行: sudo systemctl start docker${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗${NC} Docker 未安装"
        echo -e "${BLUE}安装方法:${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  - macOS: 下载并安装 Docker Desktop for Mac"
            echo "    https://www.docker.com/products/docker-desktop/"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "  - Ubuntu/Debian: sudo apt-get update && sudo apt-get install docker.io"
            echo "  - CentOS/RHEL: sudo yum install docker"
            echo "  - 或访问: https://docs.docker.com/engine/install/"
        elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
            echo "  - Windows: 下载并安装 Docker Desktop for Windows"
            echo "    https://www.docker.com/products/docker-desktop/"
        fi
        return 1
    fi
}

# 检查Node.js和npm
check_nodejs() {
    local node_ok=true
    local npm_ok=true
    
    if check_command "node"; then
        local node_version=$(node --version | sed 's/v//')
        local major_version=$(echo $node_version | cut -d. -f1)
        if [ "$major_version" -ge 18 ]; then
            echo -e "${GREEN}✓${NC} Node.js 版本: $node_version (>= 18.0.0)"
        else
            echo -e "${YELLOW}!${NC} Node.js 版本: $node_version (建议 >= 18.0.0)"
        fi
    else
        node_ok=false
    fi
    
    if ! check_command "npm"; then
        npm_ok=false
    fi
    
    if [ "$node_ok" = false ] || [ "$npm_ok" = false ]; then
        echo -e "${BLUE}安装方法:${NC}"
        echo "  - 推荐使用 nvm 管理 Node.js 版本:"
        if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
            echo "    source ~/.bashrc (或 ~/.zshrc)"
            echo "    nvm install --lts"
            echo "    nvm use --lts"
        elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
            echo "    下载并安装 Node.js LTS 版本: https://nodejs.org/"
            echo "    或使用 nvm-windows: https://github.com/coreybutler/nvm-windows"
        fi
        echo "  - 直接安装: https://nodejs.org/ (选择 LTS 版本)"
        return 1
    fi
    return 0
}

# 检查Python
check_python() {
    local python_cmd=""
    local python_version=""
    
    if command -v python3 &> /dev/null; then
        python_cmd="python3"
        python_version=$(python3 --version | cut -d' ' -f2)
    elif command -v python &> /dev/null; then
        python_cmd="python"
        python_version=$(python --version | cut -d' ' -f2)
    fi
    
    if [ -n "$python_cmd" ]; then
        local major_version=$(echo $python_version | cut -d. -f1)
        local minor_version=$(echo $python_version | cut -d. -f2)
        if [ "$major_version" -eq 3 ] && [ "$minor_version" -ge 8 ]; then
            echo -e "${GREEN}✓${NC} Python 版本: $python_version (>= 3.8)"
            
            # 检查pip
            if command -v pip3 &> /dev/null || command -v pip &> /dev/null; then
                echo -e "${GREEN}✓${NC} pip 已安装"
            else
                echo -e "${YELLOW}!${NC} pip 未安装"
                echo -e "${BLUE}安装 pip: python -m ensurepip --upgrade${NC}"
            fi
            return 0
        else
            echo -e "${YELLOW}!${NC} Python 版本: $python_version (建议 >= 3.8)"
        fi
    else
        echo -e "${RED}✗${NC} Python 未安装"
    fi
    
    echo -e "${BLUE}安装方法:${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  - macOS: brew install python3"
        echo "  - 或下载: https://www.python.org/downloads/"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "  - Ubuntu/Debian: sudo apt-get install python3 python3-pip"
        echo "  - CentOS/RHEL: sudo yum install python3 python3-pip"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "  - Windows: 下载并安装 Python 3.8+: https://www.python.org/downloads/"
        echo "    (安装时勾选 'Add Python to PATH')"
    fi
    return 1
}

# 检查Git
check_git() {
    if check_command "git"; then
        return 0
    else
        echo -e "${BLUE}安装方法:${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  - macOS: brew install git 或安装 Xcode Command Line Tools"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "  - Ubuntu/Debian: sudo apt-get install git"
            echo "  - CentOS/RHEL: sudo yum install git"
        elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
            echo "  - Windows: 下载并安装 Git for Windows: https://git-scm.com/"
        fi
        return 1
    fi
}

# 主要环境检查
echo -e "\n${BLUE}=== 环境检查 ===${NC}"
echo "检查必要的开发工具..."

failed_checks=0

echo -e "\n${YELLOW}1. 检查 Docker...${NC}"
if ! check_docker; then
    ((failed_checks++))
fi

echo -e "\n${YELLOW}2. 检查 Node.js 和 npm...${NC}"
if ! check_nodejs; then
    ((failed_checks++))
fi

echo -e "\n${YELLOW}3. 检查 Python...${NC}"
if ! check_python; then
    ((failed_checks++))
fi

echo -e "\n${YELLOW}4. 检查 Git...${NC}"
if ! check_git; then
    ((failed_checks++))
fi

# 检查docker-compose
echo -e "\n${YELLOW}5. 检查 Docker Compose...${NC}"
if check_command "docker-compose" || docker compose version &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose 已安装"
else
    echo -e "${RED}✗${NC} Docker Compose 未安装"
    echo -e "${BLUE}Docker Compose 通常随 Docker Desktop 一起安装${NC}"
    echo -e "${BLUE}或单独安装: https://docs.docker.com/compose/install/${NC}"
    ((failed_checks++))
fi

# 检查结果
echo -e "\n${BLUE}=== 环境检查结果 ===${NC}"
if [ $failed_checks -eq 0 ]; then
    echo -e "${GREEN}✓ 所有必要工具都已安装，可以继续启动开发环境${NC}"
else
    echo -e "${RED}✗ 发现 $failed_checks 个问题，请先安装缺失的工具后再运行此脚本${NC}"
    echo -e "${YELLOW}提示: 安装完成后请重新打开终端或运行 'source ~/.bashrc' (或 ~/.zshrc)${NC}"
    exit 1
fi

# 启动Docker容器（仅关键组件）
echo -e "\n${BLUE}=== 启动开发环境 ===${NC}"
echo -e "\n${YELLOW}1. 启动Docker容器（PostgreSQL、Redis、Adminer、SQLPad）...${NC}"
cd "$PROJECT_ROOT/app/infra"

# 检查是否存在数据卷，如果存在则提示用户是否要清空
if docker volume ls | grep -q "infra_postgres_data"; then
    echo -e "${YELLOW}检测到已存在的数据卷。PostgreSQL容器只在首次启动时执行初始化脚本。${NC}"
    echo -e "${YELLOW}如果您修改了初始化脚本(如metrics_seed.sql)，建议清空数据卷以重新执行。${NC}"
    read -p "是否清空数据卷并重新初始化？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}正在清空数据卷...${NC}"
        docker-compose down --volumes 2>/dev/null || true
        docker volume rm infra_postgres_data infra_redis_data infra_sqlpad_data 2>/dev/null || true
        echo -e "${GREEN}✓${NC} 数据卷已清空，将重新执行初始化脚本"
    else
        echo -e "${YELLOW}!${NC} 保留现有数据卷，初始化脚本可能不会重新执行"
    fi
fi

# 启动容器
if docker-compose -f docker-compose.yml up -d; then
    echo -e "${GREEN}✓${NC} Docker 容器启动成功"
else
    echo -e "${RED}✗${NC} Docker 容器启动失败"
    exit 1
fi

# 等待数据库准备就绪
echo -e "\n${YELLOW}等待数据库准备就绪...${NC}"
sleep 5

# 启动后端服务（新终端）
echo -e "\n${YELLOW}2. 启动后端服务...${NC}"
if [ ! -f "$PROJECT_ROOT/app/backend/start_dev.sh" ]; then
    echo -e "${RED}✗${NC} 后端启动脚本不存在: $PROJECT_ROOT/app/backend/start_dev.sh"
    echo -e "${BLUE}请确保项目结构完整${NC}"
else
    chmod +x "$PROJECT_ROOT/app/backend/start_dev.sh"
    # 尝试在新终端中启动后端
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e 'tell app "Terminal" to do script "cd '"$PROJECT_ROOT/app/backend"' && ./start_dev.sh"' 2>/dev/null && \
        echo -e "${GREEN}✓${NC} 后端服务已在新终端中启动" || \
        echo -e "${YELLOW}!${NC} 无法自动打开新终端，请手动运行后端启动脚本：\n  ${BLUE}cd $PROJECT_ROOT/app/backend && ./start_dev.sh${NC}"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        gnome-terminal --tab --title="Backend" --working-directory="$PROJECT_ROOT/app/backend" -- bash -c "./start_dev.sh; exec bash" 2>/dev/null || \
        xterm -T "Backend" -e "cd '$PROJECT_ROOT/app/backend' && ./start_dev.sh" 2>/dev/null || \
        echo -e "${YELLOW}!${NC} 无法自动打开新终端，请手动运行后端启动脚本：\n  ${BLUE}cd $PROJECT_ROOT/app/backend && ./start_dev.sh${NC}"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓${NC} 后端服务已在新终端中启动"
        fi
    else
        # Windows 或其他系统
        echo -e "${YELLOW}!${NC} 请手动运行后端启动脚本：\n  ${BLUE}cd $PROJECT_ROOT/app/backend && ./start_dev.sh${NC}"
    fi
fi

# 启动前端服务（新终端）
echo -e "\n${YELLOW}3. 启动前端服务...${NC}"
if [ ! -f "$PROJECT_ROOT/app/frontend/start_dev.sh" ]; then
    echo -e "${RED}✗${NC} 前端启动脚本不存在: $PROJECT_ROOT/app/frontend/start_dev.sh"
    echo -e "${BLUE}请确保项目结构完整${NC}"
else
    chmod +x "$PROJECT_ROOT/app/frontend/start_dev.sh"
    # 尝试在新终端中启动前端
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e 'tell app "Terminal" to do script "cd '"$PROJECT_ROOT/app/frontend"' && ./start_dev.sh"' 2>/dev/null && \
        echo -e "${GREEN}✓${NC} 前端服务已在新终端中启动" || \
        echo -e "${YELLOW}!${NC} 无法自动打开新终端，请手动运行前端启动脚本：\n  ${BLUE}cd $PROJECT_ROOT/app/frontend && ./start_dev.sh${NC}"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        gnome-terminal --tab --title="Frontend" --working-directory="$PROJECT_ROOT/app/frontend" -- bash -c "./start_dev.sh; exec bash" 2>/dev/null || \
        xterm -T "Frontend" -e "cd '$PROJECT_ROOT/app/frontend' && ./start_dev.sh" 2>/dev/null || \
        echo -e "${YELLOW}!${NC} 无法自动打开新终端，请手动运行前端启动脚本：\n  ${BLUE}cd $PROJECT_ROOT/app/frontend && ./start_dev.sh${NC}"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓${NC} 前端服务已在新终端中启动"
        fi
    else
        # Windows 或其他系统
        echo -e "${YELLOW}!${NC} 请手动运行前端启动脚本：\n  ${BLUE}cd $PROJECT_ROOT/app/frontend && ./start_dev.sh${NC}"
    fi
fi

echo -e "\n${GREEN}=== Mini Feeds 开发环境启动完成 ===${NC}"
echo -e "\n${BLUE}访问地址：${NC}"
echo -e "${GREEN}- 前端:${NC} http://localhost:3000"
echo -e "${GREEN}- 后端API:${NC} http://localhost:8000/docs/1-architecture/system-overview"
echo -e "${GREEN}- Adminer:${NC} http://localhost:8080"
echo -e "  ${YELLOW}(服务器: postgres, 用户名: postgres, 密码: postgres, 数据库: mini_feeds)${NC}"
echo -e "${GREEN}- SQLPad:${NC} http://localhost:3010"
echo -e "  ${YELLOW}(用户名: admin@example.com, 密码: admin)${NC}"

echo -e "\n${BLUE}提示：${NC}"
echo -e "- 如果服务启动失败，请检查端口是否被占用"
echo -e "- 前端默认端口 3000，后端默认端口 8000"
echo -e "- 可以使用 ${YELLOW}./stop_env.sh${NC} 停止所有服务"
echo -e "- 查看日志请到对应的终端窗口"