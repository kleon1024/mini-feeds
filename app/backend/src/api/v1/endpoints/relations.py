from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.db.schemas import ResponseModel, UserEntityRelationCreate

router = APIRouter()

@router.post("/upsert", response_model=ResponseModel)
async def upsert_relation(
    relation: UserEntityRelationCreate = Body(...),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel:
    """创建或更新用户-实体关系（关注/点赞/收藏/拉黑等）"""
    # TODO: 实现创建或更新关系的逻辑
    return ResponseModel(
        code=0,
        data={"success": True},
        msg="",
    )