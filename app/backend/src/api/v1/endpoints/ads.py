from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.db.schemas import ResponseModel

router = APIRouter()

@router.get("/serve", response_model=ResponseModel)
async def serve_ads(
    slot_code: str = Query(...),
    user_id: int = Query(None),
    context: str = Query(None),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel:
    """获取广告候选"""
    # TODO: 实现广告候选获取逻辑
    return ResponseModel(
        code=0,
        data={
            "ads": [
                {
                    "id": 1,
                    "title": "广告标题1",
                    "creative_id": 101,
                    "campaign_id": 201,
                    "bid": 0.5,
                    "ctr": 0.02,
                    "rank": 0.01,
                }
            ]
        },
        msg="",
    )

@router.post("/click", response_model=ResponseModel)
async def ad_click(
    creative_id: int = Body(...),
    campaign_id: int = Body(...),
    user_id: int = Body(...),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel:
    """广告点击"""
    # TODO: 实现广告点击逻辑
    return ResponseModel(
        code=0,
        data={"success": True},
        msg="",
    )