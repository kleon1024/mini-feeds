from typing import Dict, List, Any, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.services.rec.nodes.base_node import RecallNode

class MultiHopRecallNode(RecallNode):
    """基于多跳关系的召回节点"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.max_hops = config.get('max_hops', 2)
        self.relation_types = config.get('relation_types', ['like', 'favorite'])
        self.hop_decay = config.get('hop_decay', 0.5)
    
    def get_required_fields(self) -> List[str]:
        fields = super().get_required_fields()
        fields.extend(['max_hops', 'relation_types', 'hop_decay'])
        return fields
    
    async def recall(self, db: AsyncSession, user_id: Optional[int], 
                    context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """基于多跳关系网络进行召回"""
        if not user_id:
            # 未登录用户，返回空列表
            return []
        
        # 获取trace信息
        trace = context.get('trace')
        if trace:
            trace.add_node_detail(self.node_id, "user_id", user_id)
            trace.add_node_detail(self.node_id, "max_hops", self.max_hops)
            trace.add_node_detail(self.node_id, "relation_types", self.relation_types)
        
        # 多跳召回的基本思路：
        # 1. 找出用户直接交互过的内容（第1跳）
        # 2. 找出与这些内容有相同交互的其他用户（第2跳）
        # 3. 找出这些用户交互过的其他内容（第3跳）
        # 每一跳都应用权重衰减
        
        # 使用CTE递归查询实现多跳
        query_text = """
        WITH RECURSIVE
        -- 用户直接交互的内容（第1跳）
        hop1 AS (
            SELECT 
                r.entity_id as item_id,
                r.relation_type,
                1 as hop,
                1.0 as weight
            FROM 
                rel.user_entity_relations r
            WHERE 
                r.user_id = :user_id
                AND r.entity_type = 'item'
                AND r.relation_type IN :relation_types
                AND r.status = 'active'
        ),
        -- 递归查询多跳关系
        hops AS (
            SELECT * FROM hop1
            UNION ALL
            SELECT 
                r2.entity_id as item_id,
                r2.relation_type,
                h.hop + 1 as hop,
                h.weight * :hop_decay as weight
            FROM 
                hops h
            JOIN 
                rel.user_entity_relations r1 ON h.item_id = r1.entity_id
            JOIN 
                rel.user_entity_relations r2 ON r1.user_id = r2.user_id
            WHERE 
                h.hop < :max_hops
                AND r1.entity_type = 'item'
                AND r2.entity_type = 'item'
                AND r1.relation_type IN :relation_types
                AND r2.relation_type IN :relation_types
                AND r1.status = 'active'
                AND r2.status = 'active'
                AND r2.entity_id != h.item_id
                AND r2.entity_id NOT IN (SELECT item_id FROM hop1)
        ),
        -- 聚合每个内容的权重
        item_weights AS (
            SELECT 
                item_id,
                SUM(weight) as total_weight
            FROM 
                hops
            GROUP BY 
                item_id
            ORDER BY 
                total_weight DESC
            LIMIT :limit
        )
        -- 获取内容详情
        SELECT 
            i.id,
            i.title,
            i.content,
            i.tags,
            i.author_id,
            i.created_at,
            i.kind,
            iw.total_weight as match_score
        FROM 
            item_weights iw
        JOIN 
            app.items i ON iw.item_id = i.id
        WHERE
            i.kind = 'content'
        ORDER BY 
            match_score DESC
        """
        
        # 准备参数
        params = {
            'user_id': user_id,
            'relation_types': tuple(self.relation_types),
            'max_hops': self.max_hops,
            'hop_decay': self.hop_decay,
            'limit': self.recall_size
        }
        
        try:
            # 执行查询
            result = await db.execute(text(query_text), params)
            rows = result.fetchall()
            
            # 构建候选项列表
            candidates = []
            for row in rows:
                # 将行转换为字典
                item = dict(row._mapping)
                
                # 添加召回类型
                item['recall_type'] = 'multi_hop'
                
                # 格式化日期时间
                if 'created_at' in item and item['created_at']:
                    item['created_at'] = item['created_at'].isoformat()
                
                candidates.append(item)
            
            # 记录trace信息
            if trace:
                trace.add_node_detail(self.node_id, "candidates_count", len(candidates))
            
            logger.debug(f"多跳召回数量: {len(candidates)}")
            return candidates
            
        except Exception as e:
            error_msg = f"多跳召回失败: {str(e)}"
            logger.error(error_msg)
            
            if trace:
                trace.add_error(self.node_id, error_msg)
            
            # 出错时返回空列表
            return []