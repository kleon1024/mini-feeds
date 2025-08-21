from typing import Dict, List, Any, Optional, Set
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.services.rec.nodes.base_node import FilterNode
from src.db.models import UserEntityRelation

class BasicFilterNode(FilterNode):
    """基础过滤节点，包含去重、低质量内容过滤、用户拉黑内容过滤等"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.filter_rules = config.get('filter_rules', ['duplicate', 'block', 'low_quality'])
        self.quality_threshold = config.get('quality_threshold', 0.3)
    
    def get_required_fields(self) -> List[str]:
        fields = super().get_required_fields()
        fields.extend(['filter_rules'])
        return fields
    
    async def filter(self, candidates: List[Dict[str, Any]], user_id: Optional[int], 
                   context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """执行过滤逻辑"""
        if not candidates:
            return []
        
        # 获取trace信息
        trace = context.get('trace')
        if trace:
            trace.add_node_detail(self.node_id, "filter_rules", self.filter_rules)
            trace.add_node_detail(self.node_id, "input_size", len(candidates))
        
        # 应用各种过滤规则
        filtered_candidates = candidates
        filtered_counts = {}
        
        # 去重过滤
        if 'duplicate' in self.filter_rules:
            original_count = len(filtered_candidates)
            filtered_candidates = self._dedup_filter(filtered_candidates)
            filtered_counts['duplicate'] = original_count - len(filtered_candidates)
        
        # 用户拉黑内容过滤
        if 'block' in self.filter_rules and user_id is not None:
            db = context.get('db')
            if db:
                original_count = len(filtered_candidates)
                filtered_candidates = await self._block_filter(filtered_candidates, user_id, db)
                filtered_counts['block'] = original_count - len(filtered_candidates)
        
        # 低质量内容过滤
        if 'low_quality' in self.filter_rules:
            original_count = len(filtered_candidates)
            filtered_candidates = self._quality_filter(filtered_candidates)
            filtered_counts['low_quality'] = original_count - len(filtered_candidates)
        
        # 敏感内容过滤
        if 'sensitive' in self.filter_rules:
            original_count = len(filtered_candidates)
            filtered_candidates = self._sensitive_filter(filtered_candidates)
            filtered_counts['sensitive'] = original_count - len(filtered_candidates)
        
        # 记录trace信息
        if trace:
            trace.add_node_detail(self.node_id, "filtered_counts", filtered_counts)
            trace.add_node_detail(self.node_id, "output_size", len(filtered_candidates))
        
        return filtered_candidates
    
    def _dedup_filter(self, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """去重过滤"""
        seen_ids = set()
        result = []
        
        for candidate in candidates:
            item_id = candidate.get('id')
            if item_id is not None and item_id not in seen_ids:
                seen_ids.add(item_id)
                result.append(candidate)
        
        return result
    
    async def _block_filter(self, candidates: List[Dict[str, Any]], user_id: int, 
                          db: AsyncSession) -> List[Dict[str, Any]]:
        """用户拉黑内容过滤"""
        # 查询用户拉黑的内容
        query = select(UserEntityRelation.entity_id).where(
            UserEntityRelation.user_id == user_id,
            UserEntityRelation.entity_type == 'item',
            UserEntityRelation.relation_type == 'block',
            UserEntityRelation.status == 'active'
        )
        
        result = await db.execute(query)
        blocked_ids = {row[0] for row in result.fetchall()}
        
        # 过滤掉拉黑的内容
        return [candidate for candidate in candidates 
                if candidate.get('id') not in blocked_ids]
    
    def _quality_filter(self, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """低质量内容过滤"""
        # 这里简化处理，实际应该有更复杂的质量评估逻辑
        return [candidate for candidate in candidates 
                if candidate.get('match_score', 0.0) >= self.quality_threshold]
    
    def _sensitive_filter(self, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """敏感内容过滤"""
        # 这里简化处理，实际应该有更复杂的敏感内容检测逻辑
        return [candidate for candidate in candidates 
                if not candidate.get('is_sensitive', False)]