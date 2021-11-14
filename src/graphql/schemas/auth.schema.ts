import { gql } from 'apollo-server-express';

export default gql`

  type TTokenFormat {
    token: String!
    expires: String!
  }

  type TToken {
    access: TTokenFormat!
    refresh: TTokenFormat!
  }

  type TAuthSuccess {
    user: TUser!
    tokens: TToken!
  }

  # Queries

  # Mutations
  extend type Mutation {
    register(
      firstname: String!,
      lastname: String!,
      email: String!,
      gender: EGender,
      password: String!
    ): TAuthSuccess!
    login(email: String!,password: String!): TAuthSuccess!
    logout(refreshToken: String!): String!
    refreshTokens(refreshToken: String!): TToken!
    forgotPassword(email: String!): String!
    resetPassword(token: String!, password: String!): String!
    sendVerificationEmail: String!
  }
`;
