-- 初始化数据库脚本

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- 注意：pgvector扩展需要在Postgres安装时添加，暂时注释掉
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- 创建Schema
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS rel;
CREATE SCHEMA IF NOT EXISTS feature;
CREATE SCHEMA IF NOT EXISTS search;
CREATE SCHEMA IF NOT EXISTS ads;
CREATE SCHEMA IF NOT EXISTS metrics;
CREATE SCHEMA IF NOT EXISTS ops;

-- 创建基础表结构

-- 用户表
CREATE TABLE IF NOT EXISTS app.users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    tags JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 内容表（视频/帖子/商品卡片）
CREATE TABLE IF NOT EXISTS app.items (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    tags JSONB DEFAULT '{}'::jsonb,
    author_id BIGINT REFERENCES app.users(id),
    media JSONB DEFAULT '{}'::jsonb,
    kind TEXT NOT NULL CHECK (kind IN ('content', 'ad', 'product')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 事件表（埋点数据）
CREATE TABLE IF NOT EXISTS app.events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES app.users(id),
    item_id BIGINT REFERENCES app.items(id),
    event_type TEXT NOT NULL,
    ts TIMESTAMPTZ DEFAULT NOW(),
    source TEXT,
    staytime_ms INTEGER DEFAULT 0,
    gmv_amount NUMERIC(12,2) DEFAULT 0,
    extra JSONB DEFAULT '{}'::jsonb
);

-- 用户-实体关系表
CREATE TABLE IF NOT EXISTS rel.user_entity_relations (
    user_id BIGINT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id BIGINT NOT NULL,
    relation_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    strength REAL DEFAULT 1.0,
    score REAL DEFAULT 0.0,
    last_interact_at TIMESTAMPTZ DEFAULT NOW(),
    expire_at TIMESTAMPTZ,
    attrs JSONB DEFAULT '{}'::jsonb,
    PRIMARY KEY (user_id, entity_type, entity_id, relation_type)
);

-- 向量表 (使用JSONB类型代替vector，因为bitnami/postgresql:15镜像没有pgvector扩展)
CREATE TABLE IF NOT EXISTS feature.item_embeddings (
    item_id BIGINT PRIMARY KEY REFERENCES app.items(id),
    emb JSONB DEFAULT '[]'::jsonb,  -- 使用JSONB存储向量数据
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 全文检索物化视图
CREATE MATERIALIZED VIEW IF NOT EXISTS search.item_ft AS
SELECT 
    id AS item_id,
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(tags::text, '{}')), 'C') AS tsv
FROM app.items;

-- 广告相关表

-- 广告主
CREATE TABLE IF NOT EXISTS ads.advertisers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 广告活动
CREATE TABLE IF NOT EXISTS ads.campaigns (
    id BIGSERIAL PRIMARY KEY,
    advertiser_id BIGINT REFERENCES ads.advertisers(id),
    name TEXT NOT NULL,
    bid_type TEXT NOT NULL DEFAULT 'CPC',
    bid_amount NUMERIC(12,2) NOT NULL,
    budget_daily NUMERIC(12,2) NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    target JSONB DEFAULT '{}'::jsonb,
    freq_cap_daily INTEGER DEFAULT 5,
    pacing_mode TEXT NOT NULL DEFAULT 'uniform',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 广告创意
CREATE TABLE IF NOT EXISTS ads.creatives (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT REFERENCES ads.campaigns(id),
    title TEXT NOT NULL,
    image_url TEXT,
    landing_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 广告位
CREATE TABLE IF NOT EXISTS ads.slots (
    id BIGSERIAL PRIMARY KEY,
    page TEXT NOT NULL,
    slot_code TEXT NOT NULL,
    floor_cpc NUMERIC(12,2) DEFAULT 0.01,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (page, slot_code)
);

-- 广告预算消耗
CREATE TABLE IF NOT EXISTS ads.daily_budget (
    campaign_id BIGINT REFERENCES ads.campaigns(id),
    day DATE NOT NULL,
    budget NUMERIC(12,2) NOT NULL,
    spend NUMERIC(12,2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    PRIMARY KEY (campaign_id, day)
);

-- 广告频控计数
CREATE TABLE IF NOT EXISTS ads.freq_cap_counter (
    user_id BIGINT NOT NULL,
    campaign_id BIGINT REFERENCES ads.campaigns(id),
    day DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, campaign_id, day)
);

-- SQL任务平台相关表

-- SQL任务表
CREATE TABLE IF NOT EXISTS ops.sql_tasks (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sql_text TEXT NOT NULL,
    default_params JSONB DEFAULT '{}'::jsonb,
    action TEXT NOT NULL CHECK (action IN ('to_redis', 'to_csv', 'refresh_mv', 'execute')),
    target TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SQL执行记录表
CREATE TABLE IF NOT EXISTS ops.sql_runs (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT REFERENCES ops.sql_tasks(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running',
    params JSONB DEFAULT '{}'::jsonb,
    affected_rows INTEGER,
    output_location TEXT,
    error TEXT,
    request_id TEXT,
    operator TEXT
);

-- 创建索引

-- 事件表索引
CREATE INDEX IF NOT EXISTS idx_events_user_id_ts ON app.events(user_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_item_id_ts ON app.events(item_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON app.events(event_type);

-- JSONB索引
CREATE INDEX IF NOT EXISTS idx_users_tags ON app.users USING GIN (tags jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_items_tags ON app.items USING GIN (tags jsonb_path_ops);

-- 全文检索索引
CREATE INDEX IF NOT EXISTS idx_item_ft_tsv ON search.item_ft USING GIN(tsv);

-- 向量索引
CREATE INDEX IF NOT EXISTS idx_item_embeddings_emb ON feature.item_embeddings USING ivfflat (emb vector_cosine_ops) WITH (lists = 100);

-- 初始化一些基础数据

-- 创建默认广告位
INSERT INTO ads.slots (page, slot_code, floor_cpc) VALUES
('feed', 'feed_main', 0.05),
('search', 'search_top', 0.08),
('search', 'search_bottom', 0.03),
('item', 'item_related', 0.04)
ON CONFLICT (page, slot_code) DO NOTHING;

-- 创建一些示例SQL任务
INSERT INTO ops.sql_tasks (name, description, sql_text, default_params, action, target, enabled) VALUES
('刷新全文检索视图', '刷新搜索物化视图', 'REFRESH MATERIALIZED VIEW CONCURRENTLY search.item_ft;', '{}', 'refresh_mv', 'search.item_ft', true),
('热门内容缓存', '缓存过去7天最热门的内容到Redis', 'SELECT json_agg(id) FROM (SELECT id FROM app.items WHERE kind = ''content'' ORDER BY (SELECT COUNT(*) FROM app.events WHERE item_id = app.items.id AND event_type = ''click'' AND ts > NOW() - INTERVAL ''7 days'') DESC LIMIT 50) AS hot_items;', '{}', 'to_redis', 'feed:hot:global', true),
('导出用户行为', '导出用户行为数据到CSV', 'SELECT user_id, item_id, event_type, ts, source, staytime_ms FROM app.events WHERE ts > (NOW() - INTERVAL ''{{days}}'' DAY) ORDER BY ts DESC;', '{"days": 7}', 'to_csv', 'user_events', true)
ON CONFLICT DO NOTHING;

-- 创建指标物化视图
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics.daily_ctr AS
SELECT
    DATE_TRUNC('day', e.ts) AS day,
    COUNT(CASE WHEN e.event_type = 'click' THEN 1 END)::FLOAT / NULLIF(COUNT(CASE WHEN e.event_type = 'impression' THEN 1 END), 0) AS ctr,
    COUNT(CASE WHEN e.event_type = 'impression' THEN 1 END) AS impressions,
    COUNT(CASE WHEN e.event_type = 'click' THEN 1 END) AS clicks
FROM app.events e
WHERE e.ts > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', e.ts)
ORDER BY day DESC;

CREATE MATERIALIZED VIEW IF NOT EXISTS metrics.ad_performance AS
SELECT
    DATE_TRUNC('day', e.ts) AS day,
    c.id AS campaign_id,
    c.name AS campaign_name,
    COUNT(CASE WHEN e.event_type = 'ad_impression' THEN 1 END) AS impressions,
    COUNT(CASE WHEN e.event_type = 'ad_click' THEN 1 END) AS clicks,
    SUM(CASE WHEN e.event_type = 'ad_click' THEN c.bid_amount ELSE 0 END) AS spend,
    CASE 
        WHEN COUNT(CASE WHEN e.event_type = 'ad_impression' THEN 1 END) > 0 
        THEN COUNT(CASE WHEN e.event_type = 'ad_click' THEN 1 END)::FLOAT / COUNT(CASE WHEN e.event_type = 'ad_impression' THEN 1 END) 
        ELSE 0 
    END AS ctr
FROM app.events e
JOIN app.items i ON e.item_id = i.id AND i.kind = 'ad'
JOIN ads.creatives cr ON (e.extra->>'creative_id')::BIGINT = cr.id
JOIN ads.campaigns c ON cr.campaign_id = c.id
WHERE e.ts > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', e.ts), c.id, c.name
ORDER BY day DESC, campaign_id;