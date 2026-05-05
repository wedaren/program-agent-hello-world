/**
 * 终端渲染引擎
 * 
 * 轻量级终端 UI 渲染，使用 picocolors 提供颜色
 * 不依赖 heavy 库，保持 CLI 启动速度
 */

import pc from 'picocolors';
import type { DashboardData, Plan, Decision, Metrics } from './types';

// ─── 工具函数 ───

export function box(text: string, width: number = 40): string {
  const line = '─'.repeat(width - 2);
  return `┌${line}┐\n│ ${text.padEnd(width - 4)} │\n└${line}┘`;
}

export function progressBar(percent: number, width: number = 20): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const color = percent >= 80 ? pc.green : percent >= 40 ? pc.cyan : pc.yellow;
  return color(bar) + ' ' + pc.bold(`${percent}%`);
}

export function priorityColor(priority: string): (s: string) => string {
  const map: Record<string, (s: string) => string> = {
    critical: pc.red,
    high: pc.yellow,
    medium: pc.cyan,
    low: pc.gray,
  };
  return map[priority] || pc.white;
}

export function statusEmoji(status: string): string {
  const map: Record<string, string> = {
    active: '🟢',
    pending: '⏸️',
    completed: '✅',
    blocked: '🔴',
    cancelled: '⛔',
  };
  return map[status] || '⚪';
}

export function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

// ─── 卡片渲染 ───

export function renderCards(metrics: Metrics, health: string): string {
  const cards = [
    { icon: '📋', label: '活跃计划', value: metrics.activePlans, color: pc.blue },
    { icon: '⏳', label: '待办事项', value: metrics.openActions, color: pc.yellow },
    { icon: '✅', label: '已做决策', value: metrics.totalDecisions, color: pc.magenta },
    { icon: '🌐', label: '系统状态', value: health === 'normal' ? '正常' : health, color: health === 'normal' ? pc.green : pc.red },
  ];

  const lines: string[] = [];
  lines.push('');
  
  // 上边框
  const cardWidth = 16;
  const topBorder = cards.map(() => `╭${'─'.repeat(cardWidth)}╮`).join(' ');
  lines.push(topBorder);
  
  // 图标行
  const iconLine = cards.map(c => `│${' '.repeat(cardWidth)}│`).join(' ');
  lines.push(iconLine);
  
  // 数值行
  const valueLine = cards.map(c => {
    const val = String(c.value);
    const pad = Math.floor((cardWidth - val.length) / 2);
    return `│${' '.repeat(pad)}${c.color(pc.bold(val))}${' '.repeat(cardWidth - pad - val.length)}│`;
  }).join(' ');
  lines.push(valueLine);
  
  // 标签行
  const labelLine = cards.map(c => {
    const pad = Math.floor((cardWidth - c.label.length * 2) / 2); // 中文算2字节
    return `│${' '.repeat(Math.max(1, pad))}${pc.dim(c.label)}${' '.repeat(Math.max(1, cardWidth - pad - c.label.length * 2))}│`;
  }).join(' ');
  lines.push(labelLine);
  
  // 空行
  lines.push(iconLine);
  
  // 下边框
  const bottomBorder = cards.map(() => `╰${'─'.repeat(cardWidth)}╯`).join(' ');
  lines.push(bottomBorder);
  
  lines.push('');
  return lines.join('\n');
}

// ─── 表格渲染 ───

export function renderPlansTable(plans: Plan[]): string {
  if (plans.length === 0) {
    return pc.dim('  暂无活跃计划');
  }

  const lines: string[] = [];
  lines.push('');
  
  // 表头
  const header = `${pc.bold('状态')}  ${pc.bold('计划')}                          ${pc.bold('进度')}                ${pc.bold('优先级')}`;
  lines.push(header);
  lines.push('─'.repeat(80));
  
  for (const plan of plans) {
    const emoji = statusEmoji(plan.status);
    const title = plan.title.length > 26 ? plan.title.slice(0, 23) + '...' : plan.title;
    const titlePadded = title.padEnd(28);
    const progress = progressBar(plan.progress, 16);
    const prioColor = priorityColor(plan.priority);
    const prio = prioColor(`[${plan.priority}]`.padEnd(10));
    
    lines.push(`${emoji}     ${titlePadded} ${progress}  ${prio}`);
    lines.push(pc.dim(`      ${plan.id} · ${plan.done_screws}/${plan.total_screws} 螺丝`));
  }
  
  lines.push('');
  return lines.join('\n');
}

// ─── 时间线渲染 ───

export function renderDecisionsTimeline(decisions: Decision[]): string {
  if (decisions.length === 0) {
    return pc.dim('  暂无决策记录');
  }

  const lines: string[] = [];
  lines.push('');
  
  for (let i = 0; i < decisions.length; i++) {
    const d = decisions[i];
    const isLast = i === decisions.length - 1;
    const prefix = isLast ? '└─' : '├─';
    
    lines.push(`  ${prefix} ${pc.cyan(d.date || '?')}  ${pc.bold(d.title)}`);
  }
  
  lines.push('');
  return lines.join('\n');
}

// ─── 完整仪表板 ───

export function renderNotifications(data: DashboardData): string {
  if (!data.unreadCount || data.unreadCount === 0) return '';
  
  const lines: string[] = [];
  lines.push('');
  lines.push(pc.yellow(pc.bold(`🔔 你有 ${data.unreadCount} 条未读通知：`)));
  
  for (const n of (data.notifications || []).filter(n => !n.read).slice(0, 3)) {
    const emoji = { complete: '✅', decision: '📌', error: '❌', info: 'ℹ️' }[n.type] || '•';
    lines.push(`   ${emoji} ${n.message}`);
  }
  
  lines.push(pc.dim(`   运行 ./cli notify 查看全部，运行 ./cli dismiss 标记已读`));
  lines.push('');
  return lines.join('\n');
}

export function renderDashboard(data: DashboardData): string {
  const lines: string[] = [];
  
  // 标题
  const projectName = data.displayName || '未命名项目';
  lines.push('');
  lines.push(pc.cyan(pc.bold(' '.repeat(12) + `🤖⧉👤 ${projectName}`)));
  lines.push(pc.dim(' '.repeat(10) + 'Agent 维护细节 · 人类掌控方向'));
  lines.push('');
  
  // 通知
  lines.push(renderNotifications(data));
  
  // 指标卡片
  lines.push(renderCards(data.metrics, data.systemHealth));
  
  // 活跃计划
  if (data.activePlans.length > 0) {
    lines.push(pc.bold(pc.blue(' '.repeat(28) + '📋 活跃计划')));
    lines.push(renderPlansTable(data.activePlans));
  }
  
  // 决策
  if (data.recentDecisions.length > 0) {
    lines.push(pc.bold(pc.magenta(' '.repeat(26) + '📝 最近决策')));
    lines.push(renderDecisionsTimeline(data.recentDecisions));
  }
  
  // 页脚
  lines.push(pc.dim(`🕐 实时数据 · 最后更新: ${formatTime(data.lastSync)}`));
  lines.push('');
  
  return lines.join('\n');
}

// ─── 纯摘要模式 ───

export function renderSummary(data: DashboardData): string {
  const m = data.metrics;
  const lines: string[] = [];
  
  lines.push('');
  lines.push(pc.cyan(pc.bold('🤖⧉👤 项目摘要')));
  lines.push('');
  const health = data.systemHealth;
  lines.push(`  📋 活跃计划: ${pc.blue(m.activePlans)}  ⏳ 待办: ${pc.yellow(m.openActions)}  ✅ 决策: ${pc.magenta(m.totalDecisions)}  🌐 状态: ${health === 'normal' ? pc.green('正常') : pc.red(health || '未知')}`);
  lines.push(`  📝 ${data.projectSummary.slice(0, 60)}...`);
  lines.push(`  🕐 同步: ${formatTime(data.lastSync)}`);
  lines.push('');
  
  return lines.join('\n');
}
