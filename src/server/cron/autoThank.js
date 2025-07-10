/*  OnlyFans Automation Manager
    File: autoThank.js
    Purpose: Auto-thank Cron (User Story B-10)
    Created: 2025‑07‑06 – v1.0
*/

import { safeGET, safePOST } from '../api/onlyfansApi.js';
import { query } from '../db/db.js';
import { randomThanks } from '../utils/randomThanks.js';

export async function autoThank() {
  try {
    console.log('autoThank cron started');
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return;
    const lastRow = await query('SELECT value FROM settings WHERE key=$1', ['autoThankLastTxn']);
    let lastId = lastRow.rows[0] ? Number(lastRow.rows[0].value) : 0;
    const txns = await safeGET(`/api/${acctId}/payouts/transactions?limit=50`);
    const newTxns = txns.data.filter(t => Number(t.id) > lastId);
    newTxns.sort((a,b) => a.id - b.id);
    for (const t of newTxns) {
      if (!t.user_id) continue;
      const text = randomThanks();
      await safePOST(`/api/${acctId}/chats/${t.user_id}/messages`, { text });
      lastId = t.id;
      await query('INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value', ['autoThankLastTxn', String(lastId)]);
      console.log(`autoThanked fan ${t.user_id} for txn ${t.id}`);
      await new Promise(r => setTimeout(r, 1000));
    }
    console.log('autoThank cron finished');
  } catch (err) {
    console.error('autoThank failed', err);
  }
}

/*  End of File – Last modified 2025‑07‑06 */
