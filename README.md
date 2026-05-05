# 🤖⧉👤 Human-Agent Coexistence

> 如果你是 Agent，请阅读 `.agent/AGENTS.md`。
>
> **重要：本项目不是 Agent，是 Agent 的工作空间。**

---

## 一眼看完

```
project-root/
├── 📖 README.md   ← 你在这里
├── 🤖 AGENTS.md   ← Agent 入口
├── 🔧 cli         ← 状态查看器（不是 Agent）
└── ⚙️ config/      ← 你的配置区
```

**其他都是 Agent 的，你不用管。**

---

## 重要区分

| | 本项目 | 外部 Agent |
|--|--------|-----------|
| **是什么** | Agent 的工作空间 | 执行任务的智能体 |
| **例子** | 这个目录 | Kimi CLI、Claude Code、Cursor |
| **职责** | 规范、记忆、计划、工具 | 理解需求、写代码、做决策 |
| **交互** | `./cli` 查看状态 | 对话下指令 |

**本项目 = 房子，Agent = 住进来工作的人。**

---

## 30秒上手

```bash
# 查看状态
./cli status

# 生成项目上下文，复制给 Agent
./cli context
```

---

## 💬 协作三步

**第1步：下指令给 Agent**
```
"帮我实现用户登录功能"
```
Agent 会读取 `.agent/AGENTS.md` 了解规范，制定计划，执行。

**第2步：查看进度**
```bash
./cli status
./cli plans
```

**第3步：验收成果**
```bash
ls src/        # Agent 交付的代码
```

---

## 🛠️ 常用命令

```bash
./cli status        # 完整仪表板（实时数据）
./cli plans         # 计划进度
./cli decisions     # 决策记录
./cli context       # 生成上下文（复制给 Agent）
./cli watch         # 实时监控
./cli help          # 所有命令
```

---

## 📋 交互示例

| 你想做什么 | 你对 Agent 说 | Agent 做什么 | 你做什么 |
|-----------|-------------|------------|---------|
| 做功能 | "帮我实现登录" | 读规范 → 建计划 → 写代码 | `./cli status` 看进度 |
| 给上下文 | — | — | `./cli context` 复制给 Agent |
| 看进度 | — | 实时更新 | `./cli plans` |
| 改需求 | "登录要加短信验证" | 更新计划 | `./cli status` 确认 |
| 验收 | "看看代码" | 指出文件位置 | 看 `src/` 确认 OK |

---

## ⚙️ 配置

### Agent 偏好
```bash
# 告诉 Agent 你的偏好
"帮我在 config/ 建一个配置，我用中文，喜欢严格类型注解"
```

### MCP（Agent 工具集成）

本项目已配置 **Chrome DevTools MCP**，Agent 可以控制浏览器进行调试、截图、性能分析。

```bash
# 1. 一键启动 Chrome（远程调试模式）
./cli chrome start

# 2. Agent 自动读取 config/mcp.json 连接 Chrome

# 3. 对 Agent 说：
# "打开 http://localhost:3000 截图看看"
# "分析一下页面性能"
```

**Chrome 管理**：
```bash
./cli chrome start    # 启动 Chrome（远程调试）
./cli chrome stop     # 停止 Chrome
./cli chrome status   # 检查状态
```

**配置位置**：
- 项目级（推荐）：`config/mcp.json` — 已配置，版本控制
- 全局（可选）：运行 `./install-mcp.sh`

---

## 🔧 扩展 CLI

告诉 Agent：
```
"帮我在 CLI 加一个 report 子命令，生成周报"
```

Agent 在 `.agent/cli-src/` 实现，你立即用 `./cli report`。

---

## 📌 原则

- **你的家极简** — 根目录只有必要的东西
- **Agent 的世界在幕后** — `.agent/` 隐藏，支撑一切
- **实时数据** — `./cli` 直接读取 `.agent/`，无需同步
- **按需创建** — `src/`, `docs/`, `tests/` 不预设
- **Agent 是外部工具** — 本项目只是它的工作空间

---

*本项目是房子，Agent 是住进来的人，你掌控方向。*
