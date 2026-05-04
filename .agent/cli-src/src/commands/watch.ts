/**
 * hac watch — 实时监控模式
 * 
 * 像 htop 一样定时刷新，Ctrl+C 退出
 */

import { renderDashboard, renderSummary } from '../lib/render';
import { loadData, requireProjectRoot } from '../lib/data';
import pc from 'picocolors';

export function run(args: string[]): void {
  const root = requireProjectRoot();
  
  // 解析 --interval 参数
  let interval = 30;
  const intervalIdx = args.indexOf('--interval');
  if (intervalIdx !== -1 && args[intervalIdx + 1]) {
    interval = parseInt(args[intervalIdx + 1], 10) || 30;
  }
  
  console.log(pc.cyan(`👁️ 监控模式启动，每 ${interval} 秒刷新（Ctrl+C 退出）...`));
  console.log('');
  
  // 首次显示
  renderOnce(root);
  
  // 定时刷新
  const timer = setInterval(() => {
    // 清屏
    console.clear();
    renderOnce(root, interval);
  }, interval * 1000);
  
  // 捕获退出
  process.on('SIGINT', () => {
    clearInterval(timer);
    console.log('');
    console.log(pc.yellow('👋 监控模式已退出'));
    process.exit(0);
  });
  
  // 保持进程运行
  process.stdin.resume();
}

function renderOnce(root: string, interval?: number): void {
  const data = loadData(root);
  console.log(renderDashboard(data));
  
  if (interval) {
    const now = new Date().toLocaleTimeString('zh-CN');
    console.log(pc.dim(`🕐 ${now} — ${interval}秒后刷新（Ctrl+C 退出）`));
  }
}
