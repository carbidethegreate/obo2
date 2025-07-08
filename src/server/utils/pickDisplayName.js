/*  OnlyFans Automation Manager
    File: pickDisplayName.js
    Purpose: Helpers to normalise names
    Created: 2025-07-06 – v1.0
*/

import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function pickDisplayName(fullName) {
  const prompt = `You are a friendly assistant. Provide a first-name, \u2264 15 letters, capitalised, no emojis, based on: ${fullName}`;
  const res = await openai.chat.completions.create({
    messages: [{ role: 'system', content: prompt }],
    model: 'openai.o3',
    max_tokens: 20,
    temperature: 0.3
  });
  return res.choices[0].message.content.trim();
}

/*  End of File – Last modified 2025-07-06 */
