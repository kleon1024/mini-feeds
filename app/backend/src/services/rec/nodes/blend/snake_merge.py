from typing import Dict, List, Any, Optional
import random
from collections import defaultdict

from src.core.logger import logger
from src.services.rec.nodes.base_node import BlendNode

class SnakeMergeNode(BlendNode):
    """Snake Merge节点，用于交错合并多个召回源的结果"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.source_weights = config.get('source_weights', {})
        self.default_weight = config.get('default_weight', 1.0)
        self.output_size = config.get('output_size', 100)
        self.deduplicate = config.get('deduplicate', True)
        self.random_start = config.get('random_start', True)
    
    def get_required_fields(self) -> List[str]:
        fields = super().get_required_fields()
        fields.extend(['output_size'])
        return fields
    
    async def blend(self, candidates_map: Dict[str, List[Dict[str, Any]]], 
                  context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """交错合并多个召回源的结果"""
        # 如果没有候选项，返回空列表
        if not candidates_map:
            return []
        
        # 获取trace信息
        trace = context.get('trace')
        if trace:
            for source, candidates in candidates_map.items():
                trace.add_node_detail(self.node_id, f"source_{source}_count", len(candidates))
        
        # 准备各个来源的候选项队列
        source_queues = {}
        for source, candidates in candidates_map.items():
            if candidates:  # 只处理非空列表
                source_queues[source] = list(candidates)  # 创建副本，避免修改原始数据
        
        # 如果所有来源都没有候选项，返回空列表
        if not source_queues:
            return []
        
        # 计算每个来源的权重
        weights = {}
        for source in source_queues.keys():
            weights[source] = self.source_weights.get(source, self.default_weight)
        
        # 归一化权重
        total_weight = sum(weights.values())
        if total_weight > 0:
            for source in weights:
                weights[source] /= total_weight
        
        # 根据权重计算每个来源应该贡献的候选项数量
        target_counts = {}
        remaining = self.output_size
        for source, weight in weights.items():
            # 计算目标数量，但不超过该来源的实际候选项数量
            count = min(int(self.output_size * weight), len(source_queues[source]))
            target_counts[source] = count
            remaining -= count
        
        # 分配剩余的名额
        if remaining > 0:
            # 按照候选项数量排序，优先分配给候选项较多的来源
            sorted_sources = sorted(source_queues.keys(), 
                                   key=lambda s: len(source_queues[s]), 
                                   reverse=True)
            
            for source in sorted_sources:
                # 不超过该来源的实际候选项数量
                additional = min(remaining, len(source_queues[source]) - target_counts[source])
                if additional > 0:
                    target_counts[source] += additional
                    remaining -= additional
                
                if remaining <= 0:
                    break
        
        # 记录目标数量
        if trace:
            for source, count in target_counts.items():
                trace.add_node_detail(self.node_id, f"target_{source}_count", count)
        
        # 执行Snake Merge
        result = []
        seen_ids = set()  # 用于去重
        
        # 确定起始来源
        sources = list(source_queues.keys())
        if self.random_start and sources:
            # 随机选择起始来源
            start_idx = random.randint(0, len(sources) - 1)
            sources = sources[start_idx:] + sources[:start_idx]
        
        # 循环直到达到目标数量或所有来源都耗尽
        while len(result) < self.output_size and source_queues:
            for source in list(sources):  # 使用list创建副本，因为我们可能会修改sources
                if source not in source_queues:
                    continue
                
                queue = source_queues[source]
                if not queue:  # 该来源已耗尽
                    del source_queues[source]
                    continue
                
                # 取出候选项
                candidate = queue.pop(0)
                
                # 去重检查
                if self.deduplicate:
                    item_id = candidate.get('id')
                    if item_id in seen_ids:
                        continue
                    seen_ids.add(item_id)
                
                # 添加来源信息
                candidate['source'] = source
                
                # 添加到结果
                result.append(candidate)
                
                # 检查是否达到该来源的目标数量
                if len([c for c in result if c.get('source') == source]) >= target_counts.get(source, 0):
                    del source_queues[source]
                
                # 检查是否达到总目标数量
                if len(result) >= self.output_size:
                    break
            
            # 如果所有来源都已处理完但还未达到目标数量，跳出循环
            if not source_queues:
                break
        
        # 记录最终结果
        if trace:
            source_counts = defaultdict(int)
            for candidate in result:
                source = candidate.get('source', 'unknown')
                source_counts[source] += 1
            
            for source, count in source_counts.items():
                trace.add_node_detail(self.node_id, f"final_{source}_count", count)
        
        return result[:self.output_size]  # 确保不超过目标数量