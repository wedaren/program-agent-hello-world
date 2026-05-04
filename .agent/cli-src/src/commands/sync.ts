/**
 * cli sync — 刷新缓存（现已无实际作用，保留兼容）
 * 
 * CLI 已改为实时解析 .agent/ 源数据，无需同步。
 * 此命令保留用于向后兼容，实际无操作。
 */

import pc from 'picocolors';

export function run(): void {
  console.log(pc.green('✅ CLI 已采用实时解析模式'));
  console.log(pc.dim('   每次运行 ./cli 都直接读取 .agent/ 的最新数据'));
  console.log(pc.dim('   无需手动同步'));
}
