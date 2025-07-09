/*  OnlyFans Automation Manager
    File: experiment.js
    Purpose: A/B Variant Lab
    Created: 2025‑07‑06 – v1.0
*/

import { safeGET, safePOST } from '../api/onlyfansApi.js';
import { query } from '../db/db.js';
import { OpenAI } from 'openai';
import { decryptEnv } from '../security/secureKeys.js';

let openai;

export async function runVariantExperiment(textA) {
  if (!openai) openai = new OpenAI({ apiKey: await decryptEnv('OPENAI_API_KEY') });
  const accounts = await safeGET('/api/accounts');
  const acctId = accounts.data[0]?.id;
  if (!acctId) return null;
  let textB = textA;
  if (openai.apiKey) {
    const prompt = `Rewrite this promo with slightly different wording: ${textA}`;
    const res = await openai.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'openai.o3',
      max_tokens: 60,
      temperature: 0.7
    });
    textB = res.choices[0].message.content.trim();
  }
  const aRes = await safePOST(`/api/${acctId}/mass-messaging`, { userLists: ['fans'], text: textA });
  const bRes = await safePOST(`/api/${acctId}/mass-messaging`, { userLists: ['fans'], text: textB });
  const exp = await query(
    'INSERT INTO experiments(variant_a_id, variant_b_id, a_text, b_text) VALUES($1,$2,$3,$4) RETURNING id',
    [aRes.data.id, bRes.data.id, textA, textB]
  );
  return exp.rows[0].id;
}

export async function updateExperimentStats() {
  const accounts = await safeGET('/api/accounts');
  const acctId = accounts.data[0]?.id;
  if (!acctId) return;
  const exps = await query('SELECT * FROM experiments WHERE winner IS NULL');
  for (const ex of exps.rows) {
    const aStats = await safeGET(`/api/${acctId}/mass-messaging/${ex.variant_a_id}`);
    const bStats = await safeGET(`/api/${acctId}/mass-messaging/${ex.variant_b_id}`);
    const opensA = aStats.data.opens || 0;
    const opensB = bStats.data.opens || 0;
    await query('UPDATE experiments SET a_opens=$1, b_opens=$2 WHERE id=$3', [opensA, opensB, ex.id]);
    if (opensA >= 50 && opensB >= 50) {
      const winner = opensA > opensB ? 'A' : 'B';
      await query('UPDATE experiments SET winner=$1 WHERE id=$2', [winner, ex.id]);
    }
  }
}

/*  End of File – Last modified 2025‑07‑06 */