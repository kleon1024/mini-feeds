from typing import Dict, List, Any, Optional, Set
from collections import defaultdict

from src.core.logger import logger
from src.services.rec.nodes.base_node import RankNode

class ReRankNode(RankNode):
    """重排节点，考虑多样性和策略约束进行重新排序"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.diversity_weight = config.get('diversity_weight', 0.2)
        self.diversity_fields = config.get('diversity_fields', ['tags', 'author_id'])
        self.max_items_per_key = config.get('max_items_per_key', {'author_id': 2, 'tags': 3})
        self.n_out_m = config.get('n_out_m', {'enabled': False, 'n': 1, 'm': 5, 'key': 'author_id'})
        self.model_type = config.get('model_type', 'diversity')
    
    def get_required_fields(self) -> List[str]:
        fields = super().get_required_fields()
        fields.extend(['diversity_weight', 'diversity_fields', 'model_type'])
        return fields
    
    async def rank(self, candidates: List[Dict[str, Any]], user_id: Optional[int], 
                 context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """执行重排逻辑"""
        if not candidates:
            return []
        
        # 获取trace信息
        trace = context.get('trace')
        if trace:
            trace.add_node_detail(self.node_id, "diversity_weight", self.diversity_weight)
            trace.add_node_detail(self.node_id, "diversity_fields", self.diversity_fields)
            trace.add_node_detail(self.node_id, "model_type", self.model_type)
        
        # 获取原始排序分数
        for i, candidate in enumerate(candidates):
            # 使用排序分数或预排序分数
            original_score = candidate.get('rank_score', 
                                         candidate.get('pre_rank_score', 
                                                     candidate.get('match_score', 0.0)))
            # 保存原始分数和位置
            candidate['original_score'] = original_score
            candidate['original_position'] = i
        
        # 应用多样性重排
        if self.diversity_weight > 0:
            reranked_candidates = self._diversity_rerank(candidates)
            if trace:
                trace.add_node_detail(self.node_id, "rerank_method", "diversity")
        else:
            reranked_candidates = candidates
            if trace:
                trace.add_node_detail(self.node_id, "rerank_method", "none")
        
        # 应用N出M策略（如果启用）
        if self.n_out_m.get('enabled', False):
            reranked_candidates = self._apply_n_out_m(reranked_candidates)
            if trace:
                trace.add_node_detail(self.node_id, "n_out_m_applied", True)
                trace.add_node_detail(self.node_id, "n_out_m_config", self.n_out_m)
        
        # 更新最终排序分数
        for i, candidate in enumerate(reranked_candidates):
            candidate['rerank_score'] = candidate.get('original_score', 0.0)
            candidate['final_position'] = i
        
        # 记录trace信息
        if trace:
            trace.add_node_detail(self.node_id, "output_size", len(reranked_candidates))
        
        return reranked_candidates
    
    def _diversity_rerank(self, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """多样性重排算法"""
        # 贪心多样性算法
        # 1. 选择得分最高的项作为第一个结果
        # 2. 迭代选择后续项时，考虑原始分数和与已选项的多样性
        
        if not candidates:
            return []
        
        # 按原始分数排序
        sorted_candidates = sorted(candidates, key=lambda x: x.get('original_score', 0.0), reverse=True)
        
        # 选择第一个项
        result = [sorted_candidates[0]]
        remaining = sorted_candidates[1:]
        
        # 已选项的特征值集合
        selected_values = defaultdict(set)
        for field in self.diversity_fields:
            if field == 'tags':
                # 标签是列表，需要特殊处理
                for tag in result[0].get('tags', []):
                    selected_values[field].add(tag)
            else:
                # 其他字段是单值
                value = result[0].get(field)
                if value is not None:
                    selected_values[field].add(value)
        
        # 已选项的计数
        selected_counts = defaultdict(lambda: defaultdict(int))
        for field in self.diversity_fields:
            if field == 'tags':
                for tag in result[0].get('tags', []):
                    selected_counts[field][tag] += 1
            else:
                value = result[0].get(field)
                if value is not None:
                    selected_counts[field][value] += 1
        
        # 迭代选择后续项
        while remaining and len(result) < self.rank_size:
            best_score = -float('inf')
            best_item = None
            best_index = -1
            
            for i, item in enumerate(remaining):
                # 计算多样性惩罚
                diversity_penalty = 0.0
                
                for field in self.diversity_fields:
                    max_items = self.max_items_per_key.get(field, 2)
                    
                    if field == 'tags':
                        # 标签是列表，计算与已选标签的重叠
                        overlap = 0
                        for tag in item.get('tags', []):
                            if tag in selected_values[field]:
                                count = selected_counts[field][tag]
                                if count >= max_items:
                                    overlap += 1
                        
                        # 标签重叠率
                        tags_count = len(item.get('tags', []))
                        if tags_count > 0:
                            overlap_ratio = overlap / tags_count
                            diversity_penalty += overlap_ratio
                    else:
                        # 其他字段是单值
                        value = item.get(field)
                        if value is not None and value in selected_values[field]:
                            count = selected_counts[field][value]
                            if count >= max_items:
                                diversity_penalty += 1.0
                
                # 计算综合分数：原始分数 - 多样性惩罚 * 权重
                score = item.get('original_score', 0.0) - diversity_penalty * self.diversity_weight
                
                if score > best_score:
                    best_score = score
                    best_item = item
                    best_index = i
            
            if best_item is None:
                break
            
            # 添加到结果集
            result.append(best_item)
            # 从候选集移除
            remaining.pop(best_index)
            
            # 更新已选项的特征值集合和计数
            for field in self.diversity_fields:
                if field == 'tags':
                    for tag in best_item.get('tags', []):
                        selected_values[field].add(tag)
                        selected_counts[field][tag] += 1
                else:
                    value = best_item.get(field)
                    if value is not None:
                        selected_values[field].add(value)
                        selected_counts[field][value] += 1
        
        return result
    
    def _apply_n_out_m(self, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """应用N出M策略"""
        # N出M策略：对于某个特征，每M个结果中最多包含N个相同值
        # 例如：1出5策略，每5个结果中最多包含1个相同作者的内容
        
        if not candidates:
            return []
        
        n = self.n_out_m.get('n', 1)
        m = self.n_out_m.get('m', 5)
        key = self.n_out_m.get('key', 'author_id')
        
        if n >= m or n <= 0 or m <= 0:
            return candidates  # 无效配置，直接返回原始结果
        
        result = []
        window_counts = defaultdict(int)
        window_size = 0
        
        for item in candidates:
            value = item.get(key)
            
            if window_size < m:
                # 当前窗口未满
                if value is not None and window_counts[value] < n:
                    # 可以添加到结果集
                    result.append(item)
                    window_counts[value] += 1
                    window_size += 1
            else:
                # 当前窗口已满，重置计数
                window_counts = defaultdict(int)
                window_size = 0
                
                # 添加当前项
                if value is not None:
                    result.append(item)
                    window_counts[value] += 1
                    window_size += 1
        
        return result