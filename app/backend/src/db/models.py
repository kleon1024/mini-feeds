from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, DateTime, CheckConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, BIGINT, TIMESTAMP
from sqlalchemy.orm import relationship

from src.db.base import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "app"}
    
    id = Column(BIGINT, primary_key=True, index=True)
    username = Column(String, nullable=False, index=True)
    tags = Column(JSONB, nullable=False, default={})
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 关系
    items = relationship("Item", back_populates="author")
    events = relationship("Event", back_populates="user")

class Item(Base):
    __tablename__ = "items"
    __table_args__ = (
        CheckConstraint("kind IN ('content', 'ad', 'product')", name="check_kind"),
        {"schema": "app"}
    )
    
    id = Column(BIGINT, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    content = Column(Text)
    tags = Column(JSONB, nullable=False, default={})
    author_id = Column(BIGINT, ForeignKey("app.users.id"))
    media = Column(JSONB, nullable=False, default={})
    kind = Column(String, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 关系
    author = relationship("User", back_populates="items")
    events = relationship("Event", back_populates="item")

class Event(Base):
    __tablename__ = "events"
    __table_args__ = {"schema": "app"}
    
    id = Column(BIGINT, primary_key=True, index=True)
    user_id = Column(BIGINT, ForeignKey("app.users.id"), nullable=True)
    item_id = Column(BIGINT, ForeignKey("app.items.id"))
    event_type = Column(String, nullable=False, index=True)
    ts = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)
    source = Column(String)
    staytime_ms = Column(Integer, default=0)
    gmv_amount = Column(Float, default=0)
    extra = Column(JSONB, nullable=False, default={})
    
    # 关系
    user = relationship("User", back_populates="events")
    item = relationship("Item", back_populates="events")

class UserEntityRelation(Base):
    __tablename__ = "user_entity_relations"
    __table_args__ = {"schema": "rel"}
    
    user_id = Column(BIGINT, primary_key=True)
    entity_type = Column(String, primary_key=True)
    entity_id = Column(BIGINT, primary_key=True)
    relation_type = Column(String, primary_key=True)
    status = Column(String, nullable=False, default="active")
    strength = Column(Float, default=1.0)
    score = Column(Float, default=0.0)
    last_interact_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    expire_at = Column(TIMESTAMP(timezone=True))
    attrs = Column(JSONB, nullable=False, default={})