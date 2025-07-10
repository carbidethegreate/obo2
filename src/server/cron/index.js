/*  OnlyFans Automation Manager
    File: index.js
    Purpose: Cron scheduler (runs B-10, B-6, C-1, D-1→D-5, F-2 tasks)
    Created: 2025‑07‑06 – v1.0
*/

import cron from 'node-cron';
import { autoThank } from './autoThank.js';
import { spendTierNudger } from './spendTierNudger.js';
import { generateReplies } from './generateReplies.js';
import { churnPredictor } from './churnPredictor.js';
import { updateExperimentStats } from './experiment.js';
import { sendQuestionnaire } from './sendQuestionnaire.js';
import { processOutbox } from './processOutbox.js';
import { query } from '../db/db.js';

export async function startCronJobs() {
  const res = await query('SELECT key, value FROM settings');
  const map = Object.fromEntries(res.rows.map(r => [r.key, r.value === 'true']));
  if (map.autoThankEnabled) cron.schedule('*/10 * * * *', autoThank);
  if (map.spendTierNudgerEnabled) cron.schedule('0 0 * * *', spendTierNudger);
  if (map.generateRepliesEnabled) cron.schedule('0 * * * *', generateReplies);
  if (map.generateRepliesEnabled) cron.schedule('*/5 * * * *', processOutbox);
  if (map.churnPredictorEnabled) cron.schedule('30 1 * * *', churnPredictor);
  if (map.questionnaireEnabled) cron.schedule('0 12 * * *', sendQuestionnaire);
  cron.schedule('15 * * * *', updateExperimentStats);
}

/*  End of File – Last modified 2025‑07‑06 */
