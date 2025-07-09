/*  OnlyFans Automation Manager
    File: churnPredictor.test.js
    Purpose: churn predictor unit test
    Created: 2025‑07‑06 – v1.0
*/

import assert from 'assert';
process.env.OPENAI_API_KEY = 'test';
const { auc } = await import('../src/server/cron/churnPredictor.js');

const preds = [0.9, 0.8, 0.1, 0.2];
const labels = [1, 1, 0, 0];
const result = auc(preds, labels);
assert(Math.abs(result - 1) < 1e-6);
console.log('auc test passed');

/*  End of File – Last modified 2025‑07‑06 */