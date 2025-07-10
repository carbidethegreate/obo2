/*  OnlyFans Automation Manager
    File: onlyfansApi.js
    Purpose: wrapper around OnlyFans API with retry and jitter (Security section)
    Created: 2025‑07‑06 – v1.0
*/

import fetch from 'node-fetch';
import { decryptEnv } from '../security/secureKeys.js';

const BASE_URL = 'https://app.onlyfansapi.com';
let TOKEN = '';
async function getToken() {
  if (!TOKEN) TOKEN = await decryptEnv('ONLYFANS_API_KEY');
  return TOKEN;
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function safeRequest(method, path, options = {}, retry = 0) {
  const url = `${BASE_URL}${path}`;
  const jitter = 250 + Math.random() * 500;
  await wait(jitter);
  const headers = {
    Authorization: `Bearer ${await getToken()}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  try {
    const res = await fetch(url, { method, headers, body: options.body });
    if (!res.ok) {
      if (retry < 4) {
        const backoff = Math.pow(2, retry) * 1000;
        await wait(backoff);
        return safeRequest(method, path, options, retry + 1);
      }
      throw new Error(`Request failed: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    if (retry < 4) {
      const backoff = Math.pow(2, retry) * 1000;
      await wait(backoff);
      return safeRequest(method, path, options, retry + 1);
    }
    throw err;
  }
}

export const safeGET = (path) => safeRequest('GET', path);
export const safePOST = (path, body) => safeRequest('POST', path, { body: JSON.stringify(body) });
export const safePUT = (path, body) => safeRequest('PUT', path, { body: JSON.stringify(body) });
export const safePATCH = (path, body) => safeRequest('PATCH', path, { body: JSON.stringify(body) });
export const safeDELETE = (path) => safeRequest('DELETE', path);

/*  End of File – Last modified 2025‑07‑06 */
