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

export function startCronJobs() {
  cron.schedule('*/10 * * * *', autoThank);
  cron.schedule('0 0 * * *', spendTierNudger);
  cron.schedule('0 * * * *', generateReplies);
  cron.schedule('30 1 * * *', churnPredictor);
}

/*  End of File – Last modified 2025‑07‑06 */
