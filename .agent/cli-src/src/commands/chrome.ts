/**
 * cli chrome — Chrome 远程调试管理
 *
 * 一键启动/停止 Chrome DevTools 远程调试模式，
 * 配合 config/mcp.json 中的 Chrome DevTools MCP 使用。
 *
 * 配置来源: config/chrome.yaml
 */

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import pc from 'picocolors';
import yaml from 'js-yaml';

// ─── 配置加载 ──────────────────────────────────────────────

interface ChromeConfig {
  chrome: {
    data_dir: string;
    remote_debugging_port: number;
    headless: boolean;
    viewport: string;
    isolated: boolean;
    extra_args: string[];
  };
  xiaohongshu: {
    creator_center: string;
    search_url: string;
    default_tags: string[];
  };
}

function findProjectRoot(): string {
  let dir = process.cwd();
  // 如果从 .agent/cli-src 内部运行（开发时）
  if (dir.includes('.agent/cli-src')) {
    dir = path.resolve(dir, '../../../');
  }
  return dir;
}

const PROJECT_ROOT = findProjectRoot();
const CONFIG_PATH = path.join(PROJECT_ROOT, 'config', 'chrome.yaml');
const MCP_CONFIG_PATH = path.join(PROJECT_ROOT, 'config', 'mcp.json');

function loadConfig(): ChromeConfig {
  const defaults: ChromeConfig = {
    chrome: {
      data_dir: '.agent/chrome-profile',
      remote_debugging_port: 9222,
      headless: false,
      viewport: '1280x720',
      isolated: false,
      extra_args: [],
    },
    xiaohongshu: {
      creator_center: 'https://creator.xiaohongshu.com',
      search_url: 'https://www.xiaohongshu.com/search_result',
      default_tags: ['职场', '成长', '干货'],
    },
  };

  if (!fs.existsSync(CONFIG_PATH)) {
    console.log(pc.yellow('⚠️  config/chrome.yaml 不存在，使用默认配置'));
    return defaults;
  }

  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = yaml.load(raw) as Partial<ChromeConfig>;
    return {
      chrome: { ...defaults.chrome, ...parsed.chrome },
      xiaohongshu: { ...defaults.xiaohongshu, ...parsed.xiaohongshu },
    };
  } catch (err) {
    console.log(pc.yellow(`⚠️  解析 config/chrome.yaml 失败: ${err}`));
    return defaults;
  }
}

function resolveDataDir(cfg: ChromeConfig): string {
  const dir = cfg.chrome.data_dir;
  if (path.isAbsolute(dir)) return dir;
  return path.join(PROJECT_ROOT, dir);
}

// ─── MCP 配置校验 ──────────────────────────────────────────

function checkMcpConfig(port: number): void {
  if (!fs.existsSync(MCP_CONFIG_PATH)) return;

  try {
    const raw = fs.readFileSync(MCP_CONFIG_PATH, 'utf-8');
    const mcp = JSON.parse(raw);
    const chromeMcp = mcp.mcpServers?.['chrome-devtools'];
    if (!chromeMcp) return;

    const args = chromeMcp.args || [];
    const browserUrlIdx = args.indexOf('--browser-url');
    if (browserUrlIdx === -1 || browserUrlIdx + 1 >= args.length) return;

    const url = args[browserUrlIdx + 1];
    const expected = `http://127.0.0.1:${port}`;

    if (!url.includes(`:${port}`)) {
      console.log(pc.yellow('⚠️  config/mcp.json 中的 --browser-url 端口与 config/chrome.yaml 不一致'));
      console.log(pc.dim(`   MCP 配置: ${url}`));
      console.log(pc.dim(`   Chrome 配置: ${expected}`));
      console.log(pc.dim('   请同步两者端口，或重新运行 ./cli chrome start'));
    }
  } catch {
    // 忽略 MCP 配置解析错误
  }
}

// ─── Chrome 生命周期 ───────────────────────────────────────

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function isChromeRunning(port: number): boolean {
  try {
    execSync(`curl -s http://127.0.0.1:${port}/json > /dev/null 2>&1`);
    return true;
  } catch {
    return false;
  }
}

function startChrome(flags: { headless?: boolean; background?: boolean } = {}): void {
  const cfg = loadConfig();
  const port = cfg.chrome.remote_debugging_port;
  const dataDir = resolveDataDir(cfg);

  if (isChromeRunning(port)) {
    console.log(pc.yellow('⚠️  Chrome 远程调试已在运行'));
    console.log(pc.dim(`   http://127.0.0.1:${port}`));
    return;
  }

  checkMcpConfig(port);

  const isHeadless = flags.headless || cfg.chrome.headless;
  const isBackground = flags.background && !isHeadless;

  const args: string[] = [
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    '--no-default-browser-check',
  ];

  // 前台模式才需要 new-window，后台/无头模式不需要
  if (!isBackground && !isHeadless) {
    args.push('--new-window');
  }

  if (cfg.chrome.isolated) {
    const tmpDir = `/tmp/chrome-isolated-${Date.now()}`;
    args.push(`--user-data-dir=${tmpDir}`);
    console.log(pc.cyan('🚀 启动 Chrome（独立模式，退出后清理数据）...'));
  } else {
    args.push(`--user-data-dir=${dataDir}`);
    console.log(pc.cyan('🚀 启动 Chrome（持久化模式）...'));
  }

  if (isHeadless) {
    args.push('--headless=new');
    console.log(pc.dim('   模式: 无头（完全后台运行）'));
  } else if (isBackground) {
    // macOS: 窗口移出屏幕 + 启动后隐藏进程
    args.push('--window-position=99999,99999');
    console.log(pc.dim('   模式: 后台（窗口隐藏，不抢占焦点）'));
  } else {
    console.log(pc.dim('   模式: 前台（正常窗口）'));
  }

  // 视口大小通过 window-size 设置
  const [width, height] = cfg.chrome.viewport.split('x');
  if (width && height) {
    args.push(`--window-size=${width},${height}`);
  }

  // 额外参数
  if (cfg.chrome.extra_args?.length) {
    args.push(...cfg.chrome.extra_args);
  }

  args.push('about:blank');

  console.log(pc.dim(`   端口: ${port}`));
  console.log(pc.dim(`   数据目录: ${cfg.chrome.isolated ? '/tmp/...' : dataDir}`));
  console.log(pc.dim(`   视口: ${cfg.chrome.viewport}`));
  console.log('');

  if (isBackground) {
    // macOS: 使用 open -gj 启动 Chrome，不激活、不显示窗口
    // -g: 不将应用带到前台
    // -j: 隐藏应用
    const open = spawn('open', [
      '-gj',
      '-a', 'Google Chrome',
      '--args',
      ...args,
    ], {
      detached: true,
      stdio: 'ignore',
    });
    open.unref();
  } else {
    const chrome = spawn(CHROME_PATH, args, {
      detached: true,
      stdio: 'ignore',
    });
    chrome.unref();
  }

  // 等待启动
  let attempts = 0;
  const checkInterval = setInterval(() => {
    attempts++;
    if (isChromeRunning(port)) {
      clearInterval(checkInterval);
      console.log(pc.green('✅ Chrome 已启动'));
      console.log(pc.dim(`   调试地址: http://127.0.0.1:${port}`));
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
  const cfg = loadConfig();
  const port = cfg.chrome.remote_debugging_port;

  if (!isChromeRunning(port)) {
    console.log(pc.yellow('⚠️  Chrome 远程调试未运行'));
    return;
  }

  console.log(pc.cyan('🛑 停止 Chrome...'));

  try {
    execSync(`pkill -f "remote-debugging-port=${port}"`);
    console.log(pc.green('✅ Chrome 已停止'));
  } catch {
    console.log(pc.red('❌ 停止失败，请手动关闭'));
  }
}

function statusChrome(): void {
  const cfg = loadConfig();
  const port = cfg.chrome.remote_debugging_port;
  const dataDir = resolveDataDir(cfg);

  if (isChromeRunning(port)) {
    console.log(pc.green('✅ Chrome 远程调试运行中'));
    console.log(pc.dim(`   地址: http://127.0.0.1:${port}`));
    console.log(pc.dim(`   数据目录: ${dataDir}`));
    console.log(pc.dim('   Agent 可以通过 MCP 控制浏览器'));
  } else {
    console.log(pc.yellow('⏹️  Chrome 远程调试未运行'));
    console.log(pc.dim('   运行 ./cli chrome start 启动'));
  }
}

export function run(args: string[]): void {
  const subcommand = args[0] || 'status';

  switch (subcommand) {
    case 'start': {
      const headless = args.includes('--headless');
      const background = args.includes('--background');
      startChrome({ headless, background });
      break;
    }
    case 'stop':
      stopChrome();
      break;
    case 'status':
      statusChrome();
      break;
    default:
      console.error(pc.red(`❌ 未知命令: chrome ${subcommand}`));
      console.log(pc.dim('   ./cli chrome start              — 前台启动'));
      console.log(pc.dim('   ./cli chrome start --headless   — 无头模式（完全后台）'));
      console.log(pc.dim('   ./cli chrome start --background — 后台模式（不抢占焦点）'));
      console.log(pc.dim('   ./cli chrome stop               — 停止'));
      console.log(pc.dim('   ./cli chrome status             — 检查状态'));
      process.exit(1);
  }
}
