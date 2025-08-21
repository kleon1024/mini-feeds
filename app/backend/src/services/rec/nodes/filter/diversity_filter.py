from typing import Dict, List, Any, Optional, Set
from collections import defaultdict

from src.core.logger import logger
from src.services.rec.nodes.base_node import FilterNode

class DiversityFilterNode(FilterNode):
    """多样性过滤节点，限制特定字段的最大出现次数"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.diversity_fields = config.get('diversity_fields', ['tags', 'author_id'])
        self.max_items_per_key = config.get('max_items_per_key', {'author_id': 2, 'tags': 3})
    
    def get_required_fields(self) -> List[str]:
        fields = super().get_required_fields()
        fields.extend(['diversity_fields'])
        return fields
    
    async def filter(self, candidates: List[Dict[str, Any]], user_id: Optional[int], 
                   context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """执行过滤逻辑"""
        if not candidates:
            return []
        
        # 获取trace信息
        trace = context.get('trace')
        if trace:
            trace.add_node_detail(self.node_id, "diversity_fields", self.diversity_fields)
            trace.add_node_detail(self.node_id, "max_items_per_key", self.max_items_per_key)
            trace.add_node_detail(self.node_id, "input_size", len(candidates))
        
        # 按分数排序，确保保留分数高的项
        sorted_candidates = sorted(candidates, 
                                  key=lambda x: x.get('rank_score', 
                                                   x.get('pre_rank_score', 
                                                        x.get('match_score', 0.0))), 
                                  reverse=True)
        
        # 字段值计数
        field_counts = {field: defaultdict(int) for field in self.diversity_fields}
        
        # 过滤结果
        result = []
        for candidate in sorted_candidates:
            # 检查是否超过多样性限制
            should_keep = True
            
            for field in self.diversity_fields:
                max_count = self.max_items_per_key.get(field, 2)
                
                if field == 'tags':
                    # 标签是列表，需要特殊处理
                    for tag in candidate.get('tags', []):
                        if field_counts[field][tag] >= max_count:
                            should_keep = False
                            break
                else:
                    # 其他字段是单值
                    value = candidate.get(field)
                    if value is not None and field_counts[field][value] >= max_count:
                        should_keep = False
                        break
            
            if should_keep:
                # 更新计数并添加到结果
                for field in self.diversity_fields:
                    if field == 'tags':
                        for tag in candidate.get('tags', []):
                            field_counts[field][tag] += 1
                    else:
                        value = candidate.get(field)
                        if value is not None:
                            field_counts[field][value] += 1
                
                result.append(candidate)
        
        # 记录trace信息
        if trace:
            trace.add_node_detail(self.node_id, "filtered_count", len(candidates) - len(result))
            trace.add_node_detail(self.node_id, "field_counts", {k: dict(v) for k, v in field_counts.items()})
            trace.add_node_detail(self.node_id, "output_size", len(result))
        
        return result