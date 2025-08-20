-- 测试数据初始化脚本

-- 创建测试用户
INSERT INTO app.users (username, tags) VALUES
('user1', '{"interests": ["tech", "sports"], "age_group": "25-34"}'::jsonb),
('user2', '{"interests": ["fashion", "travel"], "age_group": "18-24"}'::jsonb),
('user3', '{"interests": ["food", "music"], "age_group": "35-44"}'::jsonb),
('admin', '{"interests": ["tech", "business"], "age_group": "25-34", "role": "admin"}'::jsonb)
ON CONFLICT DO NOTHING;

-- 批量生成更多用户数据
INSERT INTO app.users (username, tags)
SELECT 
    'batch_user_' || i,
    jsonb_build_object(
        'interests', ARRAY[
            ARRAY['tech', 'sports', 'news', 'gaming'][(i % 4) + 1],
            ARRAY['fashion', 'travel', 'food', 'music'][(i % 4) + 1]
        ],
        'age_group', ARRAY['18-24', '25-34', '35-44', '45+'][(i % 4) + 1]
    )
FROM generate_series(1, 100) i
ON CONFLICT DO NOTHING;

-- 创建测试内容
INSERT INTO app.items (title, content, tags, author_id, media, kind) VALUES
('技术分享：Python的未来发展', '这篇文章讨论了Python在未来几年的发展趋势。Python作为一种通用编程语言，近年来在数据科学、人工智能和Web开发领域获得了广泛应用。未来几年，Python将继续在这些领域保持强势地位，同时在物联网和嵌入式系统方面也将有更多的应用。Python的简洁语法和丰富的库生态系统使其成为初学者和专业开发者的首选语言。', '{"topics": ["tech", "programming", "python"], "category": "article"}'::jsonb, 1, '{"type": "image", "url": "https://example.com/images/python.jpg"}'::jsonb, 'content'),
('旅行日记：巴黎一周游', '上周我去了巴黎，这里记录了我的旅行经历。巴黎作为世界著名的艺术和文化之都，拥有众多令人惊叹的景点。埃菲尔铁塔的壮观景色、卢浮宫的艺术珍品、圣母院的哥特式建筑，以及塞纳河畔的浪漫氛围，都给我留下了深刻的印象。此外，巴黎的美食也是此行的一大亮点，从正宗的法式面包到精致的甜点，每一餐都是一次味蕾的盛宴。', '{"topics": ["travel", "paris", "europe"], "category": "blog"}'::jsonb, 2, '{"type": "gallery", "urls": ["https://example.com/images/paris1.jpg", "https://example.com/images/paris2.jpg"]}'::jsonb, 'content'),
('美食推荐：最好吃的意大利面', '今天给大家推荐几家超级好吃的意大利面餐厅。意大利面作为意大利料理的代表，以其多样的形状和丰富的酱料搭配而闻名于世。在这篇文章中，我将介绍五家提供正宗意大利面的餐厅，从传统的博洛尼亚肉酱面到创新的海鲜意面，每家餐厅都有其独特的特色和不容错过的招牌菜。无论你是意面爱好者还是美食探索者，这些餐厅都值得一试。', '{"topics": ["food", "italian", "restaurant"], "category": "review"}'::jsonb, 3, '{"type": "video", "url": "https://example.com/videos/pasta.mp4", "duration": 180}'::jsonb, 'content'),
('新款智能手机评测', '这款新上市的智能手机有哪些亮点和不足。本文对市场上最新发布的旗舰智能手机进行了全面评测，包括设计、显示屏、性能、相机、电池续航和软件体验等方面。这款手机采用了最新的处理器和先进的相机系统，在性能和拍照方面表现出色。然而，其电池续航和散热控制还有改进空间。对于追求高性能和优质拍照体验的用户来说，这款手机是一个不错的选择。', '{"topics": ["tech", "smartphone", "review"], "category": "review"}'::jsonb, 1, '{"type": "image", "url": "https://example.com/images/phone.jpg"}'::jsonb, 'content'),
('夏季时尚穿搭指南', '夏天来了，这里有一些时尚穿搭建议。随着气温升高，轻薄透气的面料成为夏季穿搭的首选。本指南将分享十种适合不同场合的夏季穿搭方案，从休闲日常到正式场合，从海滩度假到城市街拍。每种穿搭都注重舒适度和时尚感的平衡，帮助你在炎热的夏季依然保持清爽和时尚。此外，文章还包含了一些夏季配饰的搭配技巧，让你的造型更加完美。', '{"topics": ["fashion", "summer", "style"], "category": "guide"}'::jsonb, 2, '{"type": "gallery", "urls": ["https://example.com/images/fashion1.jpg", "https://example.com/images/fashion2.jpg"]}'::jsonb, 'content'),
('最新款运动鞋', '这款运动鞋采用了最新科技，提供极佳的舒适度和支撑。鞋底使用了创新的缓震材料，有效减轻跑步时对关节的冲击。鞋面采用轻量化透气材料，确保长时间运动时脚部依然保持干爽。此外，鞋子的设计也考虑了不同跑步姿势的需求，提供了适当的支撑和稳定性。无论是日常跑步还是专业训练，这款运动鞋都能满足你的需求。', '{"topics": ["fashion", "sports", "shoes"], "category": "product"}'::jsonb, 2, '{"type": "image", "url": "https://example.com/images/shoes.jpg", "price": 99.99}'::jsonb, 'product'),
('限量版手表', '这款限量版手表只发行1000只，采用瑞士机芯。手表外观设计简约而不失奢华，表盘采用蓝宝石玻璃，防刮耐磨。表带使用优质真皮材质，佩戴舒适。机芯采用瑞士制造，精准可靠，动力储存可达48小时。每只手表都有独特的编号，彰显其收藏价值。作为一款兼具实用性和艺术性的腕表，它不仅是计时工具，更是身份和品味的象征。', '{"topics": ["fashion", "luxury", "watch"], "category": "product"}'::jsonb, 3, '{"type": "image", "url": "https://example.com/images/watch.jpg", "price": 299.99}'::jsonb, 'product'),
('夏季大促销', '全场商品低至5折，限时抢购。本次促销活动涵盖服装、鞋包、家居用品等多个品类，是一年中力度最大的折扣季。活动期间，会员还可享受额外9折优惠，同时满1000元即可获赠精美礼品一份。促销活动将持续两周，错过这次机会，下次再等一年。快来选购心仪已久的商品，享受超值优惠吧！', '{"topics": ["sale", "discount"], "category": "ad"}'::jsonb, NULL, '{"type": "banner", "url": "https://example.com/images/sale.jpg", "cta": "立即购买"}'::jsonb, 'ad'),
('人工智能在医疗领域的应用', '人工智能技术正在彻底改变医疗行业的多个方面。从疾病诊断到药物研发，从医疗影像分析到个性化治疗方案，AI的应用无处不在。本文深入探讨了AI在医疗领域的最新进展和未来趋势，包括机器学习算法如何帮助医生更准确地诊断疾病，深度学习模型如何从医学影像中识别异常，以及自然语言处理技术如何改善医疗记录管理。尽管AI带来了巨大的潜力，但文章也讨论了相关的伦理问题和挑战。', '{"topics": ["tech", "ai", "healthcare"], "category": "article"}'::jsonb, 1, '{"type": "image", "url": "https://example.com/images/ai_healthcare.jpg"}'::jsonb, 'content'),
('可持续时尚：环保面料的未来', '随着环保意识的提高，可持续时尚正成为服装行业的重要趋势。本文介绍了多种创新的环保面料，从有机棉到再生聚酯，从竹纤维到海藻纤维。这些材料不仅减少了环境污染，还提供了与传统面料相当甚至更好的性能和舒适度。文章还探讨了时尚品牌如何通过采用这些环保材料和可持续生产流程来减少碳足迹，以及消费者如何通过自己的购买决策支持可持续时尚。', '{"topics": ["fashion", "sustainability", "environment"], "category": "article"}'::jsonb, 2, '{"type": "gallery", "urls": ["https://example.com/images/eco_fashion1.jpg", "https://example.com/images/eco_fashion2.jpg"]}'::jsonb, 'content'),
('日本美食之旅：东京必吃餐厅', '作为美食爱好者的天堂，东京拥有世界上最多的米其林星级餐厅。本文带你探索东京的美食文化，从传统的寿司和拉面，到创新的融合料理。文章详细介绍了十家必访的餐厅，包括它们的特色菜品、用餐环境和预订信息。无论你是追求正宗的日本传统美食，还是喜欢尝试现代创新料理，这份指南都能满足你的需求。此外，文章还提供了一些用餐礼仪和小贴士，帮助你更好地享受东京的美食之旅。', '{"topics": ["food", "travel", "japan"], "category": "guide"}'::jsonb, 3, '{"type": "gallery", "urls": ["https://example.com/images/tokyo_food1.jpg", "https://example.com/images/tokyo_food2.jpg"]}'::jsonb, 'content'),
('智能家居设备推荐', '随着智能家居技术的发展，越来越多的设备可以帮助我们简化日常生活。本文推荐了十款最实用的智能家居设备，从智能音箱到安全摄像头，从智能灯泡到智能恒温器。每款设备都经过了实际测试，文章详细分析了它们的功能、易用性、兼容性和性价比。此外，文章还讨论了如何将这些设备整合到一个统一的智能家居系统中，以及如何保护你的智能家居网络安全。', '{"topics": ["tech", "smart_home", "gadgets"], "category": "review"}'::jsonb, 1, '{"type": "gallery", "urls": ["https://example.com/images/smart_home1.jpg", "https://example.com/images/smart_home2.jpg"]}'::jsonb, 'content')
ON CONFLICT DO NOTHING;

-- 批量生成更多内容数据
INSERT INTO app.items (title, content, tags, author_id, media, kind)
SELECT
    CASE
        WHEN i % 3 = 0 THEN '技术文章: ' || i
        WHEN i % 3 = 1 THEN '旅行日记: ' || i
        ELSE '生活分享: ' || i
    END,
    CASE
        WHEN i % 3 = 0 THEN '这是一篇关于技术的文章，讨论了最新的技术趋势和发展方向。'
        WHEN i % 3 = 1 THEN '这是一篇旅行日记，记录了在不同地方的旅行经历和感受。'
        ELSE '这是一篇生活分享，分享了日常生活中的小确幸和感悟。'
    END,
    CASE
        WHEN i % 3 = 0 THEN '{"topics": ["tech", "programming"], "category": "article"}'::jsonb
        WHEN i % 3 = 1 THEN '{"topics": ["travel", "adventure"], "category": "blog"}'::jsonb
        ELSE '{"topics": ["lifestyle", "daily"], "category": "blog"}'::jsonb
    END,
    (i % 3) + 1,
    CASE
        WHEN i % 3 = 0 THEN '{"type": "image", "url": "https://example.com/images/tech_' || i || '.jpg"}'::jsonb
        WHEN i % 3 = 1 THEN '{"type": "gallery", "urls": ["https://example.com/images/travel_' || i || '_1.jpg", "https://example.com/images/travel_' || i || '_2.jpg"]}'::jsonb
        ELSE '{"type": "image", "url": "https://example.com/images/lifestyle_' || i || '.jpg"}'::jsonb
    END,
    CASE
        WHEN i % 10 = 0 THEN 'ad'
        WHEN i % 5 = 0 THEN 'product'
        ELSE 'content'
    END
FROM generate_series(13, 100) i
ON CONFLICT DO NOTHING;

-- 为product类型的内容添加价格
UPDATE app.items
SET media = jsonb_set(media, '{price}', to_jsonb((random() * 1000 + 50)::numeric(12,2)))
WHERE kind = 'product' AND (media->>'price') IS NULL;

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

-- 批量生成更多事件数据
-- 生成过去180天的事件数据，模拟波动增长趋势

-- 生成180-120天前的基础数据（较少）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 99 + 1)::int,
  (random() * 11 + 1)::int,
  CASE
    WHEN random() < 0.5 THEN 'impression'
    WHEN random() < 0.7 THEN 'click'
    WHEN random() < 0.8 THEN 'staytime'
    WHEN random() < 0.9 THEN 'like'
    ELSE 'favorite'
  END,
  NOW() - (random() * 60 + 120)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  CASE
    WHEN random() < 0.7 THEN 'feed'
    WHEN random() < 0.9 THEN 'search'
    ELSE 'recommendation'
  END,
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  CASE
    -- 为商品点击添加GMV金额
    WHEN random() < 0.3 THEN (random() * 500 + 100)::numeric(12,2)
    ELSE 0
  END,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int,
    -- 为广告点击添加CPC金额
    'cpc_amount', CASE 
      WHEN random() < 0.2 THEN (random() * 1.5 + 0.1)::numeric(12,2)::text
      ELSE NULL
    END
  )
FROM generate_series(1, 1000) i
ON CONFLICT DO NOTHING;

-- 生成120-60天前的基础数据（中等）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 99 + 1)::int,
  (random() * 11 + 1)::int,
  CASE
    WHEN random() < 0.5 THEN 'impression'
    WHEN random() < 0.7 THEN 'click'
    WHEN random() < 0.8 THEN 'staytime'
    WHEN random() < 0.9 THEN 'like'
    ELSE 'favorite'
  END,
  NOW() - (random() * 60 + 60)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  CASE
    WHEN random() < 0.7 THEN 'feed'
    WHEN random() < 0.9 THEN 'search'
    ELSE 'recommendation'
  END,
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  CASE
    -- 为商品点击添加GMV金额
    WHEN random() < 0.4 THEN (random() * 700 + 200)::numeric(12,2)
    ELSE 0
  END,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int,
    -- 为广告点击添加CPC金额
    'cpc_amount', CASE 
      WHEN random() < 0.3 THEN (random() * 1.8 + 0.2)::numeric(12,2)::text
      ELSE NULL
    END
  )
FROM generate_series(1, 2000) i
ON CONFLICT DO NOTHING;

-- 生成60-0天前的基础数据（较多）
INSERT INTO app.events (user_id, item_id, event_type, ts, source, staytime_ms, gmv_amount, extra)
SELECT
  (random() * 99 + 1)::int,
  (random() * 11 + 1)::int,
  CASE
    WHEN random() < 0.5 THEN 'impression'
    WHEN random() < 0.7 THEN 'click'
    WHEN random() < 0.8 THEN 'staytime'
    WHEN random() < 0.9 THEN 'like'
    ELSE 'favorite'
  END,
  NOW() - (random() * 60)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  CASE
    WHEN random() < 0.7 THEN 'feed'
    WHEN random() < 0.9 THEN 'search'
    ELSE 'recommendation'
  END,
  CASE
    WHEN random() < 0.8 THEN (random() * 60000)::int
    ELSE 0
  END,
  CASE
    -- 为商品点击添加GMV金额
    WHEN random() < 0.5 THEN (random() * 1000 + 300)::numeric(12,2)
    ELSE 0
  END,
  jsonb_build_object(
    'position', (random() * 20 + 1)::int,
    'trace_id', 'trace_' || (random() * 1000000)::int,
    -- 为广告点击添加CPC金额
    'cpc_amount', CASE 
      WHEN random() < 0.4 THEN (random() * 2 + 0.3)::numeric(12,2)::text
      ELSE NULL
    END
  )
FROM generate_series(1, 3000) i
ON CONFLICT DO NOTHING;

-- 确保商品点击事件有GMV金额
UPDATE app.events
SET gmv_amount = CASE WHEN random() < 0.8 THEN (random() * 1000 + 200)::numeric(12,2) ELSE 500 END
WHERE event_type = 'click'
AND item_id IN (SELECT id FROM app.items WHERE kind = 'product')
AND (gmv_amount IS NULL OR gmv_amount = 0);

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

-- 刷新所有物化视图
REFRESH MATERIALIZED VIEW search.item_ft;
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.daily_active_users;
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.weekly_active_users;
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.monthly_active_users;
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.content_type_ctr;
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.user_staytime;
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.user_interaction_rate;
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.content_distribution;
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.ad_revenue;
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.product_revenue;
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.user_retention;
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.daily_ctr;
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics.ad_performance;

-- 执行刷新函数
SELECT metrics.refresh_all_materialized_views();