from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import AsyncAttrs

# 创建基础模型类
Base = declarative_base(cls=AsyncAttrs)