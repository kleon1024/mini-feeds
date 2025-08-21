from typing import Dict, List, Any, Optional, Set
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.services.rec.trace import TraceInfo

class RecNode:
    """推荐系统节点基类"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        self.node_id = node_id
        self.config = config
        self.enabled = config.get('enabled', True)
        
        # 检查必要配置
        self._check_required_fields()
    
    def get_required_fields(self) -> List[str]:
        """获取必要的配置字段，子类可以重写此方法以添加更多字段"""
        return ['enabled']
    
    def _check_required_fields(self) -> None:
        """检查必要的配置字段"""
        required_fields = self.get_required_fields()
        for field in required_fields:
            if field not in self.config:
                raise ValueError(f"节点 {self.node_id} 缺少必要配置: {field}")
    
    async def process(self, data: Any, context: Dict[str, Any]) -> Any:
        """处理数据，子类必须实现此方法"""
        raise NotImplementedError("子类必须实现process方法")
    
    async def safe_process(self, data: Any, context: Dict[str, Any]) -> Any:
        """安全处理数据，包含错误处理和追踪"""
        # 获取trace信息
        trace: Optional[TraceInfo] = context.get('trace')
        
        # 如果节点未启用，直接返回输入数据
        if not self.enabled:
            if trace:
                trace.add_node_detail(self.node_id, "skipped", True)
                trace.add_node_detail(self.node_id, "reason", "node_disabled")
            return data
        
        try:
            # 记录开始处理
            if trace:
                trace.start_node(self.node_id, self.__class__.__name__)
                if isinstance(data, list):
                    trace.set_node_input_count(self.node_id, len(data))
            
            # 处理数据
            result = await self.process(data, context)
            
            # 记录处理结果
            if trace:
                status = "success"
                output_count = len(result) if isinstance(result, list) else 0
                trace.end_node(self.node_id, status, output_count)
            
            return result
        except Exception as e:
            # 记录错误
            error_msg = f"{self.__class__.__name__} 处理失败: {str(e)}"
            logger.error(error_msg)
            
            if trace:
                trace.add_error(self.node_id, error_msg)
                trace.end_node(self.node_id, "error")
            
            # 尝试回滚事务
            db = context.get('db')
            if db:
                try:
                    await db.rollback()
                    logger.info(f"节点 {self.node_id} 执行失败，已回滚事务")
                except Exception as rollback_error:
                    logger.error(f"回滚事务失败: {str(rollback_error)}")
            
            # 返回输入数据作为降级策略
            return data

class RecallNode(RecNode):
    """召回节点基类"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.recall_size = config.get('recall_size', 100)
    
    def get_required_fields(self) -> List[str]:
        fields = super().get_required_fields()
        fields.extend(['recall_size'])
        return fields
    
    async def process(self, data: Any, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """处理数据，对于召回节点，输入数据通常被忽略"""
        # 获取数据库会话和用户ID
        db = context.get('db')
        user_id = context.get('user_id')
        
        if not db:
            raise ValueError("缺少数据库会话")
        
        # 调用子类实现的召回方法
        return await self.recall(db, user_id, context)
    
    async def recall(self, db: AsyncSession, user_id: Optional[int], 
                    context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """召回方法，子类必须实现"""
        raise NotImplementedError("子类必须实现recall方法")

class RankNode(RecNode):
    """排序节点基类"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.rank_size = config.get('rank_size', 100)
    
    def get_required_fields(self) -> List[str]:
        fields = super().get_required_fields()
        fields.extend(['rank_size'])
        return fields
    
    async def process(self, candidates: List[Dict[str, Any]], context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """处理数据，对于排序节点，输入数据是候选项列表"""
        # 获取用户ID
        user_id = context.get('user_id')
        
        # 调用子类实现的排序方法
        return await self.rank(candidates, user_id, context)
    
    async def rank(self, candidates: List[Dict[str, Any]], user_id: Optional[int], 
                 context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """排序方法，子类必须实现"""
        raise NotImplementedError("子类必须实现rank方法")

class FilterNode(RecNode):
    """过滤节点基类"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
    
    async def process(self, candidates: List[Dict[str, Any]], context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """处理数据，对于过滤节点，输入数据是候选项列表"""
        # 获取用户ID
        user_id = context.get('user_id')
        
        # 调用子类实现的过滤方法
        return await self.filter(candidates, user_id, context)
    
    async def filter(self, candidates: List[Dict[str, Any]], user_id: Optional[int], 
                   context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """过滤方法，子类必须实现"""
        raise NotImplementedError("子类必须实现filter方法")

class BlendNode(RecNode):
    """混合节点基类"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
    
    async def process(self, candidates_map: Dict[str, List[Dict[str, Any]]], context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """处理数据，对于混合节点，输入数据是多个候选项列表的映射"""
        # 调用子类实现的混合方法
        return await self.blend(candidates_map, context)
    
    async def blend(self, candidates_map: Dict[str, List[Dict[str, Any]]], 
                  context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """混合方法，子类必须实现"""
        raise NotImplementedError("子类必须实现blend方法")

class TransformNode(RecNode):
    """转换节点基类"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
    
    async def process(self, data: Any, context: Dict[str, Any]) -> Any:
        """处理数据，对于转换节点，输入和输出数据类型可能不同"""
        # 调用子类实现的转换方法
        return await self.transform(data, context)
    
    async def transform(self, data: Any, context: Dict[str, Any]) -> Any:
        """转换方法，子类必须实现"""
        raise NotImplementedError("子类必须实现transform方法")