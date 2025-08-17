import logging
import sys
import json
from typing import Dict, Any

from src.core.config import settings

class JsonFormatter(logging.Formatter):
    """JSON格式的日志格式化器"""
    def format(self, record: logging.LogRecord) -> str:
        log_record: Dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # 添加额外字段
        if hasattr(record, "request_id"):
            log_record["request_id"] = record.request_id
        if hasattr(record, "user_id"):
            log_record["user_id"] = record.user_id
        if hasattr(record, "path"):
            log_record["path"] = record.path
        if hasattr(record, "method"):
            log_record["method"] = record.method
        if hasattr(record, "status_code"):
            log_record["status_code"] = record.status_code
        if hasattr(record, "process_time"):
            log_record["latency_ms"] = round(record.process_time * 1000, 2)
        if hasattr(record, "error"):
            log_record["error"] = record.error
        
        # 添加异常信息
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_record, ensure_ascii=False)

# 创建日志处理器
def setup_logger() -> logging.Logger:
    logger = logging.getLogger("mini-feeds")
    
    # 设置日志级别
    log_level = getattr(logging, settings.LOG_LEVEL.upper())
    logger.setLevel(log_level)
    
    # 创建控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(JsonFormatter())
    logger.addHandler(console_handler)
    
    # 防止日志重复
    logger.propagate = False
    
    return logger

# 创建全局日志实例
logger = setup_logger()