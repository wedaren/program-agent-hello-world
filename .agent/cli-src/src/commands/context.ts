/**
 * cli context — 生成 Agent 友好的项目上下文
 * 
 * 输出一段文本摘要，方便人类直接复制粘贴给外部 Agent（Kimi、Claude 等）。
 * 不是让 CLI 成为 Agent，而是帮人类更好地与外部 Agent 沟通。
 */

import { requireProjectRoot } from '../lib/data';
import { join } from 'path';
import { readFileSync } from 'fs';

export function run(): void {
  const root = requireProjectRoot();
  
  // 读取核心数据
  const context = JSON.parse(readFileSync(join(root, '.agent', 'memory', 'project-context.json'), 'utf-8'));
  
  const plansDir = join(root, '.agent', 'plans', 'active');
  const decisionsDir = join(root, '.agent', 'memory', 'decisions');
  
  // 组装输出
  const lines: string[] = [];
  
  lines.push('═══ 项目上下文 ═══');
  lines.push('');
  lines.push(`项目：${context.summary || '未设置摘要'}`);
  lines.push('');
  
  // 待办
  const actions = context.open_actions || [];
  if (actions.length > 0) {
    lines.push('【待办事项】');
    actions.forEach((a: string) => lines.push(`  • ${a}`));
    lines.push('');
  }
  
  // 活跃计划
  lines.push('【活跃计划】');
  try {
    const plans = readFileSync(join(plansDir, 'plan-000_init.md'), 'utf-8');
    // 简单提取标题和进度
    const titleMatch = plans.match(/title:\s*"([^"]+)"/);
    const progressMatch = plans.match(/progress.*?(\d+)%/);
    if (titleMatch) {
      lines.push(`  • ${titleMatch[1]} ${progressMatch ? `(${progressMatch[1]}%)` : ''}`);
    }
  } catch {
    lines.push('  • 暂无活跃计划');
  }
  lines.push('');
  
  // 最近决策
  lines.push('【最近决策】');
  try {
    const decFiles = require('fs').readdirSync(decisionsDir).filter((f: string) => f.endsWith('.md'));
    decFiles.slice(0, 3).forEach((f: string) => {
      const content = readFileSync(join(decisionsDir, f), 'utf-8');
      const topicMatch = content.match(/\*\*主题\*\*[：:]\s*(.+)/);
      if (topicMatch) lines.push(`  • ${topicMatch[1].trim()}`);
    });
  } catch {
    lines.push('  • 暂无决策');
  }
  lines.push('');
  
  lines.push('【规范要点】');
  lines.push('  • Agent 工作区：.agent/（记忆、计划、工具）');
  lines.push('  • 人类配置区：config/');
  lines.push('  • 代码按需创建：src/、docs/、tests/');
  lines.push('  • 完整规范：.agent/AGENTS.md');
  lines.push('');
  lines.push('═══ 复制上方内容发送给 Agent ═══');
  
  console.log(lines.join('\n'));
}
