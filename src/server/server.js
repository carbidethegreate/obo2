/*  OnlyFans Automation Manager
    File: server.js
    Purpose: Express entry-point (orchestrates API endpoints for all stories)
    Created: 2025‑07‑06 – v1.0
*/
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  const example = path.resolve(process.cwd(), '.env.example');
  if (fs.existsSync(example)) {
    fs.copyFileSync(example, envPath);
  } else {
    fs.writeFileSync(envPath, 'DATABASE_URL=postgres://username:password@localhost:5432/your_db_name\n');
  }
  console.log('Created .env file. Please edit it to add your database credentials.');
}
dotenv.config({ path: envPath });

import express from 'express';
import initDb from '../../scripts/initDb.js';
import { runFullSync, refreshFan, backfillMessages } from './sync.js';
import { safeGET, safePOST, safePUT, safePATCH, safeDELETE } from './api/onlyfansApi.js';
import { startCronJobs } from './cron/index.js';
import { query } from './db/db.js';
import { runVariantExperiment } from './cron/experiment.js';
import { startAuth, pollAuth, submitTwoFactor } from './api/auth.js';
import { graphqlHTTP } from 'express-graphql';
import { schema } from './graphql/schema.js';

if (process.env.INIT_DB_ON_STARTUP === 'true') {
  await initDb().catch(err => {
    console.error('Database init failed', err);
    process.exit(1);
  });
}

const app = express();
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.use('/graphql', graphqlHTTP({ schema, graphiql: true }));

app.post('/api/auth/start', async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await startAuth(email, password);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'auth start failed' });
  }
});

app.get('/api/auth/:id', async (req, res) => {
  try {
    const data = await pollAuth(req.params.id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'auth poll failed' });
  }
});

app.post('/api/auth/:id/2fa', async (req, res) => {
  try {
    const { code } = req.body;
    const data = await submitTwoFactor(req.params.id, code);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '2fa failed' });
  }
});

app.post('/api/sync', async (_, res) => {
  try {
    await runFullSync();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'sync failed' });
  }
});

app.post('/api/fans/:id/sync', async (req, res) => {
  try {
    await refreshFan(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'fan sync failed' });
  }
});

app.post('/api/messages/backfill', async (req, res) => {
  try {
    await backfillMessages();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'backfill failed' });
  }
});

app.get('/api/balances', async (_, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const bal = await safeGET(`/api/${acctId}/payouts/balances`);
    res.json(bal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed balance' });
  }
});

app.post('/api/fans/:id/messages', async (req, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const { text, mediaId } = req.body;
    await safePOST(`/api/${acctId}/chats/${req.params.id}/messages`, {
      text,
      mediaFiles: mediaId ? [mediaId] : []
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'dm failed' });
  }
});

// Mass messaging
app.post('/api/mass-messages', async (req, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const result = await safePOST(`/api/${acctId}/mass-messaging`, req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'mass send failed' });
  }
});

app.get('/api/mass-messages', async (_, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const result = await safeGET(`/api/${acctId}/mass-messaging`);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'mass list failed' });
  }
});

app.delete('/api/mass-messages/:id', async (req, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    await safeDELETE(`/api/${acctId}/mass-messaging/${req.params.id}`);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'mass delete failed' });
  }
});

// Posts management
app.get('/api/posts', async (_, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const result = await safeGET(`/api/${acctId}/posts`);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'posts list failed' });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const result = await safePOST(`/api/${acctId}/posts`, req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'post create failed' });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    await safeDELETE(`/api/${acctId}/posts/${req.params.id}`);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'post delete failed' });
  }
});

app.get('/api/queue', async (req, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const items = await safeGET(`/api/${acctId}/queue`);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'queue fetch failed' });
  }
});

app.put('/api/queue/:id', async (req, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    await safePUT(`/api/${acctId}/queue/${req.params.id}`, {});
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'publish failed' });
  }
});

// Vault list management
app.get('/api/vault/lists', async (_, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const lists = await safeGET(`/api/${acctId}/media/vault/lists`);
    res.json(lists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'vault fetch failed' });
  }
});

app.post('/api/vault/lists', async (req, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const result = await safePOST(`/api/${acctId}/media/vault/lists`, req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'create list failed' });
  }
});

app.put('/api/vault/lists/:id', async (req, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const result = await safePUT(`/api/${acctId}/media/vault/lists/${req.params.id}`, req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'rename list failed' });
  }
});

app.delete('/api/vault/lists/:id', async (req, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const result = await safeDELETE(`/api/${acctId}/media/vault/lists/${req.params.id}`);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'delete list failed' });
  }
});

app.get('/api/ltv', async (_, res) => {
  try {
    const result = await query('SELECT * FROM ltv_view');
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ltv fetch failed' });
  }
});

app.get('/api/settings', async (_, res) => {
  try {
    const rows = await query('SELECT key, value FROM settings');
    const obj = {};
    for (const r of rows.rows) obj[r.key] = r.value === 'true';
    res.json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'settings fetch failed' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    await query(
      'INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value',
      [key, String(value)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'settings update failed' });
  }
});

app.post('/api/experiments', async (req, res) => {
  try {
    const { text } = req.body;
    const id = await runVariantExperiment(text);
    if (!id) return res.status(400).json({ error: 'no account' });
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'experiment failed' });
  }
});

app.get('/api/experiments', async (_, res) => {
  try {
    const rows = await query('SELECT * FROM experiments');
    res.json(rows.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'experiments fetch failed' });
  }
});

app.get('/api/profile-visitors', async (_, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const data = await safeGET(`/api/${acctId}/statistics/reach/profile-visitors`);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'visitors fetch failed' });
  }
});

app.delete('/gdpr/export/:fanId', async (req, res) => {
  try {
    const fanId = req.params.fanId;
    const fan = await query('SELECT * FROM fans WHERE fan_id=$1', [fanId]);
    const messages = await query('SELECT * FROM messages WHERE fan_id=$1', [fanId]);
    const txns = await query('SELECT * FROM transactions WHERE fan_id=$1', [fanId]);
    res.json({ fan: fan.rows[0], messages: messages.rows, transactions: txns.rows });
    await query('DELETE FROM messages WHERE fan_id=$1', [fanId]);
    await query('DELETE FROM transactions WHERE fan_id=$1', [fanId]);
    await query('DELETE FROM fans WHERE fan_id=$1', [fanId]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'gdpr export failed' });
  }
});

app.get('/api/tracking-links', async (_, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const data = await safeGET(`/api/${acctId}/tracking-links`);
    res.json(data.data || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'tracking fetch failed' });
  }
});

app.get('/api/tracking-links/:id/subscribers', async (req, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const data = await safeGET(`/api/${acctId}/tracking-links/${req.params.id}/subscribers`);
    res.json(data.data || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'tracking subs failed' });
  }
});

app.get('/api/profiles/search', async (req, res) => {
  try {
    const q = req.query.search || '';
    const data = await safeGET(`/api/search?search=${encodeURIComponent(q)}`);
    res.json(data.data || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'profile search failed' });
  }
});

app.get('/api/profiles/:username', async (req, res) => {
  try {
    const data = await safeGET(`/api/profiles/${encodeURIComponent(req.params.username)}`);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'profile fetch failed' });
  }
});

// Saved-for-later messages
app.get('/api/saved-messages', async (_, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const data = await safeGET(`/api/${acctId}/saved-for-later/messages`);
    res.json(data.data || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'saved messages fetch failed' });
  }
});

app.get('/api/saved-messages/settings', async (_, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const data = await safeGET(`/api/${acctId}/saved-for-later/messages/settings`);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'message settings fetch failed' });
  }
});

app.post('/api/saved-messages/settings', async (req, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const data = await safePATCH(`/api/${acctId}/saved-for-later/messages`, req.body);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'update message settings failed' });
  }
});

app.post('/api/saved-messages/disable', async (_, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const data = await safePATCH(`/api/${acctId}/saved-for-later/messages/disable`, {});
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'disable message failed' });
  }
});

// Saved-for-later posts
app.get('/api/saved-posts', async (_, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const data = await safeGET(`/api/${acctId}/saved-for-later/posts`);
    res.json(data.data || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'saved posts fetch failed' });
  }
});

app.get('/api/saved-posts/settings', async (_, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const data = await safeGET(`/api/${acctId}/saved-for-later/posts/settings`);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'post settings fetch failed' });
  }
});

app.post('/api/saved-posts/settings', async (req, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const data = await safePATCH(`/api/${acctId}/saved-for-later/posts`, req.body);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'update post settings failed' });
  }
});

app.post('/api/saved-posts/disable', async (_, res) => {
  try {
    const accounts = await safeGET('/api/accounts');
    const acctId = accounts.data[0]?.id;
    if (!acctId) return res.status(400).json({ error: 'no account' });
    const data = await safePATCH(`/api/${acctId}/saved-for-later/posts/disable`, {});
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'disable post failed' });
  }
});

app.get('/api/questionnaire', async (_, res) => {
  try {
    const rows = await query('SELECT * FROM questionnaire_answers');
    res.json(rows.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'questionnaire fetch failed' });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal error' });
});

const PORT = process.env.PORT || 3000;
startCronJobs();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/*  End of File – Last modified 2025‑07‑06 */
