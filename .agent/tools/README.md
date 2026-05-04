# Agent 工具目录 (.agent/tools/)

> 存放 Agent 专用的辅助脚本和工具。这些工具通常不在 `scripts/` 中，因为：
> - 它们是 Agent 内部使用的，人类不需要直接调用
> - 它们可能频繁变更，属于 Agent 的"私人工具箱"
> - 将它们放在 `.agent/` 中符合"Agent 的家"的设计原则

---

## 工具清单

| 工具 | 状态 | 描述 |
|------|------|------|
| `memory_utils.py` | 🚧 planned | 记忆读写、查询、压缩工具 |
| `plan_validator.py` | 🚧 planned | 计划文件格式校验 |
| `context_builder.py` | 🚧 planned | 会话上下文组装 |
| `decision_logger.py` | 🚧 planned | 决策日志自动化记录 |
| `sync_trigger.py` | 🚧 planned | 触发 human/ 同步的快捷脚本 |

---

## 使用方式

Agent 可以通过以下方式调用工具：

```python
# Python 导入
from .agent.tools.memory_utils import load_memory, save_memory

# 命令行调用
python .agent/tools/memory_utils.py --action load --entity project-core
```

---

## 工具编写规范

1. **独立可运行**：每个工具脚本应支持命令行直接运行
2. **参数化**：使用 `argparse` 或 `click` 接收参数
3. **错误处理**：所有工具必须有健壮的错误处理和日志
4. **文档**：每个工具文件顶部必须有使用说明

---

*当工具成熟且人类也可能需要使用时，考虑升级到 `scripts/` 共享空间。*
