from typing import Any, Dict, Optional

class AppException(Exception):
    """应用异常基类"""
    def __init__(
        self,
        code: int,
        message: str,
        status_code: int = 400,
        data: Optional[Dict[str, Any]] = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.data = data or {}
        super().__init__(self.message)

class DatabaseException(AppException):
    """数据库异常"""
    def __init__(self, message: str = "数据库操作失败", data: Optional[Dict[str, Any]] = None):
        super().__init__(code=5001, message=message, status_code=500, data=data)

class ValidationException(AppException):
    """数据验证异常"""
    def __init__(self, message: str = "数据验证失败", data: Optional[Dict[str, Any]] = None):
        super().__init__(code=4001, message=message, status_code=400, data=data)

class NotFoundException(AppException):
    """资源不存在异常"""
    def __init__(self, message: str = "资源不存在", data: Optional[Dict[str, Any]] = None):
        super().__init__(code=4004, message=message, status_code=404, data=data)

class AuthenticationException(AppException):
    """认证异常"""
    def __init__(self, message: str = "认证失败", data: Optional[Dict[str, Any]] = None):
        super().__init__(code=4010, message=message, status_code=401, data=data)

class AuthorizationException(AppException):
    """授权异常"""
    def __init__(self, message: str = "没有操作权限", data: Optional[Dict[str, Any]] = None):
        super().__init__(code=4030, message=message, status_code=403, data=data)

class RateLimitException(AppException):
    """频率限制异常"""
    def __init__(self, message: str = "请求过于频繁", data: Optional[Dict[str, Any]] = None):
        super().__init__(code=4290, message=message, status_code=429, data=data)

class ExternalServiceException(AppException):
    """外部服务异常"""
    def __init__(self, message: str = "外部服务调用失败", data: Optional[Dict[str, Any]] = None):
        super().__init__(code=5002, message=message, status_code=500, data=data)