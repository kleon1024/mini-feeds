from typing import Dict, List, Any, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.db.models import Item
from src.services.rec.nodes.base_node import RecallNode

class RandomRecallNode(RecallNode):
    """随机召回节点，用于降级策略或冷启动"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.content_types = config.get('content_types', ['content', 'ad', 'product'])
        self.seed = config.get('seed', None)  # 可选的随机种子，用于可重复性
    
    async def recall(self, db: AsyncSession, user_id: Optional[int], 
                    context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """随机召回内容"""
        # 构建查询
        query = select(Item)
        
        # 如果指定了内容类型，则进行过滤
        if self.content_types and len(self.content_types) > 0:
            query = query.where(Item.kind.in_(self.content_types))
        
        # 使用随机排序
        # 注意：这种方式在大数据量时性能较差，实际生产环境可能需要优化
        if self.seed is not None:
            # 使用固定种子进行随机排序，确保可重复性
            query = query.order_by(func.random(self.seed))
        else:
            # 完全随机排序
            query = query.order_by(func.random())
        
        # 限制返回数量
        query = query.limit(self.recall_size)
        
        # 执行查询
        result = await db.execute(query)
        items = result.scalars().all()
        
        # 转换为标准格式
        candidates = []
        for item in items:
            candidates.append({
                'id': item.id,
                'title': item.title,
                'content': item.content,
                'tags': item.tags,
                'author_id': item.author_id,
                'created_at': item.created_at.isoformat() if item.created_at else None,
                'kind': item.kind,
                'match_score': 0.5,  # 随机召回的默认分数
                'recall_type': 'random'
            })
        
        # 记录日志
        logger.debug(f"随机召回数量: {len(candidates)}")
        
        return candidates