from typing import List, Optional, Dict, Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import uuid
from datetime import datetime
import os
import json

from src.db.models import Item, User
from src.db.schemas import FeedItem
from src.core.logger import logger
from src.services.rec.config.dag import DAGManager

# 初始化DAG管理器
dag_config_dir = os.path.join(os.path.dirname(__file__), "config/dags")
dag_manager = DAGManager(dag_config_dir)

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

async def execute_recommendation_dag(db: AsyncSession, user_id: Optional[int], count: int, offset: int = 0, **kwargs) -> List[Dict[str, Any]]:
    """
    执行推荐DAG流程
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        count: 需要获取的内容数量
        offset: 偏移量，用于分页
        **kwargs: 其他参数，如场景、设备、地理位置等
        
    Returns:
        List[Dict[str, Any]]: 推荐结果列表
    """
    # 记录开始执行DAG
    logger.info(f"开始执行推荐DAG，用户ID: {user_id}, 数量: {count}, 偏移: {offset}")
    
    # 创建trace信息
    from src.services.rec.trace import TraceInfo
    trace = TraceInfo()
    
    # 获取DAG
    dag = dag_manager.get_dag("feed_rec")
    if not dag:
        logger.warning("推荐DAG不存在，使用随机推荐")
        # 如果DAG不存在，使用随机推荐
        trace.add_error("dag_manager", "推荐DAG不存在，使用随机推荐")
        random_items = await get_random_items(db, count, offset)
        logger.info(f"使用随机推荐，返回 {len(random_items)} 个结果")
        trace.add_node_detail("random_fallback", "count", len(random_items))
        trace.complete("fallback")
        return [{
            "id": item.id,
            "title": item.content.get("title") if item.content else "",
            "content": item.content.get("description") if item.content else "",
            "tags": item.content.get("tags") if item.content else [],
            "author_id": item.content.get("author", {}).get("id") if item.content else None,
            "created_at": item.content.get("created_at") if item.content else None,
            "kind": item.type,
            "score": item.score,
            "position": item.position,
            "recall_type": "random",
            "trace_info": trace.to_dict()
        } for item in random_items]
    
    # 构建上下文
    context = {
        "db": db,
        "user_id": user_id,
        "count": count,
        "offset": offset,
        "scene": kwargs.get("scene", "feed"),
        "slot": kwargs.get("slot"),
        "device": kwargs.get("device"),
        "geo": kwargs.get("geo"),
        "ab": kwargs.get("ab"),
        "debug": kwargs.get("debug", False),
        "trace": trace  # 添加trace信息
    }
    
    try:
        # 执行DAG
        start_time = __import__("time").time()
        try:
            results = await dag.execute(context)
            end_time = __import__("time").time()
            
            # 记录执行时间
            duration_ms = int((end_time - start_time) * 1000)
            logger.info(f"DAG执行完成，耗时: {duration_ms}ms")
        except Exception as inner_e:
            # 确保在DAG执行失败时回滚事务
            await db.rollback()
            # 重新抛出异常以便外层捕获
            raise inner_e
        
        # 获取最终结果
        # 最后一个节点的输出作为最终结果
        final_node = "rerank"  # 最后一个节点
        if final_node in results:
            result_count = len(results[final_node]) if isinstance(results[final_node], list) else 0
            logger.info(f"使用最终节点 {final_node} 的结果，返回 {result_count} 个结果")
            
            # 添加trace信息到结果中
            if isinstance(results[final_node], list):
                for item in results[final_node]:
                    item['trace_info'] = trace.to_dict()
            
            return results[final_node]
        else:
            # 如果没有找到最终节点的结果，返回任意一个节点的结果
            for node_id, result in results.items():
                if isinstance(result, list) and len(result) > 0:
                    logger.info(f"使用节点 {node_id} 的结果，返回 {len(result)} 个结果")
                    
                    # 添加trace信息到结果中
                    for item in result:
                        item['trace_info'] = trace.to_dict()
                    
                    return result
            
            # 如果没有找到任何结果，使用随机推荐
            logger.warning("DAG执行没有产生有效结果，使用随机推荐")
            trace.add_error("dag_execution", "没有找到有效的结果")
            trace.add_node_detail("random_fallback", "error", "no_valid_results")
            random_items = await get_random_items(db, count, offset)
            trace.add_node_detail("random_fallback", "count", len(random_items))
            trace.complete("fallback")
            return [{
                "id": item.id,
                "title": item.content.get("title") if item.content else "",
                "content": item.content.get("description") if item.content else "",
                "tags": item.content.get("tags") if item.content else [],
                "author_id": item.content.get("author", {}).get("id") if item.content else None,
                "created_at": item.content.get("created_at") if item.content else None,
                "kind": item.type,
                "score": item.score,
                "position": item.position,
                "recall_type": "random",
                "trace_info": trace.to_dict()
            } for item in random_items]
    
    except Exception as e:
        error_msg = f"DAG执行失败: {str(e)}"
        logger.error(error_msg)
        
        # 记录错误信息
        trace.add_error("dag_execution", error_msg)
        
        # 出错时使用随机推荐
        random_items = await get_random_items(db, count, offset)
        
        # 记录随机推荐信息
        trace.add_node_detail("random_fallback", "count", len(random_items))
        trace.complete("error")
        
        # 添加trace信息到结果中
        return [{
            "id": item.id,
            "title": item.content.get("title") if item.content else "",
            "content": item.content.get("description") if item.content else "",
            "tags": item.content.get("tags") if item.content else [],
            "author_id": item.content.get("author", {}).get("id") if item.content else None,
            "created_at": item.content.get("created_at") if item.content else None,
            "kind": item.type,
            "score": item.score,
            "position": item.position,
            "recall_type": "random",
            "trace_info": trace.to_dict()
        } for item in random_items]

async def format_recommendation_results(db: AsyncSession, items: List[Dict[str, Any]]) -> List[FeedItem]:
    """
    将推荐结果格式化为API响应格式
    
    Args:
        db: 数据库会话
        items: 推荐结果列表
        
    Returns:
        List[FeedItem]: 格式化后的推荐结果
    """
    feed_items: List[FeedItem] = []
    
    for i, item in enumerate(items):
        position = i + 1
        
        # 获取分数
        score = item.get('rerank_score',  # 重排分数
                      item.get('rank_score',  # 精排分数
                             item.get('pre_rank_score',  # 粗排分数
                                    item.get('match_score', 0.9))))  # 召回分数
        
        # 创建跟踪信息
        tracking = {
            "event_token": f"token-{uuid.uuid4()}",
            "trace_id": f"trace-{uuid.uuid4()}",
        }
        
        # 生成推荐理由
        reason = None
        recall_type = item.get('recall_type')
        if recall_type == 'tag':
            matched_tags = item.get('matched_tags', [])
            if matched_tags:
                reason = f"基于你感兴趣的{matched_tags[0]}"
            else:
                reason = "基于你的兴趣推荐"
        elif recall_type == 'popular':
            reason = "热门推荐"
        elif recall_type == 'vector':
            reason = "与你喜欢的内容相似"
        elif recall_type == 'multi_hop':
            reason = "你可能感兴趣的发现"
        else:
            reason = "为你推荐"
        
        # 创建基本的FeedItem结构
        feed_item = FeedItem(
            type=item.get('kind', 'content'),
            id=str(item.get('id')),
            score=score,
            position=position,
            reason=reason,
            tracking=tracking,
        )
        
        # 根据类型设置不同的内容
        kind = item.get('kind', 'content')
        if kind == "content":
            # 获取详细信息
            # 确保item_id是整数类型
            try:
                item_id = item.get('id')
                item_id_int = int(item_id)
                item_query = select(Item).where(Item.id == item_id_int)
                item_result = await db.execute(item_query)
                item_db = item_result.scalar_one_or_none()
            except (ValueError, TypeError) as e:
                logger.error(f"获取项目详情失败，ID类型转换错误: {str(e)}")
                return None
            
            if item_db:
                feed_item.content = {
                    "title": item_db.title,
                    "description": item_db.content,
                    "author": {
                        "id": item_db.author_id,
                        "name": "未知作者"  # 简化处理，实际应该查询作者信息
                    },
                    "created_at": item_db.created_at.isoformat() if item_db.created_at else None,
                    "media": item_db.media,
                    "tags": item_db.tags,
                }
            else:
                # 如果找不到内容，使用推荐结果中的信息
                feed_item.content = {
                    "title": item.get('title', ''),
                    "description": item.get('content', ''),
                    "author": {
                        "id": item.get('author_id'),
                        "name": "未知作者"
                    },
                    "created_at": item.get('created_at'),
                    "media": {},
                    "tags": item.get('tags', []),
                }
        
        feed_items.append(feed_item)
    
    return feed_items

# 为未来扩展预留的接口
async def get_recommended_items(db: AsyncSession, user_id: Optional[int], count: int, offset: int = 0, **kwargs) -> List[FeedItem]:
    """
    获取推荐内容项
    
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
    
    try:
        # 执行推荐DAG
        rec_items = await execute_recommendation_dag(db, user_id, count, offset, **kwargs)
        
        # 格式化结果
        feed_items = await format_recommendation_results(db, rec_items)
        
        return feed_items
    except Exception as e:
        logger.error(f"推荐失败: {str(e)}")
        # 回滚事务，确保数据库连接可以继续使用
        try:
            await db.rollback()
        except Exception as rollback_error:
            logger.error(f"回滚事务失败: {str(rollback_error)}")
        
        # 出错时使用随机推荐
        return await get_random_items(db, count, offset)