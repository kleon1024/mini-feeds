from typing import List, Optional, Dict, Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import uuid
from datetime import datetime

from src.db.models import Item, User
from src.db.schemas import FeedItem
from src.core.logger import logger

async def get_random_items(db: AsyncSession, count: int, offset: int = 0) -> List[FeedItem]:
    """
    从数据库随机获取指定数量的内容项
    
    Args:
        db: 数据库会话
        count: 需要获取的内容数量
        offset: 偏移量，用于分页
        
    Returns:
        List[FeedItem]: 内容项列表
    """
    # 构建查询，包括关联的作者信息
    query = (
        select(Item)
        .options(selectinload(Item.author))
        # .where(Item.kind == 'content')
        .order_by(func.random())
        .limit(count)
        .offset(offset)
    )
    
    # 记录SQL语句，用于调试
    logger.debug("SQL query", extra={"query": str(query), "count": count, "offset": offset})
    
    # 执行查询
    result = await db.execute(query)
    items_db = result.scalars().all()
    
    # 将数据库模型转换为API响应模型
    feed_items: List[FeedItem] = []
    
    for i, item_db in enumerate(items_db):
        position = offset + i + 1
        
        # 创建基本的FeedItem结构
        feed_item = FeedItem(
            type=item_db.kind,
            id=str(item_db.id),
            score=0.9 - (i * 0.01),  # 简单的递减分数
            position=position,
            reason="根据你的兴趣推荐" if item_db.kind == "content" else None,
            tracking={
                "event_token": f"token-{uuid.uuid4()}",
                "trace_id": f"trace-{uuid.uuid4()}",
            },
        )
        
        # 根据类型设置不同的内容
        if item_db.kind == "content":
            feed_item.content = {
                "title": item_db.title,
                "description": item_db.content,
                "author": {
                    "id": item_db.author_id,
                    "name": item_db.author.username if item_db.author else "未知作者"
                },
                "created_at": item_db.created_at.isoformat(),
                "media": item_db.media,
                "tags": item_db.tags,
            }
        elif item_db.kind == "ad":
            feed_item.ad = {
                "title": item_db.title,
                "description": item_db.content,
                "advertiser": {
                    "id": item_db.author_id,
                    "name": item_db.author.username if item_db.author else "未知广告主"
                },
                "image_url": item_db.media.get("image_url") if item_db.media else None,
                "landing_url": item_db.media.get("landing_url", "#") if item_db.media else "#",
                "cta": "立即查看",
            }
        elif item_db.kind == "product":
            feed_item.product = {
                "title": item_db.title,
                "description": item_db.content,
                "price": item_db.media.get("price", 99.9) if item_db.media else 99.9,
                "original_price": item_db.media.get("original_price", 199.9) if item_db.media else 199.9,
                "seller": {
                    "id": item_db.author_id,
                    "name": item_db.author.username if item_db.author else "未知卖家"
                },
                "image_url": item_db.media.get("image_url") if item_db.media else None,
                "sales": item_db.media.get("sales", 100) if item_db.media else 100,
            }
            
        feed_items.append(feed_item)
    
    return feed_items

# 为未来扩展预留的接口
async def get_recommended_items(db: AsyncSession, user_id: Optional[int], count: int, offset: int = 0, **kwargs) -> List[FeedItem]:
    """
    获取推荐内容项（未来扩展用）
    
    Args:
        db: 数据库会话
        user_id: 用户ID，用于个性化推荐
        count: 需要获取的内容数量
        offset: 偏移量，用于分页
        **kwargs: 其他参数，如场景、设备、地理位置等
        
    Returns:
        List[FeedItem]: 推荐内容项列表
    """
    # 记录参数，用于调试
    logger.debug("Recommendation parameters", extra={"user_id": user_id, "count": count, "offset": offset})
    # 目前简单调用随机获取的方法，未来可以扩展为更复杂的推荐逻辑
    return await get_random_items(db, count, offset)