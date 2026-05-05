#!/usr/bin/env bun
/**
 * cli — Human-Agent Coexistence CLI
 * 
 * 职责：人类的状态查看器，帮助人类与外部 Agent 协作。
 * 
 * 重要：本项目 CLI 不是 Agent 本身。
 * Agent 是外部环境：Kimi CLI、Claude Code、Cursor 等。
 * 本项目是 Agent 的规范化工作空间。
 */

import pc from 'picocolors';
import { version } from '../package.json';

const commands: Record<string, () => void> = {
  status: () => require('./commands/status').run(),
  plans: () => require('./commands/plans').run(),
  decisions: () => require('./commands/decisions').run(),
  summary: () => require('./commands/summary').run(),
  browser: () => require('./commands/browser').run(),
  context: () => require('./commands/context').run(),
  chrome: () => require('./commands/chrome').run(),
  help: () => require('./commands/help').run(),
  '-h': () => require('./commands/help').run(),
  '--help': () => require('./commands/help').run(),
};

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  if (command === '--version' || command === '-v') {
    console.log(`cli v${version}`);
    process.exit(0);
  }
  
  if (command === 'watch') {
    require('./commands/watch').run(args.slice(1));
    return;
  }
  
  if (command === 'chrome') {
    require('./commands/chrome').run(args.slice(1));
    return;
  }
  
  const handler = commands[command];
  if (handler) {
    handler();
  } else {
    console.error(pc.red(`❌ 未知命令: ${command}`));
    console.error(pc.dim('   运行 ./cli help 查看可用命令'));
    process.exit(1);
  }
}

main();
