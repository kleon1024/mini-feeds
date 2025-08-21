from typing import Dict, List, Any, Optional
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.services.rec.nodes.base_node import TransformNode
from src.db.models import Item
from src.db.schemas import FeedItem

class ResponseFormatNode(TransformNode):
    """响应格式化节点，将推荐结果转换为API响应格式"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.generate_reason = config.get('generate_reason', True)
        self.include_tracking = config.get('include_tracking', True)
    
    async def transform(self, candidates: List[Dict[str, Any]], context: Dict[str, Any]) -> List[FeedItem]:
        """将推荐结果转换为API响应格式"""
        if not candidates:
            return []
        
        # 获取trace信息
        trace = context.get('trace')
        if trace:
            trace.add_node_detail(self.node_id, "input_size", len(candidates))
        
        # 获取数据库会话
        db = context.get('db')
        if not db:
            raise ValueError("缺少数据库会话")
        
        # 转换结果
        feed_items: List[FeedItem] = []
        
        for i, item in enumerate(candidates):
            position = i + 1
            
            # 获取分数
            score = item.get('rerank_score',  # 重排分数
                          item.get('rank_score',  # 精排分数
                                 item.get('pre_rank_score',  # 粗排分数
                                        item.get('match_score', 0.9))))  # 召回分数
            
            # 创建跟踪信息
            tracking = None
            if self.include_tracking:
                tracking = {
                    "event_token": f"token-{uuid.uuid4()}",
                    "trace_id": trace.trace_id if trace else f"trace-{uuid.uuid4()}",
                }
            
            # 生成推荐理由
            reason = None
            if self.generate_reason:
                reason = self._generate_reason(item)
            
            # 创建基本的FeedItem结构
            feed_item = FeedItem(
                type=item.get('kind', 'content'),
                id=str(item.get('id')),
                score=score,
                position=position,
                reason=reason,
                tracking=tracking,
            )
            
            # 根据类型设置不同的内容
            kind = item.get('kind', 'content')
            if kind == "content":
                # 查询完整的内容信息
                item_query = select(Item).where(Item.id == item.get('id'))
                item_result = await db.execute(item_query)
                item_db = item_result.scalar_one_or_none()
                
                if item_db:
                    feed_item.content = {
                        "title": item_db.title,
                        "description": item_db.content,
                        "author": {
                            "id": item_db.author_id,
                            "name": "未知作者"  # 简化处理，实际应该查询作者信息
                        },
                        "created_at": item_db.created_at.isoformat() if item_db.created_at else None,
                        "media": item_db.media,
                        "tags": item_db.tags,
                    }
                else:
                    # 如果找不到内容，使用推荐结果中的信息
                    feed_item.content = {
                        "title": item.get('title', ''),
                        "description": item.get('content', ''),
                        "author": {
                            "id": item.get('author_id'),
                            "name": "未知作者"
                        },
                        "created_at": item.get('created_at'),
                        "media": {},
                        "tags": item.get('tags', []),
                    }
            
            feed_items.append(feed_item)
        
        # 记录trace信息
        if trace:
            trace.add_node_detail(self.node_id, "output_size", len(feed_items))
        
        return feed_items
    
    def _generate_reason(self, item: Dict[str, Any]) -> Optional[str]:
        """生成推荐理由"""
        recall_type = item.get('recall_type')
        if recall_type == 'tag':
            matched_tags = item.get('matched_tags', [])
            if matched_tags:
                return f"基于你感兴趣的{matched_tags[0]}"
            else:
                return "基于你的兴趣推荐"
        elif recall_type == 'popular':
            return "热门推荐"
        elif recall_type == 'vector':
            return "与你喜欢的内容相似"
        elif recall_type == 'multi_hop':
            return "你可能感兴趣的发现"
        elif recall_type == 'random':
            return "随机推荐"
        else:
            return "根据你的兴趣推荐"