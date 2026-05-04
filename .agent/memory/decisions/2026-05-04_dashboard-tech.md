# 决策：仪表板技术选型

- **日期**: 2026-05-04
- **主题**: 人类交互式仪表板的技术栈选择
- **决策人**: agent
- **状态**: confirmed

## 背景

人类需要一个交互式仪表板来查看项目状态。技术选型需要平衡：
1. 人类友好（好看、易用）
2. Agent 可维护（Agent 能生成和更新 HTML/JS）
3. 零依赖或低依赖（不需要复杂构建步骤）
4. 可直接在浏览器打开

## 决策内容

使用 **HTML5 + Vanilla JavaScript + Tailwind CSS (CDN)** 构建仪表板。

### 技术组合

| 技术 | 用途 | 引入方式 |
|------|------|---------|
| HTML5 | 页面结构 | 原生 |
| Vanilla JS | 交互逻辑 | 原生 |
| Tailwind CSS | 样式系统 | CDN (`cdn.tailwindcss.com`) |
| Chart.js (可选) | 图表 | CDN |

### 数据注入方式

通过 `<script id="agent-data" type="application/json">` 在 HTML 中注入 JSON 数据，JS 读取并渲染。

```html
<script id="agent-data" type="application/json">
{
  "lastSync": "2026-05-04T11:00:00+08:00",
  "activePlans": [...],
  "metrics": {...}
}
</script>
```

## 备选方案

- **方案A（未采纳）**: React/Vue + Vite 构建
  - 缺点：需要构建步骤、npm install、Agent 维护成本高
- **方案B（未采纳）**: 纯 Markdown + Mermaid 图表
  - 缺点：交互性弱，人类体验不够好
- **方案C（已采纳）**: HTML5 + Vanilla JS + Tailwind CDN
  - 优点：零构建、直接打开、Agent 能生成、人类体验好

## 影响

- `human/dashboard/index.html` 将是一个自包含的 HTML 文件
- `scripts/agent_sync.py` 需要能解析和注入 JSON 数据到 HTML
- 样式使用 Tailwind utility classes，Agent 需要了解基本用法

## 相关

- 关联计划: plan-000（螺丝8）
- 关联文件: human/dashboard/index.html
