/*  OnlyFans Automation Manager
    File: index.js
    Purpose: Cron scheduler (runs B-10, B-6, C-1, D-1→D-5, F-2 tasks)
    Created: 2025‑07‑06 – v1.0
*/

import cron from 'node-cron';
import { autoThankJob } from './autoThank.js';
import { spendTierNudgerJob } from './spendTierNudger.js';
import { generateRepliesJob } from './generateReplies.js';
import { churnPredictorJob } from './churnPredictor.js';
import { updateExperimentStatsJob } from './experiment.js';
import { sendQuestionnaireJob } from './sendQuestionnaire.js';
import { processOutboxJob } from './processOutbox.js';
import { query } from '../db/db.js';
import { logger } from '../logger.js';

export async function startCronJobs() {
  const res = await query('SELECT key, value FROM settings');
  const map = Object.fromEntries(res.rows.map(r => [r.key, r.value === 'true']));
  const jobs = [autoThankJob, spendTierNudgerJob, generateRepliesJob,
    processOutboxJob, churnPredictorJob, sendQuestionnaireJob, updateExperimentStatsJob];
  for (const job of jobs) {
    if (!job.name || !job.schedule) continue;
    const enabled = map[job.name + 'Enabled'];
    if (enabled !== false) {
      cron.schedule(job.schedule, job.fn);
      logger.info(`scheduled ${job.name} at ${job.schedule}`);
    }
  }
}

/*  End of File – Last modified 2025-07-11 */
