/**
 * 数据加载模块 — 实时解析版
 * 
 * CLI 直接从 .agent/ 源数据实时解析，无需 .human/ 产物目录。
 * 每次运行 ./cli 都读取最新状态，零延迟。
 */

import { join } from 'path';
import { existsSync, readFileSync, readdirSync } from 'fs';
import type { DashboardData, Plan, Decision, Metrics } from './types';

/**
 * 向上查找项目根目录
 */
export function findProjectRoot(startDir: string = process.cwd()): string | null {
  let current = startDir;
  
  while (current !== '/') {
    if (existsSync(join(current, 'README.md')) && existsSync(join(current, '.agent'))) {
      return current;
    }
    const parent = join(current, '..');
    if (parent === current) break;
    current = parent;
  }
  
  return null;
}

export function requireProjectRoot(): string {
  const root = findProjectRoot();
  if (!root) {
    console.error('❌ 未找到项目根目录');
    console.error('   请在 Human-Agent Coexistence 项目目录内运行此命令');
    process.exit(1);
  }
  return root;
}

// ─── 基础工具 ───

function readJson(path: string): any {
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function readText(path: string): string {
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf-8');
}

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'index.md');
}

// ─── Frontmatter 解析 ───

function parseFrontmatter(text: string): { meta: Record<string, any>; body: string } {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: text };
  
  const meta: Record<string, any> = {};
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    let val = trimmed.slice(colonIdx + 1).trim();
    val = val.replace(/^["']|["']$/g, '');
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((v: string) => v.trim().replace(/^["']|["']$/g, ''));
    }
    meta[key] = val;
  }
  return { meta, body: match[2] };
}

// ─── 计划解析 ───

function parsePlanFile(path: string): Plan | null {
  const text = readText(path);
  if (!text) return null;
  
  const { meta, body } = parseFrontmatter(text);
  const total = (body.match(/🔩\s*\[[ xX]\]/g) || []).length;
  const done = (body.match(/🔩\s*\[[xX]\]/g) || []).length;
  const progress = total > 0 ? Math.round(done / total * 100) : 0;
  
  return {
    id: meta.id || '',
    title: meta.title || '',
    status: meta.status || 'unknown',
    priority: meta.priority || 'medium',
    progress,
    total_screws: total,
    done_screws: done,
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    created_at: meta.created_at || '',
    started_at: meta.started_at || '',
  };
}

function loadPlans(root: string, statusDir: string): Plan[] {
  const dir = join(root, '.agent', 'plans', statusDir);
  return listFiles(dir)
    .map(f => parsePlanFile(join(dir, f)))
    .filter((p): p is Plan => p !== null)
    .sort((a, b) => a.id.localeCompare(b.id));
}

// ─── 决策解析 ───

function parseDecisionFile(path: string): Decision | null {
  const text = readText(path);
  if (!text) return null;
  
  const titleMatch = text.match(/# 决策[：:](.+)/);
  const dateMatch = text.match(/\*\*日期\*\*[：:]\s*(\d{4}-\d{2}-\d{2})/);
  const topicMatch = text.match(/\*\*主题\*\*[：:]\s*(.+)/);
  
  return {
    file: path.split('/').pop() || '',
    title: titleMatch ? titleMatch[1].trim() : '',
    date: dateMatch ? dateMatch[1] : '',
    topic: topicMatch ? topicMatch[1].trim() : '',
  };
}

function loadDecisions(root: string): Decision[] {
  const dir = join(root, '.agent', 'memory', 'decisions');
  return listFiles(dir)
    .map(f => parseDecisionFile(join(dir, f)))
    .filter((d): d is Decision => d !== null)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

// ─── 主入口：实时加载 ───

export function loadData(root: string): DashboardData {
  const context = readJson(join(root, '.agent', 'memory', 'project-context.json'));
  const activePlans = loadPlans(root, 'active');
  const pendingPlans = loadPlans(root, 'pending');
  const completedPlans = loadPlans(root, 'completed');
  const decisions = loadDecisions(root);
  
  // 读取通知
  const notifications = context.notifications || [];
  const unreadCount = notifications.filter((n: any) => !n.read).length;
  
  return {
    lastSync: context.last_updated || new Date().toISOString(),
    displayName: context.display_name || '未命名项目',
    projectSummary: context.summary || '暂无项目摘要',
    metrics: {
      activePlans: activePlans.length,
      pendingPlans: pendingPlans.length,
      completedPlans: completedPlans.length,
      totalDecisions: decisions.length,
      openActions: (context.open_actions || []).length,
    },
    activePlans,
    recentDecisions: decisions.slice(0, 5),
    systemHealth: 'normal',
    notifications,
    unreadCount,
  };
}
