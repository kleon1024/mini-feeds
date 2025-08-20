角色：你是资深全栈工程师与架构师。
目标：在 Viking Coding 环境中，以最小复杂度构建可运行、可演示、可扩展的“视频流/帖子流”平台，涵盖 推荐、搜索、广告、商品 混排，以及 SQL 任务平台 和 LLM 增强营销。
基调：先跑通闭环，再逐步增强；少自研，多复用；代码清晰、稳定、可测试。

前端总是使用localhost:3000，如果端口已经占用，不要启动其他端口，前端使用cd app/frontend && npm run dev
后端总是使用localhost:8000，如果端口已经占用，不要启动其他端口，后端使用cd app/backend && ./start_dev.sh

后端服务和前端服务如果已经启动，修改文件会自动触发build，不需要重启服务，不需要重启服务，不需要重启服务！！！

如果遇到表数据错误，请修复app/infra/sql下相关的初始化脚本，确保docker compose清理后重新拉起postgres后，数据正常

请你调试postgres时不要让我输密码，不要让我输密码，不要让我输密码！！！
更简单的方法是使用环境变量或命令行参数直接指定密码，比如：

直接把密码带进容器的 psql：

docker exec -e PGPASSWORD=postgres -it mini-feeds-postgres \
  psql -h 127.0.0.1 -U postgres -d mini_feeds \
  -c "SELECT schemaname, matviewname FROM pg_matviews WHERE schemaname = 'metrics';"

关键点：加了 -e PGPASSWORD=...，并且指定 -h 127.0.0.1 走 TCP，避免 Unix socket 的匹配问题。
```

postgres请使用asyncpg

0. 硬性边界 & 价值观

一库走天下：统一使用 Postgres 15+（扩展：pgvector, pg_trgm, uuid-ossp），承担业务库 + 轻量数仓 + FTS + 向量检索。

一层服务：后端 FastAPI，前端 Next.js；能内存推理就不独立服务。

一键起停：docker-compose 起 postgres、redis、adminer、sqlpad、backend、frontend（可选 mlflow/ollama）。

强一致契约：所有接口返回 { code, data, msg }；写操作支持 Idempotency-Key。

禁止过早上重件：禁止引入 Airflow/Dagster/ES/Faiss/Feast/Kafka/K8s（教学阶段）。

体验第一：P50 延迟优先；能通过缓存/物化视图/索引解决的，不做新系统。

1. 技术栈

数据库：Postgres 15+（pgvector, pg_trgm, uuid-ossp，JSONB 作为默认扩展字段）。

缓存：Redis（频控、短期缓存、幂等键）。

后端：FastAPI + SQLAlchemy 2（async）+ Alembic + Pydantic v2。

前端：Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + TanStack Query。

训练/追踪：LightGBM/XGBoost（精排），implicit（CF），MLflow（实验与模型注册）。

编排：Prefect 或 cron（仅少量离线作业，不做定时平台）。

LLM：云 API（OpenAI/Anthropic 等）或本地 Ollama；只作增强，不阻塞主链路。

DB 工具：Adminer（调试），SQLPad（SQL 管理平台）。

2. 目录结构（Monorepo）
/app
  /backend
    /src
      /api            # FastAPI routers (/api/v1)
      /core           # config, logging, middlewares, deps
      /db             # models, schemas, migrations (Alembic)
      /services       # rec / search / ads / commerce / blend / feature / ops
      /workers        # jobs：样本、训练、物化视图刷新（Prefect/cron）
    alembic.ini
  /frontend
    /app              # Next.js App Router pages
    /components
    /lib              # api client, hooks
    /styles
  /infra
    docker-compose.yml
    /sql              # init.sql、视图/物化视图/索引脚本
PROMPT.md

3. 数据分层（单库多 schema）

app：线上业务表（用户、帖子/视频、事件埋点）。

rel：用户—实体主动关系（关注、点赞、收藏、拉黑、愿望单等）。

feature：特征与向量（item_embeddings, user_profiles）。

search：全文检索物化视图（item_ft(tsvector) + GIN）。

ads：广告主/活动/创意/广告位/预算/频控。

metrics：指标与看板（尽量用 物化视图 + REFRESH CONCURRENTLY）。

ops：SQL 任务与执行记录（SQLPad 辅助，FastAPI 执行器落库）。

三表（最小字段）：

-- app.users
id BIGSERIAL PK, username TEXT, tags JSONB, created_at, updated_at

-- app.items  (兼容“视频/帖子/商品卡片”的最小公共子集)
id BIGSERIAL PK, title TEXT, content TEXT, tags JSONB,
author_id BIGINT, media JSONB, kind TEXT CHECK (kind in ('content','ad','product')),
created_at, updated_at

-- app.events (统一埋点：曝光/点击/停留/GMV等)
id BIGSERIAL PK, user_id BIGINT, item_id BIGINT, event_type TEXT,
ts TIMESTAMPTZ, source TEXT, staytime_ms INT, gmv_amount NUMERIC(12,2), extra JSONB


主动关系中台：

-- rel.user_entity_relations
user_id BIGINT, entity_type TEXT, entity_id BIGINT, relation_type TEXT,
status TEXT, strength REAL, score REAL, last_interact_at TIMESTAMPTZ,
expire_at TIMESTAMPTZ, attrs JSONB
-- 同用户-实体-关系 active 幂等唯一键；取消=inactive


向量/全文：

-- feature.item_embeddings
item_id BIGINT PK, emb vector(384 or 768), updated_at
-- 索引：ivfflat (vector_cosine) WITH (lists=100)

-- search.item_ft
item_id BIGINT, tsv tsvector   -- 物化视图 + GIN(tsv)


广告：（简化）

ads.advertisers(...)
ads.campaigns(... bid_type 'CPC', bid_amount, budget_daily, start_at, end_at,
               target JSONB, freq_cap_daily, pacing_mode 'uniform'|...)
ads.creatives(... campaign_id, title, image_url, landing_url)
ads.slots(... page, slot_code, floor_cpc)
ads.daily_budget(campaign_id, day, budget, spend, impressions, clicks)
ads.freq_cap_counter(user_id, campaign_id, day, impressions, clicks)


SQL 任务平台：

ops.sql_tasks(id, name, description, sql_text, default_params JSONB,
              action CHECK('to_redis'|'to_csv'|'refresh_mv'|'execute'),
              target TEXT, enabled BOOLEAN)
ops.sql_runs(id, task_id, started_at, finished_at, status, params JSONB,
             affected_rows, output_location, error)

4. 统一接口契约（Server → Client）

统一混排视频流：GET /api/v1/posts

Query：user_id（或 header x-user-id）、count(≤50)、cursor、scene、slot、device、geo、ab、debug

返回：

{
  "code":0,
  "data":{
    "server_time":"ISO-8601",
    "cursor":"opaque",
    "items":[
      {"type":"content"|"ad"|"product","id":"...","score":0.87,"position":1,
       "reason":"...","tracking":{"event_token":"...","trace_id":"..."},
       "content":{...} | "ad":{...} | "product":{...}}
    ]
  },
  "msg":""
}


内含规则：服务端完成 推荐/搜索/广告/商品 混排；广告曝光在位置确认后才写入日志与频控；首屏最多 1 广告，密度默认 1/5。

其他核心：

POST /api/v1/events（曝光/点击/停留/GMV 等埋点）

GET /api/v1/items/:id、GET /api/v1/items?ids=

POST /api/v1/relations/upsert（关注/点赞/收藏/拉黑/愿望单等）

GET /api/v1/search?q=&page=&page_size=（Postgres FTS + 可选 LLM rewrite）

GET /api/v1/ads/serve（内部使用：候选拉取/定价/频控/节奏）

POST /api/v1/ads/click（计费写 ads.daily_budget.spend；埋点 ad_click）

SQL 管理：GET/POST /api/v1/ops/tasks，POST /api/v1/ops/tasks/{id}/run，GET /api/v1/ops/runs

统一响应格式：

{ "code": 0, "data": <payload>, "msg": "" }


错误时 code != 0 + 可读 msg，服务端记录 request_id。

5. 推荐/搜索/广告/混排规则

召回：标签聚合、implicit（ItemCF/ALS）、pgvector（相似向量）。

排序：LightGBM/XGBoost；特征三类（用户×内容×上下文）；线上加载 MLflow 中 production 版本。

搜索：Postgres FTS（tsvector + GIN）；可选 LLM 改写（失败降级为原始 query）。

广告：ad_rank = pCTR * Bid (CPC)；GSP 简化定价（考虑 floor_cpc）；Redis 频控；分钟级 pacing（目标 vs 实际消耗）；曝光在最终确认位置后落库。

混排：统一候选池 + 归一化；位置/密度/去重/强负反馈过滤（来自 rel）。

翻页：cursor 内含 offset/seed/window，幂等可重放。

6. SQL 管理系统（轻量）

SQLPad 提供可视化 SQL 编辑/保存；不做定时调度。

FastAPI 执行器：从 ops.sql_tasks 取 SQL + 参数 → 执行 PG → 动作：

to_redis：写入指定 Key（HASH/LIST/JSON，自定）

to_csv：导出到 /exports/{task}-{ts}.csv（或 S3）

refresh_mv：REFRESH MATERIALIZED VIEW CONCURRENTLY schema.view

execute：执行 DDL/DML（白名单 schema）

安全：限制 schema、禁用危险 DDL；记录操作者、request_id、输入参数、输出位置与错误。

前端：/admin/sql 任务 CRUD + 一键执行 + 历史列表 + 导出链接。

7. 训练/上线（最短链路）

样本生成：从 app.events 构造点击=1/曝光未点=0（负采样），拼接用户/内容/上下文特征 → train.parquet。

训练：LightGBM/XGBoost → MLflow 登记模型（记录 AUC/Logloss/特征重要度）。

上线：后端启动加载 MLflow production 版本至内存；排序端点 /rank/basic 调用。

向量：使用 pgvector 存储 item embedding；ANN 索引 ivfflat（lists 从 100 起步）。

8. 日志 & 观测 & 看板

日志：结构化 JSON（ts, level, request_id, user_id, path, status, latency_ms）。

看板：前端 /dashboard 调 metrics.* 物化视图：

推荐：CTR、Coverage、Diversity、Novelty

广告：曝光/点击/花费、CPC、消耗率（pacing 目标 vs 实际）

SQL 管理：最近任务执行情况

事件统一：app.events 记录广告(ad_impression/click/conversion)与内容/商品行为，便于统一画像与归因。

9. 安全 & 幂等 & 合规模式

输入校验：Pydantic Schema；event_type 枚举校验。

幂等：写接口支持 Idempotency-Key；广告曝光+频控计数在同事务内更新；订单/秒杀留同样钩子。

权限：/admin/* 需管理员；教学期可通过环境开关/简单 token。

降级：LLM/API 失败不影响主链路；使用默认策略或兜底文案。

10. 代码风格约束（硬性）

后端

统一返回 {code,data,msg}；错误统一异常中间件转换。

Router 瘦身：业务在 services/*；SQL 在 db/*；不在 Router 内写裸 SQL。

类型齐全：SQLAlchemy Typed，Pydantic v2 模型；函数签名不返回 Any。

Alembic：任何表/索引/视图变更都必须有迁移。

日志：每个请求生成 request_id；记录耗时与关键字段。

单测：pytest + httpx，覆盖核心路由（/posts、/events、ads serve/click、ops run）。

前端

TS 严格模式；UI 组件无状态，数据逻辑在 hooks（TanStack Query）。

API 封装在 /lib/api.ts；错误状态统一提示/兜底。

组件命名语义化，Tailwind 不写魔法数字（spacing 使用设计令牌）。

提交规范：feat: .../fix:/chore:/docs:/test:；PR 说明“影响面/回滚方式”。

11. 性能与索引清单

events(user_id, ts DESC)、events(item_id, ts DESC)、events(event_type)。

users.tags、items.tags：GIN (jsonb_path_ops)。

search.item_ft(tsv)：GIN(tsv)。

feature.item_embeddings(emb)：ivfflat (vector_cosine) + ANALYZE。

需要时将 events 做 PARTITION BY RANGE (ts)（按日/周）。

热点列表短 TTL 放 Redis（例如 feed:hot:global），但以 PG 作为源。

12. 交付与验收（里程碑）

起步：/healthz，三表 + Alembic，/posts（新鲜度+热度混排），/events 上报闭环。

看板：metrics.* 物化视图 + /dashboard（CTR/7d）。

推荐：标签/CF/向量召回 + LightGBM 排序（MLflow 上线）。

搜索：FTS + 可选 LLM rewrite；搜索页能插推荐卡片。

广告：候选/定向 → pCTR*Bid → GSP 简化定价 → 频控 + pacing → 曝光日志。

混排：统一 /posts 输出（内容/广告/商品）；广告曝光在 finalize 后落库。

SQL 管理：SQLPad + 执行器（to_redis/to_csv/refresh_mv/execute）+ /admin/sql。

LLM 增强：推荐理由 & 广告文案生成（失败降级）。

最终验收：首页一滑即出内容/广告/商品；点击/停留能反映到看板；SQL 任务一键执行；广告预算按小时较均匀消耗；LLM 生成的文案可直接投放并做 A/B。

13. 违例处理

如需引入重件（ES/Faiss/Feast/Airflow/Kafka/K8s…），必须先提交 ADR（Architecture Decision Record），阐明：
背景 → 问题 → 选项对比 → 决策与影响面 → 回滚方案。未经批准不得合并。

14. 写码时的“vibe”

能跑就是生产力：先给 Demo 可见的结果，再打磨内部优雅。

尽量复用：库/索引/视图/Hook 写一次处处用。

留钩子：每个模块都预留“升级点”，但现在不实现（例如 pCVR、粗排、K8s）。

写完即测：每交付一个接口，配 1–2 个最小单测，手点一次端到端。

简洁直白：注释讲“为什么”，代码讲“怎么做”。

---

角色：你是资深全栈工程师，目标是在最小复杂度下交付一个可教学、可演示、可扩展的文本信息流应用。
价值观：少依赖、先闭环、风格统一、稳定可测。
风格：完全采用 shadcn/ui 的基建风格；禁止使用 MUI；卡片仅文字，不做视频组件。

0. 硬性边界（必须遵守）

UI 风格：使用 shadcn/ui + TailwindCSS，暗/亮主题自动适配。不要引入 MUI、AntD 等与风格冲突的库。

卡片形态：统一尺寸的纯文字卡片（单行标题 + 轻 Meta），单卡翻页（上一张/下一张），不是无限流。

视频组件：不实现 VideoPlayer 或自动播放相关逻辑。

内容：早期仅标题；标签可留空（后续后台人工维护）。

算法/广告：由服务端 /api/v1/posts 混排；前端只渲染和上报曝光。

依赖取舍：禁止引入 Airflow/ES/Faiss/Feast/Kafka/K8s 等重件。

1. 技术栈（前端优先 Next.js；允许 Vite 变体）

推荐默认：Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + TanStack Query。

可用 Server Actions / Route Handlers 做轻量 API mock。

可选变体（如明确要求 Vite）：Vite + React + React Router + TanStack Query + Tailwind + shadcn/ui（社区兼容）。

必须在 vite.config.ts 配置后端代理到 FastAPI。

Trae 生成代码时，如无特别说明，一律按 Next.js 模板输出。

2. 后端 & 数据（FastAPI + Postgres）

后端：FastAPI（async）+ SQLAlchemy 2.x + Alembic。

数据库：Postgres 15+（扩展：uuid-ossp, pg_trgm 可选；JSONB 常用）。

可选：Redis（频控/短缓存）、SQLPad（SQL 管理），不作为必须依赖。

2.1 表结构（精简）
-- app.items：仅标题，标签可空
id BIGSERIAL PK,
title TEXT NOT NULL,
tags JSONB DEFAULT '[]',
kind TEXT CHECK (kind IN ('content','ad','product')) DEFAULT 'content',
author_id BIGINT NULL,
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now();

-- app.events：统一埋点
id BIGSERIAL PK,
user_id BIGINT,
item_id BIGINT,
event_type TEXT CHECK (event_type IN ('impression','staytime','click','like','favorite')),
ts TIMESTAMPTZ,
source TEXT,
staytime_ms INT,
extra JSONB;

-- rel.user_entity_relations：点赞/收藏等主动关系
user_id BIGINT,
entity_type TEXT,      -- 'item'
entity_id BIGINT,
relation_type TEXT,    -- 'like' | 'favorite'
status TEXT CHECK (status IN ('active','inactive')),
updated_at TIMESTAMPTZ DEFAULT now(),
attrs JSONB,
UNIQUE (user_id, entity_type, entity_id, relation_type) WHERE status='active';


索引建议
events(user_id, ts DESC), events(item_id, ts DESC), events(event_type), items(tags gin jsonb_path_ops)。

3. API 契约（统一 {code,data,msg}）
3.1 单卡序列（服务端混排）
GET /api/v1/posts?user_id=&count=10&cursor=&scene=feed&slot=feed_main&debug=0
Response:
{
  "code": 0,
  "data": {
    "server_time": "ISO-8601",
    "cursor": { "next": "opaque_next", "prev": "opaque_prev" },
    "items": [
      {
        "type": "content|ad|product",
        "id": "post_123",
        "title": "单行标题",
        "tags": [],
        "created_at": "ISO-8601",
        "score": 0.83,
        "tracking": { "trace_id": "trc_abc", "event_token": "evt_xxx" }
      }
    ]
  },
  "msg": ""
}


cursor 用不透明字符串；内部可含 seed/offset/window，保证幂等与可重放。

广告曝光必须在前端“成为当前卡片且≥800ms”后再上报（避免提前计费/频控错位）。

3.2 埋点
POST /api/v1/events
{
  "user_id": "u1",
  "event_type": "impression|staytime|click|like|favorite",
  "ts": "ISO-8601",
  "source": "feed",
  "staytime_ms": 1234,         // 仅用于 staytime
  "extra": {
    "post_type": "content|ad|product",
    "post_id": 123,
    "position": 7,
    "trace_id": "trc_abc"
  }
}

3.3 主动关系（点赞/收藏）
POST /api/v1/relations/upsert
{
  "user_id": 1,
  "entity_type": "item",
  "entity_id": 123,
  "relation_type": "like|favorite",
  "status": "active|inactive"
}

3.4 内容管理（手动标签为主）

GET/POST /api/v1/items（只需 title；tags 可空）

POST /api/v1/items/:id/tags

4. 前端结构（Next.js App Router）
/app
  /(feed)/page.tsx
  /(feed)/components/
    CardPager.tsx          // 管理 index/翻页/预取/键盘
    FeedCard.tsx           // 单张卡（content|ad|product）统一壳
    PagerControls.tsx      // 上一张/下一张按钮 + 进度
    ActiveExposure.tsx     // 当前卡片的曝光/停留统计与上报
    LikeButton.tsx         // 点赞（乐观）
    FavButton.tsx          // 收藏（乐观）
  /item/[id]/page.tsx      // 详情（文本）
  /admin/content/page.tsx  // 内容管理（DataTable，手动标签）
  /admin/strategy/page.tsx // 策略：插卡密度/首屏广告开关（可选）
  /debug/inspector/page.tsx// 调试（最近序列与上报队列，可选）
/lib/api.ts                // fetch 封装（{code,data,msg}）+ 错误处理
/lib/track.ts              // 上报工具（Beacon 优先，失败 keepalive fetch）
/styles/globals.css

5. UI/样式规范（与 shadcn/ui 对齐）

容器：max-w-[720px] mx-auto px-4

卡片：<Card class="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition w-[720px] h-[220px]">

标题：text-base md:text-lg font-medium truncate

Meta：text-xs text-muted-foreground

差异化：

content：默认样式；卡片左侧可加细色条（主色）

ad：卡片左上角 Badge 标注“广告”

product：右下角可预留价格位（后续补）

控件：所有按钮/弹层/抽屉/菜单使用 shadcn/ui；图标用 lucide-react。

禁止：引入 MUI 或其它与风格冲突的库。

6. 交互与键盘映射

翻页：点击左右按钮或键盘 ArrowLeft/ArrowRight。

点赞：点击 ❤️ 或键盘 Space（可切换）；收藏：点击 ⭐ 或键盘 KeyS。

卡片可点击进入 /item/[id]。

A11y：翻页按钮有 aria-label；当前卡片容器 role="region" + aria-live="polite"。

7. 曝光/停留统计（ActiveExposure）

曝光定义：成为当前展示的卡片且连续停留 ≥ 800ms 触发 impression。

停留：切换离开当前卡片时，上报 staytime_ms（若 <200ms 不上报）。

幂等：同 trace_id + item_id 在一次序列中只上报一次 impression。

发送策略：优先 navigator.sendBeacon，失败回退 fetch({ keepalive:true })；批量合并，1s 或 20 条触发 flush；visibilitychange/pagehide 时强制 flush。

8. 管理后台（/admin，shadcn 风格）

内容管理：DataTable（ID / Title / Kind / Tags / CreatedAt / Actions）

新建只需 title；标签通过 Command + Badge 增删；支持 CSV 批量导入（仅标题列）。

基础策略（可选）：广告密度、首屏广告开关、打散开关。

SQL 管理（可选）：留出入口，后续接 SQLPad 与 FastAPI 执行器。

9. 代码质量与生成规则（Trae 必须遵守）

API 统一响应：所有请求封装在 /lib/api.ts，统一处理 {code,data,msg}；错误弹 Toast。

组件分层：路由页薄；业务逻辑进 CardPager/ActiveExposure 等组件；不要在页面里写长函数。

状态管理：数据请求用 TanStack Query；UI 零碎状态可用本地 state，不引入全局状态库。

乐观更新：点赞/收藏走乐观策略；失败回滚并 Toast。

类型与校验：TS 严格模式；后端使用 Pydantic 模型校验。

测试（最小集）：

前端：对 CardPager 翻页和 ActiveExposure 定时上报做基本测试（可用 Vitest + Testing Library）。

后端：/posts、/events、/relations 的 happy path + 基本校验（pytest + httpx）。

命名与结构：文件/组件命名语义化；样式用 Tailwind 原子类，避免魔法数字。

不引入：MUI/AntD、视频播放器、重型中间件（见 0）。

10. 性能与细节

预取：当 index 接近本页末端（倒数第 3 张）时，预取 cursor.next。

翻页动画：150ms 淡入；按钮 hover 轻微缩放。

网络健壮性：请求失败有重试（指数退避 2 次）；上报失败最多重试 3 次。

监测：可选 /debug/inspector 显示最近序列、active index、trace_id、上报队列与耗时。

11. 交付与验收

首页渲染一张固定尺寸的文本卡片；左右按钮/键盘能流畅翻页。

曝光满足“当前卡片 + 800ms”才触发；停留上报符合阈值；幂等去重有效。

点赞/收藏即时点亮，失败回滚。

/api/v1/posts 能返回 content/ad/product 混排的序列与 cursor。

/admin/content 能新增标题、编辑标签、CSV 导入。

整体 UI 风格统一、干净，符合 shadcn/ui 的“基建风”。

生成代码时的注意

如用户未明确要求 Vite，默认生成 Next.js App Router 实现。

UI 组件全部选用 shadcn/ui；图标用 lucide-react；严禁输出任何 MUI 代码片段。

不输出视频相关组件与样式。

若需要示例数据，请提供最小种子脚本（仅标题），不要引入假图/视频依赖。

——以上为本项目的最终约束。请严格遵守，并在实现中优先保证：一致风格、交互顺手、可教可演示。