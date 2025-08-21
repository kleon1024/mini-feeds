from typing import Dict, List, Any, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.services.rec.nodes.base_node import RecallNode

class VectorRecallNode(RecallNode):
    """基于向量的召回节点"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.vector_field = config.get('vector_field', 'emb')
        self.distance_metric = config.get('distance_metric', 'cosine')
        self.min_score = config.get('min_score', 0.7)
    
    def get_required_fields(self) -> List[str]:
        fields = super().get_required_fields()
        fields.extend(['vector_field', 'distance_metric'])
        return fields
    
    async def recall(self, db: AsyncSession, user_id: Optional[int], 
                    context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """基于向量相似度进行召回"""
        if not user_id:
            # 未登录用户，返回空列表
            return []
        
        # 获取trace信息
        trace = context.get('trace')
        if trace:
            trace.add_node_detail(self.node_id, "user_id", user_id)
            trace.add_node_detail(self.node_id, "distance_metric", self.distance_metric)
            trace.add_node_detail(self.node_id, "min_score", self.min_score)
        
        # 获取用户向量
        # 这里假设有一个用户向量表或视图
        # 实际实现可能需要根据项目具体情况调整
        user_vector_query = """
        SELECT user_id, user_embedding as emb
        FROM feature.user_embeddings
        WHERE user_id = :user_id
        """
        
        try:
            result = await db.execute(text(user_vector_query), {'user_id': user_id})
            user_vector_row = result.fetchone()
            
            if not user_vector_row:
                # 用户没有向量表示，返回空列表
                if trace:
                    trace.add_node_detail(self.node_id, "error", "user_vector_not_found")
                return []
            
            user_vector = user_vector_row._mapping['emb']
            
            # 使用pgvector进行向量检索
            # 根据距离度量选择操作符
            operator = "<=>" if self.distance_metric == "cosine" else "<->"
            
            vector_query = f"""
            SELECT 
                i.id,
                i.title,
                i.content,
                i.tags,
                i.author_id,
                i.created_at,
                i.kind,
                ie.emb {operator} :user_vector AS similarity_score
            FROM 
                feature.item_embeddings ie
            JOIN 
                app.items i ON ie.item_id = i.id
            WHERE 
                i.kind = 'content'
                AND (ie.emb {operator} :user_vector) < :threshold
            ORDER BY 
                similarity_score
            LIMIT :limit
            """
            
            # 准备参数
            # 对于余弦相似度，阈值是1-min_score（因为余弦距离=1-余弦相似度）
            threshold = 1 - self.min_score if self.distance_metric == "cosine" else self.min_score
            
            params = {
                'user_vector': user_vector,
                'threshold': threshold,
                'limit': self.recall_size
            }
            
            # 执行查询
            result = await db.execute(text(vector_query), params)
            rows = result.fetchall()
            
            # 构建候选项列表
            candidates = []
            for row in rows:
                # 将行转换为字典
                item = dict(row._mapping)
                
                # 添加召回类型
                item['recall_type'] = 'vector'
                
                # 对于余弦相似度，转换回相似度分数（而非距离）
                similarity = item.pop('similarity_score', 0.0)
                if self.distance_metric == "cosine":
                    item['match_score'] = 1 - similarity
                else:
                    item['match_score'] = similarity
                
                # 格式化日期时间
                if 'created_at' in item and item['created_at']:
                    item['created_at'] = item['created_at'].isoformat()
                
                candidates.append(item)
            
            # 记录trace信息
            if trace:
                trace.add_node_detail(self.node_id, "candidates_count", len(candidates))
            
            logger.debug(f"向量召回数量: {len(candidates)}")
            return candidates
            
        except Exception as e:
            error_msg = f"向量召回失败: {str(e)}"
            logger.error(error_msg)
            
            if trace:
                trace.add_error(self.node_id, error_msg)
            
            # 出错时返回空列表
            return []