from typing import Dict, List, Any, Optional
from sqlalchemy import select, text, or_
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.services.rec.nodes.base_node import RecallNode
from src.db.models import Item, User

class TagRecallNode(RecallNode):
    """基于标签的召回节点"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.tag_weight_decay = config.get('tag_weight_decay', 0.9)
        self.min_tag_match = config.get('min_tag_match', 1)
        self.max_tag_match = config.get('max_tag_match', 3)
    
    def get_required_fields(self) -> List[str]:
        fields = super().get_required_fields()
        fields.extend(['tag_weight_decay'])
        return fields
    
    async def recall(self, db: AsyncSession, user_id: Optional[int], 
                    context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """基于用户兴趣标签进行召回"""
        if not user_id:
            # 未登录用户，返回空列表
            return []
        
        # 获取trace信息
        trace = context.get('trace')
        if trace:
            trace.add_node_detail(self.node_id, "user_id", user_id)
        
        # 获取用户标签
        user_query = select(User).where(User.id == user_id)
        user_result = await db.execute(user_query)
        user = user_result.scalar_one_or_none()
        
        if not user or not user.tags:
            # 用户不存在或没有标签，返回空列表
            if trace:
                trace.add_node_detail(self.node_id, "error", "user_not_found_or_no_tags")
            return []
        
        # 用户标签
        user_tags = user.tags if isinstance(user.tags, list) else []
        if not user_tags:
            if trace:
                trace.add_node_detail(self.node_id, "error", "empty_user_tags")
            return []
        
        if trace:
            trace.add_node_detail(self.node_id, "user_tags", user_tags)
        
        # 构建标签匹配查询
        # 使用PostgreSQL的jsonb操作符进行标签匹配
        # 这里假设tags字段是jsonb数组类型
        candidates = []
        
        # 限制使用的标签数量
        used_tags = user_tags[:self.max_tag_match]
        
        # 构建查询条件：至少匹配一个标签
        conditions = []
        for tag in used_tags:
            # 使用jsonb包含操作符
            conditions.append(text(f"tags @> '[\"{ tag }\"]'::jsonb"))
        
        # 组合查询条件
        query = (
            select(Item)
            .where(or_(*conditions))
            .where(Item.kind == 'content')
            .limit(self.recall_size)
        )
        
        result = await db.execute(query)
        items = result.scalars().all()
        
        # 计算每个项目的标签匹配分数
        for item in items:
            item_tags = item.tags if isinstance(item.tags, list) else []
            
            # 计算标签匹配分数
            match_score = 0.0
            matched_tags = []
            
            for i, tag in enumerate(used_tags):
                if tag in item_tags:
                    # 应用权重衰减：较靠前的标签权重更高
                    weight = self.tag_weight_decay ** i
                    match_score += weight
                    matched_tags.append(tag)
            
            # 只有当匹配标签数量达到最小要求时才添加到候选集
            if len(matched_tags) >= self.min_tag_match:
                candidates.append({
                    'id': item.id,
                    'title': item.title,
                    'content': item.content,
                    'tags': item.tags,
                    'author_id': item.author_id,
                    'created_at': item.created_at.isoformat() if item.created_at else None,
                    'kind': item.kind,
                    'match_score': match_score,
                    'matched_tags': matched_tags,
                    'recall_type': 'tag'
                })
        
        # 按匹配分数排序
        candidates.sort(key=lambda x: x['match_score'], reverse=True)
        
        # 截断结果
        if len(candidates) > self.recall_size:
            candidates = candidates[:self.recall_size]
        
        # 记录trace信息
        if trace:
            trace.add_node_detail(self.node_id, "candidates_count", len(candidates))
        
        logger.debug(f"标签召回数量: {len(candidates)}")
        return candidates