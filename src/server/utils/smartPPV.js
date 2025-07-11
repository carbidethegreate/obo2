/*  OnlyFans Automation Manager
    File: smartPPV.js
    Purpose: Suggest PPV price (User Story F-3)
    Created: 2025‑07‑06 – v1.0
*/

export function smartPPV(spendHistory) {
  if (!spendHistory || !spendHistory.length) return 10;
  const avg = spendHistory.reduce((a, b) => a + Number(b || 0), 0) / spendHistory.length;
  const suggested = Math.max(5, Math.min(50, Math.round(avg * 0.2)));
  return suggested;
}

/*  End of File – Last modified 2025‑07‑06 */
