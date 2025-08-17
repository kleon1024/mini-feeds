-- 测试数据初始化脚本

-- 创建测试用户
INSERT INTO app.users (username, tags) VALUES
('user1', '{"interests": ["tech", "sports"], "age_group": "25-34"}'::jsonb),
('user2', '{"interests": ["fashion", "travel"], "age_group": "18-24"}'::jsonb),
('user3', '{"interests": ["food", "music"], "age_group": "35-44"}'::jsonb),
('admin', '{"interests": ["tech", "business"], "age_group": "25-34", "role": "admin"}'::jsonb)
ON CONFLICT DO NOTHING;

-- 创建测试内容
INSERT INTO app.items (title, content, tags, author_id, media, kind) VALUES
('技术分享：Python的未来发展', '这篇文章讨论了Python在未来几年的发展趋势...', '{"topics": ["tech", "programming", "python"], "category": "article"}'::jsonb, 1, '{"type": "image", "url": "https://example.com/images/python.jpg"}'::jsonb, 'content'),
('旅行日记：巴黎一周游', '上周我去了巴黎，这里记录了我的旅行经历...', '{"topics": ["travel", "paris", "europe"], "category": "blog"}'::jsonb, 2, '{"type": "gallery", "urls": ["https://example.com/images/paris1.jpg", "https://example.com/images/paris2.jpg"]}'::jsonb, 'content'),
('美食推荐：最好吃的意大利面', '今天给大家推荐几家超级好吃的意大利面餐厅...', '{"topics": ["food", "italian", "restaurant"], "category": "review"}'::jsonb, 3, '{"type": "video", "url": "https://example.com/videos/pasta.mp4", "duration": 180}'::jsonb, 'content'),
('新款智能手机评测', '这款新上市的智能手机有哪些亮点和不足...', '{"topics": ["tech", "smartphone", "review"], "category": "review"}'::jsonb, 1, '{"type": "image", "url": "https://example.com/images/phone.jpg"}'::jsonb, 'content'),
('夏季时尚穿搭指南', '夏天来了，这里有一些时尚穿搭建议...', '{"topics": ["fashion", "summer", "style"], "category": "guide"}'::jsonb, 2, '{"type": "gallery", "urls": ["https://example.com/images/fashion1.jpg", "https://example.com/images/fashion2.jpg"]}'::jsonb, 'content'),
('最新款运动鞋', '这款运动鞋采用了最新科技，提供极佳的舒适度和支撑...', '{"topics": ["fashion", "sports", "shoes"], "category": "product"}'::jsonb, 2, '{"type": "image", "url": "https://example.com/images/shoes.jpg", "price": 99.99}'::jsonb, 'product'),
('限量版手表', '这款限量版手表只发行1000只，采用瑞士机芯...', '{"topics": ["fashion", "luxury", "watch"], "category": "product"}'::jsonb, 3, '{"type": "image", "url": "https://example.com/images/watch.jpg", "price": 299.99}'::jsonb, 'product'),
('夏季大促销', '全场商品低至5折，限时抢购...', '{"topics": ["sale", "discount"], "category": "ad"}'::jsonb, NULL, '{"type": "banner", "url": "https://example.com/images/sale.jpg", "cta": "立即购买"}'::jsonb, 'ad')
ON CONFLICT DO NOTHING;

-- 创建测试事件数据
INSERT INTO app.events (user_id, item_id, event_type, source, staytime_ms, extra) VALUES
(1, 2, 'impression', 'feed', 5000, '{"position": 1, "session_id": "abc123"}'::jsonb),
(1, 2, 'click', 'feed', 0, '{"position": 1, "session_id": "abc123"}'::jsonb),
(1, 3, 'impression', 'feed', 3000, '{"position": 2, "session_id": "abc123"}'::jsonb),
(2, 1, 'impression', 'feed', 4000, '{"position": 1, "session_id": "def456"}'::jsonb),
(2, 1, 'click', 'feed', 0, '{"position": 1, "session_id": "def456"}'::jsonb),
(2, 4, 'impression', 'feed', 2000, '{"position": 2, "session_id": "def456"}'::jsonb),
(3, 5, 'impression', 'feed', 6000, '{"position": 1, "session_id": "ghi789"}'::jsonb),
(3, 5, 'click', 'feed', 0, '{"position": 1, "session_id": "ghi789"}'::jsonb),
(1, 6, 'impression', 'search', 3000, '{"position": 1, "query": "运动鞋", "session_id": "jkl012"}'::jsonb),
(1, 6, 'click', 'search', 0, '{"position": 1, "query": "运动鞋", "session_id": "jkl012"}'::jsonb),
(2, 7, 'impression', 'search', 4000, '{"position": 1, "query": "手表", "session_id": "mno345"}'::jsonb),
(2, 7, 'click', 'search', 0, '{"position": 1, "query": "手表", "session_id": "mno345"}'::jsonb),
(1, 8, 'impression', 'feed', 2000, '{"position": 3, "session_id": "abc123", "creative_id": 1}'::jsonb),
(2, 8, 'impression', 'feed', 3000, '{"position": 3, "session_id": "def456", "creative_id": 1}'::jsonb),
(2, 8, 'ad_click', 'feed', 0, '{"position": 3, "session_id": "def456", "creative_id": 1}'::jsonb),
(3, 8, 'impression', 'feed', 1000, '{"position": 2, "session_id": "ghi789", "creative_id": 1}'::jsonb)
ON CONFLICT DO NOTHING;

-- 创建用户关系数据
INSERT INTO rel.user_entity_relations (user_id, entity_type, entity_id, relation_type, status) VALUES
(1, 'user', 2, 'follow', 'active'),
(1, 'item', 2, 'like', 'active'),
(1, 'item', 3, 'favorite', 'active'),
(2, 'user', 3, 'follow', 'active'),
(2, 'item', 5, 'like', 'active'),
(3, 'item', 1, 'like', 'active'),
(3, 'item', 4, 'favorite', 'active')
ON CONFLICT DO NOTHING;

-- 创建广告主数据
INSERT INTO ads.advertisers (name) VALUES
('品牌A'),
('品牌B')
ON CONFLICT DO NOTHING;

-- 创建广告活动
INSERT INTO ads.campaigns (advertiser_id, name, bid_type, bid_amount, budget_daily, start_at, end_at, target, freq_cap_daily, pacing_mode) VALUES
(1, '夏季促销活动', 'CPC', 0.5, 100.00, NOW(), NOW() + INTERVAL '30 days', '{"interests": ["fashion", "sports"], "age_groups": ["18-24", "25-34"]}'::jsonb, 3, 'uniform'),
(2, '新品发布活动', 'CPC', 0.8, 200.00, NOW(), NOW() + INTERVAL '15 days', '{"interests": ["tech", "gadgets"], "age_groups": ["25-34", "35-44"]}'::jsonb, 2, 'uniform')
ON CONFLICT DO NOTHING;

-- 创建广告创意
INSERT INTO ads.creatives (campaign_id, title, image_url, landing_url) VALUES
(1, '夏季大促销', 'https://example.com/images/summer_sale.jpg', 'https://example.com/summer_sale'),
(2, '新品上市', 'https://example.com/images/new_product.jpg', 'https://example.com/new_product')
ON CONFLICT DO NOTHING;

-- 初始化每日预算
INSERT INTO ads.daily_budget (campaign_id, day, budget) VALUES
(1, CURRENT_DATE, 100.00),
(2, CURRENT_DATE, 200.00)
ON CONFLICT DO NOTHING;

-- 刷新物化视图
REFRESH MATERIALIZED VIEW search.item_ft;
REFRESH MATERIALIZED VIEW metrics.daily_ctr;
REFRESH MATERIALIZED VIEW metrics.ad_performance;