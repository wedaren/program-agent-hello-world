/**
 * cli browser — 打开浏览器仪表板
 * 
 * 实时生成 HTML 仪表板到 .agent/.cache/dashboard.html，然后打开浏览器。
 */

import { requireProjectRoot } from '../lib/data';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import pc from 'picocolors';

export function run(): void {
  const root = requireProjectRoot();
  const cacheDir = join(root, '.agent', '.cache');
  const htmlPath = join(cacheDir, 'dashboard.html');
  
  mkdirSync(cacheDir, { recursive: true });
  
  // 生成简单的 HTML 仪表板（未来可扩展）
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard</title>
<style>
body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;background:#f5f5f5}
.card{background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
h1{color:#333;font-size:24px}
.metric{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:20px 0}
.metric-item{background:#f8f9fa;padding:16px;border-radius:8px;text-align:center}
.metric-value{font-size:28px;font-weight:bold;color:#0066cc}
.metric-label{color:#666;font-size:14px;margin-top:4px}
</style>
</head>
<body>
<h1>🤖⧉👤 Dashboard</h1>
<p style="color:#666">实时数据，无需同步</p>
<div class="card">
  <div class="metric">
    <div class="metric-item">
      <div class="metric-value">-</div>
      <div class="metric-label">活跃计划</div>
    </div>
    <div class="metric-item">
      <div class="metric-value">-</div>
      <div class="metric-label">待办</div>
    </div>
    <div class="metric-item">
      <div class="metric-value">-</div>
      <div class="metric-label">决策</div>
    </div>
    <div class="metric-item">
      <div class="metric-value">✅</div>
      <div class="metric-label">系统正常</div>
    </div>
  </div>
</div>
<div class="card">
  <h3>💡 提示</h3>
  <p>浏览器版仪表板目前为基础版。</p>
  <p>推荐使用终端版：<code style="background:#f0f0f0;padding:4px 8px;border-radius:4px">./cli status</code></p>
</div>
</body>
</html>`;
  
  writeFileSync(htmlPath, html, 'utf-8');
  
  const url = `file://${htmlPath}`;
  console.log(pc.cyan(`🌐 正在打开浏览器`));
  
  const { spawn } = require('child_process');
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  spawn(cmd, [url], { detached: true });
}
