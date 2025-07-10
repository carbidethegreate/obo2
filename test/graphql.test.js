/*  OnlyFans Automation Manager
    File: graphql.test.js
    Purpose: basic GraphQL mutation test
    Created: 2025-07-06 – v1.0
*/
import { graphql } from 'graphql';
import { schema } from '../src/server/graphql/schema.js';
import { query } from '../src/server/db/db.js';

export default async function testGraphql() {
  await query('DELETE FROM messages');
  const mutation = `mutation { sendMessage(fanId: 1, text: "hi") }`;
  const res = await graphql({ schema, source: mutation });
  if (res.errors || res.data.sendMessage !== 'ok') throw new Error('graphql mutation failed');
}

await testGraphql();

console.log("graphql tests passed");
/*  End of File – Last modified 2025-07-06 */
