from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.db.schemas import ResponseModel, PaginationParams

router = APIRouter()

@router.get("", response_model=ResponseModel)
async def search(
    q: str = Query(..., description="搜索关键词"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel:
    """搜索内容"""
    # TODO: 实现搜索逻辑
    return ResponseModel(
        code=0,
        data={
            "items": [
                {"id": i, "title": f"搜索结果 {i} - {q}"}
                for i in range(1, min(page_size + 1, 10))
            ],
            "total": 100,
            "page": page,
            "page_size": page_size,
            "pages": (100 + page_size - 1) // page_size,
        },
        msg="",
    )