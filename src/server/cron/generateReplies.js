/*  OnlyFans Automation Manager
    File: generateReplies.js
    Purpose: AI Reply Cron
    Created: 2025‑07‑06 – v1.0
*/

import { safeGET } from '../api/onlyfansApi.js';
import { query } from '../db/db.js';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateReplies() {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return;
    const fansRes = await query('SELECT fan_id, character_profile FROM fans');
    for (const fan of fansRes.rows) {
      const msgsRes = await query(
        'SELECT text FROM messages WHERE fan_id=$1 AND direction=$2 ORDER BY created_at DESC LIMIT 5',
        [fan.fan_id, 'in']
      );
      const history = msgsRes.rows.map(m => m.text).join('\n');
      const persona = fan.character_profile?.summary || '';
      const prompt = `Write a masculine, friendly reply based on Parker's character profile. Persona: ${persona}. Last messages: ${history}`;
      const res = await openai.chat.completions.create({
        messages: [{ role: 'system', content: prompt }],
        model: 'openai.o3',
        max_tokens: 60,
        temperature: 0.7
      });
      const reply = res.choices[0].message.content.trim();
      await query(
        'INSERT INTO queue(queue_id, type, payload, publish_at) VALUES(DEFAULT, $1, $2, NOW())',
        ['draft', { fanId: fan.fan_id, text: reply }]
      );
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch (err) {
    console.error('generateReplies failed', err);
  }
}

/*  End of File – Last modified 2025‑07‑06 */
