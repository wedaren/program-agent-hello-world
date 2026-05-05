# NanoClaw 项目资料整理

> 来源：https://github.com/qwibitai/nanoclaw  
> 官网：https://nanoclaw.dev  
> 整理时间：2026-05-05

---

## 一、项目简介

**NanoClaw** 是一个轻量级、开源的个人 AI Agent 框架，核心理念是：**代码量小到足以理解，安全性强到可以信任**。

它在用户自己的机器上运行，将 Claude 等 AI 模型接入到 WhatsApp、Telegram、Discord、Slack 等消息平台，让每个 Agent 都在独立的 Linux 容器中运行，实现真正的操作系统级隔离。

---

## 二、为什么要做 NanoClaw（与 OpenClaw 对比）

| 维度 | NanoClaw | OpenClaw |
|------|----------|----------|
| 源文件数 | ~15 | 3,680 |
| 代码行数 | ~3,900 | 434,453 |
| 依赖数量 | <10 | 70+ |
| 配置文件 | 0 | 53 |
| 理解所需时间 | ~8 分钟 | 1–2 周 |
| 安全模型 | **OS 容器隔离** | 应用级权限检查 |
| 架构 | 单进程 + 隔离容器 | 单进程，共享内存 |

作者认为：OpenClaw 虽然功能强大，但近 50 万行代码、70+ 依赖、53 个配置文件，很难让人真正理解并信任它访问自己的生活。NanoClaw 提供相同的核心功能，但代码量小到可以完整审阅和理解。

---

## 三、核心特性

### 1. 多渠道消息支持
支持 WhatsApp、Telegram、Discord、Slack、Microsoft Teams、iMessage、Matrix、Google Chat、Webex、Linear、GitHub、WeChat、邮件（Resend）等。通过 `/add-<channel>` 技能按需安装，可同时运行一个或多个。

### 2. 灵活的隔离模型（v2 新增）
- **独立 Agent**：每个频道接入自己的 Agent，完全隔离
- **共享 Agent**：多个频道共享同一个 Agent，统一记忆但会话独立
- **合并会话**：多个频道合并为单一共享会话，跨平台同一段对话

通过 `/manage-channels` 按频道配置。

### 3. 按 Agent 组的工作空间
每个 Agent 组拥有：
- 独立的 `CLAUDE.md` 指令文件
- 独立的记忆/上下文
- 独立的容器
- 仅显式挂载的目录可见

### 4. 定时任务
支持周期性任务（如"每天早上 9 点发送销售简报"），任务触发后 Agent 运行并回发消息。

### 5. 容器隔离
- **默认**：Docker（支持 macOS / Linux / WSL2）
- **可选增强**：Docker Sandboxes（微 VM 级隔离）
- **macOS 原生可选**：Apple Container（更轻量）

### 6. 凭证安全（OneCLI Agent Vault）
Agent **永远不会持有原始 API 密钥**。所有出站请求通过 OneCLI 的 Agent Vault 代理，在请求时注入凭证，并支持按 Agent 的策略和速率限制。

### 7. 网页访问
内置搜索和抓取网页内容的能力。

### 8. 技能扩展（Skills over Features）
主干（trunk）只提供注册表和基础设施。频道适配器、替代模型提供商等都作为"技能"按需安装：
- `/add-telegram`、`/add-slack` 等 → 从 `channels` 分支复制所需模块
- `/add-opencode`、`/add-codex`、`/add-ollama-provider` → 从 `providers` 分支安装

---

## 四、架构设计

### 数据流概览

```
消息应用 → 宿主进程（路由）→ inbound.db → 容器（Bun + Claude Agent SDK）
                                                               ↓
消息应用 ← 宿主进程（投递）← outbound.db ←────────────── 响应写出
```

### 关键组件

| 文件 | 职责 |
|------|------|
| `src/index.ts` | 入口：DB 初始化、频道适配器、投递轮询、清理扫描 |
| `src/router.ts` | 入站路由：消息组 → Agent 组 → 会话 → `inbound.db` |
| `src/delivery.ts` | 轮询 `outbound.db`，通过适配器投递，处理系统动作 |
| `src/host-sweep.ts` | 60 秒扫描：过期检测、到期消息唤醒、周期性任务 |
| `src/session-manager.ts` | 解析会话，打开 `inbound.db` / `outbound.db` |
| `src/container-runner.ts` | 按 Agent 组启动容器，OneCLI 凭证注入 |
| `src/db/` | 中央数据库（用户、角色、Agent 组、消息组、路由、迁移） |
| `src/channels/` | 频道适配器基础设施 |
| `src/providers/` | 宿主端提供商配置（Claude 内置，其他通过技能） |
| `container/agent-runner/` | Bun 运行的 Agent 轮询循环、MCP 工具、提供商抽象 |
| `groups/<folder>/` | 每个 Agent 组的文件系统（`CLAUDE.md`、技能、容器配置） |

### v2 重大架构变更

- **新的实体模型**：用户、角色（owner/admin）、消息组、Agent 组作为独立实体，通过 `messaging_group_agents` 关联
- **双 DB 会话拆分**：每个会话有 `inbound.db`（宿主写，容器读）和 `outbound.db`（容器写，宿主读），消除 SQLite 跨挂载竞争
- **频道移至 `channels` 分支**：主干不再自带任何频道，按需安装
- **替代提供商移至 `providers` 分支**：OpenCode、Codex、Ollama 等按需安装
- **Agent-runner 从 Node 迁到 Bun**：容器镜像自包含

---

## 五、安装与快速开始

### 要求
- macOS / Linux / Windows（WSL2）
- Node.js 20+ & pnpm 10+（安装脚本会自动安装缺失项）
- Docker Desktop（macOS/Windows）或 Docker Engine（Linux）
- Claude Code（用于 `/customize`、错误恢复、`/add-*` 技能）

### 三步安装

```bash
git clone https://github.com/qwibitai/nanoclaw.git nanoclaw-v2
cd nanoclaw-v2
bash nanoclaw.sh
```

`nanoclaw.sh` 会自动完成：安装 Node/pnpm/Docker → 通过 OneCLI 注册 Anthropic 凭证 → 构建 Agent 容器 → 配对第一个频道。如果某步失败，自动调用 Claude Code 诊断并恢复。

### v1 → v2 迁移

```bash
git clone https://github.com/qwibitai/nanoclaw.git nanoclaw-v2
cd nanoclaw-v2
bash migrate-v2.sh
```

---

## 六、使用示例

默认触发词为 `@Andy`，在任意已配对的频道中：

```
@Andy 每个工作日上午 9 点给我发送销售管道概览（可以访问我的 Obsidian 仓库文件夹）
@Andy 每周五查看过去一周的 git 历史，如果 README 有偏差就更新
@Andy 每周一早上 8 点，从 Hacker News 和 TechCrunch 编译 AI 发展新闻并发给我
```

管理命令（需 owner/admin）：
```
@Andy 列出所有分组中的定时任务
@Andy 暂停周一简报任务
@Andy 加入家庭聊天组
```

---

## 七、安全设计

1. **容器隔离**：Agent 在 Linux 容器中运行，只能看到显式挂载的目录
2. **凭证代理**：原始 API 密钥不进入容器，通过 OneCLI Agent Vault 在请求时注入
3. **代码可审计**：~15 个源文件、<10 个依赖，完整审阅可行
4. **Bash 安全**：命令在容器内执行，不在宿主机上运行
5. **按 Agent 的策略**：OneCLI 支持速率限制和访问策略

---

## 八、设计理念

| 原则 | 说明 |
|------|------|
| **小到可以理解** | 一个进程、几个源文件、无微服务。让 Claude Code 带你走一遍就能理解全部代码 |
| **隔离即安全** | 真正的 OS 级容器隔离，而非应用级权限检查 |
| **为个人用户构建** | 不是庞大框架，而是为每个用户量身定制的软件。Fork 后让 Claude Code 按你的需求修改 |
| **定制化 = 改代码** | 没有配置膨胀。想要不同行为？直接改代码。代码量小到安全可改 |
| **AI 原生，混合设计** | 安装流程是脚本化的快速路径；需要判断时无缝交给 Claude Code |
| **技能优于功能** | 主干只提供基础设施，具体能力通过技能按需添加 |
| **最佳 harness，最佳模型** | 原生通过 Claude Agent SDK 使用 Claude Code；其他模型（OpenAI、DeepSeek、Ollama 本地模型等）作为可选插件 |

---

## 九、版本历史要点

| 版本 | 时间 | 关键变更 |
|------|------|----------|
| **v2.0.0** | 2026-04-22 | 重大架构重写：新实体模型、双 DB 会话、频道/提供商移至分支、三级隔离、Apple Container 移出默认、Agent-runner 改用 Bun |
| v1.2.36 | 2026-03-26 | 内置 logger 替换 pino |
| v1.2.35 | 2026-03-26 | OneCLI Agent Vault 替代内置凭证代理 |
| v1.2.13 | 2026-03-14 | 技能改为 git 分支形式；频道改为独立 fork 仓库 |
| v1.2.0 | 2026-03-02 | WhatsApp 从核心移除，改为技能；频道自注册模式 |
| v1.1.0 | 2026-02-23 | 增加 `/update` 技能；增强容器环境隔离 |

---

## 十、社区与资源

- **GitHub**：https://github.com/qwibitai/nanoclaw
- **官网**：https://nanoclaw.dev
- **文档**：https://docs.nanoclaw.dev
- **Discord**：项目主页有加入链接
- **许可证**：MIT

---

## 十一、关键文档索引

| 文档 | 位置 |
|------|------|
| 架构详细说明 | `docs/architecture.md` |
| 隔离模型 | `docs/isolation-model.md` |
| 数据库与会话 | `docs/db-session.md` |
| v1 → v2 变更 | `docs/v1-to-v2-changes.md` |
| 迁移开发说明 | `docs/migration-dev.md` |
| 更新日志 | `CHANGELOG.md` |
