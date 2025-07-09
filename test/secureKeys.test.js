/*  OnlyFans Automation Manager
    File: secureKeys.test.js
    Purpose: secure key tests
    Created: 2025-07-06 – v1.0
*/
import assert from 'assert';
import sodium from 'libsodium-wrappers';
import { decryptEnv } from '../src/server/security/secureKeys.js';

await sodium.ready;
const { publicKey, privateKey } = sodium.crypto_box_keypair();
const sealed = sodium.crypto_box_seal(Buffer.from('secret'), publicKey);
process.env.KEY_PUBLIC = Buffer.from(publicKey).toString('hex');
process.env.KEY_PRIVATE = Buffer.from(privateKey).toString('hex');
process.env.TEST_KEY = Buffer.from(sealed).toString('base64');
const value = await decryptEnv('TEST_KEY');
assert.strictEqual(value, 'secret');
console.log('secureKeys test passed');

/*  End of File – Last modified 2025-07-06 */
