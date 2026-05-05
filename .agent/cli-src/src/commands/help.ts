/**
 * cli help — 帮助信息
 */

import pc from 'picocolors';

export function run(): void {
  console.log('');
  console.log(pc.cyan(pc.bold('🤖⧉👤 Human-Agent Coexistence CLI')));
  console.log(pc.dim('   状态查看器 · 不是 Agent 本身'));
  console.log('');
  console.log(pc.bold('用法: ./cli <command>'));
  console.log('');
  
  console.log(pc.bold('👀 查看状态'));
  console.log(`  ${pc.green('./cli status')}        完整仪表板`);
  console.log(`  ${pc.green('./cli plans')}         计划进度`);
  console.log(`  ${pc.green('./cli decisions')}     决策记录`);
  console.log(`  ${pc.green('./cli summary')}       项目摘要`);
  console.log('');
  
  console.log(pc.bold('🤖 与 Agent 协作'));
  console.log(`  ${pc.green('./cli context')}       生成项目上下文（复制给 Agent）`);
  console.log(`  ${pc.green('./cli browser')}       浏览器仪表板`);
  console.log('');
  
  console.log(pc.bold('🌐 Chrome DevTools MCP'));
  console.log(`  ${pc.green('./cli chrome start')}   启动 Chrome（远程调试）`);
  console.log(`  ${pc.green('./cli chrome stop')}    停止 Chrome`);
  console.log(`  ${pc.green('./cli chrome status')}  检查 Chrome 状态`);
  console.log('');
  
  console.log(pc.bold('👁️ 实时监控'));
  console.log(`  ${pc.green('./cli watch')}         每30秒自动刷新`);
  console.log(`  ${pc.green('./cli watch --interval 10')}  每10秒刷新`);
  console.log('');
  
  console.log(pc.bold('🛠️ 其他'));
  console.log(`  ${pc.green('./cli help')}          本帮助`);
  console.log(`  ${pc.green('./cli --version')}     版本`);
  console.log('');
  
  console.log(pc.dim('💡 Agent 是外部环境（Kimi CLI / Claude Code 等）'));
  console.log(pc.dim('   本项目是 Agent 的工作空间，不是 Agent 本身'));
  console.log(pc.dim('   运行 ./cli context 生成上下文，粘贴给 Agent 使用'));
  console.log('');
}
