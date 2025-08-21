from typing import Dict, List, Any, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.services.rec.nodes.base_node import RecallNode
from src.db.models import Item

class AdRecallNode(RecallNode):
    """广告召回节点"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.targeting_enabled = config.get('targeting_enabled', True)
    
    async def recall(self, db: AsyncSession, user_id: Optional[int], 
                    context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """召回符合条件的广告"""
        # 获取trace信息
        trace = context.get('trace')
        if trace:
            trace.add_node_detail(self.node_id, "targeting_enabled", self.targeting_enabled)
            trace.add_node_detail(self.node_id, "user_id", user_id)
        
        # 简化版广告召回，实际实现可能更复杂
        query = (
            select(Item)
            .where(Item.kind == 'ad')
            .limit(self.recall_size)
        )
        
        try:
            result = await db.execute(query)
            items = result.scalars().all()
            
            # 构建候选项列表
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
                    'match_score': 1.0,  # 简化处理，实际应基于定向和出价计算
                    'recall_type': 'ad'
                })
            
            # 记录trace信息
            if trace:
                trace.add_node_detail(self.node_id, "candidates_count", len(candidates))
            
            logger.debug(f"广告召回数量: {len(candidates)}")
            return candidates
        except Exception as e:
            error_msg = f"广告召回失败: {str(e)}"
            logger.error(error_msg)
            
            if trace:
                trace.add_error(self.node_id, error_msg)
            
            # 出错时返回空列表
            return []