from typing import Dict, List, Any, Optional
import uuid
import time
from datetime import datetime

class TraceInfo:
    """追踪信息类，用于记录推荐系统各节点的执行信息"""
    
    def __init__(self, trace_id: Optional[str] = None):
        # 如果没有提供trace_id，则生成一个新的
        self.trace_id = trace_id or f"trace-{uuid.uuid4()}"
        self.start_time = time.time()
        self.end_time: Optional[float] = None
        # 节点执行信息
        self.node_infos: Dict[str, Dict[str, Any]] = {}
        # 全局信息
        self.global_info: Dict[str, Any] = {
            "start_time": datetime.now().isoformat(),
            "user_id": None,
            "status": "running",
        }
        # 错误信息
        self.errors: List[Dict[str, Any]] = []
    
    def start_node(self, node_id: str, node_type: str) -> None:
        """记录节点开始执行"""
        self.node_infos[node_id] = {
            "node_id": node_id,
            "node_type": node_type,
            "start_time": time.time(),
            "end_time": None,
            "status": "running",
            "input_count": 0,
            "output_count": 0,
            "details": {},
        }
    
    def end_node(self, node_id: str, status: str = "success", 
                output_count: Optional[int] = None, 
                details: Optional[Dict[str, Any]] = None) -> None:
        """记录节点结束执行"""
        if node_id not in self.node_infos:
            return
        
        self.node_infos[node_id]["end_time"] = time.time()
        self.node_infos[node_id]["status"] = status
        
        if output_count is not None:
            self.node_infos[node_id]["output_count"] = output_count
        
        if details:
            self.node_infos[node_id]["details"].update(details)
    
    def set_node_input_count(self, node_id: str, count: int) -> None:
        """设置节点输入数量"""
        if node_id in self.node_infos:
            self.node_infos[node_id]["input_count"] = count
    
    def add_node_detail(self, node_id: str, key: str, value: Any) -> None:
        """添加节点详细信息"""
        if node_id in self.node_infos:
            self.node_infos[node_id]["details"][key] = value
    
    def add_error(self, node_id: str, error_msg: str, error_type: str = "node_error") -> None:
        """添加错误信息"""
        error_info = {
            "time": time.time(),
            "node_id": node_id,
            "error_type": error_type,
            "error_msg": error_msg,
        }
        self.errors.append(error_info)
        
        # 更新节点状态
        if node_id in self.node_infos:
            self.node_infos[node_id]["status"] = "error"
    
    def set_user_id(self, user_id: Optional[int]) -> None:
        """设置用户ID"""
        self.global_info["user_id"] = user_id
    
    def complete(self, status: str = "success") -> None:
        """完成追踪"""
        self.end_time = time.time()
        self.global_info["status"] = status
        self.global_info["end_time"] = datetime.now().isoformat()
        self.global_info["duration_ms"] = int((self.end_time - self.start_time) * 1000)
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "trace_id": self.trace_id,
            "global": self.global_info,
            "nodes": self.node_infos,
            "errors": self.errors,
        }
    
    def get_node_duration_ms(self, node_id: str) -> Optional[int]:
        """获取节点执行时长（毫秒）"""
        if node_id not in self.node_infos:
            return None
        
        node_info = self.node_infos[node_id]
        if node_info["end_time"] is None:
            return None
        
        return int((node_info["end_time"] - node_info["start_time"]) * 1000)
    
    def get_total_duration_ms(self) -> Optional[int]:
        """获取总执行时长（毫秒）"""
        if self.end_time is None:
            return None
        
        return int((self.end_time - self.start_time) * 1000)