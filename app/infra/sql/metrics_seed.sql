-- 生成metrics测试数据

-- 确保有足够的用户数据
INSERT INTO app.users (username, tags)
SELECT
  'user_' || i,
  jsonb_build_object(
    'interests', CASE
      WHEN (random() * 3 + 1)::int = 1 THEN 'tech'
      WHEN (random() * 3 + 1)::int = 2 THEN 'sports'
      WHEN (random() * 3 + 1)::int = 3 THEN 'news'
      ELSE 'entertainment'
    END,
    'age_group', CASE
      WHEN (random() * 3 + 1)::int = 1 THEN '18-24'
      WHEN (random() * 3 + 1)::int = 2 THEN '25-34'
      WHEN (random() * 3 + 1)::int = 3 THEN '35-44'
      ELSE '45+'
    END
  )
FROM generate_series(1, 500) i  -- 增加用户数量到500
ON CONFLICT DO NOTHING;

-- 确保有足够的内容数据
INSERT INTO app.items (title, content, tags, author_id, media, kind)
SELECT
  'Item Title ' || i,
  'Content for item ' || i,
  jsonb_build_object(
    'category', ARRAY['tech', 'sports', 'news', 'entertainment'][(random() * 3 + 1)::int],
    'tags', ARRAY['trending', 'popular', 'new', 'recommended'][(random() * 3 + 1)::int]
  ),
  (random() * 499 + 1)::int,  -- 扩大作者ID范围
  jsonb_build_object(
    'thumbnail', 'https://example.com/thumbnail_' || i || '.jpg'
  ),
  CASE
    WHEN i % 10 = 0 THEN 'ad'
    WHEN i % 5 = 0 THEN 'product'
    ELSE 'content'
  END
FROM generate_series(1, 1000) i  -- 增加内容数量到1000
ON CONFLICT DO NOTHING;

-- 生成过去180天的事件数据（扩展时间范围以支持周活跃和月活跃指标）
-- 首先生成基础事件数据，模拟波动增长趋势

-- 生成180-120天前的基础数据（较少，起始阶段）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 499 + 1)::int,  -- 扩大用户ID范围
  (random() * 999 + 1)::int,  -- 扩大内容ID范围
  CASE
    WHEN random() < 0.95 THEN 'impression'  -- 进一步增加impression比例到95%
    WHEN random() < 0.98 THEN 'click'
    WHEN random() < 0.99 THEN 'staytime'
    WHEN random() < 0.995 THEN 'like'
    ELSE 'favorite'
  END,
  NOW() - (random() * 60 + 120)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  (ARRAY['feed', 'search', 'recommendation'])[(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  CASE
    -- 为商品点击添加GMV金额
    WHEN random() < 0.3 AND (SELECT kind FROM app.items WHERE id = ((random() * 999 + 1)::int)) = 'product' THEN (random() * 500 + 100)::numeric(12,2)
    ELSE NULL
  END,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int,
    -- 为广告点击添加CPC金额
    'cpc_amount', CASE 
      WHEN (SELECT kind FROM app.items WHERE id = ((random() * 999 + 1)::int)) = 'ad' THEN (random() * 1.5 + 0.1)::numeric(12,2)::text
      ELSE NULL
    END
  )
FROM generate_series(1, 100000) i  -- 起始阶段数据量增加到10万
ON CONFLICT DO NOTHING;

-- 生成120-60天前的基础数据（中等增长阶段）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 499 + 1)::int,  -- 扩大用户ID范围
  (random() * 999 + 1)::int,  -- 扩大内容ID范围
  CASE
    WHEN random() < 0.96 THEN 'impression'  -- 进一步增加impression比例到96%，体现增长趋势
    WHEN random() < 0.985 THEN 'click'
    WHEN random() < 0.995 THEN 'staytime'
    WHEN random() < 0.998 THEN 'like'
    ELSE 'favorite'
  END,
  NOW() - (random() * 60 + 60)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  CASE
    -- 为商品点击添加GMV金额
    WHEN random() < 0.4 AND (SELECT kind FROM app.items WHERE id = ((random() * 999 + 1)::int)) = 'product' THEN (random() * 700 + 200)::numeric(12,2)
    ELSE NULL
  END,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int,
    -- 为广告点击添加CPC金额
    'cpc_amount', CASE 
      WHEN (SELECT kind FROM app.items WHERE id = ((random() * 999 + 1)::int)) = 'ad' THEN (random() * 1.8 + 0.2)::numeric(12,2)::text
      ELSE NULL
    END
  )
FROM generate_series(1, 200000) i  -- 大幅增加数据量到20万，体现明显增长
ON CONFLICT DO NOTHING;

-- 生成60-0天前的基础数据（快速增长阶段）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 499 + 1)::int,  -- 扩大用户ID范围
  (random() * 999 + 1)::int,  -- 扩大内容ID范围
  CASE
    WHEN random() < 0.97 THEN 'impression'  -- 进一步增加impression比例到97%，体现更快增长趋势
    WHEN random() < 0.99 THEN 'click'
    WHEN random() < 0.995 THEN 'staytime'
    WHEN random() < 0.998 THEN 'like'
    ELSE 'favorite'
  END,
  NOW() - (random() * 60)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  CASE
    -- 为商品点击添加GMV金额
    WHEN random() < 0.5 AND (SELECT kind FROM app.items WHERE id = ((random() * 999 + 1)::int)) = 'product' THEN (random() * 1000 + 300)::numeric(12,2)
    ELSE NULL
  END,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int,
    -- 为广告点击添加CPC金额
    'cpc_amount', CASE 
      WHEN (SELECT kind FROM app.items WHERE id = ((random() * 999 + 1)::int)) = 'ad' THEN (random() * 2 + 0.3)::numeric(12,2)::text
      ELSE NULL
    END
  )
FROM generate_series(1, 500000) i  -- 大幅增加数据量到50万，体现爆发式增长
ON CONFLICT DO NOTHING;

-- 为不同时间段生成广告相关事件数据，模拟波动增长趋势

-- 为180-120天前生成广告相关事件数据（较少数据，较低点击率）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 99 + 1)::int,
  i.id,
  CASE
    WHEN random() < 0.95 THEN 'impression'  -- 5%的点击率
    ELSE 'ad_click'
  END,
  NOW() - (random() * 60 + 120)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  NULL,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int,
    'cpc_amount', CASE
      WHEN random() >= 0.85 THEN (random() * 1.5 + 0.1)::numeric(12,2)::text  -- 较低CPC
      ELSE NULL
    END
  )
FROM app.items i
WHERE i.kind = 'ad'
CROSS JOIN generate_series(1, 1000) s  -- 增加数据量
ON CONFLICT DO NOTHING;

-- 为120-60天前生成广告相关事件数据（中等数据，中等点击率）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 99 + 1)::int,
  i.id,
  CASE
    WHEN random() < 0.92 THEN 'impression'  -- 8%的点击率
    ELSE 'ad_click'
  END,
  NOW() - (random() * 60 + 60)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  NULL,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int,
    'cpc_amount', CASE
      WHEN random() >= 0.8 THEN (random() * 1.8 + 0.2)::numeric(12,2)::text  -- 中等CPC
      ELSE NULL
    END
  )
FROM app.items i
WHERE i.kind = 'ad'
CROSS JOIN generate_series(1, 3000) s  -- 增加impression数据量
ON CONFLICT DO NOTHING;

-- 为60-0天前生成广告相关事件数据（较多数据，较高点击率）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 99 + 1)::int,
  i.id,
  CASE
    WHEN random() < 0.9 THEN 'impression'  -- 10%的点击率
    ELSE 'ad_click'
  END,
  NOW() - (random() * 60)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  NULL,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int,
    'cpc_amount', CASE
      WHEN random() >= 0.75 THEN (random() * 2 + 0.3)::numeric(12,2)::text  -- 较高CPC
      ELSE NULL
    END
  )
FROM app.items i
WHERE i.kind = 'ad'
CROSS JOIN generate_series(1, 2000) s  -- 增加数据量
ON CONFLICT DO NOTHING;

-- 特别为昨天生成广告相关事件数据，确保ad_revenue物化视图有足够数据
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 99 + 1)::int,
  i.id,
  CASE
    WHEN random() < 0.9 THEN 'impression'
    ELSE 'ad_click'  -- 使用'ad_click'事件类型
  END,
  CURRENT_DATE - INTERVAL '1 day' + (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  NULL,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int,
    'cpc_amount', CASE
      WHEN random() >= 0.7 THEN (random() * 2 + 0.5)::numeric(12,2)::text  -- 增加CPC金额
      ELSE NULL
    END
  )
FROM app.items i
WHERE i.kind = 'ad'
CROSS JOIN generate_series(1, 500) s  -- 增加数据量
ON CONFLICT DO NOTHING;

-- 为不同时间段生成商品相关事件数据，模拟波动增长趋势

-- 为180-120天前生成商品相关事件数据（较少数据，较低转化率）
-- 先生成impression事件
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 99 + 1)::int,
  i.id,
  'impression',
  NOW() - (random() * 60 + 120)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  0,  -- impression事件的GMV金额为0
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int
  )
FROM app.items i
  WHERE i.kind = 'product'
CROSS JOIN generate_series(1, 1000) s  -- 增加impression数据量
ON CONFLICT DO NOTHING;

-- 再生成click事件，确保部分有GMV金额（较低转化率）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 99 + 1)::int,
  i.id,
  'click',
  NOW() - (random() * 60 + 120)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  CASE
    WHEN random() < 0.4 THEN (random() * 300 + 100)::numeric(12,2)  -- 只有40%的点击有GMV
    ELSE 0
  END,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int
  )
FROM app.items i
WHERE i.kind = 'product'
CROSS JOIN generate_series(1, 50) s  -- 适当增加click数据量
ON CONFLICT DO NOTHING;

-- 为120-60天前生成商品相关事件数据（中等数据，中等转化率）
-- 先生成impression事件
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 99 + 1)::int,
  i.id,
  'impression',
  NOW() - (random() * 60 + 60)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  0,  -- impression事件的GMV金额为0
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int
  )
FROM app.items i
WHERE i.kind = 'product'
CROSS JOIN generate_series(1, 2000) s  -- 增加impression数据量
ON CONFLICT DO NOTHING;

-- 再生成click事件，确保部分有GMV金额（中等转化率）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 99 + 1)::int,
  i.id,
  'click',
  NOW() - (random() * 60 + 60)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  CASE
    WHEN random() < 0.6 THEN (random() * 500 + 200)::numeric(12,2)  -- 60%的点击有GMV
    ELSE 0
  END,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int
  )
FROM app.items i
WHERE i.kind = 'product'
CROSS JOIN generate_series(1, 150) s  -- 适当增加click数据量
ON CONFLICT DO NOTHING;

-- 为60-0天前生成商品相关事件数据（较多数据，较高转化率）
-- 先生成impression事件
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 99 + 1)::int,
  i.id,
  'impression',
  NOW() - (random() * 60)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  0,  -- impression事件的GMV金额为0
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int
  )
FROM app.items i
WHERE i.kind = 'product'
CROSS JOIN generate_series(1, 500) s
ON CONFLICT DO NOTHING;

-- 再生成click事件，确保部分有GMV金额（较高转化率）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 99 + 1)::int,
  i.id,
  'click',
  NOW() - (random() * 60)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  CASE
    WHEN random() < 0.8 THEN (random() * 800 + 300)::numeric(12,2)  -- 80%的点击有GMV
    ELSE 0
  END,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int
  )
FROM app.items i
WHERE i.kind = 'product'
CROSS JOIN generate_series(1, 300) s  -- 适当增加click数据量
ON CONFLICT DO NOTHING;

-- 特别为昨天生成商品相关事件数据，确保product_revenue物化视图有足够数据
-- 先生成impression事件
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 99 + 1)::int,
  i.id,
  'impression',
  CURRENT_DATE - INTERVAL '1 day' + (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  0,  -- impression事件的GMV金额为0
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int
  )
FROM app.items i
WHERE i.kind = 'product'
CROSS JOIN generate_series(1, 1000) s  -- 大幅增加impression事件数量
ON CONFLICT DO NOTHING;

-- 再生成click事件，确保有GMV金额
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 99 + 1)::int,
  i.id,
  'click',
  CURRENT_DATE - INTERVAL '1 day' + (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  CASE
    WHEN random() < 0.7 THEN (random() * 1000 + 300)::numeric(12,2)  -- 70%的点击有GMV
    ELSE 0
  END,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int
  )
FROM app.items i
WHERE i.kind = 'product'
CROSS JOIN generate_series(1, 50) s  -- 适当增加click事件数量
ON CONFLICT DO NOTHING;

-- 为不同时间段生成DAU数据，模拟波动增长趋势

-- 特别为90天范围内的每一天生成DAU数据，确保90天范围的DAU查询能够返回完整的数据，并体现明显的波动增长趋势
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  u.id,
  (random() * 999 + 1)::int,  -- 扩大内容ID范围
  CASE
    -- 随着时间推移，impression比例逐渐增加，体现增长趋势
    WHEN random() < (0.92 + (90 - d) * 0.0006) THEN 'impression'  -- 从92%增长到约97.4%
    WHEN random() < (0.98 + (90 - d) * 0.0002) THEN 'click'  -- 从98%增长到约99.8%
    ELSE 'staytime'
  END,
  CURRENT_DATE - (d || ' days')::interval + (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  NULL,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int
  )
FROM app.users u
CROSS JOIN generate_series(1, 90) d  -- 生成90天的数据
-- 用户数量随时间呈现波动增长趋势，添加一些随机波动
WHERE u.id <= 100 + (90 - d) * 3 + (CASE WHEN d % 7 = 0 THEN 20 ELSE 0 END) + (CASE WHEN d % 30 = 0 THEN 50 ELSE 0 END)  
-- 每个用户的记录数也随时间呈现波动增长趋势，添加一些随机波动
CROSS JOIN generate_series(1, 10 + (90 - d) / 3 + (CASE WHEN d % 7 = 0 THEN 5 ELSE 0 END) + (CASE WHEN d % 30 = 0 THEN 10 ELSE 0 END)) s
ON CONFLICT DO NOTHING;

-- 为180-120天前生成DAU数据（起始阶段）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  u.id,
  (random() * 999 + 1)::int,  -- 扩大内容ID范围
  CASE
    WHEN random() < 0.93 THEN 'impression'  -- 起始阶段impression比例
    WHEN random() < 0.97 THEN 'click'
    ELSE 'staytime'
  END,
  NOW() - (random() * 60 + 120)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  NULL,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int
  )
FROM app.users u
WHERE u.id <= 200  -- 大幅增加起始阶段用户数量
CROSS JOIN generate_series(1, 25) s  -- 大幅增加每个用户的记录数
ON CONFLICT DO NOTHING;

-- 为120-60天前生成DAU数据（中等增长阶段）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  u.id,
  (random() * 999 + 1)::int,  -- 扩大内容ID范围
  CASE
    WHEN random() < 0.95 THEN 'impression'  -- 中等阶段impression比例提高
    WHEN random() < 0.98 THEN 'click'
    ELSE 'staytime'
  END,
  NOW() - (random() * 60 + 60)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  NULL,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int
  )
FROM app.users u
WHERE u.id <= 300  -- 中等阶段用户数量大幅增加
CROSS JOIN generate_series(1, 30) s  -- 中等阶段每个用户的记录数大幅增加
ON CONFLICT DO NOTHING;

-- 为60-0天前生成DAU数据（快速增长阶段）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  u.id,
  (random() * 999 + 1)::int,  -- 扩大内容ID范围
  CASE
    WHEN random() < 0.97 THEN 'impression'  -- 快速增长阶段impression比例进一步提高
    WHEN random() < 0.99 THEN 'click'
    ELSE 'staytime'
  END,
  NOW() - (random() * 60)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  NULL,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int
  )
FROM app.users u
WHERE u.id <= 400  -- 快速增长阶段用户数量大幅增加
CROSS JOIN generate_series(1, 35) s  -- 快速增长阶段每个用户的记录数大幅增加
ON CONFLICT DO NOTHING;

-- 特别为昨天生成DAU数据，确保daily_active_users物化视图有足够数据（最高峰）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  u.id,
  (random() * 999 + 1)::int,  -- 扩大内容ID范围
  CASE
    WHEN random() < 0.98 THEN 'impression'  -- 进一步增加impression比例到98%，体现峰值增长
    WHEN random() < 0.995 THEN 'click'
    ELSE 'staytime'
  END,
  CURRENT_DATE - INTERVAL '1 day' + (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  NULL,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int
  )
FROM app.users u
WHERE u.id <= 450  -- 大幅增加用户数量，接近用户总数
CROSS JOIN generate_series(1, 40) s  -- 大幅增加每个用户的记录数
ON CONFLICT DO NOTHING;

-- 为前一天也生成一些数据，用于计算环比增长（次高峰，确保昨天有明显增长）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  u.id,
  (random() * 999 + 1)::int,  -- 扩大内容ID范围
  CASE
    WHEN random() < 0.975 THEN 'impression'  -- 比昨天略低的impression比例，体现增长趋势
    WHEN random() < 0.99 THEN 'click'
    ELSE 'staytime'
  END,
  CURRENT_DATE - INTERVAL '2 day' + (random() * 24)::int * INTERVAL '1 hour',
  ARRAY['feed', 'search', 'recommendation'][(random() * 2 + 1)::int],
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  NULL,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int
  )
FROM app.users u
WHERE u.id <= 400  -- 比昨天少一些用户，确保有增长趋势
CROSS JOIN generate_series(1, 35) s  -- 比昨天少一些记录，确保有增长趋势
ON CONFLICT DO NOTHING;

-- 为不同时间段生成用户关系数据，模拟波动增长趋势

-- 为180-120天前生成用户关系数据（较少）
INSERT INTO rel.user_entity_relations (user_id, entity_type, entity_id, relation_type, status, strength, score, last_interact_at, attrs)
SELECT
  (random() * 99 + 1)::int,
  'item',
  (random() * 199 + 1)::int,
  CASE
    WHEN random() < 0.5 THEN 'like'
    ELSE 'favorite'
  END,
  'active',
  random() * 0.5,  -- 较低的强度
  random() * 0.5,  -- 较低的分数
  NOW() - (random() * 60 + 120)::int * INTERVAL '1 day',
  '{}'
FROM generate_series(1, 200) i
ON CONFLICT DO NOTHING;

-- 为120-60天前生成用户关系数据（中等）
INSERT INTO rel.user_entity_relations (user_id, entity_type, entity_id, relation_type, status, strength, score, last_interact_at, attrs)
SELECT
  (random() * 99 + 1)::int,
  'item',
  (random() * 199 + 1)::int,
  CASE
    WHEN random() < 0.5 THEN 'like'
    ELSE 'favorite'
  END,
  'active',
  random() * 0.7 + 0.1,  -- 中等的强度
  random() * 0.7 + 0.1,  -- 中等的分数
  NOW() - (random() * 60 + 60)::int * INTERVAL '1 day',
  '{}'
FROM generate_series(1, 300) i
ON CONFLICT DO NOTHING;

-- 为60-0天前生成用户关系数据（较多）
INSERT INTO rel.user_entity_relations (user_id, entity_type, entity_id, relation_type, status, strength, score, last_interact_at, attrs)
SELECT
  (random() * 99 + 1)::int,
  'item',
  (random() * 199 + 1)::int,
  CASE
    WHEN random() < 0.5 THEN 'like'
    ELSE 'favorite'
  END,
  'active',
  random() * 0.8 + 0.2,  -- 较高的强度
  random() * 0.8 + 0.2,  -- 较高的分数
  NOW() - (random() * 60)::int * INTERVAL '1 day',
  '{}'
FROM generate_series(1, 500) i
ON CONFLICT DO NOTHING;

-- 确保所有物化视图存在并刷新
DO $$
BEGIN
  -- 检查并创建metrics schema
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'metrics') THEN
    CREATE SCHEMA metrics;
  END IF;

  -- 检查并创建refresh_all_materialized_views函数
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'refresh_all_materialized_views' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'metrics')) THEN
    CREATE OR REPLACE FUNCTION metrics.refresh_all_materialized_views()
    RETURNS void AS $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'metrics' AND matviewname = 'daily_active_users') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.daily_active_users;
      END IF;
      
      IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'metrics' AND matviewname = 'weekly_active_users') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.weekly_active_users;
      END IF;
      
      IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'metrics' AND matviewname = 'monthly_active_users') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.monthly_active_users;
      END IF;
      
      IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'metrics' AND matviewname = 'content_type_ctr') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.content_type_ctr;
      END IF;
      
      IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'metrics' AND matviewname = 'user_staytime') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.user_staytime;
      END IF;
      
      IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'metrics' AND matviewname = 'user_interaction_rate') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.user_interaction_rate;
      END IF;
      
      IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'metrics' AND matviewname = 'content_distribution') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.content_distribution;
      END IF;
      
      IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'metrics' AND matviewname = 'ad_revenue') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.ad_revenue;
      END IF;
      
      IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'metrics' AND matviewname = 'product_revenue') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.product_revenue;
      END IF;
      
      IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'metrics' AND matviewname = 'user_retention') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.user_retention;
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END;
$$;

-- 刷新所有物化视图
SELECT metrics.refresh_all_materialized_views();