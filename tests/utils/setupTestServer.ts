import { ApolloServer } from 'apollo-server-express';
import { merge } from 'lodash';
import { Request } from 'express';
import { TokenDataSource, UserDataSource } from '../../src/datasources';
import { authResolver, userResolver } from '../../src/graphql/resolvers';
import { AppSchema, AuthSchema, UserSchema } from '../../src/graphql/schemas';
import { User, Token } from '../../src/models';

export default function(token: string) {
  return new ApolloServer({ 
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
    context: (req: Request) => {
      req.headers = { authorization: `${token}` };
      return {req};
    },
    dataSources: () => ({
      users: new UserDataSource(User),
      tokens: new TokenDataSource(Token)
    })
  });
}