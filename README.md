# Mini Feeds

视频流/帖子流平台，涵盖推荐、搜索、广告、商品混排，以及SQL任务平台和LLM增强营销。

## 项目架构

本项目采用Monorepo结构，包含以下组件：

- **后端**：FastAPI + SQLAlchemy 2 (async) + Alembic + Pydantic v2
- **前端**：Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + TanStack Query
- **数据库**：Postgres 15+ (pgvector, pg_trgm, uuid-ossp)
- **缓存**：Redis
- **工具**：Adminer (数据库管理), SQLPad (SQL管理平台)

## 目录结构

```
/app
  /backend            # FastAPI后端
    /src
      /api            # API路由
      /core           # 核心配置
      /db             # 数据库模型和迁移
      /services       # 业务逻辑
      /workers        # 后台任务
  /frontend           # Next.js前端
    /app              # 页面
    /components       # 组件
    /lib              # 工具库
    /styles           # 样式
  /infra              # 基础设施
    /sql              # SQL脚本
    docker-compose.yml # Docker配置
```

## 快速开始

### 前置条件

- Docker和Docker Compose
- Node.js 18+ (推荐使用nvm管理版本)
- Python 3.11+

### 启动步骤

1. 克隆仓库

```bash
git clone <repository-url>
cd mini-feeds
```

2. 使用脚本启动环境

#### 开发模式

开发模式下，只启动关键的基础设施组件（PostgreSQL、Redis、Adminer、SQLPad），前后端服务通过单独的脚本在本地启动，便于开发调试。

```bash
# 一键启动开发环境（包括基础设施、后端和前端）
./start_dev_env.sh
```

或者分步启动：

```bash
# 1. 启动基础设施
cd app/infra
docker-compose -f docker-compose.dev.yml up -d

# 2. 启动后端服务（使用Python 3.11虚拟环境）
cd ../backend
./start_dev.sh

# 3. 启动前端服务（使用nvm管理Node.js版本）
cd ../frontend
./start_dev.sh
```

#### 生产模式

生产模式下，所有基础设施组件都通过Docker Compose启动，前后端服务通过优化的方式在后台运行。

```bash
# 一键启动生产环境
./start_prod_env.sh
```

#### 停止环境

```bash
# 停止所有服务（包括Docker容器和前后端服务）
./stop_env.sh
```

3. 访问应用

- 前端: http://localhost:3000
- API文档: http://localhost:8000/docs
- Adminer: http://localhost:8080 (服务器: postgres, 用户名: postgres, 密码: postgres, 数据库: mini_feeds)
- SQLPad: http://localhost:3010 (用户名: admin@example.com, 密码: admin)

## 核心功能

### 1. 帖子流

- 统一混排视频流：GET /api/v1/posts
- 支持内容/广告/商品混排
- 前端单卡翻页模式

### 2. 事件上报

- 统一埋点：POST /api/v1/events
- 支持曝光/点击/停留/GMV等事件类型

### 3. 搜索

- 全文检索：GET /api/v1/search
- 基于Postgres FTS实现

### 4. 广告

- 广告候选：GET /api/v1/ads/serve
- 广告点击：POST /api/v1/ads/click

### 5. SQL任务平台

- 任务管理：GET/POST /api/v1/ops/tasks
- 任务执行：POST /api/v1/ops/tasks/{id}/run
- 执行记录：GET /api/v1/ops/runs

## 数据模型

系统包含以下主要数据模型：

- **用户 (app.users)**：用户信息
- **内容 (app.items)**：视频/帖子/商品/广告
- **事件 (app.events)**：用户行为事件
- **关系 (rel.user_entity_relations)**：用户与实体的关系
- **广告 (ads.*)**: 广告主/活动/创意/位置/预算
- **SQL任务 (ops.*)**: SQL任务和执行记录

## 开发指南

### 后端开发

1. 安装依赖

```bash
cd app/backend
pip install -r requirements.txt
```

2. 运行开发服务器

```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端开发

1. 安装依赖

```bash
cd app/frontend
npm install
```

2. 运行开发服务器

```bash
npm run dev
```

## 部署

系统提供了两种部署模式：开发模式和生产模式。

### 开发模式

开发模式适合本地开发和调试，只启动基础设施组件，前后端服务在本地运行。

```bash
# 启动开发环境
./start_dev_env.sh
```

### 生产模式

生产模式适合小规模生产环境部署，所有组件都进行了优化配置。

```bash
# 启动生产环境
./start_prod_env.sh
```

### 环境管理

```bash
# 停止所有环境
./stop_env.sh
```

## 后续开发计划

- 实现推荐算法（标签/CF/向量召回 + LightGBM排序）
- 完善搜索功能（支持LLM改写）
- 增强广告系统（定向/频控/pacing）
- 实现LLM增强（推荐理由/广告文案生成）

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

[MIT](LICENSE)