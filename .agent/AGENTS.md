# AGENTS.md — Agent 完整项目规范

> **Agent 的完整规范入口。** 所有在此项目上工作的 Agent 必须优先阅读本文件。
> 
> 如果你是人类，不需要阅读本文件。请阅读 `README.md` 或运行 `./cli help`。
>
> **重要区分：**
> - **本项目** = Agent 的工作空间（规范、结构、工具）
> - **Agent 本身** = 外部环境（Kimi CLI、Claude Code、Cursor 等）
> - **本项目的 CLI** = 人类的状态查看器，不是 Agent

---

## 1. 项目定位

**Human-Agent Coexistence** 是一个**人与 Agent 共存的规范化工作空间**，不是 Agent 实现。

- **Agent 在哪里？** 外部环境：Kimi CLI、Claude Code、Cursor、Copilot 等
- **本项目是什么？** Agent 的工作空间：规范、记忆、计划、工具
- **CLI 是什么？** `./cli` 是人类的状态查看器，帮助人类与外部 Agent 协作

### 协作流程

```
人类                          外部 Agent（Kimi/Claude）
  │                                    │
  ├─► "帮我做 XXX" ──────────────────►┤
  │                                    ├─► 读取 .agent/AGENTS.md（本文件）
  │                                    ├─► 读取 .agent/memory/project-context.json
  │                                    ├─► 制定计划到 .agent/plans/
  │                                    ├─► 执行、写代码到 src/（按需）
  │                                    ├─► 记录到 .agent/memory/
  │                                    └─► 汇报给人类
  │◄─ "完成了" ────────────────────────┤
  │                                    │
  ├─► ./cli status ────────────────────┘
  │    人类查看状态
```

---

## 2. 项目结构

```
project-root/           ← 人类的家（极度简洁）
├── README.md           ← 人类唯一文档
├── AGENTS.md           ← Agent 极简入口
├── cli                 ← 人类状态查看器（不是 Agent）
└── config/             ← 人类配置区

.agent/                 ← Agent 的完整世界（隐藏）
  ├── AGENTS.md         ← 本文件（完整规范）
  ├── memory/           ← 结构化记忆
  ├── plans/            ← 螺丝计划
  ├── knowledge/        ← 知识库
  ├── tools/            ← 工具脚本
  └── cli-src/          ← CLI 源码

# 按需创建：
# src/ — 源代码（Agent 写，人类验收）
# docs/ — 对外文档
# tests/ — 测试
```

---

## 3. 对 Agent 的要求

当外部 Agent（如 Kimi CLI、Claude Code）进入本项目时：

1. **优先读取本文件**（`.agent/AGENTS.md`）
2. **加载核心记忆**（`.agent/memory/project-context.json`）
3. **查看活跃计划**（`.agent/plans/active/`）
4. **读取 MCP 配置**（`config/mcp.json`）— 如有 Chrome DevTools 等工具，自动连接
5. **遵守红线**（见下方 Boundaries）
6. **工作完成后汇报人类**，人类通过 `./cli` 查看状态

---

## 4. 六大核心区域

### 4.1 Commands

```bash
# Agent 工具
python .agent/tools/agent_sync.py    # 同步脚本（如需要）

# 人类 CLI（Agent 需知晓，但不直接调用）
./cli status            # 人类查看状态
./cli context           # 生成项目上下文，人类复制给 Agent
./cli help              # 帮助

# MCP（Agent 自动读取）
config/mcp.json         # 项目级 MCP 配置
```

### 4.2 Testing

- 框架：`pytest`
- 位置：按需创建 `tests/`

### 4.3 Code Style

- Python: PEP 8, 类型注解, Google docstring
- TypeScript: strict mode
- 最大行宽: 100

### 4.4 Git Workflow

- 分支: `feature/description`, `agent/memory-update`
- Commit: `type(scope): subject`
- 禁止直接提交 main

### 4.5 Project Structure

见上方结构图。

### 4.6 Boundaries（红线）

Agent **绝对禁止**：
- ❌ 修改根目录 `cli`（人类状态查看器）
- ❌ 修改 `README.md`（人类文档）
- ❌ 删除 `.agent/memory/decisions/` 历史
- ❌ 将敏感信息写入任何文件
- ❌ 未经确认在根目录创建文件（按需创建 src/ docs/ tests/ 除外）

---

## 5. 记忆与计划

### 核心记忆
`.agent/memory/project-context.json` — 每次会话必读。

### 螺丝计划
`.agent/plans/{status}/plan-{NNN}_{kebab}.md`

---

## 6. 与人类协作

### Agent 的行为准则

1. **汇报简洁**：给人类的输出 <= 3 个要点
2. **引导到 CLI**：告诉人类"运行 ./cli status 查看详情"
3. **保留细节**：详细内容放 `.agent/`，概要给人类
4. **及时通知**：完成重要任务后，在 `project-context.json` 追加通知

### 人类的行为

1. **下指令**：直接对话告诉 Agent 需求
2. **查状态**：`./cli status`
3. **给上下文**：`./cli context` 复制粘贴给 Agent
4. **验收**：检查 `src/` 产出

---

## 7. CLI 扩展

CLI 源码位于 `.agent/cli-src/`，Agent 负责维护。

人类说："帮我在 CLI 加一个 report 命令"  
Agent：创建 `.agent/cli-src/src/commands/report.ts`，注册，构建。

---

*本文件由 Agent 维护。最后更新：2026-05-04*
