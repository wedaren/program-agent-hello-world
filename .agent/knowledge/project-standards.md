# 项目标准与约定 (Project Standards)

> Agent 知识库 — 编码、文档、协作的标准化约定。

---

## 1. 文档标准

### 1.1 Markdown 规范

- 使用 ATX 标题 (`#` 风格)，不用 Setext (`===`)
- 标题层级不超过 4 级
- 列表项使用 `-`（无序）或 `1.`（有序）
- 代码块必须标注语言
- 表格用于结构化数据展示

### 1.2 文件命名

| 类型 | 命名风格 | 示例 |
|------|---------|------|
| 文档 | kebab-case.md | `human-agent-coexistence.md` |
| 计划 | plan-{NNN}_{kebab}.md | `plan-001_auth-module.md` |
| 决策 | YYYY-MM-DD_{kebab}.md | `2026-05-04_dashboard-tech.md` |
| 脚本 | snake_case.py | `agent_sync.py` |
| 代码文件 | snake_case.py / camelCase.ts | `memory_utils.py`, `Dashboard.tsx` |

### 1.3 语言

- **面向人类**的文档：`zh`（中文优先）
- **面向 Agent**的文档：`zh` 或 `zh-en-mixed`
- **代码注释**：`zh-en-mixed`，关键术语保留英文
- **Commit message**：`en`，遵循 Conventional Commits

---

## 2. 代码标准

### 2.1 Python

```python
"""
模块级 docstring。

描述模块的用途和主要功能。
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Optional


# 常量：UPPER_SNAKE_CASE
MAX_RETRY_COUNT = 3
DEFAULT_ENCODING = "utf-8"


class MemoryStore:
    """记忆存储类。
    
    负责 Agent 结构化记忆的持久化存储和检索。
    
    Attributes:
        base_path: 记忆文件存储的根目录
        cache: 内存缓存，避免重复读取
        
    Examples:
        >>> store = MemoryStore(".agent/memory")
        >>> store.load("project-core")
    """
    
    # 类变量
    _instance: Optional[MemoryStore] = None
    
    def __init__(self, base_path: str | Path) -> None:
        """初始化存储。
        
        Args:
            base_path: 记忆文件根目录路径
        """
        self.base_path = Path(base_path)
        self.cache: dict[str, dict[str, Any]] = {}
    
    def load(self, entity_id: str) -> dict[str, Any]:
        """加载指定实体的记忆。
        
        Args:
            entity_id: 实体唯一标识符
            
        Returns:
            结构化记忆字典
            
        Raises:
            FileNotFoundError: 记忆文件不存在时
        """
        if entity_id in self.cache:
            return self.cache[entity_id]
        
        file_path = self.base_path / f"{entity_id}.json"
        data = json.loads(file_path.read_text(encoding=DEFAULT_ENCODING))
        self.cache[entity_id] = data
        return data
    
    def save(self, entity_id: str, data: dict[str, Any]) -> None:
        """保存记忆到文件。
        
        Args:
            entity_id: 实体唯一标识符
            data: 要保存的记忆数据
        """
        file_path = self.base_path / f"{entity_id}.json"
        file_path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False),
            encoding=DEFAULT_ENCODING
        )
        self.cache[entity_id] = data
```

**规范要点：**
- 类型注解：强制使用，导入 `from __future__ import annotations` 支持延迟求值
- Docstring：Google style，包含 Args、Returns、Raises
- 最大行宽：100 字符
- 导入排序：标准库 → 第三方 → 本地，每组空行分隔

### 2.2 JavaScript / TypeScript

```typescript
/**
 * 记忆存储接口
 */
interface MemoryData {
  entityId: string;
  summary: string;
  keyFacts: string[];
  lastUpdated: string;
}

/**
 * 从 JSON 文件加载记忆数据
 * 
 * @param entityId - 实体唯一标识符
 * @returns 解析后的记忆数据
 * @throws 文件不存在时抛出错误
 */
function loadMemory(entityId: string): MemoryData {
  const filePath = `.agent/memory/${entityId}.json`;
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as MemoryData;
}
```

**规范要点：**
- TypeScript 优先
- 接口名：PascalCase
- 函数名：camelCase
- 使用 JSDoc / TSDoc 注释
-  Prefer `const` / `let`，不用 `var`

---

## 3. 配置标准

### 3.1 环境变量

敏感信息和环境相关配置使用 `.env` 文件：

```bash
# .env.example — 提交到仓库（不含真实值）
OPENAI_API_KEY=your_key_here
DATABASE_URL=postgresql://...
DEBUG=false
```

### 3.2 配置文件格式

- **简单配置**：YAML（人类友好）
- **复杂配置**：JSON Schema 验证的 JSON
- **Python 配置**：`pydantic-settings` + `.env`

---

## 4. 测试标准

### 4.1 测试结构

```
tests/
├── conftest.py              # pytest 共享 fixture
├── unit/                    # 单元测试
│   ├── test_memory_store.py
│   └── test_plan_parser.py
├── integration/             # 集成测试
│   └── test_sync_workflow.py
└── fixtures/                # 测试数据
    └── sample_memory.json
```

### 4.2 测试命名

- 文件：`test_{module_name}.py`
- 函数：`test_{function_name}_{scenario}`
- 类：`Test{ClassName}`

### 4.3 测试规范

```python
def test_load_memory_file_not_found():
    """当记忆文件不存在时，应抛出 FileNotFoundError。"""
    store = MemoryStore("/tmp/nonexistent")
    with pytest.raises(FileNotFoundError):
        store.load("missing-entity")


def test_save_memory_updates_cache():
    """保存记忆后，缓存应同步更新。"""
    store = MemoryStore(tmp_path)
    data = {"entity_id": "test", "summary": "test"}
    
    store.save("test", data)
    
    assert store.cache["test"] == data
```

---

## 5. Git 标准

### 5.1 Commit Message

```
type(scope): subject

body (optional)

footer (optional)
```

**Type：**
- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 格式调整（不影响代码逻辑）
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

**示例：**
```
feat(plans): add milestone tracking to plan schema

支持在计划文件中定义里程碑节点，
Agent 可以按里程碑汇报进度。

Closes #42
```

### 5.2 分支策略

```
main
  ├── feature/memory-system
  ├── feature/dashboard-ui
  ├── fix/sync-script-bug
  └── agent/memory-update-2026-05-04
```

---

## 6. Agent 专用约定

### 6.1 文件修改标记

Agent 修改文件时，在文件顶部或修改处添加注释：

```markdown
<!-- AGENT_MODIFIED: 2026-05-04 - updated project summary -->
```

```python
# AGENT_MODIFIED: 2026-05-04 - added error handling
```

### 6.2 决策记录格式

所有决策使用统一模板（见 `memory/index.md` 决策日志部分）。

### 6.3 同步检查清单

每次会话结束前，Agent 必须确认：
- [ ] `project-context.json` 已更新
- [ ] `human/overview/` 已同步
- [ ] `human/dashboard/` 数据已刷新
- [ ] 新增决策已归档
- [ ] 计划状态已更新
