# MCP 配置说明

> 本项目使用 **项目级 MCP 配置**。Agent 进入项目后自动读取 `config/mcp.json`。

---

## 已配置的 MCP Server

| Server | 用途 | 启动方式 |
|--------|------|---------|
| `chrome-devtools` | 浏览器调试、截图、性能分析 | `npx chrome-devtools-mcp@latest` |

---

## 快速开始

### 1. 启动 Chrome（远程调试模式）

```bash
# 一键启动（推荐）
./cli chrome start

# 或手动启动
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-dev-profile
```

### 2. Agent 自动连接

Agent 进入项目后读取 `config/mcp.json`，自动连接 Chrome DevTools MCP。

### 3. 使用示例

对 Agent 说：
```
"打开 http://localhost:3000，截图看看页面效果"
"分析一下这个页面的性能瓶颈"
"看看控制台有没有报错"
```

---

## 配置位置说明

**推荐：项目级配置（已配置）**
- 文件：`config/mcp.json`
- 优点：与项目绑定、版本控制、团队协作一致
- Agent 自动发现

**可选：全局配置**
- Claude Code: `~/.claude/mcp.json`
- Cursor: `~/.cursor/mcp.json`
- 其他 Agent: 参考各自文档

---

##  Troubleshooting

**问题：Agent 说找不到 MCP Server**
- 确认 Chrome 已以 `--remote-debugging-port=9222` 启动
- 确认 `config/mcp.json` 存在
- 运行 `curl http://127.0.0.1:9222/json` 测试 Chrome 是否响应

**问题：端口被占用**
- 换个端口：`--remote-debugging-port=9223`
- 同时修改 `config/mcp.json` 中的 `--browser-url`

**问题：权限不足**
- macOS 可能需要给 Terminal 辅助功能权限

---

*配置由 Agent 维护。需要新增 MCP Server？告诉 Agent："帮我加一个 xxx MCP"*
