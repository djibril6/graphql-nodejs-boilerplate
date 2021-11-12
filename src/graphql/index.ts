import { ApolloServer, gql } from 'apollo-server-express';
import { merge } from 'lodash';
import { context } from '../utils';

const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    title: String
    author: String
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    books: String
  }
`;

const resolvers = {
  Query: {
    books: () => 'books',
  },
};

const apolloServer = new ApolloServer({ typeDefs, resolvers: merge(
  {
    Query: {},
    // Mutation: {}
  }, resolvers),
context
});

export default apolloServer;