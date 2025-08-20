from fastapi import APIRouter

from src.api.v1.endpoints import posts, events, items, relations, search, ads, ops, metrics

api_router = APIRouter()

# 注册各个模块的路由
api_router.include_router(posts.router, prefix="/posts", tags=["posts"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(relations.router, prefix="/relations", tags=["relations"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(ads.router, prefix="/ads", tags=["ads"])
api_router.include_router(ops.router, prefix="/ops", tags=["ops"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])