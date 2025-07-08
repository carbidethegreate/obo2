/*  OnlyFans Automation Manager
    File: ltv.sql
    Purpose: SQL view for lifetime value scoreboard
    Created: 2025-07-06 – v1.0
*/

CREATE OR REPLACE VIEW ltv_view AS
SELECT f.fan_id, f.display_name, COALESCE(SUM(t.amount),0) AS lifetime_value
FROM fans f
LEFT JOIN transactions t ON t.fan_id = f.fan_id
GROUP BY f.fan_id, f.display_name
ORDER BY lifetime_value DESC
LIMIT 10;

/*  End of File – Last modified 2025-07-06 */
