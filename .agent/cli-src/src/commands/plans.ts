/**
 * hac plans — 只看计划进度
 */

import { renderPlansTable } from '../lib/render';
import { loadData, requireProjectRoot } from '../lib/data';
import pc from 'picocolors';

export function run(): void {
  const root = requireProjectRoot();
  const data = loadData(root);
  
  console.log('');
  console.log(pc.bold(pc.blue('📋 活跃计划')));
  console.log(renderPlansTable(data.activePlans));
}
