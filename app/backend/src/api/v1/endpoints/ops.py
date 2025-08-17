from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Path, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.db.schemas import ResponseModel

router = APIRouter()

@router.get("/tasks", response_model=ResponseModel)
async def get_tasks(db: AsyncSession = Depends(get_db)) -> ResponseModel:
    """获取SQL任务列表"""
    # TODO: 实现获取SQL任务列表的逻辑
    return ResponseModel(
        code=0,
        data={
            "tasks": [
                {
                    "id": 1,
                    "name": "刷新全文检索视图",
                    "description": "刷新搜索物化视图",
                    "action": "refresh_mv",
                    "target": "search.item_ft",
                    "enabled": True,
                }
            ]
        },
        msg="",
    )

@router.post("/tasks/{task_id}/run", response_model=ResponseModel)
async def run_task(
    task_id: int = Path(...),
    params: Dict[str, Any] = Body(default={}),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel:
    """执行SQL任务"""
    # TODO: 实现执行SQL任务的逻辑
    return ResponseModel(
        code=0,
        data={
            "run_id": 1001,
            "task_id": task_id,
            "status": "running",
        },
        msg="",
    )

@router.get("/runs", response_model=ResponseModel)
async def get_runs(
    task_id: Optional[int] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel:
    """获取SQL任务执行记录"""
    # TODO: 实现获取SQL任务执行记录的逻辑
    return ResponseModel(
        code=0,
        data={
            "runs": [
                {
                    "id": 1001,
                    "task_id": task_id or 1,
                    "started_at": "2023-09-01T12:00:00Z",
                    "finished_at": "2023-09-01T12:01:00Z",
                    "status": "success",
                    "affected_rows": 100,
                }
            ]
        },
        msg="",
    )