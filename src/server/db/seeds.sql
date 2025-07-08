/*  OnlyFans Automation Manager
    File: seeds.sql
    Purpose: Seed data
    Created: 2025‑07‑06 – v1.0
*/

INSERT INTO fans (fan_id, name, display_name, username, subscription_status, msg_total, spend_total, character_profile, updated_at)
VALUES (1, 'Demo Fan', 'Demo', 'demo', 'active', 0, 0, '{}', NOW());

INSERT INTO settings(key, value) VALUES
  ('autoThankEnabled', 'true'),
  ('spendTierNudgerEnabled', 'true'),
  ('generateRepliesEnabled', 'true'),
  ('churnPredictorEnabled', 'true'),
  ('questionnaireEnabled', 'true');

/*  End of File – Last modified 2025‑07‑06 */
