/*  OnlyFans Automation Manager
    File: run.js
    Purpose: simple test runner (uses Node to run all tests)
    Created: 2025-07-06 – v1.0
*/

process.env.SKIP_DB="1";
import './churnPredictor.test.js';
import './utils.test.js';
import './secureKeys.test.js';
import './graphql.test.js';

/*  End of File – Last modified 2025-07-06 */
