/*  OnlyFans Automation Manager
    File: utils.test.js
    Purpose: utils unit tests
    Created: 2025-07-06 – v1.0
*/
import assert from 'assert';
import { randomThanks } from '../src/server/utils/randomThanks.js';
import { smartPPV } from '../src/server/utils/smartPPV.js';
process.env.OPENAI_API_KEY = '';
const { rateSentiment } = await import('../src/server/cron/sendQuestionnaire.js');

// randomThanks should return one of the predefined phrases
const phrase = randomThanks();
assert(typeof phrase === 'string' && phrase.length > 0);

// pickDisplayName falls back to first name when no OpenAI key
process.env.OPENAI_API_KEY = '';
const { pickDisplayName } = await import('../src/server/utils/pickDisplayName.js');
const name = await pickDisplayName('Alice Wonderland');
assert.strictEqual(name, 'Alice');

// smartPPV should return roughly 20% of average spend bounded 5-50
const price = smartPPV([10, 20, 30]);
assert(price >= 5 && price <= 50);

// rateSentiment returns 0 without API key
const score = await rateSentiment('Great!');
assert.strictEqual(score, 0);

console.log('utils tests passed');

/*  End of File – Last modified 2025-07-06 */
