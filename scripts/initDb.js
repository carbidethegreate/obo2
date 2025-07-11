/*  OnlyFans Automation Manager
    File: initDb.js
    Purpose: initialise DB with schema and seeds
    Created: 2025-07-06 – v1.0
*/
import fs from 'fs';
import pg from 'pg';

const { Pool } = pg;

export async function initDb() {

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const schema = fs.readFileSync(new URL('../src/server/db/schema.sql', import.meta.url).pathname, 'utf8');
  const seeds = fs.readFileSync(new URL('../src/server/db/seeds.sql', import.meta.url).pathname, 'utf8');
  await pool.query(schema);
  await pool.query(seeds);
  await pool.end();
  console.log('Database initialised');
}
initDb().catch(err => {
  console.error(err);
  process.exit(1);
  });
export default initDb;
/*  End of File – Last modified 2025-07-06 */