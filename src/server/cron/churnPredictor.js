/*  OnlyFans Automation Manager
    File: churnPredictor.js
    Purpose: Churn Model (User Story F-2)
    Created: 2025‑07‑06 – v1.0
*/

import { query } from '../db/db.js';
import { OpenAI } from 'openai';
import { decryptEnv } from '../security/secureKeys.js';

let openai;

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function trainLR(data, iterations = 500, lr = 0.001) {
  let w0 = 0, w1 = 0, w2 = 0;
  for (let i = 0; i < iterations; i++) {
    let g0 = 0, g1 = 0, g2 = 0;
    for (const d of data) {
      const z = w0 + w1 * d.msgs + w2 * d.spend;
      const p = sigmoid(z);
      const err = p - d.label;
      g0 += err;
      g1 += err * d.msgs;
      g2 += err * d.spend;
    }
    w0 -= lr * g0;
    w1 -= lr * g1;
    w2 -= lr * g2;
  }
  return { w0, w1, w2 };
}

function predictProb(model, d) {
  const z = model.w0 + model.w1 * d.msgs + model.w2 * d.spend;
  return sigmoid(z);
}

export function auc(preds, labels) {
  const pairs = preds.map((p, i) => ({ p, l: labels[i] })).sort((a, b) => b.p - a.p);
  let tp = 0, fp = 0, prevTP = 0, prevFP = 0, aucSum = 0;
  const totalPos = labels.reduce((a, l) => a + (l ? 1 : 0), 0);
  const totalNeg = labels.length - totalPos;
  for (const pair of pairs) {
    if (pair.l) tp++; else fp++;
    aucSum += (fp - prevFP) * (tp + prevTP) / 2;
    prevTP = tp; prevFP = fp;
  }
  return totalPos * totalNeg ? aucSum / (totalPos * totalNeg) : 0.5;
}

export async function churnPredictor() {
  try {
    console.log('churnPredictor cron started');
    if (!openai) openai = new OpenAI({ apiKey: await decryptEnv('OPENAI_API_KEY') });
    const res = await query('SELECT fan_id, msg_total, spend_total, subscription_status FROM fans');
    const data = res.rows.map(r => ({
      id: r.fan_id,
      msgs: Number(r.msg_total || 0),
      spend: Number(r.spend_total || 0),
      label: r.subscription_status === 'expired' ? 1 : 0
    }));
    if (!data.length) return;
    const trainSize = Math.floor(data.length * 0.8);
    const trainData = data.slice(0, trainSize);
    const testData = data.slice(trainSize);
    const model = trainLR(trainData);
    const preds = testData.map(d => predictProb(model, d));
    const labels = testData.map(d => d.label);
    const aucScore = auc(preds, labels);
    console.log('churn predictor AUC', aucScore.toFixed(2));
    for (const d of data) {
      const prob = predictProb(model, d);
      if (prob > 0.5) {
        let note = '';
        if (openai.apiKey) {
          const prompt = `Explain in 2 sentences why this fan might churn based on metrics: ${JSON.stringify({ msgs: d.msgs, spend: d.spend })}`;
          const ai = await openai.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: 'openai.o3',
            max_tokens: 40,
            temperature: 0.2
          });
          note = ai.choices[0].message.content.trim();
        }
        await query(
          'INSERT INTO queue(queue_id, type, payload, publish_at) VALUES(DEFAULT,$1,$2,NOW())',
          ['churn-note', { fanId: d.id, prob: prob.toFixed(2), note }]
        );
        console.log(`churn note queued for fan ${d.id}`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    console.log('churnPredictor cron finished');
  } catch (err) {
    console.error('churnPredictor failed', err);
  }
}

/*  End of File – Last modified 2025‑07‑06 */