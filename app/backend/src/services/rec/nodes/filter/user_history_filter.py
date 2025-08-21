from typing import Dict, List, Any, Optional, Set
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from src.core.logger import logger
from src.services.rec.nodes.base_node import FilterNode
from src.db.models import Event

class UserHistoryFilterNode(FilterNode):
    """用户历史过滤节点，过滤用户已经看过的内容"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, config)
        self.event_types = config.get('event_types', ['impression', 'click'])
        self.time_window = config.get('time_window', '7d')  # 默认7天
    
    def get_required_fields(self) -> List[str]:
        fields = super().get_required_fields()
        fields.extend(['event_types'])
        return fields
    
    def _parse_time_window(self, window: str) -> timedelta:
        """解析时间窗口字符串为timedelta"""
        unit = window[-1]
        value = int(window[:-1])
        
        if unit == 'h':
            return timedelta(hours=value)
        elif unit == 'd':
            return timedelta(days=value)
        elif unit == 'w':
            return timedelta(weeks=value)
        else:
            # 默认为1天
            return timedelta(days=1)
    
    async def filter(self, candidates: List[Dict[str, Any]], user_id: Optional[int], 
                   context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """执行过滤逻辑"""
        if not candidates or not user_id:
            return candidates
        
        # 获取trace信息
        trace = context.get('trace')
        if trace:
            trace.add_node_detail(self.node_id, "event_types", self.event_types)
            trace.add_node_detail(self.node_id, "time_window", self.time_window)
            trace.add_node_detail(self.node_id, "input_size", len(candidates))
        
        # 获取数据库会话
        db = context.get('db')
        if not db:
            logger.warning("缺少数据库会话，无法执行用户历史过滤")
            if trace:
                trace.add_node_detail(self.node_id, "error", "missing_db_session")
            return candidates
        
        # 计算时间窗口
        time_delta = self._parse_time_window(self.time_window)
        start_time = datetime.now() - time_delta
        
        # 查询用户历史交互的内容
        query = select(Event.item_id).where(
            and_(
                Event.user_id == user_id,
                Event.event_type.in_(self.event_types),
                Event.ts >= start_time
            )
        )
        
        result = await db.execute(query)
        history_ids = {row[0] for row in result.fetchall()}
        
        # 过滤掉用户已经看过的内容
        filtered_candidates = [candidate for candidate in candidates 
                              if candidate.get('id') not in history_ids]
        
        # 记录trace信息
        if trace:
            trace.add_node_detail(self.node_id, "history_count", len(history_ids))
            trace.add_node_detail(self.node_id, "filtered_count", len(candidates) - len(filtered_candidates))
            trace.add_node_detail(self.node_id, "output_size", len(filtered_candidates))
        
        return filtered_candidates