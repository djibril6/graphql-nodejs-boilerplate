import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { ApolloError } from 'apollo-server-errors';

export class GraphQlApiError extends ApolloError {
  constructor(message: string, code?: string) {
    super(message, code || 'MY_ERROR_CODE');

    Object.defineProperty(this, 'name', { value: 'GraphQlApiError' });
  }
}

export default function (error: GraphQLError) {
  let formated: GraphQLFormattedError;
  return error;
}