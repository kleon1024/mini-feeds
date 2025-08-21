from typing import Dict, List, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.services.rec.nodes.base_node import RankNode

class FeatureExtractNode(RankNode):
    """特征抽取节点，为精排准备特征"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.feature_groups = config.get('feature_groups', ['user', 'item', 'context', 'cross'])
        self.cache_ttl = config.get('cache_ttl', 300)  # 缓存有效期（秒）
    
    async def rank(self, candidates: List[Dict[str, Any]], user_id: Optional[int], 
                 context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """抽取特征"""
        if not candidates:
            return []
        
        # 获取trace信息
        trace = context.get('trace')
        if trace:
            trace.add_node_detail(self.node_id, "feature_groups", self.feature_groups)
        
        # 获取数据库会话
        db = context.get('db')
        if not db:
            raise ValueError("缺少数据库会话")
        
        # 抽取用户特征
        user_features = await self._extract_user_features(user_id, db) if user_id else {}
        
        # 为每个候选项抽取特征
        for candidate in candidates:
            # 抽取物品特征
            item_features = self._extract_item_features(candidate)
            
            # 抽取上下文特征
            context_features = self._extract_context_features(context)
            
            # 构建交叉特征
            cross_features = self._extract_cross_features(user_features, item_features, context)
            
            # 合并所有特征
            features = {}
            if 'user' in self.feature_groups:
                features.update({f"user_{k}": v for k, v in user_features.items()})
            if 'item' in self.feature_groups:
                features.update({f"item_{k}": v for k, v in item_features.items()})
            if 'context' in self.feature_groups:
                features.update({f"ctx_{k}": v for k, v in context_features.items()})
            if 'cross' in self.feature_groups:
                features.update({f"cross_{k}": v for k, v in cross_features.items()})
            
            # 将特征添加到候选项
            candidate['features'] = features
        
        # 记录trace信息
        if trace:
            trace.add_node_detail(self.node_id, "feature_count", len(candidates[0]['features']) if candidates else 0)
            trace.add_node_detail(self.node_id, "output_size", len(candidates))
        
        return candidates
    
    async def _extract_user_features(self, user_id: int, db: AsyncSession) -> Dict[str, Any]:
        """抽取用户特征"""
        # 实际实现应该从数据库或缓存中获取用户特征
        # 这里简化处理
        return {
            'id': user_id,
            'activity_level': 0.8,  # 活跃度
            'preference_diversity': 0.6,  # 偏好多样性
        }
    
    def _extract_item_features(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """抽取物品特征"""
        features = {
            'id': item.get('id'),
            'kind': item.get('kind', 'content'),
            'tag_count': len(item.get('tags', [])),
        }
        
        # 添加时间相关特征
        if 'created_at' in item and item['created_at']:
            try:
                created_at = datetime.fromisoformat(item['created_at'])
                now = datetime.now()
                # 计算时间差（天）
                days_diff = (now - created_at).total_seconds() / (24 * 3600)
                features['days_since_creation'] = days_diff
                features['is_recent'] = 1 if days_diff < 7 else 0  # 是否为最近7天内的内容
            except (ValueError, TypeError):
                pass
        
        return features
    
    def _extract_context_features(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """抽取上下文特征"""
        # 从上下文中提取相关信息
        features = {
            'hour_of_day': datetime.now().hour,
            'day_of_week': datetime.now().weekday(),
            'scene': context.get('scene', 'feed'),
            'device': context.get('device', 'unknown'),
        }
        
        return features
    
    def _extract_cross_features(self, user_features: Dict[str, Any], 
                               item_features: Dict[str, Any], 
                               context: Dict[str, Any]) -> Dict[str, Any]:
        """构建交叉特征"""
        # 简化的交叉特征示例
        cross_features = {}
        
        # 用户-物品交叉特征
        if user_features and item_features:
            # 示例：用户活跃度与内容新鲜度的交叉
            activity = user_features.get('activity_level', 0.5)
            is_recent = item_features.get('is_recent', 0)
            cross_features['activity_x_recency'] = activity * is_recent
        
        return cross_features