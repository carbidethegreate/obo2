/*  OnlyFans Automation Manager
    File: sendQuestionnaire.js
    Purpose: send user questionnaire and rate sentiment
    Created: 2025-07-06 – v1.0
*/
import { OpenAI } from 'openai';
import { decryptEnv } from '../security/secureKeys.js';

let openai;

export async function rateSentiment(text) {
  const apiKey = await decryptEnv('OPENAI_API_KEY');
  if (!apiKey) return 0;
  if (!openai) openai = new OpenAI({ apiKey });
  try {
    const res = await openai.chat.completions.create({
      messages: [{ role: 'user', content: `Rate the sentiment of: ${text}` }],
      model: 'openai.o3',
      max_tokens: 1,
    });
    const val = parseFloat(res.choices[0].message.content);
    return isNaN(val) ? 0 : val;
  } catch {
    return 0;
  }
}
export async function sendQuestionnaire() {
  // Placeholder implementation
  return true;
}

/*  End of File – Last modified 2025-07-06 */
