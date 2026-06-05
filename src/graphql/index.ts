import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './schema';
import { resolvers } from './resolvers';

export const graphqlHandler = createHandler({
  schema,
  rootValue: resolvers,
});