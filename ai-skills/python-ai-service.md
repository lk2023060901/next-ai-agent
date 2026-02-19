# Skill: Python AI Service Scaffolding (FastAPI + Async)

> 生成 Python AI/ML 微服务脚手架，用于记忆系统、向量检索等 AI 密集型任务。

## 触发条件

当用户要求创建 Python 服务、AI 推理服务、向量检索服务、记忆管理服务时激活此 Skill。

## 上下文

### 技术栈

- Python 3.12+
- FastAPI 0.110+ (异步 HTTP 框架)
- Pydantic v2 (数据校验)
- SQLAlchemy 2.0 + asyncpg (异步数据库)
- pymilvus (Milvus 向量库客户端)
- LiteLLM (统一 LLM 调用)
- uvicorn (ASGI 服务器)
- pytest + pytest-asyncio (测试)

### 服务职责 (memory-service)

- 文本向量化 (Embedding)
- 向量存储与检索 (Milvus)
- 六层记忆体系管理
- 上下文压缩与摘要
- RAG 增强检索

### 命名约定

| 类型 | 风格 | 示例 |
|------|------|------|
| 文件/目录 | snake_case | `memory_service/`, `vector_store.py` |
| 函数 | snake_case | `get_similar_memories` |
| 类 | PascalCase | `MemoryManager` |
| 常量 | UPPER_SNAKE_CASE | `MAX_CONTEXT_LENGTH` |
| 类型 | PascalCase | `MemoryEntry` |
| 环境变量 | UPPER_SNAKE_CASE | `MILVUS_HOST` |

## 生成规则

### 1. 项目结构

```
services/memory-service/
├── app/
│   ├── __init__.py
│   ├── main.py                   # FastAPI 入口
│   ├── config.py                 # 配置 (Pydantic Settings)
│   ├── dependencies.py           # 依赖注入
│   ├── routers/                  # 路由
│   │   ├── __init__.py
│   │   ├── memory.py
│   │   └── health.py
│   ├── services/                 # 业务逻辑
│   │   ├── __init__.py
│   │   ├── memory_service.py
│   │   ├── embedding_service.py
│   │   └── compression_service.py
│   ├── repositories/             # 数据访问
│   │   ├── __init__.py
│   │   ├── memory_repo.py
│   │   └── vector_repo.py
│   ├── models/                   # 数据模型
│   │   ├── __init__.py
│   │   ├── memory.py
│   │   └── embedding.py
│   ├── schemas/                  # 请求/响应 Schema
│   │   ├── __init__.py
│   │   └── memory.py
│   └── utils/
│       ├── __init__.py
│       └── token_counter.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_memory_service.py
│   └── test_vector_repo.py
├── pyproject.toml
├── Dockerfile
└── README.md
```

### 2. FastAPI 入口

```python
# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.config import settings
from app.routers import memory, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动: 初始化连接池
    from app.dependencies import init_resources, close_resources
    await init_resources()
    yield
    # 关闭: 释放连接
    await close_resources()

app = FastAPI(
    title="NextAI Memory Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(health.router, tags=["health"])
app.include_router(memory.router, prefix="/api/v1/memory", tags=["memory"])
```

### 3. 配置管理

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 服务
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    ENV: str = "development"
    LOG_LEVEL: str = "info"

    # PostgreSQL
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost:15432/nextai"

    # Milvus
    MILVUS_HOST: str = "localhost"
    MILVUS_PORT: int = 29530
    MILVUS_COLLECTION: str = "memories"

    # Embedding
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSION: int = 1536

    # LLM (用于摘要压缩)
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_API_KEY: str = ""

    # 记忆参数
    MAX_CONTEXT_TOKENS: int = 4096
    SIMILARITY_THRESHOLD: float = 0.75

    model_config = {"env_file": ".env"}

settings = Settings()
```

### 4. Pydantic Schema

```python
# app/schemas/memory.py
from datetime import datetime
from pydantic import BaseModel, Field

class MemoryCreate(BaseModel):
    workspace_id: str
    agent_id: str
    session_id: str
    content: str = Field(max_length=10000)
    memory_type: str = Field(pattern="^(working|episodic|semantic|procedural|shared|meta)$")
    metadata: dict | None = None

class MemoryResponse(BaseModel):
    id: str
    workspace_id: str
    agent_id: str
    content: str
    memory_type: str
    relevance_score: float | None = None
    created_at: datetime

class MemorySearchRequest(BaseModel):
    workspace_id: str
    query: str
    agent_id: str | None = None
    memory_types: list[str] | None = None
    top_k: int = Field(default=10, ge=1, le=100)
    threshold: float = Field(default=0.75, ge=0.0, le=1.0)

class MemorySearchResponse(BaseModel):
    items: list[MemoryResponse]
    total: int
    query_embedding_time_ms: float
    search_time_ms: float
```

### 5. 路由

```python
# app/routers/memory.py
from fastapi import APIRouter, Depends
from app.schemas.memory import (
    MemoryCreate,
    MemoryResponse,
    MemorySearchRequest,
    MemorySearchResponse,
)
from app.services.memory_service import MemoryService
from app.dependencies import get_memory_service

router = APIRouter()

@router.post("/", response_model=MemoryResponse, status_code=201)
async def create_memory(
    body: MemoryCreate,
    service: MemoryService = Depends(get_memory_service),
):
    return await service.create(body)

@router.post("/search", response_model=MemorySearchResponse)
async def search_memories(
    body: MemorySearchRequest,
    service: MemoryService = Depends(get_memory_service),
):
    return await service.search(body)

@router.delete("/{memory_id}", status_code=204)
async def delete_memory(
    memory_id: str,
    service: MemoryService = Depends(get_memory_service),
):
    await service.delete(memory_id)
```

### 6. 向量检索服务

```python
# app/repositories/vector_repo.py
from pymilvus import MilvusClient, DataType, CollectionSchema, FieldSchema

class VectorRepo:
    def __init__(self, host: str, port: int, collection: str, dimension: int):
        self.client = MilvusClient(uri=f"http://{host}:{port}")
        self.collection = collection
        self.dimension = dimension

    async def ensure_collection(self):
        if not self.client.has_collection(self.collection):
            schema = CollectionSchema([
                FieldSchema("id", DataType.VARCHAR, is_primary=True, max_length=36),
                FieldSchema("workspace_id", DataType.VARCHAR, max_length=36),
                FieldSchema("agent_id", DataType.VARCHAR, max_length=36),
                FieldSchema("memory_type", DataType.VARCHAR, max_length=20),
                FieldSchema("embedding", DataType.FLOAT_VECTOR, dim=self.dimension),
            ])
            self.client.create_collection(self.collection, schema=schema)

    async def insert(self, id: str, workspace_id: str, agent_id: str, memory_type: str, embedding: list[float]):
        self.client.insert(self.collection, [{
            "id": id,
            "workspace_id": workspace_id,
            "agent_id": agent_id,
            "memory_type": memory_type,
            "embedding": embedding,
        }])

    async def search(
        self,
        query_embedding: list[float],
        workspace_id: str,
        top_k: int = 10,
        agent_id: str | None = None,
        memory_types: list[str] | None = None,
    ) -> list[dict]:
        filter_expr = f'workspace_id == "{workspace_id}"'
        if agent_id:
            filter_expr += f' and agent_id == "{agent_id}"'
        if memory_types:
            types_str = ", ".join(f'"{t}"' for t in memory_types)
            filter_expr += f" and memory_type in [{types_str}]"

        results = self.client.search(
            collection_name=self.collection,
            data=[query_embedding],
            limit=top_k,
            filter=filter_expr,
            output_fields=["id", "workspace_id", "agent_id", "memory_type"],
        )
        return results[0] if results else []
```

### 7. Dockerfile

```dockerfile
FROM python:3.12-slim AS base
WORKDIR /app

COPY pyproject.toml ./
RUN pip install --no-cache-dir -e ".[prod]"

COPY app/ app/

EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

## 示例

**输入**: "创建 Embedding 服务，支持 OpenAI 和本地模型"

**输出**: 生成 `app/services/embedding_service.py`，包含统一的 `embed_text()` 接口、OpenAI API 和本地 Sentence Transformers 双后端、批量处理和缓存逻辑。
