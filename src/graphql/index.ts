import { ApolloServer } from 'apollo-server-express';
import { merge } from 'lodash';
import { context } from '../utils';
import { AppSchema, AuthSchema, UserSchema } from './schemas';

const resolvers = {
  Query: {
    books: () => 'books',
  },
};

const apolloServer = new ApolloServer({ typeDefs: [
  AppSchema,
  AuthSchema,
  UserSchema
], resolvers: merge(
  {
    Query: {},
    // Mutation: {}
  }, resolvers),
context,
});

export default apolloServer;