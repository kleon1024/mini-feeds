from typing import Dict, List, Any, Optional
from collections import defaultdict

from src.core.logger import logger
from src.services.rec.nodes.base_node import FilterNode

class NOutMFilterNode(FilterNode):
    """N出M过滤节点，实现N出M策略"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.n = config.get('n', 1)
        self.m = config.get('m', 5)
        self.key = config.get('key', 'author_id')
        self.preserve_order = config.get('preserve_order', True)
    
    def get_required_fields(self) -> List[str]:
        fields = super().get_required_fields()
        fields.extend(['n', 'm', 'key'])
        return fields
    
    async def filter(self, candidates: List[Dict[str, Any]], user_id: Optional[int], 
                   context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """执行过滤逻辑"""
        if not candidates:
            return []
        
        # 获取trace信息
        trace = context.get('trace')
        if trace:
            trace.add_node_detail(self.node_id, "n", self.n)
            trace.add_node_detail(self.node_id, "m", self.m)
            trace.add_node_detail(self.node_id, "key", self.key)
            trace.add_node_detail(self.node_id, "input_size", len(candidates))
        
        # 检查配置是否有效
        if self.n >= self.m or self.n <= 0 or self.m <= 0:
            logger.warning(f"无效的N出M配置: n={self.n}, m={self.m}")
            if trace:
                trace.add_node_detail(self.node_id, "error", "invalid_config")
            return candidates
        
        # 如果需要保持原始顺序，先记录位置
        if self.preserve_order:
            for i, candidate in enumerate(candidates):
                candidate['_original_position'] = i
        
        # 应用N出M策略
        result = []
        window_counts = defaultdict(int)
        window_size = 0
        
        for item in candidates:
            value = item.get(self.key)
            
            if window_size < self.m:
                # 当前窗口未满
                if value is not None and window_counts[value] < self.n:
                    # 可以添加到结果集
                    result.append(item)
                    window_counts[value] += 1
                    window_size += 1
                # 如果不满足条件，跳过此项
            else:
                # 当前窗口已满，重置计数
                window_counts = defaultdict(int)
                window_size = 0
                
                # 添加当前项
                if value is not None:
                    result.append(item)
                    window_counts[value] += 1
                    window_size += 1
        
        # 如果需要保持原始顺序，按原始位置排序
        if self.preserve_order:
            result.sort(key=lambda x: x.pop('_original_position'))
        
        # 记录trace信息
        if trace:
            trace.add_node_detail(self.node_id, "filtered_count", len(candidates) - len(result))
            trace.add_node_detail(self.node_id, "output_size", len(result))
        
        return result