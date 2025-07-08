/*  OnlyFans Automation Manager
    File: randomThanks.js
    Purpose: provide random thank-you phrases
    Created: 2025‑07‑06 – v1.0
*/

export function randomThanks() {
  const phrases = [
    'Thank you so much for your support!',
    'I appreciate your purchase!',
    'Thanks for the love!',
    'Your support means a lot to me!',
    'You\'re amazing, thank you!'
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/*  End of File – Last modified 2025‑07‑06 */
