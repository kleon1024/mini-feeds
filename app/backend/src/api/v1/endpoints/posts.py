from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import time
from datetime import datetime

from src.db.session import get_db
from src.db.schemas import ResponseModel, FeedResponse, FeedItem
from src.core.logger import logger
from src.services.blend.mixer import blend_feed

router = APIRouter()

@router.get("", response_model=ResponseModel)
async def get_posts(
    user_id: Optional[int] = Query(None),
    count: int = Query(5, ge=1, le=10),
    cursor: Optional[str] = Query(None),
    scene: str = Query("feed"),
    slot: Optional[str] = Query(None),
    device: Optional[str] = Query(None),
    geo: Optional[str] = Query(None),
    ab: Optional[str] = Query(None),
    debug: bool = Query(False),
    x_user_id: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel:
    """获取帖子流
    
    这个接口返回混排的帖子流，包括内容、广告和商品
    """
    # 记录请求开始时间
    start_time = time.time()
    
    # 获取用户ID（优先使用查询参数，其次使用请求头）
    final_user_id = user_id or (int(x_user_id) if x_user_id else None)
    
    # 解析cursor（如果有）
    offset = 0
    seed = str(uuid.uuid4())[:8]
    if cursor and cursor != "0":
        try:
            cursor_parts = cursor.split(":")
            if len(cursor_parts) >= 2:
                offset = int(cursor_parts[0])
                seed = cursor_parts[1]
        except (ValueError, IndexError):
            pass
    
    # 记录请求参数
    logger.info(
        f"Get posts request",
        extra={
            "user_id": final_user_id,
            "count": count,
            "scene": scene,
            "offset": offset,
            "seed": seed,
        },
    )
    
    # 从混排服务获取内容
    # 目前混排服务内部只调用了推荐服务的随机获取功能
    # 未来可以扩展为更复杂的推荐、广告和商品混排逻辑
    items = await blend_feed(
        db=db,
        user_id=final_user_id,
        count=count,
        offset=offset,
        scene=scene,
        slot=slot,
        device=device,
        geo=geo,
        ab=ab,
        debug=debug
    )
    
    # 生成下一页的cursor
    next_cursor = f"{offset + count}:{seed}"
    
    # 计算请求耗时
    process_time = time.time() - start_time
    logger.info(
        f"Get posts response",
        extra={
            "user_id": final_user_id,
            "count": count,
            "items_count": len(items),
            "process_time": process_time,
        },
    )
    
    # 返回响应
    return ResponseModel(
        code=0,
        data=FeedResponse(
            server_time=datetime.now().isoformat(),
            cursor=next_cursor,
            items=items,
        ),
        msg="",
    )