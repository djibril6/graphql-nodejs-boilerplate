import { gql } from 'apollo-server-express';

export default gql`

  input IRegister {
    firstname: String!
    lastname: String!
    email: String!
    password: String!
    gender: EGender
  }

  input ILogin {
    email: String!
    password: String!
  }

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
  extend type Query {
    user(userId: ID!): TUser
    users(input: IGetUsers): [TUser]!
  }

  # Mutations
  extend type Mutation {
    register(input: IRegister!): TAuthSuccess!
    login(input: ILogin!): TAuthSuccess!
    logout(refreshToken: String!): String!
    refreshTokens(refreshToken: String!): TToken!
    forgotPassword(email: String!): String!
    resetPassword(token: String!, password: String!): String!
    verifyEmail(token: String!): String!
  }
`;
