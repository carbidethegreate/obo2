/*  OnlyFans Automation Manager
    File: db.js
    Purpose: simple PostgreSQL helper
    Created: 2025‑07‑06 – v1.0
*/

import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const query = (text, params) => pool.query(text, params);

/*  End of File – Last modified 2025‑07‑06 */