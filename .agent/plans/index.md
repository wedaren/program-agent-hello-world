# 螺丝计划系统 (Plan System)

> "螺丝计划" — 将大任务拆解为可执行、可追踪、可验证的小螺丝。

---

## 命名由来

**螺丝 = 最小可执行单元**。像拧螺丝一样：
- 每颗螺丝有明确的目标（拧到哪里去）
- 每颗螺丝有明确的完成标准（拧紧了吗）
- 螺丝之间可能有依赖（先拧A再拧B）
- 可以并行拧多个无关的螺丝

---

## 计划生命周期

```
┌────────────┐     领取      ┌────────────┐     完成      ┌────────────┐
│  pending   │ ───────────► │   active   │ ───────────► │  completed  │
│  (待开始)   │              │  (进行中)   │              │  (已完成)   │
└────────────┘              └────────────┘              └────────────┘
       │                           │                           │
       │  发现阻塞                 │  发现不可行                 │  验收失败
       ▼                           ▼                           ▼
┌────────────┐              ┌────────────┐              ┌────────────┐
│  blocked   │              │ cancelled  │              │  reopened  │
│  (被阻塞)   │              │  (已取消)   │              │  (重新打开) │
└────────────┘              └────────────┘              └────────────┘
```

**状态定义：**
- `pending`：已创建，等待领取
- `active`：正在执行中
- `completed`：已完成并通过验收
- `blocked`：被其他计划阻塞
- `cancelled`：已取消（记录原因）
- `reopened`：已完成但验收不通过，重新打开

---

## 计划文件格式

每个计划是一个独立的 Markdown 文件：

```markdown
---
id: "plan-{序号}"
title: "计划的简短标题"
status: pending | active | completed | blocked | cancelled | reopened
priority: low | medium | high | critical
created_by: human | agent
created_at: "YYYY-MM-DD"
updated_at: "YYYY-MM-DD"
started_at: "YYYY-MM-DD"           # active 时填写
completed_at: "YYYY-MM-DD"         # completed 时填写
tags: ["tag1", "tag2"]
assigned_to: "agent-role"          # 可选，指定Agent角色
---

## 目标 (Objective)
一句话描述计划要达到的目标。

## 背景 (Context)
为什么需要这个计划？解决什么问题？

## 螺丝清单 (Screws) — 任务拆解

### 🔩 [ ] 1. 螺丝名称
- **描述**: 具体要做什么
- **验收标准**: 怎么算完成
- **预计耗时**: 30min
- **依赖**: 无 | plan-xxx

### 🔩 [ ] 2. 下一个螺丝
- **描述**: ...
- **验收标准**: ...
- **预计耗时**: 1h
- **依赖**: 螺丝1

## 决策日志 (Decision Log)
- YYYY-MM-DD: 做了什么决策，原因是什么

## 关联 (Relationships)
- **前置依赖**: plan-xxx, plan-yyy
- **阻塞**: plan-zzz（被本计划阻塞）
- **相关文档**: docs/architecture/xxx.md
- **相关代码**: src/modules/xxx/

## 备注 (Notes)
任何补充信息
```

---

## 目录组织

```
.agent/plans/
├── index.md              ← 本文件（系统规范）
├── active/               ← 活跃计划（1-5个为宜）
│   ├── plan-001_xxx.md
│   └── plan-002_xxx.md
├── pending/              ← 待开始计划
│   └── plan-003_xxx.md
├── completed/            ← 已完成计划
│   └── plan-000_xxx.md
└── archive/              ← 归档计划（可选，长期项目使用）
```

---

## Agent 执行规范

### 领取计划

1. 从 `pending/` 中选择最高优先级的计划
2. 将文件移动到 `active/`
3. 更新 `status: active` 和 `started_at`
4. 在 `project-context.json` 的 `open_actions` 中记录

### 执行螺丝

1. 一次只聚焦一颗螺丝
2. 完成一颗，勾选 `[x]`，追加到决策日志
3. 遇到阻塞：
   - 能自己解决 → 解决后继续
   - 需要人类确认 → 记录并汇报
   - 依赖其他计划 → 将当前计划标记 `blocked`，创建依赖计划

### 完成计划

1. 确认所有螺丝已勾选
2. 更新 `status: completed` 和 `completed_at`
3. 将文件移动到 `completed/`
4. 在 `project-context.json` 中更新 `open_actions`
5. 运行同步脚本更新人类视图

---

## 与人类协作

- **人类创建计划**：直接在 `pending/` 创建文件，Agent 自动发现并执行
- **Agent 建议计划**：Agent 创建草稿到 `pending/`，人类确认后执行
- **进度汇报**：人类查看 `human/overview/current-plans.md` 即可了解进度
- **干预**：人类可以随时修改计划文件、调整优先级、取消计划
