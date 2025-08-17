from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import uuid

from src.core.config import settings
from src.core.logger import logger
from src.api.v1.api import api_router
from src.core.exceptions import AppException

# 创建FastAPI应用
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求中间件：添加request_id和计算请求耗时
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    # 生成请求ID
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    # 记录请求开始
    start_time = time.time()
    logger.info(
        f"Request started",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
        },
    )
    
    # 处理请求
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request_id
        
        # 记录请求完成
        logger.info(
            f"Request completed",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "status_code": response.status_code,
                "process_time": process_time,
            },
        )
        return response
    except Exception as e:
        # 记录请求异常
        process_time = time.time() - start_time
        logger.error(
            f"Request failed: {str(e)}",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "process_time": process_time,
                "error": str(e),
            },
            exc_info=True,
        )
        raise

# 全局异常处理
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.code,
            "msg": exc.message,
            "data": None,
        },
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled exception: {str(exc)}",
        extra={
            "request_id": getattr(request.state, "request_id", "unknown"),
            "path": request.url.path,
            "method": request.method,
        },
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "code": 500,
            "msg": "Internal server error",
            "data": None,
        },
    )

# 注册API路由
app.include_router(api_router, prefix=settings.API_V1_STR)

# 健康检查端点
@app.get("/healthz")
async def health_check():
    return {"code": 0, "data": {"status": "ok", "version": settings.VERSION}, "msg": ""}

# 启动事件
@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")

# 关闭事件
@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"Shutting down {settings.PROJECT_NAME}")