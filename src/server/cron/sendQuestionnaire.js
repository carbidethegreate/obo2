/*  OnlyFans Automation Manager
    File: sendQuestionnaire.js
    Purpose: Questionnaire drip (User Stories D-1→D-5)
    Created: 2025‑07‑06 – v1.0
*/

import { safeGET, safePOST } from '../api/onlyfansApi.js';
import { query, isFeatureEnabled } from '../db/db.js';
import { OpenAI } from 'openai';
import { decryptEnv } from '../security/secureKeys.js';
import { logger } from '../logger.js';

let openai;

export async function rateSentiment(text) {
  if (!openai) openai = new OpenAI({ apiKey: await decryptEnv('OPENAI_API_KEY') });
  if (!openai.apiKey) return 0;
  const prompt = `Rate the sentiment of this reply from -1 (negative) to 1 (positive). Only return the number. Text: ${text}`;
  const res = await openai.chat.completions.create({
    messages: [{ role: 'system', content: prompt }],
    model: 'openai.o3',
    max_tokens: 3,
    temperature: 0.1
  });
  const val = parseFloat(res.choices[0].message.content.trim());
  return isNaN(val) ? 0 : val;
}

async function sendQuestionnaire() {
  if (!await isFeatureEnabled('questionnaireEnabled')) return;
  try {
    logger.info('sendQuestionnaire cron start');
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return;
    const fans = await safeGET(`/api/${acctId}/fans/active?limit=50&offset=0`);
    for (const fan of fans.data) {
      const row = await query('SELECT * FROM questionnaire_answers WHERE fan_id=$1 ORDER BY created_at DESC LIMIT 1', [fan.id]);
      const qa = row.rows[0];
      if (!qa) {
        await safePOST(`/api/${acctId}/chats/${fan.id}/messages`, { text: 'Quick question: what content do you want more of?' });
        await query('INSERT INTO questionnaire_answers(fan_id, qa) VALUES($1,$2)', [fan.id, { question: 'content preference', answer: null }]);
        await new Promise(r => setTimeout(r, 1000));
      } else if (qa.qa && qa.qa.answer === null) {
        const msgs = await safeGET(`/api/${acctId}/chats/${fan.id}/messages?limit=5&order=desc`);
        const reply = msgs.data.find(m => !m.isOpened && new Date(m.created_at) > new Date(qa.created_at));
        if (reply) {
          const sentiment = await rateSentiment(reply.text);
          const updated = { question: 'content preference', answer: reply.text, sentiment };
          await query('UPDATE questionnaire_answers SET qa=$2 WHERE id=$1', [qa.id, updated]);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
    logger.info('sendQuestionnaire cron finished');
  } catch (err) {
    logger.error(`sendQuestionnaire failed ${err}`);
  }
}

export const sendQuestionnaireJob = { name: 'questionnaire', schedule: '0 12 * * *', fn: sendQuestionnaire };

/*  End of File – Last modified 2025-07-11 */
