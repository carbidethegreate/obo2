/*  OnlyFans Automation Manager
    File: server.js
    Purpose: Express entry-point
    Created: 2025-07-06 – v1.0
*/

import express from 'express';
import { runFullSync } from './sync.js';
import { safeGET, safePOST, safePUT, safeDELETE } from './api/onlyfansApi.js';

const app = express();
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/*  End of File – Last modified 2025-07-06 */
