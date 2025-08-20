-- 创建metrics物化视图

-- 确保metrics schema存在
CREATE SCHEMA IF NOT EXISTS metrics;

-- 日活跃用户
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics.daily_active_users AS
SELECT
  DATE_TRUNC('day', ts) AS day,
  COUNT(DISTINCT user_id) AS dau
FROM app.events
WHERE ts >= CURRENT_DATE - INTERVAL '180 days'  -- 扩大时间范围至180天，确保能查询到更多历史数据
GROUP BY DATE_TRUNC('day', ts)
ORDER BY day DESC;

-- 创建索引以提高查询性能
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_active_users_day ON metrics.daily_active_users(day);

-- 周活跃用户
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics.weekly_active_users AS
SELECT
  DATE_TRUNC('week', ts) AS week,
  COUNT(DISTINCT user_id) AS wau
FROM app.events
WHERE ts >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('week', ts)
ORDER BY week DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_active_users_week ON metrics.weekly_active_users(week);

-- 月活跃用户
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics.monthly_active_users AS
SELECT
  DATE_TRUNC('month', ts) AS month,
  COUNT(DISTINCT user_id) AS mau
FROM app.events
WHERE ts >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', ts)
ORDER BY month DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_active_users_month ON metrics.monthly_active_users(month);

-- 新增用户
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics.new_users AS
SELECT
  DATE_TRUNC('day', created_at) AS day,
  COUNT(*) AS new_user_count
FROM app.users
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_new_users_day ON metrics.new_users(day);

-- 内容类型CTR
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics.content_type_ctr AS
SELECT
  DATE_TRUNC('day', e.ts) AS day,
  i.kind,
  COUNT(DISTINCT CASE WHEN e.event_type = 'impression' THEN e.id END) AS impressions,
  COUNT(DISTINCT CASE WHEN e.event_type = 'click' THEN e.id END) AS clicks,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN e.event_type = 'impression' THEN e.id END) > 0 
    THEN ROUND(COUNT(DISTINCT CASE WHEN e.event_type = 'click' THEN e.id END)::NUMERIC / 
             COUNT(DISTINCT CASE WHEN e.event_type = 'impression' THEN e.id END), 4)
    ELSE 0
  END AS ctr
FROM app.events e
JOIN app.items i ON e.item_id = i.id
WHERE e.ts >= CURRENT_DATE - INTERVAL '30 days'
AND e.event_type IN ('impression', 'click')
GROUP BY DATE_TRUNC('day', e.ts), i.kind
ORDER BY day DESC, kind;

-- 创建索引以提高查询性能
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_type_ctr_day_kind ON metrics.content_type_ctr(day, kind);
CREATE INDEX IF NOT EXISTS idx_content_type_ctr_kind ON metrics.content_type_ctr(kind);

-- 用户停留时间
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics.user_staytime AS
SELECT
  DATE_TRUNC('day', ts) AS day,
  AVG(staytime_ms) AS avg_staytime_ms,
  MAX(staytime_ms) AS max_staytime_ms,
  MIN(staytime_ms) AS min_staytime_ms
FROM app.events
WHERE ts >= CURRENT_DATE - INTERVAL '30 days'
AND event_type = 'staytime'
AND staytime_ms > 0
GROUP BY DATE_TRUNC('day', ts)
ORDER BY day DESC;

-- 创建索引以提高查询性能
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_staytime_day ON metrics.user_staytime(day);

-- 用户互动率
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics.user_interaction_rate AS
SELECT
  DATE_TRUNC('day', e.ts) AS day,
  COUNT(DISTINCT CASE WHEN e.event_type = 'impression' THEN e.id END) AS impressions,
  COUNT(DISTINCT CASE WHEN e.event_type IN ('like', 'favorite') THEN e.id END) AS interactions,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN e.event_type = 'impression' THEN e.id END) > 0 
    THEN ROUND(COUNT(DISTINCT CASE WHEN e.event_type IN ('like', 'favorite') THEN e.id END)::NUMERIC / 
             COUNT(DISTINCT CASE WHEN e.event_type = 'impression' THEN e.id END), 4)
    ELSE 0
  END AS interaction_rate
FROM app.events e
WHERE e.ts >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', e.ts)
ORDER BY day DESC;

-- 创建索引以提高查询性能
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_interaction_rate_day ON metrics.user_interaction_rate(day);

-- 内容分布
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics.content_distribution AS
SELECT
  kind,
  COUNT(*) AS count,
  ROUND(COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM app.items), 4) AS percentage
FROM app.items
GROUP BY kind;

-- 创建索引以提高查询性能
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_distribution_kind ON metrics.content_distribution(kind);

-- 广告收入指标
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics.ad_revenue AS
SELECT
  DATE_TRUNC('day', e.ts) AS day,
  COUNT(DISTINCT CASE WHEN e.event_type = 'impression' AND i.kind = 'ad' THEN e.id END) AS ad_impressions,
  COUNT(DISTINCT CASE WHEN e.event_type = 'ad_click' AND i.kind = 'ad' THEN e.id END) AS ad_clicks,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN e.event_type = 'impression' AND i.kind = 'ad' THEN e.id END) > 0 
    THEN ROUND(COUNT(DISTINCT CASE WHEN e.event_type = 'ad_click' AND i.kind = 'ad' THEN e.id END)::NUMERIC / 
             COUNT(DISTINCT CASE WHEN e.event_type = 'impression' AND i.kind = 'ad' THEN e.id END), 4)
    ELSE 0
  END AS ad_ctr,
  SUM(CASE WHEN e.event_type = 'ad_click' AND i.kind = 'ad' THEN COALESCE((e.extra->>'cpc_amount')::NUMERIC, 0.5) ELSE 0 END) AS ad_revenue
FROM app.events e
JOIN app.items i ON e.item_id = i.id
WHERE e.ts >= CURRENT_DATE - INTERVAL '30 days'
AND e.event_type IN ('impression', 'ad_click')
AND i.kind = 'ad'
GROUP BY DATE_TRUNC('day', e.ts)
ORDER BY day DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_revenue_day ON metrics.ad_revenue(day);

-- 商品收入指标
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics.product_revenue AS
SELECT
  DATE_TRUNC('day', e.ts) AS day,
  COUNT(DISTINCT CASE WHEN e.event_type = 'impression' AND i.kind = 'product' THEN e.id END) AS product_impressions,
  COUNT(DISTINCT CASE WHEN e.event_type = 'click' AND i.kind = 'product' THEN e.id END) AS product_clicks,
  SUM(COALESCE(e.gmv_amount, 0)) AS gmv,
  COUNT(DISTINCT CASE WHEN e.event_type = 'click' AND i.kind = 'product' AND e.gmv_amount > 0 THEN e.id END) AS conversions,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN e.event_type = 'click' AND i.kind = 'product' THEN e.id END) > 0 
    THEN ROUND(COUNT(DISTINCT CASE WHEN e.event_type = 'click' AND i.kind = 'product' AND e.gmv_amount > 0 THEN e.id END)::NUMERIC / 
             COUNT(DISTINCT CASE WHEN e.event_type = 'click' AND i.kind = 'product' THEN e.id END), 4)
    ELSE 0
  END AS conversion_rate
FROM app.events e
JOIN app.items i ON e.item_id = i.id
WHERE e.ts >= CURRENT_DATE - INTERVAL '30 days'
AND i.kind = 'product'
GROUP BY DATE_TRUNC('day', e.ts)
ORDER BY day DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_revenue_day ON metrics.product_revenue(day);

-- 用户留存率
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics.user_retention AS
WITH first_activity AS (
  SELECT 
    user_id,
    MIN(DATE_TRUNC('day', ts)) AS first_day
  FROM app.events
  WHERE ts >= CURRENT_DATE - INTERVAL '60 days'
  GROUP BY user_id
),
user_activity AS (
  SELECT 
    user_id,
    DATE_TRUNC('day', ts) AS activity_day
  FROM app.events
  WHERE ts >= CURRENT_DATE - INTERVAL '60 days'
  GROUP BY user_id, DATE_TRUNC('day', ts)
)
SELECT
  fa.first_day AS cohort_day,
  EXTRACT(DAY FROM (ua.activity_day - fa.first_day)) AS days_since_first_activity,
  COUNT(DISTINCT fa.user_id) AS cohort_size,
  COUNT(DISTINCT ua.user_id) AS active_users,
  ROUND(COUNT(DISTINCT ua.user_id)::NUMERIC / COUNT(DISTINCT fa.user_id), 4) AS retention_rate
FROM first_activity fa
JOIN user_activity ua ON fa.user_id = ua.user_id
WHERE EXTRACT(DAY FROM (ua.activity_day - fa.first_day)) IN (1, 7, 30) -- 次日、7日、30日留存
GROUP BY fa.first_day, days_since_first_activity
ORDER BY fa.first_day DESC, days_since_first_activity;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_retention_cohort_day_days ON metrics.user_retention(cohort_day, days_since_first_activity);

-- 刷新物化视图的函数
CREATE OR REPLACE FUNCTION metrics.refresh_all_materialized_views()
RETURNS void AS $$
DECLARE
  mv_name text;
  mv_count int := 0;
  success_count int := 0;
  error_count int := 0;
BEGIN
  -- 动态刷新所有metrics schema下的物化视图
  FOR mv_name IN
    SELECT matviewname FROM pg_matviews WHERE schemaname = 'metrics'
  LOOP
    BEGIN
      EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.%I', mv_name);
      success_count := success_count + 1;
      RAISE NOTICE 'Successfully refreshed materialized view: metrics.%', mv_name;
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE WARNING 'Failed to refresh materialized view: metrics.%. Error: %', mv_name, SQLERRM;
    END;
    mv_count := mv_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Refresh summary: % total views, % successful, % failed', mv_count, success_count, error_count;
END;
$$ LANGUAGE plpgsql;