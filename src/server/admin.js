/*  OnlyFans Automation Manager
    File: admin.js
    Purpose: launch admin dashboard to capture API keys
    Created: 2025-07-06 – v1.0
*/
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import sodium from 'libsodium-wrappers';
import { sealString } from './security/secureKeys.js';
import { spawn } from 'child_process';

const app = express();
app.use(express.json());
app.use(express.static(new URL('./adminUI', import.meta.url).pathname));

let serverProcess = null;

app.post('/api/admin/keys', async (req, res) => {
  try {
    const { onlyfansKey, openaiKey } = req.body;
    await sodium.ready;
    const { publicKey, privateKey } = sodium.crypto_box_keypair();
    const pubHex = Buffer.from(publicKey).toString('hex');
    const privHex = Buffer.from(privateKey).toString('hex');
    const sealedOf = await sealString(onlyfansKey, pubHex);
    const sealedOa = await sealString(openaiKey, pubHex);
    const env = `KEY_PUBLIC=${pubHex}\nKEY_PRIVATE=${privHex}\nONLYFANS_API_KEY=${sealedOf}\nOPENAI_API_KEY=${sealedOa}\n`;
    fs.writeFileSync('.env', env);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to store keys' });
  }
});

app.post('/api/admin/start', async (_, res) => {
  try {
    if (!serverProcess) {
      serverProcess = spawn('node', ['src/server/server.js'], { stdio: 'inherit' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to start app' });
  }
});

const PORT = process.env.ADMIN_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Admin dashboard running at http://localhost:${PORT}/admin.html`);
});

/*  End of File – Last modified 2025-07-06 */
