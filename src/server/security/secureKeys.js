/*  OnlyFans Automation Manager
    File: secureKeys.js
    Purpose: decrypt API keys using libsodium sealed boxes
    Created: 2025-07-06 – v1.0
*/
import sodium from 'libsodium-wrappers';

let keyPair;

export async function loadKeyPair() {
  if (!keyPair) {
    await sodium.ready;
    const pk = Buffer.from(process.env.KEY_PUBLIC || '', 'hex');
    const sk = Buffer.from(process.env.KEY_PRIVATE || '', 'hex');
    if (pk.length && sk.length) keyPair = { publicKey: pk, privateKey: sk };
  }
  return keyPair;
}

export async function decryptEnv(name) {
  await loadKeyPair();
  if (!keyPair) return '';
  const sealed = Buffer.from(process.env[name] || '', 'base64');
  if (!sealed.length) return '';
  const decrypted = sodium.crypto_box_seal_open(sealed, keyPair.publicKey, keyPair.privateKey);
  return Buffer.from(decrypted).toString();
}
export async function sealString(value, publicKeyHex) {
  await sodium.ready;
  const pk = Buffer.from(publicKeyHex, 'hex');
  const sealed = sodium.crypto_box_seal(Buffer.from(value), pk);
  return Buffer.from(sealed).toString('base64');
}

/*  End of File – Last modified 2025-07-06 */
