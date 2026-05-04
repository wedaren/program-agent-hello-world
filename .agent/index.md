# .agent/ — Agent 的完整世界

> **Agent 专属区域。** 这里存放 Agent 工作所需的一切：详细资料、记忆、计划、工具、CLI 源码。
> 
> 人类通常不直接阅读这里，内容通过 `.human/` 中的产物和 `./cli` 呈现。

---

## 目录导航

```
.agent/
├── AGENTS.md              ← Agent 完整规范（你在这里）
├── index.md               ← 本索引
├── memory/                ← 结构化记忆系统
│   ├── project-context.json    ← 项目核心上下文（每次会话必读）
│   ├── index.md               ← 记忆系统说明
│   ├── decisions/             ← 决策日志（只追加）
│   └── sessions/              ← 会话历史摘要
├── knowledge/             ← Agent 知识库
│   └── project-standards.md   ← 项目标准与约定
├── plans/                 ← 螺丝计划系统
│   ├── index.md               ← 计划系统规范
│   ├── active/                ← 活跃计划
│   ├── pending/               ← 待开始计划
│   └── completed/             ← 已完成计划
├── tools/                 ← Agent 工具脚本
│   ├── agent_sync.py          ← 同步脚本（Agent → .human/）
│   └── README.md
├── cli-src/               ← CLI 源码（Agent 维护）
│   ├── src/
│   │   ├── index.ts           ← CLI 入口
│   │   ├── commands/          ← 子命令
│   │   └── lib/               ← 核心库
│   ├── package.json
│   └── dist/cli               ← 编译产物（被根目录 cli 调用）
└── docs/                  ← 技术文档（按需）
```

---

## 核心记忆文件

`.agent/memory/project-context.json` — 每次会话开始时必须加载。

```typescript
// 概念加载
const context = JSON.parse(readFile(".agent/memory/project-context.json"));
```

---

## 工作流速查

1. **会话开始**
   - 读 `.agent/AGENTS.md`
   - 读 `.agent/memory/project-context.json`
   - 看 `.agent/plans/active/`
   - 加载相关 `knowledge/` 文件

2. **执行任务**
   - 制定或细化计划 → `.agent/plans/active/`
   - 按需创建 `src/` 编写代码
   - 记录决策 → `.agent/memory/decisions/`

3. **会话结束**
   - 更新 `project-context.json`
   - 运行 `.agent/tools/agent_sync.py`
   - 按需提交变更

---

## 与人类协作要点

- **同步优先**：完成工作后务必同步到 `.human/`，否则 CLI 看不到
- **摘要要精炼**：给人类的输出 <= 3 个要点，详情放 `.agent/`
- **尊重边界**：不要擅自修改根目录 `cli` 或 `README.md`
- **按需创建**：`src/`, `docs/`, `tests/` 只在需要时创建

---

*这是你的主场。保持整洁，记录完整。*
