/*  OnlyFans Automation Manager
    File: initDb.js
    Purpose: initialise DB with schema and seeds
    Created: 2025-07-06 – v1.0
*/

import 'dotenv/config'; // load .env for DATABASE_URL
import fs from 'fs';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

export default async function initDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const schema = fs.readFileSync(new URL('../src/server/db/schema.sql', import.meta.url).pathname, 'utf8');
  const seeds = fs.readFileSync(new URL('../src/server/db/seeds.sql', import.meta.url).pathname, 'utf8');
  try {
    await pool.query(schema);
    await pool.query(seeds);
    console.log('Database initialised');
  } catch (err) {
    if (err.message && err.message.includes('does not exist')) {
      console.error('Database not found. Attempting to create...');
      await pool.end();
      const url = new URL(process.env.DATABASE_URL);
      const dbName = url.pathname.slice(1);
      const adminUrl = new URL(url);
      adminUrl.pathname = '/postgres';
      const adminPool = new Pool({ connectionString: adminUrl.toString() });
      try {
        await adminPool.query(`CREATE DATABASE "${dbName}"`);
        console.log(`Database ${dbName} created. Please restart the app.`);
      } catch (createErr) {
        console.error('Automatic database creation failed. Please create the database manually.');
        console.error(createErr);
        throw createErr;
      } finally {
        await adminPool.end();
      }
      return;
    }
    throw err;
  } finally {
    await pool.end();
  }
}

const thisFile = fileURLToPath(import.meta.url);
if (path.resolve(process.argv[1] || '') === thisFile) {
  initDb()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
/*  End of File – Last modified 2025-07-11 */
