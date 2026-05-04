/**
 * hac status — 完整仪表板
 */

import { renderDashboard } from '../lib/render';
import { loadData, requireProjectRoot } from '../lib/data';

export function run(): void {
  const root = requireProjectRoot();
  const data = loadData(root);
  console.log(renderDashboard(data));
}
