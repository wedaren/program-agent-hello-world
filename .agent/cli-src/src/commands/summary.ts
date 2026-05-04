/**
 * hac summary — 项目摘要
 */

import { renderSummary } from '../lib/render';
import { loadData, requireProjectRoot } from '../lib/data';

export function run(): void {
  const root = requireProjectRoot();
  const data = loadData(root);
  console.log(renderSummary(data));
}
