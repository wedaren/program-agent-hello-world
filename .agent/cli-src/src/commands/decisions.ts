/**
 * hac decisions — 只看决策记录
 */

import { renderDecisionsTimeline } from '../lib/render';
import { loadData, requireProjectRoot } from '../lib/data';
import pc from 'picocolors';

export function run(): void {
  const root = requireProjectRoot();
  const data = loadData(root);
  
  console.log('');
  console.log(pc.bold(pc.magenta('📝 最近决策')));
  console.log(renderDecisionsTimeline(data.recentDecisions));
}
