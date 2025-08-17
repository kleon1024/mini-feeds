from typing import Optional, List, Union
from fastapi import APIRouter, Depends, Path, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.db.session import get_db
from src.db.schemas import ResponseModel, Item, FeedItem
from src.db.models import Item as ItemModel, User as UserModel

router = APIRouter()

@router.get("/list", response_model=ResponseModel)
async def get_items_by_type(kind: str = Query(..., description="Content type: content, ad, product"), limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0), db: AsyncSession = Depends(get_db)) -> ResponseModel:
    """根据类型获取内容列表"""
    # 构建查询，包括关联的作者信息
    query = select(ItemModel).options(selectinload(ItemModel.author)).where(ItemModel.kind == kind)
    
    # 添加分页
    query = query.limit(limit).offset(offset)
    
    # 执行查询
    result = await db.execute(query)
    items_db = result.scalars().all()
    
    # 将数据库模型转换为Pydantic模型列表
    items_data = []
    for item in items_db:
        # 创建基本的FeedItem结构
        feed_item = {
            "type": item.kind,
            "id": str(item.id),
            "score": 1.0,  # 默认分数
            "position": 0,  # 默认位置
            "tracking": {"event_token": f"token_{item.id}", "trace_id": f"trace_{item.id}"},
        }
        
        # 根据内容类型填充相应字段
        if item.kind == "content":
            feed_item["content"] = {
                "title": item.title,
                "description": item.content,
                "author": {"id": item.author_id, "name": item.author.username if item.author else "未知作者"},
                "created_at": item.created_at.isoformat(),
                "media": item.media,
                "tags": item.tags,
            }
        elif item.kind == "ad":
            feed_item["ad"] = {
                "title": item.title,
                "description": item.content,
                "advertiser": {"id": item.author_id, "name": item.author.username if item.author else "未知广告主"},
                "image_url": item.media.get("image_url") if item.media else None,
                "landing_url": item.media.get("landing_url", "#") if item.media else "#",
                "campaign_id": item.media.get("campaign_id", 0) if item.media else 0,
            }
        elif item.kind == "product":
            feed_item["product"] = {
                "title": item.title,
                "description": item.content,
                "price": item.media.get("price", 0) if item.media else 0,
                "original_price": item.media.get("original_price") if item.media else None,
                "image_url": item.media.get("image_url") if item.media else None,
                "seller": {"id": item.author_id, "name": item.author.username if item.author else "未知卖家"},
                "tags": item.tags,
            }
        
        items_data.append(FeedItem.model_validate(feed_item))
    
    return ResponseModel(
        code=0,
        data=items_data,
        msg="",
    )

@router.get("/{item_id}", response_model=ResponseModel)
async def get_item(item_id: int = Path(...), db: AsyncSession = Depends(get_db)) -> ResponseModel:
    """获取单个内容详情"""
    # 构建查询，包括关联的作者信息
    query = select(ItemModel).options(selectinload(ItemModel.author)).where(ItemModel.id == item_id)
    
    # 执行查询
    result = await db.execute(query)
    item_db = result.scalar_one_or_none()
    
    # 如果找不到内容，返回404错误
    if not item_db:
        raise HTTPException(status_code=404, detail=f"内容 {item_id} 不存在")
    
    # 将数据库模型转换为Pydantic模型
    item_data = Item.model_validate(item_db)
    
    return ResponseModel(
        code=0,
        data=item_data,
        msg="",
    )

@router.get("", response_model=ResponseModel)
async def get_items(ids: List[int] = Query(...), db: AsyncSession = Depends(get_db)) -> ResponseModel:
    """批量获取内容详情"""
    # 构建查询，包括关联的作者信息
    query = select(ItemModel).options(selectinload(ItemModel.author)).where(ItemModel.id.in_(ids))
    
    # 执行查询
    result = await db.execute(query)
    items_db = result.scalars().all()
    
    # 将数据库模型转换为Pydantic模型
    items_data = [Item.model_validate(item) for item in items_db]
    
    # 按照请求的ID顺序排序结果
    id_to_item = {item.id: item for item in items_data}
    sorted_items = [id_to_item.get(item_id) for item_id in ids if item_id in id_to_item]
    
    return ResponseModel(
        code=0,
        data=sorted_items,
        msg="",
    )