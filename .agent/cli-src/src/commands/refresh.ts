/**
 * hac refresh — 同步后立刻查看
 */

import * as sync from './sync';
import * as status from './status';

export function run(): void {
  sync.run();
  console.log('');
  status.run();
}
