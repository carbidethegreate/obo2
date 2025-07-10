/*  OnlyFans Automation Manager
    File: run.test.js
    Purpose: runs legacy script-based tests via Node
    Created: 2025-07-06 – v1.0
*/

import { spawnSync } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';

const testDir = new URL('.', import.meta.url).pathname;

for (const file of readdirSync(testDir)) {
  if (file.endsWith('.test.js') && file !== 'run.test.js') {
    test(`legacy script ${file} exits 0`, () => {
      const result = spawnSync('node', [join(testDir, file)], {
        env: { ...process.env, SKIP_DB: '1' },
        encoding: 'utf-8'
      });
      expect(result.status).toBe(0);
    });
  }
}

/*  End of File – Last modified 2025-07-06 */
