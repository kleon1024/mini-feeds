from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field

# 基础模型
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True
        populate_by_name = True

# 用户模型
class UserBase(BaseSchema):
    username: str
    tags: Dict[str, Any] = Field(default_factory=dict)

class UserCreate(UserBase):
    pass

class UserUpdate(BaseSchema):
    username: Optional[str] = None
    tags: Optional[Dict[str, Any]] = None

class UserInDB(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

class User(UserInDB):
    pass

# 内容模型
class ItemBase(BaseSchema):
    title: str
    content: Optional[str] = None
    tags: Dict[str, Any] = Field(default_factory=dict)
    author_id: Optional[int] = None
    media: Dict[str, Any] = Field(default_factory=dict)
    kind: str = "content"  # content, ad, product

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseSchema):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[Dict[str, Any]] = None
    media: Optional[Dict[str, Any]] = None

class ItemInDB(ItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

class Item(ItemInDB):
    author: Optional[User] = None

# 事件模型
class EventBase(BaseSchema):
    user_id: Optional[int] = None
    item_id: int
    event_type: str
    source: Optional[str] = None
    staytime_ms: int = 0
    gmv_amount: float = 0
    extra: Dict[str, Any] = Field(default_factory=dict)

class EventCreate(EventBase):
    pass

class EventInDB(EventBase):
    id: int
    ts: datetime

class Event(EventInDB):
    pass

# 用户关系模型
class UserEntityRelationBase(BaseSchema):
    user_id: int
    entity_type: str
    entity_id: int
    relation_type: str
    status: str = "active"
    strength: float = 1.0
    score: float = 0.0
    attrs: Dict[str, Any] = Field(default_factory=dict)

class UserEntityRelationCreate(UserEntityRelationBase):
    pass

class UserEntityRelationUpdate(BaseSchema):
    status: Optional[str] = None
    strength: Optional[float] = None
    score: Optional[float] = None
    attrs: Optional[Dict[str, Any]] = None

class UserEntityRelationInDB(UserEntityRelationBase):
    last_interact_at: datetime
    expire_at: Optional[datetime] = None

class UserEntityRelation(UserEntityRelationInDB):
    pass

# 统一响应模型
class ResponseModel(BaseSchema):
    code: int = 0
    data: Optional[Any] = None
    msg: str = ""

# 分页模型
class PaginationParams(BaseSchema):
    page: int = 1
    page_size: int = 20

class PaginatedResponse(BaseSchema):
    items: List[Any]
    total: int
    page: int
    page_size: int
    pages: int

# 帖子流响应模型
class FeedItem(BaseSchema):
    type: str  # content, ad, product
    id: str
    score: float
    position: int
    reason: Optional[str] = None
    tracking: Dict[str, str] = Field(default_factory=dict)
    content: Optional[Dict[str, Any]] = None
    ad: Optional[Dict[str, Any]] = None
    product: Optional[Dict[str, Any]] = None

class FeedResponse(BaseSchema):
    server_time: str
    cursor: str
    items: List[FeedItem]