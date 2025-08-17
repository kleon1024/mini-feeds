from fastapi import APIRouter, Depends, Body, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert
import time

from src.db.session import get_db
from src.db.models import Event
from src.db.schemas import ResponseModel, EventCreate
from src.core.logger import logger

router = APIRouter()

@router.post("", response_model=ResponseModel)
async def create_event(
    event: EventCreate = Body(...),
    idempotency_key: str = Header(None),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel:
    """创建事件（埋点）
    
    用于记录用户行为事件，如曝光、点击、停留等
    """
    # 记录请求开始时间
    start_time = time.time()
    
    # 记录请求参数
    logger.info(
        f"Create event request",
        extra={
            "user_id": event.user_id,
            "item_id": event.item_id,
            "event_type": event.event_type,
            "source": event.source,
            "idempotency_key": idempotency_key,
        },
    )
    
    try:
        # 准备事件数据
        event_data = {
            "item_id": event.item_id,
            "event_type": event.event_type,
            "source": event.source,
            "staytime_ms": event.staytime_ms,
            "gmv_amount": event.gmv_amount,
            "extra": event.extra,
        }
        
        # 如果有用户ID，则添加到事件数据中
        if event.user_id is not None:
            event_data["user_id"] = event.user_id
            
        # 插入事件数据
        stmt = insert(Event).values(**event_data)
        result = await db.execute(stmt)
        await db.commit()
        
        # 计算请求耗时
        process_time = time.time() - start_time
        logger.info(
            f"Create event success",
            extra={
                "user_id": event.user_id,
                "item_id": event.item_id,
                "event_type": event.event_type,
                "process_time": process_time,
            },
        )
        
        # 返回成功响应
        return ResponseModel(
            code=0,
            data={"success": True},
            msg="",
        )
    except Exception as e:
        # 记录错误
        logger.error(
            f"Create event failed: {str(e)}",
            extra={
                "user_id": event.user_id,
                "item_id": event.item_id,
                "event_type": event.event_type,
                "error": str(e),
            },
            exc_info=True,
        )
        
        # 返回错误响应
        return ResponseModel(
            code=5001,
            data=None,
            msg=f"创建事件失败: {str(e)}",
        )