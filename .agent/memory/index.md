# 记忆系统 (Memory System)

> 本项目采用**结构化记忆架构**，灵感来源于 Intrinsic Memory Agents 和 A-MEM 论文实践。

---

## 记忆分层

```
┌──────────────────────────────────────────┐
│  Tier 1: 工作记忆 (Working Memory)        │
│  → 当前会话上下文，会话结束丢弃             │
├──────────────────────────────────────────┤
│  Tier 2: 短期记忆 (Short-term Memory)     │
│  → project-context.json，跨会话保留       │
│  → 最近决策、待办事项、关键事实             │
├──────────────────────────────────────────┤
│  Tier 3: 长期记忆 (Long-term Memory)      │
│  → decisions/ 目录，历史决策完整记录        │
│  → sessions/ 目录，会话历史摘要             │
│  → knowledge/ 目录，领域知识积累            │
└──────────────────────────────────────────┘
```

---

## 记忆文件格式

### 核心记忆 (project-context.json)

**Schema：**
```json
{
  "entity_id": "string",       // 实体唯一标识
  "entity_type": "project|user|module",
  "summary": "string",         // <= 200字的摘要
  "key_facts": ["string"],     // 已确认的关键事实列表
  "preferences": {},           // 偏好设置
  "open_actions": ["string"],  // 待办事项
  "recent_decisions": [],      // 最近决策（保留最近10条）
  "metrics": {},               // 项目指标
  "session_history": [],       // 会话历史摘要
  "last_updated": "ISO8601",
  "updated_by": "agent|human"
}
```

**更新规则：**
- `summary`：项目状态变化时更新
- `key_facts`：新增确认事实时追加，过时事实标记为 `[DEPRECATED]`
- `open_actions`：任务完成时移除，新任务时追加
- `recent_decisions`：只保留最近 10 条，更早的归档到 `decisions/`
- `last_updated`：每次修改必更新

### 决策日志 (decisions/)

**文件名格式：** `YYYY-MM-DD_{kebab-case-topic}.md`

**格式：**
```markdown
# 决策：{标题}

- **日期**: 2026-05-04
- **决策人**: agent | human | agent+human
- **状态**: confirmed | pending | superseded

## 背景
{决策背景}

## 决策内容
{具体决策}

## 备选方案
- 方案A（未采纳）：...
- 方案B（已采纳）：...

## 影响
- 对代码的影响：...
- 对计划的影响：...

## 相关
- 关联计划: plan-xxx
- 关联PR: #123
```

### 会话摘要 (sessions/)

**文件名格式：** `YYYY-MM-DD_HH-{type}.md`

**格式：**
```markdown
# 会话摘要：{简要描述}

- **时间**: 2026-05-04 11:00-12:00
- **类型**: coding | planning | review | research
- **参与者**: human, agent

## 目标
{本次会话目标}

## 执行摘要
{3-5条要点}

## 产出
- 文件变更：...
- 新增计划：...
- 关键决策：...

## 下一步
{遗留任务}
```

---

## 记忆检索机制

1. **精确检索**：按 entity_id 加载 `project-context.json`
2. **时间检索**：按日期范围检索 `decisions/` 和 `sessions/`
3. **关键词检索**：扫描所有记忆文件的文本内容
4. **语义检索**（未来扩展）：使用向量数据库存储记忆向量

---

## 记忆压缩策略

当 `project-context.json` 过大时，触发压缩：
- `key_facts` 超过 50 条 → 汇总为分类摘要，归档细节到 `knowledge/`
- `session_history` 超过 20 条 → 归档旧会话到 `sessions/`，保留摘要
- `recent_decisions` 超过 10 条 → 归档到 `decisions/`

---

## 与人类记忆的同步

| Agent 记忆 | 人类视图 | 同步方式 |
|-----------|---------|---------|
| project-context.json | human/overview/project-summary.md | 提取 summary + key_facts |
| decisions/*.md | human/overview/decisions-summary.md | 提取最近 5 条决策摘要 |
| plans/active/*.md | human/overview/current-plans.md | 提取计划标题、进度、状态 |
| metrics | human/dashboard/ | 渲染为图表/数字卡片 |
