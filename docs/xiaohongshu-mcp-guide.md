# 小红书运营 × Chrome DevTools MCP 实践指南

> 基于对 Chrome DevTools MCP 工具链和小红书网页版的深度调研，总结可行方案与局限。

---

## 一、Chrome DevTools MCP 能力全景

Chrome DevTools MCP 提供 **26 个工具**，分为 6 大类：

| 类别 | 工具 | 小红书场景 |
|------|------|-----------|
| **导航** | `navigate_page`, `new_page`, `list_pages`, `close_page`, `wait_for` | 打开小红书网页、创作者中心 |
| **输入** | `click`, `fill`, `fill_form`, `hover`, `press_key`, `upload_file` | 登录、搜索、填写发布表单 |
| **调试** | `evaluate_script`, `take_screenshot`, `take_snapshot`, `list_console_messages` | 抓取页面数据、截图记录 |
| **网络** | `list_network_requests`, `get_network_request` | 分析 API 请求、获取热门话题数据 |
| **模拟** | `emulate`, `resize_page` | 模拟移动端视口 |
| **性能** | `performance_start_trace`, `performance_stop_trace` | 页面加载分析（次要） |

**核心工作流：**
```
navigate_page → evaluate_script(分析) → take_screenshot(记录)
  ↓
click/fill(交互) → upload_file(上传) → click(发布)
```

---

## 二、小红书网页版能力边界

### 2.1 网页版支持的功能

| 功能 | 支持度 | 备注 |
|------|--------|------|
| 浏览内容/搜索 | ✅ 完整 | xiaohongshu.com |
| 登录/保持会话 | ✅ 完整 | 扫码/手机验证码 |
| 创作者中心数据查看 | ✅ 完整 | creator.xiaohongshu.com |
| 图文发布 | ⚠️ 部分 | 2025 网页版支持基础图文发布 |
| 视频发布 | ❌ 不支持 | 必须 APP |
| 评论/点赞/收藏 | ✅ 完整 | 网页版可操作 |
| 商品链接/带货 | ❌ 不支持 | 必须 APP |
| 直播管理 | ❌ 不支持 | 必须 APP |

### 2.2 关键结论

> **小红书的核心生态在 APP 端**，网页版是辅助入口。Chrome DevTools MCP 能自动化**网页版能做的一切**，但无法替代 APP 端操作。

---

## 三、可落地的自动化场景

### 场景 A：选题库建设（⭐ 最实用）

**目标**：自动收集热门内容，为人工选题提供数据支持。

**工作流：**
1. Agent 打开 `https://www.xiaohongshu.com/search_result?keyword=职场`
2. `evaluate_script` 抓取笔记标题、点赞数、收藏数
3. `take_screenshot` 截图保存高互动笔记
4. 数据存入 `.agent/knowledge/trending/`
5. 人类基于数据制定选题

**示例脚本（evaluate_script）：**
```javascript
// 抓取搜索结果页笔记数据
const notes = [...document.querySelectorAll('.note-item')].map(el => ({
  title: el.querySelector('.title')?.innerText,
  likes: el.querySelector('.like-count')?.innerText,
  author: el.querySelector('.author')?.innerText,
  url: el.querySelector('a')?.href
}));
JSON.stringify(notes.slice(0, 10));
```

### 场景 B：创作者中心数据监控（⭐ 可行）

**目标**：定期截图/抓取创作者中心数据，生成周报。

**工作流：**
1. Agent 打开 `https://creator.xiaohongshu.com`
2. 已登录状态下直接进入数据面板
3. `take_screenshot` 截图关键指标
4. `evaluate_script` 提取数字（粉丝数、阅读量等）
5. 存入 `.agent/memory/analytics/`

**关键：** 依赖持久化 Chrome profile（`config/chrome.yaml` 中 `isolated: false`），否则每次启动需重新登录。

### 场景 C：网页版发布辅助（⚠️ 部分可行）

**目标**：辅助完成网页版能发布的图文内容。

**工作流：**
1. Agent 打开网页版发布页面
2. `upload_file` 上传图片
3. `fill` 填写标题和正文
4. `click` 选择话题标签
5. `click` 点击发布

**局限：**
- 网页版编辑器功能有限（排版、贴纸等无法使用）
- 无法处理视频内容
- 图片顺序调整、封面选择等操作可能不稳定的

### 场景 D：竞品分析（⭐ 可行）

**目标**：监控竞品账号最新内容。

**工作流：**
1. Agent 打开竞品主页 URL
2. `take_screenshot` 截图最新笔记
3. `evaluate_script` 抓取互动数据
4. 保存到 `.agent/knowledge/competitors/`

---

## 四、不可行的场景（避免踩坑）

| 场景 | 原因 |
|------|------|
| 视频发布 | 网页版不支持 |
| 直播操作 | 必须 APP |
| 完整图文排版 | 网页版编辑器功能简陋 |
| 带货商品挂载 | 必须 APP |
| 私信自动回复 | 网页版无此功能 |
| 评论区批量操作 | 违反平台规则，且不稳定 |

---

## 五、配置最佳实践

### 5.1 Chrome Profile 持久化

编辑 `config/chrome.yaml`：

```yaml
chrome:
  data_dir: ".agent/chrome-profile"  # 持久化登录态
  isolated: false                    # 不要每次清理
  headless: false                    # 开发时保留窗口，方便观察
```

**首次启动后：**
1. `./cli chrome start`
2. 人工在小红书网页版完成登录（扫码或验证码）
3. 登录态保存在 `.agent/chrome-profile/`
4. 后续 Agent 可直接访问已登录页面

### 5.2 与 MCP 配置同步

确保 `config/mcp.json` 中的 `--browser-url` 端口与 `config/chrome.yaml` 中的 `remote_debugging_port` 一致：

```yaml
# config/chrome.yaml
chrome:
  remote_debugging_port: 9222
```

```json
// config/mcp.json
{
  "mcpServers": {
    "chrome-devtools": {
      "args": [
        "--browser-url", "http://127.0.0.1:9222"
      ]
    }
  }
}
```

CLI 会在启动时自动校验并警告不一致。

### 5.3 无头模式生产环境

定时任务（如每日数据抓取）可开启无头模式：

```yaml
chrome:
  headless: true
```

---

## 六、Agent 提示词模板

### 6.1 选题研究任务

```
请帮我研究小红书上的热门职场内容：

1. 打开 https://www.xiaohongshu.com/search_result?keyword=职场
2. 滚动页面加载更多内容
3. 提取前 20 条笔记的：标题、点赞数、作者
4. 截图保存互动量最高的 3 条笔记
5. 将数据整理成表格保存到 .agent/knowledge/trending/2025-05-04.md

注意事项：
- 如果页面需要登录，先截图让我确认状态
- 抓取数据时只读取可见内容，不要模拟点击进入详情页
- 尊重平台规则，不要高频请求
```

### 6.2 数据监控任务

```
请帮我抓取创作者中心今日数据：

1. 打开 https://creator.xiaohongshu.com
2. 如果未登录，截图提示我
3. 进入数据概览页面
4. 截图保存关键数据面板
5. 提取今日阅读数、互动数、粉丝变化
6. 追加到 .agent/memory/analytics/daily.csv
```

---

## 七、参考项目

| 项目 | 说明 | 可借鉴点 |
|------|------|---------|
| [IIIIQIIII/x-agent](https://github.com/IIIIQIIII/x-agent) | X.com 自动化 | Agent SDK + Chrome DevTools MCP 的完整工作流 |
| [sugarforever/01coder-agent-skills](https://github.com/sugarforever/01coder-agent-skills) | Substack 发布 Skill | `navigate_page` → `fill` → `click` → `take_screenshot` 的模板 |

---

## 八、总结：MCP 在小红书运营中的定位

```
┌─────────────────────────────────────────────────────────────┐
│                    小红书运营工作流                          │
├─────────────────────────────────────────────────────────────┤
│  内容研究      ✅ MCP 可自动化（浏览、截图、数据抓取）        │
│  选题决策      ❌ 需人工（基于 MCP 收集的数据做判断）         │
│  内容创作      ❌ 需人工（文案、图片设计）                    │
│  图文发布      ⚠️ 部分 MCP（网页版基础发布）                 │
│  视频发布      ❌ 必须 APP                                  │
│  数据监控      ✅ MCP 可自动化（定期截图/抓取）               │
│  互动运营      ❌ 需人工（评论回复、粉丝维护）                │
│  竞品分析      ✅ MCP 可自动化（浏览、截图、数据记录）        │
└─────────────────────────────────────────────────────────────┘
```

**核心建议：**
1. 把 MCP 当作**数据收集和监控工具**，而非全自动运营工具
2. 让 Agent 负责**重复性浏览、截图、数据提取**，人类负责**选题、创作、决策**
3. 利用持久化 Chrome profile 避免每次重新登录
4. 遵守平台规则，控制请求频率，避免触发反爬
