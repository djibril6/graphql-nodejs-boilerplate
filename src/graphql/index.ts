import { ApolloServer } from 'apollo-server-express';
import { merge } from 'lodash';
import { Token, User } from '../models';
import { TokenDataSource, UserDataSource } from '../datasources';
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
    users: new UserDataSource(User),
    tokens: new TokenDataSource(Token)
  })
});

export default apolloServer;