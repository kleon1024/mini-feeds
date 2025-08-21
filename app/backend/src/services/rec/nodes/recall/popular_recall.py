from typing import Dict, List, Any, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from src.core.logger import logger
from src.services.rec.nodes.base_node import RecallNode

class PopularRecallNode(RecallNode):
    """基于热度的召回节点"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.time_window = config.get('time_window', '1d')
        self.metrics = config.get('metrics', ['pv', 'like', 'comment'])
        self.weights = config.get('weights', {
            'pv': 1.0,
            'like': 3.0,
            'comment': 5.0,
            'share': 7.0,
            'favorite': 10.0
        })
    
    def get_required_fields(self) -> List[str]:
        fields = super().get_required_fields()
        fields.extend(['time_window', 'metrics'])
        return fields
    
    def _parse_time_window(self, window: str) -> timedelta:
        """解析时间窗口字符串为timedelta"""
        unit = window[-1]
        value = int(window[:-1])
        
        if unit == 'h':
            return timedelta(hours=value)
        elif unit == 'd':
            return timedelta(days=value)
        else:
            # 默认为1天
            return timedelta(days=1)
    
    async def recall(self, db: AsyncSession, user_id: Optional[int], 
                    context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """基于内容热度进行召回"""
        # 获取trace信息
        trace = context.get('trace')
        if trace:
            trace.add_node_detail(self.node_id, "time_window", self.time_window)
            trace.add_node_detail(self.node_id, "metrics", self.metrics)
        
        # 解析时间窗口
        delta = self._parse_time_window(self.time_window)
        start_time = datetime.now() - delta
        
        # 构建事件类型映射到指标名称
        event_to_metric = {
            'impression': 'pv',
            'like': 'like',
            'comment': 'comment',
            'share': 'share',
            'favorite': 'favorite'
        }
        
        # 过滤出需要的事件类型
        event_types = []
        for event_type, metric in event_to_metric.items():
            if metric in self.metrics:
                event_types.append(event_type)
        
        if not event_types:
            if trace:
                trace.add_node_detail(self.node_id, "error", "no_valid_event_types")
            return []
        
        # 构建查询：按事件类型分组统计热度
        # 这里使用原生SQL以便更灵活地构建复杂查询
        query_text = """
        WITH event_counts AS (
            SELECT 
                e.item_id,
                e.event_type,
                COUNT(*) as count
            FROM 
                app.events e
            WHERE 
                e.ts >= :start_time
                AND e.event_type IN :event_types
            GROUP BY 
                e.item_id, e.event_type
        ),
        item_scores AS (
            SELECT 
                i.id,
                i.title,
                i.content,
                i.tags,
                i.author_id,
                i.created_at,
                i.kind,
                SUM(
                    CASE 
                        WHEN ec.event_type = 'impression' THEN ec.count * :pv_weight
                        WHEN ec.event_type = 'like' THEN ec.count * :like_weight
                        WHEN ec.event_type = 'comment' THEN ec.count * :comment_weight
                        WHEN ec.event_type = 'share' THEN ec.count * :share_weight
                        WHEN ec.event_type = 'favorite' THEN ec.count * :favorite_weight
                        ELSE 0
                    END
                ) as popularity_score
            FROM 
                app.items i
            LEFT JOIN 
                event_counts ec ON i.id = ec.item_id
            WHERE
                i.kind = 'content'
            GROUP BY 
                i.id, i.title, i.content, i.tags, i.author_id, i.created_at, i.kind
            ORDER BY 
                popularity_score DESC
            LIMIT :limit
        )
        SELECT * FROM item_scores
        """
        
        # 准备参数
        params = {
            'start_time': start_time,
            'event_types': tuple(event_types),
            'pv_weight': self.weights.get('pv', 1.0),
            'like_weight': self.weights.get('like', 3.0),
            'comment_weight': self.weights.get('comment', 5.0),
            'share_weight': self.weights.get('share', 7.0),
            'favorite_weight': self.weights.get('favorite', 10.0),
            'limit': self.recall_size
        }
        
        try:
            # 执行查询
            result = await db.execute(text(query_text), params)
            rows = result.fetchall()
            
            # 构建候选项列表
            candidates = []
            for row in rows:
                # 将行转换为字典
                item = dict(row._mapping)
                
                # 添加召回类型和分数
                item['recall_type'] = 'popular'
                item['match_score'] = item.pop('popularity_score', 0.0)
                
                # 格式化日期时间
                if 'created_at' in item and item['created_at']:
                    item['created_at'] = item['created_at'].isoformat()
                
                candidates.append(item)
            
            # 记录trace信息
            if trace:
                trace.add_node_detail(self.node_id, "candidates_count", len(candidates))
            
            logger.debug(f"热门召回数量: {len(candidates)}")
            return candidates
        except Exception as e:
            error_msg = f"热门召回失败: {str(e)}"
            logger.error(error_msg)
            
            if trace:
                trace.add_error(self.node_id, error_msg)
            
            # 出错时返回空列表
            return []