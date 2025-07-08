/*  OnlyFans Automation Manager
    File: index.js
    Purpose: Cron scheduler
    Created: 2025‑07‑06 – v1.0
*/

import cron from 'node-cron';
import { autoThank } from './autoThank.js';
import { spendTierNudger } from './spendTierNudger.js';
import { generateReplies } from './generateReplies.js';
import { churnPredictor } from './churnPredictor.js';
import { query } from '../db/db.js';

export async function startCronJobs() {
  const res = await query('SELECT key, value FROM settings');
  const map = Object.fromEntries(res.rows.map(r => [r.key, r.value === 'true']));
  if (map.autoThankEnabled) cron.schedule('*/10 * * * *', autoThank);
  if (map.spendTierNudgerEnabled) cron.schedule('0 0 * * *', spendTierNudger);
  if (map.generateRepliesEnabled) cron.schedule('0 * * * *', generateReplies);
  if (map.churnPredictorEnabled) cron.schedule('30 1 * * *', churnPredictor);
}

/*  End of File – Last modified 2025‑07‑06 */
