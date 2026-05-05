/**
 * cli chrome — Chrome 远程调试管理
 * 
 * 一键启动/停止 Chrome DevTools 远程调试模式，
 * 配合 config/mcp.json 中的 Chrome DevTools MCP 使用。
 */

import { spawn, execSync } from 'child_process';
import pc from 'picocolors';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEBUG_PORT = 9222;
const USER_DATA_DIR = '/tmp/chrome-dev-profile';

function isChromeRunning(): boolean {
  try {
    execSync(`curl -s http://127.0.0.1:${DEBUG_PORT}/json > /dev/null 2>&1`);
    return true;
  } catch {
    return false;
  }
}

function startChrome(): void {
  if (isChromeRunning()) {
    console.log(pc.yellow('⚠️  Chrome 远程调试已在运行'));
    console.log(pc.dim(`   http://127.0.0.1:${DEBUG_PORT}`));
    return;
  }

  console.log(pc.cyan('🚀 启动 Chrome（远程调试模式）...'));
  console.log(pc.dim(`   端口: ${DEBUG_PORT}`));
  console.log(pc.dim(`   数据目录: ${USER_DATA_DIR}`));
  console.log('');

  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--new-window',
    'about:blank',
  ], {
    detached: true,
    stdio: 'ignore',
  });

  chrome.unref();

  // 等待启动
  let attempts = 0;
  const checkInterval = setInterval(() => {
    attempts++;
    if (isChromeRunning()) {
      clearInterval(checkInterval);
      console.log(pc.green('✅ Chrome 已启动'));
      console.log(pc.dim(`   调试地址: http://127.0.0.1:${DEBUG_PORT}`));
      console.log(pc.dim('   Agent 现在可以通过 MCP 控制浏览器'));
      console.log('');
      console.log('💡 提示:');
      console.log('   ./cli chrome status  — 检查状态');
      console.log('   ./cli chrome stop    — 停止 Chrome');
    } else if (attempts > 20) {
      clearInterval(checkInterval);
      console.log(pc.red('❌ Chrome 启动超时'));
    }
  }, 500);
}

function stopChrome(): void {
  if (!isChromeRunning()) {
    console.log(pc.yellow('⚠️  Chrome 远程调试未运行'));
    return;
  }

  console.log(pc.cyan('🛑 停止 Chrome...'));
  
  try {
    execSync(`pkill -f "remote-debugging-port=${DEBUG_PORT}"`);
    console.log(pc.green('✅ Chrome 已停止'));
  } catch {
    console.log(pc.red('❌ 停止失败，请手动关闭'));
  }
}

function statusChrome(): void {
  if (isChromeRunning()) {
    console.log(pc.green('✅ Chrome 远程调试运行中'));
    console.log(pc.dim(`   地址: http://127.0.0.1:${DEBUG_PORT}`));
    console.log(pc.dim('   Agent 可以通过 MCP 控制浏览器'));
  } else {
    console.log(pc.yellow('⏹️  Chrome 远程调试未运行'));
    console.log(pc.dim('   运行 ./cli chrome start 启动'));
  }
}

export function run(args: string[]): void {
  const subcommand = args[0] || 'status';

  switch (subcommand) {
    case 'start':
      startChrome();
      break;
    case 'stop':
      stopChrome();
      break;
    case 'status':
      statusChrome();
      break;
    default:
      console.error(pc.red(`❌ 未知命令: chrome ${subcommand}`));
      console.log(pc.dim('   ./cli chrome start   — 启动'));
      console.log(pc.dim('   ./cli chrome stop    — 停止'));
      console.log(pc.dim('   ./cli chrome status  — 检查状态'));
      process.exit(1);
  }
}
