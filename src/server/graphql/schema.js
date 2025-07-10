/*  OnlyFans Automation Manager
    File: schema.js
    Purpose: basic GraphQL schema (internal API layer)
    Created: 2025-07-06 – v1.0
*/
import { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLList, GraphQLInt, GraphQLNonNull } from 'graphql';
import { query } from '../db/db.js';

const FanType = new GraphQLObjectType({
  name: 'Fan',
  fields: {
    fan_id: { type: GraphQLInt },
    display_name: { type: GraphQLString },
    username: { type: GraphQLString }
  }
});

const RootQuery = new GraphQLObjectType({
  name: 'Query',
  fields: {
    fans: {
      type: new GraphQLList(FanType),
      resolve: async () => {
        const res = await query('SELECT fan_id, display_name, username FROM fans LIMIT 50');
        return res.rows;
      }
    }
  }
});


const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    sendMessage: {
      type: GraphQLString,
      args: {
        fanId: { type: new GraphQLNonNull(GraphQLInt) },
        text: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve: async (_, { fanId, text }) => {
        const id = Date.now();
        await query(
          'INSERT INTO messages(msg_id, fan_id, direction, text, created_at) VALUES($1,$2,$3,$4,NOW())',
          [id, fanId, 'out', text]
        );
        return 'ok';
      }
    }
  }
});

export const schema = new GraphQLSchema({ query: RootQuery, mutation: Mutation });

/*  End of File – Last modified 2025-07-06 */
