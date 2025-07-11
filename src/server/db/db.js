/*  OnlyFans Automation Manager
    File: db.js
    Purpose: simple PostgreSQL helper (data storage across stories)
    Created: 2025‑07‑06 – v1.0
*/

import pg from 'pg';

const { Pool } = pg;

let pool;
if (process.env.SKIP_DB) {
  pool = null;
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
}

export const query = (text, params) => {
  if (!pool) return { rows: [] };
  return pool.query(text, params);
};

