from typing import Dict, List, Any, Optional
import numpy as np
from datetime import datetime

from src.core.logger import logger
from src.services.rec.nodes.base_node import RankNode

class PreRankNode(RankNode):
    """粗排节点，使用简单规则或轻量级模型进行初步排序"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.model_type = config.get('model_type', 'rule')
        self.rule_weights = config.get('rule_weights', {
            'recency': 0.7,
            'popularity': 0.3
        })
    
    def get_required_fields(self) -> List[str]:
        fields = super().get_required_fields()
        fields.extend(['model_type'])
        return fields
    
    async def rank(self, candidates: List[Dict[str, Any]], user_id: Optional[int], 
                 context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """执行粗排逻辑"""
        if not candidates:
            return []
        
        # 获取trace信息
        trace = context.get('trace')
        if trace:
            trace.add_node_detail(self.node_id, "model_type", self.model_type)
        
        if self.model_type == 'rule':
            # 使用规则进行排序
            return await self._rule_based_rank(candidates, user_id, context)
        elif self.model_type == 'gbdt':
            # 使用轻量级GBDT模型进行排序
            return await self._model_based_rank(candidates, user_id, context)
        elif self.model_type == 'lr':
            # 使用线性回归模型进行排序
            return await self._model_based_rank(candidates, user_id, context)
        else:
            # 默认使用规则排序
            return await self._rule_based_rank(candidates, user_id, context)
    
    async def _rule_based_rank(self, candidates: List[Dict[str, Any]], user_id: Optional[int], 
                             context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """基于规则的排序"""
        now = datetime.now()
        
        # 计算每个候选项的分数
        for candidate in candidates:
            # 初始分数：使用召回分数
            base_score = candidate.get('match_score', 0.0)
            
            # 计算时间新鲜度分数
            recency_score = 0.0
            if 'created_at' in candidate and candidate['created_at']:
                try:
                    created_at = datetime.fromisoformat(candidate['created_at'])
                    # 计算时间差（天）
                    days_diff = (now - created_at).total_seconds() / (24 * 3600)
                    # 使用指数衰减函数
                    recency_score = np.exp(-0.1 * days_diff)  # 10天半衰期
                except (ValueError, TypeError):
                    pass
            
            # 热度分数（如果有）
            popularity_score = candidate.get('popularity', 0.0)
            
            # 计算最终分数
            final_score = (
                base_score * 0.5 +
                recency_score * self.rule_weights.get('recency', 0.7) +
                popularity_score * self.rule_weights.get('popularity', 0.3)
            )
            
            # 更新候选项分数
            candidate['pre_rank_score'] = final_score
        
        # 按分数排序
        ranked_candidates = sorted(candidates, key=lambda x: x.get('pre_rank_score', 0.0), reverse=True)
        
        # 截断结果
        if len(ranked_candidates) > self.rank_size:
            ranked_candidates = ranked_candidates[:self.rank_size]
        
        # 记录trace信息
        if context.get('trace'):
            context['trace'].add_node_detail(self.node_id, "rule_weights", self.rule_weights)
            context['trace'].add_node_detail(self.node_id, "output_size", len(ranked_candidates))
        
        return ranked_candidates
    
    async def _model_based_rank(self, candidates: List[Dict[str, Any]], user_id: Optional[int], 
                              context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """基于模型的排序（简化版）"""
        # 这里是简化实现，实际应该加载预训练模型并进行预测
        # 由于模型加载和预测逻辑较复杂，这里仅做示例
        
        # 模拟模型预测
        for candidate in candidates:
            # 使用召回分数作为基础
            base_score = candidate.get('match_score', 0.0)
            
            # 模拟模型预测分数（实际应该使用特征向量输入模型）
            model_score = base_score * (0.5 + np.random.random() * 0.5)
            
            # 更新候选项分数
            candidate['pre_rank_score'] = model_score
        
        # 按分数排序
        ranked_candidates = sorted(candidates, key=lambda x: x.get('pre_rank_score', 0.0), reverse=True)
        
        # 截断结果
        if len(ranked_candidates) > self.rank_size:
            ranked_candidates = ranked_candidates[:self.rank_size]
        
        # 记录trace信息
        if context.get('trace'):
            context['trace'].add_node_detail(self.node_id, "model_type", self.model_type)
            context['trace'].add_node_detail(self.node_id, "output_size", len(ranked_candidates))
        
        return ranked_candidates