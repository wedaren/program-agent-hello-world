---
id: "plan-000"
title: "项目初始化与框架搭建"
status: active
priority: critical
created_by: agent
created_at: "2026-05-04"
updated_at: "2026-05-04"
started_at: "2026-05-04"
tags: ["infrastructure", "setup", "architecture"]
assigned_to: "developer-agent"
---

## 目标

建立人与 Agent 共存项目的基础框架，包括目录结构、核心文件、规范文档、交互式仪表板和同步机制。

## 背景

用户希望创建一个"人与 Agent 共存"的示范项目，核心需求：
1. Agent 结合代码最大化实现能力
2. 落实文档、螺丝计划
3. 项目既要给 Agent 用（详细、结构化），也要给人用（概要、交互友好）
4. 目录是"家"，Agent 和人类各自有空间，也有共享空间

## 螺丝清单

### 🔩 [x] 1. 设计项目架构
- **描述**: 设计双空间 + 共享空间的三层架构
- **验收标准**: 
  - 明确 .agent/、human/、src/ 的职责划分
  - 绘制架构图和目录结构
  - 确定内容归属矩阵
- **预计耗时**: 30min
- **依赖**: 无

### 🔩 [x] 2. 创建目录结构
- **描述**: 创建所有需要的目录
- **验收标准**:
  - .agent/{memory,knowledge,plans,tools} 存在
  - human/{dashboard,overview,reports} 存在
  - src/, docs/, scripts/, config/, tests/ 存在
- **预计耗时**: 5min
- **依赖**: 螺丝1

### 🔩 [x] 3. 编写 AGENTS.md
- **描述**: 编写 Agent 入口规范文件
- **验收标准**:
  - 包含六大核心区域（Commands, Testing, Structure, Style, Git, Boundaries）
  - 定义 Agent 角色卡
  - 明确记忆管理规范
- **预计耗时**: 30min
- **依赖**: 螺丝1

### 🔩 [x] 4. 编写 README.md
- **描述**: 编写人类入口文件
- **验收标准**:
  - 一句话介绍项目
  - 空间划分说明（带图示）
  - 快速开始指南
  - 与 Agent 协作流程
- **预计耗时**: 20min
- **依赖**: 螺丝1

### 🔩 [x] 5. 创建 Agent 记忆系统
- **描述**: 创建 .agent/memory/ 框架
- **验收标准**:
  - project-context.json 有完整 Schema
  - 记忆分层文档（工作/短期/长期）
  - 决策日志和会话摘要模板
- **预计耗时**: 20min
- **依赖**: 螺丝1

### 🔩 [x] 6. 创建螺丝计划系统
- **描述**: 创建 .agent/plans/ 框架
- **验收标准**:
  - 计划文件模板（Markdown + Frontmatter）
  - 生命周期状态定义
  - Agent 执行规范
- **预计耗时**: 20min
- **依赖**: 螺丝1

### 🔩 [x] 7. 创建人类概览区
- **描述**: 创建 human/overview/ 文件
- **验收标准**:
  - project-summary.md
  - current-plans.md
  - decisions-summary.md
  - tech-stack.md
- **预计耗时**: 20min
- **依赖**: 螺丝5, 螺丝6

### 🔩 [ ] 8. 搭建交互式仪表板
- **描述**: 创建 human/dashboard/index.html
- **验收标准**:
  - 纯前端，零依赖（或仅 Tailwind CDN）
  - 展示项目状态卡片
  - 展示活跃计划进度条
  - 展示最近决策时间线
  - 响应式布局，人类友好
- **预计耗时**: 40min
- **依赖**: 螺丝7

### 🔩 [ ] 9. 实现 agent_sync.py 同步脚本
- **描述**: 创建 scripts/agent_sync.py
- **验收标准**:
  - 读取 .agent/ 数据
  - 生成 human/overview/ Markdown
  - 刷新 dashboard/index.html 数据
  - 支持命令行参数
- **预计耗时**: 30min
- **依赖**: 螺丝7, 螺丝8

### 🔩 [ ] 10. 编写架构文档
- **描述**: 创建 docs/architecture/human-agent-coexistence.md
- **验收标准**:
  - 完整的三层架构说明
  - 同步机制设计
  - 信息流动图
  - 扩展性设计
- **预计耗时**: 30min
- **依赖**: 螺丝1

## 决策日志

- 2026-05-04: 采用双空间(.agent/ + human/) + 共享空间(src/)的三层架构
- 2026-05-04: 仪表板使用 HTML5 + Vanilla JS + Tailwind CSS，零构建步骤

## 关联

- **依赖**: 无（本项目第一个计划）
- **阻塞**: plan-001（待初始化完成后定义）
- **相关文档**: docs/architecture/human-agent-coexistence.md
