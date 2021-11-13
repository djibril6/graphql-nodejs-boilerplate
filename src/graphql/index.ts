import { ApolloServer } from 'apollo-server-express';
import { merge } from 'lodash';
import { Token, User } from '../models';
import { TokenDataSource, UserDataSource } from '../data-sources';
import { context } from '../utils';
import { authResolver, userResolver } from './resolvers';
import { AppSchema, AuthSchema, UserSchema } from './schemas';

const apolloServer = new ApolloServer({ 
  typeDefs: [
    AppSchema,
    AuthSchema,
    UserSchema
  ], 
  resolvers: merge(
    {
      Query: {},
      Mutation: {}
    },
    authResolver,
    userResolver
  ),
  context,
  dataSources: () => ({
    user: new UserDataSource(User),
    token: new TokenDataSource(Token)
  })
});

export default apolloServer;