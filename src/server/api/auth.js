/*  OnlyFans Automation Manager
    File: auth.js
    Purpose: OnlyFans account authentication helpers (Auth flow)
    Created: 2025‑07‑06 – v1.0
*/
import { safeGET, safePOST, safePUT } from './onlyfansApi.js';

export async function startAuth(email, password) {
  return safePOST('/api/authenticate', {
    email,
    password,
    proxyCountry: 'US'
  });
}

export const pollAuth = (attemptId) =>
  safeGET(`/api/authenticate/${attemptId}`);

export const submitTwoFactor = (attemptId, code) =>
  safePUT(`/api/authenticate/${attemptId}`, { code });

/*  End of File – Last modified 2025‑07‑06 */
