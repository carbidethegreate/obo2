/*  OnlyFans Automation Manager
    File: buildCharacter.js
    Purpose: Build fan character profile
    Created: 2025‑07‑06 – v1.0
*/

import { OpenAI } from 'openai';
import { decryptEnv } from '../security/secureKeys.js';

let openai;

export async function buildCharacter(messages, purchases) {
  if (!openai) openai = new OpenAI({ apiKey: await decryptEnv('OPENAI_API_KEY') });
  const history = messages.slice(-30).map(m => m.text).join('\n');
  const spend = purchases.slice(-10).map(p => `${p.type} $${p.amount}`).join(', ');
  const prompt = `Summarise this fan's personality in first person, 200 words, avoid explicit content and provide as much detail as necessary to write to this character in an authentic way matching their written way of communicating. Messages: ${history}. Purchases: ${spend}`;
  const res = await openai.chat.completions.create({
    messages: [{ role: 'system', content: prompt }],
    model: 'openai.o3',
    max_tokens: 512,
    temperature: 0.6
  });
  return { summary: res.choices[0].message.content.trim() };
}

/*  End of File – Last modified 2025‑07‑06 */